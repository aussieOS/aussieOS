"use client";

import { useState } from "react";
import { InputPanel } from "@/components/InputPanel";
import { ResultsView } from "@/components/ResultsView";
import { DisplayRecord } from "@/lib/types";
import { fetchAttestation } from "@/lib/solana";
import { findBundledResult } from "@/lib/localResults";
import { buildDisplayRecordFromWallet, buildDisplayRecordFromPastedJson } from "@/lib/merge";
import { parsePastedJson } from "@/lib/validate";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; record: DisplayRecord }
  | { kind: "not-found"; wallet: string }
  | { kind: "error"; message: string };

export default function Page() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleWalletSubmit(wallet: string) {
    setStatus({ kind: "loading" });
    const onChainResult = await fetchAttestation(wallet);
    const bundled = findBundledResult(wallet);

    if (onChainResult.status === "error") {
      // Still show bundled data if we have it — a Devnet RPC hiccup
      // shouldn't hide data the dashboard already has locally.
      if (bundled) {
        const record = buildDisplayRecordFromWallet(wallet, null, bundled);
        setStatus({ kind: "result", record: record! });
      } else {
        setStatus({ kind: "error", message: onChainResult.message });
      }
      return;
    }

    const onChain = onChainResult.status === "found" ? onChainResult.attestation : null;
    const record = buildDisplayRecordFromWallet(wallet, onChain, bundled);

    if (!record) {
      setStatus({ kind: "not-found", wallet });
      return;
    }
    setStatus({ kind: "result", record });
  }

  function handleJsonSubmit(raw: string) {
    setStatus({ kind: "loading" });
    try {
      const parsed = parsePastedJson(raw);
      const record = buildDisplayRecordFromPastedJson(parsed);
      setStatus({ kind: "result", record });
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Could not parse that JSON.",
      });
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0F0E] text-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-12">
        <header className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-sans">
            FairGo v1 — Attestation Transparency Interface
          </span>
          <h1 className="font-serif text-4xl text-slate-100">FairGo</h1>
          <p className="font-sans text-sm text-slate-400 leading-relaxed max-w-xl">
            FairGo v1 produces a deterministic trust signal derived from observable wallet
            behaviour. It does not evaluate identity, intent, or group-based fairness. Outputs
            are reproducible, hash-verifiable, and suitable for attestation systems.
          </p>
        </header>

        <div className="border border-white/10 rounded-sm p-5 text-xs font-sans text-slate-400 leading-relaxed flex flex-col gap-3">
          <span className="text-slate-300 uppercase tracking-[0.14em] text-[11px]">
            What FairGo is today
          </span>
          <p>
            <span className="text-slate-200">Runs today:</span> an off-chain scoring system — a
            public rubric (the four parities), a TypeScript calculator, and this dashboard. It
            produces FGV scores from self-reported assessments. Nothing about it is on-chain yet.
          </p>
          <p>
            <span className="text-slate-200">Built, not deployed:</span> a Solana program
            implementing this design exists in the open repo — unaudited, and not yet deployed to
            any network.
          </p>
          <p>
            <span className="text-slate-200">Planned:</span> building and deploying that program,
            which adds the thing the off-chain version cannot have — attestations that are
            timestamped and can&apos;t be quietly rewritten. Until it ships, an FGV score is a
            structured self-assessment against a public rubric. It does not prove the assessment
            is true, and nothing yet proves it hasn&apos;t changed.
          </p>
        </div>

        <InputPanel
          onWalletSubmit={handleWalletSubmit}
          onJsonSubmit={handleJsonSubmit}
          isLoading={status.kind === "loading"}
        />

        {status.kind === "not-found" && (
          <div className="border border-white/10 rounded-sm p-5 text-sm font-sans text-slate-300">
            <p className="text-slate-100">No FairGo record exists for this wallet.</p>
            <p className="text-slate-500 mt-1">
              <span className="font-mono text-slate-400">{status.wallet}</span> has no on-chain
              attestation on Devnet and no locally bundled result. FairGo never generates a score
              for a wallet it has no real data for.
            </p>
            <p className="text-slate-500 mt-3">
              Try one of the <span className="text-slate-300">Demo Wallets</span> above, or switch
              to the <span className="text-slate-300">Paste JSON</span> tab with calculator output.
            </p>
          </div>
        )}

        {status.kind === "error" && (
          <div className="border border-red-400/30 rounded-sm p-5 text-sm font-sans text-red-300">
            {status.message}
          </div>
        )}

        {status.kind === "result" && <ResultsView record={status.record} />}

        <p className="text-xs text-slate-600 font-sans pt-8 border-t border-white/5">
          Read-only interface. Does not evaluate or validate fairness claims.
        </p>
      </div>
    </main>
  );
}
