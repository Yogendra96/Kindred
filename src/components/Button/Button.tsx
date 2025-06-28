import { HapticFeedbackService } from '../../services/HapticFeedbackService';
import React from 'react';
import type { ViewStyle, TextStyle } from 'react-native';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';

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
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={
              variant === 'primary' || variant === 'danger'
                ? '#FFFFFF'
                : '#4CAF50'
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Variants
  primary: {
    backgroundColor: '#4CAF50',
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: '#2196F3',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: '#F44336',
    borderWidth: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Sizes
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },

  // States
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  loading: {
    opacity: 0.8,
  },
  fullWidth: {
    width: '100%',
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  ghostText: {
    color: '#666666',
  },
  outlineText: {
    color: '#4CAF50',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.7,
  },

  // Content layout
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
});

export default Button;
