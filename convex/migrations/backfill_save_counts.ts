/**
 * One-time migration to backfill denormalized save counts.
 * Run via: npx convex run migrations/backfill_save_counts:backfillSaveCounts
 *
 * This creates saveCounts records for all existing spaces by counting
 * their saves. After running this, the denormalized counts will be
 * maintained automatically by create/remove/bulkDelete mutations.
 */

import { internalMutation } from "../_generated/server";

export const backfillSaveCounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const spaces = await ctx.db.query("spaces").collect();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const space of spaces) {
      // Count all saves for this space
      const saves = await ctx.db
        .query("saves")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .collect();
      const count = saves.length;

      // Check if a saveCounts record already exists
      const existing = await ctx.db
        .query("saveCounts")
        .withIndex("by_spaceId", (q) => q.eq("spaceId", space._id))
        .unique();

      if (existing) {
        if (existing.count !== count) {
          // Update if count is different (could happen if migration runs again)
          await ctx.db.patch(existing._id, { count });
          console.log(`Updated: space ${space.slug} count ${existing.count} -> ${count}`);
          updated++;
        } else {
          console.log(`Skipped: space ${space.slug} already has correct count ${count}`);
          skipped++;
        }
      } else if (count > 0) {
        // Only create records for spaces with saves
        await ctx.db.insert("saveCounts", { spaceId: space._id, count });
        console.log(`Created: space ${space.slug} with ${count} saves`);
        created++;
      } else {
        console.log(`Skipped: space ${space.slug} has no saves`);
        skipped++;
      }
    }

    return {
      created,
      updated,
      skipped,
      totalSpaces: spaces.length,
    };
  },
});
