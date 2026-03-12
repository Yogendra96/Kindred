/**
 * StatCard.tsx — Shared stat/metric card
 * Used in: HomeScreen, Profile, Analytics, Social, VeganCalculator
 *
 * Props:
 *   emoji     Display icon
 *   label     Metric name
 *   value     Metric value (string for formatting flexibility)
 *   sub       Optional sub-label beneath value
 *   accent    Card left-border accent color
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  radii,
  typography,
  shadows,
} from '../../constants/theme';

interface StatCardProps {
  emoji: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  emoji,
  label,
  value,
  sub,
  accent = colors.green800,
}) => (
  <View style={[styles.card, { borderLeftColor: accent }]}>
    <Text style={styles.emoji}>{emoji}</Text>
    <View style={styles.body}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
    borderLeftWidth: 4,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  emoji: { fontSize: 28 },
  body: { flex: 1 },
  label: {
    fontSize: typography.sm,
    color: colors.textMuted,
    fontWeight: typography.medium,
    marginBottom: 2,
  },
  value: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  sub: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
});

export default StatCard;
