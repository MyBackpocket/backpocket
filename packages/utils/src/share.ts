/**
 * Share URL generation utilities
 *
 * Provides consistent share URL generation across all platforms.
 */

export interface ShareUrlOptions {
  /** The save ID to link to */
  saveId: string;
  /** The space's subdomain slug */
  spaceSlug: string;
  /** User's default domain setting: null = subdomain, "custom:domain.com" = custom domain */
  defaultDomain: string | null;
  /** Root domain for subdomain URLs (defaults to "backpocket.my") */
  rootDomain?: string;
}

/**
 * Generate a share URL for a save based on the user's domain preferences.
 *
 * @example
 * // Using subdomain (defaultDomain is null)
 * getShareUrl({ saveId: "abc123", spaceSlug: "mario", defaultDomain: null })
 * // Returns: "https://mario.backpocket.my/s/abc123"
 *
 * @example
 * // Using custom domain
 * getShareUrl({ saveId: "abc123", spaceSlug: "mario", defaultDomain: "custom:links.mario.dev" })
 * // Returns: "https://links.mario.dev/s/abc123"
 */
export function getShareUrl(options: ShareUrlOptions): string {
  const {
    saveId,
    spaceSlug,
    defaultDomain,
    rootDomain = "backpocket.my",
  } = options;

  // Custom domain format: "custom:domain.com"
  if (defaultDomain?.startsWith("custom:")) {
    const domain = defaultDomain.replace("custom:", "");
    return `https://${domain}/s/${saveId}`;
  }

  // Default: use subdomain
  return `https://${spaceSlug}.${rootDomain}/s/${saveId}`;
}

/**
 * Get the display domain for UI (shows the domain without protocol or path).
 *
 * @example
 * getDisplayDomain({ spaceSlug: "mario", defaultDomain: null })
 * // Returns: "mario.backpocket.my"
 *
 * @example
 * getDisplayDomain({ spaceSlug: "mario", defaultDomain: "custom:links.mario.dev" })
 * // Returns: "links.mario.dev"
 */
export function getDisplayDomain(options: {
  spaceSlug: string;
  defaultDomain: string | null;
  rootDomain?: string;
}): string {
  const { spaceSlug, defaultDomain, rootDomain = "backpocket.my" } = options;

  if (defaultDomain?.startsWith("custom:")) {
    return defaultDomain.replace("custom:", "");
  }

  return `${spaceSlug}.${rootDomain}`;
}

/**
 * Social share URL generators
 */
export const socialShareUrls = {
  twitter: (url: string, text?: string) => {
    const params = new URLSearchParams({ url });
    if (text) params.set("text", text);
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  },

  facebook: (url: string) => {
    const params = new URLSearchParams({ u: url });
    return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  },

  linkedin: (url: string) => {
    const params = new URLSearchParams({ url });
    return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
  },

  email: (url: string, subject?: string, body?: string) => {
    const emailBody = body ? `${body}\n\n${url}` : url;
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    params.set("body", emailBody);
    return `mailto:?${params.toString()}`;
  },
};
