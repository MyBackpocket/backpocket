/**
 * Safe Auth Hooks
 * 
 * These hooks provide auth state that works in both online and offline modes.
 * When offline (no ClerkProvider), they return cached user data from the offline context.
 * 
 * IMPORTANT: These hooks should be used instead of direct Clerk imports in components
 * that need to work in offline mode.
 */

import { createContext, useContext, type ReactNode } from "react";
import { useOfflineContext } from "@/lib/offline/context";

// ============================================================================
// CLERK AVAILABILITY CONTEXT
// ============================================================================

/**
 * Context to track whether Clerk hooks are safe to use
 * This is set by the providers based on whether ClerkProvider is in the tree
 */
const ClerkAvailableContext = createContext<boolean>(false);

export function ClerkAvailableProvider({ 
  children, 
  available 
}: { 
  children: ReactNode; 
  available: boolean;
}) {
  return (
    <ClerkAvailableContext.Provider value={available}>
      {children}
    </ClerkAvailableContext.Provider>
  );
}

export function useIsClerkAvailable(): boolean {
  return useContext(ClerkAvailableContext);
}

// ============================================================================
// SAFE AUTH HOOKS
// ============================================================================

interface SafeAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  sessionId: string | null;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

/**
 * Safe version of useAuth that works in both online and offline modes
 * 
 * NOTE: This does NOT call Clerk's useAuth directly. Instead, use the 
 * ClerkAuthBridge component to pipe Clerk auth state into the offline context,
 * and this hook reads from there.
 */
export function useSafeAuth(): SafeAuthState {
  const { cachedUser, isOffline } = useOfflineContext();
  const isClerkAvailable = useIsClerkAvailable();
  
  // When Clerk is available and online, the real auth comes through ClerkAuthBridge
  // When offline, we use cached data
  
  return {
    isLoaded: true,
    isSignedIn: !!cachedUser,
    userId: cachedUser?.id ?? null,
    sessionId: null, // Not available offline
    signOut: async () => {
      if (isOffline || !isClerkAvailable) {
        console.warn("[safe-hooks] signOut called while offline - no effect");
        return;
      }
      // Real sign out handled by components that have direct Clerk access
    },
    getToken: async () => {
      if (isOffline || !isClerkAvailable) {
        return null;
      }
      return null; // Token retrieval handled by components with Clerk access
    },
  };
}

interface SafeUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  username: string | null;
  imageUrl: string;
  primaryEmailAddress: { emailAddress: string } | null;
  emailAddresses: { emailAddress: string }[];
}

interface SafeUserState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: SafeUser | null;
}

/**
 * Safe version of useUser that works in both online and offline modes
 * Returns cached user data when offline
 */
export function useSafeUser(): SafeUserState {
  const { cachedUser } = useOfflineContext();
  
  if (!cachedUser) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
    };
  }
  
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: cachedUser.id,
      firstName: cachedUser.firstName,
      lastName: cachedUser.lastName,
      fullName: cachedUser.fullName,
      username: null,
      imageUrl: cachedUser.imageUrl ?? "",
      primaryEmailAddress: cachedUser.email ? {
        emailAddress: cachedUser.email,
      } : null,
      emailAddresses: cachedUser.email ? [{
        emailAddress: cachedUser.email,
      }] : [],
    },
  };
}
