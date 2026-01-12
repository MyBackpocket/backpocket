import type { Metadata } from "next";
import { headers } from "next/headers";
import { ROOT_DOMAIN } from "@/lib/config/public";
import { SPACE_SLUG_HEADER } from "@/lib/constants/headers";
import { extractCustomDomain, isCustomDomainSlug } from "@/lib/constants/public-space";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const spaceSlug = headersList.get(SPACE_SLUG_HEADER);

  if (!spaceSlug) {
    return {
      title: "backpocket",
      description: "A public collection",
    };
  }

  // For metadata, we use a simple fallback since we can't easily fetch from Convex server-side
  // The actual space info will be loaded client-side
  const displaySlug = isCustomDomainSlug(spaceSlug)
    ? extractCustomDomain(spaceSlug)
    : spaceSlug;

  // Determine base URL - use custom domain if present, otherwise subdomain
  let baseUrl: string;
  if (isCustomDomainSlug(spaceSlug)) {
    const customDomain = extractCustomDomain(spaceSlug);
    baseUrl = `https://${customDomain}`;
  } else {
    baseUrl = `https://${spaceSlug}.${ROOT_DOMAIN}`;
  }

  return {
    title: `${displaySlug} | backpocket`,
    description: "A public collection",
    openGraph: {
      title: displaySlug,
      description: "A public collection",
      type: "website",
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: displaySlug,
      description: "A public collection",
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
