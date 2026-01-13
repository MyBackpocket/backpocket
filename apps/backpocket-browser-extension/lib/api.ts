import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Collection, CreateSaveInput, DuplicateSaveInfo, Save, Space, Tag } from "./types";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "https://your-project.convex.cloud";

/**
 * Custom error class for API errors with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public httpStatus?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Create a Convex client with authentication token
 */
function createClient(token: string) {
  const client = new ConvexHttpClient(CONVEX_URL);
  client.setAuth(token);
  return client;
}

/**
 * Create a new save (bookmark) in the user's space
 */
export async function createSave(input: CreateSaveInput, token: string): Promise<Save> {
  const client = createClient(token);

  try {
    const result = await client.mutation(api.saves.create, {
      url: input.url,
      title: input.title,
      visibility: input.visibility,
      collectionIds: input.collectionIds as any, // Convex IDs
      tagNames: input.tagNames,
      note: input.note,
    });

    // Transform result to match existing Save type
    return {
      id: result.id,
      spaceId: result.spaceId,
      url: result.url,
      title: result.title,
      description: result.description,
      note: result.note,
      siteName: result.siteName,
      imageUrl: result.imageUrl,
      contentType: result.contentType,
      visibility: result.visibility,
      isArchived: result.isArchived,
      isFavorite: result.isFavorite,
      createdBy: result.createdBy,
      savedAt: new Date(result.savedAt),
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      tags: result.tags?.map((t: any) => ({
        id: t.id,
        spaceId: t.spaceId,
        name: t.name,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })),
      collections: result.collections?.map((c: any) => ({
        id: c.id,
        spaceId: c.spaceId,
        name: c.name,
        visibility: c.visibility,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      // Check for duplicate save error
      if (error.message.includes("already have this link saved")) {
        throw new ApiError("You already have this link saved", "CONFLICT", 409);
      }
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Something went wrong");
  }
}

/**
 * List all tags for the authenticated user
 */
export async function listTags(token: string): Promise<Tag[]> {
  const client = createClient(token);

  try {
    const result = await client.query(api.tags.list, {});

    return result.map((t: any) => ({
      id: t.id,
      spaceId: t.spaceId,
      name: t.name,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      _count: t._count,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Something went wrong");
  }
}

/**
 * Check for duplicate URL - returns existing save info if found
 */
export async function checkDuplicate(
  url: string,
  token: string
): Promise<DuplicateSaveInfo | null> {
  const client = createClient(token);

  try {
    const result = await client.query(api.saves.checkDuplicate, { url });
    if (!result) return null;

    // Transform Convex result to match DuplicateSaveInfo type
    return {
      id: result.id,
      url: result.url,
      title: result.title,
      imageUrl: result.imageUrl,
      siteName: result.siteName,
      savedAt: new Date(result.savedAt).toISOString(),
    };
  } catch (error) {
    console.error("Error checking duplicate:", error);
    return null;
  }
}

/**
 * List all collections for the authenticated user
 */
export async function listCollections(token: string): Promise<Collection[]> {
  const client = createClient(token);

  try {
    const result = await client.query(api.collections.list, {});

    return result.map((c: any) => ({
      id: c.id,
      spaceId: c.spaceId,
      name: c.name,
      visibility: c.visibility,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      _count: c._count,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Something went wrong");
  }
}

/**
 * Transform Convex space result to Space type
 */
function transformSpace(s: any): Space {
  return {
    id: s.id,
    type: s.type,
    slug: s.slug,
    name: s.name,
    bio: s.bio,
    avatarUrl: s.avatarUrl,
    visibility: s.visibility,
    publicLayout: s.publicLayout,
    defaultSaveVisibility: s.defaultSaveVisibility,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  };
}

/**
 * Get the user's space settings
 */
export async function getMySpace(token: string): Promise<Space | null> {
  const client = createClient(token);

  try {
    const result = await client.query(api.spaces.getMySpace, {});
    if (!result) return null;
    return transformSpace(result);
  } catch (error) {
    console.error("Error fetching space:", error);
    return null;
  }
}

/**
 * Ensure user has a space (creates one if needed)
 */
export async function ensureSpace(token: string): Promise<Space> {
  const client = createClient(token);

  try {
    const result = await client.mutation(api.spaces.ensureSpace, {});
    return transformSpace(result);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Failed to create space");
  }
}

/**
 * Update an existing save (tags, visibility, note, collections)
 */
export async function updateSave(
  saveId: string,
  input: {
    visibility?: "public" | "private";
    tagNames?: string[];
    collectionIds?: string[];
    note?: string;
  },
  token: string
): Promise<void> {
  const client = createClient(token);

  try {
    await client.mutation(api.saves.update, {
      id: saveId as any, // Convex ID
      visibility: input.visibility,
      tagNames: input.tagNames,
      collectionIds: input.collectionIds as any,
      note: input.note,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Failed to update save");
  }
}

/**
 * List recent saves for the authenticated user
 */
export async function listRecentSaves(token: string, limit = 5): Promise<Save[]> {
  const client = createClient(token);

  try {
    const result = await client.query(api.saves.list, { limit });

    return result.items.map((s: any) => ({
      id: s.id,
      spaceId: s.spaceId,
      url: s.url,
      title: s.title,
      description: s.description,
      note: s.note,
      siteName: s.siteName,
      imageUrl: s.imageUrl,
      contentType: s.contentType,
      visibility: s.visibility,
      isArchived: s.isArchived,
      isFavorite: s.isFavorite,
      createdBy: s.createdBy,
      savedAt: new Date(s.savedAt),
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      tags: s.tags?.map((t: any) => ({
        id: t.id,
        spaceId: t.spaceId,
        name: t.name,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })),
      collections: s.collections?.map((c: any) => ({
        id: c.id,
        spaceId: c.spaceId,
        name: c.name,
        visibility: c.visibility,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Something went wrong");
  }
}
