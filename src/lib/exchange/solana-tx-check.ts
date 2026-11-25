// Checks the approve transaction a Solana wallet returns from `signTransaction`
// against the one this site built, before anything is sent.
//
// Real wallets (Phantom, for example) add instructions before they sign: ComputeBudget
// priority fees and Lighthouse assertions. Those are accepted, and nothing else is:
// - the transaction version (v0 here, legacy before), the fee payer and the recent
//   blockhash are unchanged, and there are no address lookup tables and no extra
//   required signers;
// - every original instruction is still there, byte-identical (program, account keys
//   with their signer/writable flags, and data) and in the same order;
// - every added instruction belongs to ComputeBudget or Lighthouse;
// - an added instruction may reference our token accounts (the original instructions'
//   non-signer accounts: token account, mint, delegate) only as a read-only Lighthouse
//   assertion. ComputeBudget instructions take no accounts at all.
import { VersionedTransaction, type VersionedMessage } from "@solana/web3.js";
import { verifyAsync } from "@noble/ed25519";
import { base58 } from "@scure/base";

export const COMPUTE_BUDGET_PROGRAM_ID = "ComputeBudget111111111111111111111111111111";
export const LIGHTHOUSE_PROGRAM_ID = "L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95";

/**
 * Lighthouse instruction discriminators (first data byte, Borsh enum index) that are
 * pure assertions: 2 AssertAccountData … 17 AssertBubblegumTreeConfigAccount. 0
 * MemoryWrite and 1 MemoryClose write to accounts and are not assertions.
 */
const LIGHTHOUSE_FIRST_ASSERTION = 2;
const LIGHTHOUSE_LAST_ASSERTION = 17;

export type SignedTxCheckCode =
  | "unreadable"
  | "version_changed"
  | "fee_payer_changed"
  | "blockhash_changed"
  | "lookup_tables"
  | "extra_signers"
  | "original_changed"
  | "unknown_program"
  | "touches_token_accounts"
  | "not_signed";

export class SignedTxError extends Error {
  constructor(
    readonly code: SignedTxCheckCode,
    readonly detail: string,
  ) {
    super(`the wallet returned a different transaction (${code}): ${detail}`);
    this.name = "SignedTxError";
  }
}

interface AccountRef {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
}

export interface ResolvedInstruction {
  programId: string;
  accounts: AccountRef[];
  data: Uint8Array;
}

/** What the wallet added, for display. */
export interface AddedInstruction {
  programId: string;
  kind: "compute_budget" | "lighthouse_assertion";
}

interface Parsed {
  message: VersionedMessage;
  feePayer: string;
  instructions: ResolvedInstruction[];
}

function parse(bytes: Uint8Array): Parsed {
  let tx: VersionedTransaction;
  try {
    tx = VersionedTransaction.deserialize(bytes);
  } catch (e) {
    throw new SignedTxError("unreadable", e instanceof Error ? e.message : String(e));
  }
  const m = tx.message;
  if (m.addressTableLookups.length > 0) {
    throw new SignedTxError("lookup_tables", "the transaction uses address lookup tables, which this site does not resolve");
  }
  const keys = m.staticAccountKeys.map((k) => k.toBase58());
  const instructions = m.compiledInstructions.map((ix) => ({
    programId: keys[ix.programIdIndex],
    accounts: ix.accountKeyIndexes.map((i) => ({
      pubkey: keys[i],
      isSigner: m.isAccountSigner(i),
      isWritable: m.isAccountWritable(i),
    })),
    data: new Uint8Array(ix.data),
  }));
  return { message: m, feePayer: keys[0], instructions };
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function sameInstruction(a: ResolvedInstruction, b: ResolvedInstruction): boolean {
  return (
    a.programId === b.programId &&
    a.accounts.length === b.accounts.length &&
    a.accounts.every(
      (x, i) =>
        x.pubkey === b.accounts[i].pubkey &&
        x.isSigner === b.accounts[i].isSigner &&
        x.isWritable === b.accounts[i].isWritable,
    ) &&
    sameBytes(a.data, b.data)
  );
}

const describe = (ix: ResolvedInstruction) =>
  `program ${ix.programId}${ix.data.length > 0 ? ` (instruction ${ix.data[0]})` : ""}`;

/**
 * Compares the message of the signed transaction with the unsigned one. Throws a
 * `SignedTxError` that says what changed or what was added; returns the added
 * instructions otherwise. Does not check signatures (see `checkSignedTransaction`).
 */
export function compareSignedTransaction(unsigned: Uint8Array, signed: Uint8Array): AddedInstruction[] {
  const a = parse(unsigned);
  const b = parse(signed);

  if (a.message.version !== b.message.version) {
    throw new SignedTxError("version_changed", `a ${a.message.version} transaction came back as ${b.message.version}`);
  }
  if (a.feePayer !== b.feePayer) {
    throw new SignedTxError("fee_payer_changed", `fee payer ${a.feePayer} became ${b.feePayer}`);
  }
  if (a.message.recentBlockhash !== b.message.recentBlockhash) {
    throw new SignedTxError("blockhash_changed", "the wallet replaced the recent blockhash");
  }
  if (b.message.header.numRequiredSignatures !== a.message.header.numRequiredSignatures) {
    throw new SignedTxError(
      "extra_signers",
      `${b.message.header.numRequiredSignatures} signers required instead of ${a.message.header.numRequiredSignatures}`,
    );
  }

  // The original instructions, in order, as a subsequence of the signed ones.
  const added: ResolvedInstruction[] = [];
  let next = 0;
  for (const ix of b.instructions) {
    if (next < a.instructions.length && sameInstruction(ix, a.instructions[next])) next++;
    else added.push(ix);
  }
  if (next < a.instructions.length) {
    const missing = a.instructions[next];
    throw new SignedTxError(
      "original_changed",
      `the original instruction ${next + 1} (${describe(missing)}) is missing or was modified`,
    );
  }

  // Our token accounts: every non-signer account of the original instructions.
  const ours = new Set(a.instructions.flatMap((ix) => ix.accounts.filter((k) => !k.isSigner).map((k) => k.pubkey)));

  return added.map((ix): AddedInstruction => {
    if (ix.programId === COMPUTE_BUDGET_PROGRAM_ID) {
      if (ix.accounts.length > 0) {
        throw new SignedTxError("touches_token_accounts", `a ComputeBudget instruction references accounts (${describe(ix)})`);
      }
      return { programId: ix.programId, kind: "compute_budget" };
    }
    if (ix.programId === LIGHTHOUSE_PROGRAM_ID) {
      const d = ix.data[0];
      const assertion = d !== undefined && d >= LIGHTHOUSE_FIRST_ASSERTION && d <= LIGHTHOUSE_LAST_ASSERTION;
      if (!assertion) {
        // MemoryWrite / MemoryClose (or an unknown instruction) are only acceptable
        // away from our token accounts.
        const touched = ix.accounts.find((k) => ours.has(k.pubkey));
        if (touched || d === undefined || d > LIGHTHOUSE_LAST_ASSERTION) {
          throw new SignedTxError(
            "touches_token_accounts",
            `a Lighthouse instruction that is not a read-only assertion (${describe(ix)})${touched ? ` references ${touched.pubkey}` : ""}`,
          );
        }
      }
      return { programId: ix.programId, kind: "lighthouse_assertion" };
    }
    throw new SignedTxError("unknown_program", `the wallet added an instruction of ${describe(ix)}`);
  });
}

/**
 * Full check before sending: the message comparison above, plus a valid ed25519
 * signature of `owner` (the fee payer) over the signed message.
 */
export async function checkSignedTransaction(
  unsigned: Uint8Array,
  signed: Uint8Array,
  owner: string,
): Promise<AddedInstruction[]> {
  const added = compareSignedTransaction(unsigned, signed);
  const tx = VersionedTransaction.deserialize(signed);
  const keys = tx.message.staticAccountKeys.map((k) => k.toBase58());
  const index = keys.indexOf(owner);
  const sig = index >= 0 && index < tx.message.header.numRequiredSignatures ? tx.signatures[index] : undefined;
  if (!sig || sig.every((x) => x === 0)) throw new SignedTxError("not_signed", "the wallet did not sign the transaction");
  const ok = await verifyAsync(sig, tx.message.serialize(), base58.decode(owner), { zip215: false });
  if (!ok) throw new SignedTxError("not_signed", "the wallet's signature does not verify");
  return added;
}
