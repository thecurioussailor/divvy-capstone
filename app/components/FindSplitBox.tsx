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
    <div className="flex flex-col gap-2">
      <span className="label">Find a split</span>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Paste split address"
        className="input-field mono"
      />
      <button
        onClick={handleFind}
        disabled={!address}
        className="btn-secondary w-full"
      >
        Open
      </button>
      {error && <p className="helper-text" style={{ color: "var(--status-closed)" }}>{error}</p>}
    </div>
  );
}
