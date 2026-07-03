"use client";

import { useState } from "react";
import { DEMO_WALLETS } from "@/lib/demoWallets";
import { truncateAddress } from "@/lib/format";

type Mode = "wallet" | "json";

export function InputPanel({
  onWalletSubmit,
  onJsonSubmit,
  isLoading,
}: {
  onWalletSubmit: (wallet: string) => void;
  onJsonSubmit: (raw: string) => void;
  isLoading: boolean;
}) {
  const [mode, setMode] = useState<Mode>("wallet");
  const [walletValue, setWalletValue] = useState("");
  const [jsonValue, setJsonValue] = useState("");

  return (
    <div className="border border-white/10 rounded-sm p-5">
      <div className="flex gap-1 mb-4 font-sans text-sm">
        <TabButton active={mode === "wallet"} onClick={() => setMode("wallet")}>
          Subject Wallet
        </TabButton>
        <TabButton active={mode === "json"} onClick={() => setMode("json")}>
          Paste JSON
        </TabButton>
      </div>

      {mode === "wallet" ? (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (walletValue.trim()) onWalletSubmit(walletValue.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={walletValue}
              onChange={(e) => setWalletValue(e.target.value)}
              placeholder="Paste a Solana wallet address"
              className="flex-1 bg-black/30 border border-white/15 rounded-sm px-3 py-2 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={isLoading || !walletValue.trim()}
              className="px-4 py-2 rounded-sm bg-teal-400 text-black text-sm font-sans font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-300 transition-colors"
            >
              {isLoading ? "Looking up…" : "Look up"}
            </button>
          </form>

          <div className="mt-5">
            <span className="text-xs uppercase tracking-[0.14em] text-slate-500 font-sans">
              Demo Wallets
            </span>
            <p className="text-xs text-slate-500 font-sans mt-1 mb-3">
              Curated wallets with real, calculator-computed results — for testing only, not
              on-chain records.
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_WALLETS.map((demo) => (
                <button
                  key={demo.wallet}
                  type="button"
                  onClick={() => {
                    setWalletValue(demo.wallet);
                    onWalletSubmit(demo.wallet);
                  }}
                  disabled={isLoading}
                  className="text-left border border-white/10 rounded-sm px-3 py-2 hover:border-teal-400/40 hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-sans text-slate-200">{demo.label}</span>
                    <span className="text-xs font-mono text-slate-500">
                      {truncateAddress(demo.wallet, 4, 4)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-sans mt-0.5">
                    {demo.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (jsonValue.trim()) onJsonSubmit(jsonValue);
          }}
          className="flex flex-col gap-2"
        >
          <textarea
            value={jsonValue}
            onChange={(e) => setJsonValue(e.target.value)}
            placeholder="Paste the FGV Result JSON printed by the calculator's CLI"
            rows={8}
            className="bg-black/30 border border-white/15 rounded-sm px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-400 resize-y"
          />
          <button
            type="submit"
            disabled={isLoading || !jsonValue.trim()}
            className="self-start px-4 py-2 rounded-sm bg-teal-400 text-black text-sm font-sans font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-300 transition-colors"
          >
            {isLoading ? "Parsing…" : "Preview"}
          </button>
        </form>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-sm transition-colors ${
        active
          ? "bg-white/10 text-slate-100"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
