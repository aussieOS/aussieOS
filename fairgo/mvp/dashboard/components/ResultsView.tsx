"use client";

import { DisplayRecord } from "@/lib/types";
import { formatScore, truncateAddress, toFixedPoint, isoToUnixSeconds } from "@/lib/format";
import { DEMO_WALLETS } from "@/lib/demoWallets";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-sans">
        {label}
      </span>
      <div className="font-mono text-sm text-slate-100">{children}</div>
    </div>
  );
}

function BehaviouralComponent({
  code,
  name,
  value,
}: {
  code: string;
  name: string;
  value: number | null;
}) {
  return (
    <div className="border border-white/10 rounded-sm px-4 py-3 flex items-baseline justify-between">
      <div>
        <div className="font-mono text-teal-400 text-sm">{code}</div>
        <div className="text-xs text-slate-500 font-sans mt-0.5">{name}</div>
      </div>
      <div className="font-mono text-lg text-slate-100">
        {value === null ? "—" : formatScore(value)}
      </div>
    </div>
  );
}

export function ResultsView({ record }: { record: DisplayRecord }) {
  const hasOnChain = record.onChain !== null;
  const demoWallet = DEMO_WALLETS.find((d) => d.wallet === record.wallet);

  return (
    <div className="flex flex-col gap-10">
      <Field label="Subject Wallet">
        <div className="flex items-center gap-2 flex-wrap">
          <span title={record.wallet}>{truncateAddress(record.wallet, 10, 10)}</span>
          {demoWallet && (
            <span className="text-xs font-sans px-2 py-0.5 rounded-sm border border-amber-400/40 text-amber-400">
              Demo Wallet — {demoWallet.label}
            </span>
          )}
        </div>
      </Field>

      {/* Trust Signal — the single most prominent number on the page,
          rendered like an instrument reading: value + its own error bars,
          not a graded score. */}
      <div className="border-y border-white/10 py-8">
        <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-sans">
          Trust Signal (FGV v1)
        </span>
        <div className="mt-2 flex items-baseline gap-4 flex-wrap">
          <span className="font-mono text-6xl text-teal-400 leading-none">
            {record.fgv === null ? "—" : formatScore(record.fgv)}
          </span>
          {record.confidence && (
            <span className="font-mono text-sm text-amber-400">
              [{formatScore(record.confidence.lower)} – {formatScore(record.confidence.upper)}]
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-500 font-sans uppercase tracking-[0.1em]">
          Statistical Confidence Range
        </div>
        <p className="mt-4 text-xs text-slate-500 font-sans leading-relaxed max-w-xl">
          FGV scores here are v0: self-reported assessments scored off-chain against the public
          FairGo rubric. Nothing on this dashboard is on-chain yet — the Solana attestation layer
          is designed and on the roadmap. A score shows what an organisation reported, not a
          verified fact. Full detail:{" "}
          <a
            href="https://aussieos.xyz/fairgo/"
            target="_blank"
            rel="noopener"
            className="underline hover:text-teal-400"
          >
            aussieos.xyz/fairgo.html
          </a>
        </p>
      </div>

      <div>
        <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-sans">
          Behavioural Components
        </span>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BehaviouralComponent code="A" name="Access Parity" value={record.A} />
          <BehaviouralComponent code="T" name="Treatment Parity" value={record.T} />
          <BehaviouralComponent code="O" name="Outcome Parity" value={record.O} />
          <BehaviouralComponent code="D" name="Disclosure & Redress" value={record.D} />
        </div>
        {record.breakdownSource === null && (
          <p className="mt-2 text-xs text-slate-500 font-sans">
            No off-chain breakdown found for this wallet. The on-chain attestation stores the
            aggregate Trust Signal and Confidence Range only — not the individual components.
          </p>
        )}
        {record.breakdownSource === "off-chain-bundled" && hasOnChain && (
          <p className="mt-2 text-xs text-slate-500 font-sans">
            Components shown are sourced from a locally bundled off-chain result, not from the
            on-chain attestation — the chain does not store the A/T/O/D breakdown.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Verifiable Input Hash">
          {record.evidenceHashHex ? (
            <span className="break-all">{record.evidenceHashHex}</span>
          ) : (
            <span className="text-slate-500">Not available for this record.</span>
          )}
        </Field>
        <Field label="Computed">
          {record.timestamp ?? <span className="text-slate-500">—</span>}
        </Field>
        <Field label="Audit Window">
          {record.auditWindowStart && record.auditWindowEnd
            ? `${record.auditWindowStart} → ${record.auditWindowEnd}`
            : "—"}
        </Field>
        <Field label="Schema Version">{record.schemaVersion ?? "—"}</Field>
      </div>

      <OnChainAttestationPreview record={record} />
    </div>
  );
}

function OnChainAttestationPreview({ record }: { record: DisplayRecord }) {
  const live = record.onChain;

  return (
    <div className="border border-dashed border-white/15 rounded-sm p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs uppercase tracking-[0.14em] text-slate-400 font-sans">
          On-chain Attestation Preview
        </span>
        <span
          className={`text-xs font-sans px-2 py-0.5 rounded-sm border ${
            live
              ? "text-teal-400 border-teal-400/40"
              : "text-amber-400 border-amber-400/40"
          }`}
        >
          {live ? "Live — Solana Devnet" : "Preview only — not submitted"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs text-slate-300">
        <PreviewRow label="wallet" value={record.wallet} />
        <PreviewRow
          label="fgv"
          value={
            record.fgv === null
              ? "—"
              : `${toFixedPoint(record.fgv)} (${formatScore(record.fgv)})`
          }
        />
        <PreviewRow
          label="ci_lower"
          value={
            record.confidence
              ? `${toFixedPoint(record.confidence.lower)} (${formatScore(
                  record.confidence.lower
                )})`
              : "—"
          }
        />
        <PreviewRow
          label="ci_upper"
          value={
            record.confidence
              ? `${toFixedPoint(record.confidence.upper)} (${formatScore(
                  record.confidence.upper
                )})`
              : "—"
          }
        />
        <PreviewRow
          label="audit_window_start"
          value={
            record.auditWindowStart
              ? `${isoToUnixSeconds(record.auditWindowStart)} (${record.auditWindowStart})`
              : "—"
          }
        />
        <PreviewRow
          label="audit_window_end"
          value={
            record.auditWindowEnd
              ? `${isoToUnixSeconds(record.auditWindowEnd)} (${record.auditWindowEnd})`
              : "—"
          }
        />
        <PreviewRow
          label="evidence_hash"
          value={record.evidenceHashHex ?? "— not available"}
        />
        <PreviewRow
          label="auditor"
          value={
            live
              ? truncateAddress(live.auditor, 10, 10)
              : "— set by the operator wallet at publish time, not known in preview"
          }
        />
        <PreviewRow label="schema_version" value={record.schemaVersion ?? "—"} />
        <PreviewRow
          label="created_at"
          value={
            live
              ? `${live.created_at} (${record.timestamp})`
              : "— not yet published"
          }
        />
      </dl>

      <p className="mt-4 text-xs text-slate-500 font-sans">
        Formatted payload only. This dashboard cannot sign or submit transactions.
      </p>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 break-all">{value}</span>
    </div>
  );
}
