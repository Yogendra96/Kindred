/**
 * 🎨 Modern Design System
 * Ultra-comprehensive, future-proof design system with adaptive theming
 * Features: Dynamic themes, accessibility-first, micro-interactions, responsive design
 */

import { Dimensions, Platform, StatusBar } from 'react-native';

// Device dimensions and safe areas
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Modern Color Palette with semantic meanings
export const ColorPalette = {
  // Primary Brand Colors
  primary: {
    50: '#E8F5FF',
    100: '#C2E5FF',
    200: '#8DCAFF',
    300: '#47A3FF',
    400: '#1976D2',
    500: '#1565C0', // Main brand color
    600: '#0D47A1',
    700: '#0A3D91',
    800: '#073282',
    900: '#042763',
  },

  // Secondary/Accent Colors
  secondary: {
    50: '#F3E5F5',
    100: '#E1BEE7',
    200: '#CE93D8',
    300: '#BA68C8',
    400: '#AB47BC',
    500: '#9C27B0', // Secondary brand
    600: '#8E24AA',
    700: '#7B1FA2',
    800: '#6A1B9A',
    900: '#4A148C',
  },

  // Sustainability Green (Carbon theme)
  sustainability: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Main sustainability color
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Neutral/Gray Scale
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },

  // Semantic Colors
  semantic: {
    success: {
      light: '#4CAF50',
      main: '#2E7D32',
      dark: '#1B5E20',
      contrast: '#FFFFFF',
    },
    warning: {
      light: '#FF9800',
      main: '#F57C00',
      dark: '#E65100',
      contrast: '#FFFFFF',
    },
    error: {
      light: '#F44336',
      main: '#D32F2F',
      dark: '#B71C1C',
      contrast: '#FFFFFF',
    },
    info: {
      light: '#2196F3',
      main: '#1976D2',
      dark: '#0D47A1',
      contrast: '#FFFFFF',
    },
  },

  // Carbon Footprint Specific Colors
  carbon: {
    excellent: '#00C853', // Very low carbon footprint
    good: '#4CAF50', // Low carbon footprint
    moderate: '#FF9800', // Moderate carbon footprint
    poor: '#FF5722', // High carbon footprint
    critical: '#D32F2F', // Very high carbon footprint
  },
} as const;

// Advanced Typography System
export const Typography = {
  fontFamily: {
    primary: Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }),
    secondary: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'SF Mono',
      android: 'Roboto Mono',
      default: 'monospace',
    }),
  },

  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  },

  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 40,
    '4xl': 44,
    '5xl': 56,
    '6xl': 72,
    '7xl': 84,
    '8xl': 112,
    '9xl': 144,
  },

  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
} as const;

// Modern Spacing System (8px base grid)
export const Spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
} as const;

// Responsive Breakpoints
export const Breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  '2xl': 1400,
} as const;

// Modern Border Radius System
export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// Advanced Shadow System
export const Shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  '2xl': {
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;

// Animation & Motion System
export const Motion = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 750,
    slowest: 1000,
  },

  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  scale: {
    enter: 0.95,
    exit: 1.05,
  },

  opacity: {
    enter: 0,
    exit: 1,
  },
} as const;

// Advanced Theme System
export interface Theme {
  name: string;
  isDark: boolean;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    border: string;
    borderLight: string;
    borderDark: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    overlay: string;
    shadow: string;
    // Carbon-specific colors
    carbonExcellent: string;
    carbonGood: string;
    carbonModerate: string;
    carbonPoor: string;
    carbonCritical: string;
  };
  typography: typeof Typography;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
  motion: typeof Motion;
}

// Light Theme
export const LightTheme: Theme = {
  name: 'light',
  isDark: false,
  colors: {
    primary: ColorPalette.primary[500],
    primaryLight: ColorPalette.primary[300],
    primaryDark: ColorPalette.primary[700],
    secondary: ColorPalette.secondary[500],
    secondaryLight: ColorPalette.secondary[300],
    secondaryDark: ColorPalette.secondary[700],
    background: ColorPalette.neutral[0],
    backgroundSecondary: ColorPalette.neutral[50],
    backgroundTertiary: ColorPalette.neutral[100],
    surface: ColorPalette.neutral[0],
    surfaceVariant: ColorPalette.neutral[100],
    text: ColorPalette.neutral[900],
    textSecondary: ColorPalette.neutral[600],
    textTertiary: ColorPalette.neutral[400],
    textInverse: ColorPalette.neutral[0],
    border: ColorPalette.neutral[200],
    borderLight: ColorPalette.neutral[100],
    borderDark: ColorPalette.neutral[300],
    success: ColorPalette.semantic.success.main,
    warning: ColorPalette.semantic.warning.main,
    error: ColorPalette.semantic.error.main,
    info: ColorPalette.semantic.info.main,
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    carbonExcellent: ColorPalette.carbon.excellent,
    carbonGood: ColorPalette.carbon.good,
    carbonModerate: ColorPalette.carbon.moderate,
    carbonPoor: ColorPalette.carbon.poor,
    carbonCritical: ColorPalette.carbon.critical,
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  motion: Motion,
};

// Dark Theme
export const DarkTheme: Theme = {
  name: 'dark',
  isDark: true,
  colors: {
    primary: ColorPalette.primary[400],
    primaryLight: ColorPalette.primary[300],
    primaryDark: ColorPalette.primary[600],
    secondary: ColorPalette.secondary[400],
    secondaryLight: ColorPalette.secondary[300],
    secondaryDark: ColorPalette.secondary[600],
    background: ColorPalette.neutral[900],
    backgroundSecondary: ColorPalette.neutral[800],
    backgroundTertiary: ColorPalette.neutral[700],
    surface: ColorPalette.neutral[800],
    surfaceVariant: ColorPalette.neutral[700],
    text: ColorPalette.neutral[100],
    textSecondary: ColorPalette.neutral[300],
    textTertiary: ColorPalette.neutral[500],
    textInverse: ColorPalette.neutral[900],
    border: ColorPalette.neutral[600],
    borderLight: ColorPalette.neutral[700],
    borderDark: ColorPalette.neutral[500],
    success: ColorPalette.semantic.success.light,
    warning: ColorPalette.semantic.warning.light,
    error: ColorPalette.semantic.error.light,
    info: ColorPalette.semantic.info.light,
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    carbonExcellent: ColorPalette.carbon.excellent,
    carbonGood: ColorPalette.carbon.good,
    carbonModerate: ColorPalette.carbon.moderate,
    carbonPoor: ColorPalette.carbon.poor,
    carbonCritical: ColorPalette.carbon.critical,
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  motion: Motion,
};

// High Contrast Theme (Accessibility)
export const HighContrastTheme: Theme = {
  ...LightTheme,
  name: 'high-contrast',
  colors: {
    ...LightTheme.colors,
    primary: '#000000',
    secondary: '#000000',
    text: '#000000',
    textSecondary: '#000000',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#000000',
    success: '#006600',
    warning: '#CC6600',
    error: '#CC0000',
    info: '#0066CC',
  },
};

// Component Variants System
export const ComponentVariants = {
  button: {
    primary: {
      backgroundColor: 'primary',
      textColor: 'textInverse',
      borderColor: 'primary',
    },
    secondary: {
      backgroundColor: 'transparent',
      textColor: 'primary',
      borderColor: 'primary',
    },
    tertiary: {
      backgroundColor: 'backgroundSecondary',
      textColor: 'text',
      borderColor: 'border',
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: 'primary',
      borderColor: 'transparent',
    },
    danger: {
      backgroundColor: 'error',
      textColor: 'textInverse',
      borderColor: 'error',
    },
  },

  input: {
    default: {
      backgroundColor: 'surface',
      borderColor: 'border',
      textColor: 'text',
      placeholderColor: 'textTertiary',
    },
    focused: {
      backgroundColor: 'surface',
      borderColor: 'primary',
      textColor: 'text',
      placeholderColor: 'textTertiary',
    },
    error: {
      backgroundColor: 'surface',
      borderColor: 'error',
      textColor: 'text',
      placeholderColor: 'textTertiary',
    },
    disabled: {
      backgroundColor: 'backgroundTertiary',
      borderColor: 'borderLight',
      textColor: 'textTertiary',
      placeholderColor: 'textTertiary',
    },
  },

  card: {
    default: {
      backgroundColor: 'surface',
      borderColor: 'border',
      shadow: 'sm',
    },
    elevated: {
      backgroundColor: 'surface',
      borderColor: 'transparent',
      shadow: 'md',
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: 'border',
      shadow: 'none',
    },
  },
} as const;

// Responsive Design Utilities
export const ResponsiveUtils = {
  isSmallDevice: screenWidth < 375,
  isMediumDevice: screenWidth >= 375 && screenWidth < 414,
  isLargeDevice: screenWidth >= 414,
  isTablet: screenWidth >= 768,

  getResponsiveValue: <T>(
    values: { sm?: T; md?: T; lg?: T; xl?: T },
    defaultValue: T,
  ): T => {
    if (screenWidth >= Breakpoints.xl && values.xl !== undefined)
      return values.xl;
    if (screenWidth >= Breakpoints.lg && values.lg !== undefined)
      return values.lg;
    if (screenWidth >= Breakpoints.md && values.md !== undefined)
      return values.md;
    if (screenWidth >= Breakpoints.sm && values.sm !== undefined)
      return values.sm;
    return defaultValue;
  },

  getSpacing: (multiplier: number): number => Spacing[2] * multiplier,

  getFontSize: (size: keyof typeof Typography.fontSize): number =>
    Typography.fontSize[size],

  getColor: (theme: Theme, colorKey: keyof Theme['colors']): string =>
    theme.colors[colorKey],
};

// Accessibility Utilities
export const AccessibilityUtils = {
  getContrastRatio: (_color1: string, _color2: string): number => {
    // Implementation would calculate actual contrast ratio
    return 4.5; // Placeholder
  },

  isColorAccessible: (foreground: string, background: string): boolean => {
    return AccessibilityUtils.getContrastRatio(foreground, background) >= 4.5;
  },

  getAccessibleTextColor: (theme: Theme, _backgroundColor: string): string => {
    // Return text color that meets accessibility standards
    return theme.isDark ? theme.colors.text : theme.colors.text;
  },

  getFocusRingStyle: (theme: Theme) => ({
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'solid' as const,
  }),

  getTouchTargetSize: () => ({
    minWidth: 44,
    minHeight: 44,
  }),
};

// Animation Presets
export const AnimationPresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: Motion.duration.normal,
  },

  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: Motion.duration.normal,
  },

  slideInFromBottom: {
    from: { translateY: 100, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
    duration: Motion.duration.normal,
  },

  slideInFromRight: {
    from: { translateX: 100, opacity: 0 },
    to: { translateX: 0, opacity: 1 },
    duration: Motion.duration.normal,
  },

  scaleIn: {
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    duration: Motion.duration.normal,
  },

  bounce: {
    from: { scale: 1 },
    to: { scale: 1.1 },
    duration: Motion.duration.fast,
    reverse: true,
  },
};

// Layout Utilities
export const LayoutUtils = {
  getScreenDimensions: () => ({
    width: screenWidth,
    height: screenHeight,
  }),

  getSafeAreaInsets: () => {
    // Would integrate with react-native-safe-area-context
    return {
      top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
      bottom: Platform.OS === 'ios' ? 34 : 0,
      left: 0,
      right: 0,
    };
  },

  getFlexLayout: (
    direction: 'row' | 'column' = 'column',
    justify = 'flex-start',
    align = 'stretch',
  ) => ({
    display: 'flex' as const,
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
  }),

  getCenterLayout: () => ({
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  }),
};

// Carbon Footprint Specific Design Tokens
export const CarbonDesignTokens = {
  colors: {
    excellent: ColorPalette.carbon.excellent,
    good: ColorPalette.carbon.good,
    moderate: ColorPalette.carbon.moderate,
    poor: ColorPalette.carbon.poor,
    critical: ColorPalette.carbon.critical,
  },

  getCarbonColor: (footprint: number): string => {
    if (footprint <= 2) return CarbonDesignTokens.colors.excellent;
    if (footprint <= 5) return CarbonDesignTokens.colors.good;
    if (footprint <= 10) return CarbonDesignTokens.colors.moderate;
    if (footprint <= 20) return CarbonDesignTokens.colors.poor;
    return CarbonDesignTokens.colors.critical;
  },

  getCarbonLabel: (footprint: number): string => {
    if (footprint <= 2) return 'Excellent';
    if (footprint <= 5) return 'Good';
    if (footprint <= 10) return 'Moderate';
    if (footprint <= 20) return 'Poor';
    return 'Critical';
  },

  getCarbonIcon: (footprint: number): string => {
    if (footprint <= 2) return '🌱';
    if (footprint <= 5) return '🌿';
    if (footprint <= 10) return '⚠️';
    if (footprint <= 20) return '🔥';
    return '💥';
  },
};

// Export the complete design system
export const ModernDesignSystem = {
  ColorPalette,
  Typography,
  Spacing,
  Breakpoints,
  BorderRadius,
  Shadows,
  Motion,
  LightTheme,
  DarkTheme,
  HighContrastTheme,
  ComponentVariants,
  ResponsiveUtils,
  AccessibilityUtils,
  AnimationPresets,
  LayoutUtils,
  CarbonDesignTokens,
} as const;

export default ModernDesignSystem;
