"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import CopyButton from "./CopyButton";

export default function WalletMenu() {
  const { publicKey, disconnect, wallet } = useWallet();
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!publicKey) return;
    let isMounted = true;

    async function fetchBalance() {
      const lamports = await connection.getBalance(publicKey!);
      if (isMounted) setBalance(lamports / 1e9);
    }

    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, [publicKey, connection]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!publicKey) return null;

  const address = publicKey.toBase58();
  const short = `${address.slice(0, 4)}…${address.slice(-4)}`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-11 px-3.5 rounded-[10px] border cursor-pointer transition-colors"
        style={{ borderColor: "var(--border-strong)", background: "var(--surface)" }}
      >
        {wallet?.adapter.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wallet.adapter.icon} alt="" width={20} height={20} className="rounded-full" />
        )}
        <span className="mono text-sm font-medium">{short}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl border p-4 flex flex-col gap-3 z-50"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="mono text-sm">{short}</span>
            <CopyButton text={address} />
          </div>

          <div className="meta">
            {balance !== null ? (
              <span className="mono">{balance.toFixed(3)} SOL</span>
            ) : (
              "Loading balance…"
            )}
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          <button onClick={disconnect} className="btn-ghost text-left">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
