import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createApiRouteEvent, detectUrlType, extractDomain } from "./logger";

describe("API route logger utilities", () => {
  describe("extractDomain", () => {
    test("extracts domain from simple URL", () => {
      expect(extractDomain("https://example.com/path")).toBe("example.com");
    });

    test("strips www prefix", () => {
      expect(extractDomain("https://www.example.com/path")).toBe("example.com");
    });

    test("returns null for invalid URL", () => {
      expect(extractDomain("not-a-url")).toBeNull();
    });
  });

  describe("detectUrlType", () => {
    test("detects Twitter URLs", () => {
      expect(detectUrlType("https://twitter.com/user/status/123")).toBe("twitter");
      expect(detectUrlType("https://x.com/user/status/123")).toBe("twitter");
      expect(detectUrlType("https://www.twitter.com/user")).toBe("twitter");
      expect(detectUrlType("https://mobile.x.com/user")).toBe("twitter");
    });

    test("detects Reddit URLs", () => {
      expect(detectUrlType("https://reddit.com/r/test")).toBe("reddit");
      expect(detectUrlType("https://www.reddit.com/r/test")).toBe("reddit");
      expect(detectUrlType("https://old.reddit.com/r/test")).toBe("reddit");
      expect(detectUrlType("https://redd.it/abc123")).toBe("reddit");
    });

    test("returns generic for other URLs", () => {
      expect(detectUrlType("https://github.com/user/repo")).toBe("generic");
      expect(detectUrlType("https://example.com")).toBe("generic");
      expect(detectUrlType("https://news.ycombinator.com")).toBe("generic");
    });

    test("returns generic for invalid URLs", () => {
      expect(detectUrlType("not-a-url")).toBe("generic");
    });
  });
});

describe("createApiRouteEvent", () => {
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
    const event = createApiRouteEvent("POST", "/api/unfurl");
    event.setUrlContext("https://github.com/test/repo");

    const result = event.success(200, { extractor: "html_meta" });

    expect(result.requestId).toMatch(/^req_/);

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const logArg = consoleSpy.mock.calls[0][0] as string;
    expect(logArg).toContain("[api_wide_event]");

    const jsonPart = logArg.replace("[api_wide_event] ", "");
    const logged = JSON.parse(jsonPart);

    expect(logged).toMatchObject({
      timestamp: "2026-01-13T10:00:00.000Z",
      method: "POST",
      path: "/api/unfurl",
      url_domain: "github.com",
      url_type: "generic",
      status_code: 200,
      outcome: "success",
    });

    expect(logged.request_id).toMatch(/^req_/);
    expect(logged.duration_ms).toBeGreaterThanOrEqual(0);
  });

  test("logs fallback event with reason", () => {
    const event = createApiRouteEvent("POST", "/api/unfurl");
    event.setUrlContext("https://example.com/page");

    event.fallback(200, { extractor: "fallback" }, "HTTP 403");

    const logArg = consoleSpy.mock.calls[0][0] as string;
    const jsonPart = logArg.replace("[api_wide_event] ", "");
    const logged = JSON.parse(jsonPart);

    expect(logged).toMatchObject({
      method: "POST",
      path: "/api/unfurl",
      status_code: 200,
      outcome: "fallback",
      context: {
        fallback_reason: "HTTP 403",
      },
    });
  });

  test("logs error event with error details", () => {
    const event = createApiRouteEvent("POST", "/api/unfurl");
    event.setUrlContext("https://example.com");

    const error = new Error("Connection refused");
    event.error(500, error);

    const logArg = consoleSpy.mock.calls[0][0] as string;
    const jsonPart = logArg.replace("[api_wide_event] ", "");
    const logged = JSON.parse(jsonPart);

    expect(logged).toMatchObject({
      method: "POST",
      path: "/api/unfurl",
      status_code: 500,
      outcome: "error",
      error: {
        type: "Error",
        message: "Connection refused",
      },
    });
  });

  test("detects Twitter URL type", () => {
    const event = createApiRouteEvent("POST", "/api/unfurl");
    event.setUrlContext("https://twitter.com/user/status/123");

    event.success(200, {});

    const logArg = consoleSpy.mock.calls[0][0] as string;
    const jsonPart = logArg.replace("[api_wide_event] ", "");
    const logged = JSON.parse(jsonPart);

    expect(logged.url_type).toBe("twitter");
    expect(logged.url_domain).toBe("twitter.com");
  });

  test("detects Reddit URL type", () => {
    const event = createApiRouteEvent("POST", "/api/unfurl");
    event.setUrlContext("https://www.reddit.com/r/programming/comments/abc123");

    event.success(200, {});

    const logArg = consoleSpy.mock.calls[0][0] as string;
    const jsonPart = logArg.replace("[api_wide_event] ", "");
    const logged = JSON.parse(jsonPart);

    expect(logged.url_type).toBe("reddit");
    expect(logged.url_domain).toBe("reddit.com");
  });

  test("allows adding custom context", () => {
    const event = createApiRouteEvent("POST", "/api/unfurl");
    event.setContext({ custom_field: "value", another: 123 });

    event.success(200, {});

    const logArg = consoleSpy.mock.calls[0][0] as string;
    const jsonPart = logArg.replace("[api_wide_event] ", "");
    const logged = JSON.parse(jsonPart);

    expect(logged.context).toMatchObject({
      custom_field: "value",
      another: 123,
    });
  });

  test("request ID is consistent across success call", () => {
    const event = createApiRouteEvent("POST", "/api/unfurl");

    const result = event.success(200, { test: true });

    const logArg = consoleSpy.mock.calls[0][0] as string;
    const jsonPart = logArg.replace("[api_wide_event] ", "");
    const logged = JSON.parse(jsonPart);

    expect(result.requestId).toBe(logged.request_id);
  });
});
