import HapticFeedbackService from '../services/HapticFeedbackService';
import { useTheme } from '../theme/ThemeProvider';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { LinearGradient } from 'expo-linear-gradient';
import React, {
  useState,
  useEffect,
  // useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Switch,
  Slider,
  Alert,
  Platform,
  StatusBar,
  Appearance,
} from 'react-native';

// Note: expo-blur would need to be installed separately
// import { BlurView } from 'expo-blur';
const BlurView = View; // Fallback to regular View

const { width: screenWidth, height: _screenHeight } = Dimensions.get('window');

interface ColorPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  surface: string;
  background: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
  onBackground: string;
  outline: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  category:
    | 'default'
    | 'nature'
    | 'ocean'
    | 'sunset'
    | 'minimal'
    | 'vibrant'
    | 'accessibility';
  accessibility?: {
    highContrast?: boolean;
    colorBlindFriendly?: boolean;
    reducedMotion?: boolean;
  };
}

interface ThemeCustomization {
  fontSize: number;
  borderRadius: number;
  spacing: number;
  iconSize: number;
  buttonHeight: number;
  cardElevation: number;
  animationDuration: number;
  hapticIntensity: number;
}

interface DynamicThemingState {
  currentPreset: string;
  customization: ThemeCustomization;
  autoTheme: boolean;
  scheduleEnabled: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  adaptiveColors: boolean;
  seasonalThemes: boolean;
  locationBasedThemes: boolean;
  moodBasedThemes: boolean;
  accessibilityMode: boolean;
  colorBlindnessType: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  previewMode: boolean;
}

const DEFAULT_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and modern design',
    icon: 'color-palette',
    category: 'default',
    colors: {
      light: {
        primary: '#6750A4',
        secondary: '#625B71',
        tertiary: '#7D5260',
        surface: '#FFFBFE',
        background: '#FFFBFE',
        error: '#BA1A1A',
        warning: '#FF9800',
        success: '#4CAF50',
        info: '#2196F3',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onSurface: '#1C1B1F',
        onBackground: '#1C1B1F',
        outline: '#79747E',
        surfaceVariant: '#E7E0EC',
        onSurfaceVariant: '#49454F',
      },
      dark: {
        primary: '#D0BCFF',
        secondary: '#CCC2DC',
        tertiary: '#EFB8C8',
        surface: '#1C1B1F',
        background: '#1C1B1F',
        error: '#F2B8B5',
        warning: '#FFB74D',
        success: '#81C784',
        info: '#64B5F6',
        onPrimary: '#381E72',
        onSecondary: '#332D41',
        onSurface: '#E6E1E5',
        onBackground: '#E6E1E5',
        outline: '#938F99',
        surfaceVariant: '#49454F',
        onSurfaceVariant: '#CAC4D0',
      },
    },
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Earth tones and natural colors',
    icon: 'leaf',
    category: 'nature',
    colors: {
      light: {
        primary: '#4CAF50',
        secondary: '#8BC34A',
        tertiary: '#FF9800',
        surface: '#F1F8E9',
        background: '#F9FBE7',
        error: '#F44336',
        warning: '#FF9800',
        success: '#4CAF50',
        info: '#2196F3',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onSurface: '#1B5E20',
        onBackground: '#1B5E20',
        outline: '#689F38',
        surfaceVariant: '#DCEDC8',
        onSurfaceVariant: '#33691E',
      },
      dark: {
        primary: '#81C784',
        secondary: '#AED581',
        tertiary: '#FFB74D',
        surface: '#1B5E20',
        background: '#0D2818',
        error: '#EF5350',
        warning: '#FFB74D',
        success: '#81C784',
        info: '#64B5F6',
        onPrimary: '#1B5E20',
        onSecondary: '#33691E',
        onSurface: '#C8E6C9',
        onBackground: '#C8E6C9',
        outline: '#689F38',
        surfaceVariant: '#2E7D32',
        onSurfaceVariant: '#A5D6A7',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues and aqua tones',
    icon: 'water',
    category: 'ocean',
    colors: {
      light: {
        primary: '#2196F3',
        secondary: '#00BCD4',
        tertiary: '#009688',
        surface: '#E3F2FD',
        background: '#F0F8FF',
        error: '#F44336',
        warning: '#FF9800',
        success: '#4CAF50',
        info: '#2196F3',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onSurface: '#0D47A1',
        onBackground: '#0D47A1',
        outline: '#1976D2',
        surfaceVariant: '#BBDEFB',
        onSurfaceVariant: '#1565C0',
      },
      dark: {
        primary: '#64B5F6',
        secondary: '#4DD0E1',
        tertiary: '#4DB6AC',
        surface: '#0D47A1',
        background: '#001122',
        error: '#EF5350',
        warning: '#FFB74D',
        success: '#81C784',
        info: '#64B5F6',
        onPrimary: '#0D47A1',
        onSecondary: '#006064',
        onSurface: '#BBDEFB',
        onBackground: '#BBDEFB',
        outline: '#1976D2',
        surfaceVariant: '#1565C0',
        onSurfaceVariant: '#90CAF9',
      },
    },
  },
  {
    id: 'accessibility',
    name: 'High Contrast',
    description: 'Maximum contrast for accessibility',
    icon: 'contrast',
    category: 'accessibility',
    accessibility: {
      highContrast: true,
      colorBlindFriendly: true,
      reducedMotion: true,
    },
    colors: {
      light: {
        primary: '#000000',
        secondary: '#333333',
        tertiary: '#666666',
        surface: '#FFFFFF',
        background: '#FFFFFF',
        error: '#CC0000',
        warning: '#FF6600',
        success: '#006600',
        info: '#0066CC',
        onPrimary: '#FFFFFF',
        onSecondary: '#FFFFFF',
        onSurface: '#000000',
        onBackground: '#000000',
        outline: '#000000',
        surfaceVariant: '#F5F5F5',
        onSurfaceVariant: '#000000',
      },
      dark: {
        primary: '#FFFFFF',
        secondary: '#CCCCCC',
        tertiary: '#999999',
        surface: '#000000',
        background: '#000000',
        error: '#FF3333',
        warning: '#FF9933',
        success: '#33CC33',
        info: '#3399FF',
        onPrimary: '#000000',
        onSecondary: '#000000',
        onSurface: '#FFFFFF',
        onBackground: '#FFFFFF',
        outline: '#FFFFFF',
        surfaceVariant: '#1A1A1A',
        onSurfaceVariant: '#FFFFFF',
      },
    },
  },
];

const DEFAULT_CUSTOMIZATION: ThemeCustomization = {
  fontSize: 1.0,
  borderRadius: 1.0,
  spacing: 1.0,
  iconSize: 1.0,
  buttonHeight: 1.0,
  cardElevation: 1.0,
  animationDuration: 1.0,
  hapticIntensity: 1.0,
};

interface DynamicThemingProps {
  onThemeChange?: (
    preset: ThemePreset,
    customization: ThemeCustomization,
  ) => void;
  onClose?: () => void;
  testID?: string;
}

export const DynamicTheming: React.FC<DynamicThemingProps> = ({
  onThemeChange,
  onClose,
  testID,
}) => {
  const { theme, isDarkMode, toggleTheme: _toggleTheme } = useTheme();
  const [state, setState] = useState<DynamicThemingState>({
    currentPreset: 'default',
    customization: DEFAULT_CUSTOMIZATION,
    autoTheme: true,
    scheduleEnabled: false,
    scheduleStart: '18:00',
    scheduleEnd: '06:00',
    adaptiveColors: false,
    seasonalThemes: false,
    locationBasedThemes: false,
    moodBasedThemes: false,
    accessibilityMode: false,
    colorBlindnessType: 'none',
    previewMode: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [_customColors, _setCustomColors] = useState<Partial<ColorPalette>>({});
  const _animationValue = useRef(new Animated.Value(0)).current;
  const previewAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadThemeSettings();
    setupAutoTheme();
  }, []);

  useEffect(() => {
    if (state.previewMode) {
      Animated.spring(previewAnimation, {
        toValue: 1,
        useNativeDriver: false,
        tension: 300,
        friction: 10,
      }).start();
    } else {
      Animated.spring(previewAnimation, {
        toValue: 0,
        useNativeDriver: false,
        tension: 300,
        friction: 10,
      }).start();
    }
  }, [state.previewMode]);

  const loadThemeSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('themeSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    }
  };

  const saveThemeSettings = async (newState: Partial<DynamicThemingState>) => {
    try {
      const updatedState = { ...state, ...newState };
      await AsyncStorage.setItem('themeSettings', JSON.stringify(updatedState));
      setState(updatedState);
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  };

  const setupAutoTheme = () => {
    if (state.autoTheme) {
      const subscription = Appearance.addChangeListener(({ colorScheme: _colorScheme }) => {
        // Auto theme logic would go here
      });
      return () => subscription?.remove();
    }
  };

  const _applyColorBlindnessFilter = (color: string): string => {
    // Simplified color blindness simulation
    // In a real implementation, you'd use proper color transformation algorithms
    switch (state.colorBlindnessType) {
      case 'protanopia':
        // Red-blind simulation
        return color.replace(
          /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
          '#00$2$3',
        );
      case 'deuteranopia':
        // Green-blind simulation
        return color.replace(
          /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
          '#$100$3',
        );
      case 'tritanopia':
        // Blue-blind simulation
        return color.replace(
          /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i,
          '#$1$200',
        );
      default:
        return color;
    }
  };

  const _getAdaptiveColors = () => {
    if (!state.adaptiveColors) return {};

    // Simplified adaptive color logic
    const hour = new Date().getHours();
    const isEvening = hour >= 18 || hour <= 6;

    if (isEvening) {
      return {
        primary: '#FF6B35', // Warmer orange
        secondary: '#F7931E',
      };
    } else {
      return {
        primary: '#2196F3', // Cooler blue
        secondary: '#00BCD4',
      };
    }
  };

  const filteredPresets = useMemo(() => {
    if (selectedCategory === 'all') return DEFAULT_PRESETS;
    return DEFAULT_PRESETS.filter(
      preset => preset.category === selectedCategory,
    );
  }, [selectedCategory]);

  const currentPreset =
    DEFAULT_PRESETS.find(p => p.id === state.currentPreset) ||
    DEFAULT_PRESETS[0];

  const handlePresetChange = (preset: ThemePreset) => {
    saveThemeSettings({ currentPreset: preset.id });
    onThemeChange?.(preset, state.customization);
    HapticFeedbackService.triggerSelection();
  };

  const handleCustomizationChange = (
    key: keyof ThemeCustomization,
    value: number,
  ) => {
    const newCustomization = { ...state.customization, [key]: value };
    saveThemeSettings({ customization: newCustomization });
    onThemeChange?.(currentPreset, newCustomization);
  };

  const togglePreviewMode = () => {
    setState(prev => ({ ...prev, previewMode: !prev.previewMode }));
    HapticFeedbackService.triggerSelection();
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Theme Settings',
      'Are you sure you want to reset all theme settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            saveThemeSettings({
              currentPreset: 'default',
              customization: DEFAULT_CUSTOMIZATION,
              autoTheme: true,
              scheduleEnabled: false,
              adaptiveColors: false,
              seasonalThemes: false,
              locationBasedThemes: false,
              moodBasedThemes: false,
              accessibilityMode: false,
              colorBlindnessType: 'none',
            });
            HapticFeedbackService.triggerSuccess();
          },
        },
      ],
    );
  };

  const renderCategoryFilter = () => {
    const categories = [
      'all',
      'default',
      'nature',
      'ocean',
      'sunset',
      'minimal',
      'vibrant',
      'accessibility',
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map(category => (
          <AnimatedTouchable
            key={category}
            onPress={() => {
              setSelectedCategory(category);
              HapticFeedbackService.triggerSelection();
            }}
            style={[
              styles.categoryChip,
              {
                backgroundColor:
                  selectedCategory === category
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
              },
            ]}
            animationType='scale'
            hapticType='selection'
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    selectedCategory === category
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </AnimatedTouchable>
        ))}
      </ScrollView>
    );
  };

  const renderPresetCard = (preset: ThemePreset) => {
    const isSelected = state.currentPreset === preset.id;
    const colors = isDarkMode ? preset.colors.dark : preset.colors.light;

    return (
      <AnimatedTouchable
        key={preset.id}
        onPress={() => handlePresetChange(preset)}
        style={[
          styles.presetCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.outline,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        animationType='scale'
        hapticType='selection'
      >
        <View style={styles.presetHeader}>
          <View
            style={[styles.presetIcon, { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={preset.icon as string}
              size={24}
              color={colors.onPrimary}
            />
          </View>

          {isSelected && (
            <View
              style={[
                styles.selectedBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons
                name='checkmark'
                size={16}
                color={theme.colors.onPrimary}
              />
            </View>
          )}
        </View>

        <Text style={[styles.presetName, { color: theme.colors.onSurface }]}>
          {preset.name}
        </Text>

        <Text
          style={[
            styles.presetDescription,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {preset.description}
        </Text>

        <View style={styles.colorPreview}>
          <View
            style={[styles.colorSwatch, { backgroundColor: colors.primary }]}
          />
          <View
            style={[styles.colorSwatch, { backgroundColor: colors.secondary }]}
          />
          <View
            style={[styles.colorSwatch, { backgroundColor: colors.tertiary }]}
          />
        </View>

        {preset.accessibility && (
          <View style={styles.accessibilityBadge}>
            <Ionicons
              name='accessibility'
              size={12}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.accessibilityText,
                { color: theme.colors.primary },
              ]}
            >
              Accessible
            </Text>
          </View>
        )}
      </AnimatedTouchable>
    );
  };

  const renderCustomizationSlider = (
    label: string,
    key: keyof ThemeCustomization,
    min: number = 0.5,
    max: number = 2.0,
    step: number = 0.1,
  ) => {
    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderHeader}>
          <Text style={[styles.sliderLabel, { color: theme.colors.onSurface }]}>
            {label}
          </Text>
          <Text
            style={[
              styles.sliderValue,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {(state.customization[key] * 100).toFixed(0)}%
          </Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={state.customization[key]}
          onValueChange={(value: number) =>
            handleCustomizationChange(key, value)
          }
          minimumTrackTintColor={theme.colors.primary}
          maximumTrackTintColor={theme.colors.outline}
          thumbTintColor={theme.colors.primary}
        />
      </View>
    );
  };

  const renderAdvancedSettings = () => {
    return (
      <View style={styles.advancedSettings}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Advanced Settings
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text
              style={[styles.settingLabel, { color: theme.colors.onSurface }]}
            >
              Auto Theme
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Follow system appearance
            </Text>
          </View>
          <Switch
            value={state.autoTheme}
            onValueChange={(value: boolean) => {
              saveThemeSettings({ autoTheme: value });
              HapticFeedbackService.triggerSelection();
            }}
            trackColor={{
              false: theme.colors.outline,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.onPrimary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text
              style={[styles.settingLabel, { color: theme.colors.onSurface }]}
            >
              Adaptive Colors
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Colors adapt to time of day
            </Text>
          </View>
          <Switch
            value={state.adaptiveColors}
            onValueChange={(value: boolean) => {
              saveThemeSettings({ adaptiveColors: value });
              HapticFeedbackService.triggerSelection();
            }}
            trackColor={{
              false: theme.colors.outline,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.onPrimary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text
              style={[styles.settingLabel, { color: theme.colors.onSurface }]}
            >
              Accessibility Mode
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Enhanced contrast and readability
            </Text>
          </View>
          <Switch
            value={state.accessibilityMode}
            onValueChange={(value: boolean) => {
              saveThemeSettings({ accessibilityMode: value });
              if (value) {
                handlePresetChange(
                  DEFAULT_PRESETS.find(p => p.id === 'accessibility')!,
                );
              }
              HapticFeedbackService.triggerSelection();
            }}
            trackColor={{
              false: theme.colors.outline,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.onPrimary}
          />
        </View>
      </View>
    );
  };

  const renderPreviewOverlay = () => {
    if (!state.previewMode) return null;

    const overlayOpacity = previewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.8],
    });

    const overlayScale = previewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View
        style={[
          styles.previewOverlay,
          {
            opacity: overlayOpacity,
            transform: [{ scale: overlayScale }],
          },
        ]}
      >
        <BlurView intensity={20} style={styles.previewContent}>
          <Text
            style={[styles.previewTitle, { color: theme.colors.onSurface }]}
          >
            Theme Preview
          </Text>

          <View style={styles.previewDemo}>
            <View
              style={[
                styles.demoCard,
                { backgroundColor: currentPreset?.colors.light.surface },
              ]}
            >
              <Text
                style={[
                  styles.demoText,
                  { color: currentPreset?.colors.light.onSurface },
                ]}
              >
                Sample Card
              </Text>
              <View
                style={[
                  styles.demoButton,
                  { backgroundColor: currentPreset?.colors.light.primary },
                ]}
              >
                <Text
                  style={[
                    styles.demoButtonText,
                    { color: currentPreset?.colors.light.onPrimary },
                  ]}
                >
                  Button
                </Text>
              </View>
            </View>
          </View>

          <AnimatedTouchable
            onPress={togglePreviewMode}
            style={[
              styles.previewCloseButton,
              { backgroundColor: theme.colors.primary },
            ]}
            animationType='scale'
            hapticType='selection'
          >
            <Ionicons name='close' size={20} color={theme.colors.onPrimary} />
          </AnimatedTouchable>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={testID}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />

      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Theme Customization
        </Text>

        <View style={styles.headerActions}>
          <AnimatedTouchable
            onPress={togglePreviewMode}
            style={[
              styles.headerButton,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            animationType='scale'
            hapticType='selection'
          >
            <Ionicons
              name='eye'
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </AnimatedTouchable>

          <AnimatedTouchable
            onPress={resetToDefaults}
            style={[
              styles.headerButton,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            animationType='scale'
            hapticType='selection'
          >
            <Ionicons
              name='refresh'
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </AnimatedTouchable>

          {onClose && (
            <AnimatedTouchable
              onPress={onClose}
              style={[
                styles.headerButton,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              animationType='scale'
              hapticType='selection'
            >
              <Ionicons
                name='close'
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </AnimatedTouchable>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCategoryFilter()}

        <View style={styles.presetsGrid}>
          {filteredPresets.map(renderPresetCard)}
        </View>

        <View style={styles.customizationSection}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
          >
            Customization
          </Text>

          {renderCustomizationSlider('Font Size', 'fontSize')}
          {renderCustomizationSlider('Border Radius', 'borderRadius')}
          {renderCustomizationSlider('Spacing', 'spacing')}
          {renderCustomizationSlider('Icon Size', 'iconSize')}
          {renderCustomizationSlider('Button Height', 'buttonHeight')}
          {renderCustomizationSlider(
            'Animation Speed',
            'animationDuration',
            0.1,
            3.0,
          )}
        </View>

        {renderAdvancedSettings()}
      </ScrollView>

      {renderPreviewOverlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  presetCard: {
    width: (screenWidth - 48) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  presetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  accessibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessibilityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  customizationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderValue: {
    fontSize: 12,
  },
  slider: {
    height: 40,
  },
  advancedSettings: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewContent: {
    width: screenWidth * 0.8,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  previewDemo: {
    width: '100%',
    marginBottom: 16,
  },
  demoCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoText: {
    fontSize: 16,
    marginBottom: 12,
  },
  demoButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DynamicTheming;
