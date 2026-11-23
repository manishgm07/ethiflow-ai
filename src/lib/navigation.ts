/**
 * Role-based navigation rules. Pure data + functions so they can be unit tested.
 * UI gating only — data access is enforced separately by database row-level security.
 */
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type EffectiveRole = AppRole | "guest";

export type NavKey =
  | "dashboard"
  | "predictions"
  | "signals"
  | "accidents"
  | "routes"
  | "commuter"
  | "impact"
  | "audit"
  | "scenarios"
  | "responsibleAi"
  | "settings";

export const NAV_PATHS = {
  dashboard: "/dashboard",
  predictions: "/predictions",
  signals: "/signals",
  accidents: "/accidents",
  routes: "/routes",
  commuter: "/commuter",
  impact: "/impact",
  audit: "/audit",
  scenarios: "/scenarios",
  responsibleAi: "/responsible-ai",
  settings: "/settings",
} as const satisfies Record<NavKey, string>;

export type NavPath = (typeof NAV_PATHS)[NavKey];

/** Highest privilege first. */
const ROLE_PRIORITY: AppRole[] = ["supervisor", "operator", "emergency_driver", "commuter"];

/** Picks the role that drives navigation when a user holds several. */
export function effectiveRole(roles: AppRole[], isGuest: boolean): EffectiveRole | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  if (isGuest) return "guest";
  return null;
}

interface RoleNav {
  /** First 4 become mobile bottom tabs (5th tab is "More"). */
  primary: [NavKey, NavKey, NavKey, NavKey];
  secondary: NavKey[];
}

const CONTROL_ROOM: RoleNav = {
  primary: ["dashboard", "signals", "predictions", "accidents"],
  secondary: ["routes", "audit", "scenarios", "impact", "responsibleAi", "settings"],
};

const COMMUTER: RoleNav = {
  primary: ["commuter", "routes", "predictions", "impact"],
  secondary: ["scenarios", "responsibleAi", "settings"],
};

export const ROLE_NAV: Record<EffectiveRole, RoleNav> = {
  supervisor: CONTROL_ROOM,
  operator: CONTROL_ROOM,
  emergency_driver: {
    primary: ["routes", "signals", "accidents", "commuter"],
    secondary: ["predictions", "impact", "responsibleAi", "settings"],
  },
  commuter: COMMUTER,
  guest: COMMUTER,
};

export function navFor(role: EffectiveRole): NavKey[] {
  const n = ROLE_NAV[role];
  return [...n.primary, ...n.secondary];
}

export function homeFor(role: EffectiveRole): NavPath {
  return NAV_PATHS[ROLE_NAV[role].primary[0]];
}

/** Roles allowed to open each module. */
export function rolesAllowed(key: NavKey): EffectiveRole[] {
  return (Object.keys(ROLE_NAV) as EffectiveRole[]).filter((r) => navFor(r).includes(key));
}

export function canAccess(key: NavKey, role: EffectiveRole): boolean {
  return navFor(role).includes(key);
}

/** Roles a person may request at signup. Only "commuter" is granted automatically. */
export const REQUESTABLE_ROLES: AppRole[] = ["commuter", "emergency_driver", "operator", "supervisor"];
export const AUTO_GRANTED_ROLE: AppRole = "commuter";

/** Which module a pathname belongs to (e.g. "/signals/hebbal" → "signals"). */
export function keyForPath(pathname: string): NavKey | null {
  for (const [key, path] of Object.entries(NAV_PATHS) as [NavKey, string][]) {
    if (pathname === path || pathname.startsWith(`${path}/`)) return key;
  }
  return null;
}

export const DEMO_ROLES: AppRole[] = ["operator", "supervisor", "emergency_driver", "commuter"];

/** Who may trigger simulation demo controls on a signal. */
export const SIGNAL_PERMISSIONS = {
  simulateLowConfidence: ["operator", "supervisor"],
  simulateAmbulance: ["operator", "supervisor", "emergency_driver"],
  override: ["operator", "supervisor"],
} as const satisfies Record<string, readonly EffectiveRole[]>;

export function can(action: keyof typeof SIGNAL_PERMISSIONS, role: EffectiveRole | null): boolean {
  return !!role && (SIGNAL_PERMISSIONS[action] as readonly EffectiveRole[]).includes(role);
}
