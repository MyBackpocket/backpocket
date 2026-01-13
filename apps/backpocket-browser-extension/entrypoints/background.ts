export default defineBackground(() => {
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

  // Handle messages from popup
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "SAVE_SUCCESS") {
      // Clear badge on successful save
      browser.action.setBadgeText({ text: "" });

      // Show success badge briefly
      browser.action.setBadgeText({ text: "✓" });
      browser.action.setBadgeBackgroundColor({ color: "#9dc08b" });

      setTimeout(() => {
        browser.action.setBadgeText({ text: "" });
      }, 2000);
    }

    if (message.type === "POPUP_OPENED") {
      // Clear pending badge when popup is opened
      browser.action.setBadgeText({ text: "" });
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
});
