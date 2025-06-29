/**
 * 🎨 Modern Card Component
 * Ultra-sophisticated card with micro-interactions, gestures, and adaptive layouts
 * Features: Gesture recognition, morphing animations, contextual actions, smart layouts
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  State as GestureState,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { ModernDesignSystem, Theme } from '../../design-system/ModernDesignSystem';
import { hapticFeedbackService } from '../../services/HapticFeedbackService';
import { observabilityService } from '../../services/ObservabilityService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Advanced Card Configuration
export interface ModernCardProps {
  // Content
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  image?: React.ReactNode;
  badge?: string | number;
  actions?: CardAction[];
  
  // Layout & Appearance
  variant?: 'elevated' | 'outlined' | 'filled' | 'glass';
  size?: 'compact' | 'standard' | 'expanded';
  aspectRatio?: number;
  fullWidth?: boolean;
  
  // Interactive Features
  onPress?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  
  // Advanced Behaviors
  expandable?: boolean;
  dismissible?: boolean;
  pinchToZoom?: boolean;
  morphOnPress?: boolean;
  contextualActions?: boolean;
  
  // Animations
  entranceAnimation?: 'fadeIn' | 'slideUp' | 'scaleIn' | 'flipIn' | 'morphIn';
  exitAnimation?: 'fadeOut' | 'slideDown' | 'scaleOut' | 'flipOut' | 'morphOut';
  hoverEffect?: boolean;
  pressEffect?: 'scale' | 'glow' | 'lift' | 'ripple';
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityActions?: Array<{
    name: string;
    label: string;
    onActivate: () => void;
  }>;
  
  // Theme & Styling
  theme?: Theme;
  style?: any;
  contentStyle?: any;
  
  // Performance
  lazyLoad?: boolean;
  virtualized?: boolean;
  memoized?: boolean;
}

interface CardAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

// Card Gesture Manager
class CardGestureManager {
  private panX = new Animated.Value(0);
  private panY = new Animated.Value(0);
  private scale = new Animated.Value(1);
  private rotation = new Animated.Value(0);
  private opacity = new Animated.Value(1);
  
  constructor(private onGesture?: (gesture: string, data: any) => void) {}
  
  handlePanGesture = (event: any) => {
    const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
    
    // Update pan values
    this.panX.setValue(translationX);
    this.panY.setValue(translationY);
    
    // Calculate swipe direction and intensity
    const swipeThreshold = 100;
    const velocityThreshold = 500;
    
    if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > velocityThreshold) {
      const direction = translationX > 0 ? 'right' : 'left';
      this.onGesture?.('swipe', { direction, distance: Math.abs(translationX), velocity: velocityX });
    }
    
    if (Math.abs(translationY) > swipeThreshold || Math.abs(velocityY) > velocityThreshold) {
      const direction = translationY > 0 ? 'down' : 'up';
      this.onGesture?.('swipe', { direction, distance: Math.abs(translationY), velocity: velocityY });
    }
  };
  
  handlePanEnd = () => {
    // Spring back to original position
    Animated.parallel([
      Animated.spring(this.panX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      Animated.spring(this.panY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
    ]).start();
  };
  
  handlePinchGesture = (event: any) => {
    const { scale } = event.nativeEvent;
    this.scale.setValue(scale);
    
    if (scale > 1.5) {
      this.onGesture?.('pinch', { scale, type: 'zoom-in' });
    } else if (scale < 0.8) {
      this.onGesture?.('pinch', { scale, type: 'zoom-out' });
    }
  };
  
  handleRotationGesture = (event: any) => {
    const { rotation } = event.nativeEvent;
    this.rotation.setValue(rotation);
    this.onGesture?.('rotate', { rotation });
  };
  
  animatePress = (pressed: boolean) => {
    Animated.parallel([
      Animated.spring(this.scale, {
        toValue: pressed ? 0.95 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(this.opacity, {
        toValue: pressed ? 0.8 : 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  animateEntrance = (type: NonNullable<ModernCardProps['entranceAnimation']>) => {
    const animations: Record<string, Animated.CompositeAnimation> = {
      fadeIn: Animated.timing(this.opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      slideUp: Animated.spring(this.panY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
      scaleIn: Animated.spring(this.scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 8,
      }),
      flipIn: Animated.sequence([
        Animated.timing(this.rotation, {
          toValue: Math.PI,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(this.rotation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      morphIn: Animated.parallel([
        Animated.spring(this.scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 8,
        }),
        Animated.timing(this.opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    };
    
    return animations[type] || animations.fadeIn;
  };
  
  getTransformStyle = () => ({
    transform: [
      { translateX: this.panX },
      { translateY: this.panY },
      { scale: this.scale },
      { rotateZ: this.rotation.interpolate({
        inputRange: [0, Math.PI * 2],
        outputRange: ['0deg', '360deg'],
      }) },
    ],
    opacity: this.opacity,
  });
  
  reset = () => {
    this.panX.setValue(0);
    this.panY.setValue(0);
    this.scale.setValue(1);
    this.rotation.setValue(0);
    this.opacity.setValue(1);
  };
}

// Smart Layout Calculator
class SmartLayoutCalculator {
  static calculateOptimalLayout(
    cardCount: number,
    containerWidth: number,
    cardAspectRatio: number,
    spacing: number
  ): {
    columns: number;
    cardWidth: number;
    cardHeight: number;
    layout: 'grid' | 'masonry' | 'carousel' | 'stack';
  } {
    // Intelligent layout decision based on content and device
    if (cardCount === 1) {
      return {
        columns: 1,
        cardWidth: containerWidth - spacing * 2,
        cardHeight: (containerWidth - spacing * 2) / cardAspectRatio,
        layout: 'stack',
      };
    }
    
    if (cardCount <= 4 && containerWidth > 600) {
      // Tablet layout
      const columns = 2;
      const cardWidth = (containerWidth - spacing * 3) / columns;
      return {
        columns,
        cardWidth,
        cardHeight: cardWidth / cardAspectRatio,
        layout: 'grid',
      };
    }
    
    if (cardCount > 10) {
      // Many cards - use carousel
      const cardWidth = containerWidth * 0.8;
      return {
        columns: 1,
        cardWidth,
        cardHeight: cardWidth / cardAspectRatio,
        layout: 'carousel',
      };
    }
    
    // Default mobile layout
    const columns = containerWidth > 400 ? 2 : 1;
    const cardWidth = (containerWidth - spacing * (columns + 1)) / columns;
    
    return {
      columns,
      cardWidth,
      cardHeight: cardWidth / cardAspectRatio,
      layout: 'masonry',
    };
  }
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  title,
  subtitle,
  image,
  badge,
  actions = [],
  variant = 'elevated',
  size = 'standard',
  aspectRatio = 16 / 9,
  fullWidth = false,
  onPress,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  expandable = false,
  dismissible = false,
  pinchToZoom = false,
  morphOnPress = false,
  contextualActions = false,
  entranceAnimation = 'fadeIn',
  exitAnimation = 'fadeOut',
  hoverEffect = true,
  pressEffect = 'scale',
  accessibilityLabel,
  accessibilityHint,
  accessibilityActions = [],
  theme = ModernDesignSystem.LightTheme,
  style,
  contentStyle,
  lazyLoad = false,
  virtualized = false,
  memoized = true,
}) => {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cardDimensions, setCardDimensions] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  
  // Gesture management
  const gestureManager = useRef(
    new CardGestureManager((gesture, data) => {
      handleGestureAction(gesture, data);
    })
  ).current;
  
  // Animation refs
  const glowAnim = useRef(new Animated.Value(0)).current;
  const elevationAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  
  // Initialize entrance animation
  useEffect(() => {
    if (isVisible) {
      gestureManager.animateEntrance(entranceAnimation).start();
    }
  }, [isVisible, entranceAnimation]);
  
  // Setup glow effect
  useEffect(() => {
    if (hoverEffect && isHovered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isHovered, hoverEffect, glowAnim]);
  
  // Handle gesture actions
  const handleGestureAction = useCallback((gesture: string, data: any) => {
    hapticFeedbackService.impact('light');
    
    if (gesture === 'swipe') {
      switch (data.direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }
    
    // Track interaction
    observabilityService.trackUserAction('card_gesture', 'current', {
      gesture,
      data,
      cardVariant: variant,
      cardSize: size,
    });
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, variant, size]);
  
  // Handle press events
  const handlePress = useCallback(() => {
    if (expandable) {
      setIsExpanded(!isExpanded);
      hapticFeedbackService.impact('medium');
    }
    
    if (morphOnPress) {
      // Trigger morph animation
      Animated.sequence([
        Animated.timing(gestureManager.scale, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(gestureManager.scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    onPress?.();
  }, [expandable, isExpanded, morphOnPress, onPress]);
  
  const handleLongPress = useCallback(() => {
    hapticFeedbackService.impact('heavy');
    
    if (contextualActions && actions.length > 0) {
      // Show contextual action menu
      setIsExpanded(true);
    }
    
    onLongPress?.();
  }, [contextualActions, actions.length, onLongPress]);
  
  // Layout calculation
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCardDimensions({ width, height });
  }, []);
  
  // Style calculations
  const getVariantStyles = () => {
    const baseStyles = {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
    };
    
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          ...theme.shadows.md,
          borderWidth: 0,
        };
      case 'outlined':
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: 'transparent',
        };
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.backgroundSecondary,
          borderWidth: 0,
        };
      case 'glass':
        return {
          ...baseStyles,
          backgroundColor: theme.isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          borderWidth: 1,
          borderColor: theme.isDark 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.1)',
        };
      default:
        return baseStyles;
    }
  };
  
  const getSizeStyles = () => {
    const padding = theme.spacing[4];
    const baseStyles = { padding };
    
    switch (size) {
      case 'compact':
        return {
          ...baseStyles,
          padding: theme.spacing[2],
          minHeight: 80,
        };
      case 'expanded':
        return {
          ...baseStyles,
          padding: theme.spacing[6],
          minHeight: 200,
        };
      default:
        return {
          ...baseStyles,
          minHeight: 120,
        };
    }
  };
  
  // Render badge
  const renderBadge = () => {
    if (!badge) return null;
    
    return (
      <View style={[
        styles.badge,
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.borderRadius.full,
        }
      ]}>
        <Text style={[
          styles.badgeText,
          {
            color: theme.colors.textInverse,
            fontSize: theme.typography.fontSize.xs,
          }
        ]}>
          {badge}
        </Text>
      </View>
    );
  };
  
  // Render actions
  const renderActions = () => {
    if (!contextualActions || actions.length === 0) return null;
    
    return (
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderRadius: theme.borderRadius.base,
              }
            ]}
            onPress={action.onPress}
            disabled={action.disabled}
          >
            {action.icon}
            <Text style={[
              styles.actionLabel,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
              }
            ]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  // Render content
  const renderContent = () => (
    <View style={[getSizeStyles(), contentStyle]}>
      {image && <View style={styles.imageContainer}>{image}</View>}
      
      {title && (
        <Text style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.lg,
            fontFamily: theme.typography.fontFamily.primary,
            fontWeight: theme.typography.fontWeight.semibold,
          }
        ]}>
          {title}
        </Text>
      )}
      
      {subtitle && (
        <Text style={[
          styles.subtitle,
          {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            fontFamily: theme.typography.fontFamily.secondary,
          }
        ]}>
          {subtitle}
        </Text>
      )}
      
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
      
      {isExpanded && renderActions()}
    </View>
  );
  
  // Main render
  const cardStyle = [
    getVariantStyles(),
    {
      width: fullWidth ? '100%' : cardDimensions.width || SCREEN_WIDTH * 0.9,
      aspectRatio: aspectRatio,
    },
    isHovered && hoverEffect && {
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glowAnim,
      shadowRadius: 10,
      elevation: 8,
    },
    style,
  ];
  
  if (!isVisible && lazyLoad) {
    return (
      <View style={[cardStyle, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  const CardComponent = (
    <Animated.View
      style={[
        cardStyle,
        gestureManager.getTransformStyle(),
      ]}
      onLayout={handleLayout}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityActions={accessibilityActions}
    >
      {renderBadge()}
      {renderContent()}
      
      {/* Ripple effect overlay */}
      {pressEffect === 'ripple' && isPressed && (
        <Animated.View style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: theme.borderRadius.lg,
            transform: [{
              scale: rippleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 2],
              }),
            }],
            opacity: rippleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }
        ]} />
      )}
    </Animated.View>
  );
  
  // Wrap with gesture handlers
  return (
    <LongPressGestureHandler
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === GestureState.ACTIVE) {
          handleLongPress();
        }
      }}
      minDurationMs={500}
    >
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === GestureState.ACTIVE) {
            setIsPressed(true);
            gestureManager.animatePress(true);
          } else if (nativeEvent.state === GestureState.END) {
            setIsPressed(false);
            gestureManager.animatePress(false);
            handlePress();
          }
        }}
      >
        <PanGestureHandler
          onGestureEvent={gestureManager.handlePanGesture}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === GestureState.END) {
              gestureManager.handlePanEnd();
            }
          }}
        >
          {CardComponent}
        </PanGestureHandler>
      </TapGestureHandler>
    </LongPressGestureHandler>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeText: {
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  title: {
    marginBottom: 4,
    fontWeight: '600',
  },
  subtitle: {
    marginBottom: 12,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  actionLabel: {
    fontWeight: '500',
  },
});

export default React.memo(ModernCard);