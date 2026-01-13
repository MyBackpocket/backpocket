"use client";

import { api } from "@convex/_generated/api";
import { useConvex, useConvexAuth } from "convex/react";
import type { FunctionArgs, FunctionReference } from "convex/server";
import { useCallback, useRef } from "react";

/**
 * Hook that returns a function to prefetch a Convex query.
 * Call the returned function on hover/focus to warm up the query cache.
 *
 * This triggers the query subscription briefly, populating the Convex cache
 * so that when the user navigates, the data is already available.
 */
export function usePrefetch() {
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetch = useCallback(
    <Query extends FunctionReference<"query">>(query: Query, args: FunctionArgs<Query>) => {
      if (!isAuthenticated) return;

      // Create a cache key to avoid re-prefetching
      // FunctionReference is serializable, so we can stringify it directly
      const cacheKey = JSON.stringify({ query, args });
      if (prefetchedRef.current.has(cacheKey)) return;
      prefetchedRef.current.add(cacheKey);

      // Fire the query to populate the cache
      // The Convex client will cache this and serve it instantly on the next page
      convex.query(query, args).catch(() => {
        // Silently fail - prefetching is best-effort
      });
    },
    [convex, isAuthenticated]
  );

  return prefetch;
}

/**
 * Commonly used prefetch targets for the app.
 * These can be called on hover to warm up data for the target page.
 */
export function usePrefetchTargets() {
  const prefetch = usePrefetch();

  return {
    /** Prefetch saves list for /app/saves */
    saves: useCallback(
      () => prefetch(api.saves.list, { limit: 20, isArchived: false }),
      [prefetch]
    ),

    /** Prefetch collections list for /app/collections */
    collections: useCallback(() => prefetch(api.collections.list, {}), [prefetch]),

    /** Prefetch a specific save's details */
    save: useCallback(
      (saveId: string) => prefetch(api.saves.get, { saveId: saveId as any }),
      [prefetch]
    ),

    /** Prefetch dashboard stats */
    stats: useCallback(() => prefetch(api.spaces.getStats, {}), [prefetch]),

    /** Prefetch tags list */
    tags: useCallback(() => prefetch(api.tags.list, {}), [prefetch]),
  };
}
