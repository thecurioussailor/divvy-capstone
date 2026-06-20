"use client";

import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Divvy
      </h1>

      <WalletMultiButton />

      {publicKey && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connected as {publicKey.toBase58()}
        </p>
      )}
    </div>
  );
}
