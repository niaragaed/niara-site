// Testes de construção e assinatura de intents: os payloads do site precisam
// bater byte a byte com o verificador do niara-exchange-engine.
//
// 1. Vetores dourados: gerados executando o próprio src/intents do engine
//    (commit d5b32d6) com chaves de TESTE fixas — bytes padronizados, nunca
//    usadas em rede nenhuma. As assinaturas são determinísticas (ed25519 e
//    ECDSA RFC 6979), então reproduzi-las prova o payload inteiro.
// 2. Diferencial (opcional): com NIARA_ENGINE_DIR apontando para o repo do
//    engine, importa o verificador real e confere intents aleatórias.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { getPublicKeyAsync, signAsync, verifyAsync } from "@noble/ed25519";
import { base58 } from "@scure/base";
import { privateKeyToAccount } from "viem/accounts";
import { recoverTypedDataAddress, type Hex } from "viem";
import { describe, expect, it } from "vitest";
import {
  CANCEL_ORDER_TYPES,
  IntentError,
  ORDER_INTENT_TYPEHASH,
  cancelToJson,
  encodeSolanaSignature,
  evmCancelDigest,
  evmCancelTypedData,
  evmIntentDigest,
  evmIntentTypedData,
  intentToJson,
  normalizeEvmSignature,
  randomNonce,
  solanaCancelMessage,
  solanaIntentMessage,
  validateIntent,
  type CancelIntent,
  type OrderIntent,
} from "@/lib/exchange/intents";
import { CHAINS } from "@/lib/exchange/chains";

const big = (v: string | number) => BigInt(v);
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
const pat = (b: number) => base58.encode(new Uint8Array(32).fill(b));

// Chaves de TESTE fixas.
const SOL_SECRET = new Uint8Array(32).fill(7);
const EVM_ACCOUNT = privateKeyToAccount(`0x${"11".repeat(32)}`);

const GOLDEN = {
  solWallet: "GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB",
  solMsgHex:
    "4e696172612045786368616e6765206f7264657220696e74656e742076310a544553544e4554204f4e4c593a206e6f207265616c206173736574732c206e6f207265616c206d6f6e65792e0a0a436861696e3a20736f6c616e613a457457545241425a61597136694d6665594b6f755275313636565532787161310a50726f6772616d3a2034764a394a5531624a4a4539364657534a4b7648736d6d46414443673467705a516666345033626b4c4b690a57616c6c65743a20476d6144727070424337503541524b56386733646a6977503839767a316a4c4b3233563247426a75414547420a536964653a206275790a41737365743a2038716248627732426262544842573173626571616b5958564b52514d384e6537704c4b376d3643566665520a5175616e746974793a203530303030303020286173736574206261736520756e697473290a4c6f742073697a653a203130303030303020286173736574206261736520756e697473290a4c696d69742070726963653a20323530303030303020287061796d656e74206261736520756e69747320706572206c6f74290a5061796d656e742061737365743a20436b74527551326d74746752476b584a74796b73644b486a5564633243345467447a794239386f457a79380a4e6f6e63653a2030313233343536373839616263646566303132333435363738396162636465660a457870697265732061743a20313830303038363430302028756e6978207365636f6e647329",
  solSig: "qqQxdKSMuh8EiJnHSukVs8f4Nxfow5ENKbWPQwP5ywtnbah3jbVhFvUsf4VUd1DXEKxUM2QAbcFwgYmwi6vhv87",
  solCancelHex:
    "4e696172612045786368616e67652063616e63656c206f726465722076310a544553544e4554204f4e4c593a206e6f207265616c206173736574732c206e6f207265616c206d6f6e65792e0a0a436861696e3a20736f6c616e613a457457545241425a61597136694d6665594b6f755275313636565532787161310a50726f6772616d3a2034764a394a5531624a4a4539364657534a4b7648736d6d46414443673467705a516666345033626b4c4b690a57616c6c65743a20476d6144727070424337503541524b56386733646a6977503839767a316a4c4b3233563247426a75414547420a4f72646572206e6f6e63653a203031323334353637383961626364656630313233343536373839616263646566",
  solCancelSig: "5bRd6ZgPSX5UhKgUqN2N3PiVP1E2sHwUbSju34MJpnmxzcW1qn6jA7RBWJcr2tPRS88uRrXXh3JAe6YCjTpgdBCj",
  evmWallet: "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
  evmDigest: "0xe349b0b095437fb64fa1778d6cff27fe3a3f9f55b8e284494b685efbd26aca94",
  evmSig:
    "0x7e6662f4a1aa241a2c9846c12677930b98fa586d32d51fa8b455ea7e4e3f9ad22ff147cb4d9bc653bb88379557ae973fe84b06471ab63b3670c118c3f45cb0711c",
  evmCancelDigest: "0x4458e17066aa8b35316b9800e65f7d1d4532aceb9a39f6e193c2655c66c5d6f1",
  evmCancelSig:
    "0xc77997c97afaff4bff26a30c468be2008eab105a39910abab088c95773e915363793d8e22189acf052b1fa84c99349b1019a3ea563ee344e3bc5683ed19b7eb41b",
  typehash: "0x1f5edfcb65775e54f41c81a02d2ab0595cb1a31ddd7affe5125b459688e09f5d",
} as const;

function solIntent(overrides: Partial<OrderIntent> = {}): OrderIntent {
  return {
    version: 1,
    chain: "solana-devnet",
    settlement: pat(1),
    wallet: GOLDEN.solWallet,
    side: "buy",
    asset: pat(2),
    quantity: big(5000000),
    lotSize: big(1000000),
    limitPrice: big(25000000),
    paymentAsset: pat(3),
    nonce: "0123456789abcdef0123456789abcdef",
    expiresAt: 1800086400,
    ...overrides,
  };
}

function evmIntent(overrides: Partial<OrderIntent> = {}): OrderIntent {
  return {
    version: 1,
    chain: "base-sepolia",
    settlement: "0x00000000000000000000000000000000005e7701",
    wallet: GOLDEN.evmWallet,
    side: "sell",
    asset: "0x000000000000000000000000000000000000e001",
    quantity: big(5) * big(10) ** big(18),
    lotSize: big(10) ** big(18),
    limitPrice: big(25000000),
    paymentAsset: "0x000000000000000000000000000000000000d001",
    nonce: "fedcba9876543210fedcba9876543210",
    expiresAt: 1800086400,
    ...overrides,
  };
}

const cancelOf = (i: OrderIntent): CancelIntent => ({
  version: 1,
  chain: i.chain,
  settlement: i.settlement,
  wallet: i.wallet,
  nonce: i.nonce,
});

describe("Solana order intent (signMessage text)", () => {
  it("derives the golden test wallet from the fixed test key", async () => {
    expect(base58.encode(await getPublicKeyAsync(SOL_SECRET))).toBe(GOLDEN.solWallet);
  });

  it("builds the engine's exact bytes", () => {
    expect(hex(solanaIntentMessage(solIntent()))).toBe(GOLDEN.solMsgHex);
  });

  it("is the documented labeled text, no trailing newline", () => {
    const text = new TextDecoder().decode(solanaIntentMessage(solIntent()));
    expect(text.split("\n")[0]).toBe("Niara Exchange order intent v1");
    expect(text).toContain("Chain: solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1");
    expect(text.endsWith("(unix seconds)")).toBe(true);
  });

  it("signs to the engine's golden signature, which verifies strictly", async () => {
    const msg = solanaIntentMessage(solIntent());
    const sig = encodeSolanaSignature(await signAsync(msg, SOL_SECRET));
    expect(sig).toBe(GOLDEN.solSig);
    expect(await verifyAsync(base58.decode(sig), msg, base58.decode(GOLDEN.solWallet), { zip215: false })).toBe(true);
  });

  it("changes with every signed field", () => {
    const base = hex(solanaIntentMessage(solIntent()));
    const variants: Partial<OrderIntent>[] = [
      { side: "sell" },
      { asset: pat(9) },
      { quantity: big(6000000) },
      { limitPrice: big(25000001) },
      { paymentAsset: pat(9) },
      { nonce: "11111111111111111111111111111111" },
      { expiresAt: 1800086401 },
      { settlement: pat(9) },
    ];
    for (const v of variants) expect(hex(solanaIntentMessage(solIntent(v)))).not.toBe(base);
  });

  it("refuses an EVM chain", () => {
    expect(() => solanaIntentMessage(solIntent({ chain: "base-sepolia" }))).toThrow(IntentError);
  });
});

describe("EVM order intent (EIP-712)", () => {
  it("has the engine's type hash and digest", () => {
    expect(ORDER_INTENT_TYPEHASH).toBe(GOLDEN.typehash);
    expect(evmIntentDigest(evmIntent())).toBe(GOLDEN.evmDigest);
  });

  it("puts chain id and NiaraSettlement in the domain", () => {
    const typed = evmIntentTypedData(evmIntent());
    expect(typed.domain).toEqual({
      name: "Niara Exchange",
      version: "1",
      chainId: 84532,
      verifyingContract: "0x00000000000000000000000000000000005e7701",
    });
    expect(typed.message.side).toBe(1);
  });

  it("signs (eth_signTypedData_v4) to the engine's golden signature", async () => {
    expect(EVM_ACCOUNT.address).toBe(GOLDEN.evmWallet);
    const sig = await EVM_ACCOUNT.signTypedData(evmIntentTypedData(evmIntent()));
    expect(sig).toBe(GOLDEN.evmSig);
    expect(normalizeEvmSignature(sig)).toBe(GOLDEN.evmSig);
    expect(await recoverTypedDataAddress({ ...evmIntentTypedData(evmIntent()), signature: sig })).toBe(GOLDEN.evmWallet);
  });

  it("does not depend on address case", () => {
    expect(evmIntentDigest(evmIntent({ wallet: GOLDEN.evmWallet.toLowerCase() }))).toBe(GOLDEN.evmDigest);
  });

  it("binds the chain id", () => {
    for (const chain of ["robinhood-testnet", "hyperevm-testnet", "tempo-testnet"] as const) {
      expect(evmIntentDigest(evmIntent({ chain }))).not.toBe(GOLDEN.evmDigest);
    }
  });
});

describe("EVM signature normalization", () => {
  const N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
  const sig = GOLDEN.evmSig;

  it("maps v 0/1 to 27/28", () => {
    const v = Number.parseInt(sig.slice(130), 16);
    const raw = `${sig.slice(0, 130)}${(v - 27).toString(16).padStart(2, "0")}`;
    expect(normalizeEvmSignature(raw)).toBe(sig);
  });

  it("maps the high-s twin back to the canonical low-s signature (same signer)", async () => {
    const s = BigInt(`0x${sig.slice(66, 130)}`);
    const v = Number.parseInt(sig.slice(130), 16);
    const twin = `${sig.slice(0, 66)}${(N - s).toString(16).padStart(64, "0")}${(v === 27 ? 28 : 27).toString(16)}` as Hex;
    expect(normalizeEvmSignature(twin)).toBe(sig);
  });

  it("refuses malformed signatures", () => {
    expect(() => normalizeEvmSignature("0x1234")).toThrow(/65 bytes/);
    expect(() => normalizeEvmSignature(`0x${"11".repeat(64)}05`)).toThrow(/27 or 28/);
  });
});

describe("cancellation", () => {
  it("Solana: engine's exact bytes and golden signature", async () => {
    const msg = solanaCancelMessage(cancelOf(solIntent()));
    expect(hex(msg)).toBe(GOLDEN.solCancelHex);
    expect(encodeSolanaSignature(await signAsync(msg, SOL_SECRET))).toBe(GOLDEN.solCancelSig);
  });

  it("EVM: engine's digest and golden signature", async () => {
    const c = cancelOf(evmIntent());
    expect(evmCancelDigest(c)).toBe(GOLDEN.evmCancelDigest);
    expect(await EVM_ACCOUNT.signTypedData(evmCancelTypedData(c))).toBe(GOLDEN.evmCancelSig);
    expect(Object.keys(CANCEL_ORDER_TYPES)).toEqual(["CancelOrder"]);
  });

  it("serializes only the five fields the engine accepts", () => {
    expect(Object.keys(cancelToJson(cancelOf(evmIntent()))).sort()).toEqual(
      ["chain", "nonce", "settlement", "version", "wallet"],
    );
  });
});

describe("JSON body and validation", () => {
  it("sends amounts as decimal strings and expiresAt as an integer", () => {
    const body = intentToJson(evmIntent());
    expect(body.quantity).toBe("5000000000000000000");
    expect(body.limitPrice).toBe("25000000");
    expect(body.expiresAt).toBe(1800086400);
    expect(body.wallet).toBe(GOLDEN.evmWallet);
    expect(Object.keys(body)).toHaveLength(12);
  });

  it("refuses what the engine refuses", () => {
    const bad: [Partial<OrderIntent>, string][] = [
      [{ quantity: big(5500000) }, "not_whole_lots"],
      [{ nonce: "0".repeat(32) }, "invalid_nonce"],
      [{ nonce: "ABCDEF0123456789ABCDEF0123456789" }, "invalid_nonce"],
      [{ expiresAt: 0 }, "invalid_expiry"],
      [{ asset: pat(3) }, "invalid_address"],
      [{ limitPrice: big(2) ** big(64) }, "amount_overflow"],
    ];
    for (const [o, code] of bad) {
      expect(() => validateIntent(solIntent(o)), code).toThrow(expect.objectContaining({ code }));
    }
  });

  it("random nonces are 32 lowercase hex chars", () => {
    for (let i = 0; i < 50; i++) expect(randomNonce()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("CAIP-2 ids match the spec", () => {
    expect(CHAINS["solana-devnet"].caip2).toBe("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1");
    expect(CHAINS["base-sepolia"].caip2).toBe("eip155:84532");
  });
});

// ---------------------------------------------------------------------------
// Diferencial contra o verificador real do engine (NIARA_ENGINE_DIR), rodado
// num processo node à parte (engine-verify.mjs).
// ---------------------------------------------------------------------------

const ENGINE_DIR = process.env.NIARA_ENGINE_DIR;

describe.skipIf(!ENGINE_DIR)("differential: the engine's own verifier accepts the site's payloads", () => {
  const rand = (max: number) => Math.floor(Math.random() * max);

  it("Solana and every EVM chain: same bytes/digest, JSON round trip, signature accepted", async () => {
    const orders: { intent: unknown; signature: string; expected: string }[] = [];
    const cancels: { cancel: unknown; signature: string; expected: string }[] = [];

    for (let n = 0; n < 100; n++) {
      const lot = big(1 + rand(1000));
      const intent = solIntent({
        side: rand(2) ? "buy" : "sell",
        lotSize: lot,
        quantity: lot * big(1 + rand(1000)),
        limitPrice: big(1 + rand(1e9)),
        nonce: randomNonce(),
        expiresAt: 1800000000 + rand(1e6),
      });
      const msg = solanaIntentMessage(intent);
      orders.push({ intent: intentToJson(intent), signature: encodeSolanaSignature(await signAsync(msg, SOL_SECRET)), expected: hex(msg) });
      const c = cancelOf(intent);
      const cmsg = solanaCancelMessage(c);
      cancels.push({ cancel: cancelToJson(c), signature: encodeSolanaSignature(await signAsync(cmsg, SOL_SECRET)), expected: hex(cmsg) });
    }
    for (const chain of ["base-sepolia", "robinhood-testnet", "tempo-testnet", "hyperevm-testnet"] as const) {
      for (let n = 0; n < 25; n++) {
        const lot = big(10) ** big(rand(19));
        const intent = evmIntent({
          chain,
          side: rand(2) ? "buy" : "sell",
          lotSize: lot,
          quantity: lot * big(1 + rand(1e6)),
          limitPrice: big(1 + rand(1e12)),
          nonce: randomNonce(),
          expiresAt: 1800000000 + rand(1e6),
        });
        const sig = normalizeEvmSignature(await EVM_ACCOUNT.signTypedData(evmIntentTypedData(intent)));
        orders.push({ intent: intentToJson(intent), signature: sig, expected: evmIntentDigest(intent) });
        const c = cancelOf(intent);
        const csig = normalizeEvmSignature(await EVM_ACCOUNT.signTypedData(evmCancelTypedData(c)));
        cancels.push({ cancel: cancelToJson(c), signature: csig, expected: evmCancelDigest(c) });
      }
    }

    const stdout = execFileSync(process.execPath, [fileURLToPath(new URL("./engine-verify.mjs", import.meta.url))], {
      input: JSON.stringify({
        orders: orders.map(({ intent, signature }) => ({ intent, signature })),
        cancels: cancels.map(({ cancel, signature }) => ({ cancel, signature })),
      }),
      env: { ...process.env, NIARA_ENGINE_DIR: ENGINE_DIR },
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const result = JSON.parse(stdout) as {
      orders: { payload: string; valid: boolean }[];
      cancels: { payload: string; valid: boolean }[];
    };
    expect(result.orders).toHaveLength(orders.length);
    result.orders.forEach((r, i) => {
      expect(r.payload, `order ${i}`).toBe(orders[i].expected);
      expect(r.valid, `order ${i}`).toBe(true);
    });
    result.cancels.forEach((r, i) => {
      expect(r.payload, `cancel ${i}`).toBe(cancels[i].expected);
      expect(r.valid, `cancel ${i}`).toBe(true);
    });
  }, 120_000);
});
