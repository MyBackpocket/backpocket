/**
 * Offline SQLite Database
 * Handles all local database operations for offline caching
 */

import * as SQLite from "expo-sqlite";
import type { OfflineSave, OfflineSnapshot } from "./types";

const DATABASE_NAME = "backpocket_offline.db";

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await initializeSchema(db);
  }
  return db;
}

/**
 * Initialize the database schema
 */
async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Offline saves cache
    CREATE TABLE IF NOT EXISTS offline_saves (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      description TEXT,
      note TEXT,
      site_name TEXT,
      image_url TEXT,
      local_image_path TEXT,
      visibility TEXT NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      saved_at INTEGER NOT NULL,
      tags_json TEXT,
      collections_json TEXT,
      synced_at INTEGER NOT NULL
    );

    -- Offline snapshots
    CREATE TABLE IF NOT EXISTS offline_snapshots (
      save_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      title TEXT,
      byline TEXT,
      excerpt TEXT,
      word_count INTEGER,
      content_html TEXT,
      content_text TEXT,
      synced_at INTEGER NOT NULL,
      FOREIGN KEY (save_id) REFERENCES offline_saves(id) ON DELETE CASCADE
    );

    -- Sync metadata
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_saves_favorite ON offline_saves(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_saves_saved_at ON offline_saves(saved_at DESC);
    CREATE INDEX IF NOT EXISTS idx_saves_visibility ON offline_saves(visibility);
    CREATE INDEX IF NOT EXISTS idx_saves_archived ON offline_saves(is_archived);
  `);

  console.log("[offline-db] Schema initialized");
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

// ============================================================================
// SAVES OPERATIONS
// ============================================================================

/**
 * Insert or update a save in the offline cache
 */
export async function upsertSave(save: OfflineSave): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO offline_saves (
      id, space_id, url, title, description, note, site_name, image_url,
      local_image_path, visibility, is_archived, is_favorite, saved_at,
      tags_json, collections_json, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      save.id,
      save.spaceId,
      save.url,
      save.title,
      save.description,
      save.note,
      save.siteName,
      save.imageUrl,
      save.localImagePath,
      save.visibility,
      save.isArchived ? 1 : 0,
      save.isFavorite ? 1 : 0,
      save.savedAt,
      save.tagsJson,
      save.collectionsJson,
      save.syncedAt,
    ]
  );
}

/**
 * Insert or update multiple saves in a batch
 */
export async function upsertSaves(saves: OfflineSave[]): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const save of saves) {
      await database.runAsync(
        `INSERT OR REPLACE INTO offline_saves (
          id, space_id, url, title, description, note, site_name, image_url,
          local_image_path, visibility, is_archived, is_favorite, saved_at,
          tags_json, collections_json, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          save.id,
          save.spaceId,
          save.url,
          save.title,
          save.description,
          save.note,
          save.siteName,
          save.imageUrl,
          save.localImagePath,
          save.visibility,
          save.isArchived ? 1 : 0,
          save.isFavorite ? 1 : 0,
          save.savedAt,
          save.tagsJson,
          save.collectionsJson,
          save.syncedAt,
        ]
      );
    }
  });
}

/**
 * Get a single save by ID
 */
export async function getSave(saveId: string): Promise<OfflineSave | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{
    id: string;
    space_id: string;
    url: string;
    title: string | null;
    description: string | null;
    note: string | null;
    site_name: string | null;
    image_url: string | null;
    local_image_path: string | null;
    visibility: string;
    is_archived: number;
    is_favorite: number;
    saved_at: number;
    tags_json: string | null;
    collections_json: string | null;
    synced_at: number;
  }>(`SELECT * FROM offline_saves WHERE id = ?`, [saveId]);

  if (!result) return null;

  return rowToOfflineSave(result);
}

/**
 * Get all cached saves with optional filtering
 */
export async function listSaves(options?: {
  isFavorite?: boolean;
  isArchived?: boolean;
  visibility?: "public" | "private";
  limit?: number;
  offset?: number;
}): Promise<OfflineSave[]> {
  const database = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.isFavorite !== undefined) {
    conditions.push("is_favorite = ?");
    params.push(options.isFavorite ? 1 : 0);
  }

  if (options?.isArchived !== undefined) {
    conditions.push("is_archived = ?");
    params.push(options.isArchived ? 1 : 0);
  }

  if (options?.visibility) {
    conditions.push("visibility = ?");
    params.push(options.visibility);
  }

  let query = "SELECT * FROM offline_saves";
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY saved_at DESC";

  if (options?.limit) {
    query += " LIMIT ?";
    params.push(options.limit);
  }

  if (options?.offset) {
    query += " OFFSET ?";
    params.push(options.offset);
  }

  const results = await database.getAllAsync<{
    id: string;
    space_id: string;
    url: string;
    title: string | null;
    description: string | null;
    note: string | null;
    site_name: string | null;
    image_url: string | null;
    local_image_path: string | null;
    visibility: string;
    is_archived: number;
    is_favorite: number;
    saved_at: number;
    tags_json: string | null;
    collections_json: string | null;
    synced_at: number;
  }>(query, params);

  return results.map(rowToOfflineSave);
}

/**
 * Delete a save from the offline cache
 */
export async function deleteSave(saveId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM offline_saves WHERE id = ?", [saveId]);
}

/**
 * Delete all saves from the offline cache
 */
export async function deleteAllSaves(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM offline_saves");
}

/**
 * Get count of cached saves
 */
export async function getSavesCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_saves"
  );
  return result?.count ?? 0;
}

/**
 * Get all save IDs that have been cached
 */
export async function getCachedSaveIds(): Promise<string[]> {
  const database = await getDatabase();
  const results = await database.getAllAsync<{ id: string }>("SELECT id FROM offline_saves");
  return results.map((r) => r.id);
}

// ============================================================================
// SNAPSHOTS OPERATIONS
// ============================================================================

/**
 * Insert or update a snapshot in the offline cache
 */
export async function upsertSnapshot(snapshot: OfflineSnapshot): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO offline_snapshots (
      save_id, status, title, byline, excerpt, word_count,
      content_html, content_text, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      snapshot.saveId,
      snapshot.status,
      snapshot.title,
      snapshot.byline,
      snapshot.excerpt,
      snapshot.wordCount,
      snapshot.contentHtml,
      snapshot.contentText,
      snapshot.syncedAt,
    ]
  );
}

/**
 * Get a snapshot by save ID
 */
export async function getSnapshot(saveId: string): Promise<OfflineSnapshot | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{
    save_id: string;
    status: string;
    title: string | null;
    byline: string | null;
    excerpt: string | null;
    word_count: number | null;
    content_html: string | null;
    content_text: string | null;
    synced_at: number;
  }>(`SELECT * FROM offline_snapshots WHERE save_id = ?`, [saveId]);

  if (!result) return null;

  return {
    saveId: result.save_id,
    status: result.status,
    title: result.title,
    byline: result.byline,
    excerpt: result.excerpt,
    wordCount: result.word_count,
    contentHtml: result.content_html,
    contentText: result.content_text,
    syncedAt: result.synced_at,
  };
}

/**
 * Delete a snapshot from the offline cache
 */
export async function deleteSnapshot(saveId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM offline_snapshots WHERE save_id = ?", [saveId]);
}

/**
 * Delete all snapshots from the offline cache
 */
export async function deleteAllSnapshots(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM offline_snapshots");
}

/**
 * Get count of cached snapshots
 */
export async function getSnapshotsCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_snapshots"
  );
  return result?.count ?? 0;
}

// ============================================================================
// SYNC METADATA OPERATIONS
// ============================================================================

/**
 * Set a metadata value
 */
export async function setMetadata(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES (?, ?)",
    [key, value]
  );
}

/**
 * Get a metadata value
 */
export async function getMetadata(key: string): Promise<string | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = ?",
    [key]
  );
  return result?.value ?? null;
}

/**
 * Delete a metadata value
 */
export async function deleteMetadata(key: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM sync_metadata WHERE key = ?", [key]);
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncedAt(): Promise<number | null> {
  const value = await getMetadata("lastSyncedAt");
  return value ? parseInt(value, 10) : null;
}

/**
 * Set the last sync timestamp
 */
export async function setLastSyncedAt(timestamp: number): Promise<void> {
  await setMetadata("lastSyncedAt", timestamp.toString());
}

// ============================================================================
// DATABASE STATS
// ============================================================================

/**
 * Get database size estimate (in bytes)
 */
export async function getDatabaseSize(): Promise<number> {
  const database = await getDatabase();
  // Get page count and page size to estimate database size
  const pageCount = await database.getFirstAsync<{ page_count: number }>(
    "PRAGMA page_count"
  );
  const pageSize = await database.getFirstAsync<{ page_size: number }>(
    "PRAGMA page_size"
  );
  
  const count = pageCount?.page_count ?? 0;
  const size = pageSize?.page_size ?? 4096;
  
  return count * size;
}

/**
 * Clear all cached data
 */
export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await database.runAsync("DELETE FROM offline_snapshots");
    await database.runAsync("DELETE FROM offline_saves");
    await database.runAsync("DELETE FROM sync_metadata");
  });
  console.log("[offline-db] All data cleared");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function rowToOfflineSave(row: {
  id: string;
  space_id: string;
  url: string;
  title: string | null;
  description: string | null;
  note: string | null;
  site_name: string | null;
  image_url: string | null;
  local_image_path: string | null;
  visibility: string;
  is_archived: number;
  is_favorite: number;
  saved_at: number;
  tags_json: string | null;
  collections_json: string | null;
  synced_at: number;
}): OfflineSave {
  return {
    id: row.id,
    spaceId: row.space_id,
    url: row.url,
    title: row.title,
    description: row.description,
    note: row.note,
    siteName: row.site_name,
    imageUrl: row.image_url,
    localImagePath: row.local_image_path,
    visibility: row.visibility as "private" | "public",
    isArchived: row.is_archived === 1,
    isFavorite: row.is_favorite === 1,
    savedAt: row.saved_at,
    tagsJson: row.tags_json,
    collectionsJson: row.collections_json,
    syncedAt: row.synced_at,
  };
}
