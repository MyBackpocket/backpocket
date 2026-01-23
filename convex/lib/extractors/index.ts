"use node";

/**
 * Domain-specific content extractors registry
 *
 * This module provides specialized extractors for sites that don't work well
 * with Mozilla Readability (Twitter, Reddit, etc.)
 */

// Re-export types
export type { ExtractedContent } from "./types";

// Re-export utilities (for use by snapshot_processor)
export { escapeHtml, formatBylineDate, generateExcerpt } from "./utils";

// Import extractors
import { extractReddit, isRedditUrl } from "./reddit";
import { extractTweet, isTwitterUrl } from "./twitter";
import type { ExtractedContent } from "./types";

// =============================================================================
// Domain Handler Registry
// =============================================================================

interface DomainHandler {
  matcher: (url: string) => boolean;
  extractor: (url: string) => Promise<ExtractedContent | null>;
}

/**
 * Registry of domain-specific extractors
 * Order matters - first match wins
 */
const DOMAIN_HANDLERS: DomainHandler[] = [
  {
    matcher: isTwitterUrl,
    extractor: extractTweet,
  },
  {
    matcher: isRedditUrl,
    extractor: extractReddit,
  },
];

// =============================================================================
// Public API
// =============================================================================

/**
 * Get a domain-specific extractor for a URL, if one exists
 * Returns null if no specialized handler is registered for this domain
 */
export function getDomainExtractor(
  url: string
): ((url: string) => Promise<ExtractedContent | null>) | null {
  for (const handler of DOMAIN_HANDLERS) {
    if (handler.matcher(url)) {
      return handler.extractor;
    }
  }
  return null;
}

/**
 * Check if a URL has a domain-specific extractor available
 */
export function hasDomainExtractor(url: string): boolean {
  return getDomainExtractor(url) !== null;
}

// Re-export individual matchers for direct use if needed
export { isRedditUrl, isTwitterUrl };
