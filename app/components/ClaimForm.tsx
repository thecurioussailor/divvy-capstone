"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useProgram } from "../lib/useProgram";
import { getMemberAllocationPda, ensureAssociatedTokenAccount } from "../lib/program";

export default function ClaimForm({
  splitConfig,
  tokenMint,
  onClaimed,
}: {
  splitConfig: PublicKey;
  tokenMint: PublicKey;
  onClaimed?: () => void;
}) {
  const program = useProgram();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [status, setStatus] = useState<string | null>(null);

  async function handleClaim() {
    if (!program || !publicKey || !signTransaction) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setStatus("Preparing token account...");

      const memberTokenAccount = await ensureAssociatedTokenAccount(
        connection,
        { publicKey, signTransaction },
        tokenMint
      );

      setStatus("Sending transaction...");

      const memberAllocation = getMemberAllocationPda(splitConfig, publicKey);

      const signature = await program.methods
        .claim()
        .accountsPartial({
          member: publicKey,
          splitConfig,
          tokenMint,
          memberAllocation,
          memberTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setStatus(`Claimed! Tx: ${signature}`);
      onClaimed?.();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md border border-zinc-200 rounded p-4 bg-white">
      <span className="text-sm font-medium">Claim Your Share</span>

      <button
        onClick={handleClaim}
        className="bg-black text-white rounded px-4 py-2 text-sm"
      >
        Claim
      </button>

      {status && <p className="text-sm break-all">{status}</p>}
    </div>
  );
}
