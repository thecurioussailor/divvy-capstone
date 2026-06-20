"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

export default function ProfileCard() {
  const { publicKey, disconnect } = useWallet();
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    let isMounted = true;

    async function fetchBalance() {
      const lamports = await connection.getBalance(publicKey!);
      if (isMounted) setBalance(lamports / 1e9);
    }

    fetchBalance();

    return () => {
      isMounted = false;
    };
  }, [publicKey, connection]);

  if (!publicKey) return null;

  const shortAddress = `${publicKey.toBase58().slice(0, 4)}..${publicKey
    .toBase58()
    .slice(-4)}`;

  return (
    <div className="flex flex-col gap-2 border border-zinc-200 rounded p-4 bg-white">
      <span className="text-xs text-zinc-500">Connected wallet</span>
      <span className="font-mono text-sm">{shortAddress}</span>
      <span className="text-sm text-zinc-700">
        {balance !== null ? `${balance.toFixed(3)} SOL` : "Loading..."}
      </span>
      <button
        onClick={disconnect}
        className="text-xs text-red-600 underline text-left mt-1"
      >
        Disconnect
      </button>
    </div>
  );
}
