/**
 * Offline Context Provider
 * Provides offline mode state and cached user info throughout the app
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type CachedUser, getCachedUser } from "./auth-cache";
import { checkNetworkStatus, getSyncState, subscribeSyncState } from "./sync-manager";

export interface OfflineContextValue {
  /** Whether the device is currently offline */
  isOffline: boolean;
  /** Whether the app is running in offline mode (offline + has cached data) */
  isOfflineMode: boolean;
  /** Whether we're in offline-only mode (no Convex provider available) */
  isOfflineOnly: boolean;
  /** The cached user profile (available when in offline mode) */
  cachedUser: CachedUser | null;
  /** Whether we're still checking the initial offline state */
  isInitializing: boolean;
  /** Check and update network status */
  refreshNetworkStatus: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

interface OfflineProviderProps {
  children: ReactNode;
  /** Pre-loaded cached user (for faster startup) */
  initialCachedUser?: CachedUser | null;
  /** Whether we're in offline-only mode (no Convex provider) */
  isOfflineOnly?: boolean;
}

/**
 * Provider component for offline mode state
 */
export function OfflineProvider({ children, initialCachedUser, isOfflineOnly = false }: OfflineProviderProps) {
  const [isOffline, setIsOffline] = useState(isOfflineOnly || !getSyncState().isOnline);
  const [cachedUser, setCachedUser] = useState<CachedUser | null>(initialCachedUser ?? null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Subscribe to sync state changes for network status
  useEffect(() => {
    // Don't subscribe to network changes in offline-only mode
    if (isOfflineOnly) return;
    
    const unsubscribe = subscribeSyncState((state) => {
      setIsOffline(!state.isOnline);
    });
    return unsubscribe;
  }, [isOfflineOnly]);

  // Load cached user on mount
  useEffect(() => {
    async function loadCachedUser() {
      if (initialCachedUser !== undefined) {
        // Already have the user from props
        setIsInitializing(false);
        return;
      }

      try {
        const user = await getCachedUser();
        setCachedUser(user);
      } catch (error) {
        console.error("[OfflineProvider] Error loading cached user:", error);
      } finally {
        setIsInitializing(false);
      }
    }

    loadCachedUser();
  }, [initialCachedUser]);

  // Check network status on mount (only if not in offline-only mode)
  useEffect(() => {
    if (!isOfflineOnly) {
      checkNetworkStatus();
    }
  }, [isOfflineOnly]);

  const refreshNetworkStatus = async () => {
    const { isOnline } = await checkNetworkStatus();
    setIsOffline(!isOnline);
  };

  const value: OfflineContextValue = {
    isOffline,
    isOfflineMode: isOffline && cachedUser !== null,
    isOfflineOnly,
    cachedUser,
    isInitializing,
    refreshNetworkStatus,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

/**
 * Hook to access offline context
 */
export function useOfflineContext(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    // Return a default value when not wrapped in provider
    // This allows gradual adoption
    return {
      isOffline: false,
      isOfflineMode: false,
      isOfflineOnly: false,
      cachedUser: null,
      isInitializing: false,
      refreshNetworkStatus: async () => {},
    };
  }
  return context;
}

/**
 * Hook to check if the app is in offline mode
 */
export function useIsOfflineMode(): boolean {
  const { isOfflineMode } = useOfflineContext();
  return isOfflineMode;
}

/**
 * Hook to get the cached user (for offline mode)
 */
export function useCachedUser(): CachedUser | null {
  const { cachedUser } = useOfflineContext();
  return cachedUser;
}
