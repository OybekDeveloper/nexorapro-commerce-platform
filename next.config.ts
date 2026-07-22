import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingExcludes: {
    "/*": ["./data/**/*"],
  },
  experimental: {
    // A fresh CI build initializes and seeds one SQLite file. Keeping page-data
    // collection single-worker prevents concurrent first-run schema writes.
    cpus: 1,
  },
};

export default nextConfig;
