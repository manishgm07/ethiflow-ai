import { Cpu, FlaskConical, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAiMode } from "@/lib/ai-mode";
import { cn } from "@/lib/utils";

const chipBase =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.7rem] font-medium uppercase tracking-wide whitespace-nowrap";

export function SimulatedDataChip({ tone = "default" }: { tone?: "default" | "inverse" }) {
  const { t } = useTranslation();
  return (
    <span
      role="status"
      title={t("chips.simulatedHint")}
      className={cn(
        chipBase,
        tone === "inverse"
          ? "border-amber/50 bg-amber/15 text-amber"
          : "border-amber/60 bg-accent text-accent-foreground",
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {t("chips.simulated")}
    </span>
  );
}

export function AiModeChip({ tone = "default" }: { tone?: "default" | "inverse" }) {
  const { t } = useTranslation();
  const { mode } = useAiMode();
  const adaptive = mode === "adaptive";
  return (
    <span
      role="status"
      aria-live="polite"
      title={adaptive ? t("chips.adaptiveHint") : t("chips.fallbackHint")}
      className={cn(
        chipBase,
        adaptive
          ? tone === "inverse"
            ? "border-status-low/60 bg-status-low/20 text-navy-foreground"
            : "border-status-low/60 bg-status-low/12 text-foreground"
          : "border-status-severe/60 bg-status-severe text-status-foreground",
      )}
    >
      {adaptive ? (
        <Cpu className="size-3.5 text-status-low" aria-hidden="true" />
      ) : (
        <ShieldAlert className="size-3.5" aria-hidden="true" />
      )}
      <span className="opacity-80">{t("chips.aiMode")}:</span>
      {adaptive ? t("chips.adaptive") : t("chips.fallback")}
      {adaptive && <span className="size-1.5 animate-signal-pulse rounded-full bg-status-low" aria-hidden="true" />}
    </span>
  );
}

export function HeaderChips({ tone = "default", className }: { tone?: "default" | "inverse"; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SimulatedDataChip tone={tone} />
      <AiModeChip tone={tone} />
    </div>
  );
}
