import { useState } from "react";
import {
  Shield, Wrench, CheckCircle, XCircle, Lock, Settings, Eye,
  Clock, Radio, FileText, AlertTriangle, ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { pick } from "@/lib/i18n";
import { JUNCTIONS, JUNCTION_IDS, type JunctionId } from "@/lib/sim/junctions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JunctionMode = "ai-adaptive" | "fixed-timer" | "corridor-lock";

interface OverrideRequest {
  id: string;
  junctionId: JunctionId;
  reason: string;
  operator: string;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
}

/** Supervisor-only panel showing power & authority controls. */
export function SupervisorPanel() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [junctionModes, setJunctionModes] = useState<Record<JunctionId, JunctionMode>>({
    "silk-board": "ai-adaptive",
    hebbal: "ai-adaptive",
    "kr-puram": "ai-adaptive",
    "mg-road": "ai-adaptive",
  });

  const [overrideRequests, setOverrideRequests] = useState<OverrideRequest[]>([
    {
      id: "req-1",
      junctionId: "silk-board",
      reason: "VIP convoy requiring extended green on Hosur Road",
      operator: "Operator Ravi",
      timestamp: new Date().toISOString(),
      status: "pending",
    },
    {
      id: "req-2",
      junctionId: "hebbal",
      reason: "School zone — extend pedestrian phase to 45s",
      operator: "Operator Priya",
      timestamp: new Date().toISOString(),
      status: "pending",
    },
  ]);

  const handleModeChange = (jId: JunctionId, mode: JunctionMode) => {
    setJunctionModes((prev) => ({ ...prev, [jId]: mode }));
    const jName = pick(JUNCTIONS[jId].name, lang);
    const modeLabel = t(`supervisor.modes.${mode}`);
    toast.success(t("supervisor.modeChanged", { junction: jName, mode: modeLabel }));
  };

  const handleOverrideAction = (reqId: string, action: "approved" | "rejected") => {
    setOverrideRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: action } : r)),
    );
    toast.success(
      action === "approved"
        ? t("supervisor.overrideApproved")
        : t("supervisor.overrideRejected"),
    );
  };

  const handleSync = () => {
    toast.success(t("supervisor.syncTriggered"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-primary">
          <Shield className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("supervisor.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("supervisor.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Junction Mode Control */}
        <div className="rounded-xl border bg-card p-5 shadow-panel space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="size-4 text-primary" /> {t("supervisor.junctionModes")}
          </h3>
          <div className="space-y-3">
            {JUNCTION_IDS.map((jId) => (
              <div key={jId} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <span className="font-medium text-sm">{pick(JUNCTIONS[jId].name, lang)}</span>
                <div className="relative">
                  <select
                    value={junctionModes[jId]}
                    onChange={(e) => handleModeChange(jId, e.target.value as JunctionMode)}
                    className="appearance-none rounded-md border bg-card px-3 py-1.5 pr-8 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="ai-adaptive">{t("supervisor.modes.ai-adaptive")}</option>
                    <option value="fixed-timer">{t("supervisor.modes.fixed-timer")}</option>
                    <option value="corridor-lock">{t("supervisor.modes.corridor-lock")}</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Junction Sync */}
        <div className="rounded-xl border bg-card p-5 shadow-panel space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Radio className="size-4 text-primary" /> {t("supervisor.crossSync")}
          </h3>
          <p className="text-sm text-muted-foreground">{t("supervisor.crossSyncDesc")}</p>
          <div className="flex flex-wrap gap-2">
            {JUNCTION_IDS.map((jId) => (
              <Badge key={jId} variant="outline" className="text-xs">
                {pick(JUNCTIONS[jId].name, lang)}
              </Badge>
            ))}
          </div>
          <Button onClick={handleSync} className="w-full text-sm font-semibold">
            <Radio className="size-4 mr-2" /> {t("supervisor.syncAll")}
          </Button>
        </div>
      </div>

      {/* Override Request Queue */}
      <div className="rounded-xl border bg-card p-5 shadow-panel space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="size-4 text-primary" /> {t("supervisor.overrideQueue")}
        </h3>
        {overrideRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("supervisor.noRequests")}</p>
        ) : (
          <div className="space-y-3">
            {overrideRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{pick(JUNCTIONS[req.junctionId].name, lang)}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        req.status === "pending" && "border-status-moderate text-status-moderate",
                        req.status === "approved" && "border-status-low text-status-low",
                        req.status === "rejected" && "border-status-severe text-status-severe",
                      )}
                    >
                      {t(`supervisor.status.${req.status}`)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{req.operator}</span>
                </div>
                <p className="text-sm text-muted-foreground">{req.reason}</p>
                {req.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs"
                      onClick={() => handleOverrideAction(req.id, "approved")}
                    >
                      <CheckCircle className="size-3.5 mr-1" /> {t("supervisor.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      onClick={() => handleOverrideAction(req.id, "rejected")}
                    >
                      <XCircle className="size-3.5 mr-1" /> {t("supervisor.reject")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Link */}
      <div className="rounded-lg border bg-muted/20 p-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="size-4 shrink-0" />
        <span>{t("supervisor.auditNote")}</span>
      </div>
    </div>
  );
}

/** Operator-only panel showing field execution controls. */
export function OperatorPanel() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2 rounded-lg bg-status-moderate/10 border border-status-moderate/30 text-status-moderate">
          <Wrench className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t("operatorPanel.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("operatorPanel.subtitle")}</p>
        </div>
      </div>

      {/* Capability list */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            { icon: Clock, label: t("operatorPanel.phaseTimingLabel"), desc: t("operatorPanel.phaseTimingDesc") },
            { icon: Shield, label: t("operatorPanel.safeZoneLabel"), desc: t("operatorPanel.safeZoneDesc") },
            { icon: Eye, label: t("operatorPanel.audioCrossingLabel"), desc: t("operatorPanel.audioCrossingDesc") },
            { icon: Clock, label: t("operatorPanel.seniorExtLabel"), desc: t("operatorPanel.seniorExtDesc") },
          ] as const
        ).map((cap) => (
          <div key={cap.label} className="rounded-xl border bg-card p-4 shadow-panel space-y-2">
            <div className="flex items-center gap-2">
              <cap.icon className="size-4 text-status-moderate" />
              <h4 className="font-semibold text-sm">{cap.label}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{cap.desc}</p>
          </div>
        ))}
      </div>

      {/* Restricted actions notice */}
      <div className="rounded-lg border border-status-moderate/30 bg-status-moderate/5 p-3 flex items-start gap-2 text-sm">
        <AlertTriangle className="size-4 shrink-0 mt-0.5 text-status-moderate" />
        <div>
          <span className="font-medium">{t("operatorPanel.restrictedTitle")}</span>
          <p className="text-muted-foreground text-xs mt-0.5">{t("operatorPanel.restrictedDesc")}</p>
        </div>
      </div>
    </div>
  );
}
