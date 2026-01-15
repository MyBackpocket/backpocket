/**
 * Offline Sign-In Required Screen
 * Shown when the app is offline and there's no cached user session
 */

import { CloudOff, RefreshCw, Wifi } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useOfflineContext } from "@/lib/offline/context";

interface OfflineSignInRequiredProps {
  /** Callback when the user requests to retry connection */
  onRetry?: () => void;
}

export function OfflineSignInRequired({ onRetry }: OfflineSignInRequiredProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { refreshNetworkStatus } = useOfflineContext();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refreshNetworkStatus();
      onRetry?.();
    } finally {
      // Keep spinner for a moment to show feedback
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: `${brandColors.amber}15` }]}>
          <CloudOff size={48} color={brandColors.amber} strokeWidth={1.5} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>You're Offline</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Connect to the internet to sign in and access your saves.
        </Text>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Wifi size={20} color={colors.mutedForeground} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Offline Mode Available
            </Text>
            <Text style={[styles.infoDescription, { color: colors.mutedForeground }]}>
              Once you sign in online, your saves will be available offline too.
              Enable offline mode in Settings to sync your data.
            </Text>
          </View>
        </View>

        {/* Retry button */}
        <Button
          onPress={handleRetry}
          disabled={isRetrying}
          style={styles.retryButton}
        >
          {isRetrying ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Checking connection...</Text>
            </>
          ) : (
            <>
              <RefreshCw size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </>
          )}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Fraunces-Bold",
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: "DMSans",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 12,
    marginBottom: 32,
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: "DMSans-Bold",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    fontFamily: "DMSans",
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    gap: 8,
    minWidth: 180,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "DMSans-Medium",
    fontWeight: "500",
  },
});
