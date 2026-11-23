import { Pause, Play, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatSimTime, simMinute } from "@/lib/sim/engine";
import { useSim, useSimStore } from "@/lib/sim/provider";
import { cn } from "@/lib/utils";

export function SimClock({ className }: { className?: string }) {
  const { t } = useTranslation();
  const store = useSimStore();
  const tick = useSim((s) => s.tick);
  const running = useSim((s) => s.running);
  return (
    <div
      className={cn("inline-flex h-8 shrink-0 items-center gap-0.5 rounded-full border bg-card pl-2.5 pr-0.5", className)}
      title={t("sim.tickHint")}
    >
      <span className="font-mono text-xs font-semibold font-tabular" aria-live="off">
        <span className="sr-only">{t("sim.clock")}: </span>
        {formatSimTime(simMinute(tick))}
      </span>
      <span className="ml-1 font-mono text-[0.6rem] uppercase text-muted-foreground">{running ? "sim" : t("sim.paused")}</span>
      <button
        type="button"
        onClick={() => store.setRunning(!running)}
        aria-label={running ? t("sim.pause") : t("sim.play")}
        className="ml-1 inline-flex size-7 items-center justify-center rounded-full hover:bg-muted"
      >
        {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => store.tick()}
        aria-label={t("sim.step")}
        className="inline-flex size-7 items-center justify-center rounded-full hover:bg-muted"
      >
        <SkipForward className="size-3.5" />
      </button>
    </div>
  );
}
