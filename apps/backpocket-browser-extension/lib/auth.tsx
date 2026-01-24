import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useClerk,
  useAuth as useClerkAuth,
} from "@clerk/chrome-extension";
import { type ReactNode, useCallback, useMemo, useState } from "react";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_SYNC_HOST = import.meta.env.VITE_CLERK_SYNC_HOST;

/**
 * Auth hook that returns getToken for Convex-compatible JWT
 */
export function useAuth() {
  const clerkAuth = useClerkAuth();

  // Wrap getToken with useCallback to maintain stable reference
  // This prevents infinite loops in consumers that depend on getToken
  const getToken = useCallback(async () => {
    return clerkAuth.getToken({ template: "convex" });
  }, [clerkAuth.getToken]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      ...clerkAuth,
      getToken,
    }),
    [clerkAuth, getToken]
  );
}

/**
 * Hook to manually refresh the session (useful when sync fails)
 */
export function useSessionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clerk = useClerk();

  const refreshSession = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      // Attempt to reload the client which re-syncs with the session
      await clerk.client?.destroy();
      // Small delay for the client to reinitialize
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.reload();
    } catch (err) {
      console.error("[Backpocket] Session refresh failed:", err);
      setError("Failed to refresh session. Try signing in again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [clerk]);

  return { refreshSession, isRefreshing, error };
}

/**
 * Auth provider using Clerk
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--error-bg)] text-[var(--error)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-[var(--text-primary)]">Configuration Error</p>
        <p className="text-sm text-[var(--text-secondary)]">Missing Clerk publishable key.</p>
        <p className="text-xs text-[var(--text-muted)]">
          Add VITE_CLERK_PUBLISHABLE_KEY to your .env file
        </p>
      </div>
    );
  }

  // syncHost enables session sync with web app (requires Clerk allowed_origins config)
  // Development: VITE_CLERK_SYNC_HOST=http://localhost:3000
  // Production: VITE_CLERK_SYNC_HOST=https://YOUR_CLERK_FRONTEND_API.clerk.accounts.dev
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      syncHost={CLERK_SYNC_HOST}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

/**
 * Show children only when signed in
 */
export function AuthenticatedView({ children }: { children: ReactNode }) {
  return <SignedIn>{children}</SignedIn>;
}

/**
 * Show children only when signed out
 */
export function UnauthenticatedView({ children }: { children: ReactNode }) {
  return <SignedOut>{children}</SignedOut>;
}

/**
 * Show children while auth is loading
 */
export function AuthLoadingView({ children }: { children: ReactNode }) {
  const { isLoaded } = useClerkAuth();

  if (isLoaded) {
    return null;
  }

  return <>{children}</>;
}

// =============================================================================
// TOKEN SYNC FOR BACKGROUND SCRIPT
// =============================================================================

/**
 * Sync auth token to session storage for background script access.
 * Uses session storage (cleared on browser close) for better security.
 * Also notifies background script to re-check icon state.
 */
export async function syncTokenToStorage(token: string | null): Promise<void> {
  try {
    if (token) {
      await browser.storage.session.set({ auth_token: token });
      // Notify background script that token is available
      browser.runtime.sendMessage({ type: "TOKEN_SYNCED" }).catch(() => {});
    } else {
      await browser.storage.session.remove("auth_token");
    }
  } catch (error) {
    console.error("[Backpocket] Failed to sync token to storage:", error);
  }
}

/**
 * Re-export Clerk components
 */
export { SignInButton, UserButton };
