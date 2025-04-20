import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import theme, { Theme } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '@store/index';

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const systemColorScheme = useColorScheme();
  const themePreference = useSelector((state: RootState) => state.app.theme);
  
  const isDark = themePreference === 'system' 
    ? systemColorScheme === 'dark'
    : themePreference === 'dark';

  useEffect(() => {
    // Load saved theme preference
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@theme_preference');
        if (savedTheme) {
          dispatch({ type: 'app/setTheme', payload: savedTheme });
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, [dispatch]);

  const toggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    try {
      await AsyncStorage.setItem('@theme_preference', newTheme);
      dispatch({ type: 'app/setTheme', payload: newTheme });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = async (mode: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem('@theme_preference', mode);
      dispatch({ type: 'app/setTheme', payload: mode });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const themedColors = {
    ...theme,
    colors: {
      ...theme.colors,
      background: isDark ? theme.colors.background.dark : theme.colors.background.light,
      surface: isDark ? theme.colors.surface.dark : theme.colors.surface.light,
      text: {
        primary: isDark ? theme.colors.text.primary.dark : theme.colors.text.primary.light,
        secondary: isDark ? theme.colors.text.secondary.dark : theme.colors.text.secondary.light,
        disabled: isDark ? theme.colors.text.disabled.dark : theme.colors.text.disabled.light,
      },
      border: isDark ? theme.colors.border.dark : theme.colors.border.light,
    },
    shadows: isDark ? theme.shadows.dark : theme.shadows.light,
  };

  const value = {
    theme: themedColors,
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;