/**
 * SegmentedControl
 * A reusable tab control component with animated indicator
 */

import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brandColors, radii } from "@/constants/theme";
import type { useThemeColors } from "@/hooks/use-theme-color";

export interface Segment {
  value: string;
  label: string;
  /** Optional indicator (e.g., dot) when segment has content */
  hasContent?: boolean;
}

interface SegmentedControlProps {
  segments: Segment[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  colors: ReturnType<typeof useThemeColors>;
}

const PADDING = 4;

export function SegmentedControl({
  segments,
  selectedValue,
  onValueChange,
  colors,
}: SegmentedControlProps) {
  const selectedIndex = segments.findIndex((s) => s.value === selectedValue);
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  // Calculate segment width based on container
  const segmentWidth = containerWidth > 0 ? (containerWidth - PADDING * 2) / segments.length : 0;

  // Animate indicator when selection changes or container width is measured
  useEffect(() => {
    if (segmentWidth > 0) {
      Animated.spring(indicatorPosition, {
        toValue: selectedIndex * segmentWidth,
        tension: 68,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedIndex, segmentWidth, indicatorPosition]);

  const handlePress = (segment: Segment) => {
    if (segment.value !== selectedValue) {
      Haptics.selectionAsync();
      onValueChange(segment.value);
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.muted }]} onLayout={handleLayout}>
      {/* Animated indicator */}
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colors.card,
              width: segmentWidth,
              transform: [{ translateX: indicatorPosition }],
            },
          ]}
        />
      )}

      {/* Segments */}
      {segments.map((segment) => {
        const isSelected = segment.value === selectedValue;
        return (
          <Pressable
            key={segment.value}
            onPress={() => handlePress(segment)}
            style={styles.segment}
          >
            <View style={styles.segmentContent}>
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: isSelected ? colors.text : colors.mutedForeground,
                    fontFamily: isSelected ? "DMSans-Medium" : "DMSans",
                  },
                ]}
              >
                {segment.label}
              </Text>
              {segment.hasContent && !isSelected && (
                <View style={[styles.contentDot, { backgroundColor: brandColors.amber }]} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: radii.md,
    padding: PADDING,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radii.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  segmentContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
  },
  contentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
