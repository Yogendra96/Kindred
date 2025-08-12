import { Animated, Dimensions, Easing } from 'react-native';

import HapticFeedbackService from './HapticFeedbackService';
import { PerformanceMonitoringService } from './PerformanceMonitoringService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Types for Animated Transitions
export interface TransitionConfig {
  duration?: number;
  delay?: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
  hapticFeedback?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface SpringConfig {
  tension?: number;
  friction?: number;
  speed?: number;
  bounciness?: number;
  useNativeDriver?: boolean;
  hapticFeedback?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}

export interface SlideTransition {
  direction: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  config?: TransitionConfig;
}

export interface FadeTransition {
  from?: number;
  to?: number;
  config?: TransitionConfig;
}

export interface ScaleTransition {
  from?: number;
  to?: number;
  config?: TransitionConfig;
}

export interface RotateTransition {
  from?: string;
  to?: string;
  config?: TransitionConfig;
}

export interface SequenceTransition {
  animations: Animated.CompositeAnimation[];
  config?: {
    hapticFeedback?: boolean;
    onStart?: () => void;
    onComplete?: () => void;
  };
}

export interface ParallelTransition {
  animations: Animated.CompositeAnimation[];
  config?: {
    stopTogether?: boolean;
    hapticFeedback?: boolean;
    onStart?: () => void;
    onComplete?: () => void;
  };
}

export interface StaggerTransition {
  animations: Animated.CompositeAnimation[];
  staggerDelay: number;
  config?: {
    hapticFeedback?: boolean;
    onStart?: () => void;
    onComplete?: () => void;
  };
}

export interface LoopTransition {
  animation: Animated.CompositeAnimation;
  iterations?: number; // -1 for infinite
  resetBeforeIteration?: boolean;
  config?: {
    hapticFeedback?: boolean;
    onStart?: () => void;
    onComplete?: () => void;
  };
}

export interface InterpolationConfig {
  inputRange: number[];
  outputRange: (number | string)[];
  extrapolate?: 'extend' | 'identity' | 'clamp';
  extrapolateLeft?: 'extend' | 'identity' | 'clamp';
  extrapolateRight?: 'extend' | 'identity' | 'clamp';
}

export interface GestureTransition {
  panX?: Animated.Value;
  panY?: Animated.Value;
  scale?: Animated.Value;
  rotation?: Animated.Value;
  config?: {
    snapPoints?: number[];
    snapThreshold?: number;
    hapticFeedback?: boolean;
    onSnap?: (snapPoint: number) => void;
  };
}

export interface TransitionPreset {
  name: string;
  animation: () => Animated.CompositeAnimation;
  config: TransitionConfig;
}

class AnimatedTransitionsService {
  private performanceMonitor: PerformanceMonitoringService;
  private hapticService: typeof HapticFeedbackService;
  private activeAnimations: Map<string, Animated.CompositeAnimation> =
    new Map();
  private animationCounter: number = 0;

  // Common easing functions
  public readonly easings = {
    linear: Easing.linear,
    ease: Easing.ease,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
    easeInQuad: Easing.in(Easing.quad),
    easeOutQuad: Easing.out(Easing.quad),
    easeInOutQuad: Easing.inOut(Easing.quad),
    easeInCubic: Easing.in(Easing.cubic),
    easeOutCubic: Easing.out(Easing.cubic),
    easeInOutCubic: Easing.inOut(Easing.cubic),
    easeInBack: Easing.in(Easing.back(1.7)),
    easeOutBack: Easing.out(Easing.back(1.7)),
    easeInOutBack: Easing.inOut(Easing.back(1.7)),
    easeInElastic: Easing.elastic(1),
    easeOutElastic: Easing.out(Easing.elastic(1)),
    easeInBounce: Easing.bounce,
    easeOutBounce: Easing.out(Easing.bounce),
    bezier: (x1: number, y1: number, x2: number, y2: number) =>
      Easing.bezier(x1, y1, x2, y2),
  };

  // Predefined transition presets
  public readonly presets: Record<string, TransitionPreset> = {
    fadeIn: {
      name: 'fadeIn',
      animation: () => this.createFadeAnimation({ from: 0, to: 1 }),
      config: { duration: 300, easing: this.easings.easeOut },
    },
    fadeOut: {
      name: 'fadeOut',
      animation: () => this.createFadeAnimation({ from: 1, to: 0 }),
      config: { duration: 300, easing: this.easings.easeIn },
    },
    slideInLeft: {
      name: 'slideInLeft',
      animation: () => this.createSlideAnimation({ direction: 'left' }),
      config: { duration: 400, easing: this.easings.easeOutBack },
    },
    slideInRight: {
      name: 'slideInRight',
      animation: () => this.createSlideAnimation({ direction: 'right' }),
      config: { duration: 400, easing: this.easings.easeOutBack },
    },
    slideInUp: {
      name: 'slideInUp',
      animation: () => this.createSlideAnimation({ direction: 'up' }),
      config: { duration: 400, easing: this.easings.easeOutBack },
    },
    slideInDown: {
      name: 'slideInDown',
      animation: () => this.createSlideAnimation({ direction: 'down' }),
      config: { duration: 400, easing: this.easings.easeOutBack },
    },
    scaleIn: {
      name: 'scaleIn',
      animation: () => this.createScaleAnimation({ from: 0, to: 1 }),
      config: { duration: 300, easing: this.easings.easeOutBack },
    },
    scaleOut: {
      name: 'scaleOut',
      animation: () => this.createScaleAnimation({ from: 1, to: 0 }),
      config: { duration: 300, easing: this.easings.easeInBack },
    },
    bounce: {
      name: 'bounce',
      animation: () => this.createBounceAnimation(),
      config: { duration: 600, easing: this.easings.easeOutBounce },
    },
    pulse: {
      name: 'pulse',
      animation: () => this.createPulseAnimation(),
      config: { duration: 1000, easing: this.easings.easeInOut },
    },
    shake: {
      name: 'shake',
      animation: () => this.createShakeAnimation(),
      config: { duration: 500, easing: this.easings.linear },
    },
    flip: {
      name: 'flip',
      animation: () => this.createFlipAnimation(),
      config: { duration: 600, easing: this.easings.easeInOut },
    },
    rubberBand: {
      name: 'rubberBand',
      animation: () => this.createRubberBandAnimation(),
      config: { duration: 1000, easing: this.easings.easeOut },
    },
    wobble: {
      name: 'wobble',
      animation: () => this.createWobbleAnimation(),
      config: { duration: 1000, easing: this.easings.easeInOut },
    },
    jello: {
      name: 'jello',
      animation: () => this.createJelloAnimation(),
      config: { duration: 1000, easing: this.easings.easeInOut },
    },
    heartbeat: {
      name: 'heartbeat',
      animation: () => this.createHeartbeatAnimation(),
      config: { duration: 1300, easing: this.easings.easeInOut },
    },
  };

  constructor() {
    this.performanceMonitor = new PerformanceMonitoringService();
    this.hapticService = HapticFeedbackService;
  }

  // Basic animation creators
  createFadeAnimation(transition: FadeTransition): Animated.CompositeAnimation {
    const animatedValue = new Animated.Value(transition.from ?? 0);

    return Animated.timing(animatedValue, {
      toValue: transition.to ?? 1,
      duration: transition.config?.duration ?? 300,
      delay: transition.config?.delay ?? 0,
      easing: transition.config?.easing ?? this.easings.easeOut,
      useNativeDriver: transition.config?.useNativeDriver ?? true,
    });
  }

  createSlideAnimation(
    transition: SlideTransition,
  ): Animated.CompositeAnimation {
    const animatedValue = new Animated.Value(0);
    const distance =
      transition.distance ?? this.getDefaultSlideDistance(transition.direction);

    return Animated.timing(animatedValue, {
      toValue: distance,
      duration: transition.config?.duration ?? 400,
      delay: transition.config?.delay ?? 0,
      easing: transition.config?.easing ?? this.easings.easeOutBack,
      useNativeDriver: transition.config?.useNativeDriver ?? true,
    });
  }

  createScaleAnimation(
    transition: ScaleTransition,
  ): Animated.CompositeAnimation {
    const animatedValue = new Animated.Value(transition.from ?? 0);

    return Animated.timing(animatedValue, {
      toValue: transition.to ?? 1,
      duration: transition.config?.duration ?? 300,
      delay: transition.config?.delay ?? 0,
      easing: transition.config?.easing ?? this.easings.easeOutBack,
      useNativeDriver: transition.config?.useNativeDriver ?? true,
    });
  }

  createRotateAnimation(
    transition: RotateTransition,
  ): Animated.CompositeAnimation {
    const animatedValue = new Animated.Value(0);

    return Animated.timing(animatedValue, {
      toValue: 1,
      duration: transition.config?.duration ?? 500,
      delay: transition.config?.delay ?? 0,
      easing: transition.config?.easing ?? this.easings.easeInOut,
      useNativeDriver: transition.config?.useNativeDriver ?? true,
    });
  }

  createSpringAnimation(
    animatedValue: Animated.Value,
    toValue: number,
    config: SpringConfig = {},
  ): Animated.CompositeAnimation {
    return Animated.spring(animatedValue, {
      toValue,
      tension: config.tension ?? 40,
      friction: config.friction ?? 7,
      speed: config.speed ?? 12,
      bounciness: config.bounciness ?? 8,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Complex animation creators
  createBounceAnimation(): Animated.CompositeAnimation {
    const scaleValue = new Animated.Value(1);

    return Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.3,
        duration: 200,
        easing: this.easings.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 100,
        easing: this.easings.easeIn,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1.1,
        duration: 100,
        easing: this.easings.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        easing: this.easings.easeIn,
        useNativeDriver: true,
      }),
    ]);
  }

  createPulseAnimation(): Animated.CompositeAnimation {
    const scaleValue = new Animated.Value(1);

    return Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 500,
          easing: this.easings.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 500,
          easing: this.easings.easeInOut,
          useNativeDriver: true,
        }),
      ]),
    );
  }

  createShakeAnimation(): Animated.CompositeAnimation {
    const translateX = new Animated.Value(0);

    return Animated.sequence([
      Animated.timing(translateX, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]);
  }

  createFlipAnimation(): Animated.CompositeAnimation {
    const rotateY = new Animated.Value(0);

    return Animated.timing(rotateY, {
      toValue: 1,
      duration: 600,
      easing: this.easings.easeInOut,
      useNativeDriver: true,
    });
  }

  createRubberBandAnimation(): Animated.CompositeAnimation {
    const scaleX = new Animated.Value(1);
    const scaleY = new Animated.Value(1);

    return Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleX, {
          toValue: 1.25,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 0.75,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scaleY, {
          toValue: 0.75,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: 1.25,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleY, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]);
  }

  createWobbleAnimation(): Animated.CompositeAnimation {
    const rotate = new Animated.Value(0);
    const translateX = new Animated.Value(0);

    return Animated.parallel([
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: -5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -25,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]);
  }

  createJelloAnimation(): Animated.CompositeAnimation {
    const skewX = new Animated.Value(0);
    const skewY = new Animated.Value(0);

    return Animated.parallel([
      Animated.sequence([
        Animated.timing(skewX, {
          toValue: -12.5,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewX, {
          toValue: 6.25,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewX, {
          toValue: -3.125,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewX, {
          toValue: 1.5625,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewX, {
          toValue: -0.78125,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewX, {
          toValue: 0,
          duration: 445,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(skewY, {
          toValue: -12.5,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewY, {
          toValue: 6.25,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewY, {
          toValue: -3.125,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewY, {
          toValue: 1.5625,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewY, {
          toValue: -0.78125,
          duration: 111,
          useNativeDriver: true,
        }),
        Animated.timing(skewY, {
          toValue: 0,
          duration: 445,
          useNativeDriver: true,
        }),
      ]),
    ]);
  }

  createHeartbeatAnimation(): Animated.CompositeAnimation {
    const scale = new Animated.Value(1);

    return Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 850,
        useNativeDriver: true,
      }),
    ]);
  }

  // Composite animations
  createSequence(transition: SequenceTransition): Animated.CompositeAnimation {
    return Animated.sequence(transition.animations);
  }

  createParallel(transition: ParallelTransition): Animated.CompositeAnimation {
    return Animated.parallel(transition.animations, {
      stopTogether: transition.config?.stopTogether ?? true,
    });
  }

  createStagger(transition: StaggerTransition): Animated.CompositeAnimation {
    return Animated.stagger(transition.staggerDelay, transition.animations);
  }

  createLoop(transition: LoopTransition): Animated.CompositeAnimation {
    return Animated.loop(transition.animation, {
      iterations: transition.iterations || -1,
      resetBeforeIteration: transition.resetBeforeIteration ?? true,
    });
  }

  // Animation execution
  async runAnimation(
    animation: Animated.CompositeAnimation,
    config: TransitionConfig = {},
  ): Promise<void> {
    const trace = this.performanceMonitor.startTrace('animated-transition');
    const animationId = this.generateAnimationId();

    return new Promise((resolve, reject) => {
      try {
        // Store active animation
        this.activeAnimations.set(animationId, animation);

        // Trigger haptic feedback if enabled
        if (config.hapticFeedback) {
          this.hapticService.triggerButtonPress();
        }

        // Call onStart callback
        config.onStart?.();

        animation.start(finished => {
          // Remove from active animations
          this.activeAnimations.delete(animationId);

          if (finished) {
            // Call onComplete callback
            config.onComplete?.();

            trace.putAttribute('completed', true);
            trace.stop();
            resolve();
          } else {
            trace.putAttribute('completed', false);
            trace.stop();
            reject(new Error('Animation was interrupted'));
          }
        });
      } catch (error) {
        this.activeAnimations.delete(animationId);
        trace.stop();
        reject(error);
      }
    });
  }

  async runPreset(
    presetName: string,
    animatedValue: Animated.Value,
    config?: TransitionConfig,
  ): Promise<void> {
    const preset = this.presets[presetName];
    if (!preset) {
      throw new Error(`Animation preset '${presetName}' not found`);
    }

    const animation = preset.animation();
    const finalConfig = { ...preset.config, ...config };

    return this.runAnimation(animation, finalConfig);
  }

  // Animation control
  stopAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);
    if (animation) {
      animation.stop();
      this.activeAnimations.delete(animationId);
    }
  }

  stopAllAnimations(): void {
    for (const [_id, animation] of this.activeAnimations.entries()) {
      animation.stop();
    }
    this.activeAnimations.clear();
  }

  pauseAnimation(_animationId: string): void {
    // React Native doesn't have built-in pause/resume
    // This would need to be implemented with custom logic
    console.warn('Animation pause not implemented');
  }

  resumeAnimation(_animationId: string): void {
    // React Native doesn't have built-in pause/resume
    // This would need to be implemented with custom logic
    console.warn('Animation resume not implemented');
  }

  // Interpolation helpers
  createInterpolation(
    animatedValue: Animated.Value,
    config: InterpolationConfig,
  ): Animated.AnimatedInterpolation {
    return animatedValue.interpolate({
      inputRange: config.inputRange,
      outputRange: config.outputRange,
      extrapolate: config.extrapolate || 'clamp',
      extrapolateLeft: config.extrapolateLeft,
      extrapolateRight: config.extrapolateRight,
    });
  }

  // Gesture-based animations
  createGestureAnimation(config: GestureTransition): {
    panX: Animated.Value;
    panY: Animated.Value;
    scale: Animated.Value;
    rotation: Animated.Value;
  } {
    return {
      panX: config.panX || new Animated.Value(0),
      panY: config.panY || new Animated.Value(0),
      scale: config.scale || new Animated.Value(1),
      rotation: config.rotation || new Animated.Value(0),
    };
  }

  // Page transition animations
  createPageTransition(
    type: 'slide' | 'fade' | 'scale' | 'flip',
    direction?: 'left' | 'right' | 'up' | 'down',
  ): {
    screenInterpolator: (props: any) => any;
    transitionSpec: any;
  } {
    const transitionSpec = {
      duration: 400,
      easing: this.easings.easeOutCubic,
      timing: Animated.timing,
    };

    const screenInterpolator = ({ layout, position, scene }: any) => {
      const { index } = scene;
      const { initWidth, initHeight } = layout;

      const translateX = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange:
          type === 'slide' && direction === 'left'
            ? [initWidth, 0, -initWidth]
            : [0, 0, 0],
      });

      const translateY = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange:
          type === 'slide' && direction === 'up'
            ? [initHeight, 0, -initHeight]
            : [0, 0, 0],
      });

      const opacity = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: type === 'fade' ? [0, 1, 0] : [1, 1, 1],
      });

      const scale = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: type === 'scale' ? [0.8, 1, 0.8] : [1, 1, 1],
      });

      return {
        transform: [{ translateX }, { translateY }, { scale }],
        opacity,
      };
    };

    return { screenInterpolator, transitionSpec };
  }

  // Utility methods
  private getDefaultSlideDistance(
    direction: 'left' | 'right' | 'up' | 'down',
  ): number {
    switch (direction) {
      case 'left':
      case 'right':
        return screenWidth;
      case 'up':
      case 'down':
        return screenHeight;
      default:
        return 100;
    }
  }

  private generateAnimationId(): string {
    return `animation_${++this.animationCounter}_${Date.now()}`;
  }

  // Performance optimization
  enableNativeDriver(enable: boolean = true): void {
    // Update all presets to use native driver
    for (const preset of Object.values(this.presets)) {
      preset.config.useNativeDriver = enable;
    }
  }

  // Animation analytics
  getActiveAnimationsCount(): number {
    return this.activeAnimations.size;
  }

  getAnimationPerformanceMetrics(): {
    activeAnimations: number;
    totalAnimationsRun: number;
    averageAnimationDuration: number;
  } {
    return {
      activeAnimations: this.activeAnimations.size,
      totalAnimationsRun: this.animationCounter,
      averageAnimationDuration: 400, // This would be calculated from actual metrics
    };
  }

  // Custom animation builders
  buildCustomAnimation(): {
    addTiming: (value: Animated.Value, config: any) => any;
    addSpring: (value: Animated.Value, config: any) => any;
    addDelay: (duration: number) => any;
    sequence: () => Animated.CompositeAnimation;
    parallel: () => Animated.CompositeAnimation;
  } {
    const animations: Animated.CompositeAnimation[] = [];

    return {
      addTiming: (value: Animated.Value, config: any) => {
        animations.push(Animated.timing(value, config));
        return this;
      },
      addSpring: (value: Animated.Value, config: any) => {
        animations.push(Animated.spring(value, config));
        return this;
      },
      addDelay: (duration: number) => {
        animations.push(Animated.delay(duration));
        return this;
      },
      sequence: () => Animated.sequence(animations),
      parallel: () => Animated.parallel(animations),
    };
  }

  // Accessibility support
  setReducedMotion(enabled: boolean): void {
    if (enabled) {
      // Reduce animation durations and disable complex animations
      for (const preset of Object.values(this.presets)) {
        preset.config.duration = Math.min(preset.config.duration || 300, 150);
      }
    }
  }

  // Debug helpers
  logAnimationState(): void {
    console.log('Active Animations:', this.activeAnimations.size);
    console.log('Total Animations Run:', this.animationCounter);
    console.log('Available Presets:', Object.keys(this.presets));
  }
}

export default new AnimatedTransitionsService();
