import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";
import { getCurrentUser, getOrCreateUserSpace, getUserSpace, requireAuth } from "./lib/auth";
import { type ClientSource, createWideEvent } from "./lib/logger";
import { isValidSlug, RESERVED_SLUGS } from "./lib/validators";
import {
  addDomainToVercel,
  getDomainConfigFromVercel,
  removeDomainFromVercel,
  verifyDomainOnVercel,
} from "./lib/vercel";
import {
  clientSourceValidator,
  domainStatusValidator,
  publicLayoutValidator,
  themeValidator,
  visibilityValidator,
} from "./schema";

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
      theme: space.theme ?? null,
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
      theme: space.theme ?? null,
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
    theme: v.optional(themeValidator),
    clientSource: v.optional(clientSourceValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const event = createWideEvent("spaces.updateSettings", "mutation", {
      userId: user.userId,
      spaceId: space._id,
      clientSource: args.clientSource as ClientSource | undefined,
    });

    try {
      const fieldsUpdated: string[] = [];

      const updates: Partial<{
        name: string;
        bio: string;
        avatarUrl: string;
        visibility: "public" | "private";
        publicLayout: "list" | "grid";
        defaultSaveVisibility: "public" | "private";
        theme: "light" | "dark" | "system";
      }> = {};

      if (args.name !== undefined) {
        updates.name = args.name;
        fieldsUpdated.push("name");
      }
      if (args.bio !== undefined) {
        updates.bio = args.bio;
        fieldsUpdated.push("bio");
      }
      if (args.avatarUrl !== undefined) {
        updates.avatarUrl = args.avatarUrl;
        fieldsUpdated.push("avatarUrl");
      }
      if (args.visibility !== undefined) {
        updates.visibility = args.visibility;
        fieldsUpdated.push("visibility");
      }
      if (args.publicLayout !== undefined) {
        updates.publicLayout = args.publicLayout;
        fieldsUpdated.push("publicLayout");
      }
      if (args.defaultSaveVisibility !== undefined) {
        updates.defaultSaveVisibility = args.defaultSaveVisibility;
        fieldsUpdated.push("defaultSaveVisibility");
      }
      if (args.theme !== undefined) {
        updates.theme = args.theme;
        fieldsUpdated.push("theme");
      }

      await ctx.db.patch(space._id, updates);

      const updated = await ctx.db.get(space._id);

      event.success({
        fields_updated: fieldsUpdated,
        field_count: fieldsUpdated.length,
      });

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
        theme: updated!.theme ?? null,
        createdAt: updated!._creationTime,
        updatedAt: Date.now(),
      };
    } catch (err) {
      event.error(err);
      throw err;
    }
  },
});

// Update space slug
export const updateSlug = mutation({
  args: {
    slug: v.string(),
    clientSource: v.optional(clientSourceValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const event = createWideEvent("spaces.updateSlug", "mutation", {
      userId: user.userId,
      spaceId: space._id,
      clientSource: args.clientSource as ClientSource | undefined,
    });

    const slug = args.slug.toLowerCase();
    const oldSlug = space.slug;

    try {
      // Validate format
      if (!isValidSlug(slug)) {
        event.error(new ConvexError("Invalid slug format"), {
          old_slug: oldSlug,
          new_slug: slug,
          reason: "invalid_format",
        });
        throw new ConvexError(
          "Slug must be 3-32 characters, lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen."
        );
      }

      // Check reserved slugs
      if (RESERVED_SLUGS.includes(slug)) {
        event.error(new ConvexError("Reserved slug"), {
          old_slug: oldSlug,
          new_slug: slug,
          reason: "reserved",
        });
        throw new ConvexError("This subdomain is reserved and cannot be used");
      }

      // Check for existing slug
      const existing = await ctx.db
        .query("spaces")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existing && existing._id !== space._id) {
        event.error(new ConvexError("Slug taken"), {
          old_slug: oldSlug,
          new_slug: slug,
          reason: "taken",
        });
        throw new ConvexError("This subdomain is already taken");
      }

      await ctx.db.patch(space._id, { slug });

      const updated = await ctx.db.get(space._id);

      event.success({
        old_slug: oldSlug,
        new_slug: slug,
      });

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
        theme: updated!.theme ?? null,
        createdAt: updated!._creationTime,
        updatedAt: Date.now(),
      };
    } catch (err) {
      // Don't double-log errors we've already logged
      throw err;
    }
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

/**
 * Export all user data in a structured format.
 * Designed for data portability and backup purposes.
 */
export const exportAllData = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      return null;
    }

    // Fetch all data in parallel
    const [tags, collections, saves] = await Promise.all([
      ctx.db
        .query("tags")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .collect(),
      ctx.db
        .query("collections")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .collect(),
      ctx.db
        .query("saves")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .collect(),
    ]);

    // Fetch all junction table data in parallel
    const saveIds = saves.map((s) => s._id);
    const collectionIds = collections.map((c) => c._id);

    const [allSaveTags, allSaveCollections, allCollectionDefaultTags] = await Promise.all([
      // Get all save-tag relationships
      Promise.all(
        saveIds.map((saveId) =>
          ctx.db
            .query("saveTags")
            .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
            .collect()
        )
      ),
      // Get all save-collection relationships
      Promise.all(
        saveIds.map((saveId) =>
          ctx.db
            .query("saveCollections")
            .withIndex("by_saveId", (q) => q.eq("saveId", saveId))
            .collect()
        )
      ),
      // Get all collection default tags
      Promise.all(
        collectionIds.map((collectionId) =>
          ctx.db
            .query("collectionDefaultTags")
            .withIndex("by_collectionId", (q) => q.eq("collectionId", collectionId))
            .collect()
        )
      ),
    ]);

    // Build lookup maps for relationships
    const tagIdsBySaveId = new Map<string, string[]>();
    saveIds.forEach((saveId, idx) => {
      tagIdsBySaveId.set(
        saveId,
        allSaveTags[idx].map((st) => st.tagId)
      );
    });

    const collectionIdsBySaveId = new Map<string, string[]>();
    saveIds.forEach((saveId, idx) => {
      collectionIdsBySaveId.set(
        saveId,
        allSaveCollections[idx].map((sc) => sc.collectionId)
      );
    });

    const defaultTagIdsByCollectionId = new Map<string, string[]>();
    collectionIds.forEach((collectionId, idx) => {
      defaultTagIdsByCollectionId.set(
        collectionId,
        allCollectionDefaultTags[idx].map((cdt) => cdt.tagId)
      );
    });

    return {
      version: "1.0" as const,
      exportedAt: new Date().toISOString(),
      space: {
        id: space._id,
        slug: space.slug,
        name: space.name,
        bio: space.bio ?? null,
        visibility: space.visibility,
        publicLayout: space.publicLayout,
        defaultSaveVisibility: space.defaultSaveVisibility,
        theme: space.theme ?? null,
        createdAt: space._creationTime,
      },
      tags: tags.map((tag) => ({
        id: tag._id,
        name: tag.name,
        createdAt: tag._creationTime,
      })),
      collections: collections.map((col) => ({
        id: col._id,
        name: col.name,
        visibility: col.visibility,
        createdAt: col._creationTime,
        defaultTagIds: defaultTagIdsByCollectionId.get(col._id) || [],
      })),
      saves: saves.map((save) => ({
        id: save._id,
        url: save.url,
        normalizedUrl: save.normalizedUrl ?? null,
        title: save.title ?? null,
        description: save.description ?? null,
        siteName: save.siteName ?? null,
        imageUrl: save.imageUrl ?? null,
        contentType: save.contentType ?? null,
        visibility: save.visibility,
        isArchived: save.isArchived,
        isFavorite: save.isFavorite,
        savedAt: save.savedAt,
        createdAt: save._creationTime,
        tagIds: tagIdsBySaveId.get(save._id) || [],
        collectionIds: collectionIdsBySaveId.get(save._id) || [],
      })),
      counts: {
        saves: saves.length,
        tags: tags.length,
        collections: collections.length,
      },
    };
  },
});

// ============================================================================
// DOMAIN MANAGEMENT
// ============================================================================

/**
 * List all custom domains for the user's space
 */
export const listDomains = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      return [];
    }

    const domains = await ctx.db
      .query("domainMappings")
      .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
      .collect();

    return domains.map((d) => ({
      id: d._id,
      domain: d.domain,
      spaceId: d.spaceId,
      status: d.status,
      verificationToken: d.verificationToken ?? null,
      createdAt: d._creationTime,
      updatedAt: d._creationTime,
    }));
  },
});

/**
 * Get a specific domain by ID (for internal use by actions)
 */
export const getDomainById = query({
  args: {
    domainId: v.id("domainMappings"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      return null;
    }

    const domain = await ctx.db.get(args.domainId);
    if (!domain || domain.spaceId !== space._id) {
      return null;
    }

    return {
      id: domain._id,
      domain: domain.domain,
      spaceId: domain.spaceId,
      status: domain.status,
      verificationToken: domain.verificationToken ?? null,
    };
  },
});

/**
 * Internal mutation to add a domain mapping to the database.
 * Called by the addDomain action after Vercel API succeeds.
 */
export const addDomainMapping = mutation({
  args: {
    domain: v.string(),
    status: domainStatusValidator,
    verificationToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    // Check if domain already exists
    const existing = await ctx.db
      .query("domainMappings")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();

    if (existing) {
      throw new ConvexError("This domain is already registered");
    }

    const id = await ctx.db.insert("domainMappings", {
      domain: args.domain,
      spaceId: space._id,
      status: args.status,
      verificationToken: args.verificationToken,
    });

    const mapping = await ctx.db.get(id);
    return {
      id: mapping!._id,
      domain: mapping!.domain,
      spaceId: mapping!.spaceId,
      status: mapping!.status,
      verificationToken: mapping!.verificationToken ?? null,
      createdAt: mapping!._creationTime,
      updatedAt: mapping!._creationTime,
    };
  },
});

/**
 * Internal mutation to update a domain mapping status.
 * Called by actions after Vercel API operations.
 */
export const updateDomainStatus = mutation({
  args: {
    domainId: v.id("domainMappings"),
    status: domainStatusValidator,
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const domain = await ctx.db.get(args.domainId);
    if (!domain || domain.spaceId !== space._id) {
      throw new ConvexError("Domain not found");
    }

    await ctx.db.patch(args.domainId, { status: args.status });

    const updated = await ctx.db.get(args.domainId);
    return {
      id: updated!._id,
      domain: updated!.domain,
      spaceId: updated!.spaceId,
      status: updated!.status,
      verificationToken: updated!.verificationToken ?? null,
      createdAt: updated!._creationTime,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Internal mutation to remove a domain mapping from the database.
 * Called by the removeDomain action after Vercel API succeeds.
 */
export const deleteDomainMapping = mutation({
  args: {
    domainId: v.id("domainMappings"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    const domain = await ctx.db.get(args.domainId);
    if (!domain || domain.spaceId !== space._id) {
      throw new ConvexError("Domain not found");
    }

    await ctx.db.delete(args.domainId);
    return { success: true };
  },
});

/**
 * Add a custom domain to the user's space.
 * This action calls the Vercel API directly, then stores it in the database.
 */
export const addDomain = action({
  args: {
    domain: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    domain?: {
      id: string;
      domain: string;
      status: string;
      verificationRequired: boolean;
      verification?: Array<{ type: string; domain: string; value: string }>;
    };
    error?: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Not authenticated" };
    }

    // Normalize domain
    const domain = args.domain.toLowerCase().trim();

    // Basic domain validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
    if (!domainRegex.test(domain)) {
      return { success: false, error: "Invalid domain format" };
    }

    // Rate limit: max 5 custom domains per user
    const MAX_DOMAINS_PER_USER = 5;
    const existingDomains = await ctx.runQuery(api.spaces.listDomains, {});
    if (existingDomains.length >= MAX_DOMAINS_PER_USER) {
      return {
        success: false,
        error: `You can only add up to ${MAX_DOMAINS_PER_USER} custom domains`,
      };
    }

    // Call Vercel API directly
    const result = await addDomainToVercel(domain);

    if (!result.success) {
      return { success: false, error: result.error || "Failed to add domain to Vercel" };
    }

    // Store in database
    const status = result.verificationRequired ? "pending_verification" : "active";
    const mapping = await ctx.runMutation(api.spaces.addDomainMapping, {
      domain,
      status: status as "pending_verification" | "active",
      verificationToken: result.verification?.[0]?.value,
    });

    return {
      success: true,
      domain: {
        id: mapping.id,
        domain: mapping.domain,
        status: mapping.status,
        verificationRequired: result.verificationRequired || false,
        verification: result.verification,
      },
    };
  },
});

/**
 * Remove a custom domain from the user's space.
 * This action removes the domain from Vercel, then deletes it from the database.
 */
export const removeDomain = action({
  args: {
    domainId: v.id("domainMappings"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Not authenticated" };
    }

    // Get domain info from database
    const domainMapping = await ctx.runQuery(api.spaces.getDomainById, {
      domainId: args.domainId,
    });

    if (!domainMapping) {
      // Domain not in our DB, nothing to do
      return { success: true };
    }

    // Remove from Vercel
    const result = await removeDomainFromVercel(domainMapping.domain);

    // Even if Vercel removal fails, remove from our database
    // (domain might have been removed manually from Vercel)
    await ctx.runMutation(api.spaces.deleteDomainMapping, { domainId: args.domainId });

    if (!result.success) {
      console.warn("Domain removed from database but Vercel removal failed:", result.error);
    }

    return { success: true };
  },
});

/**
 * Verify a custom domain.
 * This action triggers domain verification on Vercel.
 */
export const verifyDomain = action({
  args: {
    domainId: v.id("domainMappings"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    verified: boolean;
    status?: string;
    verification?: Array<{ type: string; domain: string; value: string }>;
    error?: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, verified: false, error: "Not authenticated" };
    }

    // Get domain info from database
    const domainMapping = await ctx.runQuery(api.spaces.getDomainById, {
      domainId: args.domainId,
    });

    if (!domainMapping) {
      return { success: false, verified: false, error: "Domain not found" };
    }

    // Call Vercel API directly
    const result = await verifyDomainOnVercel(domainMapping.domain);

    if (!result.success) {
      return {
        success: false,
        verified: false,
        verification: result.verification,
        error: result.error,
      };
    }

    // Update status in database
    const newStatus = result.verified ? "active" : "pending_verification";
    await ctx.runMutation(api.spaces.updateDomainStatus, {
      domainId: args.domainId,
      status: newStatus as "active" | "pending_verification",
    });

    return {
      success: true,
      verified: result.verified,
      status: newStatus,
      verification: result.verification,
    };
  },
});

/**
 * Get detailed status for a specific domain
 */
export const getDomainStatus = action({
  args: {
    domainId: v.id("domainMappings"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    data?: {
      id: string;
      domain: string;
      status: string;
      verified: boolean;
      misconfigured: boolean;
      verification?: Array<{ type: string; domain: string; value: string }>;
    };
    error?: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Not authenticated" };
    }

    // Look up the domain from our database first
    const domainMapping = await ctx.runQuery(api.spaces.getDomainById, {
      domainId: args.domainId,
    });

    if (!domainMapping) {
      return { success: false, error: "Domain not found" };
    }

    // Get Vercel status directly
    const vercelStatus = await getDomainConfigFromVercel(domainMapping.domain);

    if (!vercelStatus.success) {
      // Return basic info from our database even if Vercel lookup fails
      return {
        success: true,
        data: {
          id: args.domainId,
          domain: domainMapping.domain,
          status: domainMapping.status,
          verified: domainMapping.status === "active",
          misconfigured: false,
        },
      };
    }

    return {
      success: true,
      data: {
        id: args.domainId,
        domain: domainMapping.domain,
        status: domainMapping.status,
        verified: vercelStatus.verified ?? domainMapping.status === "active",
        misconfigured: vercelStatus.misconfigured ?? false,
        verification: vercelStatus.verification,
      },
    };
  },
});
