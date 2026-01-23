"use node";

/**
 * Snapshot processing action using Mozilla Readability + linkedom
 * This file uses Node.js runtime to access npm packages
 */

import { Readability } from "@mozilla/readability";
import { v } from "convex/values";
import { parseHTML } from "linkedom";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { getDomainExtractor } from "./extractors";
import { createWideEvent, extractDomain, generateTraceId } from "./logger";

// Constants
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB max content
const MAX_TEXT_LENGTH = 500_000; // 500k characters
const EXCERPT_LENGTH = 500;
const FETCH_TIMEOUT_MS = 15_000; // 15 seconds

// Blocked domains/patterns for SSRF protection
const BLOCKED_HOSTNAMES = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"];

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
    traceId: v.optional(v.string()), // For correlating with saves.create
  },
  handler: async (ctx, args) => {
    // Use provided traceId or generate one (for manual snapshot requests)
    const traceId = args.traceId ?? generateTraceId();
    const urlDomain = extractDomain(args.url);

    // Create wide event for observability
    const event = createWideEvent("snapshots.processSnapshot", "action", {
      traceId,
      // spaceId will be set after we fetch the snapshot record if needed
    });

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
        event.error(new Error("Invalid URL format"), {
          url_domain: urlDomain,
          blocked_reason: "invalid_url",
          save_id: args.saveId,
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
        event.error(new Error("SSRF blocked"), {
          url_domain: urlDomain,
          blocked_reason: "ssrf_blocked",
          save_id: args.saveId,
        });
        return;
      }

      // Check for domain-specific extractor (Reddit, Twitter, etc.)
      // These sites don't work well with standard Readability parsing
      const domainExtractor = getDomainExtractor(args.url);
      if (domainExtractor) {
        try {
          const domainResult = await domainExtractor(args.url);
          if (domainResult) {
            // Calculate content hash
            const encoder = new TextEncoder();
            const data = encoder.encode(domainResult.content);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const contentSha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

            // Calculate word count
            const wordCount = domainResult.textContent
              .split(/\s+/)
              .filter((word) => word.length > 0).length;

            // Update snapshot with extracted content
            await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
              saveId: args.saveId,
              status: "ready",
              fetchedAt: Date.now(),
              canonicalUrl: args.url,
              excerpt: domainResult.excerpt,
              wordCount,
              contentHtml: domainResult.content,
              contentText: domainResult.textContent,
              contentSha256,
              title: domainResult.title,
              ...(domainResult.byline && { byline: domainResult.byline }),
              siteName: domainResult.siteName,
              ...(domainResult.language && { language: domainResult.language }),
            });

            // Update save metadata
            await ctx.runMutation(internal.saves.updateSaveMetadata, {
              saveId: args.saveId,
              title: domainResult.title,
              siteName: domainResult.siteName,
            });

            event.success({
              url_domain: urlDomain,
              save_id: args.saveId,
              extractor: "domain_specific",
              word_count: wordCount,
              had_readability_content: true,
            });
            return;
          }
          // Domain extractor returned null, fall through to standard flow
          console.log(
            `[snapshots] Domain extractor for ${parsedUrl.hostname} returned null, falling back to Readability`
          );
        } catch (error) {
          // Domain extractor threw an error, fall through to standard flow
          console.error(`[snapshots] Domain extractor error for ${parsedUrl.hostname}:`, error);
        }
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
        const blockedReason = isTimeout ? "timeout" : "fetch_error";
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason,
          errorMessage: message,
        });
        event.error(error instanceof Error ? error : new Error(message), {
          url_domain: urlDomain,
          blocked_reason: blockedReason,
          save_id: args.saveId,
        });
        return;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        const blockedReason =
          response.status === 403 || response.status === 401 ? "forbidden" : "fetch_error";
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        });
        event.error(new Error(`HTTP ${response.status}`), {
          url_domain: urlDomain,
          blocked_reason: blockedReason,
          http_status: response.status,
          save_id: args.saveId,
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
        event.error(new Error("Not HTML content"), {
          url_domain: urlDomain,
          blocked_reason: "not_html",
          content_type: contentType,
          save_id: args.saveId,
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
        event.error(new Error("Content too large"), {
          url_domain: urlDomain,
          blocked_reason: "too_large",
          content_size: html.length,
          save_id: args.saveId,
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
          event.error(new Error("Page has noarchive meta tag"), {
            url_domain: urlDomain,
            blocked_reason: "noarchive",
            save_id: args.saveId,
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
        event.error(new Error("Readability parse failed"), {
          url_domain: urlDomain,
          blocked_reason: "parse_failed",
          save_id: args.saveId,
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
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
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
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
      const metaDescription = ogDesc || twitterDesc || metaDesc || null;

      // Detect language
      const htmlLang = document.documentElement?.getAttribute("lang");
      const metaLang = document
        .querySelector('meta[http-equiv="content-language"]')
        ?.getAttribute("content");
      const language = htmlLang || metaLang || article.lang || null;

      // Calculate word count
      const wordCount = textContent.split(/\s+/).filter((word) => word.length > 0).length;

      // Calculate content hash
      const encoder = new TextEncoder();
      const data = encoder.encode(article.content || "");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentSha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Build update object - only include non-null optional fields
      // (Convex v.optional(v.string()) doesn't accept null, only undefined/omitted)
      await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
        saveId: args.saveId,
        status: "ready",
        fetchedAt: Date.now(),
        canonicalUrl: response.url,
        excerpt,
        wordCount,
        contentHtml: article.content || "",
        contentText: textContent,
        contentSha256,
        ...(article.title && { title: article.title }),
        ...(article.byline && { byline: article.byline }),
        ...(siteName && { siteName }),
        ...(language && { language }),
      });

      // Also update the save's metadata (title, description, siteName, imageUrl)
      // This backfills the save with extracted metadata from the page
      await ctx.runMutation(internal.saves.updateSaveMetadata, {
        saveId: args.saveId,
        ...(article.title && { title: article.title }),
        ...(metaDescription && { description: metaDescription }),
        ...(siteName && { siteName }),
        ...(imageUrl && { imageUrl }),
      });

      // Log success with processing metrics
      event.success({
        url_domain: urlDomain,
        save_id: args.saveId,
        extractor: "readability",
        content_type: contentType,
        word_count: wordCount,
        had_readability_content: true,
        has_title: !!article.title,
        has_image: !!imageUrl,
        language: language ?? undefined,
      });
    } catch (error) {
      console.error("[snapshots] Processing error:", error);
      await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
        saveId: args.saveId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
      event.error(error instanceof Error ? error : new Error("Unknown error"), {
        url_domain: urlDomain,
        save_id: args.saveId,
      });
    }
  },
});
