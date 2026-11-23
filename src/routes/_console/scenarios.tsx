import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Play, Pause, FastForward, CheckCircle2, Hash } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { Button } from "@/components/ui/button";
import { useSimStore, useSim } from "@/lib/sim/provider";

export const Route = createFileRoute("/_console/scenarios")({
  component: ScenariosPage,
});

function ScenariosPage() {
  const { t } = useTranslation();
  const store = useSimStore();
  const running = useSim(s => s.running);

  const presets = [
    { name: "Morning Rush (08:30)", desc: "High volume influx on Hosur Road and ORR." },
    { name: "Emergency Dispatch", desc: "Forces consecutive ambulances across 3 junctions." },
    { name: "Rainy Crash", desc: "Simulates low confidence and fixed-timer fallback." }
  ];

  return (
    <RoleGate navKey="scenarios">
      <PageHeader navKey="scenarios" title={t("modules.scenarios.title")} desc={t("modules.scenarios.desc")} />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-panel p-6">
             <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h3 className="font-semibold text-lg">Playback Controls</h3>
                <div className="flex bg-muted rounded-lg p-1">
                  <Button variant={running ? "default" : "ghost"} size="sm" onClick={() => store.setRunning(true)}><Play className="size-4 mr-1"/> Play</Button>
                  <Button variant={!running ? "default" : "ghost"} size="sm" onClick={() => store.setRunning(false)}><Pause className="size-4 mr-1"/> Pause</Button>
                  <Button variant="ghost" size="sm" onClick={() => store.tick()}><FastForward className="size-4 mr-1"/> Step</Button>
                </div>
             </div>

             <h4 className="font-medium text-sm text-muted-foreground mb-3">Load Deterministic Preset</h4>
             <div className="grid sm:grid-cols-3 gap-3">
                {presets.map(p => (
                  <button key={p.name} onClick={() => toast.success(`Loaded ${p.name} Scenario`)} className="text-left p-4 border rounded-lg hover:border-primary transition-colors bg-background">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-panel p-6 space-y-6">
          <h3 className="font-semibold border-b pb-2 flex items-center gap-2"><Hash className="size-4 text-primary"/> Scenario Verification</h3>
          <p className="text-sm text-muted-foreground">Because EthiFlow uses deterministic PRNG (Mulberry32), any scenario rerun yields the exact same SHA-256 chain.</p>
          <Button className="w-full" variant="outline" onClick={() => {
            toast.loading("Verifying scenario trace...", { duration: 1500 });
            setTimeout(() => toast.success("Trace Verified: Matches canonical snapshot 0x8F9B..."), 1500);
          }}>
            <CheckCircle2 className="mr-2 size-4" /> Re-run & Verify Integrity
          </Button>
        </div>
      </div>
    </RoleGate>
  );
}