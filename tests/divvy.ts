import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Divvy } from "../target/types/divvy";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { assert } from "chai";

const SPLIT_SEED = Buffer.from("split");
const VAULT_SEED = Buffer.from("vault");
const MEMBER_SEED = Buffer.from("member");

describe("divvy", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.divvy as Program<Divvy>;

  // The team lead / project authority — creates and manages the split
  const authority = provider.wallet as anchor.Wallet;

  // A separate grant giver / foundation that deposits into the vault
  const grantGiver = Keypair.generate();

  const splitId = new BN(Date.now());
  const decimals = 6;
  const unit = 10 ** decimals;

  // Three team members with agreed shares: 70% / 20% / 10%
  const founder = Keypair.generate();
  const developer = Keypair.generate();
  const designer = Keypair.generate();
  const members = [
    { kp: founder, bps: 7000, expected: 700 * unit, role: "founder" },
    { kp: developer, bps: 2000, expected: 200 * unit, role: "developer" },
    { kp: designer, bps: 1000, expected: 100 * unit, role: "designer" },
  ];

  let mint: PublicKey;
  let splitConfig: PublicKey;
  let vault: PublicKey;

  const memberPda = (m: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [MEMBER_SEED, splitConfig.toBuffer(), m.toBuffer()],
      program.programId
    )[0];

  // Fund a keypair with SOL from the authority wallet (reliable on devnet, no rate limits)
  const fundWithSol = async (destination: PublicKey, lamports: number) => {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: destination,
        lamports,
      })
    );
    await sendAndConfirmTransaction(provider.connection, tx, [
      (authority as any).payer,
    ]);
  };

  before(async () => {
    // Fund the grant giver and all team members from the authority wallet
    await fundWithSol(grantGiver.publicKey, 0.1 * 1e9);
    for (const m of members) {
      await fundWithSol(m.kp.publicKey, 0.05 * 1e9);
    }

    // Authority creates the token mint (represents e.g. USDC on devnet)
    mint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      decimals
    );

    // Mint 1000 tokens to the grant giver (simulates grant funds received)
    const grantGiverAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      (authority as any).payer,
      mint,
      grantGiver.publicKey
    );
    await mintTo(
      provider.connection,
      (authority as any).payer,
      mint,
      grantGiverAta.address,
      authority.publicKey,
      1000 * unit
    );

    [splitConfig] = PublicKey.findProgramAddressSync(
      [
        SPLIT_SEED,
        authority.publicKey.toBuffer(),
        splitId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    [vault] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, splitConfig.toBuffer()],
      program.programId
    );
  });

  it("team lead initializes the split in draft", async () => {
    await program.methods
      .initializeSplit(splitId)
      .accountsPartial({
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const cfg = await program.account.splitConfig.fetch(splitConfig);
    assert.equal(cfg.memberCount, 0);
    assert.equal(cfg.totalBps, 0);
    assert.deepEqual(cfg.status, { draft: {} });
  });

  it("team lead adds three members with agreed shares totalling 10000 bps", async () => {
    for (const m of members) {
      await program.methods
        .addMember(m.kp.publicKey, m.bps)
        .accountsPartial({
          splitConfig,
          memberAllocation: memberPda(m.kp.publicKey),
        })
        .rpc();
    }

    const cfg = await program.account.splitConfig.fetch(splitConfig);
    assert.equal(cfg.memberCount, 3);
    assert.equal(cfg.totalBps, 10000);
  });

  it("team lead activates the split — allocations are now locked", async () => {
    await program.methods
      .activateSplit()
      .accountsPartial({ splitConfig })
      .rpc();

    const cfg = await program.account.splitConfig.fetch(splitConfig);
    assert.deepEqual(cfg.status, { active: {} });
  });

  it("grant giver deposits 1000 tokens into the vault", async () => {
    const grantGiverAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      grantGiver,
      mint,
      grantGiver.publicKey
    );

    // Grant giver is a separate wallet — must be the fee payer for this tx
    const grantGiverProvider = new anchor.AnchorProvider(
      provider.connection,
      new anchor.Wallet(grantGiver),
      provider.opts
    );
    const grantGiverProgram = new anchor.Program(program.idl, grantGiverProvider) as Program<Divvy>;

    await grantGiverProgram.methods
      .deposit(new BN(1000 * unit))
      .accountsPartial({
        splitConfig,
        tokenMint: mint,
        depositorTokenAccount: grantGiverAta.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const v = await getAccount(provider.connection, vault);
    assert.equal(Number(v.amount), 1000 * unit);
  });

  it("each team member claims their exact share", async () => {
    for (const m of members) {
      const memberAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        m.kp,
        mint,
        m.kp.publicKey
      );

      await program.methods
        .claim()
        .accountsPartial({
          member: m.kp.publicKey,
          splitConfig,
          tokenMint: mint,
          memberAllocation: memberPda(m.kp.publicKey),
          memberTokenAccount: memberAta.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([m.kp])
        .rpc();

      const acct = await getAccount(provider.connection, memberAta.address);
      assert.equal(
        Number(acct.amount),
        m.expected,
        `${m.role} share mismatch`
      );
    }
  });

  it("rejects a second claim — nothing left to claim", async () => {
    const m = members[0];
    const memberAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      m.kp,
      mint,
      m.kp.publicKey
    );
    try {
      await program.methods
        .claim()
        .accountsPartial({
          member: m.kp.publicKey,
          splitConfig,
          tokenMint: mint,
          memberAllocation: memberPda(m.kp.publicKey),
          memberTokenAccount: memberAta.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([m.kp])
        .rpc();
      assert.fail("expected NothingToClaim");
    } catch (e: any) {
      assert.include(e.toString(), "NothingToClaim");
    }
  });

  it("team lead pauses, closes all members, then closes the split", async () => {
    await program.methods
      .pauseSplit()
      .accountsPartial({ splitConfig })
      .rpc();

    for (const m of members) {
      await program.methods
        .closeMember(m.kp.publicKey)
        .accountsPartial({
          splitConfig,
          memberAllocation: memberPda(m.kp.publicKey),
        })
        .rpc();
    }

    const cfg = await program.account.splitConfig.fetch(splitConfig);
    assert.equal(cfg.memberCount, 0);

    const authorityAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      (authority as any).payer,
      mint,
      authority.publicKey
    );

    await program.methods
      .closeSplit()
      .accountsPartial({
        splitConfig,
        tokenMint: mint,
        authorityTokenAccount: authorityAta.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const closed = await program.account.splitConfig.fetchNullable(splitConfig);
    assert.isNull(closed);
  });
});
