import { v } from "convex/values";

// Re-export schema validators for use in functions
export {
  blockedReasonValidator,
  domainStatusValidator,
  membershipRoleValidator,
  membershipStatusValidator,
  publicLayoutValidator,
  snapshotStatusValidator,
  spaceTypeValidator,
  visibilityValidator,
} from "../schema";

// Pagination validator
export const paginationValidator = {
  cursor: v.optional(v.string()),
  limit: v.optional(v.number()),
};

// Common input validators
export const saveFiltersValidator = {
  query: v.optional(v.string()),
  visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
  isArchived: v.optional(v.boolean()),
  isFavorite: v.optional(v.boolean()),
  collectionId: v.optional(v.id("collections")),
  tagId: v.optional(v.id("tags")),
};

// Reserved slugs that cannot be used
export const RESERVED_SLUGS = [
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "settings",
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "signout",
  "auth",
  "oauth",
  "help",
  "support",
  "docs",
  "blog",
  "about",
  "contact",
  "terms",
  "privacy",
  "public",
  "static",
  "assets",
  "images",
  "css",
  "js",
  "fonts",
  "media",
  "uploads",
  "files",
  "download",
  "downloads",
  "rss",
  "feed",
  "sitemap",
  "robots",
  "favicon",
  "manifest",
  "sw",
  "service-worker",
  "null",
  "undefined",
  "true",
  "false",
  "test",
  "demo",
  "example",
  "sample",
  "backpocket",
];

// Validate slug format
export function isValidSlug(slug: string): boolean {
  if (slug.length < 3 || slug.length > 32) return false;
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug);
}

// Normalize URL for duplicate detection
export function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, www prefix, and normalize to lowercase
    let normalized = parsed.hostname.replace(/^www\./, "").toLowerCase();
    normalized += parsed.pathname.replace(/\/$/, "");
    // Include search params if present (sorted for consistency)
    if (parsed.search) {
      const params = new URLSearchParams(parsed.search);
      params.sort();
      normalized += "?" + params.toString();
    }
    return normalized;
  } catch {
    return null;
  }
}
