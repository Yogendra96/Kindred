import { ThemeProvider } from '../src/contexts/ThemeContext';
// Import your app's theme and store
import { store } from '../src/store/store';
import { theme } from '../src/theme/theme';
import { NavigationContainer } from '@react-navigation/native';
import { withA11y } from '@storybook/addon-a11y';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { addDecorator, addParameters } from '@storybook/react';
import { QueryClient, QueryProvider } from '@tanstack/react-query';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

// Create a query client for Storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

// Mock navigation for Storybook
const MockedNavigator = ({ children }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

// Global decorator to wrap all stories
const GlobalDecorator = _Story => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <Provider store={store}>
        <QueryProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <MockedNavigator>
              <div
                style={{
                  padding: '20px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  backgroundColor: '#f5f5f5',
                  minHeight: '100vh',
                }}
              >
                <_Story />
              </div>
            </MockedNavigator>
          </ThemeProvider>
        </QueryProvider>
      </Provider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

// Add decorators
addDecorator(GlobalDecorator);
addDecorator(withA11y);

// Storybook parameters
addParameters({
  // Viewport addon configuration
  viewport: {
    viewports: {
      ...INITIAL_VIEWPORTS,
      iphone12: {
        name: 'iPhone 12',
        styles: {
          width: '390px',
          height: '844px',
        },
      },
      iphone12Pro: {
        name: 'iPhone 12 Pro',
        styles: {
          width: '390px',
          height: '844px',
        },
      },
      iphone12ProMax: {
        name: 'iPhone 12 Pro Max',
        styles: {
          width: '428px',
          height: '926px',
        },
      },
      pixel4: {
        name: 'Pixel 4',
        styles: {
          width: '353px',
          height: '745px',
        },
      },
      pixel5: {
        name: 'Pixel 5',
        styles: {
          width: '393px',
          height: '851px',
        },
      },
    },
    defaultViewport: 'iphone12',
  },

  // Actions addon configuration
  actions: {
    argTypesRegex: '^on[A-Z].*',
  },

  // Controls addon configuration
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
    expanded: true,
    sort: 'requiredFirst',
  },

  // Docs addon configuration
  docs: {
    theme: {
      base: 'light',
      brandTitle: 'Kindred Design System',
      brandUrl: 'https://kindred.app',
      brandImage: '/logo.png',
    },
    source: {
      state: 'open',
    },
  },

  // Accessibility addon configuration
  a11y: {
    element: '#root',
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: true,
        },
        {
          id: 'focus-order-semantics',
          enabled: true,
        },
        {
          id: 'keyboard-navigation',
          enabled: true,
        },
      ],
    },
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },

  // Background addon configuration
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#ffffff',
      },
      {
        name: 'dark',
        value: '#1a1a1a',
      },
      {
        name: 'green',
        value: '#4CAF50',
      },
      {
        name: 'blue',
        value: '#2196F3',
      },
    ],
  },

  // Layout configuration
  layout: 'centered',

  // Options configuration
  options: {
    storySort: {
      order: [
        'Introduction',
        'Design System',
        ['Colors', 'Typography', 'Spacing', 'Icons'],
        'Components',
        ['Basic', 'Forms', 'Navigation', 'Feedback', 'Data Display'],
        'Screens',
        'Examples',
      ],
    },
  },
});

// Global types for controls
export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'light', title: 'Light Theme' },
        { value: 'dark', title: 'Dark Theme' },
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', title: 'English' },
        { value: 'es', title: 'Español' },
        { value: 'fr', title: 'Français' },
        { value: 'de', title: 'Deutsch' },
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
  platform: {
    name: 'Platform',
    description: 'Target platform',
    defaultValue: 'ios',
    toolbar: {
      icon: 'mobile',
      items: [
        { value: 'ios', title: 'iOS' },
        { value: 'android', title: 'Android' },
        { value: 'web', title: 'Web' },
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
};

// Mock data for stories
export const mockData = {
  user: {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://via.placeholder.com/100',
    carbonFootprint: 2.5,
    achievements: 12,
    friends: 25,
  },
  activities: [
    {
      id: '1',
      type: 'walking',
      distance: 5,
      duration: 30,
      carbonSaved: 1.2,
      date: new Date('2023-12-01'),
    },
    {
      id: '2',
      type: 'cycling',
      distance: 10,
      duration: 25,
      carbonSaved: 2.8,
      date: new Date('2023-12-02'),
    },
    {
      id: '3',
      type: 'public_transport',
      distance: 15,
      duration: 45,
      carbonSaved: 4.5,
      date: new Date('2023-12-03'),
    },
  ],
  achievements: [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first eco-friendly activity',
      icon: 'trophy',
      earned: true,
      earnedDate: new Date('2023-11-15'),
    },
    {
      id: '2',
      title: 'Carbon Saver',
      description: 'Save 10kg of CO2 emissions',
      icon: 'leaf',
      earned: true,
      earnedDate: new Date('2023-11-20'),
    },
    {
      id: '3',
      title: 'Eco Warrior',
      description: 'Complete 50 eco-friendly activities',
      icon: 'shield',
      earned: false,
      progress: 32,
    },
  ],
  leaderboard: [
    {
      id: '1',
      name: 'Alice Johnson',
      avatar: 'https://via.placeholder.com/50',
      carbonSaved: 45.2,
      rank: 1,
    },
    {
      id: '2',
      name: 'Bob Smith',
      avatar: 'https://via.placeholder.com/50',
      carbonSaved: 38.7,
      rank: 2,
    },
    {
      id: '3',
      name: 'Carol Davis',
      avatar: 'https://via.placeholder.com/50',
      carbonSaved: 32.1,
      rank: 3,
    },
  ],
};

// Export parameters for use in stories
export const parameters = {
  mockData,
};
