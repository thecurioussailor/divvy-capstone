"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useProgram } from "../lib/useProgram";
import { getMemberAllocationPda, ensureAssociatedTokenAccount } from "../lib/program";
import TxLink from "./TxLink";

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
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    if (!program || !publicKey || !signTransaction) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Preparing token account…");
      setSignature(null);

      const memberTokenAccount = await ensureAssociatedTokenAccount(
        connection,
        { publicKey, signTransaction },
        tokenMint
      );

      setStatus("Sending transaction…");

      const memberAllocation = getMemberAllocationPda(splitConfig, publicKey);

      const sig = await program.methods
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

      setStatus("Claimed.");
      setSignature(sig);
      onClaimed?.();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <h3 className="h3">Your claim</h3>
      <p className="meta">Withdraw your accrued share to your wallet.</p>

      <button
        onClick={handleClaim}
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? "Claiming…" : "Claim"}
      </button>

      {status && (
        <div className="flex items-center gap-2">
          <p className="meta break-all">{status}</p>
          {signature && <TxLink signature={signature} />}
        </div>
      )}
    </div>
  );
}
