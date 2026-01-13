"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

/**
 * Hook to check if the user is authenticated.
 * Returns true only when auth is loaded AND user is authenticated.
 * This prevents queries from running before Clerk restores the session.
 */
function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return !isLoading && isAuthenticated;
}

// Re-export types for convenience
export type SaveId = Id<"saves">;
export type TagId = Id<"tags">;
export type CollectionId = Id<"collections">;
export type SpaceId = Id<"spaces">;

// ============================================================================
// SAVES HOOKS
// ============================================================================

export function useListSaves(args?: {
  query?: string;
  visibility?: "public" | "private";
  isArchived?: boolean;
  isFavorite?: boolean;
  collectionId?: CollectionId;
  tagId?: TagId;
  cursor?: number;
  limit?: number;
}) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.saves.list, isAuthenticated ? (args ?? {}) : "skip");
}

export function useGetSave(saveId: SaveId | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.saves.get, isAuthenticated && saveId ? { saveId } : "skip");
}

export function useCheckDuplicate(url: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.saves.checkDuplicate, isAuthenticated && url ? { url } : "skip");
}

export function useCreateSave() {
  return useMutation(api.saves.create);
}

export function useUpdateSave() {
  return useMutation(api.saves.update);
}

export function useToggleFavorite() {
  return useMutation(api.saves.toggleFavorite);
}

export function useToggleArchive() {
  return useMutation(api.saves.toggleArchive);
}

export function useDeleteSave() {
  return useMutation(api.saves.remove);
}

export function useBulkDeleteSaves() {
  return useMutation(api.saves.bulkDelete);
}

// ============================================================================
// TAGS HOOKS
// ============================================================================

export function useListTags() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.tags.list, isAuthenticated ? {} : "skip");
}

export function useCreateTag() {
  return useMutation(api.tags.create);
}

export function useUpdateTag() {
  return useMutation(api.tags.update);
}

export function useDeleteTag() {
  return useMutation(api.tags.remove);
}

// ============================================================================
// COLLECTIONS HOOKS
// ============================================================================

export function useListCollections(args?: {
  query?: string;
  visibility?: "public" | "private";
  defaultTagId?: TagId;
}) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.collections.list, isAuthenticated ? (args ?? {}) : "skip");
}

export function useGetCollection(collectionId: CollectionId | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.collections.get, isAuthenticated && collectionId ? { collectionId } : "skip");
}

export function useCreateCollection() {
  return useMutation(api.collections.create);
}

export function useUpdateCollection() {
  return useMutation(api.collections.update);
}

export function useDeleteCollection() {
  return useMutation(api.collections.remove);
}

// ============================================================================
// SPACES HOOKS
// ============================================================================

export function useGetMySpace() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.spaces.getMySpace, isAuthenticated ? {} : "skip");
}

export function useEnsureSpace() {
  return useMutation(api.spaces.ensureSpace);
}

export function useUpdateSettings() {
  return useMutation(api.spaces.updateSettings);
}

export function useUpdateSlug() {
  return useMutation(api.spaces.updateSlug);
}

export function useCheckSlugAvailability(slug: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.spaces.checkSlugAvailability, isAuthenticated && slug ? { slug } : "skip");
}

export function useGetStats() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.spaces.getStats, isAuthenticated ? {} : "skip");
}

// ============================================================================
// SNAPSHOTS HOOKS
// ============================================================================

export function useGetSaveSnapshot(saveId: SaveId | undefined, includeContent = false) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(
    api.snapshots.getSaveSnapshot,
    isAuthenticated && saveId ? { saveId, includeContent } : "skip"
  );
}

export function useRequestSaveSnapshot() {
  return useMutation(api.snapshots.requestSaveSnapshot);
}

export function useGetSnapshotQuota() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery(api.snapshots.getSnapshotQuota, isAuthenticated ? {} : "skip");
}

// ============================================================================
// PUBLIC HOOKS (for public space pages)
// ============================================================================

export function useResolveSpaceBySlug(slug: string | undefined) {
  return useQuery(api.public.resolveSpaceBySlug, slug ? { slug } : "skip");
}

export function useResolveSpaceByDomain(domain: string | undefined) {
  return useQuery(api.public.resolveSpaceByDomain, domain ? { domain } : "skip");
}

export function useListPublicSaves(
  args:
    | {
        spaceId: SpaceId;
        query?: string;
        tagName?: string;
        collectionId?: CollectionId;
        cursor?: number;
        limit?: number;
      }
    | undefined
) {
  return useQuery(api.public.listPublicSaves, args ?? "skip");
}

export function useGetPublicSave(spaceId: SpaceId | undefined, saveId: SaveId | undefined) {
  return useQuery(api.public.getPublicSave, spaceId && saveId ? { spaceId, saveId } : "skip");
}

export function useListPublicTags(spaceId: SpaceId | undefined) {
  return useQuery(api.public.listPublicTags, spaceId ? { spaceId } : "skip");
}

export function useListPublicCollections(spaceId: SpaceId | undefined) {
  return useQuery(api.public.listPublicCollections, spaceId ? { spaceId } : "skip");
}

export function useRegisterVisit() {
  return useMutation(api.public.registerVisit);
}

export function useGetVisitCount(spaceId: SpaceId | undefined) {
  return useQuery(api.public.getVisitCount, spaceId ? { spaceId } : "skip");
}

export function useGetPublicSaveSnapshot(
  spaceId: SpaceId | undefined,
  saveId: SaveId | undefined,
  includeContent = false
) {
  return useQuery(
    api.snapshots.getPublicSaveSnapshot,
    spaceId && saveId ? { spaceId, saveId, includeContent } : "skip"
  );
}
