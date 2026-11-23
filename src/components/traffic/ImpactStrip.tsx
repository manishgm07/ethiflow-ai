import { Ambulance, Clock, Footprints, Fuel, Leaf, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSim } from "@/lib/sim/provider";

export function ImpactStrip() {
  const { t } = useTranslation();
  const impact = useSim((s) => s.impact);
  const waitPct = impact.waitFixed > 0 ? ((impact.waitFixed - impact.waitAi) / impact.waitFixed) * 100 : 0;
  const pedAi = impact.pedChecks ? (impact.pedOkAi / impact.pedChecks) * 100 : 100;
  const pedBase = impact.pedChecks ? (impact.pedOkBaseline / impact.pedChecks) * 100 : 0;

  const items: { icon: LucideIcon; label: string; value: string; unit: string; sub?: string }[] = [
    { icon: Fuel, label: t("impact.fuel"), value: impact.fuelL.toFixed(1), unit: "L" },
    { icon: Leaf, label: t("impact.co2"), value: impact.co2Kg.toFixed(1), unit: "kg" },
    { icon: Ambulance, label: t("impact.ambulance"), value: impact.ambulanceMin.toFixed(1), unit: "min" },
    { icon: Clock, label: t("impact.wait"), value: waitPct.toFixed(1), unit: "%" },
    {
      icon: Footprints,
      label: t("impact.ped"),
      value: pedAi.toFixed(0),
      unit: "%",
      sub: t("impact.pedSub", { n: pedBase.toFixed(0) }),
    },
  ];

  return (
    <section aria-labelledby="impact-title" className="rounded-xl border bg-navy p-4 text-navy-foreground">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="impact-title" className="text-base font-semibold">
          {t("dashboard.impactTitle")}
        </h2>
        <p className="font-mono text-[0.7rem] uppercase tracking-wide text-amber">{t("dashboard.impactSub")}</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ icon: Icon, label, value, unit, sub }) => (
          <div key={label} className="rounded-lg border border-navy-border p-3">
            <dt className="flex items-center gap-1.5 text-xs text-navy-muted">
              <Icon className="size-3.5 text-amber" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 font-display text-2xl font-bold font-tabular">
              {value}
              <span className="ml-1 text-sm font-medium text-navy-muted">{unit}</span>
            </dd>
            {sub && <dd className="text-[0.7rem] text-navy-muted">{sub}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}
