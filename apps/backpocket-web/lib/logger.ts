/**
 * API Route Logging Utility
 *
 * Structured "wide event" logging for Next.js API routes.
 * Outputs JSON to Vercel logs for easy querying.
 */

// ============================================================================
// Types
// ============================================================================

/** Wide event structure for API routes */
export interface ApiRouteWideEvent {
  // Identifiers
  timestamp: string;
  request_id: string;
  method: string;
  path: string;

  // Request details (populated by function)
  url_domain?: string;
  url_type?: "twitter" | "reddit" | "generic";

  // Execution
  duration_ms: number;
  status_code: number;
  outcome: "success" | "error" | "fallback";

  // Error details (if error)
  error?: {
    type: string;
    message: string;
  };

  // Additional context
  context?: Record<string, unknown>;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique request ID for correlation.
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Extract domain from a URL for logging context.
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Detect URL type for logging context.
 */
export function detectUrlType(url: string): "twitter" | "reddit" | "generic" {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (
      hostname === "twitter.com" ||
      hostname === "x.com" ||
      hostname.endsWith(".twitter.com") ||
      hostname.endsWith(".x.com")
    ) {
      return "twitter";
    }
    if (hostname === "reddit.com" || hostname.endsWith(".reddit.com") || hostname === "redd.it") {
      return "reddit";
    }
    return "generic";
  } catch {
    return "generic";
  }
}

// ============================================================================
// API Route Event Builder
// ============================================================================

/**
 * Create a wide event builder for tracking an API route request.
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const event = createApiRouteEvent("POST", "/api/unfurl");
 *
 *   try {
 *     const { url } = await request.json();
 *     event.setContext({ url_domain: extractDomain(url), url_type: detectUrlType(url) });
 *
 *     const result = await unfurlUrl(url);
 *     return event.success(200, result);
 *   } catch (err) {
 *     return event.error(500, err, { error: "Failed to unfurl URL" });
 *   }
 * }
 * ```
 */
export function createApiRouteEvent(method: string, path: string) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  let urlDomain: string | undefined;
  let urlType: "twitter" | "reddit" | "generic" | undefined;
  let additionalContext: Record<string, unknown> = {};

  return {
    /** Get the request ID for including in response headers */
    requestId,

    /**
     * Set URL-specific context (domain, type).
     */
    setUrlContext(url: string) {
      urlDomain = extractDomain(url) ?? undefined;
      urlType = detectUrlType(url);
    },

    /**
     * Add additional context to the event.
     */
    setContext(context: Record<string, unknown>) {
      additionalContext = { ...additionalContext, ...context };
    },

    /**
     * Log a successful response and return a NextResponse-compatible object.
     */
    success<T>(statusCode: number, data: T): { data: T; requestId: string } {
      const event: ApiRouteWideEvent = {
        timestamp: new Date().toISOString(),
        request_id: requestId,
        method,
        path,
        url_domain: urlDomain,
        url_type: urlType,
        duration_ms: Date.now() - startTime,
        status_code: statusCode,
        outcome: "success",
        context: Object.keys(additionalContext).length > 0 ? additionalContext : undefined,
      };
      logApiRouteEvent(event);
      return { data, requestId };
    },

    /**
     * Log a fallback response (partial success, e.g., returning basic info on fetch error).
     */
    fallback<T>(statusCode: number, data: T, reason?: string): { data: T; requestId: string } {
      const event: ApiRouteWideEvent = {
        timestamp: new Date().toISOString(),
        request_id: requestId,
        method,
        path,
        url_domain: urlDomain,
        url_type: urlType,
        duration_ms: Date.now() - startTime,
        status_code: statusCode,
        outcome: "fallback",
        context: {
          ...additionalContext,
          ...(reason && { fallback_reason: reason }),
        },
      };
      logApiRouteEvent(event);
      return { data, requestId };
    },

    /**
     * Log an error response.
     */
    error<T>(
      statusCode: number,
      err: unknown,
      data?: T
    ): { data: T | undefined; requestId: string } {
      const errorInfo = parseError(err);
      const event: ApiRouteWideEvent = {
        timestamp: new Date().toISOString(),
        request_id: requestId,
        method,
        path,
        url_domain: urlDomain,
        url_type: urlType,
        duration_ms: Date.now() - startTime,
        status_code: statusCode,
        outcome: "error",
        error: errorInfo,
        context: Object.keys(additionalContext).length > 0 ? additionalContext : undefined,
      };
      logApiRouteEvent(event);
      return { data, requestId };
    },
  };
}

/**
 * Parse an error into structured error info.
 */
function parseError(err: unknown): { type: string; message: string } {
  if (err instanceof Error) {
    return {
      type: err.constructor.name,
      message: err.message,
    };
  }
  return {
    type: "Unknown",
    message: String(err),
  };
}

/**
 * Emit an API route event to logs.
 */
function logApiRouteEvent(event: ApiRouteWideEvent) {
  // Use a prefix for easy filtering in Vercel logs
  console.log(`[api_wide_event] ${JSON.stringify(event)}`);
}
