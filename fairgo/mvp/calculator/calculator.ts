import { BehaviourLog, FgvResult } from "./types";
import {
  accessParity,
  treatmentParity,
  outcomeParity,
  disclosureAndRedress,
  clamp,
} from "./metrics";

export const SCHEMA_VERSION = 1;

/**
 * Confidence interval heuristic (per brief: "may initially be mocked or
 * estimated" — this is explicitly a mock, not a statistically derived CI).
 * Margin shrinks as the number of underlying events grows, bounded to a
 * sane range so the interval is never a single point or the full [0,1].
 */
function mockConfidenceInterval(
  fgv: number,
  sampleSize: number
): { lower: number; upper: number } {
  const margin = clamp(0.15 / Math.sqrt(Math.max(sampleSize, 1)), 0.02, 0.25);
  return {
    lower: clamp(fgv - margin, 0, 1),
    upper: clamp(fgv + margin, 0, 1),
  };
}

/**
 * Pure, deterministic: same BehaviourLog in -> same FgvResult out, always.
 * No blockchain dependency, no I/O, no wall-clock reads except stamping the
 * `timestamp` field on the result (the score itself never depends on when
 * you happen to run the calculation).
 */
export function computeFgv(log: BehaviourLog): FgvResult {
  const { wallet, audit_window_start, audit_window_end, events } = log;

  const A = accessParity(events, audit_window_start, audit_window_end);
  const T = treatmentParity(events, audit_window_start, audit_window_end);
  const O = outcomeParity(events);
  const D = disclosureAndRedress(events);

  // ADR-007: equal weighting, not configurable in MVP.
  const FGV = clamp((A + T + O + D) / 4, 0, 1);

  const confidence = mockConfidenceInterval(FGV, events.length);

  return {
    wallet,
    A: round6(A),
    T: round6(T),
    O: round6(O),
    D: round6(D),
    FGV: round6(FGV),
    confidence: {
      lower: round6(confidence.lower),
      upper: round6(confidence.upper),
    },
    timestamp: new Date().toISOString(),
    schema_version: SCHEMA_VERSION,
    audit_window_start,
    audit_window_end,
    sample_size: events.length,
  };
}

function round6(v: number): number {
  return Math.round(v * 1_000_000) / 1_000_000;
}
