import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrCreateUserSpace, getUserSpace, requireAuth } from "./lib/auth";
import { normalizeUrl } from "./lib/validators";
import { visibilityValidator } from "./schema";

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
        const matchesUrl = save.url.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesUrl) {
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
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getOrCreateUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Failed to create space");
    }

    // Normalize URL for duplicate detection
    const normalizedUrl = normalizeUrl(args.url);

    // Check for existing duplicate
    if (normalizedUrl) {
      const existing = await ctx.db
        .query("saves")
        .withIndex("by_spaceId_normalizedUrl", (q) =>
          q.eq("spaceId", space._id).eq("normalizedUrl", normalizedUrl)
        )
        .first();

      if (existing) {
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
      description: args.note,
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

    return {
      id: saveId,
      spaceId: space._id,
      url: args.url,
      title: args.title ?? null,
      description: args.note ?? null,
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
  },
});

// Update a save
export const update = mutation({
  args: {
    id: v.id("saves"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    collectionIds: v.optional(v.array(v.id("collections"))),
    tagNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const save = await ctx.db.get(args.id);
    if (!save || save.spaceId !== space._id) {
      throw new ConvexError("Save not found");
    }

    // Update basic fields
    const updates: Partial<typeof save> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.visibility !== undefined) updates.visibility = args.visibility;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }

    // Update tags if provided
    if (args.tagNames !== undefined) {
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

    // Return updated save
    return await get(ctx, { saveId: args.id });
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
  args: { saveId: v.id("saves") },
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

    return { success: true, id: args.saveId };
  },
});

// Bulk delete saves
export const bulkDelete = mutation({
  args: { saveIds: v.array(v.id("saves")) },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    let deletedCount = 0;
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
        }

        await ctx.db.delete(saveId);
        deletedCount++;
      }
    }

    return { success: true, deletedCount };
  },
});
