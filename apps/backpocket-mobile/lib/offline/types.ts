/**
 * Offline Storage Types
 * Type definitions for offline caching and sync functionality
 */

import type { Save, SaveSnapshot, Tag, Collection, SnapshotContent } from "@/lib/types";

// === Offline Settings ===

export type SyncMode = "all" | "favorites" | "recent" | "collections";

export interface OfflineSettings {
  /** Whether offline mode is enabled */
  enabled: boolean;
  /** What to sync: all saves, favorites only, recent N days, or specific collections */
  syncMode: SyncMode;
  /** Number of days for 'recent' sync mode */
  recentDays?: number;
  /** Collection IDs to sync when syncMode is 'collections' */
  collectionIds?: string[];
  /** Only sync when on WiFi */
  wifiOnly: boolean;
  /** Automatically sync in background */
  autoSync: boolean;
  /** Maximum storage in MB (default 500) */
  maxStorageMB: number;
}

export const DEFAULT_OFFLINE_SETTINGS: OfflineSettings = {
  enabled: false,
  syncMode: "favorites",
  recentDays: 30,
  collectionIds: [],
  wifiOnly: true,
  autoSync: true,
  maxStorageMB: 500,
};

// === Cached Data Types ===

export interface OfflineSave {
  id: string;
  spaceId: string;
  url: string;
  title: string | null;
  description: string | null;
  note: string | null;
  siteName: string | null;
  imageUrl: string | null;
  /** Local path to cached image */
  localImagePath: string | null;
  visibility: "private" | "public";
  isArchived: boolean;
  isFavorite: boolean;
  savedAt: number;
  /** JSON stringified tags array */
  tagsJson: string | null;
  /** JSON stringified collections array */
  collectionsJson: string | null;
  /** When this record was last synced */
  syncedAt: number;
}

export interface OfflineSnapshot {
  saveId: string;
  status: string;
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  wordCount: number | null;
  contentHtml: string | null;
  contentText: string | null;
  syncedAt: number;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

// === Sync Status Types ===

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  itemsSynced: number;
  totalItems: number;
  error: string | null;
  isOnline: boolean;
}

export interface SyncProgress {
  current: number;
  total: number;
  phase: "saves" | "snapshots" | "images";
}

// === Storage Stats ===

export interface StorageStats {
  /** Total bytes used by SQLite database */
  databaseSize: number;
  /** Total bytes used by cached images */
  imageCacheSize: number;
  /** Total storage used */
  totalSize: number;
  /** Number of saves cached */
  savesCount: number;
  /** Number of snapshots cached */
  snapshotsCount: number;
  /** Number of images cached */
  imagesCount: number;
}

// === Conversion Helpers ===

/**
 * Convert an API Save to an OfflineSave for storage
 */
export function saveToOfflineSave(save: Save, localImagePath?: string): OfflineSave {
  return {
    id: save.id,
    spaceId: save.spaceId,
    url: save.url,
    title: save.title,
    description: save.description,
    note: (save as any).note ?? null,
    siteName: save.siteName,
    imageUrl: save.imageUrl,
    localImagePath: localImagePath ?? null,
    visibility: save.visibility,
    isArchived: save.isArchived,
    isFavorite: save.isFavorite,
    savedAt: typeof save.savedAt === "number" ? save.savedAt : new Date(save.savedAt).getTime(),
    tagsJson: save.tags ? JSON.stringify(save.tags) : null,
    collectionsJson: save.collections ? JSON.stringify(save.collections) : null,
    syncedAt: Date.now(),
  };
}

/**
 * Convert an OfflineSave back to an API Save for display
 */
export function offlineSaveToSave(offline: OfflineSave): Save {
  return {
    id: offline.id,
    spaceId: offline.spaceId,
    url: offline.url,
    title: offline.title,
    description: offline.description,
    siteName: offline.siteName,
    imageUrl: offline.localImagePath ?? offline.imageUrl,
    contentType: null,
    visibility: offline.visibility,
    isArchived: offline.isArchived,
    isFavorite: offline.isFavorite,
    createdBy: "",
    savedAt: offline.savedAt,
    createdAt: offline.savedAt,
    updatedAt: offline.syncedAt,
    tags: offline.tagsJson ? JSON.parse(offline.tagsJson) : undefined,
    collections: offline.collectionsJson ? JSON.parse(offline.collectionsJson) : undefined,
  };
}

/**
 * Convert snapshot data to OfflineSnapshot for storage
 */
export function snapshotToOfflineSnapshot(
  saveId: string,
  snapshot: SaveSnapshot,
  content?: SnapshotContent
): OfflineSnapshot {
  return {
    saveId,
    status: snapshot.status,
    title: snapshot.title,
    byline: snapshot.byline,
    excerpt: snapshot.excerpt,
    wordCount: snapshot.wordCount,
    contentHtml: content?.content ?? null,
    contentText: content?.textContent ?? null,
    syncedAt: Date.now(),
  };
}

/**
 * Convert OfflineSnapshot back to snapshot data for display
 */
export function offlineSnapshotToSnapshot(offline: OfflineSnapshot): {
  snapshot: SaveSnapshot;
  content: SnapshotContent | null;
} {
  const snapshot: SaveSnapshot = {
    saveId: offline.saveId,
    status: offline.status as any,
    title: offline.title,
    byline: offline.byline,
    excerpt: offline.excerpt,
    wordCount: offline.wordCount,
    language: null,
  };

  const content: SnapshotContent | null = offline.contentHtml
    ? {
        title: offline.title ?? "",
        byline: offline.byline,
        content: offline.contentHtml,
        textContent: offline.contentText ?? "",
        excerpt: offline.excerpt ?? "",
        siteName: null,
        length: offline.wordCount ?? 0,
        language: null,
      }
    : null;

  return { snapshot, content };
}
