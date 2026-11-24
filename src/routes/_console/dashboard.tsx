import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Clock, Cpu, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { AlertsBanner } from "@/components/traffic/AlertsBanner";
import { ImpactStrip } from "@/components/traffic/ImpactStrip";
import { JunctionCard } from "@/components/traffic/JunctionCard";
import { JunctionGraphic } from "@/components/brand/JunctionGraphic";
import { SupervisorPanel, OperatorPanel } from "@/components/traffic/SupervisorOperatorPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { pick } from "@/lib/i18n";
import { JUNCTION_IDS, JUNCTIONS, type JunctionId } from "@/lib/sim/junctions";
import { useSim } from "@/lib/sim/provider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/dashboard")({
  head: () => ({
    meta: [
      { title: "Operator Control Room — EthiFlow AI" },
      { name: "description", content: "Live overview of the four simulated Bengaluru junctions." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const [selectedJunction, setSelectedJunction] = useState<JunctionId>("silk-board");
  const [safeZoneActive, setSafeZoneActive] = useState(false);
  const [fixedTimerMode, setFixedTimerMode] = useState(false);

  const j = useSim((s) => s.junctions[selectedJunction]);
  const def = JUNCTIONS[selectedJunction];

  const activePhase = (j.signal.phase === "N" || j.signal.phase === "S") ? "NS" : "EW";
  const emergencyDirection = j.corridor?.approach ?? null;
  const seniorExtensionActive = Boolean(j.override && j.override.reason?.toLowerCase().includes("senior"));
  const counts = { N: j.obs.N.cars, S: j.obs.S.cars, E: j.obs.E.cars, W: j.obs.W.cars };
  const countdownSec = j.signal.remaining;
  const isFallback = j.fallback.active;

  const toggleSafeZone = () => {
    setSafeZoneActive((prev) => {
      const next = !prev;
      if (next) {
        toast.success(t("signals.safeZoneActivatedToast"));
      } else {
        toast.info(t("signals.safeZoneDeactivatedToast"));
      }
      return next;
    });
  };

  const toggleFixedTimerMode = () => {
    setFixedTimerMode((prev) => {
      const next = !prev;
      if (next) {
        toast.info(t("signals.fixedTimerToast"));
      } else {
        toast.success(t("signals.aiAdaptiveToast"));
      }
      return next;
    });
  };

  return (
    <RoleGate navKey="dashboard">
      <PageHeader navKey="dashboard" title={t("modules.dashboard.title")} desc={t("modules.dashboard.desc")} />
      
      <div className="mb-6">
        <ImpactStrip />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          {/* Live Intersection Simulator Card */}
          <div className="rounded-xl border bg-card p-5 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 mb-4">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  {t("signals.liveSimulator")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pick(def.name, i18n.language)} · {t("dashboard.phase")}: {t(`dir.${j.signal.phase}`)} ({j.signal.remaining}s)
                </p>
              </div>

              {/* Junction Selector */}
              <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label={t("signals.selectJunction")}>
                {JUNCTION_IDS.map((id) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={selectedJunction === id}
                    onClick={() => setSelectedJunction(id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                      selectedJunction === id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {pick(JUNCTIONS[id].name, i18n.language)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 flex justify-center">
                <div className="w-full max-w-sm">
                  <JunctionGraphic
                    activePhase={activePhase}
                    emergencyDirection={emergencyDirection}
                    seniorExtensionActive={seniorExtensionActive}
                    counts={counts}
                    countdownSec={countdownSec}
                    isFallback={isFallback}
                    safeZoneActive={safeZoneActive}
                    fixedTimerMode={fixedTimerMode}
                  />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("signals.controls")}
                  </p>
                  
                  {/* Child & Women Safe-Zone toggle button */}
                  <Button
                    onClick={toggleSafeZone}
                    variant={safeZoneActive ? "default" : "outline"}
                    className={cn(
                      "w-full justify-start transition-all",
                      safeZoneActive
                        ? "bg-pink-600 hover:bg-pink-700 text-white shadow-md ring-2 ring-pink-400"
                        : "hover:border-pink-500 hover:text-pink-600 dark:hover:text-pink-400"
                    )}
                  >
                    <Users className="mr-2 size-4 text-pink-500" />
                    {safeZoneActive ? t("signals.safeZoneActive") : t("signals.safeZone")}
                  </Button>

                  {/* Fixed 22s vs. AI Adaptive mode toggle */}
                  <Button
                    onClick={toggleFixedTimerMode}
                    variant={fixedTimerMode ? "secondary" : "outline"}
                    className={cn(
                      "w-full justify-start transition-all",
                      fixedTimerMode
                        ? "border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {fixedTimerMode ? (
                      <>
                        <Clock className="mr-2 size-4 text-amber-500" />
                        {t("signals.fixedTimerMode")}
                      </>
                    ) : (
                      <>
                        <Cpu className="mr-2 size-4 text-emerald-500" />
                        {t("signals.aiAdaptiveMode")}
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("dashboard.phase")}:</span>
                    <span className="font-semibold">{t(`dir.${j.signal.phase}`)} ({j.signal.remaining}s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("common.confidence")}:</span>
                    <span className="font-semibold font-tabular">{j.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("chips.aiMode")}:</span>
                    <span className="font-semibold">
                      {isFallback ? t("chips.fallback") : fixedTimerMode ? t("signals.fixedTimerMode") : t("chips.adaptive")}
                    </span>
                  </div>
                </div>

                <Link
                  to="/signals/$junctionId"
                  params={{ junctionId: selectedJunction }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  {t("common.openSignals")} ({pick(def.name, i18n.language)}) <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {JUNCTION_IDS.map((id) => (
              <JunctionCard key={id} id={id} />
            ))}
          </div>
        </div>
        <div className="xl:col-span-1">
          <AlertsBanner max={6} />
        </div>
      </div>

      {/* Role-specific panel: Supervisor sees command center, Operator sees field controls */}
      {role === "supervisor" && (
        <section className="mt-8">
          <SupervisorPanel />
        </section>
      )}
      {role === "operator" && (
        <section className="mt-8">
          <OperatorPanel />
        </section>
      )}
    </RoleGate>
  );
}
