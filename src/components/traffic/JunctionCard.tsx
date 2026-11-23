import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ExplainButton } from "@/components/explain/ExplainProvider";
import { ConfidencePill, Lamp, LevelBadge, SourceBadge } from "@/components/traffic/badges";
import { pick } from "@/lib/i18n";
import { JUNCTIONS, type JunctionId } from "@/lib/sim/junctions";
import { useSim } from "@/lib/sim/provider";
import { lampFor } from "@/lib/sim/timing";
import { cn } from "@/lib/utils";

export function JunctionCard({ id }: { id: JunctionId }) {
  const { t, i18n } = useTranslation();
  const j = useSim((s) => s.junctions[id]);
  const def = JUNCTIONS[id];
  const s = j.signal;
  const color = lampFor(s, s.phase);
  const hold = s.stage === "green" && (j.override?.mode === "hold" || (j.corridor && j.corridor.approach === s.phase));

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border bg-card shadow-panel",
        j.level === "severe" && "border-status-severe/60",
        j.fallback.active && "border-status-severe border-2",
      )}
      aria-label={pick(def.name, i18n.language)}
    >
      <header className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{pick(def.name, i18n.language)}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <LevelBadge level={j.level} />
            <ConfidencePill value={j.confidence} />
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-extrabold leading-none font-tabular">{j.score}</p>
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">/ 100</p>
        </div>
      </header>

      <div className="flex items-center gap-3 p-4">
        <Lamp color={color} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t("dashboard.phase")}</p>
          <p className="font-semibold">
            {t(`dir.${s.phase}`)} · {t(`stage.${s.stage}`)}
          </p>
        </div>
        <p className="font-mono text-2xl font-bold font-tabular" aria-live="off">
          {hold && !j.corridor ? t("common.hold") : `${s.remaining}s`}
        </p>
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t p-3">
        <SourceBadge source={s.source === "ai" && j.fallback.active ? "fallback" : s.source} />
        <div className="flex gap-1.5">
          <ExplainButton subject={{ kind: "signal", junctionId: id }} />
          <Link
            to="/signals/$junctionId"
            params={{ junctionId: id }}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            {t("common.openSignals")} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </footer>
    </article>
  );
}
