import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Megaphone, ShieldAlert, Ambulance, Lock, Settings2, Users, Clock, Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { RoleGate } from "@/components/shell/ModulePage";
import { JunctionCard } from "@/components/traffic/JunctionCard";
import { JunctionGraphic } from "@/components/brand/JunctionGraphic";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExplainButton } from "@/components/explain/ExplainProvider";
import { pick } from "@/lib/i18n";
import { formatSimTime, simMinute } from "@/lib/sim/engine";
import { isJunctionId, JUNCTIONS } from "@/lib/sim/junctions";
import { useSim, useSimStore, useAuditEntries } from "@/lib/sim/provider";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/signals/$junctionId")({
  beforeLoad: ({ params }) => {
    if (!isJunctionId(params.junctionId)) throw notFound();
  },
  component: JunctionSignalPage,
});

function JunctionSignalPage() {
  const { t, i18n } = useTranslation();
  const { junctionId } = Route.useParams();
  if (!isJunctionId(junctionId)) return null;
  
  const store = useSimStore();
  const j = useSim((s) => s.junctions[junctionId]);
  const def = JUNCTIONS[junctionId];
  const { profile, realRole } = useAuth();
  const auditEntries = useAuditEntries().filter(e => e.junctionId === junctionId);
  
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [safeZoneActive, setSafeZoneActive] = useState(false);
  const [fixedTimerMode, setFixedTimerMode] = useState(false);

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

  const handleAudioAssist = () => {
    const text = i18n.language === 'kn' ? "ಪಾದಚಾರಿಗಳು ಈಗ ದಾಟಬಹುದು" : "Pedestrians may cross now";
    const u = new SpeechSynthesisUtterance(text);
    u.lang = i18n.language === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(u);
    toast.success("Audio assist playing");
  };

  const handleSeniorExtension = () => {
    store.setOverride(junctionId, {
      mode: "hold",
      greens: null,
      approach: j.signal.phase,
      reason: "Senior/Handicap 25s Extension",
      durationMin: 1, 
      actor: profile?.display_name || "Operator",
      role: realRole || "operator"
    });
    toast.success("Added 25s Senior Crossing Extension");
  };

  const handleApplyOverride = () => {
    store.setOverride(junctionId, {
      mode: "split",
      greens: { N: 60, E: 60, S: 60, W: 60 }, // Example custom split
      approach: null,
      reason: overrideReason,
      durationMin: 5,
      actor: profile?.display_name || "Operator",
      role: realRole || "operator"
    });
    setOverrideOpen(false);
    toast.success("Operator Override Applied");
  };

  return (
    <RoleGate navKey="signals">
      <Link to="/signals" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft className="size-4" /> {t("common.back")}
      </Link>
      
      <div className="flex flex-col xl:flex-row gap-6 mb-8">
        <div className="xl:w-1/3 space-y-6 flex flex-col">
          <JunctionCard id={junctionId} />
          
          <div className="rounded-xl border bg-card p-5 shadow-panel">
            <h3 className="font-semibold mb-4 text-base">{t("signals.controls")}</h3>
            <div className="space-y-3">
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
              <Button onClick={handleAudioAssist} variant="outline" className="w-full justify-start">
                <Megaphone className="mr-2 text-primary" /> 🔊 Audio Crossing Assist
              </Button>
              <Button onClick={handleSeniorExtension} variant="outline" className="w-full justify-start">
                <Lock className="mr-2 text-primary" /> ♿ 25s Senior/Handicap Extension
              </Button>
              <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-amber text-amber-foreground hover:bg-amber/10 hover:text-amber-foreground">
                    <Settings2 className="mr-2" /> {t("signals.override")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("override.title")}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">{t("override.desc")}</p>
                    <div className="space-y-2">
                      <Label>{t("override.reason")}</Label>
                      <Input value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder={t("override.reasonPh")} />
                    </div>
                    <Button onClick={handleApplyOverride} disabled={overrideReason.length < 5} className="w-full">
                      {t("override.submit")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <hr className="my-2 border-border" />
              <Button onClick={() => store.simulateLowConfidence(junctionId, "Demo", "operator")} variant="secondary" className="w-full justify-start text-status-severe">
                <ShieldAlert className="mr-2" /> {t("signals.simulateLow")}
              </Button>
              <Button onClick={() => store.simulateAmbulance(junctionId, "N", "Demo", "emergency_driver")} variant="secondary" className="w-full justify-start text-status-ambulance">
                <Ambulance className="mr-2" /> {t("signals.simulateAmb")}
              </Button>
            </div>
          </div>
        </div>

        <div className="xl:w-2/3">
          <div className="rounded-xl border bg-card p-6 shadow-panel flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
            <div className="w-full max-w-lg mb-3 flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={safeZoneActive ? "default" : "outline"}
                  onClick={toggleSafeZone}
                  className={cn(
                    "h-8 text-xs font-semibold gap-1.5",
                    safeZoneActive && "bg-pink-600 hover:bg-pink-700 text-white"
                  )}
                >
                  <Users className="size-3.5" />
                  {safeZoneActive ? t("signals.safeZoneActive") : t("signals.safeZone")}
                </Button>
                <Button
                  size="sm"
                  variant={fixedTimerMode ? "secondary" : "outline"}
                  onClick={toggleFixedTimerMode}
                  className={cn(
                    "h-8 text-xs font-semibold gap-1.5",
                    fixedTimerMode
                      ? "border-amber text-amber-foreground bg-amber/15"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {fixedTimerMode ? <Clock className="size-3.5" /> : <Cpu className="size-3.5" />}
                  {fixedTimerMode ? t("signals.fixedTimerMode") : t("signals.aiAdaptiveMode")}
                </Button>
              </div>
            </div>

            <div className="w-full max-w-lg relative z-10">
              {j.corridor && (
                <div className="absolute top-0 left-0 right-0 flex justify-center animate-rise">
                  <span className="bg-status-ambulance text-status-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    {t("signals.corridorBanner", { dir: t(`dir.${j.corridor.approach}`) })}
                  </span>
                </div>
              )}
              {j.override && (
                <div className="absolute top-0 left-0 right-0 flex justify-center animate-rise">
                  <span className="bg-amber text-amber-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    {t("signals.overrideBanner", { until: formatSimTime(simMinute(j.override.untilTick)) })}
                  </span>
                </div>
              )}
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
        </div>
      </div>

      <section className="rounded-xl border bg-card shadow-panel overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">{t("signals.logTitle")}</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditEntries.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("signals.logEmpty")}</TableCell></TableRow>
            ) : (
              [...auditEntries].reverse().slice(0, 5).map(e => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap">{e.simTime}</TableCell>
                  <TableCell><span className="text-xs uppercase bg-muted px-2 py-1 rounded">{e.action.replace(/_/g, " ")}</span></TableCell>
                  <TableCell>{pick(e.summary, i18n.language)}</TableCell>
                  <TableCell className="text-right">
                    {e.explanation && <ExplainButton subject={{ kind: "snapshot", explanation: e.explanation, label: `Seq ${e.seq}` }} />}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </RoleGate>
  );
}
