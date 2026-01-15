/**
 * Offline Storage Module
 * Public exports for offline caching functionality
 */

// Types
export {
  type OfflineSettings,
  type SyncMode,
  type SyncState,
  type SyncProgress,
  type StorageStats,
  type OfflineSave,
  type OfflineSnapshot,
  DEFAULT_OFFLINE_SETTINGS,
  saveToOfflineSave,
  offlineSaveToSave,
} from "./types";

// Database operations
export {
  getDatabase,
  closeDatabase,
  getSave,
  listSaves,
  getSavesCount,
  getSnapshot,
  getSnapshotsCount,
  getLastSyncedAt,
  getDatabaseSize,
  clearAllData,
} from "./database";

// Image cache
export {
  cacheImage,
  cacheImages,
  deleteCachedImage,
  clearImageCache,
  getImageCacheSize,
  getImageCacheCount,
  isImageCached,
  getImageUri,
  getLocalImagePath,
} from "./image-cache";

// Sync manager
export {
  getSyncState,
  subscribeSyncState,
  checkNetworkStatus,
  startNetworkListener,
  stopNetworkListener,
  syncSaves,
  incrementalSync,
  getStorageStats,
  clearAllOfflineData,
  getOfflineSaves,
  getOfflineSave,
  getOfflineSnapshot,
  isSaveAvailableOffline,
  initialize as initializeOffline,
} from "./sync-manager";

// React hooks
export {
  useSyncState,
  useIsOnline,
  useLastSyncedAt,
  useSync,
  useClearOfflineData,
  useStorageStats,
  useOfflineSaves,
  useOfflineSave,
  useOfflineSnapshot,
  useIsSaveAvailableOffline,
  useAutoSync,
  useOfflineInit,
} from "./hooks";

// Auth cache
export {
  type CachedUser,
  cacheUser,
  getCachedUser,
  clearCachedUser,
  hasCachedUser,
  isCachedUserValid,
} from "./auth-cache";

// Context
export {
  OfflineProvider,
  useOfflineContext,
  useIsOfflineMode,
  useCachedUser,
  type OfflineContextValue,
} from "./context";
