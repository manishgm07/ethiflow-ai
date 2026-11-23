import { useState } from "react";
import {
  Ambulance,
  Activity,
  Clock,
  Users,
  ShieldCheck,
  TriangleAlert,
  MapPin,
  CheckCircle,
  Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useSimStore } from "@/lib/sim/provider";
import { useAuth } from "@/lib/auth";
import { sha256Hex } from "@/lib/audit/local-audit";
import { JUNCTIONS, type JunctionId } from "@/lib/sim/junctions";
import { pick } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface Hospital {
  id: number;
  name: string;
  kn: string;
  totalBeds: number;
  freeBeds: number;
  specialists: string;
  waitTime: number;
  status: "green" | "amber" | "red";
}

export interface ActiveCorridorRoute {
  hospital: Hospital;
  junctionId: JunctionId;
  eta: number;
}

export interface CorridorAuditItem {
  timestamp: string;
  action: string;
  hash: string;
}

const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 1,
    name: "Manipal Hospital Old Airport Road",
    kn: "ಮಣಿಪಾಲ್ ಆಸ್ಪತ್ರೆ ಹಳೆಯ ವಿಮಾನ ನಿಲ್ದಾಣ ರಸ್ತೆ",
    totalBeds: 40,
    freeBeds: 14,
    specialists: "2 Trauma, 1 Neuro",
    waitTime: 18,
    status: "amber",
  },
  {
    id: 2,
    name: "Aster CMI Hebbal",
    kn: "ಆಸ್ಟರ್ ಸಿಎಂಐ ಹೆಬ್ಬಾಳ",
    totalBeds: 35,
    freeBeds: 0,
    specialists: "1 Trauma Surgeon",
    waitTime: 55,
    status: "red",
  },
  {
    id: 3,
    name: "Narayana Health City Electronic City",
    kn: "ನಾರಾಯಣ ಹೆಲ್ತ್ ಸಿಟಿ ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ",
    totalBeds: 80,
    freeBeds: 25,
    specialists: "4 Cardio, 3 Trauma",
    waitTime: 5,
    status: "green",
  },
  {
    id: 4,
    name: "St. John's Medical College Hospital",
    kn: "ಸೇಂಟ್ ಜಾನ್ಸ್ ವೈದ್ಯಕೀಯ ಕಾಲೇಜು ಆಸ್ಪತ್ರೆ",
    totalBeds: 60,
    freeBeds: 15,
    specialists: "3 Trauma, 2 Cardio",
    waitTime: 8,
    status: "green",
  },
];

const JUNCTION_KEYS: JunctionId[] = ["silk-board", "hebbal", "kr-puram", "mg-road"];

const ETAS: Record<JunctionId, Record<number, number>> = {
  "silk-board": { 1: 25, 2: 45, 3: 15, 4: 6 },
  hebbal: { 1: 35, 2: 4, 3: 55, 4: 40 },
  "kr-puram": { 1: 15, 2: 25, 3: 45, 4: 30 },
  "mg-road": { 1: 18, 2: 28, 3: 38, 4: 15 },
};

export function EthiFlowHospitalRouting() {
  const { t, i18n } = useTranslation();
  const store = useSimStore();
  const { profile, role } = useAuth();

  const [activeJunction, setActiveJunction] = useState<JunctionId>("silk-board");
  const [activeRoute, setActiveRoute] = useState<ActiveCorridorRoute | null>(null);
  const [auditLog, setAuditLog] = useState<CorridorAuditItem[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);

  const getEta = (hospitalId: number, junction: JunctionId) => ETAS[junction][hospitalId];

  // AI Logic to find best hospital (Avoids 0 beds, prioritizes ETA + Bed Availability)
  const aiRecommended = hospitals.reduce<Hospital | null>((best, h) => {
    if (h.freeBeds === 0) return best; // EthiFlow Fail-safe
    const eta = getEta(h.id, activeJunction);
    const score = eta * 1.5 - h.freeBeds;
    if (!best) return h;
    const bestEta = getEta(best.id, activeJunction);
    const bestScore = bestEta * 1.5 - best.freeBeds;
    return score < bestScore ? h : best;
  }, null);

  const activateCorridor = async (hospital: Hospital) => {
    const eta = getEta(hospital.id, activeJunction);

    // 1. Reserve Bed in UI state
    setHospitals((prev) =>
      prev.map((h) => (h.id === hospital.id ? { ...h, freeBeds: Math.max(0, h.freeBeds - 1) } : h))
    );

    // 2. Set Active Route Overlay
    setActiveRoute({ hospital, junctionId: activeJunction, eta });

    // 3. Connect to EthiFlow simulation store (Activates real green corridor)
    store.simulateAmbulance(
      activeJunction,
      "N",
      profile?.display_name || "Emergency Driver",
      role || "emergency_driver"
    );

    // 4. Generate Cryptographic SHA-256 Audit Log
    const timestamp = new Date().toISOString();
    const logString = `GREEN_CORRIDOR_DISPATCH|${activeJunction}|${hospital.name}|ETA:${eta}|BEDS_RESERVED:1|TS:${timestamp}`;
    const hash = await sha256Hex(logString);

    const junctionName = pick(JUNCTIONS[activeJunction].name, i18n.language);
    const hospitalName = i18n.language === "kn" ? hospital.kn : hospital.name;

    setAuditLog((prev) => [
      {
        timestamp,
        action: `Green Corridor: ${junctionName} → ${hospitalName}`,
        hash,
      },
      ...prev,
    ]);

    toast.success(
      t("hospitalRouting.toastSuccess", {
        junction: junctionName,
        hospital: hospitalName,
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-status-ambulance/10 border border-status-ambulance/30 text-status-ambulance">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t("hospitalRouting.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("hospitalRouting.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & Active Route */}
        <div className="space-y-6">
          {/* Junction Selector */}
          <div className="rounded-xl border bg-card p-5 shadow-panel">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="text-primary size-4" /> {t("hospitalRouting.junction")}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {JUNCTION_KEYS.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    setActiveJunction(j);
                    setActiveRoute(null);
                  }}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    activeJunction === j
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/40 border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {pick(JUNCTIONS[j].name, i18n.language)}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Route Overlay */}
          {activeRoute && (
            <div className="rounded-xl border border-status-low bg-status-low/10 p-5 animate-pulse shadow-panel">
              <div className="flex items-center gap-2 mb-2">
                <Ambulance className="text-status-low size-5" />
                <h4 className="font-bold text-status-low text-sm">
                  {t("hospitalRouting.routeActive")}
                </h4>
              </div>
              <p className="text-lg font-semibold text-foreground mb-3">
                {pick(JUNCTIONS[activeRoute.junctionId].name, i18n.language)} →{" "}
                {i18n.language === "kn" ? activeRoute.hospital.kn : activeRoute.hospital.name}
              </p>
              <div className="flex justify-between items-center text-sm font-medium bg-background/80 border rounded-lg p-2.5">
                <span className="font-mono">
                  {t("hospitalRouting.eta")} {activeRoute.eta} {t("hospitalRouting.mins")}
                </span>
                <span className="flex items-center gap-1 text-status-low font-semibold">
                  <CheckCircle className="size-4" /> {t("hospitalRouting.reserved")}
                </span>
              </div>
            </div>
          )}

          {/* Fail-safe Info */}
          <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground flex items-start gap-2.5 shadow-panel">
            <TriangleAlert className="text-amber size-4 shrink-0 mt-0.5" />
            <div>
              <p>{t("hospitalRouting.failsafe")}</p>
              <p className="mt-1 text-muted-foreground/80 font-medium">{t("hospitalRouting.privacyEnforced")}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Hospital Telemetry Panel */}
        <div className="lg:col-span-2 space-y-4">
          {hospitals.map((hospital) => {
            const isRecommended = aiRecommended && aiRecommended.id === hospital.id;
            const eta = getEta(hospital.id, activeJunction);

            const statusColors = {
              green: "text-status-low bg-status-low/10 border-status-low/30",
              amber: "text-status-moderate bg-status-moderate/10 border-status-moderate/30",
              red: "text-status-severe bg-status-severe/10 border-status-severe/30",
            };

            const statusText = {
              green: `${t("hospitalRouting.waitGreen")} ${hospital.waitTime} min`,
              amber: `${t("hospitalRouting.waitAmber")} ${hospital.waitTime} min`,
              red: `${t("hospitalRouting.waitRed")} ${hospital.waitTime}+ min`,
            };

            return (
              <div
                key={hospital.id}
                className={`relative p-5 rounded-xl border bg-card transition-all shadow-panel ${
                  isRecommended
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-border"
                }`}
              >
                {isRecommended && (
                  <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground gap-1 text-xs">
                    <Activity className="size-3" /> {t("hospitalRouting.autoRec")}
                  </Badge>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-1">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {i18n.language === "kn" ? hospital.kn : hospital.name}
                    </h3>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2.5">
                      <div className="flex items-center gap-1 font-mono">
                        <Ambulance className="size-3.5 text-muted-foreground" />
                        <span
                          className={
                            hospital.freeBeds > 0
                              ? "text-status-low font-bold"
                              : "text-status-severe font-bold"
                          }
                        >
                          {hospital.freeBeds} / {hospital.totalBeds} {t("hospitalRouting.bedsFree")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span>{hospital.specialists} {t("hospitalRouting.specialists")}</span>
                      </div>
                      <div
                        className={`px-2 py-0.5 rounded border ${statusColors[hospital.status]} flex items-center gap-1 font-medium`}
                      >
                        <Clock className="size-3" />
                        <span>{statusText[hospital.status]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 w-full md:w-auto border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4">
                    <div className="text-2xl font-bold font-mono text-foreground flex items-baseline gap-1">
                      {eta} <span className="text-xs font-normal text-muted-foreground">{t("hospitalRouting.mins")}</span>
                    </div>

                    <Button
                      disabled={hospital.freeBeds === 0}
                      onClick={() => activateCorridor(hospital)}
                      variant={isRecommended ? "default" : "secondary"}
                      className="w-full md:w-auto text-xs font-semibold"
                    >
                      {t("hospitalRouting.selectBtn")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SHA-256 Audit Log */}
      <div className="rounded-xl border bg-card p-5 shadow-panel">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Lock className="size-4 text-muted-foreground" /> {t("hospitalRouting.auditTitle")}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase border-b">
              <tr>
                <th className="px-3 py-2 rounded-tl-lg">Timestamp</th>
                <th className="px-3 py-2">Action Details</th>
                <th className="px-3 py-2 rounded-tr-lg">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditLog.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                    {t("hospitalRouting.noLogs")}
                  </td>
                </tr>
              ) : (
                auditLog.map((log, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                      {log.timestamp}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{log.action}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-primary truncate max-w-[220px]">
                      {log.hash}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
