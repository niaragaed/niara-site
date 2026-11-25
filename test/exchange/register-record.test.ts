import { describe, expect, it } from "vitest";
import { CHAIN_IDS } from "@/lib/exchange/chains";
import { REGISTER_NETWORK_SLUGS, buildRegisterRecordUrl } from "@/lib/site-links";

const EVM_TX = `0x${"ab".repeat(32)}`;
// A Solana signature is 64 bytes: 87–88 base58 characters.
const SOL_SIG = "4".repeat(44) + "Zz".repeat(22);

describe("Register record link", () => {
  it("uses the Register's network slug for every exchange chain", () => {
    expect(Object.keys(REGISTER_NETWORK_SLUGS).sort()).toEqual([...CHAIN_IDS].sort());
    expect(REGISTER_NETWORK_SLUGS).toEqual({
      "solana-devnet": "solana-devnet",
      "base-sepolia": "base-sepolia",
      "robinhood-testnet": "robinhood-testnet",
      "tempo-testnet": "tempo-testnet",
      "hyperevm-testnet": "hyperevm-testnet",
    });
  });

  it("builds {REGISTER_URL}/global-registry/{network}/{txHash}", () => {
    expect(buildRegisterRecordUrl("https://register.niaraglobal.com", "base-sepolia", EVM_TX)).toBe(
      `https://register.niaraglobal.com/global-registry/base-sepolia/${EVM_TX}`,
    );
    expect(buildRegisterRecordUrl("https://register.niaraglobal.com/", "solana-devnet", SOL_SIG)).toBe(
      `https://register.niaraglobal.com/global-registry/solana-devnet/${SOL_SIG}`,
    );
  });

  it("is hidden without an https Register URL", () => {
    expect(buildRegisterRecordUrl(undefined, "base-sepolia", EVM_TX)).toBeNull();
    expect(buildRegisterRecordUrl("", "base-sepolia", EVM_TX)).toBeNull();
    expect(buildRegisterRecordUrl("http://register.niaraglobal.com", "base-sepolia", EVM_TX)).toBeNull();
  });

  it("refuses anything that is not a transaction hash", () => {
    expect(buildRegisterRecordUrl("https://register.niaraglobal.com", "base-sepolia", "0x1234")).toBeNull();
    expect(buildRegisterRecordUrl("https://register.niaraglobal.com", "base-sepolia", `${EVM_TX}/../x`)).toBeNull();
    expect(buildRegisterRecordUrl("https://register.niaraglobal.com", "solana-devnet", "not a signature")).toBeNull();
  });
});
