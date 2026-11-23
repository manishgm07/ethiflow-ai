-- Roles enum
create type public.app_role as enum ('operator', 'supervisor', 'commuter', 'emergency_driver');

-- Shared updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  requested_role public.app_role not null default 'commuter',
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

-- User roles (privileges live only here)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Profiles policies
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Supervisors can view all profiles"
on public.profiles for select to authenticated
using (public.has_role(auth.uid(), 'supervisor'));

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- User roles policies
create policy "Users can view own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create policy "Supervisors can view all roles"
on public.user_roles for select to authenticated
using (public.has_role(auth.uid(), 'supervisor'));

create policy "Supervisors can grant roles"
on public.user_roles for insert to authenticated
with check (public.has_role(auth.uid(), 'supervisor'));

create policy "Supervisors can revoke roles"
on public.user_roles for delete to authenticated
using (public.has_role(auth.uid(), 'supervisor'));

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- New signups: create profile, grant baseline commuter role only.
-- The requested role is recorded on the profile but never granted from metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _requested text := new.raw_user_meta_data ->> 'requested_role';
  _lang text := coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en');
begin
  insert into public.profiles (id, display_name, requested_role, preferred_language)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''),
    case
      when _requested in ('operator', 'supervisor', 'commuter', 'emergency_driver')
        then _requested::public.app_role
      else 'commuter'::public.app_role
    end,
    case when _lang in ('en', 'kn') then _lang else 'en' end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'commuter')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;