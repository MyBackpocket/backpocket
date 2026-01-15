/**
 * Convex Provider for React Native with Clerk auth
 */

import { useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient, ConvexProvider as BaseConvexProvider } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { createContext, useContext, type ReactNode } from "react";
import { CONVEX_URL } from "@/lib/constants";

const convex = new ConvexReactClient(CONVEX_URL);

// Context to provide auth state that works both online and offline
interface ConvexAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthAvailable: boolean;
}

const ConvexAuthStateContext = createContext<ConvexAuthState>({
  isAuthenticated: false,
  isLoading: false,
  isAuthAvailable: false,
});

/**
 * Hook to get auth state that works in both online and offline modes
 * Use this instead of useConvexAuth() directly
 */
export function useConvexAuthState(): ConvexAuthState {
  return useContext(ConvexAuthStateContext);
}

export function useIsConvexAuthAvailable(): boolean {
  return useContext(ConvexAuthStateContext).isAuthAvailable;
}

/**
 * Full Convex provider with Clerk authentication
 * Use this when the app is online and Clerk is available
 */
export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <ConvexAuthBridge>{children}</ConvexAuthBridge>
    </ConvexProviderWithClerk>
  );
}

/**
 * Bridge component that reads from useConvexAuth and provides to our context
 */
import { useConvexAuth } from "convex/react";

function ConvexAuthBridge({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  
  return (
    <ConvexAuthStateContext.Provider 
      value={{ isAuthenticated, isLoading, isAuthAvailable: true }}
    >
      {children}
    </ConvexAuthStateContext.Provider>
  );
}

/**
 * Offline-only Convex provider without authentication
 * Use this when the app is in offline-only mode (no Clerk)
 * This provides the context so hooks don't crash, but all queries will skip
 */
export function OfflineConvexProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthStateContext.Provider 
      value={{ isAuthenticated: false, isLoading: false, isAuthAvailable: false }}
    >
      <BaseConvexProvider client={convex}>
        {children}
      </BaseConvexProvider>
    </ConvexAuthStateContext.Provider>
  );
}
