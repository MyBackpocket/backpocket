import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { api } from "@convex/_generated/api";
import { ROOT_DOMAIN } from "@/lib/config/public";
import { SPACE_SLUG_HEADER } from "@/lib/constants/headers";
import { extractCustomDomain, isCustomDomainSlug } from "@/lib/constants/public-space";

// Force dynamic rendering - this route depends on runtime headers (subdomain/custom domain)
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

  if (!spaceSlug) {
    return {
      title: "backpocket",
      description: "A public collection",
    };
  }

  // Determine base URL
  const baseUrl = isCustomDomainSlug(spaceSlug)
    ? `https://${extractCustomDomain(spaceSlug)}`
    : `https://${spaceSlug}.${ROOT_DOMAIN}`;

  // Resolve space data
  let space: { name: string; bio?: string | null; slug: string; visitCount?: number } | null = null;

  try {
    if (isCustomDomainSlug(spaceSlug)) {
      space = await fetchQuery(api.public.resolveSpaceByDomain, { domain: extractCustomDomain(spaceSlug) });
    } else {
      space = await fetchQuery(api.public.resolveSpaceBySlug, { slug: spaceSlug });
    }
  } catch {
    // Fallback if fetch fails
  }

  const displayName = space?.name || spaceSlug;
  const description = space?.bio || `${displayName}'s curated collection of links on backpocket`;
  const ogImageUrl = `${baseUrl}/api/og/space`;

  return {
    title: `${displayName}'s Backpocket`,
    description,
    openGraph: {
      title: `${displayName}'s Backpocket`,
      description,
      type: "website",
      url: baseUrl,
      siteName: "backpocket",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}'s Backpocket`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayName}'s Backpocket`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      types: {
        "application/rss+xml": `${baseUrl}/rss.xml`,
      },
    },
  };
}

export default async function PublicSpaceLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

  return (
    <>
      {/* Pass the space slug to client components via meta tag */}
      {spaceSlug && <meta name="x-space-slug" content={spaceSlug} />}
      {children}
    </>
  );
}
