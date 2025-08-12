import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/ThemeProvider';

import { HapticFeedbackService } from '../services/HapticFeedbackService';

import { AnimatedTouchable } from './MicroInteractions';

// import { LinearGradient } from 'expo-linear-gradient';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: _screenWidth, height: screenHeight } = Dimensions.get('window');

interface DisclosureSection {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  estimatedReadTime?: number;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  dependencies?: string[];
  tags?: string[];
  expanded?: boolean;
  disabled?: boolean;
  badge?: {
    text: string;
    color: string;
  };
}

interface ProgressiveDisclosureProps {
  sections: DisclosureSection[];
  mode?: 'accordion' | 'tabs' | 'wizard' | 'cards';
  allowMultiple?: boolean;
  defaultExpanded?: string[];
  onSectionChange?: (sectionId: string, expanded: boolean) => void;
  onComplete?: () => void;
  enableSearch?: boolean;
  enableFiltering?: boolean;
  enableProgress?: boolean;
  enableBookmarks?: boolean;
  maxHeight?: number;
  testID?: string;
}

interface DisclosureState {
  expandedSections: Set<string>;
  currentStep: number;
  completedSections: Set<string>;
  bookmarkedSections: Set<string>;
  searchQuery: string;
  activeFilters: string[];
  progress: number;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  sections,
  mode = 'accordion',
  allowMultiple = true,
  defaultExpanded = [],
  onSectionChange,
  onComplete,
  enableSearch = false,
  enableFiltering = false,
  enableProgress = false,
  enableBookmarks = false,
  maxHeight,
  testID,
}) => {
  const { theme } = useTheme();
  const [state, setState] = useState<DisclosureState>({
    expandedSections: new Set(defaultExpanded),
    currentStep: 0,
    completedSections: new Set(),
    bookmarkedSections: new Set(),
    searchQuery: '',
    activeFilters: [],
    progress: 0,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Map<string, View>>(new Map());
  const animationValues = useRef<Map<string, Animated.Value>>(new Map());

  useEffect(() => {
    // Initialize animation values for each section
    for (const section of sections) {
      if (!animationValues.current.has(section.id)) {
        animationValues.current.set(
          section.id,
          new Animated.Value(state.expandedSections.has(section.id) ? 1 : 0),
        );
      }
    }
  }, [sections]);

  useEffect(() => {
    updateProgress();
  }, [state.completedSections, sections]);

  const updateProgress = () => {
    if (enableProgress) {
      const progress = (state.completedSections.size / sections.length) * 100;
      setState(prev => ({ ...prev, progress }));
    }
  };

  const filteredSections = useMemo(() => {
    let filtered = sections;

    // Apply search filter
    if (state.searchQuery) {
      filtered = filtered.filter(
        section =>
          section.title
            .toLowerCase()
            .includes(state.searchQuery.toLowerCase()) ||
          section.subtitle
            ?.toLowerCase()
            .includes(state.searchQuery.toLowerCase()) ||
          section.tags?.some(tag =>
            tag.toLowerCase().includes(state.searchQuery.toLowerCase()),
          ),
      );
    }

    // Apply category filters
    if (state.activeFilters.length > 0) {
      filtered = filtered.filter(
        section =>
          state.activeFilters.includes(section.category || '') ||
          state.activeFilters.includes(section.complexity || '') ||
          state.activeFilters.some(filter => section.tags?.includes(filter)),
      );
    }

    return filtered;
  }, [sections, state.searchQuery, state.activeFilters]);

  const toggleSection = useCallback(
    (sectionId: string) => {
      const isExpanded = state.expandedSections.has(sectionId);
      const newExpanded = new Set(state.expandedSections);

      if (isExpanded) {
        newExpanded.delete(sectionId);
      } else {
        if (!allowMultiple && mode === 'accordion') {
          newExpanded.clear();
        }
        newExpanded.add(sectionId);
      }

      setState(prev => ({ ...prev, expandedSections: newExpanded }));

      // Animate the section
      const animValue = animationValues.current.get(sectionId);
      if (animValue) {
        Animated.spring(animValue, {
          toValue: isExpanded ? 0 : 1,
          useNativeDriver: false,
          tension: 300,
          friction: 10,
        }).start();
      }

      // Trigger haptic feedback
      HapticFeedbackService.triggerSelection();

      // Notify parent
      onSectionChange?.(sectionId, !isExpanded);

      // Layout animation for smooth transitions
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    },
    [state.expandedSections, allowMultiple, mode, onSectionChange],
  );

  const markSectionComplete = useCallback(
    (sectionId: string) => {
      const newCompleted = new Set(state.completedSections);
      newCompleted.add(sectionId);
      setState(prev => ({ ...prev, completedSections: newCompleted }));

      HapticFeedbackService.triggerSuccess();

      // Check if all sections are completed
      if (newCompleted.size === sections.length) {
        onComplete?.();
      }
    },
    [state.completedSections, sections.length, onComplete],
  );

  const toggleBookmark = useCallback(
    (sectionId: string) => {
      const newBookmarks = new Set(state.bookmarkedSections);

      if (newBookmarks.has(sectionId)) {
        newBookmarks.delete(sectionId);
      } else {
        newBookmarks.add(sectionId);
      }

      setState(prev => ({ ...prev, bookmarkedSections: newBookmarks }));
      HapticFeedbackService.triggerSelection();
    },
    [state.bookmarkedSections],
  );

  const navigateToStep = useCallback(
    (step: number) => {
      if (mode === 'wizard') {
        setState(prev => ({ ...prev, currentStep: step }));

        // Scroll to the section
        const sectionId = sections[step]?.id;
        if (sectionId) {
          const sectionRef = sectionRefs.current.get(sectionId);
          if (sectionRef && scrollViewRef.current) {
            sectionRef.measureLayout(
              scrollViewRef.current.getInnerViewNode(),
              (x, y) => {
                scrollViewRef.current?.scrollTo({ y, animated: true });
              },
              () => {},
            );
          }
        }
      }
    },
    [mode, sections],
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.primary;
      case 'low':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getComplexityIcon = (complexity?: string) => {
    switch (complexity) {
      case 'beginner':
        return 'star';
      case 'intermediate':
        return 'star-half';
      case 'advanced':
        return 'star-outline';
      default:
        return null;
    }
  };

  const renderSearchBar = () => {
    if (!enableSearch) return null;

    return (
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <Ionicons
          name='search'
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
        <Text
          style={[
            styles.searchPlaceholder,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Search sections...
        </Text>
      </View>
    );
  };

  const renderFilters = () => {
    if (!enableFiltering) return null;

    const categories = [
      ...new Set(sections.map(s => s.category).filter(Boolean)),
    ];
    const complexities = [
      ...new Set(sections.map(s => s.complexity).filter(Boolean)),
    ];
    const allTags = [...new Set(sections.flatMap(s => s.tags || []))];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {[...categories, ...complexities, ...allTags].map(filter => (
          <AnimatedTouchable
            key={filter}
            onPress={() => {
              const newFilters = state.activeFilters.includes(filter)
                ? state.activeFilters.filter(f => f !== filter)
                : [...state.activeFilters, filter];
              setState(prev => ({ ...prev, activeFilters: newFilters }));
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: state.activeFilters.includes(filter)
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
              },
            ]}
            animationType='scale'
            hapticType='selection'
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: state.activeFilters.includes(filter)
                    ? 'white'
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {filter}
            </Text>
          </AnimatedTouchable>
        ))}
      </ScrollView>
    );
  };

  const renderProgressBar = () => {
    if (!enableProgress) return null;

    return (
      <View
        style={[
          styles.progressContainer,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <View style={styles.progressHeader}>
          <Text
            style={[styles.progressTitle, { color: theme.colors.onSurface }]}
          >
            Progress
          </Text>
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {state.completedSections.size} of {sections.length} completed
          </Text>
        </View>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.outline },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${state.progress}%`,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderWizardNavigation = () => {
    if (mode !== 'wizard') return null;

    return (
      <View
        style={[styles.wizardNav, { backgroundColor: theme.colors.surface }]}
      >
        <AnimatedTouchable
          onPress={() => navigateToStep(Math.max(0, state.currentStep - 1))}
          style={[
            styles.wizardButton,
            {
              backgroundColor:
                state.currentStep > 0
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            },
          ]}
          disabled={state.currentStep === 0}
          animationType='scale'
          hapticType='selection'
        >
          <Ionicons name='chevron-back' size={20} color='white' />
          <Text style={styles.wizardButtonText}>Previous</Text>
        </AnimatedTouchable>

        <View style={styles.wizardSteps}>
          {sections.map((_, index) => (
            <AnimatedTouchable
              key={index}
              onPress={() => navigateToStep(index)}
              style={[
                styles.wizardStep,
                {
                  backgroundColor:
                    index === state.currentStep
                      ? theme.colors.primary
                      : state.completedSections.has(sections[index].id)
                        ? theme.colors.secondary
                        : theme.colors.surfaceVariant,
                },
              ]}
              animationType='scale'
              hapticType='selection'
            >
              <Text
                style={[
                  styles.wizardStepText,
                  {
                    color:
                      index === state.currentStep ||
                      state.completedSections.has(sections[index].id)
                        ? 'white'
                        : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {index + 1}
              </Text>
            </AnimatedTouchable>
          ))}
        </View>

        <AnimatedTouchable
          onPress={() =>
            navigateToStep(Math.min(sections.length - 1, state.currentStep + 1))
          }
          style={[
            styles.wizardButton,
            {
              backgroundColor:
                state.currentStep < sections.length - 1
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            },
          ]}
          disabled={state.currentStep === sections.length - 1}
          animationType='scale'
          hapticType='selection'
        >
          <Text style={styles.wizardButtonText}>Next</Text>
          <Ionicons name='chevron-forward' size={20} color='white' />
        </AnimatedTouchable>
      </View>
    );
  };

  const renderSection = (section: DisclosureSection, _index: number) => {
    const isExpanded = state.expandedSections.has(section.id);
    const isCompleted = state.completedSections.has(section.id);
    const isBookmarked = state.bookmarkedSections.has(section.id);
    const animValue =
      animationValues.current.get(section.id) || new Animated.Value(0);

    const _contentHeight = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 200], // Adjust based on content
      extrapolate: 'clamp',
    });

    const iconRotation = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View
        key={section.id}
        ref={ref => {
          if (ref) sectionRefs.current.set(section.id, ref);
        }}
        style={[
          styles.sectionContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isExpanded
              ? theme.colors.primary
              : theme.colors.outline,
            opacity: section.disabled ? 0.5 : 1,
          },
        ]}
      >
        <AnimatedTouchable
          onPress={() => !section.disabled && toggleSection(section.id)}
          style={styles.sectionHeader}
          animationType='scale'
          hapticType='selection'
          disabled={section.disabled}
          accessible
          accessibilityRole='button'
          accessibilityLabel={`${section.title}. ${isExpanded ? 'Expanded' : 'Collapsed'}`}
          accessibilityState={{ expanded: isExpanded }}
        >
          <View style={styles.sectionHeaderLeft}>
            {section.icon && (
              <View
                style={[
                  styles.sectionIcon,
                  { backgroundColor: getPriorityColor(section.priority) },
                ]}
              >
                <Ionicons
                  name={section.icon as string}
                  size={20}
                  color='white'
                />
              </View>
            )}

            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionTitleRow}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {section.title}
                </Text>

                {section.badge && (
                  <View
                    style={[
                      styles.sectionBadge,
                      { backgroundColor: section.badge.color },
                    ]}
                  >
                    <Text style={styles.sectionBadgeText}>
                      {section.badge.text}
                    </Text>
                  </View>
                )}
              </View>

              {section.subtitle && (
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {section.subtitle}
                </Text>
              )}

              <View style={styles.sectionMeta}>
                {section.estimatedReadTime && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name='time'
                      size={12}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {section.estimatedReadTime} min
                    </Text>
                  </View>
                )}

                {section.complexity && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name={getComplexityIcon(section.complexity) as string}
                      size={12}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.metaText,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {section.complexity}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.sectionHeaderRight}>
            {enableBookmarks && (
              <AnimatedTouchable
                onPress={() => toggleBookmark(section.id)}
                style={styles.bookmarkButton}
                animationType='scale'
                hapticType='selection'
                accessible
                accessibilityRole='button'
                accessibilityLabel={
                  isBookmarked ? 'Remove bookmark' : 'Add bookmark'
                }
              >
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={
                    isBookmarked
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              </AnimatedTouchable>
            )}

            {isCompleted && (
              <Ionicons
                name='checkmark-circle'
                size={20}
                color={theme.colors.primary}
              />
            )}

            <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
              <Ionicons
                name='chevron-down'
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Animated.View>
          </View>
        </AnimatedTouchable>

        <Animated.View
          style={[
            styles.sectionContent,
            {
              height: isExpanded ? 'auto' : 0,
              opacity: animValue,
            },
          ]}
        >
          {isExpanded && (
            <View style={styles.sectionContentInner}>
              {section.content}

              <View style={styles.sectionActions}>
                <AnimatedTouchable
                  onPress={() => markSectionComplete(section.id)}
                  style={[
                    styles.completeButton,
                    {
                      backgroundColor: isCompleted
                        ? theme.colors.secondary
                        : theme.colors.primary,
                    },
                  ]}
                  animationType='scale'
                  hapticType='medium'
                  disabled={isCompleted}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : 'checkmark'}
                    size={16}
                    color='white'
                  />
                  <Text style={styles.completeButtonText}>
                    {isCompleted ? 'Completed' : 'Mark Complete'}
                  </Text>
                </AnimatedTouchable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  const containerStyle = {
    maxHeight: maxHeight || screenHeight * 0.8,
  };

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {renderSearchBar()}
      {renderFilters()}
      {renderProgressBar()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredSections.map((section, index) =>
          renderSection(section, index),
        )}
      </ScrollView>

      {renderWizardNavigation()}
    </View>
  );
};

// Expandable Card Component
interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: string;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  subtitle,
  children,
  icon,
  defaultExpanded = false,
  onToggle,
  disabled = false,
  testID,
}) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const animValue = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpanded = () => {
    if (disabled) return;

    const newExpanded = !expanded;
    setExpanded(newExpanded);

    Animated.spring(animValue, {
      toValue: newExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 300,
      friction: 10,
    }).start();

    onToggle?.(newExpanded);
    HapticFeedbackService.triggerSelection();
  };

  const iconRotation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View
      style={[
        styles.expandableCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: expanded ? theme.colors.primary : theme.colors.outline,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      testID={testID}
    >
      <AnimatedTouchable
        onPress={toggleExpanded}
        style={styles.expandableHeader}
        animationType='scale'
        hapticType='selection'
        disabled={disabled}
      >
        <View style={styles.expandableHeaderLeft}>
          {icon && (
            <Ionicons
              name={icon as string}
              size={24}
              color={theme.colors.primary}
            />
          )}
          <View style={styles.expandableTitleContainer}>
            <Text
              style={[
                styles.expandableTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.expandableSubtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
          <Ionicons
            name='chevron-down'
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </Animated.View>
      </AnimatedTouchable>

      <Animated.View
        style={[
          styles.expandableContent,
          {
            height: expanded ? 'auto' : 0,
            opacity: animValue,
          },
        ]}
      >
        {expanded && (
          <View style={styles.expandableContentInner}>{children}</View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  bookmarkButton: {
    padding: 4,
  },
  completeButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  expandableCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
    overflow: 'hidden',
  },
  expandableContent: {
    overflow: 'hidden',
  },
  expandableContentInner: {
    padding: 16,
    paddingTop: 0,
  },
  expandableHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  expandableHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  expandableSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  expandableTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandableTitleContainer: {
    flex: 1,
  },
  filterChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  filtersContainer: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  filtersContent: {
    gap: 8,
    paddingHorizontal: 0,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
  },
  progressBar: {
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
  },
  progressContainer: {
    borderRadius: 12,
    margin: 16,
    padding: 16,
  },
  progressFill: {
    borderRadius: 3,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    gap: 12,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    margin: 16,
    padding: 12,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  sectionActions: {
    alignItems: 'flex-start',
    marginTop: 16,
  },
  sectionBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionContent: {
    overflow: 'hidden',
  },
  sectionContentInner: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  sectionHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sectionIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sectionMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  wizardButton: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  wizardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  wizardNav: {
    alignItems: 'center',
    borderTopColor: '#E0E0E0',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  wizardStep: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  wizardStepText: {
    fontSize: 12,
    fontWeight: '600',
  },
  wizardSteps: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default ProgressiveDisclosure;
