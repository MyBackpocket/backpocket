"use client";

import Link from "next/link";
import { type ComponentProps, type ReactNode, useCallback, useState } from "react";

type LinkProps = ComponentProps<typeof Link>;

interface PrefetchLinkProps extends Omit<LinkProps, "prefetch"> {
  children: ReactNode;
  /**
   * Callback fired on hover to prefetch data.
   * Use this to warm up Convex queries for the target page.
   */
  onPrefetch?: () => void;
  /**
   * If true, prefetches the route on viewport entry (default Next.js behavior).
   * If false, only prefetches on hover.
   * @default false
   */
  prefetchOnViewport?: boolean;
}

/**
 * Enhanced Link component that prefetches both the route AND data on hover.
 *
 * Usage:
 * ```tsx
 * const { saves } = usePrefetchTargets();
 *
 * <PrefetchLink href="/app/saves" onPrefetch={saves}>
 *   Saves
 * </PrefetchLink>
 * ```
 */
export function PrefetchLink({
  children,
  onPrefetch,
  prefetchOnViewport = false,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const [hasHovered, setHasHovered] = useState(false);

  const handlePrefetch = useCallback(() => {
    if (!hasHovered) {
      setHasHovered(true);
      onPrefetch?.();
    }
  }, [hasHovered, onPrefetch]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      handlePrefetch();
      if (typeof onMouseEnter === "function") {
        onMouseEnter(e);
      }
    },
    [handlePrefetch, onMouseEnter]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      handlePrefetch();
      if (typeof onFocus === "function") {
        onFocus(e);
      }
    },
    [handlePrefetch, onFocus]
  );

  return (
    <Link
      {...props}
      // Don't prefetch on viewport - wait for hover intent
      // Once hovered, restore default prefetching behavior (null)
      prefetch={prefetchOnViewport ? undefined : hasHovered ? null : false}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    >
      {children}
    </Link>
  );
}

/**
 * Wrapper to make any element trigger data prefetching on hover.
 * Use when you need prefetch behavior on a non-link element.
 */
interface PrefetchWrapperProps {
  children: ReactNode;
  onPrefetch: () => void;
  className?: string;
}

export function PrefetchWrapper({ children, onPrefetch, className }: PrefetchWrapperProps) {
  const [hasPrefetched, setHasPrefetched] = useState(false);

  const handlePrefetch = useCallback(() => {
    if (!hasPrefetched) {
      setHasPrefetched(true);
      onPrefetch();
    }
  }, [hasPrefetched, onPrefetch]);

  return (
    <div onMouseEnter={handlePrefetch} onFocus={handlePrefetch} className={className}>
      {children}
    </div>
  );
}
