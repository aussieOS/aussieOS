export const SCALE = 1_000_000; // must match calculator/src/encode.ts and the Anchor program's SCALE constant

/** Fixed-point u32 -> plain decimal, e.g. 846865 -> 0.846865 */
export function fromFixedPoint(scaled: number): number {
  return scaled / SCALE;
}

/** Plain decimal -> fixed-point u32, e.g. 0.846865 -> 846865. Mirrors
 * calculator/src/encode.ts::toFixedPoint exactly — if that changes, update
 * this too. Kept duplicated rather than shared because the dashboard has no
 * runtime dependency on the calculator package. */
export function toFixedPoint(v: number): number {
  return Math.round(v * SCALE);
}

export function unixSecondsToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

export function isoToUnixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

/** Truncates a base58 pubkey for display: "8pT7q2W4...gA6oR3sQ1" */
export function truncateAddress(address: string, lead = 8, tail = 8): string {
  if (address.length <= lead + tail + 3) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

/** Renders a decimal score to a fixed number of places without rounding
 * surprises — used for the Trust Signal and Behavioural Components so every
 * number on the page has consistent, honest precision (no implied precision
 * beyond what the calculator actually computed). */
export function formatScore(v: number, places = 6): string {
  return v.toFixed(places);
}
