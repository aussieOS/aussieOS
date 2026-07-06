# FairGo

**The Trust Layer for Autonomous Systems**

Wallets prove ownership. FairGo proves trust.

FairGo is a cultural-technical protocol from the [AussieOS](https://aussieos.xyz/) collective that encodes fairness as a measurable, auditable variable — the **FairGo Variable (FGV)** — across AI agents, DAOs, and autonomous systems more broadly. Identity tells you who. Authentication tells you it's really them. Payments tell you they paid. FairGo tells you whether to trust them.

- 📄 **Specification:** [Read on Notion](https://www.notion.so/FairGo-A-Cultural-Technical-Protocol-for-Measurable-Fairness-29593d942ed080efabafcce6269e4f96)
- 🌐 **Spec microsite:** [aussieos.xyz/fairgo](https://aussieos.xyz/fairgo/)
- 🔎 **Live MVP dashboard:** [fairgodashboard.netlify.app](https://fairgodashboard.netlify.app/)
- 🏠 **AussieOS home:** [aussieos.xyz](https://aussieos.xyz/)
- 🐦 **Twitter:** [@aussieosxyz](https://x.com/aussieosxyz/)
- ✉️ **Email:** aussieosxyz@gmail.com

---

## What's in this repo

| Component | Description |
|---|---|
| `fairgo.html` | The FairGo spec microsite. Single-file HTML/CSS/JS, dark theme, teal accent, no build step. Deployed at `aussieos.xyz/fairgo/`. |
| **FGV MVP** | A working reference implementation of the FairGo Variable — see below. |
| Specification (Notion) | The full FairGo paper: background, design goals, the FGV formula, governance (MatesDAO), agent instrumentation, threat model, Solana implementation sketch, roadmap, and appendices. |

---

## The FairGo Variable (FGV)

FGV is a composite score in **[0, 1]** computed from four normalised sub-metrics, each weighted equally by default (tunable by governance):

- **A** — Access Parity
- **T** — Treatment Parity
- **O** — Outcome Parity
- **D** — Disclosure & Redress

```
FGV = wA·A + wT·T + wO·O + wD·D,  where wA + wT + wO + wD = 1
CI  = ± k · √(σ² / n)
```

A worked example, the full formula derivation, dashboard schema, API endpoints, and event schema are all in the [specification](https://www.notion.so/FairGo-A-Cultural-Technical-Protocol-for-Measurable-Fairness-29593d942ed080efabafcce6269e4f96).

---

## FGV MVP

The MVP is a working, end-to-end reference implementation of FGV for Solana wallets and autonomous agents. It exists to prove the model computes real numbers from real inputs — not to simulate a result.

**Architecture:**
- **On-chain** — an Anchor program that stores FGV attestations and audit metadata.
- **Off-chain** — a TypeScript calculator that computes the four sub-metrics and the composite FGV from behaviour logs.
- **Dashboard** — a read-only Next.js frontend ([fairgodashboard.netlify.app](https://fairgodashboard.netlify.app/)) for looking up a wallet's computed FGV, its sub-metric breakdown, and confidence interval.

**What's real vs. illustrative:**
- Demo wallets use synthetic public keys with hand-authored behaviour logs, standing in for real on-chain activity during the pilot phase.
- Every score shown is **genuinely computed** from those logs using the equal-weighted formula above — nothing is fabricated, hard-coded, or extrapolated. If a wallet has no behaviour log, it has no score.

**Try it:** [fairgodashboard.netlify.app](https://fairgodashboard.netlify.app/) — "Check a Wallet" from either the dashboard or the [spec microsite](https://aussieos.xyz/fairgo/).

---

## Design system

The FairGo microsite and MVP dashboard share a visual language with the rest of AussieOS:

- **Colours:** background `#0A0A0A`, surface `#111111`, teal accent `#00B4A6`, gold secondary `#C9A84C`
- **Type:** Playfair Display (headings), Inter (body), Space Mono (labels/code)

---

## Governance

FGV's weights, thresholds, and dispute process are stewarded by **MatesDAO** — a reference governance pattern (forkable, non-binding) covering stewards, builders, auditors, and community roles. Full detail in the specification, Section 6.

---

## Roadmap

**90-day pilot:** metric research, specification release, 2–3 pilot actors onboarded, wallet-linked attestations via Solana Attestation Service, audit-tooling prototype.

**12-month:** open-source release of the full stack under CC BY-SA 4.0, ecosystem integration with external DAOs, independent third-party audits, adoption tracking.

Full targets and success metrics are in the specification, Section 12.

---

## Contributing

FairGo and MatesDAO are reference patterns, not a closed standard — forks, alternative governance structures, and regional adaptations are expected and welcome. Open an issue or reach out via [Twitter](https://x.com/aussieosxyz/) or [email](mailto:aussieosxyz@gmail.com) if you're building on this.

---

## License

FairGo's code is MIT licensed (see [LICENSE](./LICENSE)). Written material elsewhere in this repo (Built Different, Hall of Mirrors) is CC BY-SA 4.0 — see the root [LICENSE](./LICENSE) file.

---

*FairGo v1.0 — AussieOS Collective — October 2025*
