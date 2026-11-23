import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { auditLog, type AuditInput } from "@/lib/audit/local-audit";
import { TICK_MS } from "./engine";
import { DIRECTION } from "./explain";
import { JUNCTIONS } from "./junctions";
import { SimStore, type SimEvent, type SimState } from "./store";

const SimContext = createContext<SimStore | null>(null);

function summaryFor(e: SimEvent): AuditInput["summary"] {
  const name = JUNCTIONS[e.junctionId].name;
  const dir = e.approach ? DIRECTION[e.approach] : null;
  switch (e.type) {
    case "fallback_enter":
      return {
        en: `${name.en}: confidence ${e.confidence}% < 70% — switched to safe 60 s fixed-timer fallback`,
        kn: `${name.kn}: ವಿಶ್ವಾಸ ${e.confidence}% < 70% — ಸುರಕ್ಷಿತ 60 ಸೆ ಸ್ಥಿರ ಟೈಮರ್‌ಗೆ ಬದಲಾಯಿತು`,
      };
    case "fallback_exit":
      return {
        en: `${name.en}: 3 ticks ≥ 70% confidence — adaptive AI timing resumed`,
        kn: `${name.kn}: 3 ಟಿಕ್ ≥ 70% ವಿಶ್ವಾಸ — ಹೊಂದಾಣಿಕೆ AI ಸಮಯ ಮರಳಿತು`,
      };
    case "low_confidence_sim":
      return {
        en: `${name.en}: low-confidence condition simulated (${e.confidence}%)`,
        kn: `${name.kn}: ಕಡಿಮೆ ವಿಶ್ವಾಸ ಸ್ಥಿತಿ ಅನುಕರಿಸಲಾಗಿದೆ (${e.confidence}%)`,
      };
    case "corridor_start":
      return {
        en: `${name.en}: green corridor requested for ambulance on ${dir?.en} approach`,
        kn: `${name.kn}: ${dir?.kn} ದಿಕ್ಕಿನ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಹಸಿರು ಕಾರಿಡಾರ್ ವಿನಂತಿ`,
      };
    case "corridor_complete":
      return {
        en: `${name.en}: ambulance cleared ${dir?.en} approach — normal cycle resumed`,
        kn: `${name.kn}: ಆಂಬ್ಯುಲೆನ್ಸ್ ${dir?.kn} ದಿಕ್ಕು ದಾಟಿತು — ಸಾಮಾನ್ಯ ಚಕ್ರ ಮರಳಿತು`,
      };
    case "override_set":
      return e.override?.mode === "hold" && e.override.approach
        ? {
            en: `${name.en}: operator held ${DIRECTION[e.override.approach].en} green for ${e.override.durationMin} min`,
            kn: `${name.kn}: ಆಪರೇಟರ್ ${DIRECTION[e.override.approach].kn} ಹಸಿರನ್ನು ${e.override.durationMin} ನಿಮಿಷ ಹಿಡಿದಿಟ್ಟರು`,
          }
        : {
            en: `${name.en}: operator set a custom green split for ${e.override?.durationMin} min`,
            kn: `${name.kn}: ಆಪರೇಟರ್ ${e.override?.durationMin} ನಿಮಿಷಕ್ಕೆ ಹೊಸ ಹಸಿರು ಹಂಚಿಕೆ ಹೊಂದಿಸಿದರು`,
          };
    case "override_expired":
      return { en: `${name.en}: operator override expired`, kn: `${name.kn}: ಆಪರೇಟರ್ ಬದಲಾವಣೆ ಮುಕ್ತಾಯ` };
    case "override_cleared":
      return { en: `${name.en}: operator override cleared`, kn: `${name.kn}: ಆಪರೇಟರ್ ಬದಲಾವಣೆ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ` };
  }
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new SimStore());
  const seconds = useRef(0);
  const running = useSyncExternalStore(store.subscribe, () => store.getState().running, () => true);

  useEffect(() => {
    store.onEvent = (e) => {
      void auditLog.append({
        simTime: e.simTime,
        tick: e.tick,
        actor: e.actor ?? "EthiFlow AI",
        role: e.role ?? "system",
        action: e.type,
        junctionId: e.junctionId,
        summary: summaryFor(e),
        reason: e.override?.reason ?? null,
        explanation: e.explanation,
      });
    };
    return () => {
      store.onEvent = null;
    };
  }, [store]);

  useEffect(() => {
    if (!running) return;
    const perTick = TICK_MS / 1000;
    const id = window.setInterval(() => {
      store.second();
      seconds.current += 1;
      if (seconds.current % perTick === 0) store.tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [store, running]);

  return <SimContext.Provider value={store}>{children}</SimContext.Provider>;
}

export function useSimStore(): SimStore {
  const s = useContext(SimContext);
  if (!s) throw new Error("useSimStore must be used within SimulationProvider");
  return s;
}

/** Subscribe to a slice of simulation state. Selector must return stable references or primitives. */
export function useSim<T>(selector: (s: SimState) => T): T {
  const store = useSimStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

export function useAuditEntries() {
  return useSyncExternalStore(auditLog.subscribe, auditLog.getEntries, () => []);
}
