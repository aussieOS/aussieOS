// Mirrors calculator/src/types.ts::FgvResult. Duplicated intentionally —
// the dashboard is a separate deployable package with no dependency on the
// calculator package, per the repo's "no shared runtime coupling between
// components" split. If FgvResult's shape changes, this must be updated by
// hand; there is no build-time link enforcing them to match.
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
  timestamp: string;
  schema_version: number;
  audit_window_start: string;
  audit_window_end: string;
  sample_size?: number;
  /** Hex SHA-256 of the raw evidence file — not part of the calculator's
   * FgvResult output itself (see calculator/src/types.ts), but attached
   * here so bundled demo data and pasted JSON can carry it through to the
   * "Verifiable Input Hash" display without the dashboard recomputing
   * anything. Optional: absent when the source didn't provide it. */
  evidence_hash_hex?: string;
}

/** What's actually stored on-chain — deliberately NOT the same shape as
 * FgvResult. There is no A/T/O/D on-chain (ADR-005: evidence, not logic) —
 * only the aggregate FGV, its confidence interval, and attestation metadata. */
export interface OnChainAttestation {
  wallet: string;
  fgv: number; // fixed-point u32 (SCALE = 1_000_000)
  ci_lower: number;
  ci_upper: number;
  audit_window_start: number; // unix seconds
  audit_window_end: number; // unix seconds
  evidence_hash: Uint8Array; // 32 bytes
  auditor: string; // base58 pubkey
  created_at: number; // unix seconds
  schema_version: number;
  bump: number;
}

/** What the dashboard actually renders, regardless of where each field came
 * from. Fields are nullable individually so partial data (e.g. an on-chain
 * attestation with no matching off-chain breakdown) can still be displayed
 * honestly, with each field's provenance shown rather than merged silently. */
export interface DisplayRecord {
  wallet: string;
  fgv: number | null;
  A: number | null;
  T: number | null;
  O: number | null;
  D: number | null;
  confidence: { lower: number; upper: number } | null;
  timestamp: string | null;
  evidenceHashHex: string | null;
  auditWindowStart: string | null;
  auditWindowEnd: string | null;
  schemaVersion: number | null;
  onChain: OnChainAttestation | null; // null if no live attestation was found
  breakdownSource: "on-chain" | "off-chain-bundled" | "pasted-json" | null;
}
