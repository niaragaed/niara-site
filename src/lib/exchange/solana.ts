// Reads and the delegate transaction on Solana devnet for the order book
// (spec §3.5): an order stays live while the wallet's associated token account (ATA)
// delegates to the program's vault PDA at least what `settle` would move.
//
// Only the approve transaction is built here; the wallet signs it
// (`solana:signTransaction`) and it is sent through the configured devnet RPC, after
// checking the genesis hash — never through an RPC chosen by the wallet.
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  type ParsedAccountData,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { SOLANA_DEVNET_GENESIS } from "./chains";

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const connections = new Map<string, Connection>();

export function solanaConnection(rpcUrl: string): Connection {
  let c = connections.get(rpcUrl);
  if (!c) {
    c = new Connection(rpcUrl, "confirmed");
    connections.set(rpcUrl, c);
  }
  return c;
}

const devnetChecked = new WeakSet<Connection>();

/** Rejects any RPC that is not devnet (same check as the engine). */
export async function assertDevnet(connection: Connection): Promise<void> {
  if (devnetChecked.has(connection)) return;
  const genesis = await connection.getGenesisHash();
  if (genesis !== SOLANA_DEVNET_GENESIS) throw new Error("the configured Solana RPC is not devnet");
  devnetChecked.add(connection);
}

/** The program's `["vault"]` PDA: the delegate of order-book orders. */
export function vaultAuthority(programId: string): PublicKey {
  return PublicKey.findProgramAddressSync([new TextEncoder().encode("vault")], new PublicKey(programId))[0];
}

export function associatedTokenAddress(mint: PublicKey, owner: PublicKey, tokenProgram: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBytes(), tokenProgram.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

export interface SolanaMintInfo {
  decimals: number;
  tokenProgram: PublicKey;
  /** From the tokenMetadata extension (Token-2022), when present. */
  name: string | null;
  symbol: string | null;
}

export async function readMint(connection: Connection, mint: string): Promise<SolanaMintInfo> {
  const res = await connection.getParsedAccountInfo(new PublicKey(mint));
  const account = res.value;
  if (!account) throw new Error(`mint ${mint} not found`);
  const owner = account.owner;
  if (!owner.equals(TOKEN_PROGRAM_ID) && !owner.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new Error(`${mint} is not an SPL token mint`);
  }
  const data = account.data as ParsedAccountData;
  const info = (data.parsed?.info ?? {}) as {
    decimals?: number;
    extensions?: { extension: string; state?: { name?: string; symbol?: string } }[];
  };
  if (typeof info.decimals !== "number") throw new Error(`${mint} is not a mint`);
  const meta = info.extensions?.find((e) => e.extension === "tokenMetadata")?.state;
  return {
    decimals: info.decimals,
    tokenProgram: owner,
    name: meta?.name?.trim() || null,
    symbol: meta?.symbol?.trim() || null,
  };
}

export interface SolanaTokenAccountState {
  address: PublicKey;
  exists: boolean;
  amount: bigint;
  delegate: string | null;
  delegatedAmount: bigint;
  frozen: boolean;
}

/** State of the ATA (balance and delegate) — the same account the engine checks. */
export async function readTokenAccount(
  connection: Connection,
  owner: string,
  mint: string,
  tokenProgram: PublicKey,
): Promise<SolanaTokenAccountState> {
  const address = associatedTokenAddress(new PublicKey(mint), new PublicKey(owner), tokenProgram);
  const res = await connection.getParsedAccountInfo(address);
  const zero = BigInt(0);
  if (!res.value) return { address, exists: false, amount: zero, delegate: null, delegatedAmount: zero, frozen: false };
  const info = ((res.value.data as ParsedAccountData).parsed?.info ?? {}) as {
    tokenAmount?: { amount: string };
    delegate?: string;
    delegatedAmount?: { amount: string };
    state?: string;
  };
  return {
    address,
    exists: true,
    amount: BigInt(info.tokenAmount?.amount ?? "0"),
    delegate: info.delegate ?? null,
    delegatedAmount: BigInt(info.delegatedAmount?.amount ?? "0"),
    frozen: info.state === "frozen",
  };
}

/** `approve_checked` (SPL Token / Token-2022 instruction 13): delegates `amount` to `delegate`. */
export function approveCheckedInstruction(args: {
  tokenProgram: PublicKey;
  source: PublicKey;
  mint: PublicKey;
  delegate: PublicKey;
  owner: PublicKey;
  amount: bigint;
  decimals: number;
}): TransactionInstruction {
  const data = new Uint8Array(10);
  const view = new DataView(data.buffer);
  data[0] = 13;
  view.setBigUint64(1, args.amount, true);
  data[9] = args.decimals;
  return new TransactionInstruction({
    programId: args.tokenProgram,
    keys: [
      { pubkey: args.source, isSigner: false, isWritable: true },
      { pubkey: args.mint, isSigner: false, isWritable: false },
      { pubkey: args.delegate, isSigner: false, isWritable: false },
      { pubkey: args.owner, isSigner: true, isWritable: false },
    ],
    data: Buffer.from(data),
  });
}

/**
 * Legacy transaction with a single `approve_checked` of the EXACT amount to the vault
 * PDA. Fee payer = the wallet itself.
 */
export async function buildApproveTransaction(
  connection: Connection,
  args: { owner: string; mint: string; programId: string; amount: bigint; decimals: number; tokenProgram: PublicKey },
): Promise<{ bytes: Uint8Array; blockhash: string; lastValidBlockHeight: number }> {
  const owner = new PublicKey(args.owner);
  const mint = new PublicKey(args.mint);
  const ix = approveCheckedInstruction({
    tokenProgram: args.tokenProgram,
    source: associatedTokenAddress(mint, owner, args.tokenProgram),
    mint,
    delegate: vaultAuthority(args.programId),
    owner,
    amount: args.amount,
    decimals: args.decimals,
  });
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: owner, blockhash, lastValidBlockHeight }).add(ix);
  const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  return { bytes: new Uint8Array(bytes), blockhash, lastValidBlockHeight };
}

/**
 * Checks that the transaction the wallet signed is the one we built (same
 * message) before sending — a wallet cannot swap the contents.
 */
export function checkSignedTransaction(unsigned: Uint8Array, signed: Uint8Array, owner: string): void {
  const a = Transaction.from(unsigned);
  const b = Transaction.from(signed);
  const ma = a.serializeMessage();
  const mb = b.serializeMessage();
  if (ma.length !== mb.length || !ma.every((byte, i) => byte === mb[i])) {
    throw new Error("the wallet returned a different transaction");
  }
  const sig = b.signatures.find((s) => s.publicKey.toBase58() === owner);
  if (!sig?.signature) throw new Error("the wallet did not sign the transaction");
}

export async function sendAndConfirm(
  connection: Connection,
  signed: Uint8Array,
  blockhash: string,
  lastValidBlockHeight: number,
): Promise<string> {
  await assertDevnet(connection);
  const signature = await connection.sendRawTransaction(signed, { preflightCommitment: "confirmed" });
  const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (result.value.err) throw Object.assign(new Error("the approval transaction failed on-chain"), { signature });
  return signature;
}

// Anchor discriminator of the `Config` account (IDL vendored in the engine).
const CONFIG_DISCRIMINATOR = [155, 12, 170, 224, 30, 250, 204, 130];

export interface SolanaProgramTerms {
  feeMint: string;
  feeBps: number;
  cashbackBps: number;
  paused: boolean;
}

/**
 * Reads the program's `Config` (PDA `["config"]`). Layout (IDL): discriminator (8),
 * admin, listing_authority, settlement_operator, treasury, fee_mint (5 × 32),
 * fee_bps u16, cashback_bps u16, paused bool, …
 */
export async function readProgramTerms(connection: Connection, programId: string): Promise<SolanaProgramTerms> {
  const pda = PublicKey.findProgramAddressSync([new TextEncoder().encode("config")], new PublicKey(programId))[0];
  const account = await connection.getAccountInfo(pda);
  if (!account || !account.owner.equals(new PublicKey(programId))) throw new Error("program config not found");
  const data = new Uint8Array(account.data);
  if (data.length < 173 || !CONFIG_DISCRIMINATOR.every((b, i) => data[i] === b)) {
    throw new Error("unexpected program config layout");
  }
  const view = new DataView(data.buffer, data.byteOffset, data.length);
  return {
    feeMint: new PublicKey(data.subarray(8 + 4 * 32, 8 + 5 * 32)).toBase58(),
    feeBps: view.getUint16(168, true),
    cashbackBps: view.getUint16(170, true),
    paused: data[172] === 1,
  };
}
