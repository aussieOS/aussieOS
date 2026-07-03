import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { FgvResult } from "./types";

export const SCALE = 1_000_000; // must match `SCALE` in the Anchor program

/**
 * Hashes the RAW BYTES of the static evidence file on disk — not a
 * re-serialized JS object. This is deliberate: the whole point of the
 * evidence hash is that anyone can download the exact file this attestation
 * was computed from and independently reproduce this hash. Hashing a
 * re-stringified object would risk key-ordering/whitespace differences that
 * silently break that guarantee.
 */
export function hashEvidenceFile(evidenceFilePath: string): {
  hex: string;
  bytes: number[]; // 32 bytes, ready for the program's `evidence_hash: [u8; 32]`
} {
  const raw = readFileSync(evidenceFilePath);
  const digest = createHash("sha256").update(raw).digest();
  return { hex: digest.toString("hex"), bytes: Array.from(digest) };
}

function toUnixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function toFixedPoint(v: number): number {
  const scaled = Math.round(v * SCALE);
  if (scaled < 0 || scaled > SCALE) {
    throw new Error(
      `Value ${v} scales to ${scaled}, outside [0, ${SCALE}] — check calculator output before publishing.`
    );
  }
  return scaled;
}

export interface PublishAttestationArgs {
  wallet: string; // base58 pubkey string, as passed to the Anchor client
  fgv: number; // u32
  ci_lower: number; // u32
  ci_upper: number; // u32
  audit_window_start: number; // i64, unix seconds
  audit_window_end: number; // i64, unix seconds
  evidence_hash: number[]; // [u8; 32]
  schema_version: number; // u8
}

/**
 * Bridges calculator output -> exact args for the `publish_attestation`
 * instruction. This is the only place fixed-point scaling happens — the
 * calculator itself stays in plain 0.0-1.0 floats per the brief's spec, and
 * conversion to the chain's integer representation is isolated here so it
 * can be audited/tested on its own.
 */
export function buildPublishArgs(
  result: FgvResult,
  evidenceFilePath: string
): PublishAttestationArgs {
  const { bytes } = hashEvidenceFile(evidenceFilePath);

  return {
    wallet: result.wallet,
    fgv: toFixedPoint(result.FGV),
    ci_lower: toFixedPoint(result.confidence.lower),
    ci_upper: toFixedPoint(result.confidence.upper),
    audit_window_start: toUnixSeconds(result.audit_window_start),
    audit_window_end: toUnixSeconds(result.audit_window_end),
    evidence_hash: bytes,
    schema_version: result.schema_version,
  };
}
