import { FgvResult } from "./types";
import exampleWalletResult from "../sample-data/results/8pT7q2W4nZ3rY6uJ1xK9mD5vC0bH2fS7eL4gA6oR3sQ1.json";

/**
 * Static registry of bundled demo results, keyed by wallet address.
 * No database, no API route — matches the brief's "static sample data is
 * acceptable" allowance. To add another demo wallet: drop a result JSON
 * (matching FgvResult, produced by `calculator`'s CLI) into
 * sample-data/results/, import it above, and add it to this map.
 *
 * This is intentionally separate from the live on-chain lookup in
 * lib/solana.ts — see components/ResultsView.tsx for how the two are
 * combined (and how each field's source is labeled, never silently merged).
 */
const BUNDLED_RESULTS: Record<string, FgvResult> = {
  [exampleWalletResult.wallet]: exampleWalletResult as FgvResult,
};

export function findBundledResult(wallet: string): FgvResult | null {
  return BUNDLED_RESULTS[wallet] ?? null;
}
