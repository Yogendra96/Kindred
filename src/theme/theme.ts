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

export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
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
  background: {
    light: '#FFFFFF',
    dark: '#000000',
  },
  surface: {
    light: '#F2F2F7',
    dark: '#1C1C1E',
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
  secondary: '#FFFFFF',
  accent: '#FFD700',
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

export const getTheme = (mode: ThemeMode, systemScheme: 'light' | 'dark' = 'light') => {
  let selectedColors;
  if (mode === 'highContrast') {
    selectedColors = highContrastColors;
  } else if (mode === 'system') {
    selectedColors =
      systemScheme === 'dark' ? { ...colors, mode: 'dark' } : { ...colors, mode: 'light' };
  } else if (mode === 'dark') {
    selectedColors = { ...colors, mode: 'dark' };
  } else {
    selectedColors = { ...colors, mode: 'light' };
  }
  return {
    metrics,
    colors: selectedColors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
    zIndex,
  };
};

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
