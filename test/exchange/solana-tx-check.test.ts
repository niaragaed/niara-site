import { describe, expect, it } from "vitest";
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { approveCheckedInstruction, TOKEN_2022_PROGRAM_ID } from "@/lib/exchange/solana";
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

function unsigned(): Uint8Array {
  const tx = new Transaction({ feePayer: owner.publicKey, blockhash, lastValidBlockHeight: 1 }).add(approve());
  return new Uint8Array(tx.serialize({ requireAllSignatures: false, verifySignatures: false }));
}

/** What a wallet would return: its own instruction list, signed by `payer`. */
function signedWith(instructions: TransactionInstruction[], payer: Keypair = owner): Uint8Array {
  const tx = new Transaction({ feePayer: payer.publicKey, blockhash, lastValidBlockHeight: 1 }).add(...instructions);
  tx.sign(payer);
  return new Uint8Array(tx.serialize());
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
    const tx = new Transaction({ feePayer: other.publicKey, blockhash, lastValidBlockHeight: 1 }).add(approve());
    tx.sign(other, owner);
    expect(codeOf(() => compareSignedTransaction(unsigned(), new Uint8Array(tx.serialize())))).toBe("fee_payer_changed");
  });

  it("refuses an unsigned or wrongly signed transaction", async () => {
    const tx = new Transaction({ feePayer: owner.publicKey, blockhash, lastValidBlockHeight: 1 }).add(approve());
    const bytes = new Uint8Array(tx.serialize({ requireAllSignatures: false, verifySignatures: false }));
    await expect(checkSignedTransaction(unsigned(), bytes, owner.publicKey.toBase58())).rejects.toMatchObject({ code: "not_signed" });
    const forged = signedWith([approve()]);
    forged[1] ^= 0xff; // corrupt the signature
    await expect(checkSignedTransaction(unsigned(), forged, owner.publicKey.toBase58())).rejects.toMatchObject({ code: "not_signed" });
  });
});
