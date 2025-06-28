import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function AccessibleButton({ onPress, label, hint }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole='button'
      style={{
        minHeight: 44,
        minWidth: 44,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}
