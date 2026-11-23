/**
 * Deterministic, template-based explanations in English and Kannada.
 * No external model or API: the same inputs always yield the same text.
 */
import {
  allocateGreens,
  CONFIDENCE_THRESHOLD,
  congestionScore,
  expectedScore,
  FALLBACK_GREEN_SECONDS,
  forecast,
  formatSimTime,
  levelFor,
  MODEL_VERSIONS,
  normalizeTo100,
  pedestrianMins,
  simMinute,
  type Demand,
  type Greens,
  type Horizon,
  type LaneCounts,
  type Level,
} from "./engine";
import { APPROACHES, JUNCTIONS, type ApproachId, type Bilingual, type JunctionId } from "./junctions";
import { demandsFor, observeJunction } from "./engine";

export type FactorKey =
  | "cars"
  | "twoWheelers"
  | "buses"
  | "pedestrians"
  | "fairness"
  | "currentLoad"
  | "timeTrend"
  | "queue"
  | "spillover"
  | "uncertainty";

export interface Factor {
  key: FactorKey;
  label: Bilingual;
  weight: number;
}

export interface Explanation {
  kind: "signal" | "prediction" | "override" | "corridor";
  junctionId: JunctionId;
  title: Bilingual;
  decision: Bilingual;
  modelVersion: string;
  confidence: number | null;
  factors: Factor[];
  rawInputs: Record<ApproachId, LaneCounts> | null;
  pedMins: Greens | null;
  greens: Greens | null;
  counterfactual: Bilingual;
  narrative: Bilingual;
  simTime: string;
}

export const DIRECTION: Record<ApproachId, Bilingual> = {
  N: { en: "North", kn: "ಉತ್ತರ" },
  E: { en: "East", kn: "ಪೂರ್ವ" },
  S: { en: "South", kn: "ದಕ್ಷಿಣ" },
  W: { en: "West", kn: "ಪಶ್ಚಿಮ" },
};

export const LEVEL_TEXT: Record<Level, Bilingual> = {
  low: { en: "Low", kn: "ಕಡಿಮೆ" },
  moderate: { en: "Moderate", kn: "ಮಧ್ಯಮ" },
  severe: { en: "Severe", kn: "ತೀವ್ರ" },
};

export const FACTOR_LABELS: Record<FactorKey, Bilingual> = {
  cars: { en: "Cars (×1.0)", kn: "ಕಾರುಗಳು (×1.0)" },
  twoWheelers: { en: "Two-wheelers (×0.5)", kn: "ದ್ವಿಚಕ್ರ ವಾಹನಗಳು (×0.5)" },
  buses: { en: "Buses (×3.0)", kn: "ಬಸ್‌ಗಳು (×3.0)" },
  pedestrians: { en: "Pedestrians (×1.5)", kn: "ಪಾದಚಾರಿಗಳು (×1.5)" },
  fairness: { en: "Wait fairness", kn: "ಕಾಯುವಿಕೆ ನ್ಯಾಯ" },
  currentLoad: { en: "Current load", kn: "ಪ್ರಸ್ತುತ ದಟ್ಟಣೆ" },
  timeTrend: { en: "Time-of-day trend", kn: "ಸಮಯದ ಪ್ರವೃತ್ತಿ" },
  queue: { en: "Queue wait times", kn: "ಸರತಿ ಕಾಯುವ ಸಮಯ" },
  spillover: { en: "Neighbour spillover", kn: "ನೆರೆಯ ಜಂಕ್ಷನ್ ಪ್ರಭಾವ" },
  uncertainty: { en: "Forecast uncertainty", kn: "ಮುನ್ಸೂಚನೆ ಅನಿಶ್ಚಿತತೆ" },
};

function factors(entries: [FactorKey, number][]): Factor[] {
  const weights = normalizeTo100(entries.map(([, v]) => v));
  return entries
    .map(([key], i) => ({ key, label: FACTOR_LABELS[key], weight: weights[i] ?? 0 }))
    .sort((x, y) => y.weight - x.weight);
}

function sumCounts(obs: Record<ApproachId, LaneCounts>) {
  return APPROACHES.reduce(
    (s, a) => ({
      cars: s.cars + obs[a].cars,
      twoWheelers: s.twoWheelers + obs[a].twoWheelers,
      buses: s.buses + obs[a].buses,
      pedestrians: s.pedestrians + obs[a].pedestrians,
    }),
    { cars: 0, twoWheelers: 0, buses: 0, pedestrians: 0 },
  );
}

function sumDemand(d: Record<ApproachId, Demand>) {
  return APPROACHES.reduce(
    (s, a) => ({
      cars: s.cars + d[a].cars,
      twoWheelers: s.twoWheelers + d[a].twoWheelers,
      buses: s.buses + d[a].buses,
      pedestrians: s.pedestrians + d[a].pedestrians,
      fairness: s.fairness + d[a].fairness,
      total: s.total + d[a].total,
    }),
    { cars: 0, twoWheelers: 0, buses: 0, pedestrians: 0, fairness: 0, total: 0 },
  );
}

export type SignalSource = "ai" | "fallback" | "override" | "corridor";

export interface SignalContext {
  junctionId: JunctionId;
  tick: number;
  obs: Record<ApproachId, LaneCounts>;
  demands: Record<ApproachId, Demand>;
  greens: Greens;
  aiGreens: Greens;
  source: SignalSource;
  confidence: number;
  corridorApproach?: ApproachId | null;
  overrideReason?: string | null;
  overrideUntil?: string | null;
}

export function explainSignal(ctx: SignalContext): Explanation {
  const j = JUNCTIONS[ctx.junctionId];
  const mins = pedestrianMins(j);
  const totals = sumDemand(ctx.demands);
  const counts = sumCounts(ctx.obs);
  const top = [...APPROACHES].sort((a, b) => ctx.demands[b].total - ctx.demands[a].total)[0]!;
  const topShare = Math.round((ctx.demands[top].total / (totals.total || 1)) * 100);
  const cycle = APPROACHES.reduce((s, a) => s + ctx.greens[a], 0);
  const widest = [...APPROACHES].sort((a, b) => mins[b] - mins[a])[0]!;
  const time = formatSimTime(simMinute(ctx.tick));
  const roadEn = j.approaches[top].road.en;
  const roadKn = j.approaches[top].road.kn;

  let decision: Bilingual;
  let counterfactual: Bilingual;
  let kind: Explanation["kind"] = "signal";

  if (ctx.source === "fallback") {
    decision = {
      en: `Safe fixed-timer mode: every approach gets an equal ${FALLBACK_GREEN_SECONDS} s green because AI confidence is ${ctx.confidence}% (below ${CONFIDENCE_THRESHOLD}%).`,
      kn: `ಸುರಕ್ಷಿತ ಸ್ಥಿರ ಟೈಮರ್ ಮೋಡ್: AI ವಿಶ್ವಾಸ ${ctx.confidence}% (${CONFIDENCE_THRESHOLD}% ಕ್ಕಿಂತ ಕಡಿಮೆ) ಇರುವುದರಿಂದ ಪ್ರತಿ ದಿಕ್ಕಿಗೂ ಸಮಾನ ${FALLBACK_GREEN_SECONDS} ಸೆಕೆಂಡ್ ಹಸಿರು.`,
    };
    counterfactual = {
      en: `If confidence stays at or above ${CONFIDENCE_THRESHOLD}% for 3 consecutive ticks, adaptive timing resumes and would give ${DIRECTION[top].en} ${ctx.aiGreens[top]} s instead of ${ctx.greens[top]} s.`,
      kn: `ವಿಶ್ವಾಸ ಸತತ 3 ಟಿಕ್‌ಗಳ ಕಾಲ ${CONFIDENCE_THRESHOLD}% ಅಥವಾ ಹೆಚ್ಚು ಇದ್ದರೆ, ಹೊಂದಾಣಿಕೆ ಸಮಯ ಮರಳುತ್ತದೆ ಮತ್ತು ${DIRECTION[top].kn} ದಿಕ್ಕಿಗೆ ${ctx.greens[top]} ಬದಲು ${ctx.aiGreens[top]} ಸೆಕೆಂಡ್ ನೀಡುತ್ತದೆ.`,
    };
  } else if (ctx.source === "corridor" && ctx.corridorApproach) {
    kind = "corridor";
    const c = ctx.corridorApproach;
    decision = {
      en: `Green corridor: ${DIRECTION[c].en} approach is held green for an ambulance. Cross traffic was stopped only after its pedestrian minimum was served.`,
      kn: `ಹಸಿರು ಕಾರಿಡಾರ್: ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಾಗಿ ${DIRECTION[c].kn} ದಿಕ್ಕನ್ನು ಹಸಿರಾಗಿ ಹಿಡಿದಿಡಲಾಗಿದೆ. ಪಾದಚಾರಿ ಕನಿಷ್ಠ ಸಮಯ ಪೂರ್ಣಗೊಂಡ ನಂತರವೇ ಅಡ್ಡ ಸಂಚಾರ ನಿಲ್ಲಿಸಲಾಯಿತು.`,
    };
    counterfactual = {
      en: `Without pre-emption the ambulance would wait for the normal cycle — up to about ${cycle - ctx.greens[c]} s at this junction.`,
      kn: `ಆದ್ಯತೆ ಇಲ್ಲದಿದ್ದರೆ ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಾಮಾನ್ಯ ಚಕ್ರಕ್ಕಾಗಿ ಕಾಯಬೇಕಾಗುತ್ತಿತ್ತು — ಈ ಜಂಕ್ಷನ್‌ನಲ್ಲಿ ಸುಮಾರು ${cycle - ctx.greens[c]} ಸೆಕೆಂಡ್‌ವರೆಗೆ.`,
    };
  } else if (ctx.source === "override") {
    kind = "override";
    decision = {
      en: `Operator override active until ${ctx.overrideUntil ?? "—"} (sim). Reason: “${ctx.overrideReason ?? ""}”. Pedestrian minimums are still enforced.`,
      kn: `ಆಪರೇಟರ್ ಬದಲಾವಣೆ ${ctx.overrideUntil ?? "—"} (ಅನುಕರಣೆ) ವರೆಗೆ ಸಕ್ರಿಯ. ಕಾರಣ: “${ctx.overrideReason ?? ""}”. ಪಾದಚಾರಿ ಕನಿಷ್ಠ ಸಮಯ ಇನ್ನೂ ಜಾರಿಯಲ್ಲಿದೆ.`,
    };
    counterfactual = {
      en: `Without the override, AI timing would give ${DIRECTION[top].en} ${ctx.aiGreens[top]} s (currently ${ctx.greens[top]} s).`,
      kn: `ಬದಲಾವಣೆ ಇಲ್ಲದಿದ್ದರೆ, AI ಸಮಯ ${DIRECTION[top].kn} ದಿಕ್ಕಿಗೆ ${ctx.aiGreens[top]} ಸೆಕೆಂಡ್ ನೀಡುತ್ತಿತ್ತು (ಈಗ ${ctx.greens[top]} ಸೆಕೆಂಡ್).`,
    };
  } else {
    const o = ctx.obs[top];
    const useBuses = o.buses >= 2;
    const altObs = {
      ...ctx.obs,
      [top]: useBuses ? { ...o, buses: Math.floor(o.buses / 2) } : { ...o, twoWheelers: Math.floor(o.twoWheelers / 2) },
    } as Record<ApproachId, LaneCounts>;
    const alt = allocateGreens(demandsFor(altObs), mins)[top];
    decision = {
      en: `${roadEn} (${DIRECTION[top].en}) gets the longest green — ${ctx.greens[top]} s of a ${cycle} s green cycle — because it carries ${topShare}% of current weighted demand (${ctx.demands[top].total} points).`,
      kn: `${roadKn} (${DIRECTION[top].kn}) ಗೆ ಅತಿ ಹೆಚ್ಚು ಹಸಿರು — ${cycle} ಸೆಕೆಂಡ್ ಚಕ್ರದಲ್ಲಿ ${ctx.greens[top]} ಸೆಕೆಂಡ್ — ಏಕೆಂದರೆ ಇದು ಪ್ರಸ್ತುತ ತೂಕದ ಬೇಡಿಕೆಯ ${topShare}% (${ctx.demands[top].total} ಅಂಕಗಳು) ಹೊಂದಿದೆ.`,
    };
    counterfactual = useBuses
      ? {
          en: `If ${DIRECTION[top].en} had half as many buses (${o.buses} → ${Math.floor(o.buses / 2)}), its green would change from ${ctx.greens[top]} s to ${alt} s.`,
          kn: `${DIRECTION[top].kn} ದಿಕ್ಕಿನಲ್ಲಿ ಅರ್ಧದಷ್ಟು ಬಸ್‌ಗಳಿದ್ದರೆ (${o.buses} → ${Math.floor(o.buses / 2)}), ಅದರ ಹಸಿರು ${ctx.greens[top]} ರಿಂದ ${alt} ಸೆಕೆಂಡ್‌ಗೆ ಬದಲಾಗುತ್ತಿತ್ತು.`,
        }
      : {
          en: `If ${DIRECTION[top].en} had half as many two-wheelers (${o.twoWheelers} → ${Math.floor(o.twoWheelers / 2)}), its green would change from ${ctx.greens[top]} s to ${alt} s.`,
          kn: `${DIRECTION[top].kn} ದಿಕ್ಕಿನಲ್ಲಿ ಅರ್ಧದಷ್ಟು ದ್ವಿಚಕ್ರ ವಾಹನಗಳಿದ್ದರೆ (${o.twoWheelers} → ${Math.floor(o.twoWheelers / 2)}), ಅದರ ಹಸಿರು ${ctx.greens[top]} ರಿಂದ ${alt} ಸೆಕೆಂಡ್‌ಗೆ ಬದಲಾಗುತ್ತಿತ್ತು.`,
        };
  }

  const narrative: Bilingual = {
    en: `At ${j.name.en} (${time} simulated), ${MODEL_VERSIONS.signal} counted ${counts.cars} cars, ${counts.twoWheelers} two-wheelers, ${counts.buses} buses and ${counts.pedestrians} pedestrians across all four approaches. Each bus counts three times a car because it moves many more people, and each pedestrian counts 1.5×. Longer waits add fairness points so no approach is starved. ${DIRECTION[top].en} currently has the highest weighted demand. Every green is locked at or above its pedestrian crossing minimum — for example ${mins[widest]} s on the ${j.approaches[widest].crossingWidthM} m ${DIRECTION[widest].en} crossing (7 s + ${j.approaches[widest].crossingWidthM} m ÷ 0.9 m/s). Model confidence is ${ctx.confidence}%.`,
    kn: `${j.name.kn} ನಲ್ಲಿ (${time} ಅನುಕರಣೆ), ${MODEL_VERSIONS.signal} ನಾಲ್ಕೂ ದಿಕ್ಕುಗಳಲ್ಲಿ ${counts.cars} ಕಾರುಗಳು, ${counts.twoWheelers} ದ್ವಿಚಕ್ರ ವಾಹನಗಳು, ${counts.buses} ಬಸ್‌ಗಳು ಮತ್ತು ${counts.pedestrians} ಪಾದಚಾರಿಗಳನ್ನು ಎಣಿಸಿದೆ. ಬಸ್ ಹೆಚ್ಚು ಜನರನ್ನು ಸಾಗಿಸುವುದರಿಂದ ಅದನ್ನು ಕಾರಿನ ಮೂರು ಪಟ್ಟು ಎಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ, ಪಾದಚಾರಿಗಳನ್ನು 1.5 ಪಟ್ಟು. ದೀರ್ಘ ಕಾಯುವಿಕೆಗೆ ನ್ಯಾಯ ಅಂಕಗಳು ಸೇರುತ್ತವೆ, ಹೀಗಾಗಿ ಯಾವುದೇ ದಿಕ್ಕು ವಂಚಿತವಾಗುವುದಿಲ್ಲ. ಈಗ ${DIRECTION[top].kn} ದಿಕ್ಕಿನಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ತೂಕದ ಬೇಡಿಕೆ ಇದೆ. ಪ್ರತಿ ಹಸಿರು ಸಮಯವೂ ಪಾದಚಾರಿ ದಾಟುವ ಕನಿಷ್ಠಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗದಂತೆ ಲಾಕ್ ಆಗಿದೆ — ಉದಾಹರಣೆಗೆ ${DIRECTION[widest].kn} ದಿಕ್ಕಿನ ${j.approaches[widest].crossingWidthM} ಮೀ ದಾಟುವಿಕೆಗೆ ${mins[widest]} ಸೆಕೆಂಡ್ (7 ಸೆ + ${j.approaches[widest].crossingWidthM} ಮೀ ÷ 0.9 ಮೀ/ಸೆ). ಮಾದರಿಯ ವಿಶ್ವಾಸ ${ctx.confidence}%.`,
  };

  return {
    kind,
    junctionId: ctx.junctionId,
    title: { en: `Signal timing · ${j.name.en}`, kn: `ಸಿಗ್ನಲ್ ಸಮಯ · ${j.name.kn}` },
    decision,
    modelVersion: MODEL_VERSIONS.signal,
    confidence: ctx.confidence,
    factors: factors([
      ["cars", totals.cars],
      ["twoWheelers", totals.twoWheelers],
      ["buses", totals.buses],
      ["pedestrians", totals.pedestrians],
      ["fairness", totals.fairness],
    ]),
    rawInputs: ctx.obs,
    pedMins: mins,
    greens: ctx.greens,
    counterfactual,
    narrative,
    simTime: time,
  };
}

export function explainPrediction(jid: JunctionId, tick: number, horizon: Horizon): Explanation {
  const j = JUNCTIONS[jid];
  const f = forecast(jid, tick, horizon);
  const now = congestionScore(jid, tick);
  const obs = observeJunction(jid, tick);
  const avgWait = Math.round(APPROACHES.reduce((s, a) => s + obs[a].waitSec, 0) / 4);
  const neighborAvg = Math.round(j.neighbors.reduce((s, n) => s + congestionScore(n, tick), 0) / j.neighbors.length);
  const trendDelta = Math.round(expectedScore(jid, tick + horizon) - expectedScore(jid, tick));
  const spill = Math.round(neighborAvg * 0.08);
  const altScore = Math.max(0, f.score - spill);
  const altLevel = levelFor(altScore);
  const target = formatSimTime(simMinute(tick + horizon));
  const time = formatSimTime(simMinute(tick));
  const rising = trendDelta >= 0;

  return {
    kind: "prediction",
    junctionId: jid,
    title: { en: `Forecast +${horizon} min · ${j.name.en}`, kn: `+${horizon} ನಿಮಿಷ ಮುನ್ಸೂಚನೆ · ${j.name.kn}` },
    decision: {
      en: `${j.name.en} is expected to be ${LEVEL_TEXT[f.level].en} (${f.score}/100) at ${target} — ${horizon} minutes from now.`,
      kn: `${j.name.kn} ${target} ಕ್ಕೆ — ಈಗಿನಿಂದ ${horizon} ನಿಮಿಷಗಳಲ್ಲಿ — ${LEVEL_TEXT[f.level].kn} (${f.score}/100) ಆಗುವ ನಿರೀಕ್ಷೆ.`,
    },
    modelVersion: MODEL_VERSIONS.prediction,
    confidence: f.confidence,
    factors: factors([
      ["currentLoad", now],
      ["timeTrend", Math.abs(trendDelta) * 2 + 4],
      ["queue", avgWait * 0.5],
      ["spillover", neighborAvg * 0.3],
      ["uncertainty", horizon * 0.4],
    ]),
    rawInputs: obs,
    pedMins: null,
    greens: null,
    counterfactual: {
      en: `Without spillover from neighbouring junctions (average ${neighborAvg}/100), the forecast would be about ${altScore}/100 — ${LEVEL_TEXT[altLevel].en}.`,
      kn: `ನೆರೆಯ ಜಂಕ್ಷನ್‌ಗಳ ಪ್ರಭಾವ (ಸರಾಸರಿ ${neighborAvg}/100) ಇಲ್ಲದಿದ್ದರೆ, ಮುನ್ಸೂಚನೆ ಸುಮಾರು ${altScore}/100 — ${LEVEL_TEXT[altLevel].kn} ಆಗಿರುತ್ತಿತ್ತು.`,
    },
    narrative: {
      en: `At ${time} (simulated) ${j.name.en} scores ${now}/100. The usual daily pattern is ${rising ? "rising" : "easing"} by about ${Math.abs(trendDelta)} points over the next ${horizon} minutes, average queue wait is ${avgWait} s, and neighbouring junctions average ${neighborAvg}/100. ${MODEL_VERSIONS.prediction} combines these into a ${LEVEL_TEXT[f.level].en.toLowerCase()} forecast of ${f.score}/100. Confidence is ${f.confidence}% and falls the further ahead it looks${f.confidence < CONFIDENCE_THRESHOLD ? " — treat this forecast with caution" : ""}.`,
      kn: `${time} ಕ್ಕೆ (ಅನುಕರಣೆ) ${j.name.kn} ಅಂಕ ${now}/100. ಸಾಮಾನ್ಯ ದೈನಂದಿನ ಮಾದರಿ ಮುಂದಿನ ${horizon} ನಿಮಿಷಗಳಲ್ಲಿ ಸುಮಾರು ${Math.abs(trendDelta)} ಅಂಕ ${rising ? "ಏರುತ್ತಿದೆ" : "ಇಳಿಯುತ್ತಿದೆ"}, ಸರಾಸರಿ ಸರತಿ ಕಾಯುವಿಕೆ ${avgWait} ಸೆಕೆಂಡ್, ನೆರೆಯ ಜಂಕ್ಷನ್‌ಗಳ ಸರಾಸರಿ ${neighborAvg}/100. ${MODEL_VERSIONS.prediction} ಇವುಗಳನ್ನು ಸೇರಿಸಿ ${f.score}/100 ರ ${LEVEL_TEXT[f.level].kn} ಮುನ್ಸೂಚನೆ ನೀಡುತ್ತದೆ. ವಿಶ್ವಾಸ ${f.confidence}%, ಮುಂದೆ ನೋಡಿದಷ್ಟೂ ಕಡಿಮೆಯಾಗುತ್ತದೆ${f.confidence < CONFIDENCE_THRESHOLD ? " — ಈ ಮುನ್ಸೂಚನೆಯನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಬಳಸಿ" : ""}.`,
    },
    simTime: time,
  };
}
