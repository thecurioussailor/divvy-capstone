"use client";

import { PublicKey } from "@solana/web3.js";
import SplitList from "./SplitList";
import FindSplitBox from "./FindSplitBox";

function Divider() {
  return <div className="h-px" style={{ background: "var(--border)" }} />;
}

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
    <aside
      className="flex flex-col gap-6 w-[300px] shrink-0 border-r p-6 overflow-y-auto"
      style={{ borderColor: "var(--border)" }}
    >
      <button onClick={onNewSplit} className="btn-primary w-full">
        + New Split
      </button>

      <Divider />

      <FindSplitBox onFound={onSelect} />

      <Divider />

      <SplitList
        selected={selected}
        onSelect={onSelect}
        refreshKey={refreshKey}
      />
    </aside>
  );
}
