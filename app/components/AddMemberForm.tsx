"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useProgram } from "../lib/useProgram";
import { getMemberAllocationPda } from "../lib/program";

export default function AddMemberForm({
  splitConfig,
  onMemberAdded,
}: {
  splitConfig: PublicKey;
  onMemberAdded?: () => void
}) {
  const program = useProgram();

  const [memberAddress, setMemberAddress] = useState("");
  const [shareBps, setShareBps] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleAddMember() {
    if (!program) {
      setStatus("Connect your wallet first.");
      return;
    }

    try {
      setStatus("Sending transaction...");

      const member = new PublicKey(memberAddress);
      const bps = parseInt(shareBps, 10);
      const memberAllocation = getMemberAllocationPda(splitConfig, member);

      const signature = await program.methods
        .addMember(member, bps)
        .accountsPartial({
          splitConfig,
          memberAllocation,
        })
        .rpc();

      setStatus(`Member added! Tx: ${signature}`);
      setMemberAddress("");
      setShareBps("");
      onMemberAdded?.();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md border rounded p-4">
      <span className="text-sm font-medium">Add Member</span>

      <input
        type="text"
        value={memberAddress}
        onChange={(e) => setMemberAddress(e.target.value)}
        placeholder="Member wallet address"
        className="border rounded px-3 py-2 text-sm"
      />

      <input
        type="number"
        value={shareBps}
        onChange={(e) => setShareBps(e.target.value)}
        placeholder="Share in basis points (e.g. 5000 = 50%)"
        className="border rounded px-3 py-2 text-sm"
      />

      <button
        onClick={handleAddMember}
        disabled={!memberAddress || !shareBps}
        className="bg-black text-white rounded px-4 py-2 disabled:opacity-40"
      >
        Add Member
      </button>

      {status && <p className="text-sm break-all">{status}</p>}
    </div>
  );
}
