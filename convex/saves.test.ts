import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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

describe("saves observability", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("creating a save emits wide event with clientSource", async () => {
    vi.useFakeTimers();

    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_observability1" });

    await asUser.mutation(api.spaces.ensureSpace, {});

    await asUser.mutation(api.saves.create, {
      url: "https://github.com/test/repo",
      clientSource: "extension",
    });

    vi.useRealTimers();

    // Find the wide event log
    const wideEventLogs = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("[wide_event]")
    );

    expect(wideEventLogs.length).toBeGreaterThan(0);

    // Parse and verify the saves.create event
    const savesCreateLog = wideEventLogs.find((call) =>
      (call[0] as string).includes('"function_name":"saves.create"')
    );

    expect(savesCreateLog).toBeDefined();

    const jsonPart = (savesCreateLog![0] as string).replace("[wide_event] ", "");
    const event = JSON.parse(jsonPart);

    expect(event).toMatchObject({
      function_name: "saves.create",
      function_type: "mutation",
      client_source: "extension",
      outcome: "success",
    });

    expect(event.context).toMatchObject({
      url_domain: "github.com",
      triggered_snapshot: true,
    });

    expect(event.user_id).toBe("user_observability1");
    expect(event.trace_id).toBeDefined();
    expect(event.duration_ms).toBeGreaterThanOrEqual(0);
  });

  test("updating a save emits wide event with fields updated", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_observability2" });

    await asUser.mutation(api.spaces.ensureSpace, {});

    const save = await asUser.mutation(api.saves.create, {
      url: "https://example.com/update-test",
    });

    // Clear logs from create
    consoleSpy.mockClear();

    await asUser.mutation(api.saves.update, {
      id: save.id,
      title: "Updated Title",
      visibility: "public",
      clientSource: "web",
    });

    // Find the wide event log
    const wideEventLogs = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("[wide_event]")
    );

    const updateLog = wideEventLogs.find((call) =>
      (call[0] as string).includes('"function_name":"saves.update"')
    );

    expect(updateLog).toBeDefined();

    const jsonPart = (updateLog![0] as string).replace("[wide_event] ", "");
    const event = JSON.parse(jsonPart);

    expect(event).toMatchObject({
      function_name: "saves.update",
      client_source: "web",
      outcome: "success",
    });

    expect(event.context.fields_updated).toContain("title");
    expect(event.context.fields_updated).toContain("visibility");
    expect(event.context.field_count).toBe(2);
  });

  test("deleting a save emits wide event", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_observability3" });

    await asUser.mutation(api.spaces.ensureSpace, {});

    const save = await asUser.mutation(api.saves.create, {
      url: "https://example.com/delete-test",
      tagNames: ["test-tag"],
    });

    // Clear logs from create
    consoleSpy.mockClear();

    await asUser.mutation(api.saves.remove, {
      saveId: save.id,
      clientSource: "mobile",
    });

    // Find the wide event log
    const wideEventLogs = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("[wide_event]")
    );

    const removeLog = wideEventLogs.find((call) =>
      (call[0] as string).includes('"function_name":"saves.remove"')
    );

    expect(removeLog).toBeDefined();

    const jsonPart = (removeLog![0] as string).replace("[wide_event] ", "");
    const event = JSON.parse(jsonPart);

    expect(event).toMatchObject({
      function_name: "saves.remove",
      client_source: "mobile",
      outcome: "success",
    });

    expect(event.context.save_id).toBe(save.id);
    expect(event.context.tag_count).toBe(1);
  });

  test("duplicate save error emits wide event with error details", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "user_observability4" });

    await asUser.mutation(api.spaces.ensureSpace, {});

    await asUser.mutation(api.saves.create, {
      url: "https://example.com/dup-observability",
    });

    // Clear logs from first create
    consoleSpy.mockClear();

    // Try to create duplicate
    await expect(
      asUser.mutation(api.saves.create, {
        url: "https://example.com/dup-observability",
        clientSource: "extension",
      })
    ).rejects.toThrow();

    // Find the error wide event
    const wideEventLogs = consoleSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("[wide_event]")
    );

    const errorLog = wideEventLogs.find(
      (call) =>
        (call[0] as string).includes('"function_name":"saves.create"') &&
        (call[0] as string).includes('"outcome":"error"')
    );

    expect(errorLog).toBeDefined();

    const jsonPart = (errorLog![0] as string).replace("[wide_event] ", "");
    const event = JSON.parse(jsonPart);

    expect(event).toMatchObject({
      function_name: "saves.create",
      outcome: "error",
      error: {
        code: "CONFLICT",
        retriable: false,
      },
    });

    expect(event.context.url_domain).toBe("example.com");
    expect(event.context.existing_save_id).toBeDefined();
  });
});
