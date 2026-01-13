"use node";

/**
 * Snapshot processing action using Mozilla Readability + linkedom
 * This file uses Node.js runtime to access npm packages
 */

import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

// Constants
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB max content
const MAX_TEXT_LENGTH = 500_000; // 500k characters
const EXCERPT_LENGTH = 500;
const FETCH_TIMEOUT_MS = 15_000; // 15 seconds

// Blocked domains/patterns for SSRF protection
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
];

const BLOCKED_HOSTNAME_PREFIXES = [
  "10.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.20.",
  "172.21.",
  "172.22.",
  "172.23.",
  "172.24.",
  "172.25.",
  "172.26.",
  "172.27.",
  "172.28.",
  "172.29.",
  "172.30.",
  "172.31.",
  "192.168.",
];

const BLOCKED_HOSTNAME_SUFFIXES = [".local", ".internal", ".localhost"];

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  if (BLOCKED_HOSTNAME_PREFIXES.some((p) => lower.startsWith(p))) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some((s) => lower.endsWith(s))) return true;
  return false;
}

/**
 * Process a URL and extract readable content using Mozilla Readability
 */
export const processSnapshotNode = internalAction({
  args: {
    saveId: v.id("saves"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Mark as processing
    await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
      saveId: args.saveId,
      status: "processing",
    });

    try {
      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(args.url);
      } catch {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "invalid_url",
          errorMessage: "Invalid URL format",
        });
        return;
      }

      // Block private IPs (SSRF protection)
      if (isBlockedHostname(parsedUrl.hostname)) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "ssrf_blocked",
          errorMessage: "Private IP addresses are not allowed",
        });
        return;
      }

      // Fetch the page with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(args.url, {
          headers: {
            "User-Agent": "BackpocketBot/1.0 (+https://backpocket.my/bot; like Pocket)",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
          redirect: "follow",
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timeoutId);
        const message = error instanceof Error ? error.message : "Fetch failed";
        const isTimeout = message.includes("abort");
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: isTimeout ? "timeout" : "fetch_error",
          errorMessage: message,
        });
        return;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: response.status === 403 || response.status === 401 ? "forbidden" : "fetch_error",
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        });
        return;
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "not_html",
          errorMessage: `Content type is ${contentType}`,
        });
        return;
      }

      // Get content
      const html = await response.text();

      // Check size
      if (html.length > MAX_CONTENT_SIZE) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "too_large",
          errorMessage: `Content size ${html.length} exceeds limit`,
        });
        return;
      }

      // Parse HTML with linkedom
      const { document } = parseHTML(html);

      // Set base URI for relative URL resolution
      Object.defineProperty(document, "baseURI", {
        value: response.url,
        writable: false,
      });

      // Check for noarchive meta tag
      const metaTags = document.querySelectorAll('meta[name="robots"]');
      for (const meta of metaTags) {
        const content = meta.getAttribute("content") || "";
        if (content.toLowerCase().includes("noarchive")) {
          await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
            saveId: args.saveId,
            status: "blocked",
            blockedReason: "noarchive",
            errorMessage: "Page has noarchive meta tag",
          });
          return;
        }
      }

      // Extract content with Readability
      const reader = new Readability(document, {
        charThreshold: 100,
        keepClasses: false,
      });

      const article = reader.parse();

      if (!article) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "parse_failed",
          errorMessage: "Readability could not extract content",
        });
        return;
      }

      // Process text content (truncate if too long)
      let textContent = article.textContent || "";
      if (textContent.length > MAX_TEXT_LENGTH) {
        textContent = `${textContent.slice(0, MAX_TEXT_LENGTH)}...`;
      }

      // Generate excerpt
      let excerpt = article.excerpt || "";
      if (!excerpt && textContent) {
        excerpt = textContent.slice(0, EXCERPT_LENGTH);
        const lastSpace = excerpt.lastIndexOf(" ");
        if (lastSpace > EXCERPT_LENGTH * 0.8) {
          excerpt = `${excerpt.slice(0, lastSpace)}...`;
        } else if (textContent.length > EXCERPT_LENGTH) {
          excerpt = `${excerpt}...`;
        }
      }

      // Extract site name
      const ogSiteName = document
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content");
      const twitterSite = document
        .querySelector('meta[name="twitter:site"]')
        ?.getAttribute("content");
      const siteName = article.siteName || ogSiteName || twitterSite || null;

      // Extract og:image for save thumbnail
      const ogImage = document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content");
      const twitterImage = document
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute("content");
      let imageUrl = ogImage || twitterImage || null;

      // Resolve relative image URLs
      if (imageUrl && !imageUrl.startsWith("http")) {
        try {
          imageUrl = new URL(imageUrl, response.url).toString();
        } catch {
          imageUrl = null;
        }
      }

      // Extract meta description for save description
      const ogDesc = document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content");
      const twitterDesc = document
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute("content");
      const metaDesc = document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content");
      const metaDescription = ogDesc || twitterDesc || metaDesc || null;

      // Detect language
      const htmlLang = document.documentElement?.getAttribute("lang");
      const metaLang = document
        .querySelector('meta[http-equiv="content-language"]')
        ?.getAttribute("content");
      const language = htmlLang || metaLang || article.lang || null;

      // Calculate word count
      const wordCount = textContent
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      // Calculate content hash
      const encoder = new TextEncoder();
      const data = encoder.encode(article.content || "");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentSha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Build update object - only include non-null optional fields
      // (Convex v.optional(v.string()) doesn't accept null, only undefined/omitted)
      const updateArgs: Parameters<typeof internal.snapshots.updateSnapshotStatus>[0] = {
        saveId: args.saveId,
        status: "ready",
        fetchedAt: Date.now(),
        canonicalUrl: response.url,
        excerpt,
        wordCount,
        contentHtml: article.content || "",
        contentText: textContent,
        contentSha256,
      };

      // Only add optional string fields if they have values
      if (article.title) updateArgs.title = article.title;
      if (article.byline) updateArgs.byline = article.byline;
      if (siteName) updateArgs.siteName = siteName;
      if (language) updateArgs.language = language;

      await ctx.runMutation(internal.snapshots.updateSnapshotStatus, updateArgs);

      // Also update the save's metadata (title, description, siteName, imageUrl)
      // This backfills the save with extracted metadata from the page
      const saveMetadataArgs: Parameters<typeof internal.saves.updateSaveMetadata>[0] = {
        saveId: args.saveId,
      };
      if (article.title) saveMetadataArgs.title = article.title;
      if (metaDescription) saveMetadataArgs.description = metaDescription;
      if (siteName) saveMetadataArgs.siteName = siteName;
      if (imageUrl) saveMetadataArgs.imageUrl = imageUrl;

      await ctx.runMutation(internal.saves.updateSaveMetadata, saveMetadataArgs);
    } catch (error) {
      console.error("[snapshots] Processing error:", error);
      await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
        saveId: args.saveId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});
