/**
 * Not Found / Catch-all Route
 *
 * This handles unmatched routes, including share extension deep links.
 * When expo-sharing opens the app via share extension, it uses the `/expo-sharing` path.
 * We catch it here and redirect to the /share route where getSharedPayloads() will
 * read the shared data.
 */

import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { Redirect, useGlobalSearchParams, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { brandColors } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";

export default function NotFoundScreen() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const colors = useThemeColors();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  useEffect(() => {
    // Debug logging
    console.log("[+not-found] === Not Found Screen ===");
    console.log("[+not-found] pathname:", pathname);
    console.log("[+not-found] params:", JSON.stringify(params, null, 2));

    // Get initial URL for more context
    Linking.getInitialURL().then((url) => {
      console.log("[+not-found] Initial URL:", url);
    });

    // Check if this is an expo-sharing deep link (new format)
    // The share extension opens the app with /expo-sharing path
    const isExpoSharingPath = pathname === "/expo-sharing" || pathname.startsWith("/expo-sharing");

    // Also check if there are shared payloads available
    const sharedPayloads = Sharing.getSharedPayloads();
    const hasSharedPayloads = sharedPayloads.length > 0;

    console.log("[+not-found] isExpoSharingPath:", isExpoSharingPath);
    console.log("[+not-found] hasSharedPayloads:", hasSharedPayloads);
    console.log("[+not-found] sharedPayloads:", JSON.stringify(sharedPayloads, null, 2));

    // Redirect to share screen if this is a share intent
    if (isExpoSharingPath || hasSharedPayloads) {
      console.log("[+not-found] Redirecting to /share");
      setShouldRedirect("/share");
      return;
    }

    // For other unmatched routes, redirect to home
    console.log("[+not-found] Redirecting to /(tabs)");
    setShouldRedirect("/(tabs)");
  }, [pathname, params]);

  // Redirect once we've determined where to go
  if (shouldRedirect) {
    return <Redirect href={shouldRedirect as "/(tabs)"} />;
  }

  // Show loading while determining redirect
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={brandColors.rust.DEFAULT} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  text: {
    fontSize: 16,
    fontFamily: "DMSans",
  },
});
