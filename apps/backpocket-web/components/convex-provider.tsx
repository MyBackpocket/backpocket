"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient, ConvexProvider } from "convex/react";
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

interface ConvexClientProviderProps {
  children: ReactNode;
  /**
   * If true, use Convex without Clerk auth.
   * Used for custom domain requests where Clerk is not available.
   */
  skipClerk?: boolean;
}

export function ConvexClientProvider({ children, skipClerk = false }: ConvexClientProviderProps) {
  // useMemo ensures we get the same client instance across re-renders
  const client = useMemo(() => getConvexClient(), []);

  // For custom domains or when Clerk key is missing, use plain ConvexProvider
  // This allows public queries to work without authentication
  const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (skipClerk || !hasClerkKey) {
    return (
      <ConvexProvider client={client}>
        {children}
      </ConvexProvider>
    );
  }

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
