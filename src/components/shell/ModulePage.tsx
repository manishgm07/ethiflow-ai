import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CircleDashed, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { NAV_ICONS } from "@/components/shell/nav-icons";
import { useAuth } from "@/lib/auth";
import { canAccess, homeFor, rolesAllowed, type NavKey } from "@/lib/navigation";

export function PageHeader({ navKey, title, desc }: { navKey: NavKey; title: string; desc: string }) {
  const Icon = NAV_ICONS[navKey];
  return (
    <header className="mb-6 flex items-start gap-4 animate-rise">
      <span className="mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-navy text-amber">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">{desc}</p>
      </div>
    </header>
  );
}

/** Wraps a module page with the role check for its nav entry. */
export function RoleGate({ navKey, children }: { navKey: NavKey; children: ReactNode }) {
  const { t } = useTranslation();
  const { role } = useAuth();
  if (!role) return null;
  if (canAccess(navKey, role)) return <>{children}</>;

  const allowed = rolesAllowed(navKey)
    .map((r) => t(`roles.${r}`))
    .join(", ");
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card p-8 text-center shadow-panel">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-status-severe/10 text-status-severe">
        <Lock className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-bold">{t("shell.restrictedTitle")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("shell.restrictedBody", { role: t(`roles.${role}`), allowed })}
      </p>
      <Link
        to={homeFor(role)}
        className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        {t("shell.backHome")}
      </Link>
    </div>
  );
}

type ModuleKey = Exclude<NavKey, "settings">;

/** Placeholder for modules that are built in later phases. */
export function ModulePlaceholder({ navKey, phase }: { navKey: ModuleKey; phase: number }) {
  const { t } = useTranslation();
  const items = t(`modules.${navKey}.items`, { returnObjects: true }) as string[];
  return (
    <RoleGate navKey={navKey}>
      <PageHeader navKey={navKey} title={t(`modules.${navKey}.title`)} desc={t(`modules.${navKey}.desc`)} />
      <section className="max-w-3xl rounded-xl border bg-card shadow-panel animate-rise">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <h2 className="text-base font-semibold">{t("shell.plannedTitle")}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wide text-primary">
            <CircleDashed className="size-3.5" aria-hidden="true" />
            {t("shell.phaseBadge", { phase })}
          </span>
        </div>
        <ul className="divide-y">
          {items.map((item, i) => (
            <li key={item} className="flex items-center gap-4 px-5 py-4">
              <span className="font-mono text-xs text-muted-foreground font-tabular">{String(i + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </RoleGate>
  );
}
