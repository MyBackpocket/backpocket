/**
 * One-time migration to fix uppercase slugs.
 * Run via: npx convex run migrations/fix_uppercase_slugs:fixUppercaseSlugs
 *
 * This fixes the bug where slugs were created with mixed case from Clerk user IDs,
 * but hostnames/subdomains are case-insensitive so lookups would fail.
 */

import { internalMutation } from "../_generated/server";

export const fixUppercaseSlugs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db.query("spaces").collect();

    let fixed = 0;
    for (const space of spaces) {
      const lowercaseSlug = space.slug.toLowerCase();
      if (space.slug !== lowercaseSlug) {
        // Check if lowercase slug is already taken
        const existing = await ctx.db
          .query("spaces")
          .withIndex("by_slug", (q) => q.eq("slug", lowercaseSlug))
          .first();

        if (existing && existing._id !== space._id) {
          console.log(
            `Skipping ${space.slug} - lowercase version ${lowercaseSlug} already exists`
          );
          continue;
        }

        await ctx.db.patch(space._id, { slug: lowercaseSlug });
        console.log(`Fixed: ${space.slug} -> ${lowercaseSlug}`);
        fixed++;
      }
    }

    return { fixed, total: spaces.length };
  },
});
