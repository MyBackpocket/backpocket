import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Collection, CreateSaveInput, DuplicateSaveInfo, Save, Space, Tag } from "./types";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "https://your-project.convex.cloud";

// Debug logging - only in development
const DEBUG = import.meta.env.DEV;
function log(...args: unknown[]) {
  if (DEBUG) console.log("[Backpocket API]", ...args);
}

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

// =============================================================================
// SINGLETON CLIENT
// =============================================================================

/**
 * Singleton Convex client - reused across all API calls
 * Much faster than creating a new client for every request
 */
let clientInstance: ConvexHttpClient | null = null;
let currentToken: string | null = null;

function getClient(token: string): ConvexHttpClient {
  // Reuse existing client if token hasn't changed
  if (clientInstance && currentToken === token) {
    return clientInstance;
  }

  // Create new client or update auth
  if (!clientInstance) {
    clientInstance = new ConvexHttpClient(CONVEX_URL);
  }
  clientInstance.setAuth(token);
  currentToken = token;

  return clientInstance;
}

// =============================================================================
// CACHING LAYER
// =============================================================================

interface CachedData<T> {
  data: T;
  timestamp: number;
}

const CACHE_KEYS = {
  tags: "backpocket_cache_tags",
  collections: "backpocket_cache_collections",
  space: "backpocket_cache_space",
} as const;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get data from cache if valid, otherwise fetch and cache it
 */
async function getCachedOrFetch<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const result = await browser.storage.local.get(cacheKey);
    const cached = result[cacheKey] as CachedData<T> | undefined;

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  } catch {
    // Cache read failed, proceed to fetch
  }

  const data = await fetcher();

  // Cache the result (don't await, fire and forget)
  browser.storage.local
    .set({
      [cacheKey]: { data, timestamp: Date.now() } as CachedData<T>,
    })
    .catch(() => {});

  return data;
}

/**
 * Invalidate specific caches - call after mutations that affect cached data
 */
export async function invalidateCache(
  keys: Array<keyof typeof CACHE_KEYS> = ["tags", "collections", "space"]
): Promise<void> {
  const keysToRemove = keys.map((k) => CACHE_KEYS[k]);
  await browser.storage.local.remove(keysToRemove);
}

/**
 * Clear all API caches
 */
export async function clearAllCaches(): Promise<void> {
  await browser.storage.local.remove(Object.values(CACHE_KEYS));
}

/**
 * Create a new save (bookmark) in the user's space
 */
export async function createSave(input: CreateSaveInput, token: string): Promise<Save> {
  const client = getClient(token);

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
 * List all tags for the authenticated user (cached for 5 minutes)
 */
export async function listTags(token: string): Promise<Tag[]> {
  return getCachedOrFetch(CACHE_KEYS.tags, async () => {
    const client = getClient(token);

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
  });
}

/**
 * Check for duplicate URL - returns existing save info if found
 * Note: This is NOT cached since it's URL-specific and needs fresh data
 */
export async function checkDuplicate(
  url: string,
  token: string
): Promise<DuplicateSaveInfo | null> {
  const client = getClient(token);

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
  } catch {
    // Silent fail - duplicate check is non-critical
    return null;
  }
}

/**
 * List all collections for the authenticated user (cached for 5 minutes)
 */
export async function listCollections(token: string): Promise<Collection[]> {
  return getCachedOrFetch(CACHE_KEYS.collections, async () => {
    const client = getClient(token);

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
  });
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
 * Get the user's space settings (cached for 5 minutes)
 */
export async function getMySpace(token: string): Promise<Space | null> {
  return getCachedOrFetch(CACHE_KEYS.space, async () => {
    const client = getClient(token);

    try {
      const result = await client.query(api.spaces.getMySpace, {});
      if (!result) return null;
      return transformSpace(result);
    } catch {
      // Silent fail - space fetch is non-critical
      return null;
    }
  });
}

/**
 * Ensure user has a space (creates one if needed)
 */
export async function ensureSpace(token: string): Promise<Space> {
  const client = getClient(token);

  try {
    const result = await client.mutation(api.spaces.ensureSpace, {});
    const space = transformSpace(result);

    // Cache the newly created space
    browser.storage.local
      .set({
        [CACHE_KEYS.space]: { data: space, timestamp: Date.now() } as CachedData<Space>,
      })
      .catch(() => {});

    return space;
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
  const client = getClient(token);

  try {
    await client.mutation(api.saves.update, {
      id: saveId as any, // Convex ID
      visibility: input.visibility,
      tagNames: input.tagNames,
      collectionIds: input.collectionIds as any,
      note: input.note,
    });

    // Invalidate tags cache if new tags may have been created
    if (input.tagNames && input.tagNames.length > 0) {
      invalidateCache(["tags"]).catch(() => {});
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Failed to update save");
  }
}

/**
 * List recent saves for the authenticated user
 * Note: NOT cached since it changes frequently
 */
export async function listRecentSaves(token: string, limit = 5): Promise<Save[]> {
  const client = getClient(token);

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

/**
 * Delete a save by ID
 */
export async function deleteSave(saveId: string, token: string): Promise<void> {
  const client = getClient(token);

  try {
    await client.mutation(api.saves.remove, {
      saveId: saveId as any, // Convex ID
      clientSource: "extension",
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Failed to delete save");
  }
}

// =============================================================================
// SETTINGS
// =============================================================================

/**
 * Update account settings (syncs to Convex)
 */
export async function updateAccountSettings(
  settings: {
    defaultSaveVisibility?: "public" | "private";
    theme?: "light" | "dark" | "system";
  },
  token: string
): Promise<void> {
  const client = getClient(token);

  try {
    await client.mutation(api.spaces.updateSettings, {
      ...settings,
      clientSource: "extension",
    });

    // Invalidate space cache since settings changed
    invalidateCache(["space"]).catch(() => {});
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message, "UNKNOWN_ERROR");
    }
    throw new ApiError("Failed to update settings");
  }
}

// =============================================================================
// BACKGROUND SCRIPT HELPERS
// =============================================================================

/**
 * Check if a URL is already saved - for use in background script.
 * Gets auth token from session storage instead of Clerk context.
 * Returns true if URL is saved, false otherwise.
 */
export async function checkDuplicateFromBackground(url: string): Promise<boolean> {
  try {
    const tokenData = (await browser.storage.session.get("auth_token")) as { auth_token?: string };
    const token = tokenData?.auth_token;
    if (!token) {
      log("No auth token in session storage");
      return false;
    }

    log("Found auth token, checking duplicate...");
    const result = await checkDuplicate(url, token);
    return result !== null;
  } catch {
    // Silent fail - background check is non-critical
    return false;
  }
}
