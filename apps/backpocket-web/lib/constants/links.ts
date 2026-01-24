/**
 * External link constants used across the application.
 * Centralizes marketing URLs and reference links.
 *
 * IMPORTANT: This file must remain dependency-free (no next/*, no React)
 * to ensure it can be safely imported anywhere.
 */

/** Canonical marketing/home URL for backpocket */
export const MARKETING_URL = "https://backpocket.my";

/** GitHub monorepo base URL */
const GITHUB_REPO = "https://github.com/MyBackpocket/backpocket";

/** External reference links */
export const externalLinks = {
  /** Mozilla's Pocket shutdown announcement */
  pocketShutdown: "https://support.mozilla.org/en-US/kb/future-of-pocket",
  /** Main monorepo */
  mainRepo: GITHUB_REPO,
  /** Browser extension source in monorepo */
  browserExtensionRepo: `${GITHUB_REPO}/tree/main/apps/backpocket-browser-extension`,
  /** Mobile app source in monorepo */
  mobileAppRepo: `${GITHUB_REPO}/tree/main/apps/backpocket-mobile`,
  /** Web app source in monorepo */
  webAppRepo: `${GITHUB_REPO}/tree/main/apps/backpocket-web`,
} as const;
