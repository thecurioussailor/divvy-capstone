"use client";
import { getSplitConfigPda } from "../lib/program";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useProgram } from "../lib/useProgram";

export default function CreateSplitForm({
  onCreated,
}: {
  onCreated?: (splitConfig: PublicKey) => void;
}) {
  const { publicKey } = useWallet();
  const program = useProgram();

  const [tokenMint, setTokenMint] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = !!publicKey && !!tokenMint && !loading;

  async function handleCreateSplit() {
    if (!program || !publicKey) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Sending transaction…");

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
      setStatus(`Split created. Tx: ${signature}`);
      onCreated?.(splitConfig);
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center pt-[72px]">
      <div className="card w-full max-w-[560px] flex flex-col gap-6">
        <div>
          <h1 className="h1">Create a new split</h1>
          <p className="meta mt-1">
            Choose the token this split will distribute and who receives what.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Token mint address</label>
          <input
            type="text"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            placeholder="Paste a devnet SPL token mint"
            className="input-field mono"
          />
          <p className="helper-text">
            The SPL or Token-2022 mint this split will accept deposits in.
          </p>
        </div>

        <div>
          <button
            onClick={handleCreateSplit}
            disabled={!canSubmit}
            className="btn-primary w-full"
          >
            {loading ? "Creating…" : "Create split"}
          </button>
          {!publicKey && (
            <p className="helper-text mt-2">
              Connect a wallet and enter a valid mint to continue.
            </p>
          )}
        </div>

        {status && <p className="meta break-all">{status}</p>}
      </div>
    </div>
  );
}
