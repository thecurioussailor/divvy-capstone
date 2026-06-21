export default function StatusBadge({ status }: { status: string }) {
  const className =
    status === "active"
      ? "badge badge-active"
      : status === "paused"
      ? "badge badge-paused"
      : status === "closed"
      ? "badge badge-closed"
      : "badge badge-draft";

  return <span className={className}>{status}</span>;
}
