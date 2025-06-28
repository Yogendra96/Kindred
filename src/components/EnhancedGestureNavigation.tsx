import { HapticFeedbackService } from '../services/HapticFeedbackService';
import type {
  PanGestureHandlerGestureEvent,
  PanGestureHandlerGestureEvent} from 'react-native';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@theme/ThemeProvider';
import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GestureConfig {
  enabled: boolean;
  threshold: number;
  velocity: number;
  hapticFeedback: boolean;
  visualFeedback: boolean;
  edgeSwipeOnly: boolean;
  edgeThreshold: number;
}

interface SwipeAction {
  direction: 'left' | 'right' | 'up' | 'down';
  action: () => void;
  icon?: string;
  label?: string;
  color?: string;
  enabled?: boolean;
  requiresConfirmation?: boolean;
}

interface EnhancedGestureNavigationProps {
  children: React.ReactNode;
  swipeActions?: SwipeAction[];
  config?: Partial<GestureConfig>;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  testID?: string;
}

const defaultConfig: GestureConfig = {
  enabled: true,
  threshold: screenWidth * 0.3,
  velocity: 500,
  hapticFeedback: true,
  visualFeedback: true,
  edgeSwipeOnly: false,
  edgeThreshold: 50,
};

const defaultSwipeActions: SwipeAction[] = [
  {
    direction: 'right',
    action: () => {},
    icon: 'arrow-back',
    label: 'Go Back',
    color: '#2196F3',
  },
  {
    direction: 'left',
    action: () => {},
    icon: 'arrow-forward',
    label: 'Go Forward',
    color: '#4CAF50',
  },
  {
    direction: 'up',
    action: () => {},
    icon: 'chevron-up',
    label: 'Scroll Up',
    color: '#FF9800',
  },
  {
    direction: 'down',
    action: () => {},
    icon: 'chevron-down',
    label: 'Scroll Down',
    color: '#9C27B0',
  },
];

export const EnhancedGestureNavigation: React.FC<
  EnhancedGestureNavigationProps
> = ({
  children,
  swipeActions = defaultSwipeActions,
  config: userConfig = {},
  onGestureStart,
  onGestureEnd,
  testID,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [config, setConfig] = useState<GestureConfig>({
    ...defaultConfig,
    ...userConfig,
  });
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [activeDirection, setActiveDirection] = useState<string | null>(null);

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(0)).current;

  // Gesture state
  const gestureState = useRef({
    startX: 0,
    startY: 0,
    isEdgeSwipe: false,
    direction: null as string | null,
    hasTriggeredHaptic: false,
  }).current;

  useEffect(() => {
    loadGestureSettings();
  }, []);

  const loadGestureSettings = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem(
        'gesture_navigation_config',
      );
      if (savedConfig) {
        setConfig({ ...config, ...JSON.parse(savedConfig) });
      }
    } catch (error) {
      console.error('Error loading gesture settings:', error);
    }
  };

  const saveGestureSettings = async (newConfig: Partial<GestureConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      await AsyncStorage.setItem(
        'gesture_navigation_config',
        JSON.stringify(updatedConfig),
      );
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Error saving gesture settings:', error);
    }
  };

  const getSwipeDirection = (
    translationX: number,
    translationY: number,
  ): string | null => {
    const absX = Math.abs(translationX);
    const absY = Math.abs(translationY);

    // Determine if gesture is more horizontal or vertical
    if (absX > absY) {
      return translationX > 0 ? 'right' : 'left';
    } else {
      return translationY > 0 ? 'down' : 'up';
    }
  };

  const getActionForDirection = (direction: string): SwipeAction | null => {
    return (
      swipeActions.find(
        action => action.direction === direction && action.enabled !== false,
      ) || null
    );
  };

  const isEdgeSwipe = (startX: number, startY: number): boolean => {
    if (!config.edgeSwipeOnly) return true;

    return (
      startX <= config.edgeThreshold ||
      startX >= screenWidth - config.edgeThreshold ||
      startY <= config.edgeThreshold ||
      startY >= screenHeight - config.edgeThreshold
    );
  };

  const triggerHapticFeedback = (
    type: 'start' | 'threshold' | 'success' | 'cancel',
  ) => {
    if (!config.hapticFeedback) return;

    switch (type) {
      case 'start':
        HapticFeedbackService.triggerSelection();
        break;
      case 'threshold':
        HapticFeedbackService.triggerImpact('medium');
        break;
      case 'success':
        HapticFeedbackService.triggerSuccess();
        break;
      case 'cancel':
        HapticFeedbackService.triggerImpact('light');
        break;
    }
  };

  const showVisualFeedback = (direction: string, progress: number) => {
    if (!config.visualFeedback) return;

    setActiveDirection(direction);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: Math.min(progress, 0.8),
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(indicatorScale, {
        toValue: 0.8 + progress * 0.4,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
  };

  const hideVisualFeedback = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(indicatorScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start(() => {
      setActiveDirection(null);
    });
  };

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    {
      useNativeDriver: true,
      listener: (event: PanGestureHandlerGestureEvent) => {
        const { translationX, translationY } = event.nativeEvent;
        const direction = getSwipeDirection(translationX, translationY);
        const action = getActionForDirection(direction || '');

        if (!action) return;

        const distance = Math.sqrt(
          translationX * translationX + translationY * translationY,
        );
        const progress = Math.min(distance / config.threshold, 1);

        // Show visual feedback
        if (direction && distance > 20) {
          showVisualFeedback(direction, progress);
        }

        // Trigger haptic feedback at threshold
        if (distance >= config.threshold && !gestureState.hasTriggeredHaptic) {
          gestureState.hasTriggeredHaptic = true;
          triggerHapticFeedback('threshold');
        }

        // Update gesture state
        gestureState.direction = direction;
      },
    },
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { state, translationX, translationY, velocityX, velocityY, x, y } =
      event.nativeEvent;

    switch (state) {
      case State.BEGAN:
        if (!config.enabled) return;

        gestureState.startX = x;
        gestureState.startY = y;
        gestureState.isEdgeSwipe = isEdgeSwipe(x, y);
        gestureState.hasTriggeredHaptic = false;

        if (!gestureState.isEdgeSwipe && config.edgeSwipeOnly) {
          return;
        }

        setIsGestureActive(true);
        triggerHapticFeedback('start');
        onGestureStart?.();
        break;

      case State.ACTIVE:
        // Handled in onGestureEvent
        break;

      case State.END:
      case State.CANCELLED:
        const direction = getSwipeDirection(translationX, translationY);
        const action = getActionForDirection(direction || '');
        const distance = Math.sqrt(
          translationX * translationX + translationY * translationY,
        );
        const velocity = Math.sqrt(
          velocityX * velocityX + velocityY * velocityY,
        );

        const shouldTrigger =
          action &&
          (distance >= config.threshold || velocity >= config.velocity);

        if (shouldTrigger && gestureState.isEdgeSwipe) {
          triggerHapticFeedback('success');

          // Execute action with slight delay for better UX
          setTimeout(() => {
            action.action();
          }, 100);
        } else if (distance > 20) {
          triggerHapticFeedback('cancel');
        }

        // Reset animations
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }),
        ]).start();

        hideVisualFeedback();
        setIsGestureActive(false);
        onGestureEnd?.();

        // Reset gesture state
        gestureState.direction = null;
        gestureState.hasTriggeredHaptic = false;
        break;
    }
  };

  const getIndicatorPosition = () => {
    switch (activeDirection) {
      case 'left':
        return { right: 50, top: '50%', marginTop: -25 };
      case 'right':
        return { left: 50, top: '50%', marginTop: -25 };
      case 'up':
        return { bottom: 50, left: '50%', marginLeft: -25 };
      case 'down':
        return { top: 50, left: '50%', marginLeft: -25 };
      default:
        return { left: '50%', top: '50%', marginLeft: -25, marginTop: -25 };
    }
  };

  const getIndicatorIcon = () => {
    const action = getActionForDirection(activeDirection || '');
    return action?.icon || 'hand-left';
  };

  const getIndicatorColor = () => {
    const action = getActionForDirection(activeDirection || '');
    return action?.color || theme.colors.primary;
  };

  const animatedStyle = {
    transform: [{ translateX }, { translateY }, { scale }],
  };

  const indicatorStyle = {
    ...getIndicatorPosition(),
    opacity,
    transform: [{ scale: indicatorScale }],
  };

  return (
    <GestureHandlerRootView style={styles.container} testID={testID}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={config.enabled}
        activeOffsetX={[-10, 10]}
        activeOffsetY={[-10, 10]}
        failOffsetX={[-5, 5]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View style={[styles.gestureContainer, animatedStyle]}>
          {children}

          {/* Visual feedback indicator */}
          {config.visualFeedback && activeDirection && (
            <Animated.View
              style={[
                styles.gestureIndicator,
                {
                  backgroundColor: getIndicatorColor(),
                  borderColor: theme.colors.surface,
                },
                indicatorStyle,
              ]}
              accessible={true}
              accessibilityLabel={`Gesture indicator: ${activeDirection}`}
            >
              <Ionicons
                name={getIndicatorIcon() as any}
                size={24}
                color={theme.colors.surface}
              />
            </Animated.View>
          )}

          {/* Edge indicators */}
          {config.edgeSwipeOnly && config.visualFeedback && (
            <>
              <View style={[styles.edgeIndicator, styles.leftEdge]} />
              <View style={[styles.edgeIndicator, styles.rightEdge]} />
              <View style={[styles.edgeIndicator, styles.topEdge]} />
              <View style={[styles.edgeIndicator, styles.bottomEdge]} />
            </>
          )}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

// Hook for using gesture navigation
export const useGestureNavigation = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  const createNavigationActions = useCallback((): SwipeAction[] => {
    return [
      {
        direction: 'right',
        action: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        },
        icon: 'arrow-back',
        label: 'Go Back',
        color: '#2196F3',
        enabled: navigation.canGoBack(),
      },
      {
        direction: 'left',
        action: () => {
          // Custom forward navigation logic
          console.log('Forward navigation');
        },
        icon: 'arrow-forward',
        label: 'Go Forward',
        color: '#4CAF50',
        enabled: false, // Disable by default
      },
    ];
  }, [navigation]);

  const createTabActions = useCallback((tabNames: string[]): SwipeAction[] => {
    return [
      {
        direction: 'left',
        action: () => {
          // Navigate to next tab
          console.log('Next tab');
        },
        icon: 'chevron-forward',
        label: 'Next Tab',
        color: '#4CAF50',
      },
      {
        direction: 'right',
        action: () => {
          // Navigate to previous tab
          console.log('Previous tab');
        },
        icon: 'chevron-back',
        label: 'Previous Tab',
        color: '#2196F3',
      },
    ];
  }, []);

  const createCustomActions = useCallback(
    (actions: Partial<SwipeAction>[]): SwipeAction[] => {
      return actions.map(action => ({
        direction: 'right',
        action: () => {},
        icon: 'hand-left',
        label: 'Custom Action',
        color: '#9C27B0',
        enabled: true,
        ...action,
      })) as SwipeAction[];
    },
    [],
  );

  return {
    createNavigationActions,
    createTabActions,
    createCustomActions,
  };
};

// Configuration component for gesture settings
export const GestureNavigationSettings: React.FC<{
  config: GestureConfig;
  onConfigChange: (config: Partial<GestureConfig>) => void;
}> = ({ config, onConfigChange }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.settingsContainer}>
      {/* Settings UI would go here */}
      {/* This is a placeholder for the actual settings implementation */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureContainer: {
    flex: 1,
  },
  gestureIndicator: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  edgeIndicator: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.3,
  },
  leftEdge: {
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  rightEdge: {
    right: 0,
    top: 0,
    bottom: 0,
    width: 2,
  },
  topEdge: {
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  bottomEdge: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  settingsContainer: {
    padding: 16,
  },
});

export default EnhancedGestureNavigation;
