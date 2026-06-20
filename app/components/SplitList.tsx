"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "../lib/useProgram";
import { getSplitsForAuthority } from "../lib/program";
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
    <div className="flex flex-col gap-2 w-full max-w-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Your Splits</span>
        <button onClick={loadSplits} className="text-xs underline">
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-zinc-500">Loading...</p>}

      {!loading && splits.length === 0 && (
        <p className="text-sm text-zinc-500">No splits yet.</p>
      )}

      {splits.map(({ publicKey: pda, account }) => {
        const statusLabel = Object.keys(account.status)[0];
        const isSelected = selected?.equals(pda);

        return (
          <button
            key={pda.toBase58()}
            onClick={() => onSelect(pda)}
            className={`text-left border rounded px-3 py-2 text-sm ${
              isSelected ? "border-black dark:border-white" : "border-zinc-300"
            }`}
          >
            <div className="font-mono text-xs break-all">{pda.toBase58()}</div>
            <div className="text-zinc-500">
              status: {statusLabel} · members: {account.memberCount} · bps:{" "}
              {account.totalBps}
            </div>
          </button>
        );
      })}
    </div>
  );
}
