import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize barrel file imports for faster builds and reduced bundle size
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
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
};

export default nextConfig;
