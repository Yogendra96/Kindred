import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const GlassCard = ({ style, children }: GlassCardProps) => {
  return <View style={[styles.glassCard, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
