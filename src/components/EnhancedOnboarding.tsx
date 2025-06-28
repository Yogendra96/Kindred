import { HapticFeedbackService } from '../services/HapticFeedbackService';
import { AnimatedTouchable, AnimatedProgress } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef, useEffect } from 'react';
import type { PanGestureHandlerGestureEvent } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
  ScrollView,
  Image,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: any; // For local images
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
  const { theme, isDark } = useTheme();
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
    onSkip?.() || onComplete();
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true },
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
                accessible={true}
                accessibilityLabel={`Onboarding step ${index + 1} illustration`}
              />
            )}
            {step.imageUrl && (
              <Image
                source={{ uri: step.imageUrl }}
                style={styles.stepImage}
                resizeMode='contain'
                accessible={true}
                accessibilityLabel={`Onboarding step ${index + 1} illustration`}
              />
            )}
            {step.icon && (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={step.icon as any}
                  size={80}
                  color={theme.colors.primary}
                  accessible={true}
                  accessibilityLabel={`${step.icon} icon`}
                />
              </View>
            )}
          </View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Text
              style={[styles.stepTitle, { color: textColor }]}
              accessible={true}
              accessibilityRole='header'
            >
              {step.title}
            </Text>
            <Text
              style={[styles.stepDescription, { color: textColor }]}
              accessible={true}
            >
              {step.description}
            </Text>
          </View>

          {/* Interactive Component */}
          {step.interactive && (
            <View style={styles.interactiveContainer}>
              <Text
                style={[styles.interactiveDescription, { color: textColor }]}
                accessible={true}
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
                accessible={true}
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
              {
                backgroundColor:
                  index === currentStep
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
                width: index === currentStep ? 24 : 8,
              },
            ]}
            hapticType='light'
            animationType='scale'
            accessible={true}
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
            accessible={true}
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
            animated={true}
          />
        </View>
      )}

      {/* Steps Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={enableSwipeNavigation}
      >
        <Animated.View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            style={{ flex: 1 }}
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
              accessible={true}
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

          <View style={{ flex: 1 }} />

          <AnimatedTouchable
            onPress={handleNext}
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: theme.colors.primary },
            ]}
            hapticType='medium'
            animationType='scale'
            accessible={true}
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
  container: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
  },
  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  stepImage: {
    width: 250,
    height: 250,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  interactiveContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  interactiveDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  actionContainer: {
    marginBottom: 20,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  previousButton: {
    borderWidth: 1,
  },
  nextButton: {
    // backgroundColor set dynamically
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedOnboarding;
