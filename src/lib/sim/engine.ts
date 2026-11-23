/**
 * Deterministic traffic simulation. Every value is a pure function of
 * (junction, approach, tick) seeded through mulberry32, so any tick — past or
 * future — can be recomputed identically. 1 tick = 1 simulated minute.
 */
import { APPROACHES, JUNCTIONS, type ApproachId, type JunctionDef, type JunctionId } from "./junctions";
import { rngFor } from "./prng";

export const MODEL_VERSIONS = {
  prediction: "ethiflow-pred-v1.0.0",
  signal: "ethiflow-sig-v1.0.0",
  accident: "ethiflow-acc-v1.0.0",
} as const;

export const SIM_START_MINUTE = 8 * 60 + 30; // 08:30 simulated
export const TICK_MS = 5000;
export const HISTORY_MINUTES = 120;
export const HORIZONS = [15, 30, 60] as const;
export type Horizon = (typeof HORIZONS)[number];

/** Demand formula weights (PRD). */
export const DEMAND_WEIGHTS = { cars: 1.0, twoWheelers: 0.5, buses: 3.0, pedestrians: 1.5 } as const;
/** Wait-fairness points per second of average wait. */
export const FAIRNESS_PER_SECOND = 0.25;

export const CONFIDENCE_THRESHOLD = 70;
export const RECOVERY_TICKS = 3;
export const FALLBACK_GREEN_SECONDS = 60;
export const AMBER_SECONDS = 3;
export const ALL_RED_SECONDS = 2;
export const GREEN_BUDGET_SECONDS = 140;
export const MAX_GREEN_SECONDS = 75;
export const PEDESTRIAN_WALK_SPEED = 0.9; // m/s
export const PEDESTRIAN_START_SECONDS = 7;

export type Level = "low" | "moderate" | "severe";

export interface LaneCounts {
  cars: number;
  twoWheelers: number;
  buses: number;
  pedestrians: number;
  /** Average wait in seconds. */
  waitSec: number;
}

export interface Demand {
  cars: number;
  twoWheelers: number;
  buses: number;
  pedestrians: number;
  fairness: number;
  total: number;
}

export type Greens = Record<ApproachId, number>;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export function simMinute(tick: number): number {
  return SIM_START_MINUTE + tick;
}

export function formatSimTime(minute: number): string {
  const m = ((minute % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const gauss = (x: number, mu: number, sigma: number) => Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));

/** City-wide demand curve by minute of day: morning peak ~09:15, evening ~18:30. */
export function trafficCurve(minuteOfDay: number): number {
  const m = ((minuteOfDay % 1440) + 1440) % 1440;
  return 0.3 + 0.75 * gauss(m, 555, 70) + 0.8 * gauss(m, 1110, 80) + 0.15 * gauss(m, 810, 90);
}

export function pedestrianMinGreen(crossingWidthM: number): number {
  return Math.ceil(PEDESTRIAN_START_SECONDS + crossingWidthM / PEDESTRIAN_WALK_SPEED);
}

export function pedestrianMins(j: JunctionDef): Greens {
  return {
    N: pedestrianMinGreen(j.approaches.N.crossingWidthM),
    E: pedestrianMinGreen(j.approaches.E.crossingWidthM),
    S: pedestrianMinGreen(j.approaches.S.crossingWidthM),
    W: pedestrianMinGreen(j.approaches.W.crossingWidthM),
  };
}

export function observeApproach(jid: JunctionId, aid: ApproachId, tick: number): LaneCounts {
  const j = JUNCTIONS[jid];
  const r = rngFor("obs", jid, aid, tick);
  const intensity = trafficCurve(simMinute(tick)) * j.base * j.approaches[aid].weight;
  return {
    cars: Math.round(intensity * 38 * (0.85 + 0.3 * r())),
    twoWheelers: Math.round(intensity * 64 * (0.85 + 0.3 * r())),
    buses: Math.round(intensity * 5 * (0.7 + 0.6 * r())),
    pedestrians: Math.round((6 + intensity * 12) * (0.8 + 0.4 * r())),
    waitSec: Math.round(15 + intensity * 60 * (0.8 + 0.4 * r())),
  };
}

export function observeJunction(jid: JunctionId, tick: number): Record<ApproachId, LaneCounts> {
  return {
    N: observeApproach(jid, "N", tick),
    E: observeApproach(jid, "E", tick),
    S: observeApproach(jid, "S", tick),
    W: observeApproach(jid, "W", tick),
  };
}

/** cars×1.0 + twoWheelers×0.5 + buses×3.0 + pedestrians×1.5 + waitFairness */
export function computeDemand(c: LaneCounts): Demand {
  const cars = c.cars * DEMAND_WEIGHTS.cars;
  const twoWheelers = c.twoWheelers * DEMAND_WEIGHTS.twoWheelers;
  const buses = c.buses * DEMAND_WEIGHTS.buses;
  const pedestrians = c.pedestrians * DEMAND_WEIGHTS.pedestrians;
  const fairness = round1(c.waitSec * FAIRNESS_PER_SECOND);
  return { cars, twoWheelers, buses, pedestrians, fairness, total: round1(cars + twoWheelers + buses + pedestrians + fairness) };
}

export function demandsFor(obs: Record<ApproachId, LaneCounts>): Record<ApproachId, Demand> {
  return { N: computeDemand(obs.N), E: computeDemand(obs.E), S: computeDemand(obs.S), W: computeDemand(obs.W) };
}

/** Proportional green split. Never below the pedestrian minimum, never above MAX_GREEN. */
export function allocateGreens(demands: Record<ApproachId, Demand>, mins: Greens): Greens {
  const total = APPROACHES.reduce((s, a) => s + demands[a].total, 0) || 1;
  const out = {} as Greens;
  for (const a of APPROACHES) {
    const raw = (GREEN_BUDGET_SECONDS * demands[a].total) / total;
    out[a] = clamp(Math.round(raw), mins[a], Math.max(mins[a], MAX_GREEN_SECONDS));
  }
  return out;
}

export function fallbackGreens(mins: Greens): Greens {
  return {
    N: Math.max(FALLBACK_GREEN_SECONDS, mins.N),
    E: Math.max(FALLBACK_GREEN_SECONDS, mins.E),
    S: Math.max(FALLBACK_GREEN_SECONDS, mins.S),
    W: Math.max(FALLBACK_GREEN_SECONDS, mins.W),
  };
}

/** Clamp any requested green times up to the pedestrian minimum. Returns which were raised. */
export function enforcePedestrianMinimum(requested: Greens, mins: Greens): { greens: Greens; raised: ApproachId[] } {
  const greens = { ...requested };
  const raised: ApproachId[] = [];
  for (const a of APPROACHES) {
    if (!(greens[a] >= mins[a])) {
      greens[a] = mins[a];
      raised.push(a);
    }
  }
  return { greens, raised };
}

/** Expected congestion score without noise (used for forecasts). */
export function expectedScore(jid: JunctionId, tick: number): number {
  return trafficCurve(simMinute(tick)) * JUNCTIONS[jid].base * 75;
}

export function congestionScore(jid: JunctionId, tick: number): number {
  const r = rngFor("score", jid, tick);
  return clamp(Math.round(expectedScore(jid, tick) + (r() - 0.5) * 10), 3, 99);
}

export function levelFor(score: number): Level {
  if (score >= 70) return "severe";
  if (score >= 40) return "moderate";
  return "low";
}

export function liveConfidence(jid: JunctionId, tick: number, forcedLow: boolean): number {
  const r = rngFor("conf", jid, tick);
  return forcedLow ? Math.round(52 + r() * 14) : Math.round(80 + r() * 15);
}

export interface Forecast {
  horizon: Horizon;
  score: number;
  level: Level;
  confidence: number;
}

export function forecast(jid: JunctionId, tick: number, horizon: Horizon): Forecast {
  const r = rngFor("fc", jid, tick, horizon);
  const drift = (r() - 0.5) * horizon * 0.25;
  const score = clamp(Math.round(expectedScore(jid, tick + horizon) + drift), 3, 99);
  const confidence = clamp(Math.round(94 - horizon * 0.33 - r() * 5), 40, 99);
  return { horizon, score, level: levelFor(score), confidence };
}

export interface TrendPoint {
  minute: number;
  time: string;
  actual: number | null;
  forecast: number | null;
  low: number | null;
  high: number | null;
}

/** 2-hour history (actual) + 60-minute forecast with a widening uncertainty band. */
export function trendSeries(jid: JunctionId, tick: number): TrendPoint[] {
  const pts: TrendPoint[] = [];
  for (let t = tick - HISTORY_MINUTES; t <= tick; t += 5) {
    const minute = simMinute(t);
    const actual = congestionScore(jid, t);
    pts.push({ minute, time: formatSimTime(minute), actual, forecast: t === tick ? actual : null, low: null, high: null });
  }
  for (let h = 5; h <= 60; h += 5) {
    const r = rngFor("fc-series", jid, tick, h);
    const f = clamp(Math.round(expectedScore(jid, tick + h) + (r() - 0.5) * h * 0.25), 3, 99);
    const spread = 3 + h * 0.18;
    const minute = simMinute(tick + h);
    pts.push({
      minute,
      time: formatSimTime(minute),
      actual: null,
      forecast: f,
      low: clamp(Math.round(f - spread), 0, 100),
      high: clamp(Math.round(f + spread), 0, 100),
    });
  }
  return pts;
}

export interface FallbackState {
  active: boolean;
  okStreak: number;
}

/** Enter fallback when confidence < 70%; resume AI only after 3 consecutive ticks ≥ 70%. */
export function nextFallback(prev: FallbackState, confidence: number): FallbackState {
  if (confidence < CONFIDENCE_THRESHOLD) return { active: true, okStreak: 0 };
  if (!prev.active) return { active: false, okStreak: 0 };
  const okStreak = prev.okStreak + 1;
  return okStreak >= RECOVERY_TICKS ? { active: false, okStreak: 0 } : { active: true, okStreak };
}

/** Largest-remainder rounding so integer percentages always sum to exactly 100. */
export function normalizeTo100(values: number[]): number[] {
  const safe = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const sum = safe.reduce((s, v) => s + v, 0);
  if (sum === 0) {
    const even = safe.map(() => Math.floor(100 / safe.length));
    let rest = 100 - even.reduce((s, v) => s + v, 0);
    for (let i = 0; rest > 0; i++, rest--) even[i % even.length]! += 1;
    return even;
  }
  const exact = safe.map((v) => (v / sum) * 100);
  const floors = exact.map(Math.floor);
  let rest = 100 - floors.reduce((s, v) => s + v, 0);
  const order = exact.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((x, y) => y.frac - x.frac);
  for (let k = 0; rest > 0; k++, rest--) floors[order[k % order.length]!.i]! += 1;
  return floors;
}

/** Typical fixed-time plan used as the baseline for impact comparisons. */
export const BASELINE_FIXED_GREEN = 20;
