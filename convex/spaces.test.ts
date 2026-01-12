import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("spaces", () => {
  test("getMySpace returns null for new user", async () => {
    const t = convexTest(schema, modules);
    const asNewUser = t.withIdentity({ subject: "user_new123" });
    const space = await asNewUser.query(api.spaces.getMySpace, {});
    expect(space).toBeNull();
  });

  test("ensureSpace creates space for new user", async () => {
    const t = convexTest(schema, modules);
    const asNewUser = t.withIdentity({ subject: "user_create456" });
    const space = await asNewUser.mutation(api.spaces.ensureSpace, {});

    expect(space).toBeDefined();
    expect(space.type).toBe("personal");
    expect(space.name).toBe("My Library");
    expect(space.visibility).toBe("private");
    expect(space.slug).toMatch(/^user-/);
  });

  test("ensureSpace is idempotent", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_idempotent789" });

    const space1 = await asUser.mutation(api.spaces.ensureSpace, {});
    const space2 = await asUser.mutation(api.spaces.ensureSpace, {});

    expect(space1.id).toBe(space2.id);
    expect(space1.slug).toBe(space2.slug);
  });

  test("getMySpace returns space after ensureSpace", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_getafter101" });

    // Before: no space
    const before = await asUser.query(api.spaces.getMySpace, {});
    expect(before).toBeNull();

    // Create space
    await asUser.mutation(api.spaces.ensureSpace, {});

    // After: has space
    const after = await asUser.query(api.spaces.getMySpace, {});
    expect(after).not.toBeNull();
    expect(after?.name).toBe("My Library");
    expect(after?.type).toBe("personal");
    expect(after?.visibility).toBe("private");
  });

  test("ensureSpace generates unique slugs for users with colliding IDs", async () => {
    const t = convexTest(schema, modules);

    // Create first user - slug will be last 8 chars: "12345678"
    const user1 = t.withIdentity({ subject: "user_aaaa12345678" });
    const space1 = await user1.mutation(api.spaces.ensureSpace, {});

    // Create second user with same last 8 chars - would collide
    const user2 = t.withIdentity({ subject: "user_bbbb12345678" });
    const space2 = await user2.mutation(api.spaces.ensureSpace, {});

    // Both should have spaces with different slugs
    expect(space1.slug).toBe("user-12345678");
    // Second user gets a numbered suffix to avoid collision
    expect(space2.slug).toBe("user-12345678-1");
    expect(space1.slug).not.toBe(space2.slug);
  });

  test("getStats returns zeros for new user", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_stats000" });

    const stats = await asUser.query(api.spaces.getStats, {});

    expect(stats.totalSaves).toBe(0);
    expect(stats.favoriteSaves).toBe(0);
    expect(stats.publicSaves).toBe(0);
    expect(stats.archivedSaves).toBe(0);
    expect(stats.totalTags).toBe(0);
    expect(stats.totalCollections).toBe(0);
  });

  test("ensureSpace creates lowercase slug even with mixed-case user ID", async () => {
    const t = convexTest(schema, modules);
    // User ID with mixed case - like Clerk IDs often have
    const asUser = t.withIdentity({ subject: "user_AbCdEfGh" });
    const space = await asUser.mutation(api.spaces.ensureSpace, {});

    // Slug should be lowercase for URL/subdomain compatibility
    expect(space.slug).toBe("user-abcdefgh");
    expect(space.slug).not.toMatch(/[A-Z]/);
  });
});
