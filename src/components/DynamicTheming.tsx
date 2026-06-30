// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { useTheme } from '../theme/ThemeProvider';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  category: string;
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
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
  onThemeChange?: (preset: ThemePreset, customization: ThemeCustomization) => void;
  onClose?: () => void;
  testID?: string;
}

/**
 * Dynamic Theming Component
 * Allows users to customize the app's look and feel
 */
export const DynamicTheming: React.FC<DynamicThemingProps> = ({
  onThemeChange,
  onClose,
  testID,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [state, setState] = useState({
    currentPreset: 'default',
    customization: DEFAULT_CUSTOMIZATION,
    autoTheme: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('themeSettings');
      if (saved) setState(prev => ({ ...prev, ...JSON.parse(saved) }));
    } catch (e) {
      console.error('Load theme settings failed', e);
    }
  };

  const saveSettings = async (updates: any) => {
    try {
      const newState = { ...state, ...updates };
      await AsyncStorage.setItem('themeSettings', JSON.stringify(newState));
      setState(newState);
    } catch (e) {
      console.error('Save theme settings failed', e);
    }
  };

  const handlePresetChange = (preset: ThemePreset) => {
    saveSettings({ currentPreset: preset.id });
    onThemeChange?.(preset, state.customization);
    HapticFeedbackService.triggerSelection();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID={testID}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Theming</Text>
        {onClose && (
          <AnimatedTouchable onPress={onClose} style={styles.headerButton}>
            <Ionicons name='close' size={24} color={theme.colors.onSurface} />
          </AnimatedTouchable>
        )}
      </View>
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Presets</Text>
        <View style={styles.presetsGrid}>
          {DEFAULT_PRESETS.map(p => (
            <AnimatedTouchable
              key={p.id}
              onPress={() => handlePresetChange(p)}
              style={[
                styles.presetCard,
                {
                  borderColor:
                    state.currentPreset === p.id ? theme.colors.primary : theme.colors.outline,
                },
              ]}
            >
              <Text style={{ color: theme.colors.onSurface }}>{p.name}</Text>
            </AnimatedTouchable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  headerButton: { padding: 8 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  presetCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
});

export default DynamicTheming;
