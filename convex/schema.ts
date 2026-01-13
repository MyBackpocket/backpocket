import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Validators for enums (reusable)
export const spaceTypeValidator = v.union(v.literal("personal"), v.literal("org"));
export const visibilityValidator = v.union(v.literal("public"), v.literal("private"));
export const publicLayoutValidator = v.union(v.literal("list"), v.literal("grid"));
export const membershipRoleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("writer"),
  v.literal("viewer")
);
export const membershipStatusValidator = v.union(
  v.literal("active"),
  v.literal("invited"),
  v.literal("removed")
);
export const snapshotStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("ready"),
  v.literal("blocked"),
  v.literal("failed")
);
export const blockedReasonValidator = v.union(
  v.literal("noarchive"),
  v.literal("forbidden"),
  v.literal("not_html"),
  v.literal("too_large"),
  v.literal("invalid_url"),
  v.literal("timeout"),
  v.literal("parse_failed"),
  v.literal("ssrf_blocked"),
  v.literal("fetch_error")
);
export const domainStatusValidator = v.union(
  v.literal("pending_verification"),
  v.literal("verified"),
  v.literal("active"),
  v.literal("error"),
  v.literal("disabled")
);

export default defineSchema({
  // Spaces table
  spaces: defineTable({
    type: spaceTypeValidator,
    slug: v.string(),
    name: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    visibility: visibilityValidator,
    publicLayout: publicLayoutValidator,
    defaultSaveVisibility: visibilityValidator,
  })
    .index("by_slug", ["slug"])
    .index("by_visibility", ["visibility"]),

  // Memberships table (links Clerk users to spaces)
  memberships: defineTable({
    spaceId: v.id("spaces"),
    userId: v.string(), // Clerk user ID
    role: membershipRoleValidator,
    status: membershipStatusValidator,
  })
    .index("by_userId", ["userId"])
    .index("by_spaceId", ["spaceId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_spaceId_userId", ["spaceId", "userId"]),

  // Tags table
  tags: defineTable({
    spaceId: v.id("spaces"),
    name: v.string(),
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_spaceId_name", ["spaceId", "name"]),

  // Collections table
  collections: defineTable({
    spaceId: v.id("spaces"),
    name: v.string(),
    visibility: visibilityValidator,
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_spaceId_visibility", ["spaceId", "visibility"]),

  // Saves table
  saves: defineTable({
    spaceId: v.id("spaces"),
    url: v.string(),
    normalizedUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    siteName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    contentType: v.optional(v.string()),
    visibility: visibilityValidator,
    isArchived: v.boolean(),
    isFavorite: v.boolean(),
    createdBy: v.string(), // Clerk user ID
    savedAt: v.number(), // Unix timestamp for sorting
  })
    .index("by_spaceId", ["spaceId"])
    .index("by_spaceId_savedAt", ["spaceId", "savedAt"])
    .index("by_spaceId_visibility", ["spaceId", "visibility"])
    .index("by_spaceId_visibility_savedAt", ["spaceId", "visibility", "savedAt"])
    .index("by_spaceId_isFavorite", ["spaceId", "isFavorite"])
    .index("by_spaceId_isArchived", ["spaceId", "isArchived"])
    .index("by_spaceId_normalizedUrl", ["spaceId", "normalizedUrl"]),

  // Save-Tag junction table
  saveTags: defineTable({
    saveId: v.id("saves"),
    tagId: v.id("tags"),
  })
    .index("by_saveId", ["saveId"])
    .index("by_tagId", ["tagId"])
    .index("by_saveId_tagId", ["saveId", "tagId"]),

  // Save-Collection junction table
  saveCollections: defineTable({
    saveId: v.id("saves"),
    collectionId: v.id("collections"),
  })
    .index("by_saveId", ["saveId"])
    .index("by_collectionId", ["collectionId"])
    .index("by_saveId_collectionId", ["saveId", "collectionId"]),

  // Collection default tags junction table
  collectionDefaultTags: defineTable({
    collectionId: v.id("collections"),
    tagId: v.id("tags"),
  })
    .index("by_collectionId", ["collectionId"])
    .index("by_tagId", ["tagId"]),

  // Save snapshots table
  saveSnapshots: defineTable({
    saveId: v.id("saves"),
    spaceId: v.id("spaces"),
    status: snapshotStatusValidator,
    blockedReason: v.optional(blockedReasonValidator),
    attempts: v.number(),
    nextAttemptAt: v.optional(v.number()),
    fetchedAt: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")), // Convex file storage (legacy, kept for backwards compat)
    canonicalUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    byline: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    siteName: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    language: v.optional(v.string()),
    contentSha256: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    // Inline content fields (extracted via Mozilla Readability)
    contentHtml: v.optional(v.string()), // Sanitized HTML content
    contentText: v.optional(v.string()), // Plain text version
  })
    .index("by_saveId", ["saveId"])
    .index("by_spaceId", ["spaceId"])
    .index("by_status", ["status"])
    .index("by_status_nextAttemptAt", ["status", "nextAttemptAt"]),

  // Domain mappings for custom domains
  domainMappings: defineTable({
    domain: v.string(),
    spaceId: v.id("spaces"),
    status: domainStatusValidator,
    verificationToken: v.optional(v.string()),
  })
    .index("by_domain", ["domain"])
    .index("by_spaceId", ["spaceId"]),

  // Visit counts (replaces Redis for visit tracking)
  visitCounts: defineTable({
    spaceId: v.id("spaces"),
    count: v.number(),
  }).index("by_spaceId", ["spaceId"]),

  // Rate limiting for snapshots (replaces Redis)
  snapshotRateLimits: defineTable({
    userId: v.string(),
    windowStart: v.number(), // Start of 24h window
    count: v.number(),
  }).index("by_userId", ["userId"]),
});
