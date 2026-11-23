// Per-request Content-Security-Policy with a fresh nonce (see src/lib/security/csp.ts).
// Next.js reads the nonce from the request's CSP header and puts it on its own
// scripts; every page is already rendered per request (the root layout reads the
// cookie header for wagmi), which a nonce requires. The other security headers are
// static and live in next.config.ts.
import { NextResponse, type NextRequest } from "next/server";
import { WALLETCONNECT_ENABLED, buildCsp, connectOrigins } from "@/lib/security/csp";

const CONNECT = connectOrigins();

export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({ nonce, dev: process.env.NODE_ENV === "development", connect: CONNECT, walletConnect: WALLETCONNECT_ENABLED });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not static files, image optimization or prefetches.
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
