// Deterministic generator for sample-data/wallet-example.json.
// Not part of the calculator's runtime path — this is a one-off authoring
// tool. Re-run with `npx ts-node scripts/generate-sample-data.ts` if the
// example numbers ever need to change; the committed JSON file is the
// actual evidence artifact that gets hashed and published.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BehaviourEvent, BehaviourLog } from "../src/types";

const WINDOW_START = "2026-06-01T00:00:00.000Z";
const WINDOW_END = "2026-06-30T00:00:00.000Z";
const WINDOW_START_MS = Date.parse(WINDOW_START);
const WINDOW_END_MS = Date.parse(WINDOW_END);

// Spread N events evenly across the window, in order.
function spread(n: number, offsetFrac = 0): string[] {
  const span = WINDOW_END_MS - WINDOW_START_MS;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const frac = (i + 0.5 + offsetFrac) / n;
    out.push(new Date(WINDOW_START_MS + frac * span).toISOString());
  }
  return out;
}

const events: BehaviourEvent[] = [];

// 100 access requests: 95 granted, 5 denied — matches the brief's example.
// Denials placed at roughly evenly spaced points rather than clustered, to
// represent a wallet with a broadly stable (if imperfect) access policy.
const grantedTimes = spread(95);
const deniedTimes = [
  spread(5, 0.02)[0],
  spread(5, 0.02)[1],
  spread(5, 0.02)[2],
  spread(5, 0.02)[3],
  spread(5, 0.02)[4],
];
grantedTimes.forEach((t) => events.push({ type: "access_granted", timestamp: t }));
deniedTimes.forEach((t) => events.push({ type: "access_denied", timestamp: t }));

// Task pipeline: model most granted access as leading to an accepted task,
// with a small failure rate, illustrating O/T inputs independently of A.
const taskCount = 40;
const taskFailures = 3;
spread(taskCount, 0.1).forEach((t, i) => {
  events.push({ type: "task_accepted", timestamp: t });
  const outcomeTime = new Date(Date.parse(t) + 60 * 60 * 1000).toISOString(); // +1h
  if (i < taskFailures) {
    events.push({ type: "task_failed", timestamp: outcomeTime });
  } else {
    events.push({ type: "task_completed", timestamp: outcomeTime });
  }
});

// 2 appeals submitted, 1 resolved (upheld — reversing the original denial),
// matching the brief's example ("2 appeals, 1 successful appeal").
const appealSubmitTimes = spread(2, 0.3);
events.push({ type: "appeal_submitted", timestamp: appealSubmitTimes[0] });
events.push({
  type: "appeal_resolved",
  timestamp: new Date(
    Date.parse(appealSubmitTimes[0]) + 2 * 24 * 60 * 60 * 1000 // resolved 2 days later
  ).toISOString(),
  outcome: "upheld",
  resolution_seconds: 2 * 24 * 60 * 60,
});
events.push({ type: "appeal_submitted", timestamp: appealSubmitTimes[1] });
// second appeal left unresolved as of window end — demonstrates a partial
// redress_rate rather than a trivially perfect one.

// One disclosure published during the window.
events.push({
  type: "disclosure_published",
  timestamp: spread(1, 0.5)[0],
  note: "Published incident report re: elevated task failure rate in week 2.",
});

events.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

const log: BehaviourLog = {
  wallet: "8pT7q2W4nZ3rY6uJ1xK9mD5vC0bH2fS7eL4gA6oR3sQ1",
  audit_window_start: WINDOW_START,
  audit_window_end: WINDOW_END,
  events,
};

writeFileSync(
  join(__dirname, "..", "sample-data", "wallet-example.json"),
  JSON.stringify(log, null, 2) + "\n"
);

console.log(`Wrote ${events.length} events to sample-data/wallet-example.json`);
