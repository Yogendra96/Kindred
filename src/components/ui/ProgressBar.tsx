/**
 * ProgressBar.tsx — Shared progress bar component
 * Replaces inline implementations in Analytics, Social, Map, Profile, SmartDevices
 *
 * Props:
 *   progress  0.0–1.0
 *   color     bar fill color (default: green800)
 *   height    bar height in px (default: 8)
 *   showLabel show percentage text (default: false)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0.0 — 1.0
  color?: string;
  height?: number;
  showLabel?: boolean;
  trackColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = colors.green800,
  height = 8,
  showLabel = false,
  trackColor = colors.borderLight,
}) => {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const pct = `${Math.round(clampedProgress * 100)}%` as `${number}%`;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.track,
          { height, backgroundColor: trackColor, borderRadius: height / 2 },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: pct,
              backgroundColor: color,
              height,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>{Math.round(clampedProgress * 100)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: { flex: 1, overflow: 'hidden' },
  fill: {},
  label: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontWeight: typography.semibold,
    minWidth: 32,
    textAlign: 'right',
  },
});

export default ProgressBar;
