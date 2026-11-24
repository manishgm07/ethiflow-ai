import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Activity, Car, Leaf, Clock, MapPin } from "lucide-react";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { EthiFlowHospitalRouting } from "@/components/traffic/EthiFlowHospitalRouting";
import { BengaluruRoutePlanner } from "@/components/traffic/BengaluruRoutePlanner";
import { useSim } from "@/lib/sim/provider";
import { useAuth } from "@/lib/auth";
import { JUNCTIONS } from "@/lib/sim/junctions";
import { pick } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/routes")({
  component: RoutesPage,
});

function RoutesPage() {
  const { t, i18n } = useTranslation();
  const junctions = useSim((s) => s.junctions);
  const { role } = useAuth();
  const isEmergencyDriver = role === "emergency_driver";

  const getLevelColor = (level: string) => {
    if (level === "severe") return "text-status-severe border-status-severe bg-status-severe/10";
    if (level === "moderate") return "text-status-moderate border-status-moderate bg-status-moderate/10";
    return "text-status-low border-status-low bg-status-low/10";
  };

  return (
    <RoleGate navKey="routes">
      <PageHeader navKey="routes" title={t("modules.routes.title")} desc={t("modules.routes.desc")} />

      <div className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border bg-card shadow-panel p-6 min-h-[400px] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-grid opacity-50 rounded-xl pointer-events-none" />

            <div className="relative w-full max-w-2xl h-96">
             {/* Map Network Lines */}
             <svg className="absolute inset-0 w-full h-full text-muted stroke-current" strokeWidth="4">
               <line x1="20%" y1="20%" x2="80%" y2="20%" />
               <line x1="80%" y1="20%" x2="80%" y2="80%" />
               <line x1="80%" y1="80%" x2="20%" y2="80%" />
             </svg>

             {/* Junction Nodes */}
             <div className="absolute top-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2">
               <div className={cn("p-3 rounded-full border-2 shadow-lg backdrop-blur", getLevelColor(junctions["hebbal"].level))}>
                 <MapPin className="size-6" />
                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-foreground">{pick(JUNCTIONS["hebbal"].name, i18n.language)}</span>
               </div>
             </div>

             <div className="absolute top-[20%] left-[80%] -translate-x-1/2 -translate-y-1/2">
               <div className={cn("p-3 rounded-full border-2 shadow-lg backdrop-blur", getLevelColor(junctions["kr-puram"].level))}>
                 <MapPin className="size-6" />
                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-foreground">{pick(JUNCTIONS["kr-puram"].name, i18n.language)}</span>
               </div>
             </div>

             <div className="absolute top-[80%] left-[80%] -translate-x-1/2 -translate-y-1/2">
               <div className={cn("p-3 rounded-full border-2 shadow-lg backdrop-blur", getLevelColor(junctions["mg-road"].level))}>
                 <MapPin className="size-6" />
                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-foreground">{pick(JUNCTIONS["mg-road"].name, i18n.language)}</span>
               </div>
             </div>

             <div className="absolute top-[80%] left-[20%] -translate-x-1/2 -translate-y-1/2">
               <div className={cn("p-3 rounded-full border-2 shadow-lg backdrop-blur", getLevelColor(junctions["silk-board"].level))}>
                 <MapPin className="size-6" />
                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-foreground">{pick(JUNCTIONS["silk-board"].name, i18n.language)}</span>
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-panel p-5">
            <h3 className="flex items-center gap-2 font-semibold mb-4"><Car className="size-4" /> Standard Route</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b pb-2"><span className="text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5"/> ETA</span><span className="font-mono font-medium">42 mins</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5"/> Stops</span><span className="font-mono font-medium">8 stops</span></div>
            </div>
          </div>

          <div className="rounded-xl border border-status-low bg-status-low/5 shadow-panel p-5">
            <h3 className="flex items-center gap-2 font-semibold text-status-low mb-4"><Leaf className="size-4" /> AI Eco Route</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-status-low/20 pb-2"><span className="text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5"/> ETA</span><span className="font-mono font-bold text-status-low">34 mins</span></div>
              <div className="flex justify-between items-center text-sm border-b border-status-low/20 pb-2"><span className="text-muted-foreground flex items-center gap-1.5"><Leaf className="size-3.5"/> CO2 Saved</span><span className="font-mono font-medium">1.2 kg</span></div>
              <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5"/> Stops</span><span className="font-mono font-medium">3 stops</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bengaluru Route Planner — visible to commuters & all roles */}
      <section className="rounded-xl border bg-card shadow-panel p-6">
        <h2 className="text-lg font-bold mb-4">{t("routePlanner.title")}</h2>
        <BengaluruRoutePlanner />
      </section>

      {/* Emergency Routing — ONLY visible to Emergency Driver */}
      {isEmergencyDriver && <EthiFlowHospitalRouting />}
    </div>
    </RoleGate>
  );
}
