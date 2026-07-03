// Generates four additional demo wallets with deliberately varied, but
// entirely real and calculator-computed, behaviour profiles — same honest
// process as wallet-example.json, just more of them and more varied, so the
// dashboard's "Demo Wallets" picker has something worth exploring.
//
// This is NOT synthetic-score generation. Every number downstream is
// produced by the real calculator from these authored event logs — nothing
// is hash-seeded or invented after the fact.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BehaviourEvent, BehaviourLog } from "../src/types";
import { computeFgv } from "../src/calculator";
import { hashEvidenceFile } from "../src/encode";

const WINDOW_START = "2026-06-01T00:00:00.000Z";
const WINDOW_END = "2026-06-30T00:00:00.000Z";
const WINDOW_START_MS = Date.parse(WINDOW_START);
const WINDOW_END_MS = Date.parse(WINDOW_END);

function atFraction(frac: number): string {
  return new Date(WINDOW_START_MS + frac * (WINDOW_END_MS - WINDOW_START_MS)).toISOString();
}

function spreadEven(n: number, startFrac = 0, endFrac = 1): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(atFraction(startFrac + ((i + 0.5) / n) * (endFrac - startFrac)));
  }
  return out;
}

function plusHours(iso: string, hours: number): string {
  return new Date(Date.parse(iso) + hours * 60 * 60 * 1000).toISOString();
}
function plusDays(iso: string, days: number): string {
  return plusHours(iso, days * 24);
}

interface DemoWalletDef {
  wallet: string;
  label: string;
  description: string;
  buildEvents: () => BehaviourEvent[];
}

const DEMO_WALLETS: DemoWalletDef[] = [
  {
    wallet: "5VXSdL7BxgDjEDNX2hcGNNnzbN8tUbdunPpBS2Xop6Mp",
    label: "High Trust — Stable Record",
    description:
      "High, steady grant rate; low task-failure rate; one appeal (upheld the original decision — redress mechanism exercised, not a failure); active disclosure.",
    buildEvents: () => {
      const events: BehaviourEvent[] = [];
      spreadEven(148).forEach((t) => events.push({ type: "access_granted", timestamp: t }));
      spreadEven(2, 0.1, 0.9).forEach((t) => events.push({ type: "access_denied", timestamp: t }));
      spreadEven(60, 0.05, 0.95).forEach((t, i) => {
        events.push({ type: "task_accepted", timestamp: t });
        const outcome = plusHours(t, 2);
        if (i < 2) events.push({ type: "task_failed", timestamp: outcome });
        else events.push({ type: "task_completed", timestamp: outcome });
      });
      const appealAt = atFraction(0.4);
      events.push({ type: "appeal_submitted", timestamp: appealAt });
      events.push({
        type: "appeal_resolved",
        timestamp: plusDays(appealAt, 1),
        outcome: "denied", // original decision stood — appeal process worked, didn't need to reverse anything
        resolution_seconds: 1 * 24 * 60 * 60,
      });
      events.push({ type: "disclosure_published", timestamp: atFraction(0.2) });
      events.push({ type: "disclosure_published", timestamp: atFraction(0.7) });
      return events;
    },
  },
  {
    wallet: "Dv6eNLFw1honXdzKdUzGV2FHydfYN2wkLArYwLiMNTu5",
    label: "Low Trust — Erratic Record",
    description:
      "Grant rate swings sharply between time buckets; high task-failure rate; most appeals left unresolved by window end.",
    buildEvents: () => {
      const events: BehaviourEvent[] = [];
      // Deliberately uneven across the window: mostly grants early, mostly
      // denials late — creates real bucket-to-bucket variance, not a flat rate.
      spreadEven(38, 0.0, 0.25).forEach((t) => events.push({ type: "access_granted", timestamp: t }));
      spreadEven(2, 0.0, 0.25).forEach((t) => events.push({ type: "access_denied", timestamp: t }));
      spreadEven(4, 0.25, 0.5).forEach((t) => events.push({ type: "access_granted", timestamp: t }));
      spreadEven(16, 0.25, 0.5).forEach((t) => events.push({ type: "access_denied", timestamp: t }));
      spreadEven(18, 0.5, 0.75).forEach((t) => events.push({ type: "access_granted", timestamp: t }));
      spreadEven(2, 0.5, 0.75).forEach((t) => events.push({ type: "access_denied", timestamp: t }));
      spreadEven(2, 0.75, 1.0).forEach((t) => events.push({ type: "access_granted", timestamp: t }));
      spreadEven(18, 0.75, 1.0).forEach((t) => events.push({ type: "access_denied", timestamp: t }));

      spreadEven(30, 0.05, 0.95).forEach((t, i) => {
        events.push({ type: "task_accepted", timestamp: t });
        const outcome = plusHours(t, 3);
        if (i < 15) events.push({ type: "task_failed", timestamp: outcome });
        else events.push({ type: "task_completed", timestamp: outcome });
      });

      const appealTimes = spreadEven(4, 0.1, 0.9);
      appealTimes.forEach((t) => events.push({ type: "appeal_submitted", timestamp: t }));
      events.push({
        type: "appeal_resolved",
        timestamp: plusDays(appealTimes[0], 6),
        outcome: "upheld",
        resolution_seconds: 6 * 24 * 60 * 60,
      });
      // remaining 3 appeals left unresolved as of window end, deliberately.
      return events;
    },
  },
  {
    wallet: "9kzWnhkPavLaKD8rAUfC2oNa4VzQ4kY22UyzwcD2VC2u",
    label: "Sparse — New / Low Activity",
    description:
      "Only a handful of events in the window. Demonstrates the calculator's small-sample fallback behaviour and a wide confidence range.",
    buildEvents: () => {
      const events: BehaviourEvent[] = [];
      const times = spreadEven(4, 0.2, 0.8);
      events.push({ type: "access_granted", timestamp: times[0] });
      events.push({ type: "access_granted", timestamp: times[1] });
      events.push({ type: "access_denied", timestamp: times[2] });
      events.push({ type: "task_accepted", timestamp: times[3] });
      events.push({ type: "task_completed", timestamp: plusHours(times[3], 4) });
      return events;
    },
  },
  {
    wallet: "5USjS2Rodv85eJSDwVWBvTnmcrZ3aJmDkGw8JFw2xpXq",
    label: "Heavy Redress Activity",
    description:
      "Solid access/task record, but the standout is disclosure & redress: many appeals, all resolved quickly, frequent disclosures — isolates a high D score against moderate A/T/O.",
    buildEvents: () => {
      const events: BehaviourEvent[] = [];
      spreadEven(90).forEach((t) => events.push({ type: "access_granted", timestamp: t }));
      spreadEven(10, 0.05, 0.95).forEach((t) => events.push({ type: "access_denied", timestamp: t }));
      spreadEven(50, 0.05, 0.95).forEach((t, i) => {
        events.push({ type: "task_accepted", timestamp: t });
        const outcome = plusHours(t, 2);
        if (i < 5) events.push({ type: "task_failed", timestamp: outcome });
        else events.push({ type: "task_completed", timestamp: outcome });
      });
      const appealTimes = spreadEven(8, 0.05, 0.9);
      appealTimes.forEach((t, i) => {
        events.push({ type: "appeal_submitted", timestamp: t });
        events.push({
          type: "appeal_resolved",
          timestamp: plusHours(t, 18),
          outcome: i % 3 === 0 ? "upheld" : "denied",
          resolution_seconds: 18 * 60 * 60,
        });
      });
      spreadEven(5, 0.1, 0.9).forEach((t) => events.push({ type: "disclosure_published", timestamp: t }));
      return events;
    },
  },
];

const calculatorRoot = join(__dirname, "..");

const registryEntries: {
  wallet: string;
  label: string;
  description: string;
  evidenceHashHex: string;
}[] = [];

for (const def of DEMO_WALLETS) {
  const events = def.buildEvents().sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const log: BehaviourLog = {
    wallet: def.wallet,
    audit_window_start: WINDOW_START,
    audit_window_end: WINDOW_END,
    events,
  };

  const evidencePath = join(calculatorRoot, "sample-data", `${def.wallet}.json`);
  writeFileSync(evidencePath, JSON.stringify(log, null, 2) + "\n");

  const result = computeFgv(log);
  const { hex } = hashEvidenceFile(evidencePath);

  const resultWithHash = { ...result, evidence_hash_hex: hex };
  const resultPath = join(calculatorRoot, "..", "dashboard", "sample-data", "results", `${def.wallet}.json`);
  writeFileSync(resultPath, JSON.stringify(resultWithHash, null, 2) + "\n");

  registryEntries.push({
    wallet: def.wallet,
    label: def.label,
    description: def.description,
    evidenceHashHex: hex,
  });

  console.log(`${def.label} (${def.wallet}): FGV=${result.FGV} A=${result.A} T=${result.T} O=${result.O} D=${result.D} n=${result.sample_size}`);
}

writeFileSync(
  join(calculatorRoot, "scripts", "demo-wallet-registry.json"),
  JSON.stringify(registryEntries, null, 2) + "\n"
);
