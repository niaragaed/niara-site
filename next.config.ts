import type { NextConfig } from "next";

// Static security headers for every response. The Content-Security-Policy needs a
// per-request nonce, so it is set in src/proxy.ts (frame-ancestors 'none' there,
// X-Frame-Options DENY here for older browsers).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  // Two years, subdomains included (api.niaraglobal.com is HTTPS too). No `preload`:
  // joining the preload list is a separate, hard-to-undo decision.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "serial=()",
      "hid=()",
      "bluetooth=()",
      "midi=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "browsing-topics=()",
    ].join(", "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
