import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrCreateUserSpace, getUserSpace, requireAuth } from "./lib/auth";
import { visibilityValidator } from "./schema";

// List all collections for the user's space
export const list = query({
  args: {
    query: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    defaultTagId: v.optional(v.id("tags")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) return [];

    let collections = await ctx.db
      .query("collections")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
      .collect();

    // Apply filters
    if (args.visibility) {
      collections = collections.filter((c) => c.visibility === args.visibility);
    }

    if (args.query) {
      const q = args.query.toLowerCase();
      collections = collections.filter((c) => c.name.toLowerCase().includes(q));
    }

    if (args.defaultTagId) {
      const defaultTagLinks = await ctx.db
        .query("collectionDefaultTags")
        .withIndex("by_tagId", (q) => q.eq("tagId", args.defaultTagId!))
        .collect();
      const collectionIds = new Set(defaultTagLinks.map((l) => l.collectionId));
      collections = collections.filter((c) => collectionIds.has(c._id));
    }

    // Get save counts and default tags for each collection
    const collectionsWithDetails = await Promise.all(
      collections.map(async (collection) => {
        const [saveCollections, defaultTagLinks] = await Promise.all([
          ctx.db
            .query("saveCollections")
            .withIndex("by_collectionId", (q) => q.eq("collectionId", collection._id))
            .collect(),
          ctx.db
            .query("collectionDefaultTags")
            .withIndex("by_collectionId", (q) => q.eq("collectionId", collection._id))
            .collect(),
        ]);

        const defaultTags = await Promise.all(
          defaultTagLinks.map(async (link) => {
            const tag = await ctx.db.get(link.tagId);
            return tag
              ? {
                  id: tag._id,
                  spaceId: tag.spaceId,
                  name: tag.name,
                  createdAt: tag._creationTime,
                  updatedAt: tag._creationTime,
                }
              : null;
          })
        );

        return {
          id: collection._id,
          spaceId: collection.spaceId,
          name: collection.name,
          visibility: collection.visibility,
          createdAt: collection._creationTime,
          updatedAt: collection._creationTime,
          defaultTags: defaultTags.filter(Boolean),
          _count: {
            saves: saveCollections.length,
          },
        };
      })
    );

    // Sort by name
    return collectionsWithDetails.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Get a single collection
export const get = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) return null;

    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.spaceId !== space._id) return null;

    const [saveCollections, defaultTagLinks] = await Promise.all([
      ctx.db
        .query("saveCollections")
        .withIndex("by_collectionId", (q) => q.eq("collectionId", collection._id))
        .collect(),
      ctx.db
        .query("collectionDefaultTags")
        .withIndex("by_collectionId", (q) => q.eq("collectionId", collection._id))
        .collect(),
    ]);

    const defaultTags = await Promise.all(
      defaultTagLinks.map(async (link) => {
        const tag = await ctx.db.get(link.tagId);
        return tag
          ? {
              id: tag._id,
              spaceId: tag.spaceId,
              name: tag.name,
              createdAt: tag._creationTime,
              updatedAt: tag._creationTime,
            }
          : null;
      })
    );

    return {
      id: collection._id,
      spaceId: collection.spaceId,
      name: collection.name,
      visibility: collection.visibility,
      createdAt: collection._creationTime,
      updatedAt: collection._creationTime,
      defaultTags: defaultTags.filter(Boolean),
      _count: {
        saves: saveCollections.length,
      },
    };
  },
});

// Create a new collection
export const create = mutation({
  args: {
    name: v.string(),
    visibility: v.optional(visibilityValidator),
    defaultTagNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getOrCreateUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Failed to create space");
    }

    const collectionId = await ctx.db.insert("collections", {
      spaceId: space._id,
      name: args.name,
      visibility: args.visibility ?? "private",
    });

    // Handle default tags
    const defaultTags: Array<{ id: string; spaceId: string; name: string; createdAt: number; updatedAt: number }> = [];
    if (args.defaultTagNames && args.defaultTagNames.length > 0) {
      const normalizedNames = [...new Set(args.defaultTagNames.map((n) => n.toLowerCase().trim()))];

      for (const name of normalizedNames) {
        // Find or create tag
        let tag = await ctx.db
          .query("tags")
          .withIndex("by_spaceId_name", (q) => q.eq("spaceId", space._id).eq("name", name))
          .first();

        if (!tag) {
          const tagId = await ctx.db.insert("tags", { spaceId: space._id, name });
          tag = await ctx.db.get(tagId);
        }

        if (tag) {
          await ctx.db.insert("collectionDefaultTags", { collectionId, tagId: tag._id });
          defaultTags.push({
            id: tag._id,
            spaceId: tag.spaceId,
            name: tag.name,
            createdAt: tag._creationTime,
            updatedAt: tag._creationTime,
          });
        }
      }
    }

    const collection = await ctx.db.get(collectionId);

    return {
      id: collectionId,
      spaceId: space._id,
      name: args.name,
      visibility: args.visibility ?? "private",
      createdAt: collection!._creationTime,
      updatedAt: collection!._creationTime,
      defaultTags,
      _count: { saves: 0 },
    };
  },
});

// Update a collection
export const update = mutation({
  args: {
    id: v.id("collections"),
    name: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    defaultTagNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const collection = await ctx.db.get(args.id);
    if (!collection || collection.spaceId !== space._id) {
      throw new ConvexError("Collection not found");
    }

    // Update basic fields
    const updates: Partial<{ name: string; visibility: "public" | "private" }> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.visibility !== undefined) updates.visibility = args.visibility;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);
    }

    // Handle default tags
    let defaultTags: Array<{ id: string; spaceId: string; name: string; createdAt: number; updatedAt: number }> = [];
    if (args.defaultTagNames !== undefined) {
      // Remove existing default tags
      const existingLinks = await ctx.db
        .query("collectionDefaultTags")
        .withIndex("by_collectionId", (q) => q.eq("collectionId", args.id))
        .collect();

      for (const link of existingLinks) {
        await ctx.db.delete(link._id);
      }

      // Add new default tags
      if (args.defaultTagNames.length > 0) {
        const normalizedNames = [...new Set(args.defaultTagNames.map((n) => n.toLowerCase().trim()))];

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
            await ctx.db.insert("collectionDefaultTags", { collectionId: args.id, tagId: tag._id });
            defaultTags.push({
              id: tag._id,
              spaceId: tag.spaceId,
              name: tag.name,
              createdAt: tag._creationTime,
              updatedAt: tag._creationTime,
            });
          }
        }
      }
    } else {
      // Fetch existing default tags
      const existingLinks = await ctx.db
        .query("collectionDefaultTags")
        .withIndex("by_collectionId", (q) => q.eq("collectionId", args.id))
        .collect();

      const tags = await Promise.all(existingLinks.map((link) => ctx.db.get(link.tagId)));
      defaultTags = tags
        .filter(Boolean)
        .map((tag) => ({
          id: tag!._id,
          spaceId: tag!.spaceId,
          name: tag!.name,
          createdAt: tag!._creationTime,
          updatedAt: tag!._creationTime,
        }));
    }

    return {
      id: args.id,
      spaceId: space._id,
      name: args.name ?? collection.name,
      visibility: args.visibility ?? collection.visibility,
      createdAt: collection._creationTime,
      updatedAt: Date.now(),
      defaultTags,
    };
  },
});

// Delete a collection
export const remove = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.spaceId !== space._id) {
      throw new ConvexError("Collection not found");
    }

    // Delete all save-collection associations
    const saveCollections = await ctx.db
      .query("saveCollections")
      .withIndex("by_collectionId", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    for (const sc of saveCollections) {
      await ctx.db.delete(sc._id);
    }

    // Delete all collection-default-tag associations
    const defaultTags = await ctx.db
      .query("collectionDefaultTags")
      .withIndex("by_collectionId", (q) => q.eq("collectionId", args.collectionId))
      .collect();

    for (const dt of defaultTags) {
      await ctx.db.delete(dt._id);
    }

    // Delete the collection
    await ctx.db.delete(args.collectionId);

    return { success: true, id: args.collectionId };
  },
});
