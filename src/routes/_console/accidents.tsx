import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TriangleAlert, ShieldCheck, MapPin, CarFront, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, RoleGate } from "@/components/shell/ModulePage";
import { Button } from "@/components/ui/button";
import { useSimStore } from "@/lib/sim/provider";

export const Route = createFileRoute("/_console/accidents")({
  component: AccidentsPage,
});

type AccStatus = "new" | "dispatched" | "resolved";

function AccidentsPage() {
  const { t } = useTranslation();
  const store = useSimStore();
  const [status, setStatus] = useState<AccStatus>("resolved");

  const handleSimulate = () => {
    setStatus("new");
    toast.error("Collision Detected at Outer Ring Road approach (Silk Board)");
    store.simulateLowConfidence("silk-board", "System", "operator");
  };

  return (
    <RoleGate navKey="accidents">
      <PageHeader navKey="accidents" title={t("modules.accidents.title")} desc={t("modules.accidents.desc")} />
      
      <div className="mb-6 flex justify-end">
        <Button onClick={handleSimulate} variant="destructive" disabled={status !== "resolved"}>
          <TriangleAlert className="mr-2 size-4" /> Simulate Collision
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-panel min-h-[400px] flex items-center justify-center relative">
          <div className="absolute inset-0 bg-grid opacity-30 rounded-xl" />
          {status !== "resolved" ? (
             <div className="relative z-10 flex flex-col items-center">
                <div className="relative animate-pulse">
                  <div className="absolute inset-0 bg-status-severe rounded-full blur-xl opacity-30" />
                  <CarFront className="size-16 text-status-severe relative z-10" />
                  <TriangleAlert className="size-8 text-amber absolute -top-2 -right-2 z-20 bg-background rounded-full" />
                </div>
                <p className="mt-4 font-mono text-sm bg-background border px-3 py-1 rounded shadow text-status-severe">Confidence: 94%</p>
             </div>
          ) : (
             <p className="text-muted-foreground flex items-center gap-2"><ShieldCheck /> No active collisions</p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Active Incident Workflow</h3>
          {status === "resolved" ? (
            <div className="p-4 rounded-lg border bg-muted/50 text-muted-foreground text-sm">
              Waiting for incidents...
            </div>
          ) : (
            <div className="p-5 rounded-lg border border-status-severe bg-status-severe/5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-status-severe flex items-center gap-2">
                    <TriangleAlert className="size-4" /> Major Collision
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="size-3.5"/> Silk Board (North Approach)</p>
                </div>
                <span className="uppercase text-[0.65rem] tracking-wider bg-background px-2 py-1 rounded border font-semibold">
                  {status}
                </span>
              </div>
              
              <div className="flex gap-2 pt-4 border-t border-status-severe/20">
                {status === "new" && (
                  <>
                    <Button onClick={() => setStatus("dispatched")} className="flex-1">Dispatch Units</Button>
                    <Button onClick={() => { setStatus("resolved"); toast.success("Marked as False Alarm"); }} variant="outline">False Alarm</Button>
                  </>
                )}
                {status === "dispatched" && (
                  <Button onClick={() => { setStatus("resolved"); toast.success("Incident Resolved"); }} variant="default" className="w-full bg-status-low hover:bg-status-low/90 text-primary-foreground">
                    <ShieldCheck className="mr-2 size-4" /> Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGate>
  );
}