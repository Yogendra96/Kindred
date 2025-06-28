import { getTheme, type ThemeMode, type Theme } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootState } from '@store/index';
import React, { createContext, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

type ThemeContextType = {
  theme: ReturnType<typeof getTheme>;
  isDark: boolean;
  isHighContrast: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  toggleHighContrast: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme('light', 'light'),
  isDark: false,
  isHighContrast: false,
  toggleTheme: () => {},
  setTheme: () => {},
  toggleHighContrast: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const themePreference = useSelector(
    (state: RootState) => state.user.preferences.theme,
  );
  const highContrastPreference = useSelector(
    (state: RootState) => state.user.preferences.highContrast,
  );
  const [highContrast, setHighContrast] = React.useState(
    highContrastPreference,
  );
  const [systemScheme, setSystemScheme] = React.useState<'light' | 'dark'>(
    'light',
  );

  // Load theme preference from AsyncStorage on mount
  React.useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme_preference');
        if (
          savedTheme !== null &&
          ['light', 'dark', 'system', 'highContrast'].includes(savedTheme) &&
          savedTheme !== themePreference
        ) {
          dispatch({
            type: 'user/updatePreferences',
            payload: { theme: savedTheme as ThemeMode },
          });
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, [dispatch]); // Only run on mount

  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    setSystemScheme(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    const loadHighContrastPreference = async () => {
      try {
        const savedHighContrast = await AsyncStorage.getItem(
          '@high_contrast_preference',
        );
        if (savedHighContrast !== null) {
          try {
            const parsedValue = JSON.parse(savedHighContrast);
            if (typeof parsedValue === 'boolean') {
              setHighContrast(parsedValue);
              // Update Redux if the stored value is different
              if (parsedValue !== highContrastPreference) {
                dispatch({
                  type: 'user/updatePreferences',
                  payload: { highContrast: parsedValue },
                });
              }
            }
          } catch (parseError) {
            console.error(
              'Error parsing high contrast preference:',
              parseError,
            );
          }
        }
      } catch (error) {
        console.error('Error loading high contrast preference:', error);
      }
    };

    loadHighContrastPreference();
  }, [dispatch]); // Only run on mount

  // Keep local state in sync with Redux
  React.useEffect(() => {
    if (highContrast !== highContrastPreference) {
      setHighContrast(highContrastPreference);
      // Also update AsyncStorage to keep it in sync
      AsyncStorage.setItem(
        '@high_contrast_preference',
        JSON.stringify(highContrastPreference),
      ).catch(error =>
        console.error('Error saving high contrast preference:', error),
      );
    }
  }, [highContrastPreference]);

  const isDark =
    (themePreference === 'system' ? systemScheme : themePreference) === 'dark';
  const isHighContrast = highContrast;

  const theme = React.useMemo(() => {
    if (isHighContrast) {
      return getTheme('highContrast', systemScheme);
    }
    return getTheme(themePreference, systemScheme);
  }, [themePreference, systemScheme, isHighContrast]);

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    try {
      await AsyncStorage.setItem('@theme_preference', newTheme);
      dispatch({
        type: 'user/updatePreferences',
        payload: { theme: newTheme },
      });
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const setTheme = async (mode: ThemeMode) => {
    if (!['light', 'dark', 'system', 'highContrast'].includes(mode)) {
      console.error('Invalid theme mode:', mode);
      return;
    }
    try {
      await AsyncStorage.setItem('@theme_preference', mode);
      dispatch({ type: 'user/updatePreferences', payload: { theme: mode } });
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const toggleHighContrast = async () => {
    const newHighContrast = !highContrast;
    try {
      setHighContrast(newHighContrast);
      await AsyncStorage.setItem(
        '@high_contrast_preference',
        JSON.stringify(newHighContrast),
      );
      dispatch({
        type: 'user/updatePreferences',
        payload: { highContrast: newHighContrast },
      });
    } catch (error) {
      console.error('Error toggling high contrast mode:', error);
    }
  };

  const value = {
    theme,
    isDark,
    isHighContrast,
    toggleTheme,
    setTheme,
    toggleHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export default ThemeProvider;
