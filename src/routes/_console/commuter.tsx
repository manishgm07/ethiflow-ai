import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock, MapPin, Navigation, Route as RouteIcon } from "lucide-react";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { LevelBadge } from "@/components/traffic/badges";
import { BestTimeToLeave } from "@/components/traffic/BestTimeToLeave";
import { BengaluruRoutePlanner } from "@/components/traffic/BengaluruRoutePlanner";
import { useSim } from "@/lib/sim/provider";
import { JUNCTION_IDS, JUNCTIONS } from "@/lib/sim/junctions";
import { pick } from "@/lib/i18n";

export const Route = createFileRoute("/_console/commuter")({
  component: CommuterPage,
});

function CommuterPage() {
  const { t, i18n } = useTranslation();
  const state = useSim((s) => s);

  return (
    <RoleGate navKey="commuter">
      <PageHeader navKey="commuter" title={t("modules.commuter.title")} desc={t("modules.commuter.desc")} />

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Best Time to Leave — destination-aware */}
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 animate-rise">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-5 text-primary" />
            <h2 className="text-lg font-bold">{t("bestTime.title")}</h2>
          </div>
          <BestTimeToLeave />
        </section>

        {/* Route Planner */}
        <section className="rounded-xl border bg-card shadow-panel p-6 animate-rise">
          <div className="flex items-center gap-2 mb-4">
            <RouteIcon className="size-5 text-primary" />
            <h2 className="text-lg font-bold">{t("routePlanner.title")}</h2>
          </div>
          <BengaluruRoutePlanner />
        </section>

        {/* Route Outlook */}
        <section className="animate-rise">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Navigation className="size-5 text-muted-foreground" /> {t("commuter.routeOutlook")}
          </h3>

          <div className="space-y-3">
            {JUNCTION_IDS.map((id) => {
              const j = state.junctions[id];
              const def = JUNCTIONS[id];
              return (
                <div key={id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <MapPin className="text-muted-foreground size-5" />
                    <span className="font-medium">{pick(def.name, i18n.language)}</span>
                  </div>
                  <LevelBadge level={j.level} score={j.score} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </RoleGate>
  );
}
