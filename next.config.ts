import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  typescript: {
    // The production VPS has 1GB RAM. Local/CI builds still type-check by
    // default; deploy can set this flag after local verification has passed.
    ignoreBuildErrors: process.env.NEXORAPRO_SKIP_BUILD_TYPECHECK === "1",
  },
  images: {
    // Eskiz VPS exposes an older x86-64 CPU without SSE4.2/Wasm SIMD. Public
    // assets are already pre-optimized, so serve them directly and keep the
    // incompatible Sharp runtime out of the production release.
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingExcludes: {
    "/*": ["./data/**/*"],
  },
  experimental: {
    // A fresh CI build initializes and seeds one SQLite file. Keeping page-data
    // collection single-worker prevents concurrent first-run schema writes.
    cpus: 1,
  },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/products/:path*",
        headers: [
          ...securityHeaders,
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      { source: "/api/auth/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default nextConfig;
