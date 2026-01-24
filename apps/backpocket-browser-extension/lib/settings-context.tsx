/**
 * Settings Context
 *
 * Provides settings state to all components with automatic sync to local storage
 * and optional sync to Convex account.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMySpace, updateAccountSettings } from "./api";
import { useAuth } from "./auth";
import {
  type ExtensionSettings,
  loadSettings,
  mergeWithAccountSettings,
  type SaveVisibility,
  saveSettings,
  type Theme,
} from "./settings";

interface SettingsContextValue {
  /** Current settings */
  settings: ExtensionSettings;
  /** Whether settings are still loading */
  isLoading: boolean;
  /** Update a single setting */
  updateSetting: <K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ) => Promise<void>;
  /** Reload settings from storage and account */
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const DEFAULT_SETTINGS: ExtensionSettings = {
  defaultSaveVisibility: "private",
  theme: "system",
  syncToAccount: true,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount and when auth changes
  const loadAllSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load local settings first
      let localSettings = await loadSettings();

      // If signed in and sync is enabled, merge with account settings
      if (isSignedIn) {
        try {
          const token = await getToken();
          if (token) {
            const space = await getMySpace(token);
            if (space && localSettings.syncToAccount) {
              localSettings = mergeWithAccountSettings(localSettings, {
                defaultSaveVisibility: space.defaultSaveVisibility as SaveVisibility,
                theme: (space as { theme?: Theme | null }).theme ?? null,
              });
              // Save merged settings back to local
              await saveSettings(localSettings);
            }
          }
        } catch {
          // Continue with local settings if account fetch fails
        }
      }

      setSettings(localSettings);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      loadAllSettings();
    }
  }, [isLoaded, loadAllSettings]);

  // Update a single setting
  const updateSetting = useCallback(
    async <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);

      // Sync to account if enabled and it's a syncable setting
      if (
        newSettings.syncToAccount &&
        isSignedIn &&
        (key === "defaultSaveVisibility" || key === "theme")
      ) {
        try {
          const token = await getToken();
          if (token) {
            await updateAccountSettings(
              { [key]: value } as { defaultSaveVisibility?: SaveVisibility; theme?: Theme },
              token
            );
          }
        } catch {
          // Silently fail account sync - local is still updated
        }
      }

      // Special handling for sync toggle
      if (key === "syncToAccount" && value === true && isSignedIn) {
        // When enabling sync, push current local settings to account
        try {
          const token = await getToken();
          if (token) {
            await updateAccountSettings(
              {
                defaultSaveVisibility: newSettings.defaultSaveVisibility,
                theme: newSettings.theme,
              },
              token
            );
          }
        } catch {
          // Silently fail
        }
      }
    },
    [settings, isSignedIn, getToken]
  );

  const contextValue = useMemo(
    () => ({
      settings,
      isLoading,
      updateSetting,
      reloadSettings: loadAllSettings,
    }),
    [settings, isLoading, updateSetting, loadAllSettings]
  );

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
