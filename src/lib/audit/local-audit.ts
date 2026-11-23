/**
 * Append-only, SHA-256 hash-chained decision log kept on this device.
 * Each row stores prev_hash + row_hash; editing any row breaks every later hash.
 */
import type { Bilingual, JunctionId } from "@/lib/sim/junctions";
import type { Explanation } from "@/lib/sim/explain";

export const AUDIT_KEY = "ethiflow.audit.v1";
export const GENESIS_HASH = "0".repeat(64);

export type AuditAction =
  | "fallback_enter"
  | "fallback_exit"
  | "low_confidence_sim"
  | "corridor_start"
  | "corridor_complete"
  | "override_set"
  | "override_expired"
  | "override_cleared";

export interface AuditInput {
  simTime: string;
  tick: number;
  actor: string;
  role: string;
  action: AuditAction;
  junctionId: JunctionId;
  summary: Bilingual;
  reason: string | null;
  explanation: Explanation | null;
}

export interface AuditEntry extends AuditInput {
  id: string;
  seq: number;
  at: string;
  prev_hash: string;
  row_hash: string;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Canonical payload hashed for a row (everything except row_hash). */
export function canonicalPayload(e: Omit<AuditEntry, "row_hash">): string {
  return JSON.stringify([
    e.seq,
    e.id,
    e.at,
    e.simTime,
    e.tick,
    e.actor,
    e.role,
    e.action,
    e.junctionId,
    e.summary,
    e.reason,
    e.explanation,
    e.prev_hash,
  ]);
}

export async function computeRowHash(e: Omit<AuditEntry, "row_hash">): Promise<string> {
  return sha256Hex(canonicalPayload(e));
}

export async function verifyChain(entries: AuditEntry[]): Promise<{ ok: boolean; brokenAt: number | null }> {
  let prev = GENESIS_HASH;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const { row_hash, ...rest } = e;
    if (e.prev_hash !== prev || (await computeRowHash(rest)) !== row_hash) return { ok: false, brokenAt: e.seq };
    prev = row_hash;
  }
  return { ok: true, brokenAt: null };
}

type Listener = () => void;

class AuditLog {
  private entries: AuditEntry[] = [];
  private listeners = new Set<Listener>();
  private queue: Promise<void> = Promise.resolve();
  private loaded = false;

  private load() {
    if (this.loaded || typeof window === "undefined") return;
    this.loaded = true;
    try {
      const raw = window.localStorage.getItem(AUDIT_KEY);
      this.entries = raw ? (JSON.parse(raw) as AuditEntry[]) : [];
    } catch {
      this.entries = [];
    }
  }

  getEntries = () => {
    this.load();
    return this.entries;
  };

  subscribe = (l: Listener) => {
    this.load();
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  /** Append only — there is intentionally no update or delete API. */
  append(input: AuditInput): Promise<void> {
    this.load();
    this.queue = this.queue.then(async () => {
      const prev = this.entries[this.entries.length - 1];
      const seq = (prev?.seq ?? 0) + 1;
      const base = {
        ...input,
        seq,
        id: `AUD-${String(seq).padStart(5, "0")}`,
        at: new Date().toISOString(),
        prev_hash: prev?.row_hash ?? GENESIS_HASH,
      };
      const row_hash = await computeRowHash(base);
      this.entries = [...this.entries, { ...base, row_hash }];
      try {
        window.localStorage.setItem(AUDIT_KEY, JSON.stringify(this.entries.slice(-500)));
      } catch {
        /* storage full — keep in memory */
      }
      this.listeners.forEach((l) => l());
    });
    return this.queue;
  }
}

export const auditLog = new AuditLog();
