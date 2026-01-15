import { describe, expect, test } from "vitest";
import {
  CUSTOM_DOMAIN_PREFIX,
  createCustomDomainSlug,
  extractCustomDomain,
  isCustomDomainSlug,
} from "./public-space";
import { resolveSpaceSlug, resolveSpaceWithDetails } from "./space-resolution";

describe("public-space utilities", () => {
  describe("isCustomDomainSlug", () => {
    test("returns true for custom domain slugs", () => {
      expect(isCustomDomainSlug("custom:example.com")).toBe(true);
      expect(isCustomDomainSlug("custom:backpocket.mariolopez.org")).toBe(true);
      expect(isCustomDomainSlug("custom:my-site.io")).toBe(true);
    });

    test("returns false for regular slugs", () => {
      expect(isCustomDomainSlug("mario")).toBe(false);
      expect(isCustomDomainSlug("my-space")).toBe(false);
      expect(isCustomDomainSlug("")).toBe(false);
    });

    test("returns false for slugs containing 'custom' but not as prefix", () => {
      expect(isCustomDomainSlug("mycustom")).toBe(false);
      expect(isCustomDomainSlug("custom-space")).toBe(false);
    });
  });

  describe("extractCustomDomain", () => {
    test("extracts domain from custom slug", () => {
      expect(extractCustomDomain("custom:example.com")).toBe("example.com");
      expect(extractCustomDomain("custom:backpocket.mariolopez.org")).toBe(
        "backpocket.mariolopez.org"
      );
      expect(extractCustomDomain("custom:sub.domain.co.uk")).toBe("sub.domain.co.uk");
    });

    test("handles edge cases", () => {
      expect(extractCustomDomain("custom:")).toBe("");
      expect(extractCustomDomain(CUSTOM_DOMAIN_PREFIX)).toBe("");
    });
  });

  describe("createCustomDomainSlug", () => {
    test("creates custom domain slug with prefix", () => {
      expect(createCustomDomainSlug("example.com")).toBe("custom:example.com");
      expect(createCustomDomainSlug("backpocket.mariolopez.org")).toBe(
        "custom:backpocket.mariolopez.org"
      );
    });

    test("roundtrip: create then extract", () => {
      const domain = "my-custom-site.io";
      const slug = createCustomDomainSlug(domain);
      expect(isCustomDomainSlug(slug)).toBe(true);
      expect(extractCustomDomain(slug)).toBe(domain);
    });
  });
});

describe("resolveSpaceSlug", () => {
  const ROOT_DOMAIN = "backpocket.my";
  const APP_DOMAIN = "backpocket.my";

  describe("primary app domain", () => {
    test("returns null for primary domain", () => {
      expect(resolveSpaceSlug("backpocket.my", ROOT_DOMAIN, APP_DOMAIN)).toBeNull();
    });

    test("returns null for www subdomain", () => {
      expect(resolveSpaceSlug("www.backpocket.my", ROOT_DOMAIN, APP_DOMAIN)).toBeNull();
    });
  });

  describe("subdomain resolution", () => {
    test("resolves user subdomain to slug", () => {
      expect(resolveSpaceSlug("mario.backpocket.my", ROOT_DOMAIN, APP_DOMAIN)).toBe("mario");
    });

    test("resolves hyphenated subdomain", () => {
      expect(resolveSpaceSlug("my-space.backpocket.my", ROOT_DOMAIN, APP_DOMAIN)).toBe("my-space");
    });

    test("resolves numeric subdomain", () => {
      expect(resolveSpaceSlug("user123.backpocket.my", ROOT_DOMAIN, APP_DOMAIN)).toBe("user123");
    });

    test("handles subdomain with port", () => {
      expect(resolveSpaceSlug("mario.backpocket.my:3000", ROOT_DOMAIN, APP_DOMAIN)).toBe("mario");
    });
  });

  describe("localhost (development)", () => {
    test("returns null for plain localhost", () => {
      expect(resolveSpaceSlug("localhost", ROOT_DOMAIN, APP_DOMAIN)).toBeNull();
    });

    test("returns null for localhost with port", () => {
      expect(resolveSpaceSlug("localhost:3000", ROOT_DOMAIN, APP_DOMAIN)).toBeNull();
    });

    test("resolves local subdomain", () => {
      expect(resolveSpaceSlug("mario.localhost", ROOT_DOMAIN, APP_DOMAIN)).toBe("mario");
    });

    test("resolves local subdomain with port", () => {
      expect(resolveSpaceSlug("mario.localhost:3000", ROOT_DOMAIN, APP_DOMAIN)).toBe("mario");
    });

    test("returns null for www.localhost", () => {
      expect(resolveSpaceSlug("www.localhost", ROOT_DOMAIN, APP_DOMAIN)).toBeNull();
    });
  });

  describe("Vercel preview deployments", () => {
    test("returns null for Vercel preview URLs", () => {
      expect(
        resolveSpaceSlug("backpocket-git-feature-branch.vercel.app", ROOT_DOMAIN, APP_DOMAIN)
      ).toBeNull();
    });

    test("returns null for Vercel deployment URLs", () => {
      expect(resolveSpaceSlug("backpocket-abc123.vercel.app", ROOT_DOMAIN, APP_DOMAIN)).toBeNull();
    });
  });

  describe("custom domains", () => {
    test("returns custom slug for external domain", () => {
      const result = resolveSpaceSlug("backpocket.mariolopez.org", ROOT_DOMAIN, APP_DOMAIN);
      expect(result).toBe("custom:backpocket.mariolopez.org");
      expect(isCustomDomainSlug(result!)).toBe(true);
    });

    test("returns custom slug for apex domain", () => {
      const result = resolveSpaceSlug("mycollection.com", ROOT_DOMAIN, APP_DOMAIN);
      expect(result).toBe("custom:mycollection.com");
    });

    test("returns custom slug for subdomain on custom domain", () => {
      const result = resolveSpaceSlug("links.example.org", ROOT_DOMAIN, APP_DOMAIN);
      expect(result).toBe("custom:links.example.org");
    });

    test("handles custom domain with port", () => {
      const result = resolveSpaceSlug("mycollection.com:8080", ROOT_DOMAIN, APP_DOMAIN);
      expect(result).toBe("custom:mycollection.com");
    });
  });
});

describe("resolveSpaceWithDetails", () => {
  const ROOT_DOMAIN = "backpocket.my";
  const APP_DOMAIN = "backpocket.my";

  test("identifies primary domain type", () => {
    const result = resolveSpaceWithDetails("backpocket.my", ROOT_DOMAIN, APP_DOMAIN);
    expect(result).toEqual({ type: "primary", slug: null });
  });

  test("identifies subdomain type", () => {
    const result = resolveSpaceWithDetails("mario.backpocket.my", ROOT_DOMAIN, APP_DOMAIN);
    expect(result).toEqual({ type: "subdomain", slug: "mario" });
  });

  test("identifies localhost type without subdomain", () => {
    const result = resolveSpaceWithDetails("localhost", ROOT_DOMAIN, APP_DOMAIN);
    expect(result).toEqual({ type: "localhost", slug: null });
  });

  test("identifies localhost type with subdomain", () => {
    const result = resolveSpaceWithDetails("mario.localhost", ROOT_DOMAIN, APP_DOMAIN);
    expect(result).toEqual({ type: "localhost", slug: "mario" });
  });

  test("identifies preview type", () => {
    const result = resolveSpaceWithDetails("backpocket-abc123.vercel.app", ROOT_DOMAIN, APP_DOMAIN);
    expect(result).toEqual({ type: "preview", slug: null });
  });

  test("identifies custom domain type", () => {
    const result = resolveSpaceWithDetails("backpocket.mariolopez.org", ROOT_DOMAIN, APP_DOMAIN);
    expect(result.type).toBe("custom");
    expect(result.slug).toBe("custom:backpocket.mariolopez.org");
  });
});

describe("integration: slug → query selection", () => {
  /**
   * These tests verify the logic that determines which Convex query to use
   * based on the resolved space slug. This is the critical path for custom domains.
   */

  function selectQuery(slug: string | null): "none" | "bySlug" | "byDomain" {
    if (!slug) return "none";
    if (isCustomDomainSlug(slug)) return "byDomain";
    return "bySlug";
  }

  test("primary domain uses no query (null slug)", () => {
    const slug = resolveSpaceSlug("backpocket.my");
    expect(selectQuery(slug)).toBe("none");
  });

  test("subdomain uses bySlug query", () => {
    const slug = resolveSpaceSlug("mario.backpocket.my");
    expect(selectQuery(slug)).toBe("bySlug");
    expect(slug).toBe("mario"); // The actual slug to query
  });

  test("custom domain uses byDomain query", () => {
    const slug = resolveSpaceSlug("backpocket.mariolopez.org");
    expect(selectQuery(slug)).toBe("byDomain");
    // Extract domain for the query
    expect(extractCustomDomain(slug!)).toBe("backpocket.mariolopez.org");
  });

  test("local subdomain uses bySlug query", () => {
    const slug = resolveSpaceSlug("test-space.localhost:3000");
    expect(selectQuery(slug)).toBe("bySlug");
    expect(slug).toBe("test-space");
  });
});

describe("edge cases", () => {
  test("handles empty string", () => {
    expect(resolveSpaceSlug("")).toBeNull();
  });

  test("handles very long hostnames", () => {
    const longSubdomain = "a".repeat(63); // Max DNS label length
    const result = resolveSpaceSlug(`${longSubdomain}.backpocket.my`);
    expect(result).toBe(longSubdomain);
  });

  test("handles multiple dots in custom domain", () => {
    const result = resolveSpaceSlug("sub.domain.example.co.uk");
    expect(result).toBe("custom:sub.domain.example.co.uk");
    expect(extractCustomDomain(result!)).toBe("sub.domain.example.co.uk");
  });

  test("handles uppercase in hostname (should preserve case)", () => {
    // DNS is case-insensitive, but we preserve case for the slug
    const result = resolveSpaceSlug("Mario.backpocket.my");
    expect(result).toBe("Mario");
  });

  test("handles IP addresses as custom domain", () => {
    // Edge case: IP address should be treated as custom domain
    const result = resolveSpaceSlug("192.168.1.1");
    expect(result).toBe("custom:192.168.1.1");
  });
});
