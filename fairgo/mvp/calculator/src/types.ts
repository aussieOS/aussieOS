// Canonical behaviour-event schema. This is the shape of the raw JSON that
// gets SHA-256 hashed and referenced on-chain as `evidence_hash` — so this
// file is effectively the evidence format spec, not just a TS convenience.

export type EventType =
  | "access_granted"
  | "access_denied"
  | "task_accepted"
  | "task_completed"
  | "task_failed"
  | "appeal_submitted"
  | "appeal_resolved"
  | "disclosure_published";

export interface BehaviourEvent {
  type: EventType;
  /** ISO 8601 timestamp of when the event occurred. */
  timestamp: string;
  /**
   * Only present on "appeal_resolved" events. "upheld" means the actor's
   * original decision was reversed in the appellant's favour (a successful
   * appeal); "denied" means the original decision stood.
   */
  outcome?: "upheld" | "denied";
  /**
   * Only present on "appeal_resolved" events: seconds elapsed between the
   * matching "appeal_submitted" event and this resolution.
   */
  resolution_seconds?: number;
  /** Free-form note — not used in scoring, carried through for audit context. */
  note?: string;
}

export interface BehaviourLog {
  wallet: string;
  audit_window_start: string; // ISO 8601
  audit_window_end: string; // ISO 8601
  events: BehaviourEvent[];
}

export interface FgvResult {
  wallet: string;
  A: number;
  T: number;
  O: number;
  D: number;
  FGV: number;
  confidence: {
    lower: number;
    upper: number;
  };
  timestamp: string; // ISO 8601, when this computation was run
  schema_version: number;
  audit_window_start: string;
  audit_window_end: string;
  /** Count of raw events the score was derived from — useful context, not itself part of FGV. */
  sample_size: number;
}
