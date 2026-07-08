import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NETLIFY === "true" ? {} : { output: "standalone" as const }),
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["qrcode"] },
};

export default nextConfig;
