/**
 * Duplicate Save Error Detection
 *
 * Utilities for detecting and handling duplicate save errors from Convex.
 */

import { ConvexError } from "convex/values";
import type { DuplicateSaveInfo } from "@/lib/types";

/**
 * Check if an error is a duplicate save error
 * Returns the existing save info if it is, or null if it's not
 *
 * Convex throws errors with structure:
 * ConvexError { data: { code: "CONFLICT", message: "...", existingSave: {...} } }
 */
export function getDuplicateSaveFromError(error: unknown): DuplicateSaveInfo | null {
  // Handle Convex errors
  if (error instanceof ConvexError) {
    const data = error.data as Record<string, unknown> | undefined;

    // Check for CONFLICT code with existingSave (Convex format)
    if (data?.code === "CONFLICT" && data?.existingSave) {
      return data.existingSave as DuplicateSaveInfo;
    }

    // Legacy format: type === "DUPLICATE_SAVE"
    if (data?.type === "DUPLICATE_SAVE" && data?.existingSave) {
      return data.existingSave as DuplicateSaveInfo;
    }
  }

  // Handle standard Error objects with message containing JSON
  if (error instanceof Error) {
    const msg = error.message;

    // Check for CONFLICT or duplicate indicators in the message
    if (
      msg.includes('"code":"CONFLICT"') ||
      msg.includes("already") ||
      msg.includes("duplicate")
    ) {
      // Try to parse existingSave from the message JSON
      try {
        // Match existingSave object in the message
        const existingSaveMatch = msg.match(/"existingSave"\s*:\s*(\{[^}]+\})/);
        if (existingSaveMatch) {
          const parsed = JSON.parse(existingSaveMatch[1]);
          return {
            id: String(parsed.id || ""),
            url: String(parsed.url || ""),
            title: parsed.title ?? null,
            imageUrl: parsed.imageUrl ?? null,
            siteName: parsed.siteName ?? null,
            savedAt: parsed.savedAt ?? Date.now(),
          };
        }

        // Try to parse the entire message as JSON
        const jsonMatch = msg.match(/\{.*"code"\s*:\s*"CONFLICT".*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.existingSave) {
            return {
              id: String(parsed.existingSave.id || ""),
              url: String(parsed.existingSave.url || ""),
              title: parsed.existingSave.title ?? null,
              imageUrl: parsed.existingSave.imageUrl ?? null,
              siteName: parsed.existingSave.siteName ?? null,
              savedAt: parsed.existingSave.savedAt ?? Date.now(),
            };
          }
        }
      } catch {
        // JSON parsing failed, continue to fallback
      }

      // Return a minimal indicator that it's a duplicate
      return {
        id: "",
        url: "",
        title: null,
        imageUrl: null,
        siteName: null,
        savedAt: Date.now(),
      };
    }
  }

  // Last resort: check if error has any shape we can work with
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;

    // Check for data property (common in Convex errors)
    if (obj.data && typeof obj.data === "object") {
      const data = obj.data as Record<string, unknown>;
      if (data.code === "CONFLICT" && data.existingSave) {
        const existing = data.existingSave as Record<string, unknown>;
        return {
          id: String(existing.id || ""),
          url: String(existing.url || ""),
          title: (existing.title as string) ?? null,
          imageUrl: (existing.imageUrl as string) ?? null,
          siteName: (existing.siteName as string) ?? null,
          savedAt: (existing.savedAt as string | number) ?? Date.now(),
        };
      }
    }
  }

  return null;
}
