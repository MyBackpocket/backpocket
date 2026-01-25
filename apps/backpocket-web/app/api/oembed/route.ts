import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

/**
 * oEmbed endpoint for rich embeds in Slack, Discord, and other platforms.
 *
 * Usage: GET /api/oembed?url=https://mario.backpocket.my/s/abc123
 *
 * Returns oEmbed 1.0 JSON response with:
 * - title, description (from save or note)
 * - author_name, author_url (space owner info)
 * - provider_name, provider_url (Backpocket branding)
 * - thumbnail_url (OG image URL)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Parse saveId and domain from URL
  // Supports: https://mario.backpocket.my/s/abc123 or https://custom.domain.com/s/abc123
  const parsed = extractSaveInfoFromUrl(url);
  if (!parsed) {
    return Response.json({ error: "Invalid URL format" }, { status: 400 });
  }

  const { saveId, spaceSlug, domain } = parsed;

  try {
    // Resolve space
    let space: { id: string; slug: string; name: string } | null;
    if (spaceSlug) {
      space = await fetchQuery(api.public.resolveSpaceBySlug, {
        slug: spaceSlug,
      });
    } else if (domain) {
      space = await fetchQuery(api.public.resolveSpaceByDomain, {
        domain,
      });
    }

    if (!space) {
      return Response.json({ error: "Space not found" }, { status: 404 });
    }

    // Get the save
    const save = await fetchQuery(api.public.getPublicSave, {
      spaceId: space.id as Id<"spaces">,
      saveId: saveId as Id<"saves">,
    });

    if (!save) {
      return Response.json({ error: "Save not found" }, { status: 404 });
    }

    // Determine description: prioritize user's note
    const description = save.note
      ? truncate(stripMarkdown(save.note), 200)
      : save.description || "";

    // Build the canonical domain for URLs
    const canonicalDomain = domain || `${spaceSlug}.backpocket.my`;

    const oembedResponse = {
      version: "1.0",
      type: "link",
      title: save.title || "Untitled",
      description,
      author_name: space.name,
      author_url: `https://${canonicalDomain}`,
      provider_name: "Backpocket",
      provider_url: "https://backpocket.my",
      thumbnail_url: `https://${canonicalDomain}/api/og/save/${saveId}`,
      thumbnail_width: 1200,
      thumbnail_height: 630,
    };

    return Response.json(oembedResponse, {
      headers: {
        // Cache for 24 hours, stale for 7 days
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("oEmbed error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Extract save ID and space info from a Backpocket URL.
 *
 * Supports:
 * - https://mario.backpocket.my/s/abc123 (subdomain)
 * - https://custom.domain.com/s/abc123 (custom domain)
 */
function extractSaveInfoFromUrl(
  url: string
): { saveId: string; spaceSlug: string | null; domain: string | null } | null {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/^\/s\/([a-zA-Z0-9_-]+)/);
    if (!pathMatch) {
      return null;
    }

    const saveId = pathMatch[1];

    // Check if it's a subdomain of backpocket.my
    if (parsed.hostname.endsWith(".backpocket.my")) {
      const spaceSlug = parsed.hostname.replace(".backpocket.my", "");
      return { saveId, spaceSlug, domain: null };
    }

    // Otherwise, it's a custom domain
    return { saveId, spaceSlug: null, domain: parsed.hostname };
  } catch {
    return null;
  }
}

// Helper to strip markdown for clean preview text
function stripMarkdown(text: string): string {
  return text
    .replace(/[#*_~`>\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

// Helper to truncate text
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
