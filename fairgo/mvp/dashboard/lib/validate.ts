import { FgvResult } from "./types";

const REQUIRED_NUMBER_FIELDS: (keyof FgvResult)[] = ["A", "T", "O", "D", "FGV"];
const REQUIRED_STRING_FIELDS: (keyof FgvResult)[] = [
  "wallet",
  "timestamp",
  "audit_window_start",
  "audit_window_end",
];

/**
 * Parses and validates pasted JSON against the calculator's FgvResult shape.
 * Throws a specific, actionable error naming the exact field at fault —
 * never a generic "invalid input" — per the "errors are never vague"
 * standard. Accepts either a bare FgvResult, or the combined object the
 * calculator CLI prints (which nests it under a "FGV Result" heading isn't
 * JSON, so in practice this expects the FgvResult object itself, or an
 * object with an fgvResult property containing it).
 */
export function parsePastedJson(raw: string): FgvResult {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      "That isn't valid JSON. Paste the exact object the calculator's CLI prints under 'FGV Result'."
    );
  }

  if (typeof obj !== "object" || obj === null) {
    throw new Error("Expected a JSON object, got " + typeof obj + ".");
  }

  // Allow either the bare FgvResult, or { fgvResult: {...} }.
  const candidate: any =
    "fgvResult" in (obj as any) ? (obj as any).fgvResult : obj;

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof candidate[field] !== "string") {
      throw new Error(`Missing or invalid field: "${field}" must be a string.`);
    }
  }
  for (const field of REQUIRED_NUMBER_FIELDS) {
    const v = candidate[field];
    if (typeof v !== "number" || v < 0 || v > 1) {
      throw new Error(
        `Missing or invalid field: "${field}" must be a number between 0 and 1.`
      );
    }
  }
  if (
    typeof candidate.confidence !== "object" ||
    typeof candidate.confidence?.lower !== "number" ||
    typeof candidate.confidence?.upper !== "number"
  ) {
    throw new Error(
      'Missing or invalid field: "confidence" must be an object with numeric "lower" and "upper".'
    );
  }
  if (typeof candidate.schema_version !== "number") {
    throw new Error('Missing or invalid field: "schema_version" must be a number.');
  }
  if (
    candidate.evidence_hash_hex !== undefined &&
    typeof candidate.evidence_hash_hex !== "string"
  ) {
    throw new Error('"evidence_hash_hex", if present, must be a string.');
  }

  return candidate as FgvResult;
}
