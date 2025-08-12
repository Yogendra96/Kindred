import { Platform } from 'react-native';

import * as Haptics from 'expo-haptics';

import { PerformanceMonitoringService } from './PerformanceMonitoringService';

// Types for Haptic Feedback
export interface HapticPattern {
  type: 'impact' | 'notification' | 'selection' | 'custom';
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number;
  delay?: number;
  repeat?: number;
}

export interface CustomHapticPattern {
  vibrations: {
    duration: number;
    intensity: number;
  }[];
  pauses: number[];
}

export interface HapticConfig {
  enabled: boolean;
  intensity: 'low' | 'medium' | 'high';
  patterns: {
    success: HapticPattern;
    error: HapticPattern;
    warning: HapticPattern;
    achievement: HapticPattern;
    carbonSaved: HapticPattern;
    goalReached: HapticPattern;
    levelUp: HapticPattern;
    buttonPress: HapticPattern;
    swipe: HapticPattern;
    refresh: HapticPattern;
    notification: HapticPattern;
    heartbeat: HapticPattern;
  };
  contextualPatterns: {
    carbonTracking: {
      lowImpact: HapticPattern;
      mediumImpact: HapticPattern;
      highImpact: HapticPattern;
    };
    social: {
      like: HapticPattern;
      share: HapticPattern;
      comment: HapticPattern;
      friendRequest: HapticPattern;
    };
    challenges: {
      start: HapticPattern;
      progress: HapticPattern;
      complete: HapticPattern;
      fail: HapticPattern;
    };
    navigation: {
      tabSwitch: HapticPattern;
      pageTransition: HapticPattern;
      modalOpen: HapticPattern;
      modalClose: HapticPattern;
    };
  };
}

export interface HapticEvent {
  type: string;
  pattern: HapticPattern;
  timestamp: Date;
  context?: Record<string, any>;
  success: boolean;
  duration?: number;
}

export interface HapticAnalytics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  averageResponseTime: number;
  successRate: number;
  userPreferences: {
    mostUsedPatterns: string[];
    preferredIntensity: string;
    disabledPatterns: string[];
  };
  performanceMetrics: {
    averageLatency: number;
    errorRate: number;
    batteryImpact: number;
  };
}

class HapticFeedbackService {
  private performanceMonitor: PerformanceMonitoringService;
  private config: HapticConfig;
  private isEnabled: boolean = true;
  private eventHistory: HapticEvent[] = [];
  private analytics: HapticAnalytics;
  private lastHapticTime: number = 0;
  private hapticQueue: Array<{ pattern: HapticPattern; context?: any }> = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.performanceMonitor = new PerformanceMonitoringService();
    this.config = this.getDefaultConfig();
    this.analytics = this.initializeAnalytics();

    // Initialize haptic capabilities
    this.initializeHaptics();

    // Start queue processing
    this.startQueueProcessing();

    // Clean up old events periodically
    setInterval(
      () => {
        this.cleanupEventHistory();
      },
      60 * 60 * 1000,
    ); // Every hour
  }

  private async initializeHaptics(): Promise<void> {
    try {
      // Check if haptics are supported
      if (Platform.OS === 'ios') {
        // iOS haptics are generally supported
        console.log('Haptic feedback initialized for iOS');
      } else if (Platform.OS === 'android') {
        // Android haptics support varies
        console.log('Haptic feedback initialized for Android');
      }

      // Load user preferences
      await this.loadUserPreferences();
    } catch (error) {
      console.error('Failed to initialize haptics:', error);
      this.isEnabled = false;
    }
  }

  private getDefaultConfig(): HapticConfig {
    return {
      enabled: true,
      intensity: 'medium',
      patterns: {
        success: {
          type: 'notification',
          intensity: 'medium',
        },
        error: {
          type: 'notification',
          intensity: 'heavy',
        },
        warning: {
          type: 'notification',
          intensity: 'light',
        },
        achievement: {
          type: 'impact',
          intensity: 'heavy',
          repeat: 2,
          delay: 100,
        },
        carbonSaved: {
          type: 'impact',
          intensity: 'medium',
        },
        goalReached: {
          type: 'notification',
          intensity: 'heavy',
          repeat: 3,
          delay: 150,
        },
        levelUp: {
          type: 'impact',
          intensity: 'heavy',
          repeat: 3,
          delay: 200,
        },
        buttonPress: {
          type: 'selection',
          intensity: 'light',
        },
        swipe: {
          type: 'selection',
          intensity: 'light',
        },
        refresh: {
          type: 'impact',
          intensity: 'light',
        },
        notification: {
          type: 'notification',
          intensity: 'medium',
        },
        heartbeat: {
          type: 'impact',
          intensity: 'light',
          repeat: 2,
          delay: 600,
        },
      },
      contextualPatterns: {
        carbonTracking: {
          lowImpact: {
            type: 'impact',
            intensity: 'light',
          },
          mediumImpact: {
            type: 'impact',
            intensity: 'medium',
          },
          highImpact: {
            type: 'impact',
            intensity: 'heavy',
          },
        },
        social: {
          like: {
            type: 'impact',
            intensity: 'light',
          },
          share: {
            type: 'impact',
            intensity: 'medium',
          },
          comment: {
            type: 'selection',
            intensity: 'light',
          },
          friendRequest: {
            type: 'notification',
            intensity: 'medium',
          },
        },
        challenges: {
          start: {
            type: 'impact',
            intensity: 'medium',
          },
          progress: {
            type: 'selection',
            intensity: 'light',
          },
          complete: {
            type: 'notification',
            intensity: 'heavy',
            repeat: 2,
            delay: 100,
          },
          fail: {
            type: 'notification',
            intensity: 'heavy',
          },
        },
        navigation: {
          tabSwitch: {
            type: 'selection',
            intensity: 'light',
          },
          pageTransition: {
            type: 'selection',
            intensity: 'light',
          },
          modalOpen: {
            type: 'impact',
            intensity: 'light',
          },
          modalClose: {
            type: 'impact',
            intensity: 'light',
          },
        },
      },
    };
  }

  private initializeAnalytics(): HapticAnalytics {
    return {
      totalEvents: 0,
      eventsByType: {},
      averageResponseTime: 0,
      successRate: 1.0,
      userPreferences: {
        mostUsedPatterns: [],
        preferredIntensity: 'medium',
        disabledPatterns: [],
      },
      performanceMetrics: {
        averageLatency: 0,
        errorRate: 0,
        batteryImpact: 0,
      },
    };
  }

  // Main haptic feedback methods
  async triggerHaptic(
    patternName: string,
    context?: Record<string, any>,
    options?: {
      force?: boolean;
      priority?: 'low' | 'medium' | 'high';
      delay?: number;
    },
  ): Promise<void> {
    if (!this.isEnabled && !options?.force) {
      return;
    }

    const pattern = this.getPattern(patternName);
    if (!pattern) {
      console.warn(`Haptic pattern '${patternName}' not found`);
      return;
    }

    // Add to queue or execute immediately based on priority
    if (options?.priority === 'high' || options?.force) {
      await this.executeHaptic(pattern, patternName, context);
    } else {
      this.queueHaptic(pattern, patternName, context, options?.delay);
    }
  }

  async triggerSuccess(context?: Record<string, any>): Promise<void> {
    await this.triggerHaptic('success', context, { priority: 'medium' });
  }

  async triggerError(context?: Record<string, any>): Promise<void> {
    await this.triggerHaptic('error', context, { priority: 'high' });
  }

  async triggerWarning(context?: Record<string, any>): Promise<void> {
    await this.triggerHaptic('warning', context, { priority: 'medium' });
  }

  async triggerAchievement(context?: Record<string, any>): Promise<void> {
    await this.triggerHaptic('achievement', context, { priority: 'high' });
  }

  async triggerCarbonSaved(
    impact: 'low' | 'medium' | 'high',
    context?: Record<string, any>,
  ): Promise<void> {
    const patternName = `carbonTracking.${impact}Impact`;
    await this.triggerHaptic(
      patternName,
      { ...context, impact },
      { priority: 'medium' },
    );
  }

  async triggerGoalReached(context?: Record<string, any>): Promise<void> {
    await this.triggerHaptic('goalReached', context, { priority: 'high' });
  }

  async triggerLevelUp(context?: Record<string, any>): Promise<void> {
    await this.triggerHaptic('levelUp', context, { priority: 'high' });
  }

  async triggerButtonPress(): Promise<void> {
    await this.triggerHaptic('buttonPress', undefined, { priority: 'low' });
  }

  async triggerSwipe(): Promise<void> {
    await this.triggerHaptic('swipe', undefined, { priority: 'low' });
  }

  async triggerRefresh(): Promise<void> {
    await this.triggerHaptic('refresh', undefined, { priority: 'low' });
  }

  async triggerNotification(context?: Record<string, any>): Promise<void> {
    await this.triggerHaptic('notification', context, { priority: 'medium' });
  }

  async triggerHeartbeat(): Promise<void> {
    await this.triggerHaptic('heartbeat', undefined, { priority: 'low' });
  }

  // Social haptics
  async triggerLike(): Promise<void> {
    await this.triggerHaptic('social.like', undefined, { priority: 'low' });
  }

  async triggerShare(): Promise<void> {
    await this.triggerHaptic('social.share', undefined, { priority: 'medium' });
  }

  async triggerComment(): Promise<void> {
    await this.triggerHaptic('social.comment', undefined, { priority: 'low' });
  }

  async triggerFriendRequest(): Promise<void> {
    await this.triggerHaptic('social.friendRequest', undefined, {
      priority: 'medium',
    });
  }

  // Challenge haptics
  async triggerChallengeStart(): Promise<void> {
    await this.triggerHaptic('challenges.start', undefined, {
      priority: 'medium',
    });
  }

  async triggerChallengeProgress(): Promise<void> {
    await this.triggerHaptic('challenges.progress', undefined, {
      priority: 'low',
    });
  }

  async triggerChallengeComplete(): Promise<void> {
    await this.triggerHaptic('challenges.complete', undefined, {
      priority: 'high',
    });
  }

  async triggerChallengeFail(): Promise<void> {
    await this.triggerHaptic('challenges.fail', undefined, {
      priority: 'medium',
    });
  }

  // Navigation haptics
  async triggerTabSwitch(): Promise<void> {
    await this.triggerHaptic('navigation.tabSwitch', undefined, {
      priority: 'low',
    });
  }

  async triggerPageTransition(): Promise<void> {
    await this.triggerHaptic('navigation.pageTransition', undefined, {
      priority: 'low',
    });
  }

  async triggerModalOpen(): Promise<void> {
    await this.triggerHaptic('navigation.modalOpen', undefined, {
      priority: 'low',
    });
  }

  async triggerModalClose(): Promise<void> {
    await this.triggerHaptic('navigation.modalClose', undefined, {
      priority: 'low',
    });
  }

  // Custom haptic patterns
  async triggerCustomPattern(
    pattern: CustomHapticPattern,
    context?: Record<string, any>,
  ): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const trace = this.performanceMonitor.startTrace('custom-haptic');
    const startTime = Date.now();
    let success = false;

    try {
      for (let i = 0; i < pattern.vibrations.length; i++) {
        const vibration = pattern.vibrations[i];

        // Execute vibration
        await this.executeNativeHaptic({
          type: 'custom',
          duration: vibration.duration,
          intensity: this.mapIntensityToNative(vibration.intensity),
        });

        // Wait for pause if not the last vibration
        if (i < pattern.vibrations.length - 1 && pattern.pauses[i]) {
          await this.delay(pattern.pauses[i]);
        }
      }

      success = true;
    } catch (error) {
      console.error('Custom haptic pattern failed:', error);
    } finally {
      const duration = Date.now() - startTime;

      this.recordEvent({
        type: 'custom',
        pattern: { type: 'custom' },
        timestamp: new Date(),
        context,
        success,
        duration,
      });

      trace.putAttribute('success', success);
      trace.putAttribute('duration', duration);
      trace.stop();
    }
  }

  // Core execution methods
  private async executeHaptic(
    pattern: HapticPattern,
    patternName: string,
    context?: Record<string, any>,
  ): Promise<void> {
    const trace = this.performanceMonitor.startTrace('haptic-feedback');
    const startTime = Date.now();
    let success = false;

    try {
      // Throttle haptics to prevent overwhelming
      const now = Date.now();
      if (now - this.lastHapticTime < 50) {
        // 50ms minimum between haptics
        return;
      }
      this.lastHapticTime = now;

      // Execute the haptic pattern
      await this.executePattern(pattern);
      success = true;
    } catch (error) {
      console.error('Haptic execution failed:', error);
    } finally {
      const duration = Date.now() - startTime;

      this.recordEvent({
        type: patternName,
        pattern,
        timestamp: new Date(),
        context,
        success,
        duration,
      });

      trace.putAttribute('pattern_name', patternName);
      trace.putAttribute('success', success);
      trace.putAttribute('duration', duration);
      trace.stop();
    }
  }

  private async executePattern(pattern: HapticPattern): Promise<void> {
    const repeat = pattern.repeat ?? 1;
    const delay = pattern.delay ?? 0;

    for (let i = 0; i < repeat; i++) {
      await this.executeNativeHaptic(pattern);

      if (i < repeat - 1 && delay > 0) {
        await this.delay(delay);
      }
    }
  }

  private async executeNativeHaptic(pattern: HapticPattern): Promise<void> {
    try {
      switch (pattern.type) {
        case 'impact':
          const impactStyle = this.mapIntensityToImpactStyle(
            pattern.intensity ?? 'medium',
          );
          await Haptics.impactAsync(impactStyle);
          break;

        case 'notification':
          const notificationStyle = this.mapIntensityToNotificationStyle(
            pattern.intensity ?? 'medium',
          );
          await Haptics.notificationAsync(notificationStyle);
          break;

        case 'selection':
          await Haptics.selectionAsync();
          break;

        case 'custom':
          // For custom patterns, use impact as fallback
          const customStyle = this.mapIntensityToImpactStyle(
            pattern.intensity ?? 'medium',
          );
          await Haptics.impactAsync(customStyle);
          break;

        default:
          console.warn(`Unknown haptic type: ${pattern.type}`);
      }
    } catch (error) {
      console.error('Native haptic execution failed:', error);
      throw error;
    }
  }

  private mapIntensityToImpactStyle(
    intensity: string,
  ): Haptics.ImpactFeedbackStyle {
    switch (intensity) {
      case 'light':
        return Haptics.ImpactFeedbackStyle.Light;
      case 'medium':
        return Haptics.ImpactFeedbackStyle.Medium;
      case 'heavy':
        return Haptics.ImpactFeedbackStyle.Heavy;
      default:
        return Haptics.ImpactFeedbackStyle.Medium;
    }
  }

  private mapIntensityToNotificationStyle(
    intensity: string,
  ): Haptics.NotificationFeedbackType {
    switch (intensity) {
      case 'light':
        return Haptics.NotificationFeedbackType.Success;
      case 'medium':
        return Haptics.NotificationFeedbackType.Warning;
      case 'heavy':
        return Haptics.NotificationFeedbackType.Error;
      default:
        return Haptics.NotificationFeedbackType.Success;
    }
  }

  private mapIntensityToNative(
    intensity: number,
  ): 'light' | 'medium' | 'heavy' {
    if (intensity < 0.3) return 'light';
    if (intensity < 0.7) return 'medium';
    return 'heavy';
  }

  // Queue management
  private queueHaptic(
    pattern: HapticPattern,
    patternName: string,
    context?: Record<string, any>,
    delay?: number,
  ): void {
    this.hapticQueue.push({
      pattern: {
        ...pattern,
        delay: delay ?? pattern.delay,
      },
      context: { ...context, patternName },
    });
  }

  private startQueueProcessing(): void {
    setInterval(async () => {
      if (this.isProcessingQueue || this.hapticQueue.length === 0) {
        return;
      }

      this.isProcessingQueue = true;

      try {
        const item = this.hapticQueue.shift();
        if (item) {
          const patternName = item.context?.patternName ?? 'queued';
          await this.executeHaptic(item.pattern, patternName, item.context);
        }
      } catch (error) {
        console.error('Queue processing error:', error);
      } finally {
        this.isProcessingQueue = false;
      }
    }, 100); // Process queue every 100ms
  }

  // Pattern management
  private getPattern(patternName: string): HapticPattern | null {
    // Handle nested pattern names (e.g., 'social.like')
    const parts = patternName.split('.');
    let current: any = this.config.patterns;

    for (const part of parts) {
      if (current[part]) {
        current = current[part];
      } else {
        // Try contextual patterns
        current = this.config.contextualPatterns;
        for (const contextPart of parts) {
          if (current[contextPart]) {
            current = current[contextPart];
          } else {
            return null;
          }
        }
        break;
      }
    }

    return current && typeof current === 'object' && current.type
      ? current
      : null;
  }

  // Configuration management
  async updateConfig(newConfig: Partial<HapticConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveUserPreferences();
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    this.config.enabled = enabled;
    await this.saveUserPreferences();
  }

  async setIntensity(intensity: 'low' | 'medium' | 'high'): Promise<void> {
    this.config.intensity = intensity;

    // Adjust all pattern intensities
    const intensityMap = { low: 'light', medium: 'medium', high: 'heavy' };
    const newIntensity = intensityMap[intensity] as
      | 'light'
      | 'medium'
      | 'heavy';

    for (const key of Object.keys(this.config.patterns)) {
      this.config.patterns[key as keyof typeof this.config.patterns].intensity =
        newIntensity;
    }

    await this.saveUserPreferences();
  }

  async disablePattern(patternName: string): Promise<void> {
    this.analytics.userPreferences.disabledPatterns.push(patternName);
    await this.saveUserPreferences();
  }

  async enablePattern(patternName: string): Promise<void> {
    this.analytics.userPreferences.disabledPatterns =
      this.analytics.userPreferences.disabledPatterns.filter(
        p => p !== patternName,
      );
    await this.saveUserPreferences();
  }

  // Analytics and insights
  private recordEvent(event: HapticEvent): void {
    this.eventHistory.push(event);

    // Update analytics
    this.analytics.totalEvents++;
    this.analytics.eventsByType[event.type] =
      (this.analytics.eventsByType[event.type] ?? 0) + 1;

    if (event.duration) {
      this.analytics.averageResponseTime =
        (this.analytics.averageResponseTime * (this.analytics.totalEvents - 1) +
          event.duration) /
        this.analytics.totalEvents;
    }

    this.analytics.successRate =
      (this.analytics.successRate * (this.analytics.totalEvents - 1) +
        (event.success ? 1 : 0)) /
      this.analytics.totalEvents;
  }

  getAnalytics(): HapticAnalytics {
    // Update most used patterns
    const sortedPatterns = Object.entries(this.analytics.eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);

    this.analytics.userPreferences.mostUsedPatterns = sortedPatterns;

    return { ...this.analytics };
  }

  getEventHistory(limit: number = 100): HapticEvent[] {
    return this.eventHistory.slice(-limit);
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private cleanupEventHistory(): void {
    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      // This would load from AsyncStorage or similar
      // For now, using defaults
      console.log('Loaded haptic preferences');
    } catch (error) {
      console.error('Failed to load haptic preferences:', error);
    }
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      // This would save to AsyncStorage or similar
      console.log('Saved haptic preferences');
    } catch (error) {
      console.error('Failed to save haptic preferences:', error);
    }
  }

  // Testing and debugging
  async testAllPatterns(): Promise<void> {
    const patterns = Object.keys(this.config.patterns);

    for (const pattern of patterns) {
      console.log(`Testing pattern: ${pattern}`);
      await this.triggerHaptic(pattern, { test: true }, { force: true });
      await this.delay(1000); // 1 second between tests
    }
  }

  async testPattern(patternName: string): Promise<void> {
    await this.triggerHaptic(patternName, { test: true }, { force: true });
  }

  // Accessibility support
  async setAccessibilityMode(enabled: boolean): Promise<void> {
    if (enabled) {
      // Enhance haptics for accessibility
      this.config.patterns.success.intensity = 'heavy';
      this.config.patterns.error.intensity = 'heavy';
      this.config.patterns.error.repeat = 2;
    } else {
      // Reset to normal patterns
      this.config = this.getDefaultConfig();
    }

    await this.saveUserPreferences();
  }

  // Battery optimization
  async setBatteryOptimization(enabled: boolean): Promise<void> {
    if (enabled) {
      // Reduce haptic intensity and frequency
      for (const key of Object.keys(this.config.patterns)) {
        const pattern =
          this.config.patterns[key as keyof typeof this.config.patterns];
        pattern.intensity = 'light';
        pattern.repeat = Math.min(pattern.repeat ?? 1, 1);
      }
    }

    await this.saveUserPreferences();
  }
}

export default new HapticFeedbackService();
