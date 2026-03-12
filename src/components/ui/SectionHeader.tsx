/**
 * SectionHeader.tsx — Shared section title + optional subtitle
 * Replaces repeated pattern across every screen.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: import('react-native').ViewStyle;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  style,
}) => (
  <View style={[styles.container, style]}>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
});

export default SectionHeader;
