import { Ambulance, BellRing, CircleCheck, Hand, OctagonAlert, ShieldAlert, TrendingUp, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ExplainButton, subjectForAlert } from "@/components/explain/ExplainProvider";
import { pick } from "@/lib/i18n";
import { JUNCTIONS } from "@/lib/sim/junctions";
import { useSim } from "@/lib/sim/provider";
import type { AlertKind } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

const STYLE: Record<AlertKind, { icon: LucideIcon; cls: string }> = {
  corridor: { icon: Ambulance, cls: "border-status-ambulance bg-status-ambulance/10" },
  fallback: { icon: ShieldAlert, cls: "border-status-severe bg-status-severe/10" },
  severe: { icon: OctagonAlert, cls: "border-status-severe/60 bg-card" },
  override: { icon: Hand, cls: "border-amber bg-accent" },
  forecast: { icon: TrendingUp, cls: "border-status-moderate bg-card" },
};

const ICON_CLS: Record<AlertKind, string> = {
  corridor: "text-status-ambulance",
  fallback: "text-status-severe",
  severe: "text-status-severe",
  override: "text-accent-foreground",
  forecast: "text-status-moderate",
};

export function AlertsBanner({ max = 4 }: { max?: number }) {
  const { t, i18n } = useTranslation();
  const alerts = useSim((s) => s.alerts);
  const shown = alerts.slice(0, max);

  return (
    <section aria-labelledby="alerts-title" className="rounded-xl border bg-card shadow-panel">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 id="alerts-title" className="flex items-center gap-2 text-base font-semibold">
          <BellRing className="size-4 text-primary" aria-hidden="true" />
          {t("dashboard.alertsTitle")}
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-tabular">{alerts.length}</span>
        </h2>
        {alerts.length > max && (
          <span className="text-xs text-muted-foreground">{t("dashboard.moreAlerts", { n: alerts.length - max })}</span>
        )}
      </header>
      {shown.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-4 text-sm">
          <CircleCheck className="size-4 text-status-low" aria-hidden="true" />
          {t("dashboard.allClear")}
        </p>
      ) : (
        <ul className="divide-y" aria-live="polite">
          {shown.map((a) => {
            const s = STYLE[a.kind];
            const Icon = s.icon;
            const name = pick(JUNCTIONS[a.junctionId].name, i18n.language);
            return (
              <li key={a.id} className={cn("flex items-center gap-3 border-l-4 px-4 py-3", s.cls)}>
                <Icon className={cn("size-5 shrink-0", ICON_CLS[a.kind])} aria-hidden="true" />
                <p className="min-w-0 flex-1 text-sm font-medium">
                  {t(`alerts.${a.kind}`, { name, score: a.score, conf: a.confidence })}
                </p>
                <ExplainButton subject={subjectForAlert(a)} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
