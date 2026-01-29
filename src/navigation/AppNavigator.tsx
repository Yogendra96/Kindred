// Import screens (we'll create these next)
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SocialScreen from '../screens/main/SocialScreen';
import MarketplaceScreen from '../screens/main/MarketplaceScreen';
import AchievementsScreen from '../screens/main/AchievementsScreen';
import CarbonTwinScreen from '../screens/main/CarbonTwinScreen';
import VisionCameraScreen from '../screens/main/VisionCameraScreen';
import VerificationCenterScreen from '../screens/main/VerificationCenterScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Social') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Market') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Awards') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name='Home' component={HomeScreen} />
      <Tab.Screen name='Map' component={MapScreen} />
      <Tab.Screen name='Profile' component={ProfileScreen} />
      <Tab.Screen name='Social' component={SocialScreen} />
      <Tab.Screen name='Market' component={MarketplaceScreen} />
      <Tab.Screen name='Awards' component={AchievementsScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name='MainTabs' component={MainTabs} />
      <Stack.Screen name='CarbonTwin' component={CarbonTwinScreen} />
      <Stack.Screen name='VisionCamera' component={VisionCameraScreen} />
      <Stack.Screen name='Verification' component={VerificationCenterScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
