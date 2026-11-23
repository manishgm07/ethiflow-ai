import { Ambulance, CircleAlert, CircleCheck, Cpu, Gauge, Hand, OctagonAlert, ShieldAlert, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CONFIDENCE_THRESHOLD, type Level } from "@/lib/sim/engine";
import type { SignalSource } from "@/lib/sim/explain";
import { cn } from "@/lib/utils";

const pill = "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

const LEVEL_STYLE: Record<Level, { icon: LucideIcon; cls: string; iconCls: string }> = {
  low: { icon: CircleCheck, cls: "border-status-low/60 bg-status-low/12 text-foreground", iconCls: "text-status-low" },
  moderate: {
    icon: CircleAlert,
    cls: "border-status-moderate bg-status-moderate/20 text-foreground",
    iconCls: "text-status-moderate hc:text-foreground",
  },
  severe: { icon: OctagonAlert, cls: "border-status-severe bg-status-severe text-status-foreground", iconCls: "" },
};

export function LevelBadge({ level, score, className }: { level: Level; score?: number; className?: string }) {
  const { t } = useTranslation();
  const s = LEVEL_STYLE[level];
  const Icon = s.icon;
  return (
    <span className={cn(pill, s.cls, className)}>
      <Icon className={cn("size-3.5", s.iconCls)} aria-hidden="true" />
      {t(`levels.${level}`)}
      {score !== undefined && <span className="font-mono font-tabular opacity-90">{score}</span>}
    </span>
  );
}

const SOURCE_STYLE: Record<SignalSource, { icon: LucideIcon; cls: string }> = {
  ai: { icon: Cpu, cls: "border-primary/50 bg-secondary text-secondary-foreground" },
  fallback: { icon: ShieldAlert, cls: "border-status-severe bg-status-severe text-status-foreground" },
  override: { icon: Hand, cls: "border-amber bg-amber text-amber-foreground" },
  corridor: { icon: Ambulance, cls: "border-status-ambulance bg-status-ambulance text-status-foreground" },
};

export function SourceBadge({ source, className }: { source: SignalSource; className?: string }) {
  const { t } = useTranslation();
  const s = SOURCE_STYLE[source];
  const Icon = s.icon;
  return (
    <span className={cn(pill, s.cls, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {t(`source.${source}`)}
    </span>
  );
}

export function ConfidencePill({ value, className }: { value: number; className?: string }) {
  const { t } = useTranslation();
  const low = value < CONFIDENCE_THRESHOLD;
  return (
    <span
      className={cn(
        pill,
        low ? "border-status-severe bg-status-severe/10 text-status-severe hc:text-foreground" : "border-border bg-card text-foreground",
        className,
      )}
      title={t("common.confidence")}
    >
      <Gauge className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{t("common.confidence")}</span>
      <span className="font-mono font-tabular">{value}%</span>
    </span>
  );
}

export function Lamp({ color, size = "sm" }: { color: "green" | "amber" | "red"; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex flex-col gap-0.5 rounded-sm bg-navy p-0.5", size === "md" && "gap-1 p-1")} aria-hidden="true">
      {(["red", "amber", "green"] as const).map((c) => (
        <span
          key={c}
          className={cn(
            "rounded-full",
            size === "md" ? "size-2.5" : "size-1.5",
            c === "red" && "bg-status-severe",
            c === "amber" && "bg-status-moderate",
            c === "green" && "bg-status-low",
            c === color ? "opacity-100" : "opacity-20",
          )}
        />
      ))}
    </span>
  );
}
