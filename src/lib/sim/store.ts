import {
  ALL_RED_SECONDS,
  AMBER_SECONDS,
  allocateGreens,
  BASELINE_FIXED_GREEN,
  congestionScore,
  demandsFor,
  enforcePedestrianMinimum,
  fallbackGreens,
  forecast,
  formatSimTime,
  levelFor,
  liveConfidence,
  nextFallback,
  observeJunction,
  pedestrianMins,
  simMinute,
  type Demand,
  type FallbackState,
  type Greens,
  type LaneCounts,
  type Level,
} from "./engine";
import { explainSignal, type Explanation, type SignalSource } from "./explain";
import { APPROACHES, JUNCTION_IDS, JUNCTIONS, type ApproachId, type JunctionId } from "./junctions";
import { rngFor } from "./prng";

export const CORRIDOR_HOLD_SECONDS = 25;
export const LOW_CONFIDENCE_TICKS = 4;
const IDLE_FUEL_L_PER_SEC = 0.00025;
const CO2_KG_PER_L = 2.31;

export type Stage = "green" | "amber" | "allred";

export interface SignalState {
  phase: ApproachId;
  stage: Stage;
  remaining: number;
  elapsedGreen: number;
  greens: Greens;
  source: SignalSource;
}

export interface Override {
  mode: "split" | "hold";
  greens: Greens | null;
  approach: ApproachId | null;
  reason: string;
  durationMin: number;
  untilTick: number;
  createdTick: number;
  actor: string;
  role: string;
}

export interface Corridor {
  approach: ApproachId;
  status: "clearing" | "active";
  holdRemaining: number;
  startedTick: number;
}

export interface JunctionRuntime {
  id: JunctionId;
  obs: Record<ApproachId, LaneCounts>;
  demands: Record<ApproachId, Demand>;
  score: number;
  level: Level;
  confidence: number;
  fallback: FallbackState;
  aiGreens: Greens;
  pedMins: Greens;
  signal: SignalState;
  override: Override | null;
  corridor: Corridor | null;
  lowUntilTick: number;
}

export type AlertKind = "severe" | "forecast" | "fallback" | "corridor" | "override";
export interface Alert {
  id: string;
  kind: AlertKind;
  junctionId: JunctionId;
  score: number;
  confidence: number;
}

export interface ImpactTotals {
  fuelL: number;
  co2Kg: number;
  ambulanceMin: number;
  waitFixed: number;
  waitAi: number;
  pedChecks: number;
  pedOkAi: number;
  pedOkBaseline: number;
}

export interface SimState {
  tick: number;
  running: boolean;
  junctions: Record<JunctionId, JunctionRuntime>;
  alerts: Alert[];
  impact: ImpactTotals;
}

export type SimEventType =
  | "fallback_enter"
  | "fallback_exit"
  | "low_confidence_sim"
  | "corridor_start"
  | "corridor_complete"
  | "override_set"
  | "override_expired"
  | "override_cleared";

export interface SimEvent {
  type: SimEventType;
  junctionId: JunctionId;
  tick: number;
  simTime: string;
  approach?: ApproachId | null;
  confidence?: number;
  override?: Override | null;
  explanation: Explanation;
  actor?: string;
  role?: string;
}

const nextApproach = (a: ApproachId): ApproachId => APPROACHES[(APPROACHES.indexOf(a) + 1) % 4]!;

function planFor(j: JunctionRuntime): { greens: Greens; source: SignalSource } {
  if (j.corridor) return { greens: j.signal.greens, source: "corridor" };
  if (j.override?.mode === "split" && j.override.greens) return { greens: j.override.greens, source: "override" };
  if (j.override?.mode === "hold") return { greens: j.signal.greens, source: "override" };
  if (j.fallback.active) return { greens: fallbackGreens(j.pedMins), source: "fallback" };
  return { greens: j.aiGreens, source: "ai" };
}

export function signalContext(j: JunctionRuntime, tick: number) {
  const plan = planFor(j);
  return {
    junctionId: j.id,
    tick,
    obs: j.obs,
    demands: j.demands,
    greens: plan.source === "corridor" || (plan.source === "override" && j.override?.mode === "hold") ? j.signal.greens : plan.greens,
    aiGreens: j.aiGreens,
    source: plan.source,
    confidence: j.confidence,
    corridorApproach: j.corridor?.approach ?? null,
    overrideReason: j.override?.reason ?? null,
    overrideUntil: j.override ? formatSimTime(simMinute(j.override.untilTick)) : null,
  };
}

export function explainJunctionSignal(j: JunctionRuntime, tick: number): Explanation {
  return explainSignal(signalContext(j, tick));
}

function emptyImpact(): ImpactTotals {
  return { fuelL: 0, co2Kg: 0, ambulanceMin: 0, waitFixed: 0, waitAi: 0, pedChecks: 0, pedOkAi: 0, pedOkBaseline: 0 };
}

function accumulateImpact(impact: ImpactTotals, j: JunctionRuntime): ImpactTotals {
  const totals = APPROACHES.map((a) => j.demands[a].total);
  const max = Math.max(...totals);
  const min = Math.min(...totals);
  const imbalance = max > 0 ? (max - min) / max : 0;
  const improvement = j.fallback.active ? 0 : 0.12 + 0.18 * imbalance;
  let fixed = 0;
  for (const a of APPROACHES) {
    const o = j.obs[a];
    fixed += (o.cars + o.twoWheelers + o.buses) * o.waitSec;
  }
  const ai = fixed * (1 - improvement);
  const fuel = (fixed - ai) * IDLE_FUEL_L_PER_SEC;
  const baselineOk = APPROACHES.filter((a) => BASELINE_FIXED_GREEN >= j.pedMins[a]).length;
  return {
    ...impact,
    fuelL: impact.fuelL + fuel,
    co2Kg: impact.co2Kg + fuel * CO2_KG_PER_L,
    waitFixed: impact.waitFixed + fixed,
    waitAi: impact.waitAi + ai,
    pedChecks: impact.pedChecks + 4,
    pedOkAi: impact.pedOkAi + 4,
    pedOkBaseline: impact.pedOkBaseline + baselineOk,
  };
}

function buildRuntime(id: JunctionId, tick: number, prev?: JunctionRuntime): JunctionRuntime {
  const def = JUNCTIONS[id];
  const obs = observeJunction(id, tick);
  const demands = demandsFor(obs);
  const pedMins = pedestrianMins(def);
  const score = congestionScore(id, tick);
  const lowUntilTick = prev?.lowUntilTick ?? -1;
  const confidence = liveConfidence(id, tick, tick < lowUntilTick);
  const fallback = nextFallback(prev?.fallback ?? { active: false, okStreak: 0 }, confidence);
  const aiGreens = allocateGreens(demands, pedMins);
  const startPhase = APPROACHES[id.length % 4]!;
  const signal: SignalState = prev?.signal ?? {
    phase: startPhase,
    stage: "green",
    remaining: Math.max(pedMins[startPhase], aiGreens[startPhase] - ((id.length * 7) % 12)),
    elapsedGreen: 0,
    greens: aiGreens,
    source: "ai",
  };
  return {
    id,
    obs,
    demands,
    score,
    level: levelFor(score),
    confidence,
    fallback,
    aiGreens,
    pedMins,
    signal,
    override: prev?.override ?? null,
    corridor: prev?.corridor ?? null,
    lowUntilTick,
  };
}

function deriveAlerts(junctions: Record<JunctionId, JunctionRuntime>, tick: number): Alert[] {
  const out: Alert[] = [];
  for (const id of JUNCTION_IDS) {
    const j = junctions[id];
    const base = { junctionId: id, score: j.score, confidence: j.confidence };
    if (j.corridor) out.push({ id: `corridor-${id}`, kind: "corridor", ...base });
    if (j.fallback.active) out.push({ id: `fallback-${id}`, kind: "fallback", ...base });
    if (j.level === "severe") out.push({ id: `severe-${id}`, kind: "severe", ...base });
    else if (forecast(id, tick, 15).level === "severe") out.push({ id: `forecast-${id}`, kind: "forecast", ...base });
    if (j.override) out.push({ id: `override-${id}`, kind: "override", ...base });
  }
  const rank: Record<AlertKind, number> = { corridor: 0, fallback: 1, severe: 2, override: 3, forecast: 4 };
  return out.sort((a, b) => rank[a.kind] - rank[b.kind]);
}

export function createInitialState(): SimState {
  let impact = emptyImpact();
  // Pre-roll an hour of "shift so far" so impact totals start meaningful (deterministic).
  for (let t = -60; t < 0; t++) {
    for (const id of JUNCTION_IDS) impact = accumulateImpact(impact, buildRuntime(id, t));
  }
  const junctions = {} as Record<JunctionId, JunctionRuntime>;
  for (const id of JUNCTION_IDS) junctions[id] = buildRuntime(id, 0);
  return { tick: 0, running: true, junctions, alerts: deriveAlerts(junctions, 0), impact };
}

/** Advance one simulated minute (5 s live tick or manual step). */
export function advanceTick(state: SimState): { state: SimState; events: Omit<SimEvent, "explanation">[] } {
  const tick = state.tick + 1;
  const events: Omit<SimEvent, "explanation">[] = [];
  const junctions = {} as Record<JunctionId, JunctionRuntime>;
  let impact = state.impact;
  const simTime = formatSimTime(simMinute(tick));

  for (const id of JUNCTION_IDS) {
    const prev = state.junctions[id];
    const next = buildRuntime(id, tick, prev);
    if (!prev.fallback.active && next.fallback.active)
      events.push({ type: "fallback_enter", junctionId: id, tick, simTime, confidence: next.confidence });
    if (prev.fallback.active && !next.fallback.active)
      events.push({ type: "fallback_exit", junctionId: id, tick, simTime, confidence: next.confidence });
    if (next.override && tick >= next.override.untilTick) {
      events.push({ type: "override_expired", junctionId: id, tick, simTime, override: next.override });
      next.override = null;
    }
    junctions[id] = next;
    impact = accumulateImpact(impact, next);
  }
  return { state: { ...state, tick, junctions, impact, alerts: deriveAlerts(junctions, tick) }, events };
}

/** Advance every signal controller by one real second. */
export function advanceSecond(state: SimState): { state: SimState; events: Omit<SimEvent, "explanation">[] } {
  const events: Omit<SimEvent, "explanation">[] = [];
  const junctions = { ...state.junctions };
  let impact = state.impact;
  let alertsDirty = false;
  const simTime = formatSimTime(simMinute(state.tick));

  for (const id of JUNCTION_IDS) {
    const j = { ...junctions[id] };
    const s: SignalState = { ...j.signal };
    let corridor = j.corridor ? { ...j.corridor } : null;
    const holdTarget = corridor?.approach ?? (j.override?.mode === "hold" ? j.override.approach : null);

    if (s.stage === "green") s.elapsedGreen += 1;

    let skipDecrement = false;
    if (holdTarget && s.stage === "green") {
      if (s.phase === holdTarget) {
        if (corridor) {
          corridor.status = "active";
          corridor.holdRemaining -= 1;
          s.remaining = Math.max(0, corridor.holdRemaining);
          skipDecrement = true;
          if (corridor.holdRemaining <= 0) {
            const r = rngFor("amb", id, corridor.startedTick);
            impact = { ...impact, ambulanceMin: impact.ambulanceMin + 1.2 + r() * 1.6 };
            events.push({ type: "corridor_complete", junctionId: id, tick: state.tick, simTime, approach: corridor.approach });
            corridor = null;
            alertsDirty = true;
          }
        } else {
          s.remaining = Math.max(s.remaining, 1);
          skipDecrement = true;
        }
      } else {
        // Cut short for pre-emption — but never before the pedestrian minimum is served.
        const pedLeft = Math.max(0, j.pedMins[s.phase] - s.elapsedGreen);
        s.remaining = Math.min(s.remaining, pedLeft + 1);
      }
    }

    if (!skipDecrement) s.remaining -= 1;

    if (s.remaining <= 0 && !(skipDecrement && corridor)) {
      if (s.stage === "green") {
        s.stage = "amber";
        s.remaining = AMBER_SECONDS;
      } else if (s.stage === "amber") {
        s.stage = "allred";
        s.remaining = ALL_RED_SECONDS;
      } else {
        const target = corridor?.approach ?? (j.override?.mode === "hold" ? j.override.approach : null);
        const nextPhase = target ?? nextApproach(s.phase);
        const plan = planFor({ ...j, corridor });
        s.phase = nextPhase;
        s.stage = "green";
        s.elapsedGreen = 0;
        s.greens = plan.greens;
        s.source = corridor ? "corridor" : plan.source;
        s.remaining = corridor && nextPhase === corridor.approach ? CORRIDOR_HOLD_SECONDS : plan.greens[nextPhase];
        if (corridor && nextPhase === corridor.approach) corridor.status = "active";
      }
    }
    j.signal = s;
    j.corridor = corridor;
    junctions[id] = j;
  }
  return {
    state: { ...state, junctions, impact, alerts: alertsDirty ? deriveAlerts(junctions, state.tick) : state.alerts },
    events,
  };
}

type Listener = () => void;

export class SimStore {
  private state: SimState;
  private listeners = new Set<Listener>();
  onEvent: ((e: SimEvent) => void) | null = null;

  constructor(initial?: SimState) {
    this.state = initial ?? createInitialState();
  }

  getState = () => this.state;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private set(next: SimState, events: Omit<SimEvent, "explanation">[] = []) {
    this.state = next;
    for (const e of events) {
      const j = next.junctions[e.junctionId];
      this.onEvent?.({ ...e, explanation: explainJunctionSignal(j, next.tick) });
    }
    this.listeners.forEach((l) => l());
  }

  tick = () => {
    const r = advanceTick(this.state);
    this.set(r.state, r.events);
  };

  second = () => {
    const r = advanceSecond(this.state);
    this.set(r.state, r.events);
  };

  setRunning = (running: boolean) => this.set({ ...this.state, running });

  private patchJunction(id: JunctionId, patch: Partial<JunctionRuntime>, events: Omit<SimEvent, "explanation">[] = []) {
    const junctions = { ...this.state.junctions, [id]: { ...this.state.junctions[id], ...patch } };
    this.set({ ...this.state, junctions, alerts: deriveAlerts(junctions, this.state.tick) }, events);
  }

  simulateLowConfidence = (id: JunctionId, actor: string, role: string) => {
    const j = this.state.junctions[id];
    const tick = this.state.tick;
    // Applies immediately: recompute this tick's confidence and fallback state.
    const confidence = liveConfidence(id, tick, true);
    const fallback = nextFallback(j.fallback, confidence);
    const simTime = formatSimTime(simMinute(tick));
    const events: Omit<SimEvent, "explanation">[] = [
      { type: "low_confidence_sim", junctionId: id, tick, simTime, confidence, actor, role },
    ];
    if (!j.fallback.active && fallback.active) events.push({ type: "fallback_enter", junctionId: id, tick, simTime, confidence });
    this.patchJunction(id, { lowUntilTick: tick + 1 + LOW_CONFIDENCE_TICKS, confidence, fallback }, events);
  };

  simulateAmbulance = (id: JunctionId, approach: ApproachId, actor: string, role: string) => {
    const tick = this.state.tick;
    this.patchJunction(
      id,
      { corridor: { approach, status: "clearing", holdRemaining: CORRIDOR_HOLD_SECONDS, startedTick: tick } },
      [{ type: "corridor_start", junctionId: id, tick, simTime: formatSimTime(simMinute(tick)), approach, actor, role }],
    );
  };

  setOverride = (id: JunctionId, o: Omit<Override, "untilTick" | "createdTick">) => {
    const tick = this.state.tick;
    const j = this.state.junctions[id];
    const greens = o.mode === "split" && o.greens ? enforcePedestrianMinimum(o.greens, j.pedMins).greens : null;
    const override: Override = { ...o, greens, createdTick: tick, untilTick: tick + o.durationMin };
    this.patchJunction(id, { override }, [
      {
        type: "override_set",
        junctionId: id,
        tick,
        simTime: formatSimTime(simMinute(tick)),
        override,
        approach: o.approach,
        actor: o.actor,
        role: o.role,
      },
    ]);
  };

  clearOverride = (id: JunctionId, actor: string, role: string) => {
    const tick = this.state.tick;
    const j = this.state.junctions[id];
    this.patchJunction(id, { override: null }, [
      { type: "override_cleared", junctionId: id, tick, simTime: formatSimTime(simMinute(tick)), override: j.override, actor, role },
    ]);
  };
}
