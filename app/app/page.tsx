"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { ShieldCheck, Lock, Blocks, Link2, FileText } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const steps = [
  {
    title: "Create a split",
    body: "Add members and lock each one's fixed percentage share. Allocations are frozen once the split goes live.",
  },
  {
    title: "Deposit revenue",
    body: "Anyone sends tokens into the shared vault. Every deposit is recorded on-chain.",
  },
  {
    title: "Claim anytime",
    body: "Each member pulls their exact share whenever they want — no admin needed to trigger payouts.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Trustless & auditable",
    body: "Every deposit and claim lives on-chain, so anyone can verify exactly who is owed what. No trusted middleman.",
  },
  {
    icon: Lock,
    title: "Fixed, fair shares",
    body: "Shares are locked at activation, so a deposit can never be retroactively re-priced or a member quietly diluted.",
  },
  {
    icon: Blocks,
    title: "Composable primitive",
    body: "Divvy is a building block: other Solana programs can deposit into a split via CPI, not just people.",
  },
];

export default function Landing() {
  const { publicKey } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (publicKey) {
      router.replace("/dashboard");
    }
  }, [publicKey, router]);

  return (
    <div className="flex flex-col flex-1" style={{ background: "var(--bg)" }}>
      {/* minimal top bar */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <Image
          src="/divvylogo.png"
          alt="Divvy"
          width={140}
          height={60}
          priority
          style={{ height: "50px", width: "auto" }}
        />
        <WalletMultiButton />
      </nav>

      {/* hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 min-h-[calc(100vh-64px)]">
        <div className="fade-in flex flex-col items-center gap-6 max-w-2xl">
          <div className="static h-[100px] flex items-end justify-center">
            <Image
              src="/divvylogo.png"
              alt="Divvy"
              width={180}
              height={160}
              priority
              className="absolute -top-20 h-48 w-auto"
            />
          </div>

          <h1 className="hero-h1">Revenue splitting, on-chain.</h1>

          <p className="text-lg max-w-[560px]" style={{ color: "var(--text-muted)" }}>
            Pool funds in a shared vault and let each member claim their fixed
            share — on-chain, on their own schedule. No treasurer, no manual
            payouts.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <WalletMultiButton />
            <a href="#how-it-works" className="btn-ghost">
              How it works ↓
            </a>
          </div>

          <p className="text-[13px] mt-2" style={{ color: "var(--text-subtle)" }}>
            Built on Solana · Supports SPL Token & Token-2022
          </p>
        </div>
      </section>

      {/* how it works */}
      <section
        id="how-it-works"
        className="px-6 py-24 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-[1080px] mx-auto flex flex-col gap-12">
          <div className="text-center">
            <h2 className="h2">How it works</h2>
            <p className="meta mt-2">Three steps, fully on-chain.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col gap-3">
                <span className="step-badge">{i + 1}</span>
                <h3 className="h3">{step.title}</h3>
                <p className="meta">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* why divvy */}
      <section className="px-6 py-24 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-[1080px] mx-auto flex flex-col gap-12">
          <div className="text-center">
            <h2 className="h2">Built for trustless teams</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex flex-col gap-3">
                  <Icon size={22} color="var(--accent)" strokeWidth={1.75} />
                  <h3 className="h3">{feature.title}</h3>
                  <p className="meta">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer
        className="px-6 py-2 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="max-w-[1080px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/divvylogo.png"
              alt="Divvy"
              width={140}
              height={60}
              style={{ height: "40px", width: "auto" }}
            />
            <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Built on Solana
            </span>
          </div>

          <div className="flex items-center gap-5 text-[13px]" style={{ color: "var(--text-muted)" }}>
            <a href="https://github.com/thecurioussailor/divvy-capstone" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline">
              <FaGithub size={14}/> GitHub
            </a>
            <a href="https://github.com/thecurioussailor/divvy-capstone#divvy" className="flex items-center gap-1.5 hover:underline">
              <FileText size={14} /> Docs
            </a>
            <span style={{ color: "var(--text-subtle)" }}>© 2026 Divvy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
