/**
 * Offline Settings Screen
 * Configure offline storage and sync preferences
 */

import * as Haptics from "expo-haptics";
import {
  AlertCircle,
  Check,
  Cloud,
  CloudOff,
  Database,
  Download,
  FolderOpen,
  HardDrive,
  History,
  RefreshCw,
  Star,
  Trash2,
  Wifi,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brandColors, radii } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme-color";
import { useListCollections } from "@/lib/convex/hooks";
import {
  type SyncMode,
  useSyncState,
  useSync,
  useClearOfflineData,
  useStorageStats,
} from "@/lib/offline";
import { useSettings } from "@/lib/settings";

const SYNC_MODE_OPTIONS: {
  value: SyncMode;
  label: string;
  description: string;
  icon: typeof Star;
}[] = [
  {
    value: "all",
    label: "All Saves",
    description: "Download all your saves",
    icon: Database,
  },
  {
    value: "favorites",
    label: "Favorites Only",
    description: "Download only favorited saves",
    icon: Star,
  },
  {
    value: "recent",
    label: "Recent",
    description: "Download saves from the last 30 days",
    icon: History,
  },
  {
    value: "collections",
    label: "Collections",
    description: "Choose specific collections to download",
    icon: FolderOpen,
  },
];

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return "Never";
  
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default function OfflineSettingsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { settings, updateOfflineSettings } = useSettings();
  const offlineSettings = settings.offline;
  
  const syncState = useSyncState();
  const { sync, isLoading: isSyncing, progress } = useSync(offlineSettings);
  const { clearData, isClearing } = useClearOfflineData();
  const { stats, isLoading: isLoadingStats, refresh: refreshStats } = useStorageStats();
  const collections = useListCollections() ?? [];
  
  // Local state for collections selection
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(
    offlineSettings.collectionIds ?? []
  );

  // Update local state when settings change
  useEffect(() => {
    setSelectedCollectionIds(offlineSettings.collectionIds ?? []);
  }, [offlineSettings.collectionIds]);

  // Toggle offline mode
  const handleToggleEnabled = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateOfflineSettings({ enabled: !offlineSettings.enabled });
    
    // If enabling, trigger initial sync
    if (!offlineSettings.enabled) {
      sync();
    }
  }, [offlineSettings.enabled, updateOfflineSettings, sync]);

  // Change sync mode
  const handleSyncModeChange = useCallback(async (mode: SyncMode) => {
    Haptics.selectionAsync();
    await updateOfflineSettings({ syncMode: mode });
  }, [updateOfflineSettings]);

  // Toggle WiFi only
  const handleToggleWifiOnly = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateOfflineSettings({ wifiOnly: !offlineSettings.wifiOnly });
  }, [offlineSettings.wifiOnly, updateOfflineSettings]);

  // Toggle auto sync
  const handleToggleAutoSync = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateOfflineSettings({ autoSync: !offlineSettings.autoSync });
  }, [offlineSettings.autoSync, updateOfflineSettings]);

  // Toggle collection selection
  const handleToggleCollection = useCallback(async (collectionId: string) => {
    Haptics.selectionAsync();
    const newIds = selectedCollectionIds.includes(collectionId)
      ? selectedCollectionIds.filter((id) => id !== collectionId)
      : [...selectedCollectionIds, collectionId];
    
    setSelectedCollectionIds(newIds);
    await updateOfflineSettings({ collectionIds: newIds });
  }, [selectedCollectionIds, updateOfflineSettings]);

  // Manual sync
  const handleSync = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await sync();
    await refreshStats();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [sync, refreshStats]);

  // Clear offline data
  const handleClearData = useCallback(() => {
    Alert.alert(
      "Clear Offline Data",
      "This will delete all cached saves, snapshots, and images. You can re-sync later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearData();
            await refreshStats();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [clearData, refreshStats]);

  // Storage usage percentage
  const storageUsagePercent = useMemo(() => {
    if (!stats) return 0;
    const maxBytes = offlineSettings.maxStorageMB * 1024 * 1024;
    return Math.min(100, Math.round((stats.totalSize / maxBytes) * 100));
  }, [stats, offlineSettings.maxStorageMB]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 32 },
      ]}
    >
      {/* Enable Offline Mode */}
      <Card style={styles.mainCard}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${brandColors.teal}20` }]}>
              {offlineSettings.enabled ? (
                <CloudOff size={22} color={brandColors.teal} />
              ) : (
                <Cloud size={22} color={colors.mutedForeground} />
              )}
            </View>
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>
                Offline Mode
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
                {offlineSettings.enabled
                  ? "Saves are cached for offline reading"
                  : "Enable to read saves without internet"}
              </Text>
            </View>
          </View>
          <Switch
            value={offlineSettings.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: colors.muted, true: brandColors.teal }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      {offlineSettings.enabled && (
        <>
          {/* Sync Status */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusLeft}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        syncState.status === "syncing"
                          ? brandColors.amber
                          : syncState.isOnline
                            ? brandColors.mint
                            : brandColors.rust.DEFAULT,
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {syncState.status === "syncing"
                    ? "Syncing..."
                    : syncState.isOnline
                      ? "Online"
                      : "Offline"}
                </Text>
              </View>
              <Text style={[styles.lastSyncText, { color: colors.mutedForeground }]}>
                Last sync: {formatRelativeTime(syncState.lastSyncedAt)}
              </Text>
            </View>

            {/* Sync Progress */}
            {progress && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: brandColors.teal,
                        width: `${(progress.current / progress.total) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                  {progress.phase === "saves" && "Syncing saves..."}
                  {progress.phase === "snapshots" && "Downloading content..."}
                  {progress.phase === "images" && "Caching images..."}
                  {" "}({progress.current}/{progress.total})
                </Text>
              </View>
            )}

            <Button
              variant="outline"
              onPress={handleSync}
              disabled={isSyncing || !syncState.isOnline}
              style={styles.syncButton}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <RefreshCw size={18} color={colors.text} />
              )}
              <Text style={[styles.syncButtonText, { color: colors.text }]}>
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Text>
            </Button>
          </Card>

          {/* What to Sync */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            What to Download
          </Text>
          <Card style={styles.card}>
            {SYNC_MODE_OPTIONS.map((option, index) => {
              const isSelected = offlineSettings.syncMode === option.value;
              const Icon = option.icon;
              const isLast = index === SYNC_MODE_OPTIONS.length - 1;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    !isLast && { borderBottomColor: colors.border },
                    !isLast && styles.optionBorder,
                  ]}
                  onPress={() => handleSyncModeChange(option.value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: isSelected ? `${brandColors.teal}20` : colors.muted },
                    ]}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? brandColors.teal : colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>
                      {option.description}
                    </Text>
                  </View>
                  {isSelected && <Check size={22} color={brandColors.teal} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Collections Selection */}
          {offlineSettings.syncMode === "collections" && collections.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                Select Collections
              </Text>
              <Card style={styles.card}>
                {collections.map((collection, index) => {
                  const isSelected = selectedCollectionIds.includes(collection.id);
                  const isLast = index === collections.length - 1;

                  return (
                    <TouchableOpacity
                      key={collection.id}
                      style={[
                        styles.collectionRow,
                        !isLast && { borderBottomColor: colors.border },
                        !isLast && styles.optionBorder,
                      ]}
                      onPress={() => handleToggleCollection(collection.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.collectionInfo}>
                        <FolderOpen size={18} color={colors.mutedForeground} />
                        <Text style={[styles.collectionName, { color: colors.text }]}>
                          {collection.name}
                        </Text>
                        {collection._count && (
                          <Text style={[styles.collectionCount, { color: colors.mutedForeground }]}>
                            {collection._count.saves} saves
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected ? brandColors.teal : "transparent",
                            borderColor: isSelected ? brandColors.teal : colors.border,
                          },
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </>
          )}

          {/* Sync Options */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Sync Options
          </Text>
          <Card style={styles.card}>
            <View style={[styles.toggleRow, styles.optionBorder, { borderBottomColor: colors.border }]}>
              <View style={styles.toggleContent}>
                <View style={[styles.smallIcon, { backgroundColor: colors.muted }]}>
                  <Wifi size={18} color={colors.mutedForeground} />
                </View>
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>WiFi Only</Text>
                  <Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
                    Only sync when connected to WiFi
                  </Text>
                </View>
              </View>
              <Switch
                value={offlineSettings.wifiOnly}
                onValueChange={handleToggleWifiOnly}
                trackColor={{ false: colors.muted, true: brandColors.teal }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <View style={[styles.smallIcon, { backgroundColor: colors.muted }]}>
                  <Zap size={18} color={colors.mutedForeground} />
                </View>
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleTitle, { color: colors.text }]}>Auto Sync</Text>
                  <Text style={[styles.toggleDescription, { color: colors.mutedForeground }]}>
                    Automatically sync when app opens
                  </Text>
                </View>
              </View>
              <Switch
                value={offlineSettings.autoSync}
                onValueChange={handleToggleAutoSync}
                trackColor={{ false: colors.muted, true: brandColors.teal }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>

          {/* Storage Usage */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Storage
          </Text>
          <Card style={styles.card}>
            {isLoadingStats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.mutedForeground} />
              </View>
            ) : stats ? (
              <>
                {/* Usage Bar */}
                <View style={styles.storageHeader}>
                  <View style={styles.storageInfo}>
                    <HardDrive size={18} color={colors.mutedForeground} />
                    <Text style={[styles.storageLabel, { color: colors.text }]}>
                      {formatBytes(stats.totalSize)} used
                    </Text>
                  </View>
                  <Text style={[styles.storagePercent, { color: colors.mutedForeground }]}>
                    {storageUsagePercent}% of {offlineSettings.maxStorageMB} MB
                  </Text>
                </View>

                <View style={[styles.usageBar, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.usageFill,
                      {
                        backgroundColor:
                          storageUsagePercent > 90
                            ? brandColors.rust.DEFAULT
                            : storageUsagePercent > 70
                              ? brandColors.amber
                              : brandColors.teal,
                        width: `${storageUsagePercent}%`,
                      },
                    ]}
                  />
                </View>

                {/* Storage Breakdown */}
                <View style={styles.storageBreakdown}>
                  <View style={styles.storageItem}>
                    <Database size={14} color={colors.mutedForeground} />
                    <Text style={[styles.storageItemText, { color: colors.mutedForeground }]}>
                      {stats.savesCount} saves ({formatBytes(stats.databaseSize)})
                    </Text>
                  </View>
                  <View style={styles.storageItem}>
                    <Download size={14} color={colors.mutedForeground} />
                    <Text style={[styles.storageItemText, { color: colors.mutedForeground }]}>
                      {stats.imagesCount} images ({formatBytes(stats.imageCacheSize)})
                    </Text>
                  </View>
                </View>

                {/* Clear Button */}
                <Button
                  variant="outline"
                  onPress={handleClearData}
                  disabled={isClearing || stats.totalSize === 0}
                  style={styles.clearButton}
                >
                  {isClearing ? (
                    <ActivityIndicator size="small" color={brandColors.rust.DEFAULT} />
                  ) : (
                    <Trash2 size={18} color={brandColors.rust.DEFAULT} />
                  )}
                  <Text style={[styles.clearButtonText, { color: brandColors.rust.DEFAULT }]}>
                    Clear Offline Data
                  </Text>
                </Button>
              </>
            ) : (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color={colors.mutedForeground} />
                <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
                  Unable to load storage info
                </Text>
              </View>
            )}
          </Card>

          {/* Help Text */}
          <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
            Offline mode caches your saves and their content so you can read them without an
            internet connection. Images are also downloaded for offline viewing.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  mainCard: {
    marginBottom: 24,
  },
  statusCard: {
    marginBottom: 24,
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "DMSans-Medium",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 12,
  },
  // Toggle row styles
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontFamily: "DMSans-Medium",
    fontWeight: "500",
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    fontFamily: "DMSans",
    lineHeight: 18,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  smallIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  // Status card styles
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "DMSans-Medium",
  },
  lastSyncText: {
    fontSize: 13,
    fontFamily: "DMSans",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "DMSans",
    textAlign: "center",
  },
  syncButton: {
    flexDirection: "row",
    gap: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontFamily: "DMSans-Medium",
  },
  // Option styles
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: "DMSans-Medium",
    fontWeight: "500",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "DMSans",
  },
  // Collection styles
  collectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  collectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  collectionName: {
    fontSize: 15,
    fontFamily: "DMSans-Medium",
    flex: 1,
  },
  collectionCount: {
    fontSize: 13,
    fontFamily: "DMSans",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // Storage styles
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  storageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 12,
  },
  storageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  storageLabel: {
    fontSize: 15,
    fontFamily: "DMSans-Medium",
  },
  storagePercent: {
    fontSize: 13,
    fontFamily: "DMSans",
  },
  usageBar: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  usageFill: {
    height: "100%",
    borderRadius: 4,
  },
  storageBreakdown: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  storageItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  storageItemText: {
    fontSize: 13,
    fontFamily: "DMSans",
  },
  clearButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    gap: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontFamily: "DMSans-Medium",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "DMSans",
  },
  helpText: {
    fontSize: 13,
    fontFamily: "DMSans",
    lineHeight: 20,
    marginLeft: 4,
    marginTop: 4,
  },
});
