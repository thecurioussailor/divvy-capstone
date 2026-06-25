"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";
import { useProgram } from "../lib/useProgram";
import {
  getMembersForSplit,
  getMemberAllocationPda,
  ensureAssociatedTokenAccount,
} from "../lib/program";
import StatusBadge from "./StatusBadge";
import CopyButton from "./CopyButton";
import TxLink from "./TxLink";
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

function shorten(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function SplitDetails({
  splitConfig,
}: {
  splitConfig: PublicKey;
}) {
  const program = useProgram();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [account, setAccount] = useState<SplitConfigAccount | null>(null);
  const [members, setMembers] = useState<MemberAllocationAccount[]>([]);
  const [activateStatus, setActivateStatus] = useState<string | null>(null);
  const [lifecycleSignature, setLifecycleSignature] = useState<string | null>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState(false);

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
      setLifecycleLoading(true);
      setActivateStatus("Activating…");
      setLifecycleSignature(null);
      const sig = await program.methods
        .activateSplit()
        .accountsPartial({ splitConfig })
        .rpc();
      setActivateStatus("Activated.");
      setLifecycleSignature(sig);
      await load();
    } catch (err) {
      console.error(err);
      setActivateStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  async function handlePause() {
    if (!program) return;
    try {
      setLifecycleLoading(true);
      setActivateStatus("Pausing…");
      setLifecycleSignature(null);
      const sig = await program.methods
        .pauseSplit()
        .accountsPartial({ splitConfig })
        .rpc();
      setActivateStatus("Paused.");
      setLifecycleSignature(sig);
      await load();
    } catch (err) {
      console.error(err);
      setActivateStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  async function handleResume() {
    if (!program) return;
    try {
      setLifecycleLoading(true);
      setActivateStatus("Resuming…");
      setLifecycleSignature(null);
      const sig = await program.methods
        .resumeSplit()
        .accountsPartial({ splitConfig })
        .rpc();
      setActivateStatus("Resumed.");
      setLifecycleSignature(sig);
      await load();
    } catch (err) {
      console.error(err);
      setActivateStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  async function handleCloseMember(member: PublicKey) {
    if (!program) return;
    try {
      setLifecycleLoading(true);
      setActivateStatus("Closing member…");
      setLifecycleSignature(null);
      const memberAllocation = getMemberAllocationPda(splitConfig, member);
      const sig = await program.methods
        .closeMember(member)
        .accountsPartial({ splitConfig, memberAllocation })
        .rpc();
      setActivateStatus("Member closed.");
      setLifecycleSignature(sig);
      await load();
    } catch (err) {
      console.error(err);
      setActivateStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  async function handleCloseSplit() {
    if (!program || !publicKey || !signTransaction || !account) return;
    try {
      setLifecycleLoading(true);
      setActivateStatus("Closing split…");
      setLifecycleSignature(null);

      const authorityTokenAccount = await ensureAssociatedTokenAccount(
        connection,
        { publicKey, signTransaction },
        account.tokenMint
      );

      const sig = await program.methods
        .closeSplit()
        .accountsPartial({
          splitConfig,
          tokenMint: account.tokenMint,
          authorityTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setActivateStatus("Split closed.");
      setLifecycleSignature(sig);
    } catch (err) {
      console.error(err);
      setActivateStatus(`Error: ${(err as Error).message}`);
    } finally {
      setLifecycleLoading(false);
    }
  }

  if (!account) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto pt-16">
        <div className="h-8 w-64 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
        <div className="h-32 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
      </div>
    );
  }

  const statusLabel = Object.keys(account.status)[0];
  const canActivate = statusLabel === "draft" && account.totalBps === 10000;
  const isAuthority = publicKey?.equals(account.authority) ?? false;
  const splitAddress = splitConfig.toBase58();
  const mintAddress = account.tokenMint.toBase58();

  const isMember =
    !!publicKey && members.some((m) => m.account.member.equals(publicKey));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-10 px-6">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="h1 mono text-2xl">{shorten(splitAddress)}</h1>
          <CopyButton text={splitAddress} />
          <StatusBadge status={statusLabel} />
        </div>
        <p className="meta mt-1">
          members: {account.memberCount} · total bps: {account.totalBps} ·
          total deposited: {account.totalDeposited.toString()}
        </p>
        <p className="meta mt-1 flex items-center gap-1">
          mint: <span className="mono">{shorten(mintAddress)}</span>
          <CopyButton text={mintAddress} />
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* lifecycle controls */}
        {isAuthority && (
          <div className="card flex flex-col gap-3">
            <h3 className="h3">Split controls</h3>
            <div className="flex flex-wrap gap-2">
              {canActivate && (
                <button
                  onClick={handleActivate}
                  disabled={lifecycleLoading}
                  className="btn-primary"
                >
                  Activate split
                </button>
              )}
              {statusLabel === "active" && (
                <button
                  onClick={handlePause}
                  disabled={lifecycleLoading}
                  className="btn-secondary"
                >
                  Pause split
                </button>
              )}
              {statusLabel === "paused" && account.totalBps === 10000 && (
                <button
                  onClick={handleResume}
                  disabled={lifecycleLoading}
                  className="btn-secondary"
                >
                  Resume split
                </button>
              )}
              {statusLabel === "paused" && account.memberCount === 0 && (
                <button
                  onClick={handleCloseSplit}
                  disabled={lifecycleLoading}
                  className="btn-danger"
                >
                  Close split
                </button>
              )}
              {statusLabel === "draft" &&
                account.totalBps !== 10000 && (
                  <p className="helper-text">
                    Allocations must total 10,000 bps before this split can be
                    activated.
                  </p>
                )}
            </div>
            {activateStatus && (
              <div className="flex items-center gap-2">
                <p className="meta break-all">{activateStatus}</p>
                {lifecycleSignature && <TxLink signature={lifecycleSignature} />}
              </div>
            )}
          </div>
        )}

        {/* members */}
        <div className="card flex flex-col gap-3">
          <h3 className="h3">Members</h3>

          {members.length === 0 && (
            <p className="meta">No members yet.</p>
          )}

          <ul className="flex flex-col gap-2">
            {members.map(({ publicKey: memberPda, account: m }) => {
              const entitled = account.totalDeposited
                .mul(new BN(m.shareBps))
                .div(new BN(10000));
              const claimable = entitled.sub(m.totalClaimed);
              const canClose =
                isAuthority && statusLabel === "paused" && claimable.isZero();
              const memberAddr = m.member.toBase58();

              return (
                <li
                  key={memberPda.toBase58()}
                  className="flex items-center justify-between gap-2 py-1.5"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="mono text-sm">{shorten(memberAddr)}</span>
                    <CopyButton text={memberAddr} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="meta">
                      {(m.shareBps / 100).toFixed(2)}% · claimed:{" "}
                      {m.totalClaimed.toString()}
                    </span>
                    {canClose && (
                      <button
                        onClick={() => handleCloseMember(m.member)}
                        disabled={lifecycleLoading}
                        className="btn-ghost text-xs"
                        style={{ color: "var(--status-closed)" }}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {statusLabel === "draft" && isAuthority && (
            <AddMemberForm splitConfig={splitConfig} onMemberAdded={load} />
          )}
        </div>

        {/* deposit */}
        {statusLabel === "active" && (
          <DepositForm
            splitConfig={splitConfig}
            tokenMint={account.tokenMint}
            onDeposited={load}
          />
        )}

        {/* claim */}
        {(statusLabel === "active" || statusLabel === "paused") && isMember && (
          <ClaimForm
            splitConfig={splitConfig}
            tokenMint={account.tokenMint}
            onClaimed={load}
          />
        )}
      </div>
    </div>
  );
}
