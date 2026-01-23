/**
 * App-wide providers wrapper
 * Combines Clerk, React Query, API Client, Theme providers
 *
 * Implements offline-first architecture:
 * - Checks network status BEFORE initializing Clerk
 * - Uses cached auth when offline (if available)
 * - Shows offline sign-in screen when offline without cached auth
 */

import { ClerkLoaded, ClerkProvider, useUser } from "@clerk/clerk-expo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { ShareIntentProvider } from "expo-share-intent";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

import { OfflineSignInRequired } from "@/components/offline-sign-in-required";
import { brandColors, Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { tokenCache } from "@/lib/auth/token-cache";
import { ClerkAvailableProvider } from "@/lib/auth/safe-hooks";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/constants";
import { ConvexProvider, OfflineConvexProvider } from "@/lib/convex";
import {
  type CachedUser,
  cacheUser,
  getCachedUser,
  clearCachedUser,
  OfflineProvider,
  useOfflineContext,
  useAutoSync,
  checkNetworkStatus,
  initializeOffline,
  subscribeSyncState,
} from "@/lib/offline";
import { SettingsContext, type ThemePreference, useSettingsStore, useSettings } from "@/lib/settings";
import { ThemeProvider } from "@/lib/theme/provider";

// Custom navigation themes with Backpocket colors
const BackpocketLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: brandColors.rust.DEFAULT,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: brandColors.rust.DEFAULT,
  },
};

const BackpocketDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: brandColors.amber,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: brandColors.amber,
  },
};

interface ProvidersProps {
  children: ReactNode;
}

interface InnerProvidersProps extends ProvidersProps {
  themePreference: ThemePreference;
  cachedUser?: CachedUser | null;
}

/**
 * Component that caches the Clerk user when available
 * This runs ABOVE OfflineProvider - it caches to SecureStore for persistence
 */
function UserCacher({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Cache user for offline access
      cacheUser(user);
    } else if (isLoaded && !isSignedIn) {
      // Clear cache when signed out
      clearCachedUser();
    }
  }, [isLoaded, isSignedIn, user]);

  return <>{children}</>;
}

/**
 * Component that syncs Clerk user state to OfflineContext
 * This runs INSIDE OfflineProvider - it updates the React state for immediate use
 */
function ClerkUserSync({ children }: { children: ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { updateCachedUser, cachedUser } = useOfflineContext();

  // Extract stable values from user to avoid infinite loops
  const userId = user?.id;
  const userFirstName = user?.firstName;
  const userLastName = user?.lastName;
  const userFullName = user?.fullName;
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userImageUrl = user?.imageUrl;

  const cachedUserId = cachedUser?.id;

  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      // Only update if the user ID changed (avoid unnecessary updates)
      if (cachedUserId !== userId) {
        updateCachedUser({
          id: userId,
          firstName: userFirstName ?? null,
          lastName: userLastName ?? null,
          fullName: userFullName ?? null,
          email: userEmail ?? null,
          imageUrl: userImageUrl ?? null,
          cachedAt: Date.now(),
        });
      }
    } else if (isLoaded && !isSignedIn && cachedUserId) {
      // Clear the cached user when signed out
      updateCachedUser(null);
    }
  }, [isLoaded, isSignedIn, userId, userFirstName, userLastName, userFullName, userEmail, userImageUrl, cachedUserId, updateCachedUser]);

  return <>{children}</>;
}

/**
 * Component that triggers auto-sync when offline mode is enabled
 * This runs INSIDE ConvexProvider so it has access to Convex hooks
 */
function AutoSyncManager({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const offlineSettings = settings.offline;
  
  // Trigger auto-sync when offline mode is enabled
  useAutoSync(offlineSettings, offlineSettings.enabled);
  
  return <>{children}</>;
}

function InnerProviders({ children, themePreference, cachedUser }: InnerProvidersProps) {
  const colorScheme = useColorScheme();

  // Determine effective color scheme based on preference
  const effectiveScheme = themePreference === "system" ? colorScheme : themePreference;
  const navigationTheme = effectiveScheme === "dark" ? BackpocketDarkTheme : BackpocketLightTheme;

  return (
    <ThemeProvider forcedColorScheme={themePreference}>
      <OfflineProvider initialCachedUser={cachedUser}>
        {/* Sync Clerk user to OfflineContext for immediate access */}
        <ClerkUserSync>
          {/* Mark Clerk as available - we have ClerkProvider in the tree */}
          <ClerkAvailableProvider available={true}>
            <ConvexProvider>
              {/* Auto-sync offline data when enabled */}
              <AutoSyncManager>
                <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
              </AutoSyncManager>
            </ConvexProvider>
          </ClerkAvailableProvider>
        </ClerkUserSync>
      </OfflineProvider>
    </ThemeProvider>
  );
}

function SettingsWrapper({ children, cachedUser }: ProvidersProps & { cachedUser?: CachedUser | null }) {
  const settingsStore = useSettingsStore();

  return (
    <SettingsContext.Provider value={settingsStore}>
      <InnerProviders themePreference={settingsStore.settings.theme} cachedUser={cachedUser}>
        {children}
      </InnerProviders>
    </SettingsContext.Provider>
  );
}

/**
 * Offline-aware settings wrapper
 * Uses cached auth when offline instead of requiring Clerk
 */
function OfflineAwareSettingsWrapper({
  children,
  cachedUser,
}: {
  children: ReactNode;
  cachedUser: CachedUser | null;
}) {
  const settingsStore = useSettingsStore();
  const colorScheme = useColorScheme();
  
  // Determine effective color scheme
  const effectiveScheme = settingsStore.settings.theme === "system" 
    ? colorScheme 
    : settingsStore.settings.theme;

  return (
    <SettingsContext.Provider value={settingsStore}>
      <ThemeProvider forcedColorScheme={settingsStore.settings.theme}>
        <OfflineProvider initialCachedUser={cachedUser} isOfflineOnly={true}>
          {/* Mark Clerk as not available - we're in offline-only mode */}
          <ClerkAvailableProvider available={false}>
            {/* Use OfflineConvexProvider - provides context without auth */}
            <OfflineConvexProvider>
              <NavigationThemeProvider
                value={effectiveScheme === "dark" ? BackpocketDarkTheme : BackpocketLightTheme}
              >
                {children}
              </NavigationThemeProvider>
            </OfflineConvexProvider>
          </ClerkAvailableProvider>
        </OfflineProvider>
      </ThemeProvider>
    </SettingsContext.Provider>
  );
}

/**
 * Loading screen shown while checking network and auth status
 */
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={brandColors.rust.DEFAULT} />
    </View>
  );
}

export function Providers({ children }: ProvidersProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedUser, setCachedUser] = useState<CachedUser | null>(null);

  // Check network status and load cached user on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize offline storage
        await initializeOffline();

        // Check network status
        const { isOnline } = await checkNetworkStatus();
        setIsOffline(!isOnline);

        // Load cached user
        const user = await getCachedUser();
        setCachedUser(user);

        console.log(`[providers] Initialized - Online: ${isOnline}, Cached user: ${user?.id ?? "none"}`);
      } catch (error) {
        console.error("[providers] Initialization error:", error);
        // Default to online mode on error
        setIsOffline(false);
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();
  }, []);

  // Subscribe to network status changes (sync manager auto-monitors network)
  useEffect(() => {
    const unsubscribe = subscribeSyncState((state) => {
      setIsOffline(!state.isOnline);
    });
    
    return unsubscribe;
  }, []);

  // Show loading screen while initializing
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // If Clerk key is not configured, render without Clerk (for development)
  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn("[auth] Clerk publishable key not configured. Auth features disabled.");
    return (
      <ShareIntentProvider options={{ debug: true }}>
        <SettingsWrapper cachedUser={cachedUser}>{children}</SettingsWrapper>
      </ShareIntentProvider>
    );
  }

  // OFFLINE + NO CACHED USER = Show sign-in required screen
  if (isOffline && !cachedUser) {
    return (
      <ShareIntentProvider options={{ debug: true }}>
        <OfflineAwareSettingsWrapper cachedUser={null}>
          <OfflineSignInRequired
            onRetry={async () => {
              const { isOnline } = await checkNetworkStatus();
              setIsOffline(!isOnline);
            }}
          />
        </OfflineAwareSettingsWrapper>
      </ShareIntentProvider>
    );
  }

  // OFFLINE + CACHED USER = Use offline mode with cached data
  if (isOffline && cachedUser) {
    console.log("[providers] Starting in offline mode with cached user");
    return (
      <ShareIntentProvider options={{ debug: true }}>
        <OfflineAwareSettingsWrapper cachedUser={cachedUser}>
          {children}
        </OfflineAwareSettingsWrapper>
      </ShareIntentProvider>
    );
  }

  // ONLINE = Normal Clerk + Convex flow
  return (
    <ShareIntentProvider options={{ debug: true }}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ClerkLoaded>
          <UserCacher>
            <SettingsWrapper cachedUser={cachedUser}>{children}</SettingsWrapper>
          </UserCacher>
        </ClerkLoaded>
      </ClerkProvider>
    </ShareIntentProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
  },
});
