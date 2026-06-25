export default function TxLink({ signature }: { signature: string }) {
  return (
    <a
      href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-ghost text-xs"
    >
      View on Explorer ↗
    </a>
  );
}
