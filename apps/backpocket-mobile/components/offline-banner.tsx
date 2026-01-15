/**
 * Offline Banner Component
 * Shows a persistent banner when the app is in offline mode
 */

import { CloudOff, RefreshCw, Wifi } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useOfflineContext } from "@/lib/offline/context";

interface OfflineBannerProps {
  /** Show at the top of the screen (includes safe area padding) */
  position?: "top" | "inline";
  /** Custom message to display */
  message?: string;
  /** Show the "Try to reconnect" button */
  showReconnect?: boolean;
}

export function OfflineBanner({
  position = "inline",
  message,
  showReconnect = true,
}: OfflineBannerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isOffline, refreshNetworkStatus } = useOfflineContext();
  const [isRetrying, setIsRetrying] = useState(false);

  // Don't render if online
  if (!isOffline) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refreshNetworkStatus();
    } finally {
      // Keep spinner for a moment so user can see the action
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  const displayMessage =
    message ?? "You're offline. Showing cached content.";

  const containerStyle = [
    styles.container,
    { backgroundColor: `${brandColors.amber}15` },
    position === "top" && { paddingTop: insets.top + 8 },
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        <CloudOff size={16} color={brandColors.amber} />
        <Text style={[styles.message, { color: brandColors.amber }]}>
          {displayMessage}
        </Text>
      </View>
      {showReconnect && (
        <TouchableOpacity
          onPress={handleRetry}
          disabled={isRetrying}
          style={[styles.retryButton, { backgroundColor: `${brandColors.amber}25` }]}
          activeOpacity={0.7}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color={brandColors.amber} />
          ) : (
            <>
              <RefreshCw size={14} color={brandColors.amber} />
              <Text style={[styles.retryText, { color: brandColors.amber }]}>
                Retry
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Compact offline indicator for headers or small spaces
 */
export function OfflineIndicator() {
  const { isOffline } = useOfflineContext();

  if (!isOffline) return null;

  return (
    <View style={[styles.indicator, { backgroundColor: `${brandColors.amber}20` }]}>
      <CloudOff size={12} color={brandColors.amber} />
      <Text style={[styles.indicatorText, { color: brandColors.amber }]}>
        Offline
      </Text>
    </View>
  );
}

/**
 * Inline message for when content is not available offline
 */
interface OfflineUnavailableProps {
  message?: string;
}

export function OfflineUnavailable({
  message = "This content is not available offline.",
}: OfflineUnavailableProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.unavailable, { backgroundColor: colors.muted }]}>
      <Wifi size={24} color={colors.mutedForeground} />
      <Text style={[styles.unavailableText, { color: colors.mutedForeground }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: "DMSans-Medium",
    fontWeight: "500",
    flex: 1,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    minWidth: 70,
    justifyContent: "center",
  },
  retryText: {
    fontSize: 12,
    fontFamily: "DMSans-Medium",
    fontWeight: "500",
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  indicatorText: {
    fontSize: 11,
    fontFamily: "DMSans-Medium",
    fontWeight: "500",
  },
  unavailable: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: radii.lg,
    gap: 12,
  },
  unavailableText: {
    fontSize: 14,
    fontFamily: "DMSans",
    textAlign: "center",
  },
});
