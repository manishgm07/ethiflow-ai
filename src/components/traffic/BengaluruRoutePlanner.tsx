import { useState } from "react";
import { Train, Bus, Bike, Car, MapPin, Zap, Clock, ArrowRight, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ORIGINS, DESTINATIONS, compareRoutes, type RouteOption } from "@/lib/bengaluru-routes";
import { pick } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MODE_ICONS = { train: Train, bus: Bus, bike: Bike, car: Car } as const;

export function BengaluruRoutePlanner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [originId, setOriginId] = useState(ORIGINS[0]!.id);
  const [destId, setDestId] = useState(DESTINATIONS[0]!.id);

  const routes = compareRoutes(originId, destId);
  const fastest = routes.find((r) => r.isFastest);

  return (
    <div className="space-y-6">
      {/* Origin / Destination selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Selector
          label={t("routePlanner.origin")}
          value={originId}
          onChange={setOriginId}
          options={ORIGINS.map((o) => ({ value: o.id, label: pick(o, lang) }))}
        />
        <Selector
          label={t("routePlanner.destination")}
          value={destId}
          onChange={setDestId}
          options={DESTINATIONS.map((d) => ({ value: d.id, label: pick(d, lang) }))}
        />
      </div>

      {/* Fastest-mode banner */}
      {fastest && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-3 animate-rise">
          <Zap className="text-primary size-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-primary text-sm">
              {t("routePlanner.fastestMode")}: {lang === "kn" ? fastest.mode.kn : fastest.mode.en}
            </h3>
            <p className="text-sm mt-1 text-muted-foreground">
              {pick(fastest.winReason, lang)}
            </p>
          </div>
        </div>
      )}

      {/* Route comparison cards */}
      <div className="grid gap-3">
        {routes.map((route) => (
          <RouteCard key={route.mode.id} route={route} lang={lang} />
        ))}
      </div>
    </div>
  );
}

function RouteCard({ route, lang }: { route: RouteOption; lang: string }) {
  const { t } = useTranslation();
  const Icon = MODE_ICONS[route.mode.icon];

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 flex items-center justify-between gap-4 transition-all shadow-panel",
        route.isFastest && "border-primary ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "p-2.5 rounded-lg border",
            route.isFastest
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted/40 border-border text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {lang === "kn" ? route.mode.kn : route.mode.en}
            </span>
            {route.isFastest && (
              <Badge className="bg-primary text-primary-foreground text-[10px] gap-1">
                <Zap className="size-2.5" /> {t("routePlanner.fastest")}
              </Badge>
            )}
          </div>
          {route.junctionsCrossed.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="size-3" />
              {t("routePlanner.via")} {route.junctionsCrossed.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="text-xl font-bold font-mono text-foreground flex items-baseline gap-1 justify-end">
          {route.travelTimeMin}
          <span className="text-xs font-normal text-muted-foreground">{t("routePlanner.mins")}</span>
        </div>
        {route.isFastest && route.savedMin > 0 && (
          <span className="text-xs font-medium text-primary">
            -{route.savedMin} {t("routePlanner.mins")}
          </span>
        )}
      </div>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <MapPin className="size-3.5" /> {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border bg-card px-3 py-2.5 pr-9 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
