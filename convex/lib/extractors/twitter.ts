"use node";

/**
 * Twitter/X content extractor
 * Extracts tweet content using oEmbed API with FxTwitter fallback
 */

import { parseHTML } from "linkedom";
import type { ExtractedContent } from "./types";
import { EXCERPT_LENGTH, escapeHtml, formatBylineDate } from "./utils";

// =============================================================================
// Constants & Patterns
// =============================================================================

// Twitter epoch: November 4, 2010 at 01:42:54.657 UTC
const TWITTER_EPOCH = BigInt("1288834974657");

// URL patterns for X/Twitter posts
const TWITTER_TWEET_PATTERNS = [
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/i,
  /^https?:\/\/(?:mobile\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/i,
];

// X Articles use /article/ instead of /status/
const TWITTER_ARTICLE_PATTERN =
  /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/article\/(\d+)/i;

// Twitter oEmbed API endpoint
const TWITTER_OEMBED_URL = "https://publish.twitter.com/oembed";

// Content that indicates we got an error/login page instead of actual content
const TWITTER_ERROR_PAGE_INDICATORS = [
  /^log\s*in$/i,
  /^sign\s*up$/i,
  /^something went wrong/i,
  /^tweet$/i, // Generic "Tweet" title without username
];

// =============================================================================
// Types
// =============================================================================

interface TwitterUrlInfo {
  username: string;
  tweetId: string;
}

interface TwitterOEmbedResponse {
  url: string;
  author_name: string;
  author_url: string;
  html: string;
  provider_name: string;
  provider_url: string;
}

// =============================================================================
// URL Utilities
// =============================================================================

/**
 * Check if a URL is from X/Twitter
 */
export function isTwitterUrl(url: string): boolean {
  return (
    TWITTER_TWEET_PATTERNS.some((pattern) => pattern.test(url)) ||
    TWITTER_ARTICLE_PATTERN.test(url)
  );
}

/**
 * Parse an X/Twitter URL to extract username and tweet ID
 */
function parseTwitterUrl(url: string): TwitterUrlInfo | null {
  for (const pattern of TWITTER_TWEET_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        username: match[1],
        tweetId: match[2],
      };
    }
  }

  // Also handle article URLs
  const articleMatch = url.match(TWITTER_ARTICLE_PATTERN);
  if (articleMatch) {
    return {
      username: articleMatch[1],
      tweetId: articleMatch[2],
    };
  }

  return null;
}

/**
 * Extract timestamp from a Twitter/X Snowflake ID
 */
function getDateFromSnowflakeId(id: string): Date | null {
  try {
    const snowflakeId = BigInt(id);
    // Timestamp is in the upper 41 bits (shift right 22 bits)
    const timestampMs = (snowflakeId >> BigInt(22)) + TWITTER_EPOCH;
    const date = new Date(Number(timestampMs));

    // Sanity check: date should be between Twitter's launch (2006) and far future
    if (date.getFullYear() < 2006 || date.getFullYear() > 2100) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is an X Article (not a regular tweet)
 */
function isArticleUrl(url: string): boolean {
  return TWITTER_ARTICLE_PATTERN.test(url);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a descriptive title from username and tweet content
 */
function generateTweetTitle(username: string, content: string): string {
  const baseTitle = `Tweet by @${username}`;

  if (!content || content.trim().length === 0) {
    return baseTitle;
  }

  const trimmedContent = content.trim();
  const maxLength = 50;

  if (trimmedContent.length <= maxLength) {
    return `${baseTitle}: ${trimmedContent}`;
  }

  // Truncate at word boundary
  let truncated = trimmedContent.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.7) {
    truncated = truncated.slice(0, lastSpace);
  }

  return `${baseTitle}: ${truncated}...`;
}

/**
 * Check if content appears to be from an error/login page
 */
function isTwitterErrorPageContent(content: string | null | undefined): boolean {
  if (!content) return true;
  const trimmed = content.trim();
  if (trimmed.length === 0) return true;
  return TWITTER_ERROR_PAGE_INDICATORS.some((pattern) => pattern.test(trimmed));
}

/**
 * Extract tweet text from oEmbed HTML response
 */
function extractTweetTextFromHtml(html: string): string {
  try {
    const { document } = parseHTML(html);

    const blockquote = document.querySelector("blockquote");
    if (!blockquote) {
      return "";
    }

    const paragraphs = blockquote.querySelectorAll("p");
    const textParts: string[] = [];

    for (const p of paragraphs) {
      const text = p.textContent?.trim();
      if (text) {
        textParts.push(text);
      }
    }

    return textParts.join("\n\n");
  } catch {
    return "";
  }
}

// =============================================================================
// Extraction Methods
// =============================================================================

/**
 * Try to extract tweet via Twitter's official oEmbed API
 */
async function tryTwitterOEmbed(url: string): Promise<ExtractedContent | null> {
  try {
    const oembedUrl = new URL(TWITTER_OEMBED_URL);
    oembedUrl.searchParams.set("url", url);
    oembedUrl.searchParams.set("omit_script", "true");

    const response = await fetch(oembedUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as TwitterOEmbedResponse;
    const tweetText = extractTweetTextFromHtml(data.html);

    if (!tweetText) {
      return null;
    }

    // Build excerpt
    let excerpt = tweetText;
    if (excerpt.length > EXCERPT_LENGTH) {
      excerpt = excerpt.slice(0, EXCERPT_LENGTH);
      const lastSpace = excerpt.lastIndexOf(" ");
      if (lastSpace > EXCERPT_LENGTH * 0.8) {
        excerpt = `${excerpt.slice(0, lastSpace)}...`;
      } else {
        excerpt = `${excerpt}...`;
      }
    }

    // Extract username from author URL
    const usernameMatch = data.author_url.match(/(?:twitter\.com|x\.com)\/(\w+)/i);
    const username = usernameMatch ? usernameMatch[1] : data.author_name;

    // Extract tweet date from Snowflake ID
    const tweetInfo = parseTwitterUrl(url);
    const tweetDate = tweetInfo ? getDateFromSnowflakeId(tweetInfo.tweetId) : null;
    const dateStr = tweetDate ? ` · ${formatBylineDate(tweetDate)}` : "";

    // Build readable HTML content
    const paragraphs = tweetText.split("\n\n").filter((p) => p.trim());
    const content =
      paragraphs.length > 0 ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n") : "";

    const bylineHtml = `<a href="${data.author_url}" rel="noopener noreferrer" target="_blank">@${username}</a>${dateStr}`;

    return {
      title: generateTweetTitle(username, tweetText),
      byline: bylineHtml,
      content,
      textContent: tweetText,
      excerpt,
      siteName: data.provider_name || "Twitter",
      language: null,
    };
  } catch {
    return null;
  }
}

/**
 * Try to extract tweet via FxTwitter (fallback)
 */
async function tryFxTwitter(url: string): Promise<ExtractedContent | null> {
  const tweetInfo = parseTwitterUrl(url);
  if (!tweetInfo) {
    return null;
  }

  try {
    const fxUrl = `https://fxtwitter.com/${tweetInfo.username}/status/${tweetInfo.tweetId}`;

    const response = await fetch(fxUrl, {
      headers: {
        "User-Agent": "bot",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const { document } = parseHTML(html);

    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const ogDescription = document
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content");
    const ogSiteName = document
      .querySelector('meta[property="og:site_name"]')
      ?.getAttribute("content");

    if (
      !ogDescription ||
      isTwitterErrorPageContent(ogDescription) ||
      isTwitterErrorPageContent(ogTitle)
    ) {
      return null;
    }

    // Build excerpt
    let excerpt = ogDescription;
    if (excerpt.length > EXCERPT_LENGTH) {
      excerpt = excerpt.slice(0, EXCERPT_LENGTH);
      const lastSpace = excerpt.lastIndexOf(" ");
      if (lastSpace > EXCERPT_LENGTH * 0.8) {
        excerpt = `${excerpt.slice(0, lastSpace)}...`;
      } else {
        excerpt = `${excerpt}...`;
      }
    }

    const paragraphs = ogDescription.split("\n\n").filter((p) => p.trim());
    const content =
      paragraphs.length > 0 ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n") : "";

    const tweetDate = getDateFromSnowflakeId(tweetInfo.tweetId);
    const dateStr = tweetDate ? ` · ${formatBylineDate(tweetDate)}` : "";

    const authorUrl = `https://twitter.com/${tweetInfo.username}`;
    const bylineHtml = `<a href="${authorUrl}" rel="noopener noreferrer" target="_blank">@${tweetInfo.username}</a>${dateStr}`;

    return {
      title: generateTweetTitle(tweetInfo.username, ogDescription),
      byline: bylineHtml,
      content,
      textContent: ogDescription,
      excerpt,
      siteName: ogSiteName || "Twitter",
      language: null,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Main Export
// =============================================================================

/**
 * Extract tweet content from a Twitter/X URL
 * Tries oEmbed first, falls back to FxTwitter
 */
export async function extractTweet(url: string): Promise<ExtractedContent | null> {
  // X Articles (/article/) are not supported - they require authentication
  if (isArticleUrl(url)) {
    const match = url.match(TWITTER_ARTICLE_PATTERN);
    const username = match ? match[1] : "unknown";
    const articleId = match ? match[2] : null;

    const articleDate = articleId ? getDateFromSnowflakeId(articleId) : null;
    const dateStr = articleDate ? ` · ${formatBylineDate(articleDate)}` : "";

    return {
      title: `X Article by @${username}`,
      byline: `<a href="https://x.com/${username}" rel="noopener noreferrer" target="_blank">@${username}</a>${dateStr}`,
      content: `<p>X Articles require authentication and cannot be snapshotted. <a href="${url}" rel="noopener noreferrer" target="_blank">View the original article on X</a>.</p>`,
      textContent: "X Articles require authentication and cannot be snapshotted.",
      excerpt: "X Articles require authentication and cannot be snapshotted.",
      siteName: "X",
      language: null,
    };
  }

  // Try Twitter oEmbed API first (official, most reliable)
  const oembedResult = await tryTwitterOEmbed(url);
  if (oembedResult) {
    return oembedResult;
  }

  // Fall back to FxTwitter
  const fxResult = await tryFxTwitter(url);
  if (fxResult) {
    return fxResult;
  }

  return null;
}
