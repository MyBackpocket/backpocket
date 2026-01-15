/**
 * Offline Sync Manager
 * Orchestrates syncing data between Convex and local SQLite cache
 */

import * as Network from "expo-network";
import type { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";

import * as db from "./database";
import * as imageCache from "./image-cache";
import {
  type OfflineSettings,
  type SyncState,
  type SyncProgress,
  type StorageStats,
  saveToOfflineSave,
  snapshotToOfflineSnapshot,
} from "./types";

// ============================================================================
// SYNC STATE MANAGEMENT
// ============================================================================

type SyncListener = (state: SyncState) => void;

let currentSyncState: SyncState = {
  status: "idle",
  lastSyncedAt: null,
  itemsSynced: 0,
  totalItems: 0,
  error: null,
  isOnline: true,
};

const listeners = new Set<SyncListener>();

function updateSyncState(updates: Partial<SyncState>): void {
  currentSyncState = { ...currentSyncState, ...updates };
  for (const listener of listeners) {
    listener(currentSyncState);
  }
}

export function getSyncState(): SyncState {
  return currentSyncState;
}

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentSyncState);
  return () => listeners.delete(listener);
}

// ============================================================================
// NETWORK STATUS
// ============================================================================

let networkSubscription: (() => void) | null = null;

/**
 * Start listening for network status changes
 */
export function startNetworkListener(): void {
  if (networkSubscription) return; // Already listening
  
  // Initial check
  checkNetworkStatus();
  
  // Subscribe to network changes
  const subscription = Network.addNetworkStateListener((state) => {
    const isOnline = state.isConnected ?? false;
    const wasOnline = currentSyncState.isOnline;
    
    if (isOnline !== wasOnline) {
      console.log(`[sync-manager] Network changed: ${isOnline ? "online" : "offline"}`);
      updateSyncState({ 
        isOnline,
        status: isOnline ? "idle" : "offline",
      });
    }
  });
  
  networkSubscription = subscription.remove;
}

/**
 * Stop listening for network status changes
 */
export function stopNetworkListener(): void {
  if (networkSubscription) {
    networkSubscription();
    networkSubscription = null;
  }
}

/**
 * Check if the device is online
 */
export async function checkNetworkStatus(): Promise<{
  isOnline: boolean;
  isWifi: boolean;
}> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    const isOnline = networkState.isConnected ?? false;
    const isWifi = networkState.type === Network.NetworkStateType.WIFI;
    
    updateSyncState({ isOnline });
    
    return { isOnline, isWifi };
  } catch (error) {
    console.error("[sync-manager] Error checking network status:", error);
    return { isOnline: false, isWifi: false };
  }
}

/**
 * Check if sync should proceed based on network status and settings
 */
async function shouldSync(settings: OfflineSettings): Promise<boolean> {
  if (!settings.enabled) {
    console.log("[sync-manager] Offline mode is disabled");
    return false;
  }

  const { isOnline, isWifi } = await checkNetworkStatus();
  
  if (!isOnline) {
    console.log("[sync-manager] Device is offline, skipping sync");
    return false;
  }

  if (settings.wifiOnly && !isWifi) {
    console.log("[sync-manager] WiFi-only mode enabled, but not on WiFi");
    return false;
  }

  return true;
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Perform a full sync of saves based on settings
 */
export async function syncSaves(
  convex: ConvexReactClient,
  settings: OfflineSettings,
  onProgress?: (progress: SyncProgress) => void
): Promise<void> {
  if (!(await shouldSync(settings))) {
    return;
  }

  updateSyncState({
    status: "syncing",
    itemsSynced: 0,
    totalItems: 0,
    error: null,
  });

  try {
    // Build query params based on sync mode
    const queryParams: Record<string, any> = { limit: 500 };
    
    switch (settings.syncMode) {
      case "favorites":
        queryParams.isFavorite = true;
        break;
      case "recent":
        // Filter by saved_at date on the client side after fetching
        // Convex doesn't have a direct date filter
        break;
      case "collections":
        // We'll need to fetch each collection separately
        break;
      case "all":
        // No filters
        break;
    }

    // Fetch saves from Convex
    console.log("[sync-manager] Fetching saves from server...");
    let saves: any[] = [];

    if (settings.syncMode === "collections" && settings.collectionIds?.length) {
      // Fetch saves from each selected collection
      for (const collectionId of settings.collectionIds) {
        const collectionSaves = await convex.query(api.saves.list, {
          ...queryParams,
          collectionId,
        });
        if (collectionSaves?.items) {
          saves.push(...collectionSaves.items);
        }
      }
      // Remove duplicates
      const seen = new Set<string>();
      saves = saves.filter((save) => {
        if (seen.has(save._id)) return false;
        seen.add(save._id);
        return true;
      });
    } else {
      const result = await convex.query(api.saves.list, queryParams);
      saves = result?.items ?? [];
    }

    // Filter by recent days if needed
    if (settings.syncMode === "recent" && settings.recentDays) {
      const cutoffDate = Date.now() - settings.recentDays * 24 * 60 * 60 * 1000;
      saves = saves.filter((save) => {
        const savedAt = typeof save.savedAt === "number" ? save.savedAt : new Date(save.savedAt).getTime();
        return savedAt >= cutoffDate;
      });
    }

    const totalItems = saves.length;
    updateSyncState({ totalItems });
    console.log(`[sync-manager] Found ${totalItems} saves to sync`);

    // Convert and store saves
    onProgress?.({ current: 0, total: totalItems, phase: "saves" });
    
    const offlineSaves = saves.map((save) =>
      saveToOfflineSave({
        id: save._id,
        spaceId: save.spaceId,
        url: save.url,
        title: save.title,
        description: save.description,
        siteName: save.siteName,
        imageUrl: save.imageUrl,
        contentType: save.contentType,
        visibility: save.visibility,
        isArchived: save.isArchived,
        isFavorite: save.isFavorite,
        createdBy: save.createdBy,
        savedAt: save.savedAt,
        createdAt: save.createdAt ?? save.savedAt,
        updatedAt: save.updatedAt ?? save.savedAt,
        tags: save.tags,
        collections: save.collections,
      })
    );

    await db.upsertSaves(offlineSaves);
    console.log(`[sync-manager] Stored ${offlineSaves.length} saves`);

    // Sync snapshots for saves
    onProgress?.({ current: 0, total: totalItems, phase: "snapshots" });
    let snapshotsSynced = 0;
    
    for (const save of saves) {
      try {
        const snapshotResult = await convex.query(api.snapshots.getSaveSnapshot, {
          saveId: save._id,
          includeContent: true,
        });
        
        if (snapshotResult?.snapshot) {
          const offlineSnapshot = snapshotToOfflineSnapshot(
            save._id,
            snapshotResult.snapshot,
            snapshotResult.content ?? undefined
          );
          await db.upsertSnapshot(offlineSnapshot);
          snapshotsSynced++;
        }
      } catch (error) {
        console.warn(`[sync-manager] Failed to sync snapshot for ${save._id}:`, error);
      }
      
      onProgress?.({ current: snapshotsSynced, total: totalItems, phase: "snapshots" });
      updateSyncState({ itemsSynced: snapshotsSynced });
    }

    console.log(`[sync-manager] Stored ${snapshotsSynced} snapshots`);

    // Cache images
    const imagesToCache = saves
      .filter((save) => save.imageUrl)
      .map((save) => ({ saveId: save._id, imageUrl: save.imageUrl }));

    if (imagesToCache.length > 0) {
      onProgress?.({ current: 0, total: imagesToCache.length, phase: "images" });
      
      const imageResults = await imageCache.cacheImages(imagesToCache, (current, total) => {
        onProgress?.({ current, total, phase: "images" });
      });

      // Update saves with local image paths
      for (const [saveId, localPath] of imageResults) {
        if (localPath) {
          const save = await db.getSave(saveId);
          if (save) {
            save.localImagePath = localPath;
            await db.upsertSave(save);
          }
        }
      }

      console.log(`[sync-manager] Cached ${imagesToCache.length} images`);
    }

    // Prune orphaned data
    const activeSaveIds = new Set(saves.map((s) => s._id));
    await imageCache.pruneOrphanedImages(activeSaveIds);

    // Update sync metadata
    const now = Date.now();
    await db.setLastSyncedAt(now);

    updateSyncState({
      status: "idle",
      lastSyncedAt: now,
      itemsSynced: totalItems,
      error: null,
    });

    console.log("[sync-manager] Sync completed successfully");
  } catch (error) {
    console.error("[sync-manager] Sync failed:", error);
    updateSyncState({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Perform an incremental sync (only new/updated items since last sync)
 */
export async function incrementalSync(
  convex: ConvexReactClient,
  settings: OfflineSettings
): Promise<void> {
  // For now, just do a full sync
  // In the future, we could optimize by only fetching items updated since lastSyncedAt
  await syncSaves(convex, settings);
}

// ============================================================================
// STORAGE STATS
// ============================================================================

/**
 * Get current storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  const [databaseSize, imageCacheSize, savesCount, snapshotsCount, imagesCount] =
    await Promise.all([
      db.getDatabaseSize(),
      imageCache.getImageCacheSize(),
      db.getSavesCount(),
      db.getSnapshotsCount(),
      imageCache.getImageCacheCount(),
    ]);

  return {
    databaseSize,
    imageCacheSize,
    totalSize: databaseSize + imageCacheSize,
    savesCount,
    snapshotsCount,
    imagesCount,
  };
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  console.log("[sync-manager] Clearing all offline data...");
  
  await Promise.all([
    db.clearAllData(),
    imageCache.clearImageCache(),
  ]);

  updateSyncState({
    status: "idle",
    lastSyncedAt: null,
    itemsSynced: 0,
    totalItems: 0,
    error: null,
  });

  console.log("[sync-manager] All offline data cleared");
}

// ============================================================================
// OFFLINE DATA ACCESS
// ============================================================================

/**
 * Get saves from offline cache
 */
export async function getOfflineSaves(options?: {
  isFavorite?: boolean;
  isArchived?: boolean;
  visibility?: "public" | "private";
  limit?: number;
}): Promise<any[]> {
  const offlineSaves = await db.listSaves(options);
  return offlineSaves.map((offline) => ({
    _id: offline.id,
    spaceId: offline.spaceId,
    url: offline.url,
    title: offline.title,
    description: offline.description,
    siteName: offline.siteName,
    imageUrl: offline.localImagePath ?? offline.imageUrl,
    visibility: offline.visibility,
    isArchived: offline.isArchived,
    isFavorite: offline.isFavorite,
    savedAt: offline.savedAt,
    tags: offline.tagsJson ? JSON.parse(offline.tagsJson) : [],
    collections: offline.collectionsJson ? JSON.parse(offline.collectionsJson) : [],
  }));
}

/**
 * Get a single save from offline cache
 */
export async function getOfflineSave(saveId: string): Promise<any | null> {
  const offline = await db.getSave(saveId);
  if (!offline) return null;

  return {
    _id: offline.id,
    spaceId: offline.spaceId,
    url: offline.url,
    title: offline.title,
    description: offline.description,
    note: offline.note,
    siteName: offline.siteName,
    imageUrl: offline.localImagePath ?? offline.imageUrl,
    visibility: offline.visibility,
    isArchived: offline.isArchived,
    isFavorite: offline.isFavorite,
    savedAt: offline.savedAt,
    tags: offline.tagsJson ? JSON.parse(offline.tagsJson) : [],
    collections: offline.collectionsJson ? JSON.parse(offline.collectionsJson) : [],
  };
}

/**
 * Get a snapshot from offline cache
 */
export async function getOfflineSnapshot(
  saveId: string
): Promise<{ snapshot: any; content: any } | null> {
  const offline = await db.getSnapshot(saveId);
  if (!offline) return null;

  return {
    snapshot: {
      saveId: offline.saveId,
      status: offline.status,
      title: offline.title,
      byline: offline.byline,
      excerpt: offline.excerpt,
      wordCount: offline.wordCount,
    },
    content: offline.contentHtml
      ? {
          title: offline.title,
          byline: offline.byline,
          content: offline.contentHtml,
          textContent: offline.contentText,
          excerpt: offline.excerpt,
        }
      : null,
  };
}

/**
 * Check if a save is available offline
 */
export async function isSaveAvailableOffline(saveId: string): Promise<boolean> {
  const save = await db.getSave(saveId);
  return save !== null;
}

/**
 * Initialize the sync manager (load last sync state)
 */
export async function initialize(): Promise<void> {
  try {
    const lastSyncedAt = await db.getLastSyncedAt();
    const { isOnline } = await checkNetworkStatus();

    updateSyncState({
      lastSyncedAt,
      isOnline,
      status: isOnline ? "idle" : "offline",
    });

    // Start listening for network changes
    startNetworkListener();

    console.log("[sync-manager] Initialized with last sync:", lastSyncedAt);
  } catch (error) {
    console.error("[sync-manager] Error initializing:", error);
  }
}
