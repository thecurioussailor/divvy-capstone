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
import { Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { BN } from "bn.js";

const SPLIT_SEED = Buffer.from("split");
const VAULT_SEED = Buffer.from("vault");
const MEMBER_SEED = Buffer.from("member");

describe("divvy", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.divvy as Program<Divvy>;
  const authority = provider.wallet as anchor.Wallet;

  const splitId = new BN(1);
  const decimals = 6;
  const unit = 10 ** decimals;

  const founder = Keypair.generate();
  const developer = Keypair.generate();
  const designer = Keypair.generate();
  const members = [
    { kp: founder, bps: 7000, expected: 700 * unit },
    { kp: developer, bps: 2000, expected: 200 * unit },
    { kp: designer, bps: 1000, expected: 100 * unit },
  ];

  let mint: PublicKey;
  let splitConfig: PublicKey;
  let vault: PublicKey;

  const memberPda = (m: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [MEMBER_SEED, splitConfig.toBuffer(), m.toBuffer()],
      program.programId
    )[0];

  before(async () => {
    mint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      decimals
    );

    [splitConfig] = PublicKey.findProgramAddressSync(
      [SPLIT_SEED, authority.publicKey.toBuffer(), splitId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [vault] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, splitConfig.toBuffer()],
      program.programId
    );
  });

  it("initializes a split in draft", async () => {
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

  it("adds three members totalling 10000 bps", async () => {
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

  it("activates the split", async () => {
    await program.methods
      .activateSplit()
      .accountsPartial({ splitConfig })
      .rpc();

    const cfg = await program.account.splitConfig.fetch(splitConfig);
    assert.deepEqual(cfg.status, { active: {} });
  });

  it("accepts a 1000 token deposit", async () => {
    const depositorAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      (authority as any).payer,
      mint,
      authority.publicKey
    );
    await mintTo(
      provider.connection,
      (authority as any).payer,
      mint,
      depositorAta.address,
      authority.publicKey,
      1000 * unit
    );

    await program.methods
      .deposit(new BN(1000 * unit))
      .accountsPartial({
        splitConfig,
        tokenMint: mint,
        depositorTokenAccount: depositorAta.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const v = await getAccount(provider.connection, vault);
    assert.equal(Number(v.amount), 1000 * unit);
  });

  it("lets each member claim their exact share", async () => {
    for (const m of members) {
      const sig = await provider.connection.requestAirdrop(m.kp.publicKey, 1e9);
      await provider.connection.confirmTransaction({
        signature: sig,
        ...(await provider.connection.getLatestBlockhash()),
      });

      const memberAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        (authority as any).payer,
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
      assert.equal(Number(acct.amount), m.expected, "member share mismatch");
    }
  });

  it("rejects a second claim with nothing to claim", async () => {
    const m = members[0];
    const memberAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      (authority as any).payer,
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

  it("pauses, closes members, then closes the split", async () => {
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
