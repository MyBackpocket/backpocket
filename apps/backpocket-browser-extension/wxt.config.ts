import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  dev: {
    server: {
      port: 3001,
    },
  },
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Backpocket",
    description: "Save links to your Backpocket",
    permissions: ["activeTab", "storage", "tabs", "contextMenus", "cookies"],
    host_permissions: [
      // App API (both http and https for cookie access)
      "https://backpocket.my/*",
      "http://backpocket.my/*",
      // Clerk sync host (localhost for dev, production domain for prod)
      "http://localhost/*",
      // Clerk Frontend API (for session sync)
      "https://*.clerk.accounts.dev/*",
      "https://*.clerk.com/*",
      // Custom Clerk domain for production
      "https://clerk.backpocket.my/*",
    ],
    commands: {
      "save-current-page": {
        suggested_key: {
          default: "Ctrl+Shift+S",
          mac: "Command+Shift+S",
        },
        description: "Save current page to Backpocket",
      },
    },
  },
});
