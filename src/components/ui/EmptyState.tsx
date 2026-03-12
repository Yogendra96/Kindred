/**
 * EmptyState.tsx — Centered empty result placeholder
 * Replaces inline empty state pattern in Learning, Map, Social screens.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface EmptyStateProps {
  emoji?: string;
  message: string;
  sub?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  emoji = '🔍',
  message,
  sub,
}) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.message}>{message}</Text>
    {sub && <Text style={styles.sub}>{sub}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.section,
    paddingHorizontal: spacing.xxxl,
  },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  message: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sub: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EmptyState;
