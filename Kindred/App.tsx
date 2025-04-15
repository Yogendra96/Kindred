/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import { theme } from './src/theme/theme';

const Stack = createNativeStackNavigator();

function HomeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.welcomeText,
          { color: isDarkMode ? theme.colors.text.dark : theme.colors.text.light },
        ]}>
        Welcome to Kindred
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer>
      <SafeAreaView style={[styles.container, {
        backgroundColor: isDarkMode ? theme.colors.background.dark : theme.colors.background.light
      }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? theme.colors.background.dark : theme.colors.background.light}
        />
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeText: {
    ...theme.typography.heading,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
});

export default App;
