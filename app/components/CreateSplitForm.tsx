"use client";
import { getSplitConfigPda } from "../lib/program";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useProgram } from "../lib/useProgram";

export default function CreateSplitForm({
    onCreated
}: {
    onCreated?: (splitConfig: PublicKey) => void;
}) {
  const { publicKey } = useWallet();
  const program = useProgram();

  const [tokenMint, setTokenMint] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleCreateSplit() {
    if (!program || !publicKey) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setStatus("Sending transaction...");

      const splitId = new BN(Date.now());
      const mint = new PublicKey(tokenMint);

      const signature = await program.methods
        .initializeSplit(splitId)
        .accountsPartial({
          tokenMint: mint,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const splitConfig = getSplitConfigPda(publicKey, splitId);
      setStatus(`Split created at ${splitConfig.toBase58()} \n Tx: ${signature}`);
      onCreated?.(splitConfig);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Token Mint Address</span>
        <input
          type="text"
          value={tokenMint}
          onChange={(e) => setTokenMint(e.target.value)}
          placeholder="Paste a devnet SPL token mint address"
          className="border rounded px-3 py-2 text-sm"
        />
      </label>

      <button
        onClick={handleCreateSplit}
        disabled={!publicKey || !tokenMint}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-40"
      >
        Create Split
      </button>

      {status && <p className="text-sm break-all">{status}</p>}
    </div>
  );
}
