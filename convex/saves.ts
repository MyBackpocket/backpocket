import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "./_generated/server";
import { getOrCreateUserSpace, getUserSpace, requireAuth } from "./lib/auth";
import { type ClientSource, createWideEvent, extractDomain } from "./lib/logger";
import { normalizeUrl } from "./lib/validators";
import { clientSourceValidator, visibilityValidator } from "./schema";

// Helper function to get a formatted save (can be called from queries or mutations)
async function getSaveById(
  ctx: QueryCtx | MutationCtx,
  spaceId: Id<"spaces">,
  saveId: Id<"saves">
) {
  const save = await ctx.db.get(saveId);
  if (!save || save.spaceId !== spaceId) return null;

  // Get tags and collections
  const [saveTags, saveCollections] = await Promise.all([
    ctx.db
      .query("saveTags")
      .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
      .collect(),
    ctx.db
      .query("saveCollections")
      .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
      .collect(),
  ]);

  const [tags, collections] = await Promise.all([
    Promise.all(saveTags.map((st) => ctx.db.get(st.tagId))),
    Promise.all(saveCollections.map((sc) => ctx.db.get(sc.collectionId))),
  ]);

  return {
    id: save._id,
    spaceId: save.spaceId,
    url: save.url,
    title: save.title,
    description: save.description,
    note: save.note ?? null,
    siteName: save.siteName,
    imageUrl: save.imageUrl,
    contentType: save.contentType,
    visibility: save.visibility,
    isArchived: save.isArchived,
    isFavorite: save.isFavorite,
    createdBy: save.createdBy,
    savedAt: save.savedAt,
    createdAt: save._creationTime,
    updatedAt: save._creationTime,
    tags: tags.filter(Boolean).map((t) => ({
      id: t!._id,
      spaceId: t!.spaceId,
      name: t!.name,
      createdAt: t!._creationTime,
      updatedAt: t!._creationTime,
    })),
    collections: collections.filter(Boolean).map((c) => ({
      id: c!._id,
      spaceId: c!.spaceId,
      name: c!.name,
      visibility: c!.visibility,
      createdAt: c!._creationTime,
      updatedAt: c!._creationTime,
    })),
  };
}

// List saves with filters and pagination
export const list = query({
  args: {
    query: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    isArchived: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),
    collectionId: v.optional(v.id("collections")),
    tagId: v.optional(v.id("tags")),
    cursor: v.optional(v.number()), // savedAt timestamp for cursor
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      return { items: [], nextCursor: null };
    }

    const limit = Math.min(args.limit ?? 20, 50);

    // Get save IDs filtered by tag or collection if specified
    let filteredSaveIds: Set<string> | null = null;

    if (args.tagId) {
      const saveTags = await ctx.db
        .query("saveTags")
        .withIndex("by_tagId", (q) => q.eq("tagId", args.tagId!))
        .collect();
      filteredSaveIds = new Set(saveTags.map((st) => st.saveId));
    } else if (args.collectionId) {
      const saveCollections = await ctx.db
        .query("saveCollections")
        .withIndex("by_collectionId", (q) => q.eq("collectionId", args.collectionId!))
        .collect();
      filteredSaveIds = new Set(saveCollections.map((sc) => sc.saveId));
    }

    // Build the main query
    let savesQuery = ctx.db
      .query("saves")
      .withIndex("by_spaceId_savedAt", (q) => q.eq("spaceId", space._id))
      .order("desc");

    // Apply cursor
    if (args.cursor) {
      savesQuery = savesQuery.filter((q) => q.lt(q.field("savedAt"), args.cursor!));
    }

    // Collect and filter
    const allSaves = await savesQuery.take(limit * 3); // Fetch extra to account for filters

    let saves = allSaves.filter((save) => {
      // Filter by junction table results
      if (filteredSaveIds && !filteredSaveIds.has(save._id)) {
        return false;
      }
      // Filter by visibility
      if (args.visibility && save.visibility !== args.visibility) {
        return false;
      }
      // Filter by archived status
      if (args.isArchived !== undefined && save.isArchived !== args.isArchived) {
        return false;
      }
      // Filter by favorite status
      if (args.isFavorite !== undefined && save.isFavorite !== args.isFavorite) {
        return false;
      }
      // Text search
      if (args.query) {
        const q = args.query.toLowerCase();
        const matchesTitle = save.title?.toLowerCase().includes(q);
        const matchesDesc = save.description?.toLowerCase().includes(q);
        const matchesNote = save.note?.toLowerCase().includes(q);
        const matchesUrl = save.url.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesNote && !matchesUrl) {
          return false;
        }
      }
      return true;
    });

    // Apply limit
    const hasMore = saves.length > limit;
    saves = saves.slice(0, limit);

    // Get tags and collections for all saves
    const saveIds = saves.map((s) => s._id);

    const [allSaveTags, allSaveCollections] = await Promise.all([
      Promise.all(
        saveIds.map((saveId) =>
          ctx.db
            .query("saveTags")
            .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
            .collect()
        )
      ),
      Promise.all(
        saveIds.map((saveId) =>
          ctx.db
            .query("saveCollections")
            .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
            .collect()
        )
      ),
    ]);

    // Fetch tag and collection documents
    const tagIds = [...new Set(allSaveTags.flat().map((st) => st.tagId))];
    const collectionIds = [...new Set(allSaveCollections.flat().map((sc) => sc.collectionId))];

    const [tags, collections] = await Promise.all([
      Promise.all(tagIds.map((id) => ctx.db.get(id))),
      Promise.all(collectionIds.map((id) => ctx.db.get(id))),
    ]);

    const tagsMap = new Map(tags.filter(Boolean).map((t) => [t!._id, t!]));
    const collectionsMap = new Map(collections.filter(Boolean).map((c) => [c!._id, c!]));

    // Transform saves with their relations
    const items = saves.map((save, idx) => {
      const saveTags = allSaveTags[idx]
        .map((st) => tagsMap.get(st.tagId))
        .filter(Boolean)
        .map((t) => ({
          id: t!._id,
          spaceId: t!.spaceId,
          name: t!.name,
          createdAt: t!._creationTime,
          updatedAt: t!._creationTime,
        }));

      const saveCollections = allSaveCollections[idx]
        .map((sc) => collectionsMap.get(sc.collectionId))
        .filter(Boolean)
        .map((c) => ({
          id: c!._id,
          spaceId: c!.spaceId,
          name: c!.name,
          visibility: c!.visibility,
          createdAt: c!._creationTime,
          updatedAt: c!._creationTime,
        }));

      return {
        id: save._id,
        spaceId: save.spaceId,
        url: save.url,
        title: save.title ?? null,
        description: save.description ?? null,
        note: save.note ?? null,
        siteName: save.siteName ?? null,
        imageUrl: save.imageUrl ?? null,
        contentType: save.contentType ?? null,
        visibility: save.visibility,
        isArchived: save.isArchived,
        isFavorite: save.isFavorite,
        createdBy: save.createdBy,
        savedAt: save.savedAt,
        createdAt: save._creationTime,
        updatedAt: save._creationTime,
        tags: saveTags,
        collections: saveCollections,
      };
    });

    const nextCursor = hasMore && saves.length > 0 ? saves[saves.length - 1].savedAt : null;

    return { items, nextCursor };
  },
});

// Get a single save
export const get = query({
  args: { saveId: v.id("saves") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) return null;

    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== space._id) return null;

    // Get tags and collections
    const [saveTags, saveCollections] = await Promise.all([
      ctx.db
        .query("saveTags")
        .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
        .collect(),
      ctx.db
        .query("saveCollections")
        .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
        .collect(),
    ]);

    const [tags, collections] = await Promise.all([
      Promise.all(saveTags.map((st) => ctx.db.get(st.tagId))),
      Promise.all(saveCollections.map((sc) => ctx.db.get(sc.collectionId))),
    ]);

    return {
      id: save._id,
      spaceId: save.spaceId,
      url: save.url,
      title: save.title ?? null,
      description: save.description ?? null,
      note: save.note ?? null,
      siteName: save.siteName ?? null,
      imageUrl: save.imageUrl ?? null,
      contentType: save.contentType ?? null,
      visibility: save.visibility,
      isArchived: save.isArchived,
      isFavorite: save.isFavorite,
      createdBy: save.createdBy,
      savedAt: save.savedAt,
      createdAt: save._creationTime,
      updatedAt: save._creationTime,
      tags: tags.filter(Boolean).map((t) => ({
        id: t!._id,
        spaceId: t!.spaceId,
        name: t!.name,
        createdAt: t!._creationTime,
        updatedAt: t!._creationTime,
      })),
      collections: collections.filter(Boolean).map((c) => ({
        id: c!._id,
        spaceId: c!.spaceId,
        name: c!.name,
        visibility: c!.visibility,
        createdAt: c!._creationTime,
        updatedAt: c!._creationTime,
      })),
    };
  },
});

// Check for duplicate URL
export const checkDuplicate = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) return null;

    const normalized = normalizeUrl(args.url);
    if (!normalized) return null;

    const existing = await ctx.db
      .query("saves")
      .withIndex("by_spaceId_normalizedUrl", (q) =>
        q.eq("spaceId", space._id).eq("normalizedUrl", normalized)
      )
      .first();

    if (!existing) return null;

    return {
      id: existing._id,
      url: existing.url,
      title: existing.title ?? null,
      imageUrl: existing.imageUrl ?? null,
      siteName: existing.siteName ?? null,
      savedAt: existing.savedAt,
    };
  },
});

// Create a new save
export const create = mutation({
  args: {
    url: v.string(),
    title: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    collectionIds: v.optional(v.array(v.id("collections"))),
    tagNames: v.optional(v.array(v.string())),
    note: v.optional(v.string()),
    // Observability: track which client app made the request
    clientSource: v.optional(clientSourceValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getOrCreateUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Failed to create space");
    }

    // Initialize wide event for observability (trace_id will be set to saveId after insert)
    const event = createWideEvent("saves.create", "mutation", {
      userId: user.userId,
      spaceId: space._id,
      clientSource: args.clientSource as ClientSource | undefined,
    });

    try {
      // Normalize URL for duplicate detection
      const normalizedUrl = normalizeUrl(args.url);
      const urlDomain = extractDomain(args.url);

      // Check for existing duplicate
      if (normalizedUrl) {
        const existing = await ctx.db
          .query("saves")
          .withIndex("by_spaceId_normalizedUrl", (q) =>
            q.eq("spaceId", space._id).eq("normalizedUrl", normalizedUrl)
          )
          .first();

        if (existing) {
          event.error(new ConvexError({ code: "CONFLICT", message: "Duplicate URL" }), {
            url_domain: urlDomain,
            existing_save_id: existing._id,
          });
          throw new ConvexError({
            code: "CONFLICT",
            message: "You already have this link saved",
            existingSave: {
              id: existing._id,
              url: existing.url,
              title: existing.title,
              imageUrl: existing.imageUrl,
              siteName: existing.siteName,
              savedAt: existing.savedAt,
            },
          });
        }
      }

      // Create the save
      const saveId = await ctx.db.insert("saves", {
        spaceId: space._id,
        url: args.url,
        normalizedUrl: normalizedUrl ?? undefined,
        title: args.title,
        note: args.note, // User's personal notes (stored separately from description)
        visibility: args.visibility ?? space.defaultSaveVisibility,
        isArchived: false,
        isFavorite: false,
        createdBy: user.userId,
        savedAt: Date.now(),
      });

      // Handle tags
      const tagDocs: Array<{ _id: string; name: string }> = [];
      if (args.tagNames && args.tagNames.length > 0) {
        const normalizedNames = [...new Set(args.tagNames.map((n) => n.toLowerCase().trim()))];

        for (const name of normalizedNames) {
          // Find or create tag
          let tag = await ctx.db
            .query("tags")
            .withIndex("by_spaceId_name", (q) => q.eq("spaceId", space._id).eq("name", name))
            .first();

          if (!tag) {
            const tagId = await ctx.db.insert("tags", {
              spaceId: space._id,
              name,
            });
            tag = await ctx.db.get(tagId);
          }

          if (tag) {
            await ctx.db.insert("saveTags", { saveId, tagId: tag._id });
            tagDocs.push({ _id: tag._id, name: tag.name });
          }
        }
      }

      // Handle collections
      const collectionDocs: Array<{ _id: string; name: string; visibility: string }> = [];
      if (args.collectionIds && args.collectionIds.length > 0) {
        for (const collectionId of args.collectionIds) {
          const collection = await ctx.db.get(collectionId);
          if (collection && collection.spaceId === space._id) {
            await ctx.db.insert("saveCollections", { saveId, collectionId });
            collectionDocs.push({
              _id: collection._id,
              name: collection.name,
              visibility: collection.visibility,
            });

            // Apply default tags from collection
            const defaultTags = await ctx.db
              .query("collectionDefaultTags")
              .withIndex("by_collectionId", (q) => q.eq("collectionId", collectionId))
              .collect();

            for (const dt of defaultTags) {
              // Check if tag already linked
              const existing = await ctx.db
                .query("saveTags")
                .withIndex("by_saveId_tagId", (q) => q.eq("saveId", saveId).eq("tagId", dt.tagId))
                .first();

              if (!existing) {
                await ctx.db.insert("saveTags", { saveId, tagId: dt.tagId });
                const tag = await ctx.db.get(dt.tagId);
                if (tag && !tagDocs.find((t) => t._id === tag._id)) {
                  tagDocs.push({ _id: tag._id, name: tag.name });
                }
              }
            }
          }
        }
      }

      const save = await ctx.db.get(saveId);

      // Trigger snapshot processing for the new save
      // Pass saveId as traceId for correlation
      await ctx.scheduler.runAfter(0, internal.snapshots.createSnapshotRecord, {
        saveId,
        spaceId: space._id,
        url: args.url,
        traceId: saveId, // Use saveId as trace_id for correlation
      });

      // Log success with business context
      event.success({
        url_domain: urlDomain,
        visibility: args.visibility ?? space.defaultSaveVisibility,
        collection_count: collectionDocs.length,
        tag_count: tagDocs.length,
        triggered_snapshot: true,
        save_id: saveId,
      });

      return {
        id: saveId,
        spaceId: space._id,
        url: args.url,
        title: args.title ?? null,
        description: null, // OG/meta description (populated by snapshot extraction)
        note: args.note ?? null, // User's personal notes
        siteName: null,
        imageUrl: null,
        contentType: null,
        visibility: args.visibility ?? space.defaultSaveVisibility,
        isArchived: false,
        isFavorite: false,
        createdBy: user.userId,
        savedAt: save!.savedAt,
        createdAt: save!._creationTime,
        updatedAt: save!._creationTime,
        tags: tagDocs.map((t) => ({
          id: t._id,
          spaceId: space._id,
          name: t.name,
          createdAt: save!._creationTime,
          updatedAt: save!._creationTime,
        })),
        collections: collectionDocs.map((c) => ({
          id: c._id,
          spaceId: space._id,
          name: c.name,
          visibility: c.visibility,
          createdAt: save!._creationTime,
          updatedAt: save!._creationTime,
        })),
      };
    } catch (err) {
      // Only log if not already logged (duplicate check logs its own error)
      if (!(err instanceof ConvexError && (err.data as { code?: string })?.code === "CONFLICT")) {
        event.error(err, { url_domain: extractDomain(args.url) });
      }
      throw err;
    }
  },
});

// Update a save
export const update = mutation({
  args: {
    id: v.id("saves"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    note: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    siteName: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    collectionIds: v.optional(v.array(v.id("collections"))),
    tagNames: v.optional(v.array(v.string())),
    clientSource: v.optional(clientSourceValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const event = createWideEvent("saves.update", "mutation", {
      userId: user.userId,
      spaceId: space._id,
      clientSource: args.clientSource as ClientSource | undefined,
    });

    try {
      const save = await ctx.db.get(args.id);
      if (!save || save.spaceId !== space._id) {
        event.error(new ConvexError("Save not found"), { save_id: args.id });
        throw new ConvexError("Save not found");
      }

      // Track which fields are being updated
      const fieldsUpdated: string[] = [];

      // Update basic fields
      const updates: Partial<typeof save> = {};
      if (args.title !== undefined) {
        updates.title = args.title;
        fieldsUpdated.push("title");
      }
      if (args.description !== undefined) {
        updates.description = args.description;
        fieldsUpdated.push("description");
      }
      if (args.note !== undefined) {
        updates.note = args.note;
        fieldsUpdated.push("note");
      }
      if (args.imageUrl !== undefined) {
        updates.imageUrl = args.imageUrl;
        fieldsUpdated.push("imageUrl");
      }
      if (args.siteName !== undefined) {
        updates.siteName = args.siteName;
        fieldsUpdated.push("siteName");
      }
      if (args.visibility !== undefined) {
        updates.visibility = args.visibility;
        fieldsUpdated.push("visibility");
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(args.id, updates);
      }

      // Update tags if provided
      if (args.tagNames !== undefined) {
        fieldsUpdated.push("tags");
        // Remove existing tags
        const existingTags = await ctx.db
          .query("saveTags")
          .withIndex("by_saveId", (q) => q.eq("saveId", args.id))
          .collect();
        for (const st of existingTags) {
          await ctx.db.delete(st._id);
        }

        // Add new tags
        if (args.tagNames.length > 0) {
          const normalizedNames = [...new Set(args.tagNames.map((n) => n.toLowerCase().trim()))];

          for (const name of normalizedNames) {
            let tag = await ctx.db
              .query("tags")
              .withIndex("by_spaceId_name", (q) => q.eq("spaceId", space._id).eq("name", name))
              .first();

            if (!tag) {
              const tagId = await ctx.db.insert("tags", { spaceId: space._id, name });
              tag = await ctx.db.get(tagId);
            }

            if (tag) {
              await ctx.db.insert("saveTags", { saveId: args.id, tagId: tag._id });
            }
          }
        }
      }

      // Update collections if provided
      if (args.collectionIds !== undefined) {
        fieldsUpdated.push("collections");
        // Remove existing collections
        const existingCollections = await ctx.db
          .query("saveCollections")
          .withIndex("by_saveId", (q) => q.eq("saveId", args.id))
          .collect();
        for (const sc of existingCollections) {
          await ctx.db.delete(sc._id);
        }

        // Add new collections
        for (const collectionId of args.collectionIds) {
          const collection = await ctx.db.get(collectionId);
          if (collection && collection.spaceId === space._id) {
            await ctx.db.insert("saveCollections", { saveId: args.id, collectionId });
          }
        }
      }

      event.success({
        save_id: args.id,
        url_domain: extractDomain(save.url),
        fields_updated: fieldsUpdated,
        field_count: fieldsUpdated.length,
      });

      // Return updated save
      return await getSaveById(ctx, space._id, args.id);
    } catch (err) {
      if (!(err instanceof ConvexError && err.message === "Save not found")) {
        event.error(err, { save_id: args.id });
      }
      throw err;
    }
  },
});

// Toggle favorite
export const toggleFavorite = mutation({
  args: {
    saveId: v.id("saves"),
    value: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== space._id) {
      throw new ConvexError("Save not found");
    }

    const newValue = args.value !== undefined ? args.value : !save.isFavorite;
    await ctx.db.patch(args.saveId, { isFavorite: newValue });

    return { id: args.saveId, isFavorite: newValue };
  },
});

// Toggle archive
export const toggleArchive = mutation({
  args: {
    saveId: v.id("saves"),
    value: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== space._id) {
      throw new ConvexError("Save not found");
    }

    const newValue = args.value !== undefined ? args.value : !save.isArchived;
    await ctx.db.patch(args.saveId, { isArchived: newValue });

    return { id: args.saveId, isArchived: newValue };
  },
});

// Delete a save
export const remove = mutation({
  args: {
    saveId: v.id("saves"),
    clientSource: v.optional(clientSourceValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const event = createWideEvent("saves.remove", "mutation", {
      userId: user.userId,
      spaceId: space._id,
      clientSource: args.clientSource as ClientSource | undefined,
    });

    try {
      const save = await ctx.db.get(args.saveId);
      if (!save || save.spaceId !== space._id) {
        event.error(new ConvexError("Save not found"), { save_id: args.saveId });
        throw new ConvexError("Save not found");
      }

      const urlDomain = extractDomain(save.url);

      // Delete related junction entries
      const [saveTags, saveCollections] = await Promise.all([
        ctx.db
          .query("saveTags")
          .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
          .collect(),
        ctx.db
          .query("saveCollections")
          .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
          .collect(),
      ]);

      for (const st of saveTags) {
        await ctx.db.delete(st._id);
      }
      for (const sc of saveCollections) {
        await ctx.db.delete(sc._id);
      }

      // Delete snapshot if exists
      const snapshot = await ctx.db
        .query("saveSnapshots")
        .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
        .first();
      if (snapshot) {
        await ctx.db.delete(snapshot._id);
      }

      // Delete the save
      await ctx.db.delete(args.saveId);

      event.success({
        save_id: args.saveId,
        url_domain: urlDomain,
        had_snapshot: !!snapshot,
        tag_count: saveTags.length,
        collection_count: saveCollections.length,
      });

      return { success: true, id: args.saveId };
    } catch (err) {
      if (!(err instanceof ConvexError && err.message === "Save not found")) {
        event.error(err, { save_id: args.saveId });
      }
      throw err;
    }
  },
});

// Bulk delete saves
export const bulkDelete = mutation({
  args: {
    saveIds: v.array(v.id("saves")),
    clientSource: v.optional(clientSourceValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const event = createWideEvent("saves.bulkDelete", "mutation", {
      userId: user.userId,
      spaceId: space._id,
      clientSource: args.clientSource as ClientSource | undefined,
    });

    try {
      let deletedCount = 0;
      let snapshotsDeleted = 0;

      for (const saveId of args.saveIds) {
        const save = await ctx.db.get(saveId);
        if (save && save.spaceId === space._id) {
          // Delete related junction entries
          const [saveTags, saveCollections] = await Promise.all([
            ctx.db
              .query("saveTags")
              .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
              .collect(),
            ctx.db
              .query("saveCollections")
              .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
              .collect(),
          ]);

          for (const st of saveTags) {
            await ctx.db.delete(st._id);
          }
          for (const sc of saveCollections) {
            await ctx.db.delete(sc._id);
          }

          // Delete snapshot if exists
          const snapshot = await ctx.db
            .query("saveSnapshots")
            .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
            .first();
          if (snapshot) {
            await ctx.db.delete(snapshot._id);
            snapshotsDeleted++;
          }

          await ctx.db.delete(saveId);
          deletedCount++;
        }
      }

      event.success({
        requested_count: args.saveIds.length,
        deleted_count: deletedCount,
        snapshots_deleted: snapshotsDeleted,
      });

      return { success: true, deletedCount };
    } catch (err) {
      event.error(err, { requested_count: args.saveIds.length });
      throw err;
    }
  },
});

// Internal mutation to update save metadata from snapshot processing
// Called after successful snapshot extraction to backfill title, description, siteName, imageUrl
export const updateSaveMetadata = internalMutation({
  args: {
    saveId: v.id("saves"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    siteName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const save = await ctx.db.get(args.saveId);
    if (!save) return;

    // Only update fields that are currently empty and have new values
    const updates: Record<string, string> = {};

    if (!save.title && args.title) {
      updates.title = args.title;
    }
    if (!save.description && args.description) {
      updates.description = args.description;
    }
    if (!save.siteName && args.siteName) {
      updates.siteName = args.siteName;
    }
    if (!save.imageUrl && args.imageUrl) {
      updates.imageUrl = args.imageUrl;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.saveId, updates);
    }
  },
});
