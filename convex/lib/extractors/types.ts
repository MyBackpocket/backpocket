"use node";

/**
 * Shared types for domain-specific content extractors
 */

export interface ExtractedContent {
  title: string;
  byline: string | null;
  content: string;
  textContent: string;
  excerpt: string;
  siteName: string;
  language: string | null;
}
