import { useMemo, useState } from "react";
import { Cpu, Gauge, Lightbulb, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-desktop";
import { pick } from "@/lib/i18n";
import { CONFIDENCE_THRESHOLD } from "@/lib/sim/engine";
import { explainPrediction, type Explanation } from "@/lib/sim/explain";
import { APPROACHES } from "@/lib/sim/junctions";
import { useSim } from "@/lib/sim/provider";
import { explainJunctionSignal } from "@/lib/sim/store";
import { cn } from "@/lib/utils";
import type { ExplainSubject } from "./ExplainProvider";

export function ExplainDrawer({ subject, onClose }: { subject: ExplainSubject | null; onClose: () => void }) {
  const desktop = useIsDesktop();
  const { t } = useTranslation();
  return (
    <Sheet open={!!subject} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side={desktop ? "right" : "bottom"}
        className={cn(
          "overflow-y-auto p-0",
          desktop ? "w-full sm:max-w-lg" : "max-h-[88dvh] rounded-t-2xl",
        )}
      >
        {subject ? (
          <ExplainBody subject={subject} />
        ) : (
          <SheetHeader className="sr-only">
            <SheetTitle>{t("explain.title")}</SheetTitle>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

function useExplanation(subject: ExplainSubject): Explanation {
  const tick = useSim((s) => s.tick);
  const junction = useSim((s) => (subject.kind === "signal" ? s.junctions[subject.junctionId] : null));
  // Signal explanations refresh with the controller; prediction ones each tick.
  const source = junction?.signal.source;
  const fallbackActive = junction?.fallback.active;
  return useMemo(() => {
    if (subject.kind === "snapshot") return subject.explanation;
    if (subject.kind === "prediction") return explainPrediction(subject.junctionId, tick, subject.horizon);
    return explainJunctionSignal(junction!, tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, tick, source, fallbackActive, junction?.corridor, junction?.override]);
}

function ExplainBody({ subject }: { subject: ExplainSubject }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const e = useExplanation(subject);
  const [other, setOther] = useState(false);
  const otherLang = lang === "kn" ? "en" : "kn";
  const low = e.confidence !== null && e.confidence < CONFIDENCE_THRESHOLD;
  const total = e.factors.reduce((s, f) => s + f.weight, 0);

  return (
    <div className="flex flex-col">
      <SheetHeader className="space-y-2 border-b bg-navy p-5 text-left text-navy-foreground">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-amber">
          {t("explain.title")}
          {subject.kind === "snapshot" ? ` · ${t("explain.snapshot")}` : ""}
        </p>
        <SheetTitle className="font-display text-xl text-navy-foreground">{pick(e.title, lang)}</SheetTitle>
        <SheetDescription className="text-navy-muted">{t("explain.simTime", { time: e.simTime })}</SheetDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-border px-2.5 py-1 font-mono text-[0.7rem]">
            <Cpu className="size-3.5 text-amber" aria-hidden="true" />
            {t("explain.model")}: {e.modelVersion}
          </span>
          {e.confidence !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.7rem]",
                low ? "border-status-severe bg-status-severe text-status-foreground" : "border-navy-border",
              )}
            >
              <Gauge className="size-3.5" aria-hidden="true" />
              {t("common.confidence")}: {e.confidence}%
            </span>
          )}
        </div>
        {e.confidence !== null && (
          <div className="pt-1">
            <div className="h-2 overflow-hidden rounded-full bg-navy-border" role="meter" aria-valuenow={e.confidence} aria-valuemin={0} aria-valuemax={100} aria-label={t("common.confidence")}>
              <div className={cn("h-full rounded-full", low ? "bg-status-severe" : "bg-status-low")} style={{ width: `${e.confidence}%` }} />
            </div>
            {low && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-navy-foreground">
                <TriangleAlert className="size-3.5 text-status-severe" aria-hidden="true" /> {t("explain.lowConf")}
              </p>
            )}
          </div>
        )}
      </SheetHeader>

      <div className="space-y-6 p-5">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("explain.decision")}</h3>
          <p className="mt-1.5 text-base font-medium leading-relaxed">{pick(e.decision, lang)}</p>
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("explain.factors")}</h3>
            <span className="font-mono text-xs text-muted-foreground">
              {t("explain.total")}: {total}%
            </span>
          </div>
          <ul className="mt-3 space-y-2.5">
            {e.factors.map((f, i) => (
              <li key={f.key}>
                <div className="flex justify-between text-sm">
                  <span>{pick(f.label, lang)}</span>
                  <span className="font-mono font-tabular font-semibold">{f.weight}%</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", i === 0 ? "bg-primary" : "bg-primary/55")}
                    style={{ width: `${f.weight}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {e.rawInputs && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("explain.raw")}</h3>
            <div className="mt-2 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="px-2.5 py-2 text-left font-medium">{t("signals.cols.approach")}</th>
                    <th className="px-2 py-2 text-right font-medium">{t("signals.cols.cars")}</th>
                    <th className="px-2 py-2 text-right font-medium">{t("signals.cols.tw")}</th>
                    <th className="px-2 py-2 text-right font-medium">{t("signals.cols.buses")}</th>
                    <th className="px-2 py-2 text-right font-medium">{t("signals.cols.peds")}</th>
                    {e.greens && <th className="px-2 py-2 text-right font-medium">{t("signals.cols.green")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y font-mono font-tabular">
                  {APPROACHES.map((a) => (
                    <tr key={a}>
                      <td className="px-2.5 py-1.5 font-sans font-medium">{t(`dir.${a}`)}</td>
                      <td className="px-2 py-1.5 text-right">{e.rawInputs![a].cars}</td>
                      <td className="px-2 py-1.5 text-right">{e.rawInputs![a].twoWheelers}</td>
                      <td className="px-2 py-1.5 text-right">{e.rawInputs![a].buses}</td>
                      <td className="px-2 py-1.5 text-right">{e.rawInputs![a].pedestrians}</td>
                      {e.greens && (
                        <td className="px-2 py-1.5 text-right">
                          {e.greens[a]}s{e.pedMins && <span className="text-muted-foreground"> / ≥{e.pedMins[a]}</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-lg border border-amber bg-accent p-4 text-accent-foreground">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
            <Lightbulb className="size-4" aria-hidden="true" />
            {t("explain.counterfactual")}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed">{pick(e.counterfactual, lang)}</p>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("explain.narrative")}</h3>
            <button
              type="button"
              onClick={() => setOther((v) => !v)}
              aria-pressed={other}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
              lang={otherLang}
            >
              {t("explain.showOther", { lang: otherLang === "kn" ? "ಕನ್ನಡ" : "English" })}
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed" lang={lang}>
            {pick(e.narrative, lang)}
          </p>
          {other && (
            <p className="mt-3 border-l-4 border-primary pl-3 text-sm leading-relaxed text-muted-foreground" lang={otherLang}>
              {pick(e.narrative, otherLang)}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
