"use client";

import { PublicKey } from "@solana/web3.js";
import ProfileCard from "./ProfileCard";
import SplitList from "./SplitList";
import FindSplitBox from "./FindSplitBox";

export default function Sidebar({
  selected,
  onSelect,
  onNewSplit,
  refreshKey,
}: {
  selected: PublicKey | null;
  onSelect: (splitConfig: PublicKey) => void;
  onNewSplit: () => void;
  refreshKey: number;
}) {
  return (
    <aside className="flex flex-col gap-6 w-72 border-r border-zinc-200 bg-white p-4 overflow-y-auto">
      <ProfileCard />

      <button
        onClick={onNewSplit}
        className="text-sm border border-zinc-300 rounded px-3 py-2 hover:bg-zinc-50"
      >
        + New Split
      </button>

      <FindSplitBox onFound={onSelect} />

      <SplitList
        selected={selected}
        onSelect={onSelect}
        refreshKey={refreshKey}
      />
    </aside>
  );
}
