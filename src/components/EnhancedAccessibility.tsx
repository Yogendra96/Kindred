import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';

interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  highContrastEnabled: boolean;
  largeTextEnabled: boolean;
  reducedMotionEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  voiceOverEnabled: boolean;
  talkBackEnabled: boolean;
  fontSize: number;
  lineHeight: number;
  buttonSize: number;
  touchTargetSize: number;
  colorBlindnessType:
    | 'none'
    | 'protanopia'
    | 'deuteranopia'
    | 'tritanopia'
    | 'achromatopsia';
  announceChanges: boolean;
  skipToContent: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  announceMessage: (
    message: string,
    priority?: 'low' | 'medium' | 'high',
  ) => void;
  focusElement: (elementId: string) => void;
  getAccessibleProps: (props: AccessibleElementProps) => any;
  isScreenReaderActive: boolean;
  isHighContrastActive: boolean;
  getScaledSize: (size: number) => number;
  getAccessibleColors: () => AccessibleColors;
}

interface AccessibleElementProps {
  label?: string;
  hint?: string;
  role?: string;
  state?: 'selected' | 'checked' | 'expanded' | 'disabled';
  value?: string | number;
  liveRegion?: 'none' | 'polite' | 'assertive';
  important?: boolean;
  hidden?: boolean;
}

interface AccessibleColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

const defaultSettings: AccessibilitySettings = {
  screenReaderEnabled: false,
  highContrastEnabled: false,
  largeTextEnabled: false,
  reducedMotionEnabled: false,
  hapticFeedbackEnabled: true,
  voiceOverEnabled: false,
  talkBackEnabled: false,
  fontSize: 16,
  lineHeight: 1.5,
  buttonSize: 44,
  touchTargetSize: 44,
  colorBlindnessType: 'none',
  announceChanges: true,
  skipToContent: true,
  keyboardNavigation: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null,
);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within AccessibilityProvider',
    );
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  const { theme } = useTheme();
  const [settings, setSettings] =
    useState<AccessibilitySettings>(defaultSettings);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [isHighContrastActive, setIsHighContrastActive] = useState(false);

  useEffect(() => {
    loadAccessibilitySettings();
    checkSystemAccessibilitySettings();

    // Listen for system accessibility changes
    const screenReaderListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderActive,
    );

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      reduceMotionEnabled => {
        updateSettings({ reducedMotionEnabled: reduceMotionEnabled });
      },
    );

    return () => {
      screenReaderListener?.remove();
      reduceMotionListener?.remove();
    };
  }, []);

  const loadAccessibilitySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(
        'accessibility_settings',
      );
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const saveAccessibilitySettings = async (
    newSettings: AccessibilitySettings,
  ) => {
    try {
      await AsyncStorage.setItem(
        'accessibility_settings',
        JSON.stringify(newSettings),
      );
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const checkSystemAccessibilitySettings = async () => {
    try {
      const screenReaderEnabled =
        await AccessibilityInfo.isScreenReaderEnabled();
      const reduceMotionEnabled =
        await AccessibilityInfo.isReduceMotionEnabled();

      setIsScreenReaderActive(screenReaderEnabled);

      updateSettings({
        screenReaderEnabled,
        reducedMotionEnabled: reduceMotionEnabled,
        voiceOverEnabled: Platform.OS === 'ios' && screenReaderEnabled,
        talkBackEnabled: Platform.OS === 'android' && screenReaderEnabled,
      });
    } catch (error) {
      console.error('Error checking system accessibility settings:', error);
    }
  };

  const updateSettings = useCallback(
    (newSettings: Partial<AccessibilitySettings>) => {
      setSettings(prev => {
        const updated = { ...prev, ...newSettings };
        saveAccessibilitySettings(updated);

        // Update derived states
        setIsHighContrastActive(updated.highContrastEnabled);

        return updated;
      });
    },
    [],
  );

  const announceMessage = useCallback(
    (message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
      if (!settings.announceChanges || !isScreenReaderActive) return;

      // Use AccessibilityInfo to announce messages
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(message);
      } else if (Platform.OS === 'android') {
        AccessibilityInfo.setAccessibilityFocus(message as any);
      }

      // Provide haptic feedback based on priority
      if (settings.hapticFeedbackEnabled) {
        switch (priority) {
          case 'high':
            HapticFeedbackService.triggerError();
            break;
          case 'medium':
            HapticFeedbackService.triggerImpact('medium');
            break;
          case 'low':
            HapticFeedbackService.triggerSelection();
            break;
        }
      }
    },
    [
      settings.announceChanges,
      settings.hapticFeedbackEnabled,
      isScreenReaderActive,
    ],
  );

  const focusElement = useCallback((elementId: string) => {
    // This would be implemented with a ref management system
    console.log('Focusing element:', elementId);
  }, []);

  const getAccessibleProps = useCallback(
    (props: AccessibleElementProps) => {
      const accessibleProps: any = {
        accessible: true,
      };

      if (props.label) {
        accessibleProps.accessibilityLabel = props.label;
      }

      if (props.hint) {
        accessibleProps.accessibilityHint = props.hint;
      }

      if (props.role) {
        accessibleProps.accessibilityRole = props.role;
      }

      if (props.state) {
        accessibleProps.accessibilityState = {
          selected: props.state === 'selected',
          checked: props.state === 'checked',
          expanded: props.state === 'expanded',
          disabled: props.state === 'disabled',
        };
      }

      if (props.value !== undefined) {
        accessibleProps.accessibilityValue = {
          text: String(props.value),
        };
      }

      if (props.liveRegion && props.liveRegion !== 'none') {
        accessibleProps.accessibilityLiveRegion = props.liveRegion;
      }

      if (props.important) {
        accessibleProps.accessibilityElementsHidden = false;
        accessibleProps.importantForAccessibility = 'yes';
      }

      if (props.hidden) {
        accessibleProps.accessibilityElementsHidden = true;
        accessibleProps.importantForAccessibility = 'no-hide-descendants';
      }

      // Add minimum touch target size
      if (settings.touchTargetSize > 44) {
        accessibleProps.style = {
          minWidth: settings.touchTargetSize,
          minHeight: settings.touchTargetSize,
        };
      }

      return accessibleProps;
    },
    [settings.touchTargetSize],
  );

  const getScaledSize = useCallback(
    (size: number) => {
      const scaleFactor = settings.largeTextEnabled ? 1.3 : 1;
      return size * scaleFactor;
    },
    [settings.largeTextEnabled],
  );

  const getAccessibleColors = useCallback((): AccessibleColors => {
    if (settings.highContrastEnabled) {
      return {
        primary: '#0000FF',
        secondary: '#800080',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        error: '#FF0000',
        success: '#008000',
        warning: '#FFA500',
      };
    }

    // Apply color blindness filters
    const baseColors = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      background: theme.colors.background,
      surface: theme.colors.surface,
      text: theme.colors.onBackground,
      textSecondary: theme.colors.onSurfaceVariant,
      border: theme.colors.outline,
      error: theme.colors.error,
      success: '#4CAF50',
      warning: '#FF9800',
    };

    if (settings.colorBlindnessType !== 'none') {
      // Apply color blindness simulation
      return applyColorBlindnessFilter(baseColors, settings.colorBlindnessType);
    }

    return baseColors;
  }, [settings.highContrastEnabled, settings.colorBlindnessType, theme.colors]);

  const applyColorBlindnessFilter = (
    colors: AccessibleColors,
    type: string,
  ): AccessibleColors => {
    // This is a simplified implementation
    // In a real app, you'd use proper color transformation algorithms
    switch (type) {
      case 'protanopia':
        // Red-blind
        return {
          ...colors,
          primary: '#4CAF50', // Use green instead of red
          error: '#FF9800', // Use orange instead of red
        };
      case 'deuteranopia':
        // Green-blind
        return {
          ...colors,
          success: '#2196F3', // Use blue instead of green
        };
      case 'tritanopia':
        // Blue-blind
        return {
          ...colors,
          primary: '#FF9800', // Use orange instead of blue
        };
      case 'achromatopsia':
        // Complete color blindness
        return {
          primary: '#666666',
          secondary: '#999999',
          background: '#FFFFFF',
          surface: '#F5F5F5',
          text: '#000000',
          textSecondary: '#666666',
          border: '#CCCCCC',
          error: '#333333',
          success: '#666666',
          warning: '#999999',
        };
      default:
        return colors;
    }
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceMessage,
    focusElement,
    getAccessibleProps,
    isScreenReaderActive,
    isHighContrastActive,
    getScaledSize,
    getAccessibleColors,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessible Text Component
interface AccessibleTextProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'heading' | 'body' | 'caption' | 'label';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  accessible?: boolean;
  accessibilityRole?: string;
  testID?: string;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  style,
  variant = 'body',
  level = 1,
  accessible = true,
  accessibilityRole,
  testID,
}) => {
  const { getScaledSize, getAccessibleColors, settings } = useAccessibility();
  const colors = getAccessibleColors();

  const getTextStyle = () => {
    const baseSize = {
      heading: 24,
      body: 16,
      caption: 14,
      label: 12,
    }[variant];

    return {
      fontSize: getScaledSize(baseSize),
      lineHeight: getScaledSize(baseSize * settings.lineHeight),
      color: colors.text,
      fontWeight: variant === 'heading' ? '600' : '400',
    };
  };

  const accessibilityProps = {
    accessible,
    accessibilityRole: (accessibilityRole ||
      (variant === 'heading' ? 'header' : 'text')) as any,
    ...(variant === 'heading' && { accessibilityLevel: level }),
  };

  return (
    <Text
      style={[getTextStyle(), style]}
      testID={testID}
      {...accessibilityProps}
    >
      {children}
    </Text>
  );
};

// Accessible Button Component
interface AccessibleButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onPress,
  children,
  style,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { getScaledSize, getAccessibleColors, settings, announceMessage } =
    useAccessibility();
  const colors = getAccessibleColors();

  const handlePress = () => {
    if (disabled) return;

    if (settings.hapticFeedbackEnabled) {
      HapticFeedbackService.triggerSelection();
    }

    onPress();

    if (accessibilityLabel) {
      announceMessage(`${accessibilityLabel} activated`, 'low');
    }
  };

  const getButtonStyle = () => {
    const sizeMap = {
      small: { padding: 8, fontSize: 14 },
      medium: { padding: 12, fontSize: 16 },
      large: { padding: 16, fontSize: 18 },
    };

    const variantMap = {
      primary: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      secondary: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: colors.border,
      },
    };

    const { padding, fontSize } = sizeMap[size];
    const variantStyle = variantMap[variant];

    return {
      ...variantStyle,
      padding: getScaledSize(padding),
      borderRadius: 8,
      borderWidth: 1,
      minHeight: Math.max(settings.buttonSize, 44),
      minWidth: Math.max(settings.buttonSize, 44),
      justifyContent: 'center',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return colors.text;
    }
    return variant === 'primary' ? '#FFFFFF' : colors.text;
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[getButtonStyle(), style]}
      disabled={disabled}
      hapticType='medium'
      animationType={settings.reducedMotionEnabled ? 'none' : 'scale'}
      accessible={true}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <AccessibleText
        variant='label'
        style={{ color: getTextColor(), fontWeight: '600' }}
        accessible={false}
      >
        {children}
      </AccessibleText>
    </AnimatedTouchable>
  );
};

// Skip to Content Component
interface SkipToContentProps {
  targetId: string;
  label?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId,
  label = 'Skip to main content',
}) => {
  const { focusElement, settings } = useAccessibility();

  if (!settings.skipToContent) {
    return null;
  }

  return (
    <View style={styles.skipToContent}>
      <AccessibleButton
        onPress={() => focusElement(targetId)}
        accessibilityLabel={label}
        style={styles.skipButton}
      >
        {label}
      </AccessibleButton>
    </View>
  );
};

// Accessibility Settings Panel
export const AccessibilitySettingsPanel: React.FC = () => {
  const { settings, updateSettings, getAccessibleColors } = useAccessibility();
  const colors = getAccessibleColors();

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const _updateNumericSetting = (
    key: keyof AccessibilitySettings,
    value: number,
  ) => {
    updateSettings({ [key]: value });
  };

  return (
    <View style={[styles.settingsPanel, { backgroundColor: colors.surface }]}>
      <AccessibleText variant='heading' level={2} style={styles.settingsTitle}>
        Accessibility Settings
      </AccessibleText>

      <View style={styles.settingGroup}>
        <AccessibleText variant='heading' level={3}>
          Visual
        </AccessibleText>

        <View style={styles.settingItem}>
          <AccessibleText>High Contrast</AccessibleText>
          <AnimatedTouchable
            onPress={() => toggleSetting('highContrastEnabled')}
            style={[
              styles.toggle,
              {
                backgroundColor: settings.highContrastEnabled
                  ? colors.primary
                  : colors.border,
              },
            ]}
            accessible={true}
            accessibilityRole='switch'
            accessibilityState={{ checked: settings.highContrastEnabled }}
            accessibilityLabel='Toggle high contrast mode'
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: colors.surface,
                  transform: [
                    {
                      translateX: settings.highContrastEnabled ? 20 : 0,
                    },
                  ],
                },
              ]}
            />
          </AnimatedTouchable>
        </View>

        <View style={styles.settingItem}>
          <AccessibleText>Large Text</AccessibleText>
          <AnimatedTouchable
            onPress={() => toggleSetting('largeTextEnabled')}
            style={[
              styles.toggle,
              {
                backgroundColor: settings.largeTextEnabled
                  ? colors.primary
                  : colors.border,
              },
            ]}
            accessible={true}
            accessibilityRole='switch'
            accessibilityState={{ checked: settings.largeTextEnabled }}
            accessibilityLabel='Toggle large text'
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: colors.surface,
                  transform: [
                    {
                      translateX: settings.largeTextEnabled ? 20 : 0,
                    },
                  ],
                },
              ]}
            />
          </AnimatedTouchable>
        </View>

        <View style={styles.settingItem}>
          <AccessibleText>Reduced Motion</AccessibleText>
          <AnimatedTouchable
            onPress={() => toggleSetting('reducedMotionEnabled')}
            style={[
              styles.toggle,
              {
                backgroundColor: settings.reducedMotionEnabled
                  ? colors.primary
                  : colors.border,
              },
            ]}
            accessible={true}
            accessibilityRole='switch'
            accessibilityState={{ checked: settings.reducedMotionEnabled }}
            accessibilityLabel='Toggle reduced motion'
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: colors.surface,
                  transform: [
                    {
                      translateX: settings.reducedMotionEnabled ? 20 : 0,
                    },
                  ],
                },
              ]}
            />
          </AnimatedTouchable>
        </View>
      </View>

      <View style={styles.settingGroup}>
        <AccessibleText variant='heading' level={3}>
          Interaction
        </AccessibleText>

        <View style={styles.settingItem}>
          <AccessibleText>Haptic Feedback</AccessibleText>
          <AnimatedTouchable
            onPress={() => toggleSetting('hapticFeedbackEnabled')}
            style={[
              styles.toggle,
              {
                backgroundColor: settings.hapticFeedbackEnabled
                  ? colors.primary
                  : colors.border,
              },
            ]}
            accessible={true}
            accessibilityRole='switch'
            accessibilityState={{ checked: settings.hapticFeedbackEnabled }}
            accessibilityLabel='Toggle haptic feedback'
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: colors.surface,
                  transform: [
                    {
                      translateX: settings.hapticFeedbackEnabled ? 20 : 0,
                    },
                  ],
                },
              ]}
            />
          </AnimatedTouchable>
        </View>

        <View style={styles.settingItem}>
          <AccessibleText>Announce Changes</AccessibleText>
          <AnimatedTouchable
            onPress={() => toggleSetting('announceChanges')}
            style={[
              styles.toggle,
              {
                backgroundColor: settings.announceChanges
                  ? colors.primary
                  : colors.border,
              },
            ]}
            accessible={true}
            accessibilityRole='switch'
            accessibilityState={{ checked: settings.announceChanges }}
            accessibilityLabel='Toggle change announcements'
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  backgroundColor: colors.surface,
                  transform: [
                    {
                      translateX: settings.announceChanges ? 20 : 0,
                    },
                  ],
                },
              ]}
            />
          </AnimatedTouchable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skipToContent: {
    position: 'absolute',
    top: -100,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  skipButton: {
    margin: 16,
  },
  settingsPanel: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  settingsTitle: {
    marginBottom: 24,
  },
  settingGroup: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});

export default AccessibilityProvider;
