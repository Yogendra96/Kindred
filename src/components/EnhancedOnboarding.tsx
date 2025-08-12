import React, { useEffect, useRef, useState } from 'react';

import type { PanGestureHandlerGestureEvent } from 'react-native';
import {
  Animated,
  Dimensions,
  Image,
  PanGestureHandler,
  ScrollView,
  State,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@theme/ThemeProvider';
// import { LinearGradient } from 'expo-linear-gradient';

import { HapticFeedbackService } from '../services/HapticFeedbackService';

import { AnimatedProgress, AnimatedTouchable } from './MicroInteractions';

const { width: screenWidth, height: _screenHeight } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: unknown; // For local images
  imageUrl?: string; // For remote images
  backgroundColor?: string;
  textColor?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  interactive?: {
    component: React.ReactNode;
    description: string;
  };
}

interface EnhancedOnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  showProgress?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  enableSwipeNavigation?: boolean;
  customHeader?: React.ReactNode;
  customFooter?: React.ReactNode;
  testID?: string;
}

export const EnhancedOnboarding: React.FC<EnhancedOnboardingProps> = ({
  steps,
  onComplete,
  onSkip,
  showSkip = true,
  showProgress = true,
  autoAdvance = false,
  autoAdvanceDelay = 5000,
  enableSwipeNavigation = true,
  customHeader,
  customFooter,
  testID,
}) => {
  const { theme, isDark: _isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if onboarding was already completed
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (autoAdvance && currentStep < steps.length - 1) {
      autoAdvanceTimer.current = setTimeout(() => {
        handleNext();
      }, autoAdvanceDelay);
    }

    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, [currentStep, autoAdvance, autoAdvanceDelay]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      if (completed === 'true') {
        setIsCompleted(true);
        onComplete();
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  const handleNext = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    HapticFeedbackService.triggerSelection();

    if (currentStep < steps.length - 1) {
      // Animate to next step
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({
          x: (currentStep + 1) * screenWidth,
          animated: false,
        });

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    HapticFeedbackService.triggerSelection();

    if (currentStep > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
        scrollViewRef.current?.scrollTo({
          x: (currentStep - 1) * screenWidth,
          animated: false,
        });

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleComplete = async () => {
    HapticFeedbackService.triggerSuccess();
    await markOnboardingComplete();
    onComplete();
  };

  const handleSkip = async () => {
    HapticFeedbackService.triggerImpact('light');
    await markOnboardingComplete();
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    {
      useNativeDriver: true,
    },
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (!enableSwipeNavigation) return;

    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      const threshold = screenWidth * 0.3;
      const shouldSwipe =
        Math.abs(translationX) > threshold || Math.abs(velocityX) > 500;

      if (shouldSwipe) {
        if (translationX > 0 && currentStep > 0) {
          handlePrevious();
        } else if (translationX < 0 && currentStep < steps.length - 1) {
          handleNext();
        }
      }

      // Reset gesture
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const renderStep = (step: OnboardingStep, index: number) => {
    const isActive = index === currentStep;
    const backgroundColor = step.backgroundColor || theme.colors.background;
    const textColor = step.textColor || theme.colors.onBackground;

    return (
      <View
        key={step.id}
        style={[styles.stepContainer, { backgroundColor, width: screenWidth }]}
      >
        <Animated.View
          style={[
            styles.stepContent,
            isActive ? styles.activeStep : styles.inactiveStep,
            {
              opacity: isActive ? fadeAnim : 0.3,
              transform: [{ scale: isActive ? scaleAnim : 0.95 }],
            },
          ]}
        >
          {/* Visual Content */}
          <View style={styles.visualContainer}>
            {step.image && (
              <Image
                source={step.image}
                style={styles.stepImage}
                resizeMode='contain'
                accessible
                accessibilityLabel={`Onboarding step ${index + 1} illustration`}
              />
            )}
            {step.imageUrl && (
              <Image
                source={{ uri: step.imageUrl }}
                style={styles.stepImage}
                resizeMode='contain'
                accessible
                accessibilityLabel={`Onboarding step ${index + 1} illustration`}
              />
            )}
            {step.icon && (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={step.icon as string}
                  size={80}
                  color={theme.colors.primary}
                  accessible
                  accessibilityLabel={`${step.icon} icon`}
                />
              </View>
            )}
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text
              style={[styles.stepTitle, { color: textColor }]}
              accessible
              accessibilityRole='header'
            >
              {step.title}
            </Text>
            <Text
              style={[styles.stepDescription, { color: textColor }]}
              accessible
            >
              {step.description}
            </Text>
          </View>

          {/* Interactive Component */}
          {step.interactive && (
            <View style={styles.interactiveContainer}>
              <Text
                style={[styles.interactiveDescription, { color: textColor }]}
                accessible
              >
                {step.interactive.description}
              </Text>
              {step.interactive.component}
            </View>
          )}

          {/* Step Action */}
          {step.action && (
            <View style={styles.actionContainer}>
              <AnimatedTouchable
                onPress={step.action.onPress}
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                hapticType='medium'
                animationType='scale'
                accessible
                accessibilityRole='button'
                accessibilityLabel={step.action.label}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  {step.action.label}
                </Text>
              </AnimatedTouchable>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {steps.map((_, index) => (
          <AnimatedTouchable
            key={index}
            onPress={() => {
              if (autoAdvanceTimer.current) {
                clearTimeout(autoAdvanceTimer.current);
              }
              setCurrentStep(index);
              scrollViewRef.current?.scrollTo({
                x: index * screenWidth,
                animated: true,
              });
            }}
            style={[
              styles.dot,
              index === currentStep ? styles.activeDot : styles.inactiveDot,
              {
                backgroundColor:
                  index === currentStep
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
              },
            ]}
            hapticType='light'
            animationType='scale'
            accessible
            accessibilityRole='button'
            accessibilityLabel={`Go to step ${index + 1}`}
            accessibilityState={{ selected: index === currentStep }}
          />
        ))}
      </View>
    );
  };

  if (isCompleted) {
    return null;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={testID}
    >
      {/* Custom Header */}
      {customHeader}

      {/* Skip Button */}
      {showSkip && (
        <View style={styles.skipContainer}>
          <AnimatedTouchable
            onPress={handleSkip}
            style={styles.skipButton}
            hapticType='light'
            animationType='scale'
            accessible
            accessibilityRole='button'
            accessibilityLabel='Skip onboarding'
          >
            <Text
              style={[
                styles.skipText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Skip
            </Text>
          </AnimatedTouchable>
        </View>
      )}

      {/* Progress Indicator */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <AnimatedProgress
            progress={(currentStep + 1) / steps.length}
            height={4}
            progressColor={theme.colors.primary}
            backgroundColor={theme.colors.surfaceVariant}
            animated
          />
        </View>
      )}

      {/* Steps Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={enableSwipeNavigation}
      >
        <Animated.View style={styles.flexContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            style={styles.flexContainer}
          >
            {steps.map((step, index) => renderStep(step, index))}
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {/* Dots Indicator */}
        {renderDots()}

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <AnimatedTouchable
              onPress={handlePrevious}
              style={[
                styles.navButton,
                styles.previousButton,
                { borderColor: theme.colors.outline },
              ]}
              hapticType='light'
              animationType='scale'
              accessible
              accessibilityRole='button'
              accessibilityLabel='Previous step'
            >
              <Ionicons
                name='chevron-back'
                size={20}
                color={theme.colors.onSurface}
              />
              <Text
                style={[
                  styles.navButtonText,
                  { color: theme.colors.onSurface },
                ]}
              >
                Previous
              </Text>
            </AnimatedTouchable>
          )}

          <View style={styles.flexSpacer} />

          <AnimatedTouchable
            onPress={handleNext}
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: theme.colors.primary },
            ]}
            hapticType='medium'
            animationType='scale'
            accessible
            accessibilityRole='button'
            accessibilityLabel={
              currentStep === steps.length - 1
                ? 'Complete onboarding'
                : 'Next step'
            }
          >
            <Text
              style={[styles.navButtonText, { color: theme.colors.onPrimary }]}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={
                currentStep === steps.length - 1
                  ? 'checkmark'
                  : 'chevron-forward'
              }
              size={20}
              color={theme.colors.onPrimary}
            />
          </AnimatedTouchable>
        </View>
      </View>

      {/* Custom Footer */}
      {customFooter}
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  activeStep: {
    // Active step styles handled by animation
  },
  inactiveStep: {
    // Inactive step styles handled by animation
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
  },
  flexContainer: {
    flex: 1,
  },
  flexSpacer: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  container: {
    flex: 1,
  },
  dot: {
    borderRadius: 4,
    height: 8,
  },
  dotsContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 60,
    height: 120,
    justifyContent: 'center',
    width: 120,
  },
  interactiveContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  interactiveDescription: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navigationContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  nextButton: {
    // backgroundColor set dynamically
  },
  previousButton: {
    borderWidth: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipContainer: {
    position: 'absolute',
    right: 20,
    top: 50,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stepContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
    textAlign: 'center',
  },
  stepImage: {
    height: 250,
    width: 250,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
    marginBottom: 16,
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  visualContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 40,
  },
});

export default EnhancedOnboarding;
