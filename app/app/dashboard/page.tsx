"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import CreateSplitForm from "../../components/CreateSplitForm";
import SplitDetails from "../../components/SplitDetails";

export default function Dashboard() {
  const { publicKey, connecting } = useWallet();
  const router = useRouter();

  const [selectedSplit, setSelectedSplit] = useState<PublicKey | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!publicKey && !connecting) {
      router.replace("/");
    }
  }, [publicKey, connecting, router]);

  if (!publicKey) return null;

  return (
    <div className="flex flex-col flex-1 h-screen">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          selected={selectedSplit}
          onSelect={setSelectedSplit}
          onNewSplit={() => setSelectedSplit(null)}
          refreshKey={refreshKey}
        />

        <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg)" }}>
          {selectedSplit ? (
            <SplitDetails splitConfig={selectedSplit} />
          ) : (
            <CreateSplitForm
              onCreated={(splitConfig) => {
                setSelectedSplit(splitConfig);
                setRefreshKey((k) => k + 1);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
