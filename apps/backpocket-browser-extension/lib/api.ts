import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { CreateSaveInput, Save, Tag } from "./types";

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
 * Check for duplicate URL
 */
export async function checkDuplicate(url: string, token: string): Promise<any | null> {
  const client = createClient(token);

  try {
    return await client.query(api.saves.checkDuplicate, { url });
  } catch (error) {
    console.error("Error checking duplicate:", error);
    return null;
  }
}
