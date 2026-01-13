import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("saves", () => {
  test("creating a save schedules snapshot processing", async () => {
    // Enable fake timers to control scheduled functions
    vi.useFakeTimers();

    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_snapshot123" });

    // Ensure user has a space
    await asUser.mutation(api.spaces.ensureSpace, {});

    // Create a save
    const save = await asUser.mutation(api.saves.create, {
      url: "https://example.com/article",
    });

    expect(save).toBeDefined();
    expect(save.id).toBeDefined();

    // Run pending timers to trigger scheduled mutation (createSnapshotRecord)
    vi.runAllTimers();

    // Wait for the scheduled mutation to complete
    await t.finishInProgressScheduledFunctions();

    // Verify snapshot record was created
    // Note: The status may be "pending", "processing", or "failed" depending on
    // how far the background action got before we query. The key verification
    // is that a snapshot record exists at all, proving the scheduled job ran.
    const snapshot = await asUser.query(api.snapshots.getSaveSnapshot, {
      saveId: save.id,
    });

    expect(snapshot).not.toBeNull();
    // The snapshot record should exist with one of the valid statuses
    expect(["pending", "processing", "failed", "blocked", "ready"]).toContain(
      snapshot?.snapshot.status
    );

    // Reset timers
    vi.useRealTimers();
  });

  test("creating a save with title preserves the title", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_title456" });

    await asUser.mutation(api.spaces.ensureSpace, {});

    const save = await asUser.mutation(api.saves.create, {
      url: "https://example.com/custom-title",
      title: "My Custom Title",
    });

    expect(save.title).toBe("My Custom Title");
  });

  test("creating duplicate save throws conflict error", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_dup789" });

    await asUser.mutation(api.spaces.ensureSpace, {});

    // Create first save
    await asUser.mutation(api.saves.create, {
      url: "https://example.com/duplicate",
    });

    // Try to create duplicate
    await expect(
      asUser.mutation(api.saves.create, {
        url: "https://example.com/duplicate",
      })
    ).rejects.toThrow();
  });
});
