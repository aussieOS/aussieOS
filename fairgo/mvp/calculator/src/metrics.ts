import { BehaviourEvent } from "./types";

/**
 * ============================================================================
 * IMPORTANT — READ BEFORE CHANGING WEIGHTS OR RELYING ON THESE NUMBERS
 * ============================================================================
 * The brief names four metrics — Access Parity, Treatment Parity, Outcome
 * Parity, Disclosure & Redress — using language that implies comparison
 * across peer groups (i.e. "true" statistical parity: did group X get
 * treated like group Y). But the MVP data model is a single wallet's own
 * event log, with protected attributes, social graph, and cross-wallet
 * comparison explicitly OUT OF SCOPE (per the brief's exclusion list).
 *
 * That means genuine parity — comparing this actor's treatment of different
 * groups — cannot be computed from the data the MVP collects. What follows
 * are single-wallet PROXIES that approximate the spirit of each metric using
 * only within-wallet signals (rate levels and rate stability over time).
 * They are placeholders to prove the pipeline (ADR: "MVP exists to prove
 * the pipeline, not the perfect formula"), not a validated fairness
 * methodology. Flagging this explicitly rather than silently presenting
 * these as if they were true parity measures.
 * ============================================================================
 */

const MIN_EVENTS_FOR_VARIANCE = 4; // below this, we can't meaningfully bucket
const BUCKET_COUNT = 4;
const APPEAL_SLA_SECONDS = 7 * 24 * 60 * 60; // 7 days — arbitrary MVP target, make configurable later
const DISCLOSURE_FULL_CREDIT_COUNT = 3; // arbitrary MVP threshold

function toMillis(iso: string): number {
  return new Date(iso).getTime();
}

/** Splits [windowStart, windowEnd] into BUCKET_COUNT equal-width buckets and
 * returns the bucket index (0-based) for a given timestamp. */
function bucketIndex(
  timestamp: string,
  windowStart: string,
  windowEnd: string
): number {
  const start = toMillis(windowStart);
  const end = toMillis(windowEnd);
  const t = toMillis(timestamp);
  const span = Math.max(end - start, 1);
  const frac = Math.min(Math.max((t - start) / span, 0), 0.999999);
  return Math.floor(frac * BUCKET_COUNT);
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return (
    values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / values.length
  );
}

/** Bucketed rate-stability score: groups pairs of (numerator, denominator)
 * events into time buckets, computes a rate per non-empty bucket, and
 * returns 1 minus normalized variance across buckets (higher = more stable
 * behaviour over the audit window). Falls back to the flat overall rate
 * when there isn't enough data to bucket meaningfully. */
function stabilityScore(
  numeratorEvents: BehaviourEvent[],
  denominatorEvents: BehaviourEvent[],
  windowStart: string,
  windowEnd: string
): number {
  const total = denominatorEvents.length;
  if (total === 0) return 0.5; // neutral default: no signal either way

  const overallRate = numeratorEvents.length / total;
  if (total < MIN_EVENTS_FOR_VARIANCE) return overallRate;

  const numByBucket = new Array(BUCKET_COUNT).fill(0);
  const denomByBucket = new Array(BUCKET_COUNT).fill(0);

  for (const e of denominatorEvents) {
    denomByBucket[bucketIndex(e.timestamp, windowStart, windowEnd)] += 1;
  }
  for (const e of numeratorEvents) {
    numByBucket[bucketIndex(e.timestamp, windowStart, windowEnd)] += 1;
  }

  const bucketRates: number[] = [];
  for (let i = 0; i < BUCKET_COUNT; i++) {
    if (denomByBucket[i] > 0) bucketRates.push(numByBucket[i] / denomByBucket[i]);
  }

  if (bucketRates.length < 2) return overallRate; // can't measure variance from one bucket

  // Max possible variance for values bounded in [0,1] is 0.25 (fully bimodal 0/1 split).
  const MAX_VARIANCE = 0.25;
  const normalizedVariance = Math.min(variance(bucketRates) / MAX_VARIANCE, 1);
  return 1 - normalizedVariance;
}

/** A — Access Parity (proxy): stability of the grant-vs-deny rate across
 * the audit window. A wallet that swings wildly between granting and
 * denying access over time scores lower than one with a steady policy. */
export function accessParity(
  events: BehaviourEvent[],
  windowStart: string,
  windowEnd: string
): number {
  const granted = events.filter((e) => e.type === "access_granted");
  const denied = events.filter((e) => e.type === "access_denied");
  const allDecisions = [...granted, ...denied];
  return stabilityScore(granted, allDecisions, windowStart, windowEnd);
}

/** T — Treatment Parity (proxy): stability of the task completion rate
 * across the audit window — i.e. does this actor's task success rate stay
 * consistent over time, or drift/spike (which would suggest comparable
 * tasks aren't being treated comparably at different times). */
export function treatmentParity(
  events: BehaviourEvent[],
  windowStart: string,
  windowEnd: string
): number {
  const completed = events.filter((e) => e.type === "task_completed");
  const failed = events.filter((e) => e.type === "task_failed");
  const allOutcomes = [...completed, ...failed];
  return stabilityScore(completed, allOutcomes, windowStart, windowEnd);
}

/** O — Outcome Parity (proxy): the actual level of the task completion rate
 * (not its stability) — i.e. in aggregate, did accepted tasks actually get
 * completed successfully. */
export function outcomeParity(events: BehaviourEvent[]): number {
  const completed = events.filter((e) => e.type === "task_completed").length;
  const failed = events.filter((e) => e.type === "task_failed").length;
  const total = completed + failed;
  if (total === 0) return 0.5; // neutral: no task outcomes to judge
  return completed / total;
}

/** D — Disclosure & Redress: composite of (a) how completely appeals get
 * resolved, (b) how quickly, and (c) a small bounded credit for proactive
 * disclosures. Weights here (0.5/0.3/0.2) are an internal composite of D
 * only — distinct from the equal 25/25/25/25 weighting of A/T/O/D into FGV,
 * which is fixed by ADR-007 and not touched here. */
export function disclosureAndRedress(events: BehaviourEvent[]): number {
  const submitted = events.filter((e) => e.type === "appeal_submitted").length;
  const resolved = events.filter((e) => e.type === "appeal_resolved");

  const redressRate = submitted === 0 ? 1.0 : resolved.length / submitted;

  const resolutionTimes = resolved
    .map((e) => e.resolution_seconds)
    .filter((s): s is number => typeof s === "number");
  const speedScore =
    resolutionTimes.length === 0
      ? 0.5
      : clamp(
          1 -
            resolutionTimes.reduce((a, b) => a + b, 0) /
              resolutionTimes.length /
              APPEAL_SLA_SECONDS,
          0,
          1
        );

  const disclosureCount = events.filter(
    (e) => e.type === "disclosure_published"
  ).length;
  const disclosureScore = clamp(
    disclosureCount / DISCLOSURE_FULL_CREDIT_COUNT,
    0,
    1
  );

  return clamp(
    0.5 * redressRate + 0.3 * speedScore + 0.2 * disclosureScore,
    0,
    1
  );
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
