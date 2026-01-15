import { Redirect, Tabs } from "expo-router";
import { Bookmark, FolderOpen, LayoutGrid, Settings } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Colors, type ColorsTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/constants";
import { useEnsureSpace, useGetMySpace } from "@/lib/convex/hooks";
import { useSafeAuth, useIsClerkAvailable } from "@/lib/auth/safe-hooks";
import { useOfflineContext } from "@/lib/offline/context";

/**
 * Tab layout with auth protection
 * Redirects to sign-in if user is not authenticated (when online)
 * Uses cached auth when offline
 * Automatically creates user's space on first app access
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // Safe auth hook - works both online and offline
  const auth = useSafeAuth();
  const isClerkAvailable = useIsClerkAvailable();
  const { isOffline, cachedUser } = useOfflineContext();
  
  // Determine auth state
  const isSignedIn = auth.isSignedIn;
  const isLoaded = auth.isLoaded;

  // Space auto-creation for new users (only when online)
  const space = useGetMySpace();
  const ensureSpace = useEnsureSpace();
  const hasCalledEnsureSpace = useRef(false);

  // Auto-create space when user is signed in but has no space (online only)
  useEffect(() => {
    if (isClerkAvailable && isSignedIn && space === null && !hasCalledEnsureSpace.current) {
      hasCalledEnsureSpace.current = true;
      ensureSpace();
    }
  }, [isClerkAvailable, isSignedIn, space, ensureSpace]);

  // If Clerk is not configured, show tabs without auth (development mode)
  if (!CLERK_PUBLISHABLE_KEY) {
    return <TabsNavigator colors={colors} />;
  }

  // Show loading spinner while checking auth (only when online)
  if (isClerkAvailable && !isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // When offline with cached user, allow access
  if (isOffline && cachedUser) {
    return <TabsNavigator colors={colors} />;
  }

  // Redirect to sign-in if not authenticated (when online)
  if (isClerkAvailable && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <TabsNavigator colors={colors} />;
}

interface TabsNavigatorProps {
  colors: ColorsTheme;
}

function TabsNavigator({ colors }: TabsNavigatorProps) {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      sceneContainerStyle={{
        backgroundColor: colors.background,
      }}
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          paddingHorizontal: 8,
          // Subtle top shadow instead of border
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 0,
          ...Platform.select({
            ios: {
              shadowColor: "transparent",
              shadowOpacity: 0,
            },
            android: {
              elevation: 0,
            },
          }),
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: "DMSans-Bold",
          fontWeight: "600",
          fontSize: 18,
        },
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontFamily: "DMSans-Medium",
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <LayoutGrid
              size={22}
              color={focused ? colors.tint : color}
              strokeWidth={focused ? 2.5 : 1.75}
              fill={focused ? colors.tint : "transparent"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saves"
        options={{
          title: "Saves",
          tabBarIcon: ({ color, focused }) => (
            <Bookmark
              size={22}
              color={focused ? colors.tint : color}
              strokeWidth={focused ? 2.5 : 1.75}
              fill={focused ? colors.tint : "transparent"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: "Collections",
          tabBarIcon: ({ color, focused }) => (
            <FolderOpen
              size={22}
              color={focused ? colors.tint : color}
              strokeWidth={focused ? 2.5 : 1.75}
              fill={focused ? colors.tint : "transparent"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Settings
              size={22}
              color={focused ? colors.tint : color}
              strokeWidth={focused ? 2.5 : 1.75}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
