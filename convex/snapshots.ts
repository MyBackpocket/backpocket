import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserSpace, requireAuth } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

const SNAPSHOTS_ENABLED = true; // Feature flag
const MAX_DAILY_SNAPSHOTS = 50; // Rate limit per user per day
const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB max content

// Get snapshot for a save
export const getSaveSnapshot = query({
  args: {
    saveId: v.id("saves"),
    includeContent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!SNAPSHOTS_ENABLED) {
      return null;
    }

    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) return null;

    // Verify the save belongs to the user's space
    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== space._id) return null;

    // Get the snapshot record
    const snapshot = await ctx.db
      .query("saveSnapshots")
      .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
      .first();

    if (!snapshot) return null;

    const result: {
      snapshot: {
        saveId: Id<"saves">;
        spaceId: Id<"spaces">;
        status: string;
        blockedReason: string | null;
        attempts: number;
        nextAttemptAt: number | null;
        fetchedAt: number | null;
        canonicalUrl: string | null;
        title: string | null;
        byline: string | null;
        excerpt: string | null;
        wordCount: number | null;
        language: string | null;
        createdAt: number;
        updatedAt: number;
      };
      content?: {
        title: string;
        byline: string | null;
        content: string;
        textContent: string;
        excerpt: string;
        siteName: string | null;
        length: number;
        language: string | null;
        storageUrl?: string;
      };
    } = {
      snapshot: {
        saveId: snapshot.saveId,
        spaceId: snapshot.spaceId,
        status: snapshot.status,
        blockedReason: snapshot.blockedReason ?? null,
        attempts: snapshot.attempts,
        nextAttemptAt: snapshot.nextAttemptAt ?? null,
        fetchedAt: snapshot.fetchedAt ?? null,
        canonicalUrl: snapshot.canonicalUrl ?? null,
        title: snapshot.title ?? null,
        byline: snapshot.byline ?? null,
        excerpt: snapshot.excerpt ?? null,
        wordCount: snapshot.wordCount ?? null,
        language: snapshot.language ?? null,
        createdAt: snapshot._creationTime,
        updatedAt: snapshot._creationTime,
      },
    };

    // If content requested and snapshot is ready, get storage URL
    // Client will need to fetch content from this URL
    if (args.includeContent && snapshot.status === "ready" && snapshot.storageId) {
      try {
        const storageUrl = await ctx.storage.getUrl(snapshot.storageId);
        if (storageUrl) {
          // For now, return a placeholder - actual content fetching should be done client-side
          // or via an action that can fetch the blob
          result.content = {
            title: snapshot.title ?? "",
            byline: snapshot.byline ?? null,
            content: "", // Content is stored in file
            textContent: "",
            excerpt: snapshot.excerpt ?? "",
            siteName: null,
            length: snapshot.wordCount ?? 0,
            language: snapshot.language ?? null,
            storageUrl, // Client can fetch from this URL
          };
        }
      } catch (err) {
        console.error("[snapshots] Failed to get content URL:", err);
      }
    }

    return result;
  },
});

// Get public snapshot (for public save viewing)
export const getPublicSaveSnapshot = query({
  args: {
    spaceId: v.id("spaces"),
    saveId: v.id("saves"),
    includeContent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!SNAPSHOTS_ENABLED) return null;

    // Verify the save is public
    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== args.spaceId || save.visibility !== "public") {
      return null;
    }

    const snapshot = await ctx.db
      .query("saveSnapshots")
      .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
      .first();

    if (!snapshot) return null;

    const result: {
      snapshot: {
        status: string;
        blockedReason: string | null;
        fetchedAt: number | null;
        title: string | null;
        byline: string | null;
        excerpt: string | null;
        wordCount: number | null;
        language: string | null;
      };
      content?: {
        title: string;
        byline: string | null;
        content: string;
        textContent: string;
        excerpt: string;
        siteName: string | null;
        length: number;
        language: string | null;
        storageUrl?: string;
      };
    } = {
      snapshot: {
        status: snapshot.status,
        blockedReason: snapshot.blockedReason ?? null,
        fetchedAt: snapshot.fetchedAt ?? null,
        title: snapshot.title ?? null,
        byline: snapshot.byline ?? null,
        excerpt: snapshot.excerpt ?? null,
        wordCount: snapshot.wordCount ?? null,
        language: snapshot.language ?? null,
      },
    };

    if (args.includeContent && snapshot.status === "ready" && snapshot.storageId) {
      try {
        const storageUrl = await ctx.storage.getUrl(snapshot.storageId);
        if (storageUrl) {
          result.content = {
            title: snapshot.title ?? "",
            byline: snapshot.byline ?? null,
            content: "", // Content stored in file
            textContent: "",
            excerpt: snapshot.excerpt ?? "",
            siteName: null,
            length: snapshot.wordCount ?? 0,
            language: snapshot.language ?? null,
            storageUrl, // Client can fetch from this URL
          };
        }
      } catch (err) {
        console.error("[snapshots] Failed to get content URL:", err);
      }
    }

    return result;
  },
});

// Request a snapshot for a save
export const requestSaveSnapshot = mutation({
  args: {
    saveId: v.id("saves"),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!SNAPSHOTS_ENABLED) {
      throw new ConvexError("Snapshots are disabled");
    }

    const user = await requireAuth(ctx);
    const space = await getUserSpace(ctx, user.userId);
    if (!space) {
      throw new ConvexError("Space not found");
    }

    // Verify the save belongs to the user's space
    const save = await ctx.db.get(args.saveId);
    if (!save || save.spaceId !== space._id) {
      throw new ConvexError("Save not found");
    }

    // Check rate limit
    const now = Date.now();
    const windowStart = now - 24 * 60 * 60 * 1000; // 24 hours ago

    let rateLimit = await ctx.db
      .query("snapshotRateLimits")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .first();

    if (rateLimit) {
      if (rateLimit.windowStart < windowStart) {
        // Reset the window
        await ctx.db.patch(rateLimit._id, { windowStart: now, count: 0 });
        rateLimit = { ...rateLimit, windowStart: now, count: 0 };
      }

      if (rateLimit.count >= MAX_DAILY_SNAPSHOTS) {
        throw new ConvexError("Rate limit exceeded. Try again in 24 hours.");
      }
    }

    // Check existing snapshot
    const existingSnapshot = await ctx.db
      .query("saveSnapshots")
      .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
      .first();

    if (existingSnapshot) {
      if (existingSnapshot.status === "processing") {
        return {
          status: "processing",
          message: "Snapshot is already being processed",
        };
      }

      if (existingSnapshot.status === "ready" && !args.force) {
        return {
          status: "ready",
          message: "Snapshot already exists. Use force=true to re-snapshot.",
        };
      }

      // Reset for re-processing
      await ctx.db.patch(existingSnapshot._id, {
        status: "pending",
        attempts: 0,
        errorMessage: undefined,
        blockedReason: undefined,
      });
    } else {
      // Create new snapshot record
      await ctx.db.insert("saveSnapshots", {
        saveId: args.saveId,
        spaceId: space._id,
        status: "pending",
        attempts: 0,
      });
    }

    // Increment rate limit
    if (rateLimit) {
      await ctx.db.patch(rateLimit._id, { count: rateLimit.count + 1 });
    } else {
      await ctx.db.insert("snapshotRateLimits", {
        userId: user.userId,
        windowStart: now,
        count: 1,
      });
    }

    // Schedule the processing action
    await ctx.scheduler.runAfter(0, internal.snapshots.processSnapshot, {
      saveId: args.saveId,
      url: save.url,
    });

    return {
      status: "pending",
      message: "Snapshot job enqueued",
      remaining: MAX_DAILY_SNAPSHOTS - (rateLimit?.count ?? 0) - 1,
    };
  },
});

// Get user's snapshot quota
export const getSnapshotQuota = query({
  args: {},
  handler: async (ctx) => {
    if (!SNAPSHOTS_ENABLED) {
      return { enabled: false, used: 0, remaining: 0, limit: 0 };
    }

    const user = await requireAuth(ctx);
    const now = Date.now();
    const windowStart = now - 24 * 60 * 60 * 1000;

    const rateLimit = await ctx.db
      .query("snapshotRateLimits")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .first();

    let used = 0;
    if (rateLimit && rateLimit.windowStart >= windowStart) {
      used = rateLimit.count;
    }

    return {
      enabled: true,
      used,
      remaining: Math.max(0, MAX_DAILY_SNAPSHOTS - used),
      limit: MAX_DAILY_SNAPSHOTS,
    };
  },
});

// Internal mutation to update snapshot status
export const updateSnapshotStatus = internalMutation({
  args: {
    saveId: v.id("saves"),
    status: v.string(),
    blockedReason: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fetchedAt: v.optional(v.number()),
    canonicalUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    byline: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    language: v.optional(v.string()),
    contentSha256: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query("saveSnapshots")
      .withIndex("by_saveId", (q) => q.eq("saveId", args.saveId))
      .first();

    if (!snapshot) return;

    const updates: Record<string, any> = {
      status: args.status,
      attempts: snapshot.attempts + 1,
    };

    if (args.blockedReason !== undefined) updates.blockedReason = args.blockedReason;
    if (args.errorMessage !== undefined) updates.errorMessage = args.errorMessage;
    if (args.storageId !== undefined) updates.storageId = args.storageId;
    if (args.fetchedAt !== undefined) updates.fetchedAt = args.fetchedAt;
    if (args.canonicalUrl !== undefined) updates.canonicalUrl = args.canonicalUrl;
    if (args.title !== undefined) updates.title = args.title;
    if (args.byline !== undefined) updates.byline = args.byline;
    if (args.excerpt !== undefined) updates.excerpt = args.excerpt;
    if (args.wordCount !== undefined) updates.wordCount = args.wordCount;
    if (args.language !== undefined) updates.language = args.language;
    if (args.contentSha256 !== undefined) updates.contentSha256 = args.contentSha256;

    await ctx.db.patch(snapshot._id, updates);
  },
});

// Internal action to process a snapshot
export const processSnapshot = internalAction({
  args: {
    saveId: v.id("saves"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Mark as processing
    await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
      saveId: args.saveId,
      status: "processing",
    });

    try {
      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(args.url);
      } catch {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "invalid_url",
          errorMessage: "Invalid URL format",
        });
        return;
      }

      // Block private IPs (SSRF protection)
      const hostname = parsedUrl.hostname;
      if (
        hostname === "localhost" ||
        hostname.startsWith("127.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("172.16.") ||
        hostname.endsWith(".local")
      ) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "ssrf_blocked",
          errorMessage: "Private IP addresses are not allowed",
        });
        return;
      }

      // Fetch the page
      const response = await fetch(args.url, {
        headers: {
          "User-Agent": "Backpocket/1.0 (https://backpocket.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: response.status === 403 ? "forbidden" : "fetch_error",
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
        });
        return;
      }

      // Check content type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "not_html",
          errorMessage: `Content type is ${contentType}`,
        });
        return;
      }

      // Get content
      const html = await response.text();

      // Check size
      if (html.length > MAX_CONTENT_SIZE) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "too_large",
          errorMessage: `Content size ${html.length} exceeds limit`,
        });
        return;
      }

      // Check for noarchive meta tag
      if (html.includes('name="robots"') && html.includes("noarchive")) {
        await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
          saveId: args.saveId,
          status: "blocked",
          blockedReason: "noarchive",
          errorMessage: "Page has noarchive meta tag",
        });
        return;
      }

      // Parse with Readability (simplified - in production you'd use linkedom + @mozilla/readability)
      // For now, we'll extract basic content
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "Untitled";

      // Extract text content (very simplified)
      const textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const excerpt = textContent.substring(0, 500);
      const wordCount = textContent.split(/\s+/).length;

      // Create content object
      const content = {
        title,
        byline: null,
        content: `<article><p>${excerpt}...</p></article>`, // Simplified
        textContent: textContent.substring(0, 10000),
        excerpt,
        siteName: parsedUrl.hostname,
        length: textContent.length,
        language: null,
      };

      // Store content
      const blob = new Blob([JSON.stringify(content)], { type: "application/json" });
      const storageId = await ctx.storage.store(blob);

      // Calculate content hash
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(content));
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentSha256 = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Update snapshot as ready
      await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
        saveId: args.saveId,
        status: "ready",
        storageId,
        fetchedAt: Date.now(),
        canonicalUrl: response.url,
        title,
        excerpt,
        wordCount,
        contentSha256,
      });
    } catch (error) {
      console.error("[snapshots] Processing error:", error);
      await ctx.runMutation(internal.snapshots.updateSnapshotStatus, {
        saveId: args.saveId,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

// Create snapshot record when save is created (called from saves.create)
export const createSnapshotRecord = internalMutation({
  args: {
    saveId: v.id("saves"),
    spaceId: v.id("spaces"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Create the snapshot record
    await ctx.db.insert("saveSnapshots", {
      saveId: args.saveId,
      spaceId: args.spaceId,
      status: "pending",
      attempts: 0,
    });

    // Schedule processing
    await ctx.scheduler.runAfter(0, internal.snapshots.processSnapshot, {
      saveId: args.saveId,
      url: args.url,
    });
  },
});
