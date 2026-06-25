"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "../lib/useProgram";
import { getMemberAllocationPda } from "../lib/program";
import TxLink from "./TxLink";

export default function AddMemberForm({
  splitConfig,
  onMemberAdded,
}: {
  splitConfig: PublicKey;
  onMemberAdded?: () => void;
}) {
  const program = useProgram();

  const [memberAddress, setMemberAddress] = useState("");
  const [shareBps, setShareBps] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = !!memberAddress && !!shareBps && !loading;

  async function handleAddMember() {
    if (!program) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Sending transaction…");
      setSignature(null);

      const member = new PublicKey(memberAddress);
      const bps = parseInt(shareBps, 10);
      const memberAllocation = getMemberAllocationPda(splitConfig, member);

      const sig = await program.methods
        .addMember(member, bps)
        .accountsPartial({
          splitConfig,
          memberAllocation,
        })
        .rpc();

      setStatus("Member added.");
      setSignature(sig);
      setMemberAddress("");
      setShareBps("");
      onMemberAdded?.();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-3 pt-4"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <span className="label">Add member</span>

      <input
        type="text"
        value={memberAddress}
        onChange={(e) => setMemberAddress(e.target.value)}
        placeholder="Member wallet address"
        className="input-field mono"
      />

      <input
        type="number"
        value={shareBps}
        onChange={(e) => setShareBps(e.target.value)}
        placeholder="Share in basis points (e.g. 5000 = 50%)"
        className="input-field"
      />

      <button
        onClick={handleAddMember}
        disabled={!canSubmit}
        className="btn-primary w-full"
      >
        {loading ? "Adding…" : "Add member"}
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
