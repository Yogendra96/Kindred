/**
 * Global type declarations for external libraries and modules
 * Fixes TypeScript compilation errors for third-party dependencies
 */

// React Native Firebase type fixes
declare module '@react-native-firebase/analytics' {
  export interface Currency {
    [key: string]: string;
  }

  export interface Promotion {
    [key: string]: unknown;
  }

  export type ConsentStatusString = 'granted' | 'denied';

  export interface MultiFactorError {
    [key: string]: unknown;
  }

  export interface PasswordPolicy {
    [key: string]: unknown;
  }

  export interface ActionCodeURL {
    [key: string]: unknown;
  }
}

declare module '@react-native-firebase/auth' {
  export interface MultiFactorError {
    [key: string]: unknown;
  }

  export interface PasswordPolicy {
    [key: string]: unknown;
  }

  export interface ActionCodeURL {
    [key: string]: unknown;
  }
}

declare module '@react-native-firebase/app' {
  export interface ReactNativeAsyncStorage {
    [key: string]: unknown;
  }
}

declare module '@react-native-firebase/firestore' {
  export interface FirestoreBlob {
    [key: string]: unknown;
  }

  export interface DocumentData {
    [key: string]: unknown;
  }
}

// Expo Vector Icons type fix
declare module '@expo/vector-icons/build/createIconSet' {
  export default function createIconSet(
    glyphMap: Record<string, unknown>,
    fontFamily: string,
    fontFile?: string,
  ): React.ComponentType<unknown>;
}

declare module '@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set' {
  export default function createIconSet(
    glyphMap: Record<string, unknown>,
    fontFamily: string,
    fontFile?: string,
  ): React.ComponentType<unknown>;
}

// React Native Chart Kit type extensions
declare module 'react-native-chart-kit' {
  export interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    color?: (opacity?: number) => string;
    style?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface ChartData {
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    [key: string]: unknown;
  }

  export interface PieChartProps {
    data: ChartData[];
    width: number;
    height: number;
    chartConfig: ChartConfig;
    accessor: string;
    backgroundColor?: string;
    paddingLeft?: string;
    absolute?: boolean;
    [key: string]: unknown;
  }

  export const PieChart: React.ComponentType<PieChartProps>;
}

// Global utility types
declare global {
  interface Window {
    __DEV__: boolean;
  }

  // Extend console for development
  namespace Console {
    interface Console {
      tron?: {
        log: (message: unknown, ...args: unknown[]) => void;
        error: (message: unknown, ...args: unknown[]) => void;
        warn: (message: unknown, ...args: unknown[]) => void;
      };
    }
  }
}

// React Native specific extensions
declare module 'react-native' {
  interface ViewStyle {
    [key: string]: unknown;
  }

  interface TextStyle {
    [key: string]: unknown;
  }

  interface ImageStyle {
    [key: string]: unknown;
  }
}

export {};
