"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";

interface ClerkProviderProps {
  children: React.ReactNode;
  /**
   * If true, skip loading Clerk entirely.
   * Used for custom domain requests where auth is not needed
   * and Clerk would fail due to domain validation.
   */
  skipClerk?: boolean;
}

// Conditionally wrap with Clerk based on environment and request context
export function ClerkProvider({ children, skipClerk = false }: ClerkProviderProps) {
  // If no Clerk key is configured, just render children
  // This allows the app to build and run in development without Clerk
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkKey || skipClerk) {
    return <>{children}</>;
  }

  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}
