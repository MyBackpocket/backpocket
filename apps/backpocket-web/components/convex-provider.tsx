"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { type ReactNode, useMemo } from "react";

// Lazily create the client to avoid instantiation during SSR/build
// The client is created once per app lifecycle and reused
let convexClient: ConvexReactClient | null = null;

function getConvexClient(): ConvexReactClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. " +
          "Make sure to add it to your Vercel environment variables."
      );
    }
    convexClient = new ConvexReactClient(url);
  }
  return convexClient;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // useMemo ensures we get the same client instance across re-renders
  const client = useMemo(() => getConvexClient(), []);

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
