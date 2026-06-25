import { Dimensions, useColorScheme } from 'react-native';

const { width, height } = Dimensions.get('window');

export const metrics = {
  screenWidth: width,
  screenHeight: height,
  baseMargin: 16,
  basePadding: 16,
  baseRadius: 8,
  headerHeight: 56,
  bottomTabHeight: 56,
};

// 2026 Modern Spatial Colors for Skia Gradients and Glows
export const spatialColors = {
  naturePrimary: '#11998E', // Deep forest green
  natureSecondary: '#38EF7D', // Vibrant lime
  airPrimary: '#00B4DB', // Clear sky blue
  airSecondary: '#0083B0', // Deep ocean blue
  glassBackgroundDark: 'rgba(28, 28, 30, 0.45)', // For dark mode frosted glass
  glassBackgroundLight: 'rgba(255, 255, 255, 0.5)', // For light mode frosted glass
  glassBorderDark: 'rgba(255, 255, 255, 0.1)',
  glassBorderLight: 'rgba(0, 0, 0, 0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  background: '#0A0A0A',
  primary: '#007AFF',
};

// Moti Spring Animation Presets
export const animations: any = {
  spring: {
    gentle: { type: 'spring' as const, damping: 20, stiffness: 100, mass: 1 },
    bouncy: { type: 'spring' as const, damping: 12, stiffness: 150, mass: 1 },
    snappy: { type: 'spring' as const, damping: 15, stiffness: 200, mass: 1 },
  },
  timing: {
    quick: { type: 'timing' as const, duration: 150 },
    smooth: { type: 'timing' as const, duration: 300 },
  },
};

export const colors = {
  primary: '#007AFF',
  onPrimary: '#FFFFFF',
  secondary: '#5856D6',
  onSecondary: '#FFFFFF',
  accent: '#34C759',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5856D6',
  black: '#000000',
  darkGray: '#1C1C1E',
  gray: '#8E8E93',
  lightGray: '#D1D1D6',
  white: '#FFFFFF',
  outline: '#8E8E93',
  background: {
    light: '#FFFFFF',
    dark: '#000000',
  },
  surface: {
    light: '#F2F2F7',
    dark: '#1C1C1E',
  },
  onSurface: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  text: {
    primary: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    secondary: {
      light: '#3C3C43',
      dark: '#EBEBF5',
    },
    disabled: {
      light: '#8E8E93',
      dark: '#48484A',
    },
  },
  border: {
    light: '#C6C6C8',
    dark: '#38383A',
  },
  carbonNeutral: '#34C759',
  carbonPositive: '#FF3B30',
  carbonNegative: '#5856D6',
};

export const highContrastColors = {
  ...colors,
  mode: 'highContrast',
  primary: '#000000',
  onPrimary: '#FFFF00',
  secondary: '#FFFFFF',
  onSecondary: '#000000',
  accent: '#FFD700',
  outline: '#FFFF00',
  background: {
    light: '#FFFFFF',
    dark: '#000000',
    highContrast: '#000000',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#000000',
    highContrast: '#000000',
  },
  onSurface: {
    light: '#000000',
    dark: '#FFFFFF',
    highContrast: '#FFFF00',
  },
  text: {
    primary: {
      light: '#000000',
      dark: '#FFFFFF',
      highContrast: '#FFFF00',
    },
    secondary: {
      light: '#000000',
      dark: '#FFFFFF',
      highContrast: '#FFD700',
    },
    disabled: {
      light: '#666666',
      dark: '#CCCCCC',
      highContrast: '#FFD700',
    },
  },
  border: {
    light: '#000000',
    dark: '#FFFFFF',
    highContrast: '#FFD700',
  },
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    tiny: 12,
    small: 14,
    regular: 16,
    medium: 18,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
  },
  lineHeight: {
    tiny: 16,
    small: 20,
    regular: 24,
    medium: 28,
    large: 32,
    xlarge: 36,
    xxlarge: 40,
  },
  title1: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  title2: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
};

export const spacing = {
  tiny: 4,
  small: 8,
  regular: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
  xxlarge: 64,
};

export const borderRadius = {
  tiny: 4,
  small: 8,
  regular: 12,
  medium: 16,
  large: 24,
  round: 999,
};

export const shadows = {
  light: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.22,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 4.65,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.4,
      shadowRadius: 6.27,
      elevation: 10,
    },
  },
};

export const animation = {
  scale: 1.0,
  timing: {
    fast: 200,
    base: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    easeInOut: 'easeInOut',
  },
};

export const zIndex = {
  base: 0,
  card: 1,
  dialog: 2,
  popup: 3,
  modal: 4,
  toast: 5,
  loader: 6,
};

export type ThemeMode = 'light' | 'dark' | 'system' | 'highContrast';

/**
 * Helper to resolve nested color objects based on mode
 */
const resolveColors = (palette: any, mode: 'light' | 'dark' | 'highContrast'): any => {
  const resolved: any = {};
  for (const [key, value] of Object.entries(palette)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Check if this object is a leaf node containing theme modes
      const isLeaf = 'light' in value || 'dark' in value || 'highContrast' in value;
      if (isLeaf) {
        if (mode === 'highContrast' && (value as any).highContrast !== undefined) {
          resolved[key] = (value as any).highContrast;
        } else {
          resolved[key] =
            (value as any)[mode] !== undefined ? (value as any)[mode] : (value as any).light;
        }
      } else {
        // It's a nested category (like text) that doesn't contain light/dark keys directly
        resolved[key] = resolveColors(value, mode);
      }
    } else {
      resolved[key] = value;
    }
  }
  return resolved;
};

export const getTheme = (mode: ThemeMode, systemScheme: 'light' | 'dark' = 'light') => {
  const actualMode = mode === 'system' ? systemScheme : (mode as 'light' | 'dark' | 'highContrast');
  const palette = mode === 'highContrast' ? highContrastColors : colors;

  const selectedColors = resolveColors(palette, actualMode);

  return {
    metrics,
    colors: { ...selectedColors, mode: actualMode },
    typography,
    spacing,
    borderRadius,
    shadows: actualMode === 'dark' ? shadows.dark : shadows.light,
    animation,
    zIndex,
  };
};

export const lightTheme = getTheme('light');
export const darkTheme = getTheme('dark');

const theme = {
  metrics,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  zIndex,
  highContrastColors,
  getTheme,
};

export type Theme = typeof theme;

export function useAppTheme(mode: ThemeMode = 'system', isHighContrast: boolean = false) {
  const colorScheme = useColorScheme();
  const systemMode: 'light' | 'dark' = colorScheme === 'dark' ? 'dark' : 'light';

  if (isHighContrast) {
    return getTheme('highContrast', systemMode);
  }
  return getTheme(mode, systemMode);
}

export default theme;
