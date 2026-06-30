// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth } = Dimensions.get('window');

interface DisclosureSection {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProgressiveDisclosureProps {
  sections: DisclosureSection[];
  mode?: 'accordion' | 'tabs' | 'wizard' | 'cards';
  testID?: string;
}

/**
 * Progressive Disclosure Component
 * Progressively reveals information to manage complexity and cognitive load
 */
export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  sections,
  mode = 'accordion',
  testID,
}) => {
  const { theme } = useTheme();
  const [expandedSections, setExpandedSections] = useState(new Set<string>());

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSections(next);
    HapticFeedbackService.triggerSelection();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  return (
    <View style={styles.container} testID={testID}>
      {sections.map(section => (
        <View key={section.id} style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <AnimatedTouchable onPress={() => toggleSection(section.id)} style={styles.header}>
            <Text style={{ color: theme.colors.onSurface }}>{section.title}</Text>
          </AnimatedTouchable>
          {expandedSections.has(section.id) && (
            <View style={styles.content}>{section.content}</View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  header: { padding: 16 },
  content: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
});

export default ProgressiveDisclosure;
