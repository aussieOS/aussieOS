export interface DemoWallet {
  wallet: string;
  label: string;
  description: string;
}

/**
 * Curated demo wallets. Every one of these has a real, calculator-computed
 * result behind it (see sample-data/results/ and the calculator's
 * scripts/generate-demo-wallets.ts) — nothing here is a fabricated or
 * hash-seeded score. They exist purely so the UI has a variety of real
 * states to demonstrate (high trust, low trust, sparse data, heavy redress
 * activity) without requiring a live on-chain deployment or a real
 * third-party wallet's data.
 */
export const DEMO_WALLETS: DemoWallet[] = [
  {
    wallet: "8pT7q2W4nZ3rY6uJ1xK9mD5vC0bH2fS7eL4gA6oR3sQ1",
    label: "Balanced Record",
    description: "Moderate trust signal with active appeal history.",
  },
  {
    wallet: "5VXSdL7BxgDjEDNX2hcGNNnzbN8tUbdunPpBS2Xop6Mp",
    label: "High Trust — Stable Record",
    description: "Steady grant rate, low task-failure rate, well-exercised redress process.",
  },
  {
    wallet: "Dv6eNLFw1honXdzKdUzGV2FHydfYN2wkLArYwLiMNTu5",
    label: "Low Trust — Erratic Record",
    description: "Grant rate swings sharply over time; high task-failure rate.",
  },
  {
    wallet: "9kzWnhkPavLaKD8rAUfC2oNa4VzQ4kY22UyzwcD2VC2u",
    label: "Sparse — New / Low Activity",
    description: "Only a handful of events — shows small-sample behaviour and a wider confidence range.",
  },
  {
    wallet: "5USjS2Rodv85eJSDwVWBvTnmcrZ3aJmDkGw8JFw2xpXq",
    label: "Heavy Redress Activity",
    description: "Many appeals, all resolved quickly, frequent disclosures.",
  },
];
