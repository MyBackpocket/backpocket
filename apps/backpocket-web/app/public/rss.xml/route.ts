import { headers } from "next/headers";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { ROOT_DOMAIN } from "@/lib/config/public";
import { SPACE_SLUG_HEADER } from "@/lib/constants/headers";
import {
  extractCustomDomain,
  isCustomDomainSlug,
  PUBLIC_LIST_LIMIT,
  PUBLIC_RSS_CACHE_SECONDS,
} from "@/lib/constants/public-space";

export async function GET() {
  const headersList = await headers();
  const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

  if (!spaceSlug) {
    return new Response("Space not found", { status: 404 });
  }

  try {
    // Resolve space by slug (handles both regular slugs and custom:domain format)
    const space = await fetchQuery(api.public.resolveSpaceBySlug, { slug: spaceSlug });

    if (!space) {
      return new Response("Space not found", { status: 404 });
    }

    // Get public saves
    const { items: saves } = await fetchQuery(api.public.listPublicSaves, {
      spaceId: space.id as any,
      limit: PUBLIC_LIST_LIMIT,
    });

    // Determine base URL - use custom domain if present, otherwise subdomain
    let baseUrl: string;
    if (isCustomDomainSlug(spaceSlug)) {
      const customDomain = extractCustomDomain(spaceSlug);
      baseUrl = `https://${customDomain}`;
    } else {
      baseUrl = `https://${space.slug}.${ROOT_DOMAIN}`;
    }

    const rssItems = saves
      .map(
        (save) => `
    <item>
      <title><![CDATA[${save.title || save.url}]]></title>
      <link>${save.url}</link>
      <guid>${baseUrl}/s/${save.id}</guid>
      <pubDate>${new Date(save.savedAt).toUTCString()}</pubDate>
      ${save.description ? `<description><![CDATA[${save.description}]]></description>` : ""}
      ${save.tags?.map((tag) => `<category>${tag}</category>`).join("") || ""}
    </item>`
      )
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${space.name}</title>
    <link>${baseUrl}</link>
    <description>${space.bio || "A public collection"}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml",
        "Cache-Control": `public, max-age=${PUBLIC_RSS_CACHE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error("Error generating RSS feed:", error);
    return new Response("Error generating RSS feed", { status: 500 });
  }
}
