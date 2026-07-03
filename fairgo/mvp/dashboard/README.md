# FairGo — Dashboard (MVP)

Read-only Next.js app. Displays exactly what the calculator and on-chain
program produce — no scoring logic lives here, no reinterpretation of
metrics, no submission/signing/broadcast capability anywhere in this
package (see `lib/solana.ts` — it can only call `getAccountInfo`).

## Setup

```bash
npm install
npm run dev
```

Optional env vars (`.env.local`):

```
NEXT_PUBLIC_FAIRGO_PROGRAM_ID=<deployed program id, after `anchor keys sync`>
NEXT_PUBLIC_SOLANA_RPC_URL=<devnet RPC endpoint, defaults to clusterApiUrl("devnet")>
```

## Two input modes (per brief: "wallet pubkey OR JSON input")

- **Subject Wallet** — derives the `Attestation` PDA for the given wallet and
  reads it directly from Solana Devnet (no backend, no indexer — a plain
  `Connection.getAccountInfo` call, decoded by hand in `lib/solana.ts`).
  Since the on-chain account never stores the A/T/O/D breakdown (ADR-005),
  this is combined with a small locally-bundled results registry
  (`lib/localResults.ts` / `sample-data/results/`) purely for the
  Behavioural Components section — and the UI always labels which source
  each part of the display came from, never merges silently.
- **Paste JSON** — accepts the exact `FGV Result` object the calculator's
  CLI prints. Useful before anything is actually deployed/published to
  Devnet, or for reviewing a result that hasn't been published yet. Always
  renders with the "Preview only — not submitted" label in the attestation
  panel, since pasted JSON obviously isn't on-chain.

## What this deliberately does not do

Per the brief's explicit exclusions: no multi-wallet comparison, no
leaderboard/ranking, no social graph, no "fairness verified" badge or
checkmark iconography, no group-parity interpretation layer, no
future-behaviour framing. The one cross-check the UI does perform — noting
whether a locally bundled breakdown's wallet matches the on-chain
attestation being viewed — is a plain-text field label, not a badge, and is
a mechanical fact (do these two records refer to the same wallet), not a
fairness judgment.

## Design tokens

- **Colour**: background `#0A0F0E` (near-black), primary accent teal
  `#00B4A6`, secondary accent gold `#C9A84C` (used only for the confidence
  range and other "measurement precision" data, never for primary actions).
- **Type**: Playfair Display (serif, restrained — wordmark and section
  eyebrow only), Inter (all UI labels/body), Space Mono (every actual data
  value — scores, hashes, addresses, timestamps). The consistent use of
  monospace specifically for computed/verifiable data, and serif/sans only
  for interface chrome, is the one deliberate visual signature: it reads as
  an instrument panel, not a consumer credit-score app.

## Honesty note on testing

This package was written and manually type-checked (`lib/types.ts`,
`format.ts`, `validate.ts`, `merge.ts`, `localResults.ts` all pass `tsc
--strict` clean — see repo history/sandbox log) but **not** run through
`next build` or `next dev` in the environment this was authored in, since
Next.js, Tailwind, and `@solana/web3.js` aren't installed there and it has
no network access to fetch them. Unlike the calculator (which was actually
executed end-to-end against sample data), treat this as carefully-written
but unexecuted code — run `npm install && npm run dev` and sanity-check the
wallet-lookup and JSON-paste flows before treating it as done.

## Files

- `app/page.tsx` — orchestration only (state, calling lib functions);
  contains no scoring or formatting logic itself.
- `lib/solana.ts` — read-only Devnet client; PDA derivation + manual Anchor
  account decode (avoids pulling in a full wallet-adapter-dependent Anchor
  client for a page that never signs anything).
- `lib/merge.ts` — combines on-chain + off-chain sources into one
  `DisplayRecord`, always tracking provenance per field.
- `lib/validate.ts` — parses/validates pasted JSON with specific error
  messages (never a generic "invalid input").
- `lib/format.ts` — fixed-point conversions; **must be kept in sync by hand**
  with `calculator/src/encode.ts` if that ever changes.
- `components/ResultsView.tsx` — the only place the prescribed UI language
  ("Trust Signal (FGV v1)", "Behavioural Components", "Statistical
  Confidence Range", "Verifiable Input Hash", "Subject Wallet") is used.
