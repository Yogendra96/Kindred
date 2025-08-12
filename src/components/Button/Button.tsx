import React from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';

import { HapticFeedbackService } from '../../services/HapticFeedbackService';

// Color constants to avoid literals
const COLORS = {
  black: '#000',
  white: '#FFFFFF',
  red: '#F44336',
  green: '#4CAF50',
  blue: '#2196F3',
  gray: '#666666',
  lightGray: '#E0E0E0',
  transparent: 'transparent',
} as const;

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  hapticFeedback = true,
  testID,
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;

    if (hapticFeedback) {
      await HapticFeedbackService.triggerSuccess();
    }

    onPress();
  };

  const buttonStyle = [
    styles.button,
    styles[variant], // Uses: primary, secondary, danger, ghost, outline
    styles[size], // Uses: small, medium, large
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`], // Uses: primaryText, secondaryText, dangerText, ghostText, outlineText
    styles[`${size}Text`], // Uses: smallText, mediumText, largeText
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'large'}
            color={
              variant === 'primary' || variant === 'danger'
                ? COLORS.white
                : COLORS.green
            }
          />
          <Text style={[textStyleCombined, styles.loadingText]}>
            Loading...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconContainer}>{icon}</View>
        )}
        <Text style={textStyleCombined}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.iconContainer}>{icon}</View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },

  // Content layout
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  // Variants - used dynamically via styles[variant]
  // eslint-disable-next-line react-native/no-unused-styles
  danger: {
    backgroundColor: COLORS.red,
    borderWidth: 0,
  },

  // Text styles
  // eslint-disable-next-line react-native/no-unused-styles
  dangerText: {
    color: COLORS.white,
  },

  // States
  disabled: {
    elevation: 0,
    opacity: 0.6,
    shadowOpacity: 0,
  },
  disabledText: {
    opacity: 0.7,
  },
  fullWidth: {
    width: '100%',
  },
  // eslint-disable-next-line react-native/no-unused-styles
  ghost: {
    backgroundColor: COLORS.transparent,
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  ghostText: {
    color: COLORS.gray,
  },
  iconContainer: {
    marginHorizontal: 4,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  large: {
    minHeight: 56,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  largeText: {
    fontSize: 18,
  },
  loading: {
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  medium: {
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  mediumText: {
    fontSize: 16,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  outline: {
    backgroundColor: COLORS.transparent,
    borderColor: COLORS.green,
    borderWidth: 2,
    elevation: 0,
    shadowOpacity: 0,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  outlineText: {
    color: COLORS.green,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  primary: {
    backgroundColor: COLORS.green,
    borderWidth: 0,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  primaryText: {
    color: COLORS.white,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  secondary: {
    backgroundColor: COLORS.blue,
    borderWidth: 0,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  secondaryText: {
    color: COLORS.white,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  small: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  // eslint-disable-next-line react-native/no-unused-styles
  smallText: {
    fontSize: 14,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Button;
