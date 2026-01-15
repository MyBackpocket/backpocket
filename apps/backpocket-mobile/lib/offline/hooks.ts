/**
 * Offline Storage Hooks
 * React hooks for offline data access and sync status
 */

import { useCallback, useEffect, useState } from "react";
import { useConvex, useConvexAuth } from "convex/react";

import * as syncManager from "./sync-manager";
import type { SyncState, StorageStats, SyncProgress, OfflineSettings } from "./types";
import { DEFAULT_OFFLINE_SETTINGS } from "./types";

// ============================================================================
// SYNC STATUS HOOKS
// ============================================================================

/**
 * Hook to access and subscribe to sync state
 */
export function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>(syncManager.getSyncState());

  useEffect(() => {
    return syncManager.subscribeSyncState(setState);
  }, []);

  return state;
}

/**
 * Hook to check if the device is online
 */
export function useIsOnline(): boolean {
  const syncState = useSyncState();
  return syncState.isOnline;
}

/**
 * Hook to get the last sync timestamp
 */
export function useLastSyncedAt(): number | null {
  const syncState = useSyncState();
  return syncState.lastSyncedAt;
}

// ============================================================================
// SYNC CONTROL HOOKS
// ============================================================================

/**
 * Hook to trigger a sync operation
 */
export function useSync(settings: OfflineSettings = DEFAULT_OFFLINE_SETTINGS) {
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const sync = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      await syncManager.syncSaves(convex, settings, (p) => {
        setProgress(p);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, [convex, isAuthenticated, settings]);

  return {
    sync,
    isLoading,
    error,
    progress,
  };
}

/**
 * Hook to clear all offline data
 */
export function useClearOfflineData() {
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearData = useCallback(async () => {
    setIsClearing(true);
    setError(null);

    try {
      await syncManager.clearAllOfflineData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setIsClearing(false);
    }
  }, []);

  return {
    clearData,
    isClearing,
    error,
  };
}

// ============================================================================
// STORAGE STATS HOOKS
// ============================================================================

/**
 * Hook to get storage statistics
 */
export function useStorageStats(): {
  stats: StorageStats | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const newStats = await syncManager.getStorageStats();
      setStats(newStats);
    } catch (error) {
      console.error("[useStorageStats] Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, isLoading, refresh };
}

// ============================================================================
// OFFLINE DATA HOOKS
// ============================================================================

/**
 * Hook to get saves from offline cache
 */
export function useOfflineSaves(options?: {
  isFavorite?: boolean;
  isArchived?: boolean;
  visibility?: "public" | "private";
  limit?: number;
}) {
  const [saves, setSaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract primitive values for stable dependency array
  const isFavorite = options?.isFavorite;
  const isArchived = options?.isArchived;
  const visibility = options?.visibility;
  const limit = options?.limit;
  const hasOptions = options !== undefined;

  const refresh = useCallback(async () => {
    if (!hasOptions) {
      setSaves([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await syncManager.getOfflineSaves({ isFavorite, isArchived, visibility, limit });
      setSaves(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offline saves");
    } finally {
      setIsLoading(false);
    }
  }, [hasOptions, isFavorite, isArchived, visibility, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { saves, isLoading, error, refresh };
}

/**
 * Hook to get a single save from offline cache
 */
export function useOfflineSave(saveId: string | undefined) {
  const [save, setSave] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!saveId) {
      setSave(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await syncManager.getOfflineSave(saveId);
      setSave(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offline save");
    } finally {
      setIsLoading(false);
    }
  }, [saveId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { save, isLoading, error, refresh };
}

/**
 * Hook to get a snapshot from offline cache
 */
export function useOfflineSnapshot(saveId: string | undefined) {
  const [snapshot, setSnapshot] = useState<{
    snapshot: any;
    content: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!saveId) {
      setSnapshot(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await syncManager.getOfflineSnapshot(saveId);
      setSnapshot(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load offline snapshot");
    } finally {
      setIsLoading(false);
    }
  }, [saveId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { snapshot, isLoading, error, refresh };
}

/**
 * Hook to check if a save is available offline
 */
export function useIsSaveAvailableOffline(saveId: string | undefined): {
  isAvailable: boolean;
  isLoading: boolean;
} {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!saveId) {
      setIsAvailable(false);
      setIsLoading(false);
      return;
    }

    syncManager.isSaveAvailableOffline(saveId).then((available) => {
      setIsAvailable(available);
      setIsLoading(false);
    });
  }, [saveId]);

  return { isAvailable, isLoading };
}

// ============================================================================
// NETWORK STATUS HOOKS
// ============================================================================

/**
 * Hook to monitor network status and trigger auto-sync
 */
export function useAutoSync(
  settings: OfflineSettings = DEFAULT_OFFLINE_SETTINGS,
  enabled = true
) {
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!enabled || !settings.autoSync || !isAuthenticated) return;

    // Initialize sync manager
    syncManager.initialize();

    // Check if we should sync
    const checkAndSync = async () => {
      const { isOnline, isWifi } = await syncManager.checkNetworkStatus();
      
      if (!isOnline) return;
      if (settings.wifiOnly && !isWifi) return;
      
      // Only auto-sync if we haven't synced in the last hour
      const currentSyncState = syncManager.getSyncState();
      const lastSynced = currentSyncState.lastSyncedAt;
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      
      if (!lastSynced || lastSynced < oneHourAgo) {
        console.log("[useAutoSync] Triggering auto-sync...");
        try {
          await syncManager.syncSaves(convex, settings);
        } catch (error) {
          console.error("[useAutoSync] Auto-sync failed:", error);
        }
      }
    };

    checkAndSync();
  }, [convex, isAuthenticated, enabled, settings]);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Hook to initialize offline storage on app start
 */
export function useOfflineInit(): boolean {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    syncManager.initialize().then(() => {
      setIsInitialized(true);
    });
  }, []);

  return isInitialized;
}
