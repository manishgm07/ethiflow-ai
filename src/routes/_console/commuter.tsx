import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock, MapPin, Navigation } from "lucide-react";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { LevelBadge } from "@/components/traffic/badges";
import { useSim } from "@/lib/sim/provider";
import { JUNCTION_IDS, JUNCTIONS } from "@/lib/sim/junctions";
import { pick } from "@/lib/i18n";
import { formatSimTime, simMinute } from "@/lib/sim/engine";

export const Route = createFileRoute("/_console/commuter")({
  component: CommuterPage,
});

function CommuterPage() {
  const { t, i18n } = useTranslation();
  const state = useSim(s => s);
  
  const leaveTime = formatSimTime(simMinute(state.tick + 15));

  return (
    <RoleGate navKey="commuter">
      <PageHeader navKey="commuter" title={t("modules.commuter.title")} desc={t("modules.commuter.desc")} />
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center animate-rise">
          <Clock className="size-8 mx-auto text-primary mb-3" />
          <h2 className="text-lg font-medium text-muted-foreground">Best Time to Leave</h2>
          <p className="text-4xl font-display font-extrabold text-primary mt-2 font-tabular">{leaveTime}</p>
          <p className="text-sm mt-3 text-muted-foreground">Traffic is expected to ease along the Outer Ring Road corridor.</p>
        </div>

        <h3 className="font-semibold text-lg flex items-center gap-2 mt-8 mb-4">
          <Navigation className="size-5 text-muted-foreground" /> Route Outlook
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
            )
          })}
        </div>
      </div>
    </RoleGate>
  );
}