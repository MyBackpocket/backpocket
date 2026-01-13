import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const PUBLIC_LIST_MIN_LIMIT = 5;
const PUBLIC_LIST_MAX_LIMIT = 100;
const PUBLIC_LIST_DEFAULT_LIMIT = 20;

// Resolve a space by slug (for public pages)
export const resolveSpaceBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const space = await ctx.db
      .query("spaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!space || space.visibility !== "public") {
      return null;
    }

    // Get visit count
    const visitCount = await ctx.db
      .query("visitCounts")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
      .first();

    return {
      id: space._id,
      slug: space.slug,
      name: space.name,
      bio: space.bio ?? null,
      avatarUrl: space.avatarUrl ?? null,
      publicLayout: space.publicLayout,
      visitCount: visitCount?.count ?? 0,
    };
  },
});

// Resolve space by custom domain
export const resolveSpaceByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const domainMapping = await ctx.db
      .query("domainMappings")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();

    if (!domainMapping || domainMapping.status !== "active") {
      return null;
    }

    const space = await ctx.db.get(domainMapping.spaceId);
    if (!space || space.visibility !== "public") {
      return null;
    }

    const visitCount = await ctx.db
      .query("visitCounts")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
      .first();

    return {
      id: space._id,
      slug: space.slug,
      name: space.name,
      bio: space.bio ?? null,
      avatarUrl: space.avatarUrl ?? null,
      publicLayout: space.publicLayout,
      visitCount: visitCount?.count ?? 0,
    };
  },
});

// List public saves for a space
export const listPublicSaves = query({
  args: {
    spaceId: v.id("spaces"),
    query: v.optional(v.string()),
    tagName: v.optional(v.string()),
    collectionId: v.optional(v.id("collections")),
    cursor: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(
      Math.max(args.limit ?? PUBLIC_LIST_DEFAULT_LIMIT, PUBLIC_LIST_MIN_LIMIT),
      PUBLIC_LIST_MAX_LIMIT
    );

    // Get filtered save IDs if filtering by tag or collection
    let filteredSaveIds: Set<string> | null = null;

    if (args.tagName) {
      // Find the tag by name
      const tag = await ctx.db
        .query("tags")
        .withIndex("by_spaceId_name", (q) =>
          q.eq("spaceId", args.spaceId).eq("name", args.tagName!.toLowerCase())
        )
        .first();

      if (!tag) {
        return { items: [], nextCursor: null };
      }

      const saveTags = await ctx.db
        .query("saveTags")
        .withIndex("by_tagId", (q) => q.eq("tagId", tag._id))
        .collect();

      filteredSaveIds = new Set(saveTags.map((st) => st.saveId));
    } else if (args.collectionId) {
      const saveCollections = await ctx.db
        .query("saveCollections")
        .withIndex("by_collectionId", (q) => q.eq("collectionId", args.collectionId!))
        .collect();

      filteredSaveIds = new Set(saveCollections.map((sc) => sc.saveId));
    }

    // Query saves
    let savesQuery = ctx.db
      .query("saves")
      .withIndex("by_spaceId_visibility_savedAt", (q) =>
        q.eq("spaceId", args.spaceId).eq("visibility", "public")
      )
      .order("desc");

    if (args.cursor) {
      savesQuery = savesQuery.filter((q) => q.lt(q.field("savedAt"), args.cursor!));
    }

    const allSaves = await savesQuery.take(limit * 3);

    let saves = allSaves.filter((save) => {
      // Filter out archived
      if (save.isArchived) return false;

      // Filter by junction table results
      if (filteredSaveIds && !filteredSaveIds.has(save._id)) {
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

    const hasMore = saves.length > limit;
    saves = saves.slice(0, limit);

    // Get tags for all saves
    const saveTags = await Promise.all(
      saves.map((save) =>
        ctx.db
          .query("saveTags")
          .withIndex("by_saveId", (q) => q.eq("saveId", save._id))
          .collect()
      )
    );

    const allTagIds = [...new Set(saveTags.flat().map((st) => st.tagId))];
    const tags = await Promise.all(allTagIds.map((id) => ctx.db.get(id)));
    const tagsMap = new Map(tags.filter(Boolean).map((t) => [t!._id, t!]));

    const items = saves.map((save, idx) => {
      const tagNames = saveTags[idx]
        .map((st) => tagsMap.get(st.tagId)?.name)
        .filter(Boolean) as string[];

      return {
        id: save._id,
        url: save.url,
        title: save.title ?? null,
        description: save.description ?? null,
        note: save.note ?? null,
        siteName: save.siteName ?? null,
        imageUrl: save.imageUrl ?? null,
        savedAt: save.savedAt,
        tags: tagNames.length > 0 ? tagNames : undefined,
      };
    });

    const nextCursor = hasMore && saves.length > 0 ? saves[saves.length - 1].savedAt : null;

    return { items, nextCursor };
  },
});

// Get a single public save
export const getPublicSave = query({
  args: {
    spaceId: v.id("spaces"),
    saveId: v.id("saves"),
  },
  handler: async (ctx, args) => {
    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== args.spaceId || save.visibility !== "public") {
      return null;
    }

    // Get tags
    const saveTags = await ctx.db
      .query("saveTags")
      .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
      .collect();

    const tags = await Promise.all(saveTags.map((st) => ctx.db.get(st.tagId)));
    const tagNames = tags.filter(Boolean).map((t) => t!.name);

    return {
      id: save._id,
      url: save.url,
      title: save.title ?? null,
      description: save.description ?? null,
      note: save.note ?? null,
      siteName: save.siteName ?? null,
      imageUrl: save.imageUrl ?? null,
      savedAt: save.savedAt,
      tags: tagNames.length > 0 ? tagNames : undefined,
    };
  },
});

// List tags that have at least one public save
export const listPublicTags = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    // Get public, non-archived saves
    const publicSaves = await ctx.db
      .query("saves")
      .withIndex("by_spaceId_visibility", (q) => q.eq("spaceId", args.spaceId).eq("visibility", "public"))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    if (publicSaves.length === 0) {
      return [];
    }

    // Get tags for these saves
    const saveTags = await Promise.all(
      publicSaves.map((save) =>
        ctx.db
          .query("saveTags")
          .withIndex("by_saveId", (q) => q.eq("saveId", save._id))
          .collect()
      )
    );

    // Count by tag
    const countMap = new Map<string, { name: string; count: number }>();
    const allTagIds = [...new Set(saveTags.flat().map((st) => st.tagId))];
    const tags = await Promise.all(allTagIds.map((id) => ctx.db.get(id)));
    const tagsMap = new Map(tags.filter(Boolean).map((t) => [t!._id, t!]));

    for (const saveTagList of saveTags) {
      for (const st of saveTagList) {
        const tag = tagsMap.get(st.tagId);
        if (tag) {
          const existing = countMap.get(tag.name);
          if (existing) {
            existing.count++;
          } else {
            countMap.set(tag.name, { name: tag.name, count: 1 });
          }
        }
      }
    }

    // Sort by count, then alphabetically
    return Array.from(countMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  },
});

// List collections containing at least one public save
export const listPublicCollections = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    // Get public, non-archived saves
    const publicSaves = await ctx.db
      .query("saves")
      .withIndex("by_spaceId_visibility", (q) => q.eq("spaceId", args.spaceId).eq("visibility", "public"))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    if (publicSaves.length === 0) {
      return [];
    }

    // Get collections for these saves
    const saveCollections = await Promise.all(
      publicSaves.map((save) =>
        ctx.db
          .query("saveCollections")
          .withIndex("by_saveId", (q) => q.eq("saveId", save._id))
          .collect()
      )
    );

    // Count by collection
    const countMap = new Map<string, { id: string; name: string; count: number }>();
    const allCollectionIds = [...new Set(saveCollections.flat().map((sc) => sc.collectionId))];
    const collections = await Promise.all(allCollectionIds.map((id) => ctx.db.get(id)));
    const collectionsMap = new Map(collections.filter(Boolean).map((c) => [c!._id, c!]));

    for (const saveCollectionList of saveCollections) {
      for (const sc of saveCollectionList) {
        const collection = collectionsMap.get(sc.collectionId);
        if (collection) {
          const existing = countMap.get(collection._id);
          if (existing) {
            existing.count++;
          } else {
            countMap.set(collection._id, {
              id: collection._id,
              name: collection.name,
              count: 1,
            });
          }
        }
      }
    }

    // Sort by count, then alphabetically
    return Array.from(countMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
  },
});

// Register a visit (increment visit count)
export const registerVisit = mutation({
  args: {
    spaceId: v.id("spaces"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("visitCounts")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", args.spaceId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
      return { ok: true, visitCount: existing.count + 1 };
    } else {
      await ctx.db.insert("visitCounts", { spaceId: args.spaceId, count: 1 });
      return { ok: true, visitCount: 1 };
    }
  },
});

// Get visit count
export const getVisitCount = query({
  args: { spaceId: v.id("spaces") },
  handler: async (ctx, args) => {
    const visitCount = await ctx.db
      .query("visitCounts")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", args.spaceId))
      .first();

    return {
      total: visitCount?.count ?? 0,
      asOf: Date.now(),
    };
  },
});

// Get public save snapshot (reader mode content)
export const getPublicSaveSnapshot = query({
  args: {
    spaceId: v.id("spaces"),
    saveId: v.id("saves"),
    includeContent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify the save exists, is public, and belongs to the space
    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== args.spaceId || save.visibility !== "public") {
      return null;
    }

    // Get the snapshot
    const snapshot = await ctx.db
      .query("saveSnapshots")
      .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
      .first();

    if (!snapshot) {
      return null;
    }

    // Base snapshot metadata
    const snapshotData = {
      status: snapshot.status,
      blockedReason: snapshot.blockedReason ?? null,
      fetchedAt: snapshot.fetchedAt ?? null,
      title: snapshot.title ?? null,
      byline: snapshot.byline ?? null,
      excerpt: snapshot.excerpt ?? null,
      wordCount: snapshot.wordCount ?? null,
      language: snapshot.language ?? null,
    };

    // If not including content or no inline content available, return just metadata
    if (!args.includeContent || !snapshot.contentHtml) {
      return {
        snapshot: snapshotData,
        content: null,
      };
    }

    // Return inline content
    return {
      snapshot: snapshotData,
      content: {
        title: snapshot.title ?? "",
        byline: snapshot.byline ?? null,
        content: snapshot.contentHtml,
        textContent: snapshot.contentText ?? "",
        excerpt: snapshot.excerpt ?? "",
        siteName: snapshot.siteName ?? null,
        length: snapshot.wordCount ?? 0,
        language: snapshot.language ?? null,
      },
    };
  },
});
