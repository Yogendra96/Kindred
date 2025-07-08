import { PerformanceMonitoringService } from './PerformanceMonitoringService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use Timer type instead of NodeJS.Timeout namespace
type Timer = ReturnType<typeof setInterval>;

// Types for Feature Flags
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  value?: any;
  description?: string;
  rolloutPercentage?: number;
  targetAudience?: TargetAudience;
  schedule?: FeatureSchedule;
  dependencies?: string[];
  metadata?: Record<string, any>;
  lastUpdated: number;
  version: string;
}

export interface TargetAudience {
  userIds?: string[];
  userGroups?: string[];
  platforms?: ('ios' | 'android')[];
  appVersions?: string[];
  countries?: string[];
  languages?: string[];
  deviceTypes?: string[];
  customAttributes?: Record<string, any>;
}

export interface FeatureSchedule {
  startDate?: number;
  endDate?: number;
  timezone?: string;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  hoursOfDay?: number[]; // 0-23
}

export interface UserContext {
  userId?: string;
  userGroup?: string;
  platform: 'ios' | 'android';
  appVersion: string;
  country?: string;
  language?: string;
  deviceType?: string;
  customAttributes?: Record<string, any>;
}

export interface FeatureFlagConfig {
  remoteConfigUrl?: string;
  refreshInterval?: number; // in milliseconds
  fallbackFlags?: Record<string, FeatureFlag>;
  enableLocalOverrides?: boolean;
  enableAnalytics?: boolean;
  cacheTimeout?: number;
}

export interface FeatureFlagEvent {
  type: 'flag_evaluated' | 'flag_updated' | 'flag_error' | 'flag_override';
  flagKey: string;
  value: any;
  userId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface FeatureFlagAnalytics {
  flagKey: string;
  evaluationCount: number;
  uniqueUsers: Set<string>;
  valueDistribution: Map<any, number>;
  lastEvaluated: number;
  averageEvaluationTime: number;
}

export interface RemoteConfigResponse {
  flags: Record<string, FeatureFlag>;
  version: string;
  timestamp: number;
  ttl?: number;
}

class FeatureFlagsService {
  private flags: Map<string, FeatureFlag> = new Map();
  private userContext: UserContext;
  private config: FeatureFlagConfig;
  private performanceMonitor: PerformanceMonitoringService;
  private analytics: Map<string, FeatureFlagAnalytics> = new Map();
  private eventListeners: Map<string, ((event: FeatureFlagEvent) => void)[]> =
    new Map();
  private refreshTimer: Timer | null = null;
  private isInitialized: boolean = false;
  private localOverrides: Map<string, any> = new Map();

  constructor(config: FeatureFlagConfig = {}) {
    this.config = {
      refreshInterval: 300000, // 5 minutes
      enableLocalOverrides: true,
      enableAnalytics: true,
      cacheTimeout: 3600000, // 1 hour
      ...config,
    };

    this.userContext = {
      platform: Platform.OS as 'ios' | 'android',
      appVersion: '1.0.0', // This should come from app config
    };

    this.performanceMonitor = new PerformanceMonitoringService();
  }

  // Initialize the service
  async initialize(userContext?: Partial<UserContext>): Promise<void> {
    try {
      // Update user context
      if (userContext) {
        this.userContext = { ...this.userContext, ...userContext };
      }

      // Load cached flags
      await this.loadCachedFlags();

      // Load local overrides
      if (this.config.enableLocalOverrides) {
        await this.loadLocalOverrides();
      }

      // Load fallback flags
      if (this.config.fallbackFlags) {
        Object.entries(this.config.fallbackFlags).forEach(([key, flag]) => {
          if (!this.flags.has(key)) {
            this.flags.set(key, flag);
          }
        });
      }

      // Fetch remote flags
      await this.fetchRemoteFlags();

      // Start refresh timer
      this.startRefreshTimer();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize FeatureFlagsService:', error);
      throw error;
    }
  }

  // Check if a feature is enabled
  isEnabled(flagKey: string, defaultValue: boolean = false): boolean {
    const startTime = Date.now();

    try {
      const value = this.getValue(flagKey, defaultValue);
      const result = Boolean(value);

      this.recordEvaluation(flagKey, result, Date.now() - startTime);
      this.emitEvent({
        type: 'flag_evaluated',
        flagKey,
        value: result,
        userId: this.userContext.userId,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`Error evaluating flag ${flagKey}:`, error);
      this.emitEvent({
        type: 'flag_error',
        flagKey,
        value: defaultValue,
        userId: this.userContext.userId,
        timestamp: Date.now(),
        metadata: { error: error.message },
      });
      return defaultValue;
    }
  }

  // Get feature flag value
  getValue<T = any>(flagKey: string, defaultValue: T): T {
    const startTime = Date.now();

    try {
      // Check local overrides first
      if (
        this.config.enableLocalOverrides &&
        this.localOverrides.has(flagKey)
      ) {
        const overrideValue = this.localOverrides.get(flagKey);
        this.emitEvent({
          type: 'flag_override',
          flagKey,
          value: overrideValue,
          userId: this.userContext.userId,
          timestamp: Date.now(),
        });
        return overrideValue;
      }

      const flag = this.flags.get(flagKey);

      if (!flag) {
        return defaultValue;
      }

      // Check if flag is enabled
      if (!flag.enabled) {
        return defaultValue;
      }

      // Check schedule
      if (!this.isScheduleActive(flag.schedule)) {
        return defaultValue;
      }

      // Check target audience
      if (!this.isTargetAudience(flag.targetAudience)) {
        return defaultValue;
      }

      // Check rollout percentage
      if (!this.isInRollout(flag.rolloutPercentage, flagKey)) {
        return defaultValue;
      }

      // Check dependencies
      if (!this.areDependenciesMet(flag.dependencies)) {
        return defaultValue;
      }

      const result = flag.value !== undefined ? flag.value : true;
      this.recordEvaluation(flagKey, result, Date.now() - startTime);

      return result;
    } catch (error) {
      console.error(`Error getting value for flag ${flagKey}:`, error);
      return defaultValue;
    }
  }

  // Get all enabled flags
  getEnabledFlags(): Record<string, any> {
    const enabledFlags: Record<string, any> = {};

    this.flags.forEach((flag, key) => {
      if (this.isEnabled(key)) {
        enabledFlags[key] = this.getValue(key, flag.value);
      }
    });

    return enabledFlags;
  }

  // Update user context
  updateUserContext(context: Partial<UserContext>): void {
    this.userContext = { ...this.userContext, ...context };
  }

  // Local overrides for testing
  setLocalOverride(flagKey: string, value: any): void {
    if (!this.config.enableLocalOverrides) {
      console.warn('Local overrides are disabled');
      return;
    }

    this.localOverrides.set(flagKey, value);
    this.saveLocalOverrides();

    this.emitEvent({
      type: 'flag_override',
      flagKey,
      value,
      userId: this.userContext.userId,
      timestamp: Date.now(),
    });
  }

  removeLocalOverride(flagKey: string): void {
    this.localOverrides.delete(flagKey);
    this.saveLocalOverrides();
  }

  clearLocalOverrides(): void {
    this.localOverrides.clear();
    this.saveLocalOverrides();
  }

  getLocalOverrides(): Record<string, any> {
    return Object.fromEntries(this.localOverrides);
  }

  // Remote flag management
  async fetchRemoteFlags(): Promise<void> {
    if (!this.config.remoteConfigUrl) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteConfigUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Kindred-App/${this.userContext.appVersion}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: RemoteConfigResponse = await response.json();

      // Update flags
      Object.entries(data.flags).forEach(([key, flag]) => {
        this.flags.set(key, {
          ...flag,
          lastUpdated: Date.now(),
        });
      });

      // Cache the flags
      await this.cacheFlags();

      console.log(`Fetched ${Object.keys(data.flags).length} feature flags`);
    } catch (error) {
      console.error('Failed to fetch remote flags:', error);
    }
  }

  async refreshFlags(): Promise<void> {
    await this.fetchRemoteFlags();
  }

  // Event system
  addEventListener(
    eventType: FeatureFlagEvent['type'],
    listener: (event: FeatureFlagEvent) => void,
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  removeEventListener(
    eventType: FeatureFlagEvent['type'],
    listener: (event: FeatureFlagEvent) => void,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: FeatureFlagEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in feature flag event listener:', error);
        }
      });
    }
  }

  // Analytics
  getAnalytics(): Record<string, FeatureFlagAnalytics> {
    const result: Record<string, FeatureFlagAnalytics> = {};

    this.analytics.forEach((analytics, key) => {
      result[key] = {
        ...analytics,
        uniqueUsers: new Set(analytics.uniqueUsers), // Clone the Set
      };
    });

    return result;
  }

  private recordEvaluation(
    flagKey: string,
    value: any,
    evaluationTime: number,
  ): void {
    if (!this.config.enableAnalytics) {
      return;
    }

    let analytics = this.analytics.get(flagKey);

    if (!analytics) {
      analytics = {
        flagKey,
        evaluationCount: 0,
        uniqueUsers: new Set(),
        valueDistribution: new Map(),
        lastEvaluated: 0,
        averageEvaluationTime: 0,
      };
      this.analytics.set(flagKey, analytics);
    }

    analytics.evaluationCount++;
    analytics.lastEvaluated = Date.now();

    if (this.userContext.userId) {
      analytics.uniqueUsers.add(this.userContext.userId);
    }

    const currentCount = analytics.valueDistribution.get(value) || 0;
    analytics.valueDistribution.set(value, currentCount + 1);

    // Update average evaluation time
    analytics.averageEvaluationTime =
      (analytics.averageEvaluationTime * (analytics.evaluationCount - 1) +
        evaluationTime) /
      analytics.evaluationCount;
  }

  // Private helper methods
  private isScheduleActive(schedule?: FeatureSchedule): boolean {
    if (!schedule) {
      return true;
    }

    const now = new Date();
    const currentTime = now.getTime();

    // Check date range
    if (schedule.startDate && currentTime < schedule.startDate) {
      return false;
    }

    if (schedule.endDate && currentTime > schedule.endDate) {
      return false;
    }

    // Check day of week
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      const currentDay = now.getDay();
      if (!schedule.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    // Check hour of day
    if (schedule.hoursOfDay && schedule.hoursOfDay.length > 0) {
      const currentHour = now.getHours();
      if (!schedule.hoursOfDay.includes(currentHour)) {
        return false;
      }
    }

    return true;
  }

  private isTargetAudience(targetAudience?: TargetAudience): boolean {
    if (!targetAudience) {
      return true;
    }

    // Check user IDs
    if (targetAudience.userIds && targetAudience.userIds.length > 0) {
      if (
        !this.userContext.userId ||
        !targetAudience.userIds.includes(this.userContext.userId)
      ) {
        return false;
      }
    }

    // Check user groups
    if (targetAudience.userGroups && targetAudience.userGroups.length > 0) {
      if (
        !this.userContext.userGroup ||
        !targetAudience.userGroups.includes(this.userContext.userGroup)
      ) {
        return false;
      }
    }

    // Check platforms
    if (targetAudience.platforms && targetAudience.platforms.length > 0) {
      if (!targetAudience.platforms.includes(this.userContext.platform)) {
        return false;
      }
    }

    // Check app versions
    if (targetAudience.appVersions && targetAudience.appVersions.length > 0) {
      if (!targetAudience.appVersions.includes(this.userContext.appVersion)) {
        return false;
      }
    }

    // Check countries
    if (targetAudience.countries && targetAudience.countries.length > 0) {
      if (
        !this.userContext.country ||
        !targetAudience.countries.includes(this.userContext.country)
      ) {
        return false;
      }
    }

    // Check languages
    if (targetAudience.languages && targetAudience.languages.length > 0) {
      if (
        !this.userContext.language ||
        !targetAudience.languages.includes(this.userContext.language)
      ) {
        return false;
      }
    }

    // Check custom attributes
    if (targetAudience.customAttributes) {
      for (const [key, value] of Object.entries(
        targetAudience.customAttributes,
      )) {
        if (
          !this.userContext.customAttributes ||
          this.userContext.customAttributes[key] !== value
        ) {
          return false;
        }
      }
    }

    return true;
  }

  private isInRollout(rolloutPercentage?: number, flagKey?: string): boolean {
    if (rolloutPercentage === undefined || rolloutPercentage >= 100) {
      return true;
    }

    if (rolloutPercentage <= 0) {
      return false;
    }

    // Use consistent hashing based on user ID and flag key
    const hashInput = `${this.userContext.userId || 'anonymous'}_${flagKey}`;
    const hash = this.simpleHash(hashInput);
    const percentage = (hash % 100) + 1;

    return percentage <= rolloutPercentage;
  }

  private areDependenciesMet(dependencies?: string[]): boolean {
    if (!dependencies || dependencies.length === 0) {
      return true;
    }

    return dependencies.every(dep => this.isEnabled(dep));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Storage methods
  private async loadCachedFlags(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('feature_flags_cache');
      if (cached) {
        const data = JSON.parse(cached);

        // Check if cache is still valid
        if (
          data.timestamp &&
          Date.now() - data.timestamp < (this.config.cacheTimeout || 3600000)
        ) {
          Object.entries(data.flags).forEach(([key, flag]) => {
            this.flags.set(key, flag as FeatureFlag);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load cached flags:', error);
    }
  }

  private async cacheFlags(): Promise<void> {
    try {
      const data = {
        flags: Object.fromEntries(this.flags),
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem('feature_flags_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache flags:', error);
    }
  }

  private async loadLocalOverrides(): Promise<void> {
    try {
      const overrides = await AsyncStorage.getItem('feature_flags_overrides');
      if (overrides) {
        const data = JSON.parse(overrides);
        this.localOverrides = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load local overrides:', error);
    }
  }

  private async saveLocalOverrides(): Promise<void> {
    try {
      const data = Object.fromEntries(this.localOverrides);
      await AsyncStorage.setItem(
        'feature_flags_overrides',
        JSON.stringify(data),
      );
    } catch (error) {
      console.error('Failed to save local overrides:', error);
    }
  }

  private startRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (this.config.refreshInterval && this.config.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.fetchRemoteFlags();
      }, this.config.refreshInterval);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.eventListeners.clear();
    this.analytics.clear();
    this.flags.clear();
    this.localOverrides.clear();
    this.isInitialized = false;
  }

  // Debug helpers
  getAllFlags(): Record<string, FeatureFlag> {
    return Object.fromEntries(this.flags);
  }

  getFlagDetails(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  debugInfo(): {
    isInitialized: boolean;
    flagCount: number;
    overrideCount: number;
    userContext: UserContext;
    config: FeatureFlagConfig;
  } {
    return {
      isInitialized: this.isInitialized,
      flagCount: this.flags.size,
      overrideCount: this.localOverrides.size,
      userContext: this.userContext,
      config: this.config,
    };
  }
}

export default FeatureFlagsService;

// React Hook for feature flags
export function useFeatureFlag(
  flagKey: string,
  defaultValue: boolean = false,
): boolean {
  // This would need to be implemented with React context or state management
  // For now, it's a placeholder
  console.warn(
    'useFeatureFlag hook not implemented - use FeatureFlagsService directly',
  );
  return defaultValue;
}

// React Hook for feature flag values
export function useFeatureFlagValue<T = any>(
  flagKey: string,
  defaultValue: T,
): T {
  // This would need to be implemented with React context or state management
  // For now, it's a placeholder
  console.warn(
    'useFeatureFlagValue hook not implemented - use FeatureFlagsService directly',
  );
  return defaultValue;
}
