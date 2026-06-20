"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { useProgram } from "../lib/useProgram";
import { ensureAssociatedTokenAccount } from "../lib/program";

export default function DepositForm({
  splitConfig,
  tokenMint,
  onDeposited,
}: {
  splitConfig: PublicKey;
  tokenMint: PublicKey;
  onDeposited?: () => void;
}) {
  const program = useProgram();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleDeposit() {
    if (!program || !publicKey || !signTransaction) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setStatus("Preparing token account...");

      const depositorTokenAccount = await ensureAssociatedTokenAccount(
        connection,
        { publicKey, signTransaction },
        tokenMint
      );

      setStatus("Sending transaction...");

      const lamportAmount = new BN(amount);

      const signature = await program.methods
        .deposit(lamportAmount)
        .accountsPartial({
          splitConfig,
          tokenMint,
          depositorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setStatus(`Deposited! Tx: ${signature}`);
      setAmount("");
      onDeposited?.();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md border border-zinc-200 rounded p-4 bg-white">
      <span className="text-sm font-medium">Deposit</span>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (smallest unit, e.g. 1000000 for 1 token at 6 decimals)"
        className="border rounded px-3 py-2 text-sm"
      />

      <button
        onClick={handleDeposit}
        disabled={!amount}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40"
      >
        Deposit
      </button>

      {status && <p className="text-sm break-all">{status}</p>}
    </div>
  );
}
