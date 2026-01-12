// Save types

import type { Collection } from "./collections";
import type { Tag } from "./tags";

export type SaveVisibility = "private" | "public";

export interface Save {
  id: string;
  spaceId: string;
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  contentType: string | null;
  visibility: SaveVisibility;
  isArchived: boolean;
  isFavorite: boolean;
  createdBy: string;
  savedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  tags?: Tag[];
  collections?: Collection[];
}

// API input types
export interface CreateSaveInput {
  url: string;
  title?: string;
  visibility?: SaveVisibility;
  collectionIds?: string[];
  tagNames?: string[];
  note?: string;
}

export interface UpdateSaveInput {
  id: string;
  title?: string;
  description?: string;
  visibility?: SaveVisibility;
  collectionIds?: string[];
  tagNames?: string[];
}

export interface ListSavesInput {
  query?: string;
  visibility?: SaveVisibility;
  isArchived?: boolean;
  isFavorite?: boolean;
  collectionId?: string;
  tagId?: string;
  cursor?: string;
  limit?: number;
}

// API response types (dates serialized as strings over the wire)
export interface APISave {
  id: string;
  spaceId: string;
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  contentType: string | null;
  visibility: SaveVisibility;
  isArchived: boolean;
  isFavorite: boolean;
  createdBy: string;
  savedAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  tags?: APITag[];
  collections?: APICollection[];
}

// Forward declare API types
import type { APICollection } from "./collections";
import type { APITag } from "./tags";

// Public save (for public space viewing)
export interface PublicSave {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  savedAt: Date | string;
  tags?: string[];
}

// Response types
export interface ListSavesResponse {
  items: Save[];
  nextCursor: string | null;
}

export interface StatsResponse {
  totalSaves: number;
  favoriteSaves: number;
  publicSaves: number;
  archivedSaves: number;
  totalTags: number;
  totalCollections: number;
}

export interface DashboardData {
  stats: StatsResponse;
  recentSaves: Save[];
  space: import("./spaces").Space;
}

// Duplicate detection types
export interface DuplicateSaveInfo {
  id: string;
  url: string;
  title: string | null;
  imageUrl: string | null;
  siteName: string | null;
  savedAt: string;
}

export interface CheckDuplicateInput {
  url: string;
}

export type CheckDuplicateResponse = DuplicateSaveInfo | null;

export interface DuplicateSaveErrorCause {
  type: "DUPLICATE_SAVE";
  existingSave: DuplicateSaveInfo;
}

export interface DuplicateSaveErrorData {
  code: "CONFLICT";
  httpStatus: 409;
  path: string;
  cause: DuplicateSaveErrorCause;
}

