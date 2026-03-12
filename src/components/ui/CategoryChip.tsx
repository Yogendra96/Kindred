/**
 * CategoryChip.tsx — Tappable filter pill
 * Replaces unique inline chip implementations in Social, Learning, Map, Analytics screens.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radii, typography } from '../../constants/theme';

interface CategoryChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  active,
  onPress,
  activeColor = colors.green800,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[
      styles.chip,
      active && { backgroundColor: activeColor, borderColor: activeColor },
    ]}
  >
    <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
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
