/**
 * Unified Data Hooks
 * Smart hooks that automatically switch between Convex (online) and SQLite (offline) data sources
 *
 * Usage: Import from this module instead of @/lib/convex/hooks for offline-aware data access
 */

import { useMemo } from "react";
import { useOfflineContext } from "@/lib/offline/context";
import {
  useOfflineSaves as useOfflineSavesRaw,
  useOfflineSave as useOfflineSaveRaw,
  useOfflineSnapshot as useOfflineSnapshotRaw,
} from "@/lib/offline/hooks";
import {
  useListSaves as useConvexListSaves,
  useGetSave as useConvexGetSave,
  useGetSaveSnapshot as useConvexGetSaveSnapshot,
  useListTags as useConvexListTags,
  useListCollections as useConvexListCollections,
  useToggleFavorite,
  useToggleArchive,
  useDeleteSave,
  useCreateSave,
  useUpdateSave,
  type SaveId,
  type TagId,
  type CollectionId,
} from "@/lib/convex/hooks";
import type { Save, ListSavesInput } from "@/lib/types";

// Re-export mutation hooks (they only work online)
export {
  useToggleFavorite,
  useToggleArchive,
  useDeleteSave,
  useCreateSave,
  useUpdateSave,
  useToggleFavorite as useToggleFavoriteMutation,
  useToggleArchive as useToggleArchiveMutation,
  useDeleteSave as useDeleteSaveMutation,
  useCreateSave as useCreateSaveMutation,
  useUpdateSave as useUpdateSaveMutation,
};

// Re-export types
export type { SaveId, TagId, CollectionId };

/**
 * Hook to determine if we should use offline data
 * 
 * Returns true when:
 * - We're in offline-only mode (app started offline, no Convex auth available)
 * - We're offline AND have offline data available (settings.offline.enabled means we've synced data)
 * - We're offline regardless of settings - if we're offline, we MUST use offline data
 */
function useIsOfflineDataMode(): boolean {
  const { isOffline, isOfflineOnly } = useOfflineContext();
  // When offline (for any reason), we should use offline data
  // The settings.offline.enabled flag only controls whether we sync data,
  // not whether we use it when offline
  return isOfflineOnly || isOffline;
}

/**
 * Hook to check if we're in offline-only mode (no Convex provider)
 */
function useIsOfflineOnly(): boolean {
  const { isOfflineOnly } = useOfflineContext();
  return isOfflineOnly;
}

// ============================================================================
// UNIFIED SAVES HOOKS
// ============================================================================

interface UseListSavesResult {
  items: Save[];
  isLoading: boolean;
  isOffline: boolean;
}

/**
 * Unified hook for listing saves
 * Automatically uses offline cache when offline and offline mode is enabled
 */
export function useListSaves(args?: ListSavesInput): UseListSavesResult {
  const useOfflineData = useIsOfflineDataMode();
  const offlineOnly = useIsOfflineOnly();
  const { isOffline } = useOfflineContext();

  // Memoize offline options to prevent unnecessary re-fetches
  const offlineOptions = useMemo(
    () =>
      useOfflineData
        ? {
            isFavorite: args?.isFavorite,
            visibility: args?.visibility,
            isArchived: args?.isArchived,
            limit: args?.limit,
          }
        : undefined,
    [useOfflineData, args?.isFavorite, args?.visibility, args?.isArchived, args?.limit]
  );

  // Offline hook with equivalent filters - always safe to call
  const { saves: offlineSaves, isLoading: offlineLoading } = useOfflineSavesRaw(offlineOptions);

  // Convex hook - only call if NOT in offline-only mode (provider exists)
  // Pass undefined when we're using offline data to skip the query
  const convexData = useConvexListSaves(
    offlineOnly || useOfflineData ? undefined : (args as any)
  );

  if (useOfflineData) {
    return {
      items: offlineSaves as Save[],
      isLoading: offlineLoading,
      isOffline: true,
    };
  }

  return {
    items: (convexData?.items ?? []) as Save[],
    isLoading: convexData === undefined,
    isOffline,
  };
}

interface UseGetSaveResult {
  save: Save | null;
  isLoading: boolean;
  isOffline: boolean;
  isAvailableOffline: boolean;
}

/**
 * Unified hook for getting a single save
 * Automatically uses offline cache when offline and offline mode is enabled
 */
export function useGetSave(saveId: SaveId | string | undefined): UseGetSaveResult {
  const useOfflineData = useIsOfflineDataMode();
  const { isOffline } = useOfflineContext();

  // Convex hook
  const convexSave = useConvexGetSave(useOfflineData ? undefined : (saveId as SaveId));

  // Offline hook
  const { save: offlineSave, isLoading: offlineLoading } = useOfflineSaveRaw(
    useOfflineData ? (saveId as string) : undefined
  );

  if (useOfflineData) {
    return {
      save: offlineSave as Save | null,
      isLoading: offlineLoading,
      isOffline: true,
      isAvailableOffline: offlineSave !== null,
    };
  }

  return {
    save: (convexSave as Save | null) ?? null,
    isLoading: convexSave === undefined,
    isOffline,
    isAvailableOffline: false, // Not tracked when online
  };
}

interface UseGetSnapshotResult {
  snapshot: {
    saveId: string;
    status: string;
    title: string | null;
    byline: string | null;
    excerpt: string | null;
    wordCount: number | null;
  } | null;
  content: {
    title: string;
    byline: string | null;
    content: string;
    textContent: string;
    excerpt: string;
  } | null;
  isLoading: boolean;
  isOffline: boolean;
}

/**
 * Unified hook for getting a save's snapshot
 * Automatically uses offline cache when offline and offline mode is enabled
 */
export function useGetSaveSnapshot(
  saveId: SaveId | string | undefined,
  includeContent = true
): UseGetSnapshotResult {
  const useOfflineData = useIsOfflineDataMode();
  const { isOffline } = useOfflineContext();

  // Convex hook
  const convexSnapshot = useConvexGetSaveSnapshot(
    useOfflineData ? undefined : (saveId as SaveId),
    includeContent
  );

  // Offline hook
  const { snapshot: offlineData, isLoading: offlineLoading } = useOfflineSnapshotRaw(
    useOfflineData ? (saveId as string) : undefined
  );

  if (useOfflineData) {
    return {
      snapshot: offlineData?.snapshot ?? null,
      content: offlineData?.content ?? null,
      isLoading: offlineLoading,
      isOffline: true,
    };
  }

  return {
    snapshot: convexSnapshot?.snapshot ?? null,
    content: convexSnapshot?.content ?? null,
    isLoading: convexSnapshot === undefined,
    isOffline,
  };
}

// ============================================================================
// UNIFIED TAGS & COLLECTIONS HOOKS
// ============================================================================

/**
 * Unified hook for listing tags
 * Note: Tags are currently only available online (not cached offline)
 */
export function useListTags() {
  const { isOffline } = useOfflineContext();
  const tags = useConvexListTags();

  // Return empty array when offline
  if (isOffline) {
    return [];
  }

  return tags;
}

/**
 * Unified hook for listing collections
 * Note: Collections are currently only available online (not cached offline)
 */
export function useListCollections(args?: {
  query?: string;
  visibility?: "public" | "private";
}) {
  const { isOffline } = useOfflineContext();
  const collections = useConvexListCollections(args);

  // Return empty array when offline
  if (isOffline) {
    return [];
  }

  return collections;
}

// ============================================================================
// OFFLINE AWARENESS HOOKS
// ============================================================================

/**
 * Hook to check if mutations are available
 * Returns false when offline (mutations require network)
 */
export function useCanMutate(): boolean {
  const { isOffline } = useOfflineContext();
  return !isOffline;
}

/**
 * Hook to get a warning message if trying to mutate while offline
 */
export function useOfflineMutationWarning(): string | null {
  const canMutate = useCanMutate();
  return canMutate ? null : "You're offline. Changes will sync when connected.";
}
