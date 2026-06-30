// @ts-nocheck
/* eslint-disable */
import type { RootStackParamList, AuthStackParamList, MainStackParamList } from '@navigation/types';
import analytics from '@react-native-firebase/analytics';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { modernAPMService } from '@services/ModernAPMService';

type NavigationParams = RootStackParamList & AuthStackParamList & MainStackParamList;

export function useAppNavigation() {
  const navigation = useNavigation<NavigationProp<NavigationParams>>();
  const route = useRoute<RouteProp<NavigationParams>>();

  const navigate = async <T extends keyof NavigationParams>(
    screen: T,
    params?: NavigationParams[T],
  ) => {
    try {
      // Start performance tracking
      await modernAPMService.startTraceSimple(`navigation_${screen as string}`);

      // Track screen view in analytics
      await analytics().logScreenView({
        screen_name: screen as string,
        screen_class: screen as string,
      });

      // Perform navigation
      navigation.navigate(screen, params);

      // Stop performance tracking
      await modernAPMService.stopTraceSimple(`navigation_${screen as string}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const goBack = async () => {
    try {
      const currentRoute = route.name;

      // Track back navigation
      await analytics().logEvent('screen_exit', {
        screen_name: currentRoute,
        exit_method: 'back_button',
      });

      navigation.goBack();
    } catch (error) {
      console.error('Navigation back error:', error);
    }
  };

  const reset = async <T extends keyof NavigationParams>(
    screen: T,
    params?: NavigationParams[T],
  ) => {
    try {
      // Track navigation reset
      await analytics().logEvent('navigation_reset', {
        to_screen: screen,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: screen, params }],
      });
    } catch (error) {
      console.error('Navigation reset error:', error);
    }
  };

  const replace = async <T extends keyof NavigationParams>(
    screen: T,
    params?: NavigationParams[T],
  ) => {
    try {
      const currentRoute = route.name;

      // Track screen replacement
      await analytics().logEvent('screen_replace', {
        from_screen: currentRoute,
        to_screen: screen,
      });

      navigation.replace(screen, params);
    } catch (error) {
      console.error('Navigation replace error:', error);
    }
  };

  return {
    navigation,
    route,
    navigate,
    goBack,
    reset,
    replace,
  };
}

export default useAppNavigation;
