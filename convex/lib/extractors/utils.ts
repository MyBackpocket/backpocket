"use node";

/**
 * Shared utility functions for domain extractors
 */

export const EXCERPT_LENGTH = 250;

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate an excerpt from text, truncating at word boundaries
 */
export function generateExcerpt(text: string, maxLength = EXCERPT_LENGTH): string {
  let excerpt = text.trim();
  if (excerpt.length > maxLength) {
    excerpt = excerpt.slice(0, maxLength);
    const lastSpace = excerpt.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.8) {
      excerpt = `${excerpt.slice(0, lastSpace)}...`;
    } else {
      excerpt = `${excerpt}...`;
    }
  }
  return excerpt;
}

/**
 * Format a date for display in bylines
 */
export function formatBylineDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
