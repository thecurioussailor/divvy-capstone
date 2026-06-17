# Divvy

A composable revenue-distribution primitive on Solana. Funds are pooled in a PDA-owned vault and each member claims their fixed percentage share on demand using lazy accounting — no push transfers, no admin intervention needed.

## What it does

Divvy lets you create a token split where a group of members each hold a fixed percentage (in basis points). Anyone can deposit tokens into the vault. Members pull their share whenever they want. The math is simple:

```
entitled  = floor(total_deposited * share_bps / 10_000)
claimable = entitled - total_claimed
```

Dust from floor division stays in the vault and is swept to the authority on close.

## Token support

Built on `anchor_spl::token_interface` — works with both classic SPL Token and Token-2022 mints. Mints with the Token-2022 transfer-fee extension are rejected at initialization since a fee would break deposit accounting.

## Instructions

| Instruction | Description |
|---|---|
| `initialize_split(split_id)` | Create pool + vault, status = Draft |
| `add_member(member, share_bps)` | Add a member with a fixed share (Draft only) |
| `activate_split()` | Lock allocations; shares must sum to exactly 10,000 bps |
| `deposit(amount)` | Anyone deposits the split's token into the vault |
| `claim()` | Member withdraws their accrued share to their ATA |
| `pause_split()` | Authority pauses deposits (claims still allowed) |
| `resume_split()` | Authority resumes from Paused back to Active |
| `close_member(member)` | Close a fully-claimed member account (Paused only) |
| `close_split()` | Sweep dust, close vault + config once all members are closed |

Wind-down order: `pause_split` → members claim → `close_member` × N → `close_split`

## Accounts (PDAs)

| Account | Seeds |
|---|---|
| `SplitConfig` | `["split", authority, split_id]` |
| `MemberAllocation` | `["member", split_config, member]` |
| `Vault` | `["vault", split_config]` |

## Build & test

```bash
yarn
anchor build
anchor test
```

Tests cover the full lifecycle: initialize → add 3 members (70/20/10%) → activate → deposit 1,000 tokens → each member claims their exact share → double-claim rejected → pause → close members → close split.

## Devnet

> Program ID and passing test screenshot will be added after devnet deployment.

## Program ID

> To be added after devnet deployment.
