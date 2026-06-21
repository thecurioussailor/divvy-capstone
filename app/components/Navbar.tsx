"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import WalletMenu from "./WalletMenu";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function Navbar({
  showConnectButton = false,
}: {
  showConnectButton?: boolean;
}) {
  return (
    <nav
      className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <Image
          src="/divvylogo.png"
          alt="Divvy"
          width={140}
          height={40}
          priority
          style={{ height: "32px", width: "auto" }}
        />
      </div>
      {showConnectButton ? <WalletMultiButton /> : <WalletMenu />}
    </nav>
  );
}
