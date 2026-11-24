import { useState } from "react";
import { Clock, Sun, Moon, Train, Car, AlertTriangle, ChevronDown, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ORIGINS, DESTINATIONS, recommendDeparture } from "@/lib/bengaluru-routes";
import { pick } from "@/lib/i18n";
import { useSim } from "@/lib/sim/provider";
import { simMinute } from "@/lib/sim/engine";
import { cn } from "@/lib/utils";

export function BestTimeToLeave() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const tick = useSim((s) => s.tick);
  const currentHour = Math.floor(((simMinute(tick) % 1440) + 1440) % 1440 / 60);

  const [originId, setOriginId] = useState(ORIGINS[0]!.id);
  const [destId, setDestId] = useState(DESTINATIONS[0]!.id);

  const rec = recommendDeparture(originId, destId, currentHour);

  return (
    <div className="space-y-5">
      {/* Destination selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {t("bestTime.from")}
          </label>
          <div className="relative">
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full appearance-none rounded-lg border bg-card px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {ORIGINS.map((o) => (
                <option key={o.id} value={o.id}>{pick(o, lang)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {t("bestTime.to")}
          </label>
          <div className="relative">
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full appearance-none rounded-lg border bg-card px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id}>{pick(d, lang)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Peak warning */}
      {rec.peakWarning && (
        <div className="rounded-lg border border-status-moderate bg-status-moderate/10 p-3 flex items-center gap-2 text-sm font-medium text-status-moderate">
          <AlertTriangle className="size-4 shrink-0" />
          {t("bestTime.peakWarning")}
        </div>
      )}

      {/* Comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Public transport */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Train className="size-5 text-primary" />
            <h4 className="font-semibold text-sm text-primary">{t("bestTime.public")}</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("bestTime.mode")}</span>
              <span className="font-medium">{lang === "kn" ? rec.publicTransport.modeKn : rec.publicTransport.mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("bestTime.departAt")}</span>
              <span className="font-mono font-medium">{rec.publicTransport.departureWindow}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("bestTime.travelTime")}</span>
              <span className="font-mono font-bold text-primary">{rec.publicTransport.travelTimeMin} {t("routePlanner.mins")}</span>
            </div>
          </div>
        </div>

        {/* Private transport */}
        <div className="rounded-xl border bg-card p-5 space-y-3 shadow-panel">
          <div className="flex items-center gap-2">
            <Car className="size-5 text-muted-foreground" />
            <h4 className="font-semibold text-sm">{t("bestTime.private")}</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("bestTime.mode")}</span>
              <span className="font-medium">{lang === "kn" ? rec.privateTransport.modeKn : rec.privateTransport.mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("bestTime.departAt")}</span>
              <span className="font-mono font-medium">{rec.privateTransport.departureWindow}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("bestTime.travelTime")}</span>
              <span className="font-mono font-bold">{rec.privateTransport.travelTimeMin} {t("routePlanner.mins")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground flex items-start gap-2.5 shadow-panel">
        {rec.peakWarning ? <Sun className="size-4 shrink-0 mt-0.5 text-status-moderate" /> : <Moon className="size-4 shrink-0 mt-0.5 text-primary" />}
        <p className="font-medium">{pick(rec.recommendation, lang)}</p>
      </div>
    </div>
  );
}
