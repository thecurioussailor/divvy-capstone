"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CreateSplitForm from "../components/CreateSplitForm";
import SplitDetails from "../components/SplitDetails";

export default function Home() {
  const { publicKey } = useWallet();

  const [selectedSplit, setSelectedSplit] = useState<PublicKey | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col flex-1 h-screen">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {publicKey ? (
          <>
            <Sidebar
              selected={selectedSplit}
              onSelect={setSelectedSplit}
              onNewSplit={() => setSelectedSplit(null)}
              refreshKey={refreshKey}
            />

            <main className="flex-1 overflow-y-auto p-8 bg-zinc-50">
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
          </>
        ) : (
          <main className="flex flex-1 items-center justify-center">
            <p className="text-zinc-500">Connect your wallet to get started.</p>
          </main>
        )}
      </div>
    </div>
  );
}
