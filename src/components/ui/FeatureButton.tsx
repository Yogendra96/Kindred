/**
 * FeatureButton.tsx — Emoji + label tappable grid cell
 * Used in HomeScreen Explore row. Extract once, reuse everywhere.
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  radii,
  typography,
  shadows,
} from '../../constants/theme';

interface FeatureButtonProps {
  emoji: string;
  label: string;
  onPress: () => void;
  testID?: string;
}

const FeatureButton: React.FC<FeatureButtonProps> = ({
  emoji,
  label,
  onPress,
  testID,
}) => (
  <TouchableOpacity
    style={styles.btn}
    onPress={onPress}
    activeOpacity={0.8}
    testID={testID}
  >
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    minWidth: 72,
    ...shadows.card,
  },
  emoji: { fontSize: 26, marginBottom: spacing.xs },
  label: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default FeatureButton;
