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
import VeganCalculatorScreen from '../screens/main/VeganCalculatorScreen';
import AnalyticsDashboardScreen from '../screens/main/AnalyticsDashboardScreen';
import LearningCenterScreen from '../screens/main/LearningCenterScreen';
import SmartDevicesScreen from '../screens/main/SmartDevicesScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { House, MapTrifold, User, Users, ShoppingCart, Trophy } from 'phosphor-react-native';
import AppErrorBoundary from '../components/ui/AppErrorBoundary';
import logger from '../services/LoggerService';
import { ErrorHandler } from '../utils/errorHandler';

const log = logger.withTag('AppNavigator');

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const weight = focused ? 'fill' : 'regular';
          
          if (route.name === 'Home') return <House size={size} color={color} weight={weight} />;
          if (route.name === 'Map') return <MapTrifold size={size} color={color} weight={weight} />;
          if (route.name === 'Profile') return <User size={size} color={color} weight={weight} />;
          if (route.name === 'Social') return <Users size={size} color={color} weight={weight} />;
          if (route.name === 'Market') return <ShoppingCart size={size} color={color} weight={weight} />;
          if (route.name === 'Awards') return <Trophy size={size} color={color} weight={weight} />;
          
          return null;
        },
        tabBarActiveTintColor: '#007AFF', // You could use spatialColors.primary here
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1C1C1E', // Dark mode support
          borderTopColor: 'rgba(255,255,255,0.1)',
        },
        headerShown: false,
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
  useEffect(() => {
    ErrorHandler.installGlobalHandlers();
    log.info('AppNavigator mounted — global error handlers installed');
    return () => log.info('AppNavigator unmounted');
  }, []);

  return (
    <AppErrorBoundary tag='AppNavigator'>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name='MainTabs' component={MainTabs} />
        <Stack.Screen name='CarbonTwin' component={CarbonTwinScreen} />
        <Stack.Screen name='VisionCamera' component={VisionCameraScreen} />
        <Stack.Screen
          name='Verification'
          component={VerificationCenterScreen}
        />
        <Stack.Screen
          name='VeganCalculator'
          component={VeganCalculatorScreen}
        />
        <Stack.Screen name='Analytics' component={AnalyticsDashboardScreen} />
        <Stack.Screen name='LearningCenter' component={LearningCenterScreen} />
        <Stack.Screen name='SmartDevices' component={SmartDevicesScreen} />
      </Stack.Navigator>
    </AppErrorBoundary>
  );
};

export default AppNavigator;
