"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function Landing() {
  const { publicKey } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (publicKey) {
      router.replace("/dashboard");
    }
  }, [publicKey, router]);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center"
      style={{ background: "var(--bg)" }}
    >
      <Image
        src="/divvylogo.png"
        alt="Divvy"
        width={200}
        height={60}
        priority
        style={{ height: "56px", width: "auto" }}
      />

      <p className="max-w-md" style={{ color: "var(--text-muted)" }}>
        Pool funds in a shared vault and let each member claim their fixed
        share, on-chain, on their own schedule.
      </p>

      <WalletMultiButton />
    </div>
  );
}
