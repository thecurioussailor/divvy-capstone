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
  const [loading, setLoading] = useState(false);

  async function handleDeposit() {
    if (!program || !publicKey || !signTransaction) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Preparing token account…");

      const depositorTokenAccount = await ensureAssociatedTokenAccount(
        connection,
        { publicKey, signTransaction },
        tokenMint
      );

      setStatus("Sending transaction…");

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

      setStatus(`Deposited. Tx: ${signature}`);
      setAmount("");
      onDeposited?.();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col gap-3">
      <h3 className="h3">Deposit</h3>

      <div className="flex flex-col gap-1.5">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in smallest unit"
          className="input-field"
        />
        <p className="helper-text">
          Raw token units — e.g. 1000000 for 1 token at 6 decimals.
        </p>
      </div>

      <button
        onClick={handleDeposit}
        disabled={!amount || loading}
        className="btn-primary w-full"
      >
        {loading ? "Depositing…" : "Deposit"}
      </button>

      {status && <p className="meta break-all">{status}</p>}
    </div>
  );
}
