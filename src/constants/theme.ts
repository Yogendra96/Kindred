/**
 * theme.ts — Kindred Design Tokens
 *
 * Single source of truth for colors, spacing, typography, shadows.
 * Import this everywhere instead of hardcoding values in StyleSheet.
 *
 * Usage:
 *   import { colors, spacing, typography, radii, shadows } from '../../constants/theme';
 */

// ─── Color Palette ────────────────────────────────────────────────────────────

export const colors = {
  // Brand greens
  green900: '#1b5e20',
  green800: '#2e7d32',
  green700: '#388e3c',
  green500: '#4caf50',
  green200: '#a5d6a7',
  green50: '#e8f5e9',

  // Brand blues
  blue900: '#0d1f3c',
  blue800: '#1565c0',
  blue700: '#1976d2',
  blue200: '#90caf9',
  blue50: '#e3f2fd',

  // Accent
  purple800: '#6a1b9a',
  purple50: '#f3e5f5',
  orange800: '#e65100',
  orange50: '#fff3e0',
  red800: '#c62828',
  red500: '#e53935',
  red50: '#ffebee',
  teal700: '#00838f',
  amber700: '#f57f17',

  // Backgrounds
  backgroundPrimary: '#f5f5f5',
  backgroundCard: '#ffffff',
  backgroundDark: '#0d1f12',
  backgroundDarkCard: '#1a2e1f',

  // Text
  textPrimary: '#1a1a1a',
  textSecondary: '#555555',
  textMuted: '#aaaaaa',
  textOnDark: '#ffffff',
  textOnDarkMuted: 'rgba(255,255,255,0.65)',

  // Borders
  borderLight: '#eeeeee',
  borderMedium: '#e0e0e0',
} as const;

// ─── Spacing Scale ────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
} as const;

// ─── Border Radii ─────────────────────────────────────────────────────────────

export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  pill: 999,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  // Sizes
  xs: 10,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 26,
  hero: 36,

  // Weights (string literals for RN StyleSheet compatibility)
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  lifted: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;
