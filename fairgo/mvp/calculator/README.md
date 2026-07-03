# FairGo — Off-chain Calculator (MVP)

Deterministic engine: `BehaviourLog` JSON in → `FgvResult` JSON out (ADR-004).
No blockchain dependency. Same input always produces the same A/T/O/D/FGV.

## Usage

```bash
npm install
npm run compute -- sample-data/wallet-example.json
```

Prints the `FgvResult` (matches the brief's spec: wallet, A, T, O, D, FGV,
confidence, timestamp) followed by the exact args for the on-chain
`publish_attestation` instruction (fixed-point scaled, evidence hash
computed, window converted to unix seconds) — see `src/encode.ts`.

To regenerate the sample evidence file:

```bash
npm run generate-sample-data
```

## ⚠️ Read this before trusting the A/T/O/D formulas

The brief names four metrics using language that implies true cross-group
parity (comparing how the actor treats different peer groups). But protected
attributes, social graphs, and cross-wallet comparison are explicitly out of
scope for the MVP — which means the data model literally cannot support real
parity computation yet. `src/metrics.ts` implements single-wallet **proxies**
instead (rate levels and rate-stability-over-time, computed only from one
wallet's own event log), clearly commented as placeholders. This is
sufficient to prove the pipeline end-to-end, per the ADRs, but the formulas
themselves need product/methodology sign-off before this is anything more
than a demo. Don't let a demo FGV number get treated as a validated fairness
score.

Specifically, v1 proxies:
- **A (Access Parity)** — stability of the grant/deny rate across time
  buckets within the audit window.
- **T (Treatment Parity)** — stability of the task completion rate across
  time buckets.
- **O (Outcome Parity)** — the actual level of the task completion rate.
- **D (Disclosure & Redress)** — weighted composite of appeal
  resolution-completeness, resolution speed vs. a 7-day target, and a capped
  credit for disclosures published. (These internal D weights are separate
  from, and don't affect, the fixed equal 25/25/25/25 weighting of A/T/O/D
  into FGV specified by ADR-007 — that combination is untouched.)

## Confidence interval

Explicitly a mock/heuristic per the brief ("may initially be mocked or
estimated") — margin shrinks with event count, bounded to [0.02, 0.25]. Not
a statistically derived interval. See `mockConfidenceInterval` in
`src/calculator.ts`.

## Evidence hash / independent verification

`evidence_hash` is the SHA-256 of the **raw bytes** of the behaviour JSON
file on disk — not a re-serialized object — so anyone can reproduce it
directly:

```bash
shasum -a 256 sample-data/wallet-example.json
```

For the committed sample file this is:
`8dbf59be4c8c9a005ebe7954522197512bd92eec8afcb0fa90549dc9d003a40e`

That hex string, converted to 32 bytes, is exactly what gets passed as
`evidence_hash` to `publish_attestation`.

## Files

- `src/types.ts` — the canonical `BehaviourEvent`/`BehaviourLog` schema
  (this is the evidence format spec — changing it changes what gets hashed).
- `src/metrics.ts` — A/T/O/D formulas, heavily commented.
- `src/calculator.ts` — combines metrics into FGV + confidence interval.
- `src/encode.ts` — scales floats to the fixed-point `u32` the on-chain
  program expects and computes the evidence hash.
- `src/cli.ts` — run the whole pipeline against a file.
- `scripts/generate-sample-data.ts` — regenerates the original sample
  evidence file (wallet `8pT7q2W4...`).
- `scripts/generate-demo-wallets.ts` — generates four additional curated
  demo wallets (high trust, low trust, sparse activity, heavy redress
  activity) used by the dashboard's "Demo Wallets" picker. **Every number
  these produce comes from the real calculator run against hand-authored
  event logs — nothing here is hash-seeded or invented from the wallet
  address.** If FairGo ever needs more demo wallets, extend this script,
  don't fabricate a result directly.
- `sample-data/` — the evidence files these scripts produce, one per demo
  wallet, named by wallet address.
