import { getDateFromSnowflakeId, parseTwitterUrl } from "@backpocket/utils";
import { type NextRequest, NextResponse } from "next/server";
import { createApiRouteEvent } from "@/lib/logger";

const FETCH_TIMEOUT_MS = 8000; // 8 second timeout for preview

// ============================================================================
// Twitter/X oEmbed Support
// ============================================================================

const TWITTER_OEMBED_URL = "https://publish.twitter.com/oembed";

interface TwitterOEmbedResponse {
  author_name: string;
  author_url: string;
  html: string;
}

function isTwitterUrl(url: string): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return (
    hostname === "twitter.com" ||
    hostname === "x.com" ||
    hostname === "www.twitter.com" ||
    hostname === "www.x.com" ||
    hostname === "mobile.twitter.com" ||
    hostname === "mobile.x.com"
  );
}

function extractTweetTextFromHtml(html: string): string {
  // The oEmbed HTML is a blockquote - extract text content
  // Simple regex extraction since we don't have DOM parsing in edge runtime
  const paragraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  if (!paragraphMatch) return "";

  return paragraphMatch
    .map((p) => p.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .join("\n\n");
}

function formatTweetDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // For recent tweets, show relative time
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "just now" : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  // For older tweets, show the date
  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function generateTweetTitle(username: string, content: string, date: Date | null): string {
  const dateStr = date ? ` · ${formatTweetDate(date)}` : "";
  const baseTitle = `@${username}${dateStr}`;

  if (!content || content.trim().length === 0) {
    return `Post by ${baseTitle}`;
  }

  const trimmed = content.trim();
  const maxLength = 60;

  if (trimmed.length <= maxLength) {
    return `${baseTitle}: ${trimmed}`;
  }

  let truncated = trimmed.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.7) {
    truncated = truncated.slice(0, lastSpace);
  }

  return `${baseTitle}: ${truncated}...`;
}

async function unfurlTwitterUrl(url: string): Promise<{
  title: string | null;
  description: string | null;
  siteName: string;
  imageUrl: string | null;
  favicon: string;
} | null> {
  try {
    // Try Twitter oEmbed API
    const oembedUrl = new URL(TWITTER_OEMBED_URL);
    oembedUrl.searchParams.set("url", url);
    oembedUrl.searchParams.set("omit_script", "true");

    const response = await fetch(oembedUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      // Fall back to basic info from URL parsing
      const twitterInfo = parseTwitterUrl(url);
      if (twitterInfo) {
        const date = getDateFromSnowflakeId(twitterInfo.tweetId);
        const dateStr = date
          ? ` · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
          : "";
        return {
          title: `X post by @${twitterInfo.username}${dateStr}`,
          description: null,
          siteName: "X",
          imageUrl: null,
          favicon: "https://www.google.com/s2/favicons?domain=x.com&sz=64",
        };
      }
      return null;
    }

    const data = (await response.json()) as TwitterOEmbedResponse;
    const tweetText = extractTweetTextFromHtml(data.html);

    // Extract username from author_url
    const usernameMatch = data.author_url.match(/(?:twitter\.com|x\.com)\/(\w+)/i);
    const username = usernameMatch ? usernameMatch[1] : data.author_name;

    // Get date from tweet ID
    const twitterInfo = parseTwitterUrl(url);
    const tweetDate = twitterInfo ? getDateFromSnowflakeId(twitterInfo.tweetId) : null;

    return {
      title: generateTweetTitle(username, tweetText, tweetDate),
      description: tweetText || null,
      siteName: "X",
      imageUrl: null, // Twitter oEmbed doesn't provide images
      favicon: "https://www.google.com/s2/favicons?domain=x.com&sz=64",
    };
  } catch {
    // On error, try to generate basic info from URL
    const twitterInfo = parseTwitterUrl(url);
    if (twitterInfo) {
      const date = getDateFromSnowflakeId(twitterInfo.tweetId);
      const dateStr = date
        ? ` · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
        : "";
      return {
        title: `X post by @${twitterInfo.username}${dateStr}`,
        description: null,
        siteName: "X",
        imageUrl: null,
        favicon: "https://www.google.com/s2/favicons?domain=x.com&sz=64",
      };
    }
    return null;
  }
}

// ============================================================================
// Reddit Support
// ============================================================================

const REDDIT_DOMAINS = [
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "new.reddit.com",
  "np.reddit.com",
  "m.reddit.com",
];

// Post URL pattern: /r/subreddit/comments/postId/title_slug/
const REDDIT_POST_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m)\.)?reddit\.com\/r\/(\w+)\/comments\/(\w+)(?:\/([^/?#]+))?/i;

// Comment URL pattern
const REDDIT_COMMENT_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m)\.)?reddit\.com\/r\/(\w+)\/comments\/(\w+)\/([^/?]+)\/(\w+)/i;

// Subreddit URL pattern
const REDDIT_SUBREDDIT_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m)\.)?reddit\.com\/r\/(\w+)\/?(?:\?.*)?$/i;

// User URL pattern
const REDDIT_USER_PATTERN =
  /^https?:\/\/(?:(?:www|old|new|np|m)\.)?reddit\.com\/u(?:ser)?\/([^/?]+)/i;

function isRedditUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname === "redd.it") return true;
    return REDDIT_DOMAINS.some((domain) => hostname === domain);
  } catch {
    return false;
  }
}

interface RedditPostData {
  title: string;
  selftext?: string;
  author: string;
  subreddit: string;
  created_utc: number;
  thumbnail?: string;
  url?: string;
  is_self: boolean;
}

function formatRedditDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? "just now" : `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function unfurlRedditUrl(url: string): Promise<{
  title: string | null;
  description: string | null;
  siteName: string;
  imageUrl: string | null;
  favicon: string;
} | null> {
  const favicon = "https://www.google.com/s2/favicons?domain=reddit.com&sz=64";

  try {
    // Check URL type and generate fallback title from URL
    const postMatch = url.match(REDDIT_POST_PATTERN);
    const commentMatch = url.match(REDDIT_COMMENT_PATTERN);
    const subredditMatch = url.match(REDDIT_SUBREDDIT_PATTERN);
    const userMatch = url.match(REDDIT_USER_PATTERN);

    // For subreddit pages, just return basic info
    if (subredditMatch && !postMatch) {
      return {
        title: `r/${subredditMatch[1]}`,
        description: `The ${subredditMatch[1]} community on Reddit`,
        siteName: "Reddit",
        imageUrl: null,
        favicon,
      };
    }

    // For user pages
    if (userMatch && !postMatch) {
      return {
        title: `u/${userMatch[1]}`,
        description: `${userMatch[1]}'s profile on Reddit`,
        siteName: "Reddit",
        imageUrl: null,
        favicon,
      };
    }

    // For posts and comments, try to fetch via Reddit JSON API
    if (postMatch || commentMatch) {
      const subreddit = postMatch?.[1] || commentMatch?.[1];
      const postId = postMatch?.[2] || commentMatch?.[2];
      const titleSlug = postMatch?.[3] || commentMatch?.[3] || "";

      // Try Reddit's JSON API
      const jsonUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}/${titleSlug}.json`;
      const response = await fetch(jsonUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Backpocket/1.0)",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const post = data?.[0]?.data?.children?.[0]?.data as RedditPostData | undefined;

        if (post) {
          const dateStr = formatRedditDate(post.created_utc);
          const prefix = `r/${post.subreddit} · ${dateStr}`;

          // Truncate title if too long
          let title = post.title;
          if (title.length > 80) {
            title = `${title.slice(0, 77)}...`;
          }

          // For comments, indicate it's a comment
          const isComment = !!commentMatch;
          const fullTitle = isComment ? `${prefix}: Comment on "${title}"` : `${prefix}: ${title}`;

          // Get description from selftext or generate from title
          const description = post.selftext
            ? post.selftext.slice(0, 200) + (post.selftext.length > 200 ? "..." : "")
            : null;

          // Get thumbnail if available and valid
          let imageUrl: string | null = null;
          if (
            post.thumbnail?.startsWith("http") &&
            !["self", "default", "nsfw", "spoiler"].includes(post.thumbnail)
          ) {
            imageUrl = post.thumbnail;
          }

          return {
            title: fullTitle,
            description,
            siteName: "Reddit",
            imageUrl,
            favicon,
          };
        }
      }

      // Fallback: generate title from URL
      const decodedSlug = titleSlug ? decodeURIComponent(titleSlug).replace(/_/g, " ") : "Post";
      return {
        title: `r/${subreddit}: ${decodedSlug}`,
        description: null,
        siteName: "Reddit",
        imageUrl: null,
        favicon,
      };
    }

    return null;
  } catch {
    // On error, try to extract info from URL
    const postMatch = url.match(REDDIT_POST_PATTERN);
    if (postMatch) {
      const subreddit = postMatch[1];
      const titleSlug = postMatch[3];
      const decodedSlug = titleSlug ? decodeURIComponent(titleSlug).replace(/_/g, " ") : "Post";
      return {
        title: `r/${subreddit}: ${decodedSlug}`,
        description: null,
        siteName: "Reddit",
        imageUrl: null,
        favicon,
      };
    }
    return null;
  }
}

// ============================================================================
// Generic HTML Unfurling
// ============================================================================

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

function extractMetaContent(html: string, selectors: string[]): string | null {
  for (const selector of selectors) {
    // Match meta tags with property or name attribute
    const regex = new RegExp(
      `<meta[^>]*(?:property|name)=["']${selector}["'][^>]*content=["']([^"']+)["']|<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${selector}["']`,
      "i"
    );
    const match = html.match(regex);
    if (match) {
      return match[1] || match[2] || null;
    }
  }
  return null;
}

function extractTitle(html: string): string | null {
  // Try OG title first
  const ogTitle = extractMetaContent(html, ["og:title"]);
  if (ogTitle) return ogTitle;

  // Try twitter title
  const twitterTitle = extractMetaContent(html, ["twitter:title"]);
  if (twitterTitle) return twitterTitle;

  // Fall back to title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function extractDescription(html: string): string | null {
  return (
    extractMetaContent(html, ["og:description"]) ||
    extractMetaContent(html, ["twitter:description"]) ||
    extractMetaContent(html, ["description"]) ||
    null
  );
}

function extractImage(html: string, baseUrl: string): string | null {
  const image =
    extractMetaContent(html, ["og:image"]) ||
    extractMetaContent(html, ["twitter:image"]) ||
    extractMetaContent(html, ["twitter:image:src"]) ||
    null;

  if (!image) return null;

  // Resolve relative URLs
  if (!image.startsWith("http")) {
    try {
      return new URL(image, baseUrl).toString();
    } catch {
      return null;
    }
  }

  return image;
}

function extractSiteName(html: string): string | null {
  return (
    extractMetaContent(html, ["og:site_name"]) ||
    extractMetaContent(html, ["application-name"]) ||
    null
  );
}

export async function POST(request: NextRequest) {
  const event = createApiRouteEvent("POST", "/api/unfurl");

  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      event.error(400, new Error("URL is required"));
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Set URL context for logging
    event.setUrlContext(url);

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      event.error(400, new Error("Invalid URL format"));
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // SSRF protection
    if (isBlockedHostname(parsedUrl.hostname)) {
      event.error(400, new Error("Blocked hostname (SSRF protection)"));
      return NextResponse.json({ error: "Blocked URL" }, { status: 400 });
    }

    // Handle Twitter/X URLs specially (they require oEmbed API)
    if (isTwitterUrl(url)) {
      const twitterResult = await unfurlTwitterUrl(url);
      if (twitterResult) {
        event.success(200, { extractor: "twitter_oembed" });
        return NextResponse.json(twitterResult);
      }
      // Fall through to generic handling if Twitter-specific fails
    }

    // Handle Reddit URLs specially (use JSON API for better metadata)
    if (isRedditUrl(url)) {
      const redditResult = await unfurlRedditUrl(url);
      if (redditResult) {
        event.success(200, { extractor: "reddit_json_api" });
        return NextResponse.json(redditResult);
      }
      // Fall through to generic handling if Reddit-specific fails
    }

    // Fetch the page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Backpocket/1.0; +https://backpocket.app)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!response.ok) {
        // Return basic info even on error
        const fallbackResult = {
          title: null,
          description: null,
          siteName: parsedUrl.hostname.replace(/^www\./, ""),
          imageUrl: null,
          favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        };
        event.fallback(200, { extractor: "fallback" }, `HTTP ${response.status}`);
        return NextResponse.json(fallbackResult);
      }

      // Only read first 100KB for metadata extraction
      const reader = response.body?.getReader();
      if (!reader) {
        const fallbackResult = {
          title: null,
          description: null,
          siteName: parsedUrl.hostname.replace(/^www\./, ""),
          imageUrl: null,
          favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        };
        event.fallback(200, { extractor: "fallback" }, "No response body");
        return NextResponse.json(fallbackResult);
      }

      let html = "";
      const decoder = new TextDecoder();
      const maxBytes = 100 * 1024; // 100KB

      while (html.length < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        // Stop if we've found the closing head tag (metadata is in head)
        if (html.includes("</head>")) break;
      }

      reader.cancel();

      const finalUrl = response.url || url;
      const domain = new URL(finalUrl).hostname.replace(/^www\./, "");

      const title = extractTitle(html);
      const description = extractDescription(html);
      const siteName = extractSiteName(html) || domain;
      const imageUrl = extractImage(html, finalUrl);

      event.success(200, {
        extractor: "html_meta",
        has_title: !!title,
        has_description: !!description,
        has_image: !!imageUrl,
      });

      return NextResponse.json({
        title,
        description,
        siteName,
        imageUrl,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      });
    } catch (fetchError) {
      clearTimeout(timeout);

      // On any fetch error, return basic info
      const domain = parsedUrl.hostname.replace(/^www\./, "");
      const fallbackResult = {
        title: null,
        description: null,
        siteName: domain,
        imageUrl: null,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
      const isTimeout = fetchError instanceof Error && fetchError.message.includes("abort");
      event.fallback(200, { extractor: "fallback" }, isTimeout ? "Timeout" : "Fetch error");
      return NextResponse.json(fallbackResult);
    }
  } catch (err) {
    event.error(500, err);
    return NextResponse.json({ error: "Failed to unfurl URL" }, { status: 500 });
  }
}
