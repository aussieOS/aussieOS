import { DisplayRecord, FgvResult, OnChainAttestation } from "./types";
import {
  fromFixedPoint,
  bytesToHex,
  unixSecondsToIso,
} from "./format";

/**
 * Builds a DisplayRecord from whatever combination of on-chain attestation
 * and locally-bundled off-chain result was found for a wallet. Critically:
 * A/T/O/D never come from chain (ADR-005 — the program doesn't store them),
 * so `breakdownSource` is always tracked separately from whether an
 * on-chain attestation exists at all. Nothing here invents or infers a
 * value that wasn't actually present in a source.
 */
export function buildDisplayRecordFromWallet(
  wallet: string,
  onChain: OnChainAttestation | null,
  bundled: FgvResult | null
): DisplayRecord | null {
  if (!onChain && !bundled) return null;

  if (onChain) {
    return {
      wallet,
      fgv: fromFixedPoint(onChain.fgv),
      A: bundled ? bundled.A : null,
      T: bundled ? bundled.T : null,
      O: bundled ? bundled.O : null,
      D: bundled ? bundled.D : null,
      confidence: {
        lower: fromFixedPoint(onChain.ci_lower),
        upper: fromFixedPoint(onChain.ci_upper),
      },
      timestamp: unixSecondsToIso(onChain.created_at),
      evidenceHashHex: bytesToHex(onChain.evidence_hash),
      auditWindowStart: unixSecondsToIso(onChain.audit_window_start),
      auditWindowEnd: unixSecondsToIso(onChain.audit_window_end),
      schemaVersion: onChain.schema_version,
      onChain,
      breakdownSource: bundled ? "off-chain-bundled" : null,
    };
  }

  // No on-chain attestation — bundled result only.
  const b = bundled as FgvResult;
  return {
    wallet,
    fgv: b.FGV,
    A: b.A,
    T: b.T,
    O: b.O,
    D: b.D,
    confidence: b.confidence,
    timestamp: b.timestamp,
    evidenceHashHex: b.evidence_hash_hex ?? null,
    auditWindowStart: b.audit_window_start,
    auditWindowEnd: b.audit_window_end,
    schemaVersion: b.schema_version,
    onChain: null,
    breakdownSource: "off-chain-bundled",
  };
}

export function buildDisplayRecordFromPastedJson(
  parsed: FgvResult
): DisplayRecord {
  return {
    wallet: parsed.wallet,
    fgv: parsed.FGV,
    A: parsed.A,
    T: parsed.T,
    O: parsed.O,
    D: parsed.D,
    confidence: parsed.confidence,
    timestamp: parsed.timestamp,
    evidenceHashHex: parsed.evidence_hash_hex ?? null,
    auditWindowStart: parsed.audit_window_start,
    auditWindowEnd: parsed.audit_window_end,
    schemaVersion: parsed.schema_version,
    onChain: null,
    breakdownSource: "pasted-json",
  };
}
