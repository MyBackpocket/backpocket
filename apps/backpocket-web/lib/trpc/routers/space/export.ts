import { supabaseAdmin } from "@/lib/supabase";
import { getUserSpace } from "../../services/space";
import { protectedProcedure, router } from "../../trpc";

/**
 * Export data format designed for easy Convex DB migration.
 * Uses normalized tables with explicit relationships.
 */
export interface ExportData {
  version: "1.0";
  exportedAt: string;
  space: {
    id: string;
    slug: string;
    name: string;
    bio: string | null;
    visibility: string;
    publicLayout: string;
    defaultSaveVisibility: string;
    createdAt: string;
    updatedAt: string;
  };
  tags: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
  collections: Array<{
    id: string;
    name: string;
    visibility: string;
    createdAt: string;
    updatedAt: string;
    defaultTagIds: string[];
  }>;
  saves: Array<{
    id: string;
    url: string;
    normalizedUrl: string | null;
    title: string | null;
    description: string | null;
    siteName: string | null;
    imageUrl: string | null;
    contentType: string | null;
    visibility: string;
    isArchived: boolean;
    isFavorite: boolean;
    savedAt: string;
    createdAt: string;
    updatedAt: string;
    tagIds: string[];
    collectionIds: string[];
  }>;
  // Metadata about the export
  counts: {
    saves: number;
    tags: number;
    collections: number;
  };
}

export const exportRouter = router({
  /**
   * Export all user data in a format suitable for migration to Convex or other databases.
   * Returns a structured JSON object with all tables and relationships normalized.
   */
  exportAllData: protectedProcedure.query(async ({ ctx }): Promise<ExportData | null> => {
    const space = await getUserSpace(ctx.userId, ctx.spaceCache);
    if (!space) {
      return null;
    }

    // Fetch base data first
    const [{ data: tags }, { data: collections }, { data: saves }] = await Promise.all([
      // Tags
      supabaseAdmin
        .from("tags")
        .select("id, name, created_at, updated_at")
        .eq("space_id", space.id)
        .order("name"),

      // Collections
      supabaseAdmin
        .from("collections")
        .select("id, name, visibility, created_at, updated_at")
        .eq("space_id", space.id)
        .order("name"),

      // All saves (no pagination for export)
      supabaseAdmin
        .from("saves")
        .select(
          "id, url, normalized_url, title, description, site_name, image_url, content_type, visibility, is_archived, is_favorite, saved_at, created_at, updated_at"
        )
        .eq("space_id", space.id)
        .order("saved_at", { ascending: false }),
    ]);

    // Extract IDs for relationship queries
    const saveIds = (saves || []).map((s) => s.id);
    const collectionIds = (collections || []).map((c) => c.id);

    // Fetch relationships in parallel (only if we have IDs)
    const [{ data: saveTags }, { data: saveCollections }, { data: collectionDefaultTags }] =
      await Promise.all([
        // Save-tag relationships
        saveIds.length > 0
          ? supabaseAdmin.from("save_tags").select("save_id, tag_id").in("save_id", saveIds)
          : Promise.resolve({ data: [] as { save_id: string; tag_id: string }[] }),

        // Save-collection relationships
        saveIds.length > 0
          ? supabaseAdmin
              .from("save_collections")
              .select("save_id, collection_id")
              .in("save_id", saveIds)
          : Promise.resolve({ data: [] as { save_id: string; collection_id: string }[] }),

        // Collection default tags
        collectionIds.length > 0
          ? supabaseAdmin
              .from("collection_default_tags")
              .select("collection_id, tag_id")
              .in("collection_id", collectionIds)
          : Promise.resolve({ data: [] as { collection_id: string; tag_id: string }[] }),
      ]);

    // Build lookup maps for relationships
    const tagsBysSaveId = new Map<string, string[]>();
    for (const st of saveTags || []) {
      const existing = tagsBysSaveId.get(st.save_id) || [];
      existing.push(st.tag_id);
      tagsBysSaveId.set(st.save_id, existing);
    }

    const collectionsBySaveId = new Map<string, string[]>();
    for (const sc of saveCollections || []) {
      const existing = collectionsBySaveId.get(sc.save_id) || [];
      existing.push(sc.collection_id);
      collectionsBySaveId.set(sc.save_id, existing);
    }

    const defaultTagsByCollectionId = new Map<string, string[]>();
    for (const cdt of collectionDefaultTags || []) {
      const existing = defaultTagsByCollectionId.get(cdt.collection_id) || [];
      existing.push(cdt.tag_id);
      defaultTagsByCollectionId.set(cdt.collection_id, existing);
    }

    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      space: {
        id: space.id,
        slug: space.slug,
        name: space.name,
        bio: space.bio,
        visibility: space.visibility,
        publicLayout: space.publicLayout,
        defaultSaveVisibility: space.defaultSaveVisibility,
        createdAt:
          typeof space.createdAt === "string" ? space.createdAt : space.createdAt.toISOString(),
        updatedAt:
          typeof space.updatedAt === "string" ? space.updatedAt : space.updatedAt.toISOString(),
      },
      tags: (tags || []).map((tag) => ({
        id: tag.id,
        name: tag.name,
        createdAt: tag.created_at,
        updatedAt: tag.updated_at,
      })),
      collections: (collections || []).map((col) => ({
        id: col.id,
        name: col.name,
        visibility: col.visibility,
        createdAt: col.created_at,
        updatedAt: col.updated_at,
        defaultTagIds: defaultTagsByCollectionId.get(col.id) || [],
      })),
      saves: (saves || []).map((save) => ({
        id: save.id,
        url: save.url,
        normalizedUrl: save.normalized_url,
        title: save.title,
        description: save.description,
        siteName: save.site_name,
        imageUrl: save.image_url,
        contentType: save.content_type,
        visibility: save.visibility,
        isArchived: save.is_archived,
        isFavorite: save.is_favorite,
        savedAt: save.saved_at,
        createdAt: save.created_at,
        updatedAt: save.updated_at,
        tagIds: tagsBysSaveId.get(save.id) || [],
        collectionIds: collectionsBySaveId.get(save.id) || [],
      })),
      counts: {
        saves: saves?.length || 0,
        tags: tags?.length || 0,
        collections: collections?.length || 0,
      },
    };
  }),
});
