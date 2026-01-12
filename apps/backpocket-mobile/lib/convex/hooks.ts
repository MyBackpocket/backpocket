/**
 * Convex hooks for React Native
 */

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// Re-export types
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
	return useQuery(
		api.collections.get,
		collectionId ? { collectionId } : "skip",
	);
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

export function useGetSaveSnapshot(
	saveId: SaveId | undefined,
	includeContent = false,
) {
	return useQuery(
		api.snapshots.getSaveSnapshot,
		saveId ? { saveId, includeContent } : "skip",
	);
}

export function useRequestSaveSnapshot() {
	return useMutation(api.snapshots.requestSaveSnapshot);
}

export function useGetSnapshotQuota() {
	return useQuery(api.snapshots.getSnapshotQuota, {});
}
