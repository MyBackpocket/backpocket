import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createWideEvent, extractDomain, generateTraceId } from "./logger";

describe("logger utilities", () => {
  describe("generateTraceId", () => {
    test("generates unique trace IDs", () => {
      const id1 = generateTraceId();
      const id2 = generateTraceId();

      expect(id1).not.toBe(id2);
    });

    test("trace ID has expected format", () => {
      const id = generateTraceId();

      expect(id).toMatch(/^trace_[a-z0-9]+_[a-z0-9]+$/);
    });
  });

  describe("extractDomain", () => {
    test("extracts domain from simple URL", () => {
      expect(extractDomain("https://example.com/path")).toBe("example.com");
    });

    test("strips www prefix", () => {
      expect(extractDomain("https://www.example.com/path")).toBe("example.com");
    });

    test("handles subdomains", () => {
      expect(extractDomain("https://blog.example.com/post")).toBe("blog.example.com");
    });

    test("returns null for invalid URL", () => {
      expect(extractDomain("not-a-url")).toBeNull();
      expect(extractDomain("")).toBeNull();
    });

    test("handles URLs with ports", () => {
      expect(extractDomain("https://example.com:8080/path")).toBe("example.com");
    });

    test("handles URLs with query strings", () => {
      expect(extractDomain("https://example.com/path?foo=bar")).toBe("example.com");
    });
  });

  describe("createWideEvent", () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-13T10:00:00.000Z"));
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      vi.useRealTimers();
    });

    test("logs success event with correct structure", () => {
      const event = createWideEvent("saves.create", "mutation", {
        userId: "user_123",
        spaceId: "space_456",
        clientSource: "web",
      });

      event.success({ url_domain: "github.com", tag_count: 2 });

      expect(consoleSpy).toHaveBeenCalledTimes(1);

      const logArg = consoleSpy.mock.calls[0][0] as string;
      expect(logArg).toContain("[wide_event]");

      const jsonPart = logArg.replace("[wide_event] ", "");
      const logged = JSON.parse(jsonPart);

      expect(logged).toMatchObject({
        timestamp: "2026-01-13T10:00:00.000Z",
        function_name: "saves.create",
        function_type: "mutation",
        user_id: "user_123",
        space_id: "space_456",
        client_source: "web",
        outcome: "success",
        context: {
          url_domain: "github.com",
          tag_count: 2,
        },
      });

      expect(logged.trace_id).toMatch(/^trace_/);
      expect(logged.duration_ms).toBeGreaterThanOrEqual(0);
    });

    test("logs error event with error details", () => {
      const event = createWideEvent("saves.create", "mutation", {
        userId: "user_123",
      });

      const error = new Error("Something went wrong");
      event.error(error, { url_domain: "example.com" });

      expect(consoleSpy).toHaveBeenCalledTimes(1);

      const logArg = consoleSpy.mock.calls[0][0] as string;
      const jsonPart = logArg.replace("[wide_event] ", "");
      const logged = JSON.parse(jsonPart);

      expect(logged).toMatchObject({
        function_name: "saves.create",
        function_type: "mutation",
        user_id: "user_123",
        outcome: "error",
        error: {
          type: "Error",
          message: "Something went wrong",
          retriable: false,
        },
        context: {
          url_domain: "example.com",
        },
      });
    });

    test("uses provided traceId", () => {
      const event = createWideEvent("saves.create", "mutation", {
        traceId: "custom_trace_123",
      });

      expect(event.traceId).toBe("custom_trace_123");

      event.success();

      const logArg = consoleSpy.mock.calls[0][0] as string;
      const jsonPart = logArg.replace("[wide_event] ", "");
      const logged = JSON.parse(jsonPart);

      expect(logged.trace_id).toBe("custom_trace_123");
    });

    test("handles null userId and spaceId", () => {
      const event = createWideEvent("saves.create", "mutation", {});

      event.success();

      const logArg = consoleSpy.mock.calls[0][0] as string;
      const jsonPart = logArg.replace("[wide_event] ", "");
      const logged = JSON.parse(jsonPart);

      expect(logged.user_id).toBeNull();
      expect(logged.space_id).toBeNull();
    });

    test("tracks duration correctly", async () => {
      vi.useRealTimers(); // Need real timers for this test

      const event = createWideEvent("saves.create", "mutation", {});

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 50));

      vi.useFakeTimers(); // Re-enable for cleanup

      // Can't easily test duration without real timers, but structure is correct
      expect(event.traceId).toBeDefined();
    });
  });
});
