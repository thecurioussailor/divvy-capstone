"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "../lib/useProgram";
import { getSplitsForAuthority } from "../lib/program";
import StatusBadge from "./StatusBadge";
import BN from "bn.js";

type SplitAccount = {
  publicKey: PublicKey;
  account: {
    authority: PublicKey;
    tokenMint: PublicKey;
    splitId: BN;
    status: Record<string, object>;
    memberCount: number;
    totalBps: number;
    totalDeposited: BN;
  };
};

export default function SplitList({
  selected,
  onSelect,
  refreshKey,
}: {
  selected: PublicKey | null;
  onSelect: (splitConfig: PublicKey) => void;
  refreshKey?: number;
}) {
  const { publicKey } = useWallet();
  const program = useProgram();

  const [splits, setSplits] = useState<SplitAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSplits = useCallback(async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      const result = await getSplitsForAuthority(program, publicKey);
      setSplits(result as unknown as SplitAccount[]);
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  useEffect(() => {
    loadSplits();
  }, [loadSplits, refreshKey]);

  if (!publicKey) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="label">Your splits</span>
        <button onClick={loadSplits} className="btn-ghost text-xs">
          Refresh
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl animate-pulse"
              style={{ background: "var(--surface-2)" }}
            />
          ))}
        </div>
      )}

      {!loading && splits.length === 0 && (
        <div className="py-2">
          <p className="meta">No splits yet.</p>
          <p className="helper-text">
            Create one above, or open one someone shared with you.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {splits.map(({ publicKey: pda, account }) => {
          const statusLabel = Object.keys(account.status)[0];
          const isSelected = selected?.equals(pda);
          const addr = pda.toBase58();
          const short = `${addr.slice(0, 4)}…${addr.slice(-4)}`;

          return (
            <button
              key={addr}
              onClick={() => onSelect(pda)}
              className="text-left rounded-xl px-3 py-2.5 transition-colors cursor-pointer"
              style={{
                background: isSelected ? "var(--accent-soft)" : "transparent",
                borderLeft: isSelected
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "var(--surface-2)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="flex items-center gap-2">
                <span className="mono text-sm">{short}</span>
                <StatusBadge status={statusLabel} />
              </div>
              <div className="meta mt-0.5">
                members: {account.memberCount} · bps: {account.totalBps}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
