import { normalizeUrl } from "@backpocket/utils";
import { checkDuplicateFromBackground } from "../lib/api";

// =============================================================================
// URL STATUS CACHE
// =============================================================================

/**
 * Cache for URL save status (keyed by normalized URL)
 * This avoids repeated API calls for the same URL
 */
const urlStatusCache = new Map<string, { saved: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// =============================================================================
// ICON MANAGEMENT
// =============================================================================

/**
 * Set the extension icon and badge based on save status
 * Uses a badge to indicate saved state (more visible than icon change alone)
 */
function setIcon(tabId: number, isSaved: boolean) {
  // Use paths without leading slash for WXT compatibility
  browser.action.setIcon({
    tabId,
    path: isSaved
      ? {
          16: "icon/saved/16.png",
          32: "icon/saved/32.png",
          48: "icon/saved/48.png",
        }
      : {
          16: "icon/default/16.png",
          32: "icon/default/32.png",
          48: "icon/default/48.png",
        },
  }).catch((err) => {
    console.error("[Backpocket] Failed to set icon:", err);
  });

  // Also set a badge to make saved state more visible
  if (isSaved) {
    // Show checkmark badge when saved
    browser.action.setBadgeText({ tabId, text: "✓" });
    browser.action.setBadgeBackgroundColor({ tabId, color: "#9dc08b" }); // Green
  } else {
    // Clear badge when not saved
    browser.action.setBadgeText({ tabId, text: "" });
  }
}

/**
 * Set the default (unsaved) icon for a tab
 */
function setDefaultIcon(tabId: number) {
  setIcon(tabId, false);
}

/**
 * Update icon based on URL save status
 * Uses normalized URL for cache keys to handle tracking params consistently
 */
async function updateIconForTab(tabId: number, url: string) {
  console.log("[Backpocket] Checking icon for:", url);
  
  // Normalize URL for consistent cache keys (strips tracking params, www, etc.)
  const normalizedUrl = normalizeUrl(url);

  // Skip invalid or non-http URLs
  if (!normalizedUrl) {
    console.log("[Backpocket] Invalid URL, showing default icon");
    setDefaultIcon(tabId);
    return;
  }

  // Check cache first (using normalized URL as key)
  const cached = urlStatusCache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[Backpocket] Cache hit:", cached.saved ? "SAVED" : "NOT SAVED");
    setIcon(tabId, cached.saved);
    return;
  }

  // Check API (pass original URL - backend normalizes too)
  try {
    console.log("[Backpocket] Checking API for saved status...");
    const isSaved = await checkDuplicateFromBackground(url);
    console.log("[Backpocket] API result:", isSaved ? "SAVED" : "NOT SAVED");
    urlStatusCache.set(normalizedUrl, { saved: isSaved, timestamp: Date.now() });
    setIcon(tabId, isSaved);
  } catch (err) {
    console.error("[Backpocket] Failed to check duplicate:", err);
    // On error, show default icon
    setDefaultIcon(tabId);
  }
}

/**
 * Update icon for the current active tab
 */
async function updateIconForCurrentTab() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id && tabs[0].url) {
      await updateIconForTab(tabs[0].id, tabs[0].url);
    }
  } catch (err) {
    console.error("[Backpocket] Failed to update icon for current tab:", err);
  }
}

// =============================================================================
// BACKGROUND SCRIPT
// =============================================================================

export default defineBackground(() => {
  console.log("[Backpocket] Background script started");

  // Create context menu on install
  browser.runtime.onInstalled.addListener(() => {
    // Remove existing menu items first to avoid duplicates
    browser.contextMenus.removeAll().then(() => {
      browser.contextMenus.create({
        id: "save-to-backpocket",
        title: "Save to Backpocket",
        contexts: ["page", "link"],
      });

      browser.contextMenus.create({
        id: "save-link-to-backpocket",
        title: "Save link to Backpocket",
        contexts: ["link"],
      });
    });
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const url = info.linkUrl || info.pageUrl;
    const title = info.menuItemId === "save-link-to-backpocket" ? undefined : tab?.title;

    if (!url) return;

    // Open popup with the URL pre-filled
    // Note: We can't directly save here without auth token access
    // So we open the popup and pass the URL via storage
    await browser.storage.local.set({
      backpocket_prefill: {
        url,
        title,
        timestamp: Date.now(),
      },
    });

    // Show badge to indicate pending action
    browser.action.setBadgeText({ text: "!" });
    browser.action.setBadgeBackgroundColor({ color: "#c96d3b" });
  });

  // Handle keyboard shortcuts
  browser.commands.onCommand.addListener((command) => {
    if (command === "save-current-page") {
      // Get current tab info and store for popup
      browser.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
        if (tabs[0]) {
          await browser.storage.local.set({
            backpocket_prefill: {
              url: tabs[0].url,
              title: tabs[0].title,
              timestamp: Date.now(),
            },
          });

          // Show badge to indicate ready to save
          browser.action.setBadgeText({ text: "!" });
          browser.action.setBadgeBackgroundColor({ color: "#c96d3b" });

          // Open popup if supported
          if (browser.action.openPopup) {
            browser.action.openPopup().catch(() => {
              // Not supported in all browsers, user will click manually
            });
          }
        }
      });
    }
  });

  // =============================================================================
  // TAB LISTENERS FOR ICON UPDATES
  // =============================================================================

  // Listen for tab URL changes and page load completion
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Update on URL change OR when page finishes loading (for initial loads)
    if (tab.active && tab.url && (changeInfo.url || changeInfo.status === "complete")) {
      updateIconForTab(tabId, tab.url);
    }
  });

  // Listen for tab switches
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await browser.tabs.get(activeInfo.tabId);
      if (tab.url) {
        updateIconForTab(activeInfo.tabId, tab.url);
      }
    } catch {
      // Tab might not exist anymore
    }
  });

  // =============================================================================
  // MESSAGE HANDLERS
  // =============================================================================

  // Handle messages from popup
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "SAVE_SUCCESS") {
      // Update cache and icon if URL was provided
      if (message.url) {
        const cacheKey = normalizeUrl(message.url);
        if (cacheKey) {
          urlStatusCache.set(cacheKey, { saved: true, timestamp: Date.now() });
        }

        // Update icon and badge for current tab if it matches the saved URL
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          if (tabs[0]?.id && tabs[0].url) {
            const tabCacheKey = normalizeUrl(tabs[0].url);
            if (tabCacheKey === cacheKey) {
              setIcon(tabs[0].id, true); // This also sets the persistent badge
            }
          }
        });
      }
    }

    if (message.type === "DELETE_SUCCESS") {
      // Update cache and icon if URL was provided
      if (message.url) {
        const cacheKey = normalizeUrl(message.url);
        if (cacheKey) {
          urlStatusCache.set(cacheKey, { saved: false, timestamp: Date.now() });
        }

        // Update icon for current tab if it matches the deleted URL
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          if (tabs[0]?.id && tabs[0].url) {
            const tabCacheKey = normalizeUrl(tabs[0].url);
            if (tabCacheKey === cacheKey) {
              setIcon(tabs[0].id, false);
            }
          }
        });
      }
    }

    if (message.type === "POPUP_OPENED") {
      // Clear pending badge when popup is opened
      browser.action.setBadgeText({ text: "" });
    }

    if (message.type === "TOKEN_SYNCED") {
      // Token was synced from popup - re-check current tab icon
      // Clear cache since we now have fresh auth
      urlStatusCache.clear();
      updateIconForCurrentTab();
    }

    return false; // No async response needed
  });

  // Clear old prefill data periodically (older than 5 minutes)
  setInterval(() => {
    browser.storage.local.get("backpocket_prefill").then((result) => {
      const prefill = result.backpocket_prefill as { timestamp?: number } | undefined;
      if (prefill?.timestamp && Date.now() - prefill.timestamp > 5 * 60 * 1000) {
        browser.storage.local.remove("backpocket_prefill");
        browser.action.setBadgeText({ text: "" });
      }
    });
  }, 60 * 1000); // Check every minute

  // Initialize: Update icon for current tab on startup
  // Small delay to ensure storage is ready
  setTimeout(() => {
    updateIconForCurrentTab();
  }, 500);
});
