import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/kvphil",

  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "https://dh-choi.com"],
    },
  },
  serverRuntimeConfig: {
    internalUrl: process.env.NEXT_INTERNAL_URL || "http://localhost:3000",
  },
  images: {
    domains: ["dh-choi.com"],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
