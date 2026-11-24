import { Info } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { forecast, type Horizon, HORIZONS, type Level } from "@/lib/sim/engine";
import { JUNCTION_IDS, JUNCTIONS, type JunctionId } from "@/lib/sim/junctions";
import { pick } from "@/lib/i18n";
import { useSim } from "@/lib/sim/provider";
import { ConfidencePill } from "@/components/traffic/badges";
import { JunctionSelector, type JunctionFilter } from "@/components/traffic/JunctionSelector";
import { cn } from "@/lib/utils";

/** Human-readable labels + delay for each severity level. */
const HUMAN_LABELS: Record<Level, { en: string; kn: string; delay: string; cls: string }> = {
  severe: {
    en: "Heavy Gridlock",
    kn: "ಭಾರೀ ಟ್ರಾಫಿಕ್ ಜಾಮ್",
    delay: "+25 min",
    cls: "text-status-severe bg-status-severe/10 border-status-severe/30",
  },
  moderate: {
    en: "Slow-Moving",
    kn: "ನಿಧಾನ ಚಲನೆ",
    delay: "+10 min",
    cls: "text-status-moderate bg-status-moderate/10 border-status-moderate/30",
  },
  low: {
    en: "Smooth Flow",
    kn: "ಸುಗಮ ಹರಿವು",
    delay: "Normal time",
    cls: "text-status-low bg-status-low/10 border-status-low/30",
  },
};

export function PlainLanguageForecast() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const tick = useSim((s) => s.tick);
  const [selectedJunction, setSelectedJunction] = useState<JunctionFilter>("all");
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const junctions = selectedJunction === "all" ? JUNCTION_IDS : [selectedJunction];

  return (
    <div className="space-y-5">
      {/* Junction selector */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("forecast.filterJunction")}</h3>
        <JunctionSelector value={selectedJunction} onChange={setSelectedJunction} />
      </div>

      {/* Forecast cards */}
      <div className="space-y-4">
        {junctions.map((jId) => {
          const j = JUNCTIONS[jId];
          return (
            <div key={jId} className="rounded-xl border bg-card shadow-panel overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/30">
                <h4 className="font-semibold text-sm">{pick(j.name, lang)}</h4>
              </div>
              <div className="grid grid-cols-3 divide-x">
                {HORIZONS.map((h) => {
                  const f = forecast(jId, tick, h);
                  const hl = HUMAN_LABELS[f.level];
                  const cellKey = `${jId}-${h}`;
                  const expanded = expandedCell === cellKey;

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setExpandedCell(expanded ? null : cellKey)}
                      className="p-4 text-center hover:bg-muted/30 transition-colors space-y-2 focus:outline-none"
                    >
                      <div className="text-xs font-mono text-muted-foreground">+{h} {t("forecast.min")}</div>
                      <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", hl.cls)}>
                        {lang === "kn" ? hl.kn : hl.en}
                      </div>
                      <div className="text-sm font-bold">
                        {f.level === "low" ? t("forecast.normalTime") : hl.delay} {t("forecast.delay")}
                      </div>

                      {/* Expandable details */}
                      {expanded && (
                        <div className="mt-2 pt-2 border-t border-dashed text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center justify-center gap-1">
                            <Info className="size-3" />
                            {t("forecast.score")}: <span className="font-mono font-bold">{f.score}/100</span>
                          </div>
                          <ConfidencePill value={f.confidence} className="mx-auto" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
