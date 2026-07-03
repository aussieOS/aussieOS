import { FgvResult } from "./types";
import balancedRecord from "../sample-data/results/8pT7q2W4nZ3rY6uJ1xK9mD5vC0bH2fS7eL4gA6oR3sQ1.json";
import highTrust from "../sample-data/results/5VXSdL7BxgDjEDNX2hcGNNnzbN8tUbdunPpBS2Xop6Mp.json";
import lowTrust from "../sample-data/results/Dv6eNLFw1honXdzKdUzGV2FHydfYN2wkLArYwLiMNTu5.json";
import sparse from "../sample-data/results/9kzWnhkPavLaKD8rAUfC2oNa4VzQ4kY22UyzwcD2VC2u.json";
import heavyRedress from "../sample-data/results/5USjS2Rodv85eJSDwVWBvTnmcrZ3aJmDkGw8JFw2xpXq.json";

/**
 * Static registry of bundled demo results, keyed by wallet address.
 * No database, no API route -- matches the brief's "static sample data is
 * acceptable" allowance. To add another demo wallet: author a behaviour
 * log, run it through the calculator's CLI to get a real result (never
 * hand-write or hash-seed a score), drop the result JSON into
 * sample-data/results/, import it above, add it to this map, and add an
 * entry in lib/demoWallets.ts so it shows up in the UI picker.
 */
const BUNDLED_RESULTS: Record<string, FgvResult> = {
  [balancedRecord.wallet]: balancedRecord as FgvResult,
  [highTrust.wallet]: highTrust as FgvResult,
  [lowTrust.wallet]: lowTrust as FgvResult,
  [sparse.wallet]: sparse as FgvResult,
  [heavyRedress.wallet]: heavyRedress as FgvResult,
};

export function findBundledResult(wallet: string): FgvResult | null {
  return BUNDLED_RESULTS[wallet] ?? null;
}
