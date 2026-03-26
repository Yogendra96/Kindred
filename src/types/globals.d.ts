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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export type ConsentStatusString = 'granted' | 'denied';

  export interface MultiFactorError {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface PasswordPolicy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface ActionCodeURL {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

declare module '@react-native-firebase/auth' {
  export interface MultiFactorError {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface PasswordPolicy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface ActionCodeURL {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

declare module '@react-native-firebase/app' {
  export interface ReactNativeAsyncStorage {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

declare module '@react-native-firebase/firestore' {
  export interface FirestoreBlob {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface DocumentData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

// Expo Vector Icons type fix
declare module '@expo/vector-icons/build/createIconSet' {
  export default function createIconSet(
    glyphMap: Record<string, any>,
    fontFamily: string,
    fontFile?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): React.ComponentType<any>;
}

declare module '@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set' {
  export default function createIconSet(
    glyphMap: Record<string, any>,
    fontFamily: string,
    fontFile?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): React.ComponentType<any>;
}

// React Native Chart Kit type extensions
declare module 'react-native-chart-kit' {
  export interface ChartConfig {
    backgroundColor?: string;
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    color?: (opacity?: number) => string;
    style?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface ChartData {
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        log: (message: any, ...args: any[]) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (message: any, ...args: any[]) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        warn: (message: any, ...args: any[]) => void;
      };
    }
  }
}

// React Native specific extensions
declare module 'react-native' {
  interface ViewStyle {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface TextStyle {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  interface ImageStyle {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }
}

export {};
