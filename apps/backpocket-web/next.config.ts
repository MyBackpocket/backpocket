import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  // Turbopack config for resolving the convex directory
  turbopack: {
    resolveAlias: {
      "@convex": "../../convex",
    },
  },
  experimental: {
    devCacheControlNoCache: true,
  },
};

export default nextConfig;
