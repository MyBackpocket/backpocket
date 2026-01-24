"use client";

import { useSyncExternalStore } from "react";

/**
 * Module-level cache that persists across component mounts/unmounts.
 * This enables stale-while-revalidate behavior for Convex queries.
 */
const queryCache = new Map<string, unknown>();

/**
 * Separate cache for paginated/accumulated items.
 * Stores { items: T[], cursor: number | undefined } for each key.
 */
const paginatedCache = new Map<string, { items: unknown[]; cursor: unknown }>();

const subscribers = new Set<() => void>();

function notifySubscribers() {
  for (const callback of subscribers) {
    callback();
  }
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot() {
  return queryCache;
}

/**
 * Hook that provides stale-while-revalidate behavior for Convex queries.
 *
 * When data is `undefined` (loading), it returns the last known cached value
 * for that query key. This eliminates flash-of-skeleton on navigation back
 * to previously visited pages.
 *
 * @param key - Unique cache key for this query (usually based on query name + args)
 * @param data - The current data from useQuery (undefined when loading)
 * @returns The data, or cached stale data while loading
 *
 * @example
 * ```tsx
 * const rawData = useListSaves({ limit: 5 });
 * const data = useCachedQuery("saves-list-5", rawData);
 * // `data` returns cached value instantly on remount, no skeleton!
 * ```
 */
export function useCachedQuery<T>(key: string, data: T | undefined): T | undefined {
  // Subscribe to cache changes (needed for React 18 concurrent features)
  const cache = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Update cache when we get fresh data
  if (data !== undefined) {
    const cached = cache.get(key);
    // Only update if data actually changed (avoid infinite loops)
    if (cached !== data) {
      queryCache.set(key, data);
      // Don't notify here - the component already has the data
    }
  }

  // Return fresh data if available, otherwise return cached stale data
  return data ?? (cache.get(key) as T | undefined);
}

/**
 * Generate a stable cache key from query arguments.
 */
export function cacheKey(prefix: string, args?: Record<string, unknown>): string {
  if (!args || Object.keys(args).length === 0) {
    return prefix;
  }
  // Sort keys for consistent ordering
  const sortedArgs = Object.keys(args)
    .sort()
    .reduce(
      (acc, key) => {
        const value = args[key];
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );
  return `${prefix}:${JSON.stringify(sortedArgs)}`;
}

/**
 * Clear the entire query cache. Useful for logout.
 */
export function clearQueryCache() {
  queryCache.clear();
  paginatedCache.clear();
  notifySubscribers();
}

/**
 * Invalidate all cache entries that start with a given prefix.
 * This forces components to show fresh data from Convex on next render.
 *
 * @param prefix - The cache key prefix to invalidate (e.g., "saves:list" invalidates all saves list queries)
 *
 * @example
 * ```tsx
 * // After updating a save, invalidate all saves list cache entries
 * await updateSave({ id, visibility: "public" });
 * invalidateCacheByPrefix("saves:list");
 * ```
 */
export function invalidateCacheByPrefix(prefix: string): void {
  let invalidated = false;

  for (const key of queryCache.keys()) {
    if (key.startsWith(prefix)) {
      queryCache.delete(key);
      invalidated = true;
    }
  }

  for (const key of paginatedCache.keys()) {
    if (key.startsWith(prefix)) {
      paginatedCache.delete(key);
      invalidated = true;
    }
  }

  if (invalidated) {
    notifySubscribers();
  }
}

/**
 * Get cached paginated items for a given key.
 */
export function getPaginatedCache<T>(key: string): { items: T[]; cursor: unknown } | undefined {
  return paginatedCache.get(key) as { items: T[]; cursor: unknown } | undefined;
}

/**
 * Set cached paginated items for a given key.
 */
export function setPaginatedCache<T>(key: string, items: T[], cursor: unknown): void {
  paginatedCache.set(key, { items, cursor });
}

/**
 * Clear paginated cache for a specific key (e.g., when filters change).
 */
export function clearPaginatedCache(key: string): void {
  paginatedCache.delete(key);
}
