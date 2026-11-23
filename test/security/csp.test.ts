import { describe, expect, it } from "vitest";
import { buildCsp, originOf, wsOriginOf } from "@/lib/security/csp";

const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((d) => d === name || d.startsWith(`${name} `))
    ?.split(" ")
    .slice(1);

describe("CSP", () => {
  const connect = ["https://api.niaraglobal.com", "https://abc.supabase.co", "https://api.devnet.solana.com", "wss://api.devnet.solana.com"];
  const prod = buildCsp({ nonce: "abc123", dev: false, connect });
  const dev = buildCsp({ nonce: "abc123", dev: true, connect });

  it("production scripts: nonce + strict-dynamic, no unsafe-eval or unsafe-inline", () => {
    expect(directive(prod, "script-src")).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(prod).not.toContain("unsafe-eval");
    expect(directive(prod, "script-src")).not.toContain("'unsafe-inline'");
  });

  it("development adds only unsafe-eval (React debugging) and no upgrade-insecure-requests", () => {
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(dev).not.toContain("upgrade-insecure-requests");
    expect(prod).toContain("upgrade-insecure-requests");
  });

  it("connect-src is exactly self plus the given origins", () => {
    expect(directive(prod, "connect-src")).toEqual(["'self'", ...connect]);
  });

  it("cannot be framed and cannot load plugins or frames", () => {
    expect(directive(prod, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(prod, "object-src")).toEqual(["'none'"]);
    expect(directive(prod, "frame-src")).toEqual(["'none'"]);
    expect(directive(prod, "base-uri")).toEqual(["'self'"]);
  });

  it("derives origins safely", () => {
    expect(originOf("https://api.niaraglobal.com/v1/markets")).toBe("https://api.niaraglobal.com");
    expect(originOf("")).toBeNull();
    expect(originOf(undefined)).toBeNull();
    expect(originOf("javascript:alert(1)")).toBeNull();
    expect(originOf("not a url")).toBeNull();
    expect(wsOriginOf("https://api.devnet.solana.com")).toBe("wss://api.devnet.solana.com");
    expect(wsOriginOf("http://127.0.0.1:8899")).toBe("ws://127.0.0.1:8900");
  });
});
