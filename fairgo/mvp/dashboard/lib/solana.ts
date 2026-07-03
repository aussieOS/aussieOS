import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { OnChainAttestation } from "./types";

// Must match programs/fairgo/src/lib.rs `declare_id!`. Overridden via env
// once the program is actually deployed and `anchor keys sync` has run —
// see dashboard/README.md.
export const FAIRGO_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_FAIRGO_PROGRAM_ID ??
    "CtoDboUEyiBoeJRgZDG8ovW6FQhFd5nE5L1VxQzFmgFS"
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");

// sha256("account:Attestation")[0:8] — Anchor's account discriminator.
// Precomputed rather than hashed at runtime to avoid pulling in a crypto
// dependency just for this; recompute if the struct name in lib.rs changes.
const ATTESTATION_DISCRIMINATOR = new Uint8Array([
  152, 125, 183, 86, 36, 146, 121, 73,
]);

export function deriveAttestationPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("attestation"), wallet.toBuffer()],
    FAIRGO_PROGRAM_ID
  );
}

function readU32LE(buf: Buffer, offset: number): number {
  return buf.readUInt32LE(offset);
}

function readI64LE(buf: Buffer, offset: number): number {
  // Attestation timestamps are unix seconds — safely within Number range
  // for any date this MVP will ever encounter, so plain Number math is
  // fine (avoids pulling in BigInt handling for a read-only display layer).
  return Number(buf.readBigInt64LE(offset));
}

/**
 * Decodes the raw account bytes for a FairGo `Attestation` PDA. Manual byte
 * layout matching programs/fairgo/src/lib.rs exactly (field order matters):
 * discriminator(8) + wallet(32) + fgv(4) + ci_lower(4) + ci_upper(4)
 * + audit_window_start(8) + audit_window_end(8) + evidence_hash(32)
 * + auditor(32) + created_at(8) + schema_version(1) + bump(1)
 *
 * Deliberately hand-rolled instead of using the full @coral-xyz/anchor
 * client: this dashboard only ever reads, never signs or sends
 * transactions, so a full Anchor Program instance (which assumes a wallet
 * adapter) is more than this surface needs. If the account layout changes,
 * this must be updated by hand to match — there is no shared IDL enforcing
 * it here.
 */
function decodeAttestation(data: Buffer): OnChainAttestation {
  const disc = data.subarray(0, 8);
  if (!disc.equals(Buffer.from(ATTESTATION_DISCRIMINATOR))) {
    throw new Error(
      "Account discriminator mismatch — this account is not a FairGo Attestation."
    );
  }

  let o = 8;
  const wallet = new PublicKey(data.subarray(o, o + 32)).toBase58();
  o += 32;
  const fgv = readU32LE(data, o);
  o += 4;
  const ci_lower = readU32LE(data, o);
  o += 4;
  const ci_upper = readU32LE(data, o);
  o += 4;
  const audit_window_start = readI64LE(data, o);
  o += 8;
  const audit_window_end = readI64LE(data, o);
  o += 8;
  const evidence_hash = new Uint8Array(data.subarray(o, o + 32));
  o += 32;
  const auditor = new PublicKey(data.subarray(o, o + 32)).toBase58();
  o += 32;
  const created_at = readI64LE(data, o);
  o += 8;
  const schema_version = data.readUInt8(o);
  o += 1;
  const bump = data.readUInt8(o);

  return {
    wallet,
    fgv,
    ci_lower,
    ci_upper,
    audit_window_start,
    audit_window_end,
    evidence_hash,
    auditor,
    created_at,
    schema_version,
    bump,
  };
}

export type FetchResult =
  | { status: "found"; attestation: OnChainAttestation }
  | { status: "not-found" }
  | { status: "error"; message: string };

/**
 * Read-only lookup. Never constructs a transaction, never touches a wallet
 * adapter, never signs anything — this file has no capability to publish or
 * modify on-chain state, by design (dashboard is display-only per the brief).
 */
export async function fetchAttestation(
  walletAddress: string
): Promise<FetchResult> {
  let walletPubkey: PublicKey;
  try {
    walletPubkey = new PublicKey(walletAddress);
  } catch {
    return { status: "error", message: "Not a valid Solana wallet address." };
  }

  const [pda] = deriveAttestationPda(walletPubkey);
  const connection = new Connection(RPC_URL, "confirmed");

  try {
    const accountInfo = await connection.getAccountInfo(pda);
    if (!accountInfo) return { status: "not-found" };
    const attestation = decodeAttestation(accountInfo.data);
    return { status: "found", attestation };
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof Error
          ? err.message
          : "Unknown error contacting Solana Devnet.",
    };
  }
}
