// Collection types

import type { Save, SaveVisibility } from "./saves";
import type { Tag } from "./tags";

export type CollectionVisibility = "private" | "public";

export interface Collection {
  id: string;
  spaceId: string;
  name: string;
  visibility: CollectionVisibility;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  saves?: Save[];
  defaultTags?: Tag[];
  _count?: {
    saves: number;
  };
}

// API input types
export interface CreateCollectionInput {
  name: string;
  visibility?: CollectionVisibility;
  defaultTags?: string[];
}

export interface UpdateCollectionInput {
  id: string;
  name?: string;
  visibility?: CollectionVisibility;
  defaultTags?: string[];
}

// API response types (dates serialized as strings over the wire)
export interface APICollection {
  id: string;
  spaceId: string;
  name: string;
  visibility: CollectionVisibility;
  createdAt: string | Date;
  updatedAt: string | Date;
  defaultTags?: APITag[];
  _count?: {
    saves: number;
  };
}

// Forward declare
import type { APITag } from "./tags";

// Re-export for convenience
export type { SaveVisibility };

