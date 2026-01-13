/**
 * Wide Events Logger for Convex Functions
 *
 * Implements structured "wide event" logging for observability.
 * Each event captures full context for debugging: user, space, timing, errors, and business context.
 *
 * @see https://loggingsucks.com/ for wide events philosophy
 */

import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { DataModel } from "../_generated/dataModel";

// ============================================================================
// Types
// ============================================================================

/** Client application source */
export type ClientSource = "web" | "mobile" | "extension";

/** Wide event structure for Convex functions */
export interface ConvexWideEvent {
  // Identifiers & Correlation
  timestamp: string;
  trace_id: string;
  function_name: string;
  function_type: "mutation" | "action" | "query";

  // User context
  user_id: string | null;
  space_id: string | null;

  // Client context
  client_source?: ClientSource;
  client_version?: string;

  // Service context
  service_version?: string;

  // Execution
  duration_ms: number;
  outcome: "success" | "error";

  // Error details (if error)
  error?: {
    type: string;
    code: string;
    message: string;
    retriable: boolean;
  };

  // Business context (populated by function)
  context?: Record<string, unknown>;
}

/** Options for creating a wide event */
export interface WideEventOptions {
  traceId?: string;
  clientSource?: ClientSource;
  clientVersion?: string;
}

/** Error info for wide event logging */
export interface WideEventError {
  type: string;
  code: string;
  message: string;
  retriable: boolean;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique trace ID for correlating related operations.
 * Format: `trace_<timestamp>_<random>`
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `trace_${timestamp}_${random}`;
}

/**
 * Extract domain from a URL for logging context.
 * Returns null if URL is invalid.
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
 * Get service version from environment.
 * In Convex, this could be the deployment name or a custom version.
 */
function getServiceVersion(): string | undefined {
  // Convex doesn't expose deployment info in runtime, but you could
  // set this via environment variable during deploy
  return process.env.CONVEX_DEPLOYMENT ?? undefined;
}

// ============================================================================
// Wide Event Builder
// ============================================================================

/**
 * Create a wide event builder for tracking a function execution.
 * Call `success()` or `error()` to emit the final event.
 *
 * @example
 * ```ts
 * const event = createWideEvent("saves.create", "mutation", {
 *   userId: user.userId,
 *   spaceId: space._id,
 *   clientSource: args.clientSource,
 * });
 *
 * try {
 *   // ... do work ...
 *   event.success({ url_domain: "github.com", tag_count: 2 });
 * } catch (err) {
 *   event.error(err);
 *   throw err;
 * }
 * ```
 */
export function createWideEvent(
  functionName: string,
  functionType: "mutation" | "action" | "query",
  options: {
    userId?: string | null;
    spaceId?: string | null;
    traceId?: string;
    clientSource?: ClientSource;
    clientVersion?: string;
  } = {}
) {
  const startTime = Date.now();
  const traceId = options.traceId ?? generateTraceId();

  const baseEvent: Omit<ConvexWideEvent, "duration_ms" | "outcome"> = {
    timestamp: new Date().toISOString(),
    trace_id: traceId,
    function_name: functionName,
    function_type: functionType,
    user_id: options.userId ?? null,
    space_id: options.spaceId ?? null,
    client_source: options.clientSource,
    client_version: options.clientVersion,
    service_version: getServiceVersion(),
  };

  return {
    /** Get the trace ID for passing to downstream operations */
    traceId,

    /**
     * Log a successful execution with optional business context.
     */
    success(context?: Record<string, unknown>) {
      const event: ConvexWideEvent = {
        ...baseEvent,
        duration_ms: Date.now() - startTime,
        outcome: "success",
        context,
      };
      logWideEvent(event);
    },

    /**
     * Log a failed execution with error details.
     */
    error(err: unknown, context?: Record<string, unknown>) {
      const errorInfo = parseError(err);
      const event: ConvexWideEvent = {
        ...baseEvent,
        duration_ms: Date.now() - startTime,
        outcome: "error",
        error: errorInfo,
        context,
      };
      logWideEvent(event);
    },
  };
}

/**
 * Parse an error into structured error info for logging.
 */
function parseError(err: unknown): WideEventError {
  if (err instanceof Error) {
    // Check for ConvexError with code
    const convexErr = err as Error & { data?: { code?: string } };
    const code = convexErr.data?.code ?? "UNKNOWN";

    return {
      type: err.constructor.name,
      code,
      message: err.message,
      retriable: isRetriableError(code),
    };
  }

  return {
    type: "Unknown",
    code: "UNKNOWN",
    message: String(err),
    retriable: false,
  };
}

/**
 * Determine if an error code indicates a retriable error.
 */
function isRetriableError(code: string): boolean {
  const retriableCodes = ["TIMEOUT", "RATE_LIMITED", "UNAVAILABLE", "NETWORK_ERROR"];
  return retriableCodes.includes(code);
}

/**
 * Emit a wide event to the Convex logs.
 * Uses console.log with JSON for structured logging.
 */
function logWideEvent(event: ConvexWideEvent) {
  // Use a prefix for easy filtering in Convex dashboard
  console.log(`[wide_event] ${JSON.stringify(event)}`);
}

// ============================================================================
// Helper for extracting user context from Convex ctx
// ============================================================================

/**
 * Extract user ID from Convex mutation/query context.
 * Returns null if not authenticated.
 */
export async function getUserIdFromCtx(
  ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Clerk user ID is in the subject field
  return identity.subject ?? null;
}
