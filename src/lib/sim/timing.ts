import { ALL_RED_SECONDS, AMBER_SECONDS } from "./engine";
import { APPROACHES, type ApproachId } from "./junctions";
import type { SignalState } from "./store";

export type LampColor = "green" | "amber" | "red";

export function lampFor(signal: SignalState, approach: ApproachId): LampColor {
  if (signal.phase !== approach) return "red";
  if (signal.stage === "green") return "green";
  if (signal.stage === "amber") return "amber";
  return "red";
}

const next = (a: ApproachId): ApproachId => APPROACHES[(APPROACHES.indexOf(a) + 1) % 4]!;

/** Seconds until this approach next turns green under the current plan (0 if green now). */
export function secondsUntilGreen(signal: SignalState, approach: ApproachId): number {
  if (signal.phase === approach && signal.stage === "green") return 0;
  let t =
    signal.remaining +
    (signal.stage === "green" ? AMBER_SECONDS + ALL_RED_SECONDS : signal.stage === "amber" ? ALL_RED_SECONDS : 0);
  let p = next(signal.phase);
  while (p !== approach) {
    t += signal.greens[p] + AMBER_SECONDS + ALL_RED_SECONDS;
    p = next(p);
  }
  return t;
}
