/**
 * CategoryChip.tsx — Tappable filter pill
 * Replaces unique inline chip implementations in Social, Learning, Map, Analytics screens.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radii, typography } from '../../constants/theme';

interface CategoryChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  active,
  onPress,
  activeColor = colors.green800,
  icon,
  style,
  textStyle,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[
      styles.chip,
      active && { backgroundColor: activeColor, borderColor: activeColor },
      style,
    ]}
  >
    {icon}
    <Text style={[styles.text, active && styles.textActive, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    backgroundColor: colors.backgroundCard,
  },
  text: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  textActive: { color: colors.textOnDark },
});

export default CategoryChip;
