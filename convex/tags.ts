import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getOrCreateUserSpace, getUserSpace, requireAuth } from "./lib/auth";

// List all tags for the user's space
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) return [];

    const tags = await ctx.db
      .query("tags")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
      .collect();

    // Get save counts for each tag
    const tagsWithCounts = await Promise.all(
      tags.map(async (tag) => {
        const saveTags = await ctx.db
          .query("saveTags")
          .withIndex("by_tagId", (q) => q.eq("tagId", tag._id))
          .collect();

        return {
          id: tag._id,
          spaceId: tag.spaceId,
          name: tag.name,
          createdAt: tag._creationTime,
          updatedAt: tag._creationTime,
          _count: {
            saves: saveTags.length,
          },
        };
      })
    );

    // Sort by name
    return tagsWithCounts.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Create a new tag
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getOrCreateUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Failed to create space");
    }

    const normalizedName = args.name.toLowerCase().trim();

    // Check for existing tag
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_spaceId_name", (q) => q.eq("spaceId", space._id).eq("name", normalizedName))
      .first();

    if (existing) {
      throw new ConvexError("Tag already exists");
    }

    const tagId = await ctx.db.insert("tags", {
      spaceId: space._id,
      name: normalizedName,
    });

    const tag = await ctx.db.get(tagId);

    return {
      id: tagId,
      spaceId: space._id,
      name: normalizedName,
      createdAt: tag!._creationTime,
      updatedAt: tag!._creationTime,
      _count: { saves: 0 },
    };
  },
});

// Update a tag
export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.spaceId !== space._id) {
      throw new ConvexError("Tag not found");
    }

    const normalizedName = args.name.toLowerCase().trim();

    // Check for duplicate name
    const existing = await ctx.db
      .query("tags")
      .withIndex("by_spaceId_name", (q) => q.eq("spaceId", space._id).eq("name", normalizedName))
      .first();

    if (existing && existing._id !== args.id) {
      throw new ConvexError("Tag with this name already exists");
    }

    await ctx.db.patch(args.id, { name: normalizedName });

    return {
      id: args.id,
      spaceId: space._id,
      name: normalizedName,
      createdAt: tag._creationTime,
      updatedAt: Date.now(),
    };
  },
});

// Delete a tag
export const remove = mutation({
  args: { tagId: v.id("tags") },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const tag = await ctx.db.get(args.tagId);
    if (!tag || tag.spaceId !== space._id) {
      throw new ConvexError("Tag not found");
    }

    // Delete all save-tag associations
    const saveTags = await ctx.db
      .query("saveTags")
      .withIndex("by_tagId", (q) => q.eq("tagId", args.tagId))
      .collect();

    for (const st of saveTags) {
      await ctx.db.delete(st._id);
    }

    // Delete all collection-default-tag associations
    const defaultTags = await ctx.db
      .query("collectionDefaultTags")
      .withIndex("by_tagId", (q) => q.eq("tagId", args.tagId))
      .collect();

    for (const dt of defaultTags) {
      await ctx.db.delete(dt._id);
    }

    // Delete the tag
    await ctx.db.delete(args.tagId);

    return { success: true, id: args.tagId };
  },
});
