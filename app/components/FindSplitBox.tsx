"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";

export default function FindSplitBox({
  onFound,
}: {
  onFound: (splitConfig: PublicKey) => void;
}) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleFind() {
    try {
      const pubkey = new PublicKey(address);
      setError(null);
      onFound(pubkey);
    } catch {
      setError("Invalid address.");
    }
  }

  return (
    <div className="flex flex-col gap-2 border border-zinc-200 rounded p-3 bg-white">
      <span className="text-sm font-medium">Find a Split</span>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Paste split address"
        className="border rounded px-3 py-2 text-sm"
      />
      <button
        onClick={handleFind}
        disabled={!address}
        className="bg-zinc-900 text-white rounded px-3 py-2 text-sm disabled:opacity-40"
      >
        Open
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
