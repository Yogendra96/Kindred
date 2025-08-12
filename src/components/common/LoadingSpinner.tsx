import React from 'react';

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Color constants to avoid literals
const COLORS = {
  blue: '#007AFF',
  whiteTransparent: 'rgba(255, 255, 255, 0.8)',
  darkText: '#333',
} as const;

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
  color = COLORS.blue,
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.whiteTransparent,
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    color: COLORS.darkText,
    fontSize: 16,
    marginTop: 10,
  },
});

export default LoadingSpinner;
