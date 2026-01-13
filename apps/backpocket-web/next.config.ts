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
  // Only include canary-specific dev flags in development
  ...(process.env.NODE_ENV === "development" && {
    experimental: {
      devCacheControlNoCache: true,
    } as NextConfig["experimental"],
  }),
};

export default nextConfig;
