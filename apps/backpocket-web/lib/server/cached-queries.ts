import { cache } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { extractCustomDomain, isCustomDomainSlug } from "@/lib/constants/public-space";

/**
 * Cached server-side queries using React.cache() for request-level deduplication.
 * These functions automatically dedupe when called multiple times in the same render.
 */

// Cache space resolution to avoid duplicate fetches across server components
export const getSpaceBySlug = cache(async (spaceSlug: string) => {
  if (isCustomDomainSlug(spaceSlug)) {
    return fetchQuery(api.public.resolveSpaceByDomain, {
      domain: extractCustomDomain(spaceSlug),
    });
  }
  return fetchQuery(api.public.resolveSpaceBySlug, { slug: spaceSlug });
});

// Cache public save fetch
export const getPublicSave = cache(
  async (spaceId: Id<"spaces">, saveId: Id<"saves">) => {
    return fetchQuery(api.public.getPublicSave, { spaceId, saveId });
  }
);

// Cache public save snapshot fetch
export const getPublicSaveSnapshot = cache(
  async (spaceId: Id<"spaces">, saveId: Id<"saves">, includeContent = true) => {
    return fetchQuery(api.public.getPublicSaveSnapshot, {
      spaceId,
      saveId,
      includeContent,
    });
  }
);

// Cache public saves list
export const listPublicSaves = cache(
  async (options: {
    spaceId: Id<"spaces">;
    cursor?: number;
    limit?: number;
    tagName?: string;
  }) => {
    return fetchQuery(api.public.listPublicSaves, options);
  }
);
