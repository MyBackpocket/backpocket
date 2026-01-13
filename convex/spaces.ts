import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, getOrCreateUserSpace, getUserSpace, requireAuth } from "./lib/auth";
import { isValidSlug, RESERVED_SLUGS } from "./lib/validators";
import { publicLayoutValidator, visibilityValidator } from "./schema";

// Get the user's space
export const getMySpace = query({
  args: {},
  handler: async (ctx) => {
    // Use getCurrentUser instead of requireAuth to gracefully handle
    // the race condition on page reload where auth may not be synced yet
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const space = await getUserSpace(ctx, user.userId);

    if (!space) {
      return null;
    }

    return {
      id: space._id,
      type: space.type,
      slug: space.slug,
      name: space.name,
      bio: space.bio ?? null,
      avatarUrl: space.avatarUrl ?? null,
      visibility: space.visibility,
      publicLayout: space.publicLayout,
      defaultSaveVisibility: space.defaultSaveVisibility,
      createdAt: space._creationTime,
      updatedAt: space._creationTime,
    };
  },
});

// Ensure user has a space (creates if needed)
export const ensureSpace = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const space = await getOrCreateUserSpace(ctx, user.userId);

    if (!space) {
      throw new ConvexError("Failed to create space");
    }

    return {
      id: space._id,
      type: space.type,
      slug: space.slug,
      name: space.name,
      bio: space.bio ?? null,
      avatarUrl: space.avatarUrl ?? null,
      visibility: space.visibility,
      publicLayout: space.publicLayout,
      defaultSaveVisibility: space.defaultSaveVisibility,
      createdAt: space._creationTime,
      updatedAt: space._creationTime,
    };
  },
});

// Update space settings
export const updateSettings = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    publicLayout: v.optional(publicLayoutValidator),
    defaultSaveVisibility: v.optional(visibilityValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const updates: Partial<{
      name: string;
      bio: string;
      avatarUrl: string;
      visibility: "public" | "private";
      publicLayout: "list" | "grid";
      defaultSaveVisibility: "public" | "private";
    }> = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    if (args.publicLayout !== undefined) updates.publicLayout = args.publicLayout;
    if (args.defaultSaveVisibility !== undefined) updates.defaultSaveVisibility = args.defaultSaveVisibility;

    await ctx.db.patch(space._id, updates);

    const updated = await ctx.db.get(space._id);

    return {
      id: updated!._id,
      type: updated!.type,
      slug: updated!.slug,
      name: updated!.name,
      bio: updated!.bio ?? null,
      avatarUrl: updated!.avatarUrl ?? null,
      visibility: updated!.visibility,
      publicLayout: updated!.publicLayout,
      defaultSaveVisibility: updated!.defaultSaveVisibility,
      createdAt: updated!._creationTime,
      updatedAt: Date.now(),
    };
  },
});

// Update space slug
export const updateSlug = mutation({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const slug = args.slug.toLowerCase();

    // Validate format
    if (!isValidSlug(slug)) {
      throw new ConvexError(
        "Slug must be 3-32 characters, lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen."
      );
    }

    // Check reserved slugs
    if (RESERVED_SLUGS.includes(slug)) {
      throw new ConvexError("This subdomain is reserved and cannot be used");
    }

    // Check for existing slug
    const existing = await ctx.db
      .query("spaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing && existing._id !== space._id) {
      throw new ConvexError("This subdomain is already taken");
    }

    await ctx.db.patch(space._id, { slug });

    const updated = await ctx.db.get(space._id);

    return {
      id: updated!._id,
      type: updated!.type,
      slug: updated!.slug,
      name: updated!.name,
      bio: updated!.bio ?? null,
      avatarUrl: updated!.avatarUrl ?? null,
      visibility: updated!.visibility,
      publicLayout: updated!.publicLayout,
      defaultSaveVisibility: updated!.defaultSaveVisibility,
      createdAt: updated!._creationTime,
      updatedAt: Date.now(),
    };
  },
});

// Check if a slug is available
export const checkSlugAvailability = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    const slug = args.slug.toLowerCase();

    // Check reserved
    if (RESERVED_SLUGS.includes(slug)) {
      return { available: false, reason: "reserved" as const };
    }

    // Validate format
    if (slug.length < 3) {
      return { available: false, reason: "too_short" as const };
    }
    if (slug.length > 32) {
      return { available: false, reason: "too_long" as const };
    }
    if (!isValidSlug(slug)) {
      return { available: false, reason: "invalid_format" as const };
    }

    // Check if taken by another space
    const existing = await ctx.db
      .query("spaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing && (!space || existing._id !== space._id)) {
      return { available: false, reason: "taken" as const };
    }

    return { available: true, reason: null };
  },
});

// Get space stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      return {
        totalSaves: 0,
        favoriteSaves: 0,
        publicSaves: 0,
        archivedSaves: 0,
        totalTags: 0,
        totalCollections: 0,
      };
    }

    const [saves, tags, collections] = await Promise.all([
      ctx.db
        .query("saves")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .collect(),
      ctx.db
        .query("tags")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .collect(),
      ctx.db
        .query("collections")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .collect(),
    ]);

    return {
      totalSaves: saves.length,
      favoriteSaves: saves.filter((s) => s.isFavorite).length,
      publicSaves: saves.filter((s) => s.visibility === "public").length,
      archivedSaves: saves.filter((s) => s.isArchived).length,
      totalTags: tags.length,
      totalCollections: collections.length,
    };
  },
});
