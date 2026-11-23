import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { effectiveRole, type AppRole, type EffectiveRole } from "@/lib/navigation";

export const GUEST_KEY = "ethiflow.guest";
export const DEMO_ROLE_KEY = "ethiflow.demoRole";
const DEMO_ROLES: AppRole[] = ["operator", "supervisor", "emergency_driver", "commuter"];

export interface Profile {
  display_name: string | null;
  requested_role: AppRole;
}

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  profile: Profile | null;
  isGuest: boolean;
  role: EffectiveRole | null;
  /** Role from the account (or guest) before any demo switch. */
  realRole: EffectiveRole | null;
  /** UI-only demo role. Changes menus and page access in this browser; never database privileges. */
  demoRole: AppRole | null;
  setDemoRole: (r: AppRole | null) => void;
  enterGuest: () => void;
  exitGuest: () => void;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<AppRole[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) {
    console.error("Failed to load roles", error);
    return [];
  }
  return (data ?? []).map((r) => r.role);
}

export function isGuestStored(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(GUEST_KEY) === "1";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [demoRole, setDemoRoleState] = useState<AppRole | null>(null);

  const setDemoRole = useCallback((r: AppRole | null) => {
    if (r) window.localStorage.setItem(DEMO_ROLE_KEY, r);
    else window.localStorage.removeItem(DEMO_ROLE_KEY);
    setDemoRoleState(r);
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    const [r, p] = await Promise.all([
      fetchRoles(userId),
      supabase.from("profiles").select("display_name, requested_role").eq("id", userId).maybeSingle(),
    ]);
    setRoles(r);
    setProfile(p.data ?? null);
    return r;
  }, []);

  useEffect(() => {
    setIsGuest(isGuestStored());
    const storedDemo = window.localStorage.getItem(DEMO_ROLE_KEY) as AppRole | null;
    if (storedDemo && DEMO_ROLES.includes(storedDemo)) setDemoRoleState(storedDemo);

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") {
        setRoles([]);
        setProfile(null);
      }
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && next?.user) {
        window.localStorage.removeItem(GUEST_KEY);
        setIsGuest(false);
        setLoading(true);
        // Defer Supabase calls out of the auth callback to avoid deadlocks.
        setTimeout(() => {
          void loadUserData(next.user.id).finally(() => setLoading(false));
        }, 0);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadUserData(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadUserData]);

  const enterGuest = useCallback(() => {
    window.localStorage.setItem(GUEST_KEY, "1");
    setIsGuest(true);
  }, []);

  const exitGuest = useCallback(() => {
    window.localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    setDemoRole(null);
  }, [setDemoRole]);

  const signOut = useCallback(async () => {
    window.localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    setDemoRole(null);
    await supabase.auth.signOut();
  }, [setDemoRole]);

  const refreshRoles = useCallback(async () => {
    if (!session?.user) return [];
    return loadUserData(session.user.id);
  }, [session, loadUserData]);

  const value = useMemo<AuthContextValue>(() => {
    const realRole = effectiveRole(session ? roles : [], !session && isGuest);
    return {
      loading,
      session,
      user: session?.user ?? null,
      roles,
      profile,
      isGuest: !session && isGuest,
      realRole,
      role: realRole ? (demoRole ?? realRole) : null,
      demoRole,
      setDemoRole,
      enterGuest,
      exitGuest,
      signOut,
      refreshRoles,
    };
  }, [loading, session, roles, profile, isGuest, demoRole, setDemoRole, enterGuest, exitGuest, signOut, refreshRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
