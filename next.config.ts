import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["qrcode"] },
};

export default nextConfig;
