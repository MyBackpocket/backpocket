import { type NextRequest, NextResponse } from "next/server";

const FETCH_TIMEOUT_MS = 8000; // 8 second timeout for preview

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
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // SSRF protection
    if (isBlockedHostname(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Blocked URL" }, { status: 400 });
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
        return NextResponse.json({
          title: null,
          description: null,
          siteName: parsedUrl.hostname.replace(/^www\./, ""),
          imageUrl: null,
          favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        });
      }

      // Only read first 100KB for metadata extraction
      const reader = response.body?.getReader();
      if (!reader) {
        return NextResponse.json({
          title: null,
          description: null,
          siteName: parsedUrl.hostname.replace(/^www\./, ""),
          imageUrl: null,
          favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
        });
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

      return NextResponse.json({
        title,
        description,
        siteName,
        imageUrl,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      });
    } catch (error) {
      clearTimeout(timeout);

      // On any fetch error, return basic info
      const domain = parsedUrl.hostname.replace(/^www\./, "");
      return NextResponse.json({
        title: null,
        description: null,
        siteName: domain,
        imageUrl: null,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      });
    }
  } catch {
    return NextResponse.json({ error: "Failed to unfurl URL" }, { status: 500 });
  }
}
