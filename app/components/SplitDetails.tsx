"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { useProgram } from "../lib/useProgram";
import { getMembersForSplit } from "../lib/program";
import AddMemberForm from "./AddMemberForm";
import DepositForm from "./DepositForm";
import ClaimForm from "./ClaimForm";

type SplitConfigAccount = {
  authority: PublicKey;
  tokenMint: PublicKey;
  splitId: BN;
  status: Record<string, object>;
  memberCount: number;
  totalBps: number;
  totalDeposited: BN;
};

type MemberAllocationAccount = {
  publicKey: PublicKey;
  account: {
    split: PublicKey;
    member: PublicKey;
    shareBps: number;
    totalClaimed: BN;
  };
};

export default function SplitDetails({
  splitConfig,
}: {
  splitConfig: PublicKey;
}) {
  const program = useProgram();
  const { publicKey } = useWallet();
  const [account, setAccount] = useState<SplitConfigAccount | null>(null);
  const [members, setMembers] = useState<MemberAllocationAccount[]>([]);
  const [activateStatus, setActivateStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!program) return;
    const data = await program.account.splitConfig.fetch(splitConfig);
    setAccount(data as unknown as SplitConfigAccount);

    const memberAccounts = await getMembersForSplit(program, splitConfig);
    setMembers(memberAccounts as unknown as MemberAllocationAccount[]);
  }, [program, splitConfig]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleActivate() {
    if (!program) return;
    try {
      setActivateStatus("Activating...");
      const signature = await program.methods
        .activateSplit()
        .accountsPartial({ splitConfig })
        .rpc();
      setActivateStatus(`Activated! Tx: ${signature}`);
      await load();
    } catch (err) {
      console.error(err);
      setActivateStatus(`Error: ${(err as Error).message}`);
    }
  }

  if (!account) return <p className="text-sm text-zinc-500">Loading split...</p>;

  const statusLabel = Object.keys(account.status)[0];
  const canActivate = statusLabel === "draft" && account.totalBps === 10000;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div className="border border-zinc-200 rounded p-4 bg-white">
        <div className="font-mono text-xs break-all text-zinc-500">
          {splitConfig.toBase58()}
        </div>
        <div className="mt-2 text-sm text-zinc-700">
          status: <span className="font-medium">{statusLabel}</span>
        </div>
        <div className="text-sm text-zinc-700">
          members: {account.memberCount} · total bps: {account.totalBps}
        </div>
        <div className="text-sm text-zinc-700">
          total deposited: {account.totalDeposited.toString()}
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          mint: <span className="font-mono">{account.tokenMint.toBase58()}</span>
        </div>

        {canActivate && (
          <button
            onClick={handleActivate}
            className="mt-3 bg-black text-white rounded px-4 py-2 text-sm"
          >
            Activate Split
          </button>
        )}

        {activateStatus && (
          <p className="text-sm break-all mt-2">{activateStatus}</p>
        )}
      </div>

      <div className="border border-zinc-200 rounded p-4 bg-white">
        <span className="text-sm font-medium">Members</span>

        {members.length === 0 && (
          <p className="text-sm text-zinc-500 mt-2">No members yet.</p>
        )}

        <ul className="mt-2 flex flex-col gap-2">
          {members.map(({ publicKey, account: m }) => (
            <li key={publicKey.toBase58()} className="text-sm">
              <span className="font-mono text-xs text-zinc-600">
                {m.member.toBase58()}
              </span>
              <span className="text-zinc-700">
                {" "}
                — {(m.shareBps / 100).toFixed(2)}% · claimed:{" "}
                {m.totalClaimed.toString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {statusLabel === "draft" && (
        <AddMemberForm splitConfig={splitConfig} onMemberAdded={load} />
      )}

      {statusLabel === "active" && (
        <DepositForm
          splitConfig={splitConfig}
          tokenMint={account.tokenMint}
          onDeposited={load}
        />
      )}

      {(statusLabel === "active" || statusLabel === "paused") &&
        publicKey &&
        members.some((m) => m.account.member.equals(publicKey)) && (
          <ClaimForm
            splitConfig={splitConfig}
            tokenMint={account.tokenMint}
            onClaimed={load}
          />
        )}
    </div>
  );
}
