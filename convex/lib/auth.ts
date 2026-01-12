import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Get the current authenticated user's identity
 * Returns null if not authenticated
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  return {
    userId: identity.subject, // Clerk user ID
    email: identity.email,
    name: identity.name,
  };
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new ConvexError("Unauthorized: You must be logged in");
  }
  return user;
}

/**
 * Get the user's space (first active membership)
 * Creates a space if the user doesn't have one (only in mutation context)
 */
export async function getUserSpace(ctx: QueryCtx | MutationCtx, userId: string) {
  // Find the user's active membership
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_userId_status", (q) => q.eq("userId", userId).eq("status", "active"))
    .first();

  if (!membership) {
    return null;
  }

  // Get the space
  const space = await ctx.db.get(membership.spaceId);
  return space;
}

/**
 * Get or create the user's space (for mutations only)
 */
export async function getOrCreateUserSpace(ctx: MutationCtx, userId: string) {
  // Try to get existing space
  const existingSpace = await getUserSpace(ctx, userId);
  if (existingSpace) {
    return existingSpace;
  }

  // Create a new personal space with a unique slug
  // Lowercase is required because hostnames/subdomains are case-insensitive
  const baseSlug = `user-${userId.slice(-8).toLowerCase()}`;
  let slug = baseSlug;
  let attempt = 0;

  // Ensure slug is unique
  while (true) {
    const existing = await ctx.db
      .query("spaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!existing) break;

    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // Create the space
  const spaceId = await ctx.db.insert("spaces", {
    type: "personal",
    slug,
    name: "My Library",
    visibility: "private",
    publicLayout: "grid",
    defaultSaveVisibility: "private",
  });

  // Create the membership
  await ctx.db.insert("memberships", {
    spaceId,
    userId,
    role: "owner",
    status: "active",
  });

  return await ctx.db.get(spaceId);
}

/**
 * Require user has access to a space
 */
export async function requireSpaceAccess(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  spaceId: string
) {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_spaceId_userId", (q) =>
      q.eq("spaceId", spaceId as any).eq("userId", userId)
    )
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();

  if (!membership) {
    throw new ConvexError("Forbidden: You don't have access to this space");
  }

  return membership;
}
