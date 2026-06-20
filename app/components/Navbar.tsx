"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <div className="flex items-center gap-2">
        <Image src="/divvylogo.png" alt="Divvy" width={140} height={40} priority />
      </div>
      <WalletMultiButton />
    </nav>
  );
}
