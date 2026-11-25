import { describe, expect, it } from "vitest";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { approveCheckedInstruction, buildApproveTransaction, TOKEN_2022_PROGRAM_ID } from "@/lib/exchange/solana";
import {
  LIGHTHOUSE_PROGRAM_ID,
  SignedTxError,
  checkSignedTransaction,
  compareSignedTransaction,
} from "@/lib/exchange/solana-tx-check";

// Fixed keys, so the vectors are deterministic.
const owner = Keypair.fromSeed(new Uint8Array(32).fill(1));
const other = Keypair.fromSeed(new Uint8Array(32).fill(2));
const ata = Keypair.fromSeed(new Uint8Array(32).fill(3)).publicKey;
const mint = Keypair.fromSeed(new Uint8Array(32).fill(4)).publicKey;
const vault = Keypair.fromSeed(new Uint8Array(32).fill(5)).publicKey;
const blockhash = Keypair.fromSeed(new Uint8Array(32).fill(6)).publicKey.toBase58();

const approve = (amount = BigInt(1_000_000)) =>
  approveCheckedInstruction({
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    source: ata,
    mint,
    delegate: vault,
    owner: owner.publicKey,
    amount,
    decimals: 6,
  });

/** A v0 transaction (no lookup tables), as `buildApproveTransaction` builds it. */
function v0(payer: Keypair, instructions: TransactionInstruction[], signers: Keypair[] = []): Uint8Array {
  const message = new TransactionMessage({ payerKey: payer.publicKey, recentBlockhash: blockhash, instructions }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  if (signers.length > 0) tx.sign(signers);
  return tx.serialize();
}

function unsigned(): Uint8Array {
  return v0(owner, [approve()]);
}

/** What a wallet would return: its own instruction list, signed by `payer`. */
function signedWith(instructions: TransactionInstruction[], payer: Keypair = owner): Uint8Array {
  return v0(payer, instructions, [payer]);
}

const lighthouse = (discriminator: number, account: PublicKey) =>
  new TransactionInstruction({
    programId: new PublicKey(LIGHTHOUSE_PROGRAM_ID),
    keys: [{ pubkey: account, isSigner: false, isWritable: false }],
    data: Buffer.from([discriminator, 0, 1, 2, 3]),
  });

function codeOf(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof SignedTxError ? e.code : `not a SignedTxError: ${String(e)}`;
  }
}

describe("compareSignedTransaction", () => {
  it("accepts the identical transaction, with nothing added", async () => {
    const signed = signedWith([approve()]);
    expect(compareSignedTransaction(unsigned(), signed)).toEqual([]);
    await expect(checkSignedTransaction(unsigned(), signed, owner.publicKey.toBase58())).resolves.toEqual([]);
  });

  it("accepts ComputeBudget priority-fee instructions added before the original", async () => {
    const signed = signedWith([
      ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }),
      approve(),
    ]);
    const added = await checkSignedTransaction(unsigned(), signed, owner.publicKey.toBase58());
    expect(added.map((a) => a.kind)).toEqual(["compute_budget", "compute_budget"]);
  });

  it("accepts a Lighthouse read-only assertion on our token account", () => {
    // 9 = AssertTokenAccount
    const signed = signedWith([ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 }), approve(), lighthouse(9, ata)]);
    expect(compareSignedTransaction(unsigned(), signed).map((a) => a.kind)).toEqual(["compute_budget", "lighthouse_assertion"]);
  });

  it("refuses a Lighthouse MemoryWrite that reads our token account", () => {
    // 0 = MemoryWrite: writes to a memory account, not a read-only assertion
    expect(codeOf(() => compareSignedTransaction(unsigned(), signedWith([approve(), lighthouse(0, ata)])))).toBe(
      "touches_token_accounts",
    );
  });

  it("refuses an instruction of an unknown program, and names it", () => {
    const transfer = SystemProgram.transfer({ fromPubkey: owner.publicKey, toPubkey: other.publicKey, lamports: 1 });
    try {
      compareSignedTransaction(unsigned(), signedWith([approve(), transfer]));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(SignedTxError);
      expect((e as SignedTxError).code).toBe("unknown_program");
      expect((e as SignedTxError).detail).toContain(SystemProgram.programId.toBase58());
    }
  });

  it("refuses a changed original instruction", () => {
    expect(codeOf(() => compareSignedTransaction(unsigned(), signedWith([approve(BigInt(2_000_000))])))).toBe(
      "original_changed",
    );
  });

  it("refuses a removed original instruction", () => {
    expect(
      codeOf(() => compareSignedTransaction(unsigned(), signedWith([ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1 })]))),
    ).toBe("original_changed");
  });

  it("refuses a changed fee payer", () => {
    // The original approve keeps the owner as a signer, so `other` pays and both must sign.
    const tx = v0(other, [approve()], [other, owner]);
    expect(codeOf(() => compareSignedTransaction(unsigned(), tx))).toBe("fee_payer_changed");
  });

  it("refuses an unsigned or wrongly signed transaction", async () => {
    const bytes = v0(owner, [approve()]);
    await expect(checkSignedTransaction(unsigned(), bytes, owner.publicKey.toBase58())).rejects.toMatchObject({ code: "not_signed" });
    const forged = signedWith([approve()]);
    forged[1] ^= 0xff; // corrupt the signature
    await expect(checkSignedTransaction(unsigned(), forged, owner.publicKey.toBase58())).rejects.toMatchObject({ code: "not_signed" });
  });

  it("refuses a v0 approval that comes back as a legacy transaction", () => {
    const legacy = new Transaction({ feePayer: owner.publicKey, blockhash, lastValidBlockHeight: 1 }).add(approve());
    legacy.sign(owner);
    expect(codeOf(() => compareSignedTransaction(unsigned(), new Uint8Array(legacy.serialize())))).toBe("version_changed");
  });
});

describe("buildApproveTransaction", () => {
  it("builds a v0 transaction with one exact approve_checked and no lookup tables", async () => {
    const conn = { getLatestBlockhash: async () => ({ blockhash, lastValidBlockHeight: 99 }) };
    const programId = Keypair.fromSeed(new Uint8Array(32).fill(8)).publicKey.toBase58();
    const built = await buildApproveTransaction(conn as never, {
      owner: owner.publicKey.toBase58(),
      mint: mint.toBase58(),
      programId,
      amount: BigInt(1_234_567),
      decimals: 6,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    });
    const tx = VersionedTransaction.deserialize(built.bytes);
    expect(tx.message.version).toBe(0);
    expect(tx.message.addressTableLookups).toHaveLength(0);
    expect(tx.message.staticAccountKeys[0].toBase58()).toBe(owner.publicKey.toBase58());
    expect(tx.message.compiledInstructions).toHaveLength(1);
    const ix = tx.message.compiledInstructions[0];
    expect(tx.message.staticAccountKeys[ix.programIdIndex].toBase58()).toBe(TOKEN_2022_PROGRAM_ID.toBase58());
    expect(ix.data[0]).toBe(13);
    expect(new DataView(ix.data.buffer, ix.data.byteOffset).getBigUint64(1, true)).toBe(BigInt(1_234_567));
    expect(built.lastValidBlockHeight).toBe(99);
    // The wallet signing it unchanged passes the check.
    const signed = VersionedTransaction.deserialize(built.bytes);
    signed.sign([owner]);
    await expect(checkSignedTransaction(built.bytes, signed.serialize(), owner.publicKey.toBase58())).resolves.toEqual([]);
  });
});
