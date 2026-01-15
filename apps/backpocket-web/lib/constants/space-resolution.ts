/**
 * Space resolution utilities for domain/subdomain handling.
 * Centralizes logic for resolving space slugs from hostnames.
 *
 * IMPORTANT: This file must remain dependency-free (no next/*, no React)
 * to ensure it can be safely imported anywhere including edge middleware.
 */

import { createCustomDomainSlug } from "./public-space";

/**
 * Domain types supported by backpocket
 */
export type DomainType =
  | "primary" // Main app domain (backpocket.my)
  | "subdomain" // User subdomain (mario.backpocket.my)
  | "custom" // Custom domain (backpocket.mariolopez.org)
  | "localhost" // Local development
  | "preview"; // Vercel preview deployment

/**
 * Result of resolving a space from a hostname
 */
export interface SpaceResolutionResult {
  type: DomainType;
  slug: string | null;
}

/**
 * Resolve the Space from a hostname.
 *
 * @param host - The hostname (may include port)
 * @param rootDomain - The root domain for subdomain resolution (default: backpocket.my)
 * @param appDomain - The primary app domain (default: backpocket.my)
 * @returns The resolved space slug, or null if this is the primary domain
 *
 * @example
 * // Primary domain - no space
 * resolveSpaceSlug("backpocket.my") // => null
 *
 * @example
 * // Subdomain - returns slug
 * resolveSpaceSlug("mario.backpocket.my") // => "mario"
 *
 * @example
 * // Custom domain - returns custom:domain marker
 * resolveSpaceSlug("backpocket.mariolopez.org") // => "custom:backpocket.mariolopez.org"
 */
export function resolveSpaceSlug(
  host: string,
  rootDomain = "backpocket.my",
  appDomain = "backpocket.my"
): string | null {
  // Remove port for local development
  const hostname = host.split(":")[0];

  // If it's the primary app domain, no space resolution needed
  if (hostname === appDomain || hostname === `www.${appDomain}`) {
    return null;
  }

  // For localhost (no subdomain), also skip
  if (hostname === "localhost") {
    return null;
  }

  // For Vercel preview deployments, skip subdomain resolution
  if (hostname.endsWith(".vercel.app")) {
    return null;
  }

  // Check for subdomain pattern: {slug}.backpocket.my
  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");
    // Ignore 'www' subdomain
    if (subdomain && subdomain !== "www") {
      return subdomain;
    }
  }

  // For local development: {slug}.localhost
  if (hostname.endsWith(".localhost") || hostname.includes(".localhost:")) {
    const subdomain = hostname.split(".localhost")[0];
    if (subdomain && subdomain !== "www") {
      return subdomain;
    }
  }

  // Custom domain case: would need to look up in domain_mappings
  // For MVP, we'll treat unknown domains as potential custom domains
  // and let the public space handler resolve them
  if (!hostname.includes(rootDomain) && !hostname.includes("localhost")) {
    // Mark as custom domain resolution needed
    return createCustomDomainSlug(hostname);
  }

  return null;
}

/**
 * Get detailed information about a hostname resolution.
 * Useful for debugging and testing.
 */
export function resolveSpaceWithDetails(
  host: string,
  rootDomain = "backpocket.my",
  appDomain = "backpocket.my"
): SpaceResolutionResult {
  const hostname = host.split(":")[0];

  // Primary app domain
  if (hostname === appDomain || hostname === `www.${appDomain}`) {
    return { type: "primary", slug: null };
  }

  // Localhost
  if (hostname === "localhost") {
    return { type: "localhost", slug: null };
  }

  // Vercel preview
  if (hostname.endsWith(".vercel.app")) {
    return { type: "preview", slug: null };
  }

  // Subdomain
  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");
    if (subdomain && subdomain !== "www") {
      return { type: "subdomain", slug: subdomain };
    }
    return { type: "primary", slug: null };
  }

  // Local subdomain
  if (hostname.endsWith(".localhost") || hostname.includes(".localhost:")) {
    const subdomain = hostname.split(".localhost")[0];
    if (subdomain && subdomain !== "www") {
      return { type: "localhost", slug: subdomain };
    }
    return { type: "localhost", slug: null };
  }

  // Custom domain
  if (!hostname.includes(rootDomain) && !hostname.includes("localhost")) {
    return { type: "custom", slug: createCustomDomainSlug(hostname) };
  }

  return { type: "primary", slug: null };
}
