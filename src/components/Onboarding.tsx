// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable, AnimatedProgress } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef, useEffect } from 'react';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Dimensions, Animated, ScrollView, Image } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: any;
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  showProgress?: boolean;
}

/**
 * Onboarding Component
 * Guided tour and feature introduction for new users
 */
export const Onboarding: React.FC<OnboardingProps> = ({
  steps,
  onComplete,
  showProgress = true,
}) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    HapticFeedbackService.triggerSelection();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      >
        {steps.map((step, index) => (
          <View key={step.id} style={[styles.stepContainer, { width: screenWidth }]}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>{step.title}</Text>
            <Text style={[styles.description, { color: theme.colors.onBackground }]}>
              {step.description}
            </Text>
            <AnimatedTouchable onPress={handleNext} style={styles.nextButton}>
              <Text style={{ color: theme.colors.onPrimary }}>
                {index === steps.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </AnimatedTouchable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  nextButton: { padding: 16, borderRadius: 12, backgroundColor: '#007AFF' },
});

export default Onboarding;
