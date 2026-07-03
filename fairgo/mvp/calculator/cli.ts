#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { computeFgv } from "./calculator";
import { buildPublishArgs } from "./encode";
import { BehaviourLog } from "./types";

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: ts-node src/cli.ts <path-to-behaviour-json>");
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf-8");
  const log: BehaviourLog = JSON.parse(raw);

  const result = computeFgv(log);
  const publishArgs = buildPublishArgs(result, filePath);

  console.log("=== FGV Result ===");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n=== On-chain publish_attestation args ===");
  console.log(JSON.stringify(publishArgs, null, 2));
}

main();
