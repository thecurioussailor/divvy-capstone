import { AnchorProvider, Program } from "@anchor-lang/core";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import idl from "./divvy.json";
import type { Divvy } from "./divvy";
import BN from "bn.js";

type WalletLike = {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
};

/**
 * Returns the ATA address for (mint, owner), creating it on-chain first if
 * it doesn't exist yet. Unlike @solana/spl-token's getOrCreateAssociatedTokenAccount,
 * this works with browser wallet adapters (which only expose signTransaction,
 * never a raw secret key).
 */
export async function ensureAssociatedTokenAccount(
  connection: Connection,
  wallet: WalletLike,
  mint: PublicKey
) {
  const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey);

  const existing = await connection.getAccountInfo(ata);
  if (existing) return ata;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      ata,
      wallet.publicKey,
      mint,
      TOKEN_PROGRAM_ID
    )
  );

  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(signature, "confirmed");

  return ata;
}

export const PROGRAM_ID = new PublicKey(
  "CnjNV7e85KNBVEgDUkWwnRj8nthUYnaob9nFGFeXbTpT"
);

export const SPLIT_SEED = Buffer.from("split");
export const VAULT_SEED = Buffer.from("vault");
export const MEMBER_SEED = Buffer.from("member");

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return new Program<Divvy>(idl as Divvy, provider);
}

export function getSplitConfigPda(authority: PublicKey, splitId: BN) {
    return PublicKey.findProgramAddressSync(
      [SPLIT_SEED, authority.toBuffer(), splitId.toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    )[0];
  }
  
  export function getVaultPda(splitConfig: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [VAULT_SEED, splitConfig.toBuffer()],
      PROGRAM_ID
    )[0];
  }
  
  export function getMemberAllocationPda(splitConfig: PublicKey, member: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [MEMBER_SEED, splitConfig.toBuffer(), member.toBuffer()],
      PROGRAM_ID
    )[0];
  }
  
  export async function getSplitsForAuthority(
    program: Program<Divvy>,
    authority: PublicKey
  ) {
    return program.account.splitConfig.all([
      {
        memcmp: {
          offset: 8, // skip 8-byte discriminator
          bytes: authority.toBase58(),
        },
      },
    ]);
  }

  export async function getMembersForSplit(
    program: Program<Divvy>,
    splitConfig: PublicKey
  ) {
    return program.account.memberAllocation.all([
      {
        memcmp: {
          offset: 8, // skip 8-byte discriminator
          bytes: splitConfig.toBase58(),
        },
      },
    ]);
  }
