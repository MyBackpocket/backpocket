"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

interface ClerkProviderProps {
  children: React.ReactNode;
  /**
   * If true, skip loading Clerk entirely.
   * Used for custom domain requests where auth is not needed
   * and Clerk would fail due to domain validation.
   */
  skipClerk?: boolean;
}

// Theme-aware Clerk provider that syncs with next-themes
function ClerkProviderInner({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  // Default to dark theme during SSR/hydration to avoid "flashbang" of light theme
  // resolvedTheme is undefined until hydration completes, so we explicitly default to dark
  const isDark = resolvedTheme === undefined || resolvedTheme === "dark";

  return (
    <BaseClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}

// Conditionally wrap with Clerk based on environment and request context
export function ClerkProvider({ children, skipClerk = false }: ClerkProviderProps) {
  // If no Clerk key is configured, just render children
  // This allows the app to build and run in development without Clerk
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!clerkKey || skipClerk) {
    return <>{children}</>;
  }

  return <ClerkProviderInner>{children}</ClerkProviderInner>;
}
