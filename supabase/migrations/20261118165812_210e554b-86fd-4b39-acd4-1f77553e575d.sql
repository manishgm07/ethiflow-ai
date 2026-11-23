revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

drop policy "Users can view own profile" on public.profiles;
drop policy "Supervisors can view all profiles" on public.profiles;
create policy "View own profile or supervisors view all"
on public.profiles for select to authenticated
using (auth.uid() = id or public.has_role(auth.uid(), 'supervisor'));

drop policy "Users can view own roles" on public.user_roles;
drop policy "Supervisors can view all roles" on public.user_roles;
create policy "View own roles or supervisors view all"
on public.user_roles for select to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'supervisor'));