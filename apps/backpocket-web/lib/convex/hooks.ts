"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

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
  return useQuery(api.saves.list, args ?? {});
}

export function useGetSave(saveId: SaveId | undefined) {
  return useQuery(api.saves.get, saveId ? { saveId } : "skip");
}

export function useCheckDuplicate(url: string | undefined) {
  return useQuery(api.saves.checkDuplicate, url ? { url } : "skip");
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
  return useQuery(api.tags.list, {});
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
  return useQuery(api.collections.list, args ?? {});
}

export function useGetCollection(collectionId: CollectionId | undefined) {
  return useQuery(api.collections.get, collectionId ? { collectionId } : "skip");
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
  return useQuery(api.spaces.getMySpace, {});
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
  return useQuery(api.spaces.checkSlugAvailability, slug ? { slug } : "skip");
}

export function useGetStats() {
  return useQuery(api.spaces.getStats, {});
}

// ============================================================================
// SNAPSHOTS HOOKS
// ============================================================================

export function useGetSaveSnapshot(saveId: SaveId | undefined, includeContent = false) {
  return useQuery(
    api.snapshots.getSaveSnapshot,
    saveId ? { saveId, includeContent } : "skip"
  );
}

export function useRequestSaveSnapshot() {
  return useMutation(api.snapshots.requestSaveSnapshot);
}

export function useGetSnapshotQuota() {
  return useQuery(api.snapshots.getSnapshotQuota, {});
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

export function useListPublicSaves(args: {
  spaceId: SpaceId;
  query?: string;
  tagName?: string;
  collectionId?: CollectionId;
  cursor?: number;
  limit?: number;
} | undefined) {
  return useQuery(api.public.listPublicSaves, args ?? "skip");
}

export function useGetPublicSave(spaceId: SpaceId | undefined, saveId: SaveId | undefined) {
  return useQuery(
    api.public.getPublicSave,
    spaceId && saveId ? { spaceId, saveId } : "skip"
  );
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
