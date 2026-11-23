import { JUNCTION_IDS } from "@/lib/sim/junctions";
import { useSim } from "@/lib/sim/provider";

/**
 * Global AI operating mode shown in the header chip.
 * "fallback" whenever any junction runs the safe fixed-timer (confidence < 70%).
 */
export type AiMode = "adaptive" | "fallback";

export function useAiMode(): { mode: AiMode; fallbackCount: number } {
  const fallbackCount = useSim((s) => JUNCTION_IDS.filter((id) => s.junctions[id].fallback.active).length);
  return { mode: fallbackCount > 0 ? "fallback" : "adaptive", fallbackCount };
}
