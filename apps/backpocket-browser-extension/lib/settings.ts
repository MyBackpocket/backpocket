/**
 * Extension settings storage utilities
 *
 * Manages local settings that can optionally sync to the user's Convex account.
 */

export type Theme = "light" | "dark" | "system";
export type SaveVisibility = "public" | "private";

export interface ExtensionSettings {
  /** Default visibility for new saves */
  defaultSaveVisibility: SaveVisibility;
  /** Theme preference */
  theme: Theme;
  /** Whether to sync settings changes to the account */
  syncToAccount: boolean;
}

const STORAGE_KEY = "backpocket_settings";

const DEFAULT_SETTINGS: ExtensionSettings = {
  defaultSaveVisibility: "private",
  theme: "system",
  syncToAccount: true,
};

/**
 * Load settings from local storage
 */
export async function loadSettings(): Promise<ExtensionSettings> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined;

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    // Merge with defaults to handle missing fields
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to local storage
 */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: settings });
}

/**
 * Update specific settings fields
 */
export async function updateSettings(
  updates: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const current = await loadSettings();
  const updated = { ...current, ...updates };
  await saveSettings(updated);
  return updated;
}

/**
 * Merge account settings into local settings
 * Account values take precedence when sync is enabled
 */
export function mergeWithAccountSettings(
  local: ExtensionSettings,
  account: { defaultSaveVisibility?: SaveVisibility | null; theme?: Theme | null } | null
): ExtensionSettings {
  if (!account) {
    return local;
  }

  return {
    ...local,
    defaultSaveVisibility: account.defaultSaveVisibility ?? local.defaultSaveVisibility,
    theme: account.theme ?? local.theme,
  };
}

/**
 * Clear all settings (reset to defaults)
 */
export async function clearSettings(): Promise<void> {
  await browser.storage.local.remove(STORAGE_KEY);
}
