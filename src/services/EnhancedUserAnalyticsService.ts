import { Dimensions, Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';

import { PerformanceMonitoringService } from './PerformanceMonitoringService';

// Core analytics types
export interface UserProfile {
  userId: string;
  anonymousId: string;
  email?: string;
  name?: string;
  avatar?: string;
  createdAt: number;
  lastActiveAt: number;
  totalSessions: number;
  totalScreenTime: number;
  preferences: UserPreferences;
  demographics: UserDemographics;
  behavior: UserBehavior;
  engagement: EngagementMetrics;
  carbonFootprint: CarbonFootprintData;
  achievements: Achievement[];
  segments: string[];
  customAttributes: Record<string, unknown>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  units: 'metric' | 'imperial';
  currency: string;
  timezone: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  inApp: boolean;
  categories: {
    achievements: boolean;
    reminders: boolean;
    social: boolean;
    updates: boolean;
    marketing: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface PrivacySettings {
  analytics: boolean;
  crashReporting: boolean;
  personalization: boolean;
  locationTracking: boolean;
  dataSharing: boolean;
  thirdPartyIntegrations: boolean;
}

export interface AccessibilitySettings {
  screenReader: boolean;
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  voiceControl: boolean;
}

export interface UserDemographics {
  age?: number;
  gender?: string;
  location?: {
    country: string;
    region: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  occupation?: string;
  income?: string;
  education?: string;
  householdSize?: number;
  interests: string[];
}

export interface UserBehavior {
  sessionFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  averageSessionDuration: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  mostUsedFeatures: FeatureUsage[];
  navigationPatterns: NavigationPattern[];
  interactionStyle: 'explorer' | 'goal-oriented' | 'social' | 'casual';
  retentionRisk: 'low' | 'medium' | 'high';
  lifetimeValue: number;
  churnProbability: number;
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  totalTime: number;
  lastUsed: number;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

export interface NavigationPattern {
  path: string[];
  frequency: number;
  averageDuration: number;
  conversionRate: number;
}

export interface EngagementMetrics {
  dau: boolean; // Daily Active User
  wau: boolean; // Weekly Active User
  mau: boolean; // Monthly Active User
  sessionCount: number;
  screenViews: number;
  interactions: number;
  timeSpent: number;
  bounceRate: number;
  stickiness: number; // DAU/MAU ratio
  recency: number; // Days since last session
  frequency: number; // Sessions per week
  monetary: number; // Revenue or value generated
}

export interface CarbonFootprintData {
  totalEmissions: number;
  reductions: number;
  offsetsPurchased: number;
  categories: Record<string, number>;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  goals: {
    target: number;
    progress: number;
    deadline: number;
  };
  comparisons: {
    global: number;
    country: number;
    peers: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  unlockedAt: number;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

// Event tracking types
export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  properties: Record<string, unknown>;
  context: EventContext;
}

export interface EventContext {
  app: AppContext;
  device: DeviceContext;
  network: NetworkContext;
  location?: LocationContext;
  user: UserContext;
  screen: ScreenContext;
  campaign?: CampaignContext;
}

export interface AppContext {
  name: string;
  version: string;
  build: string;
  namespace: string;
  installId: string;
  sessionId: string;
}

export interface DeviceContext {
  id: string;
  manufacturer: string;
  model: string;
  name: string;
  type: 'phone' | 'tablet' | 'tv' | 'watch';
  os: {
    name: string;
    version: string;
  };
  screen: {
    width: number;
    height: number;
    density: number;
  };
  locale: string;
  timezone: string;
}

export interface NetworkContext {
  type: string;
  cellular: boolean;
  wifi: boolean;
  bluetooth: boolean;
  carrier?: string;
  speed?: 'slow' | 'medium' | 'fast';
}

export interface LocationContext {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface UserContext {
  id?: string;
  anonymousId: string;
  traits: Record<string, unknown>;
}

export interface ScreenContext {
  name: string;
  path: string;
  title?: string;
  url?: string;
  referrer?: string;
  search?: string;
  width: number;
  height: number;
}

export interface CampaignContext {
  name?: string;
  source?: string;
  medium?: string;
  term?: string;
  content?: string;
  id?: string;
}

// Session tracking
export interface UserSession {
  id: string;
  userId?: string;
  anonymousId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  screenViews: ScreenView[];
  events: AnalyticsEvent[];
  context: EventContext;
  isActive: boolean;
  exitReason?: 'user' | 'timeout' | 'crash' | 'background';
}

export interface ScreenView {
  id: string;
  name: string;
  path: string;
  title?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  interactions: number;
  scrollDepth: number;
  exitRate: number;
  bounced: boolean;
}

// Funnel and conversion tracking
export interface ConversionFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversionRate: number;
  dropoffPoints: DropoffPoint[];
  averageTime: number;
  completions: number;
  abandons: number;
}

export interface FunnelStep {
  id: string;
  name: string;
  event: string;
  order: number;
  users: number;
  conversionRate: number;
  averageTime: number;
}

export interface DropoffPoint {
  step: string;
  dropoffRate: number;
  reasons: string[];
  suggestions: string[];
}

// Cohort analysis
export interface CohortAnalysis {
  cohortType: 'acquisition' | 'behavioral';
  period: 'daily' | 'weekly' | 'monthly';
  cohorts: Cohort[];
  retentionMatrix: number[][];
  averageRetention: number[];
  insights: CohortInsight[];
}

export interface Cohort {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  size: number;
  retention: number[];
  revenue: number[];
  characteristics: Record<string, unknown>;
}

export interface CohortInsight {
  type: 'retention' | 'revenue' | 'behavior';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

// A/B testing integration
export interface ABTestParticipation {
  testId: string;
  variant: string;
  enrolledAt: number;
  converted: boolean;
  conversionEvent?: string;
  conversionValue?: number;
}

// Real-time analytics
export interface RealTimeMetrics {
  activeUsers: number;
  sessionsToday: number;
  topScreens: { screen: string; views: number }[];
  topEvents: { event: string; count: number }[];
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  crashRate: number;
  errorRate: number;
  performanceScore: number;
}

class EnhancedUserAnalyticsService {
  private performanceMonitor: PerformanceMonitoringService;
  private currentSession: UserSession | null = null;
  private currentUser: UserProfile | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isInitialized: boolean = false;
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes
  private batchSize: number = 50;
  private flushInterval: number = 10000; // 10 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private abTests: Map<string, ABTestParticipation> = new Map();

  constructor() {
    this.performanceMonitor = new PerformanceMonitoringService();
  }

  // Initialize the analytics service
  async initialize(config?: {
    apiKey?: string;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
    sessionTimeout?: number;
  }): Promise<void> {
    try {
      if (config) {
        this.batchSize = config.batchSize ?? this.batchSize;
        this.flushInterval = config.flushInterval ?? this.flushInterval;
        this.sessionTimeout = config.sessionTimeout ?? this.sessionTimeout;
      }

      // Load cached user data
      await this.loadCachedData();

      // Generate anonymous ID if needed
      if (!this.currentUser) {
        await this.createAnonymousUser();
      }

      // Start session
      await this.startSession();

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize analytics service:', error);
      throw error;
    }
  }

  // User management
  async identifyUser(
    userId: string,
    traits?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Analytics service not initialized');
    }

    this.currentUser.userId = userId;
    if (traits) {
      this.currentUser.customAttributes = {
        ...this.currentUser.customAttributes,
        ...traits,
      };
    }

    await this.cacheUserData();
    await this.track('user_identified', { userId, traits });
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Analytics service not initialized');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    await this.cacheUserData();
    await this.track('user_profile_updated', { updates });
  }

  async setUserPreferences(
    preferences: Partial<UserPreferences>,
  ): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Analytics service not initialized');
    }

    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences,
    };
    await this.cacheUserData();
    await this.track('user_preferences_updated', { preferences });
  }

  // Event tracking
  async track(
    eventName: string,
    properties?: Record<string, unknown>,
    options?: {
      category?: string;
      label?: string;
      value?: number;
      timestamp?: number;
    },
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Analytics service not initialized');
      return;
    }

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      name: eventName,
      category: options?.category ?? 'general',
      action: eventName,
      label: options?.label,
      value: options?.value,
      timestamp: options?.timestamp ?? Date.now(),
      userId: this.currentUser?.userId,
      sessionId: this.currentSession?.id ?? '',
      properties: properties ?? {},
      context: await this.getEventContext(),
    };

    this.eventQueue.push(event);

    // Add to current session
    if (this.currentSession) {
      this.currentSession.events.push(event);
    }

    // Flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  // Screen tracking
  async screen(
    screenName: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    const screenView: ScreenView = {
      id: this.generateEventId(),
      name: screenName,
      path: screenName,
      title: properties?.title,
      startTime: Date.now(),
      interactions: 0,
      scrollDepth: 0,
      exitRate: 0,
      bounced: false,
    };

    // End previous screen view
    if (this.currentSession && this.currentSession.screenViews.length > 0) {
      const lastScreen =
        this.currentSession.screenViews[
          this.currentSession.screenViews.length - 1
        ];
      if (!lastScreen.endTime) {
        lastScreen.endTime = Date.now();
        lastScreen.duration = lastScreen.endTime - lastScreen.startTime;
      }
    }

    // Add new screen view
    if (this.currentSession) {
      this.currentSession.screenViews.push(screenView);
    }

    await this.track(
      'screen_view',
      {
        screen_name: screenName,
        ...properties,
      },
      { category: 'navigation' },
    );
  }

  // Session management
  async startSession(): Promise<void> {
    const sessionId = this.generateSessionId();

    this.currentSession = {
      id: sessionId,
      userId: this.currentUser?.userId,
      anonymousId: this.currentUser?.anonymousId ?? '',
      startTime: Date.now(),
      screenViews: [],
      events: [],
      context: await this.getEventContext(),
      isActive: true,
    };

    if (this.currentUser) {
      this.currentUser.totalSessions++;
      this.currentUser.lastActiveAt = Date.now();
      await this.cacheUserData();
    }

    await this.track(
      'session_start',
      {
        session_id: sessionId,
      },
      { category: 'session' },
    );
  }

  async endSession(
    reason: 'user' | 'timeout' | 'crash' | 'background' = 'user',
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.duration =
      this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.isActive = false;
    this.currentSession.exitReason = reason;

    // End last screen view
    if (this.currentSession.screenViews.length > 0) {
      const lastScreen =
        this.currentSession.screenViews[
          this.currentSession.screenViews.length - 1
        ];
      if (!lastScreen.endTime) {
        lastScreen.endTime = this.currentSession.endTime;
        lastScreen.duration = lastScreen.endTime - lastScreen.startTime;
      }
    }

    // Update user metrics
    if (this.currentUser && this.currentSession.duration) {
      this.currentUser.totalScreenTime += this.currentSession.duration;
      await this.cacheUserData();
    }

    await this.track(
      'session_end',
      {
        session_id: this.currentSession.id,
        duration: this.currentSession.duration,
        screen_views: this.currentSession.screenViews.length,
        events: this.currentSession.events.length,
        exit_reason: reason,
      },
      { category: 'session' },
    );

    // Cache session data
    await this.cacheSessionData();

    this.currentSession = null;
  }

  // Conversion tracking
  async trackConversion(
    goalName: string,
    value?: number,
    properties?: Record<string, any>,
  ): Promise<void> {
    await this.track(
      'conversion',
      {
        goal: goalName,
        value,
        ...properties,
      },
      {
        category: 'conversion',
        value,
      },
    );

    // Update A/B test conversions
    for (const [testId, participation] of this.abTests) {
      if (!participation.converted) {
        participation.converted = true;
        participation.conversionEvent = goalName;
        participation.conversionValue = value;
      }
    }
  }

  // A/B testing integration
  async enrollInABTest(testId: string, variant: string): Promise<void> {
    const participation: ABTestParticipation = {
      testId,
      variant,
      enrolledAt: Date.now(),
      converted: false,
    };

    this.abTests.set(testId, participation);

    await this.track(
      'ab_test_enrolled',
      {
        test_id: testId,
        variant,
      },
      { category: 'experiment' },
    );
  }

  getABTestVariant(testId: string): string | null {
    const participation = this.abTests.get(testId);
    return participation?.variant ?? null;
  }

  // User segmentation
  async updateUserSegments(segments: string[]): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    this.currentUser.segments = segments;
    await this.cacheUserData();

    await this.track(
      'user_segments_updated',
      {
        segments,
      },
      { category: 'segmentation' },
    );
  }

  // Carbon footprint tracking
  async trackCarbonActivity(
    activity: string,
    emissions: number,
    category: string,
    properties?: Record<string, any>,
  ): Promise<void> {
    if (this.currentUser) {
      this.currentUser.carbonFootprint.totalEmissions += emissions;
      this.currentUser.carbonFootprint.categories[category] =
        (this.currentUser.carbonFootprint.categories[category] ?? 0) +
        emissions;

      await this.cacheUserData();
    }

    await this.track(
      'carbon_activity',
      {
        activity,
        emissions,
        category,
        ...properties,
      },
      {
        category: 'sustainability',
        value: emissions,
      },
    );
  }

  async trackCarbonReduction(
    activity: string,
    reduction: number,
    method: string,
    properties?: Record<string, any>,
  ): Promise<void> {
    if (this.currentUser) {
      this.currentUser.carbonFootprint.reductions += reduction;
      await this.cacheUserData();
    }

    await this.track(
      'carbon_reduction',
      {
        activity,
        reduction,
        method,
        ...properties,
      },
      {
        category: 'sustainability',
        value: reduction,
      },
    );
  }

  // Achievement tracking
  async unlockAchievement(
    achievementId: string,
    name: string,
    category: string,
    points: number,
    properties?: Record<string, any>,
  ): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    const achievement: Achievement = {
      id: achievementId,
      name,
      description: properties?.description ?? '',
      category,
      unlockedAt: Date.now(),
      progress: properties?.progress || 100,
      maxProgress: properties?.maxProgress || 100,
      rarity: properties?.rarity || 'common',
      points,
    };

    this.currentUser.achievements.push(achievement);
    await this.cacheUserData();

    await this.track(
      'achievement_unlocked',
      {
        achievement_id: achievementId,
        achievement_name: name,
        category,
        points,
        ...properties,
      },
      {
        category: 'gamification',
        value: points,
      },
    );
  }

  // Analytics queries
  async getUserProfile(): Promise<UserProfile | null> {
    return this.currentUser;
  }

  async getSessionData(): Promise<UserSession | null> {
    return this.currentSession;
  }

  async getEngagementMetrics(): Promise<EngagementMetrics | null> {
    return this.currentUser?.engagement ?? null;
  }

  async getCarbonFootprint(): Promise<CarbonFootprintData | null> {
    return this.currentUser?.carbonFootprint ?? null;
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.currentUser?.achievements || [];
  }

  // Real-time metrics
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    // This would typically fetch from a real-time analytics service
    return {
      activeUsers: Math.floor(Math.random() * 1000),
      sessionsToday: Math.floor(Math.random() * 5000),
      topScreens: [
        { screen: 'Home', views: 1500 },
        { screen: 'Carbon Tracker', views: 1200 },
        { screen: 'Profile', views: 800 },
      ],
      topEvents: [
        { event: 'carbon_activity', count: 2500 },
        { event: 'screen_view', count: 2000 },
        { event: 'button_click', count: 1800 },
      ],
      conversionRate: Math.random() * 10,
      averageSessionDuration: Math.random() * 600000, // milliseconds
      bounceRate: Math.random() * 50,
      crashRate: Math.random() * 1,
      errorRate: Math.random() * 5,
      performanceScore: Math.random() * 100,
    };
  }

  // Data export and privacy
  async exportUserData(): Promise<{
    profile: UserProfile;
    sessions: UserSession[];
    events: AnalyticsEvent[];
  }> {
    const sessions = await this.getCachedSessions();
    const events = await this.getCachedEvents();

    return {
      profile: this.currentUser!,
      sessions,
      events,
    };
  }

  async deleteUserData(): Promise<void> {
    // Clear all user data
    this.currentUser = null;
    this.currentSession = null;
    this.eventQueue = [];
    this.abTests.clear();

    // Clear cached data
    await Promise.all([
      AsyncStorage.removeItem('analytics_user'),
      AsyncStorage.removeItem('analytics_sessions'),
      AsyncStorage.removeItem('analytics_events'),
      AsyncStorage.removeItem('analytics_ab_tests'),
    ]);

    await this.track('user_data_deleted', {}, { category: 'privacy' });
  }

  // Batch processing
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events to analytics service
      await this.sendEvents(events);

      // Cache events locally
      await this.cacheEvents(events);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // This would send events to your analytics service
    console.log(`Sending ${events.length} analytics events`);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Context generation
  private async getEventContext(): Promise<EventContext> {
    const { width, height } = Dimensions.get('window');
    const netInfo = await NetInfo.fetch();

    return {
      app: {
        name: 'Kindred',
        version: await DeviceInfo.getVersion(),
        build: await DeviceInfo.getBuildNumber(),
        namespace: await DeviceInfo.getBundleId(),
        installId: await DeviceInfo.getUniqueId(),
        sessionId: this.currentSession?.id ?? '',
      },
      device: {
        id: await DeviceInfo.getUniqueId(),
        manufacturer: await DeviceInfo.getManufacturer(),
        model: await DeviceInfo.getModel(),
        name: await DeviceInfo.getDeviceName(),
        type: (await DeviceInfo.getDeviceType()) as any,
        os: {
          name: Platform.OS,
          version: Platform.Version.toString(),
        },
        screen: {
          width,
          height,
          density: await DeviceInfo.getFontScale(),
        },
        locale: await DeviceInfo.getDeviceLocale(),
        timezone: await DeviceInfo.getTimezone(),
      },
      network: {
        type: netInfo.type,
        cellular: netInfo.type === 'cellular',
        wifi: netInfo.type === 'wifi',
        bluetooth: netInfo.type === 'bluetooth',
        carrier: netInfo.details?.carrier,
        speed: this.getNetworkSpeed(netInfo),
      },
      user: {
        id: this.currentUser?.userId,
        anonymousId: this.currentUser?.anonymousId ?? '',
        traits: this.currentUser?.customAttributes ?? {},
      },
      screen: {
        name: this.getCurrentScreenName(),
        path: this.getCurrentScreenName(),
        width,
        height,
      },
    };
  }

  private getNetworkSpeed(netInfo: {
    type: string;
    details?: { cellularGeneration?: string };
  }): 'slow' | 'medium' | 'fast' {
    if (netInfo.type === 'cellular') {
      const subtype = netInfo.details?.cellularGeneration;
      if (subtype === '2g') return 'slow';
      if (subtype === '3g') return 'medium';
      return 'fast';
    }
    return 'fast';
  }

  private getCurrentScreenName(): string {
    if (this.currentSession && this.currentSession.screenViews.length > 0) {
      const lastScreen =
        this.currentSession.screenViews[
          this.currentSession.screenViews.length - 1
        ];
      return lastScreen.name;
    }
    return 'unknown';
  }

  // Utility methods
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnonymousId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createAnonymousUser(): Promise<void> {
    this.currentUser = {
      userId: '',
      anonymousId: this.generateAnonymousId(),
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      totalSessions: 0,
      totalScreenTime: 0,
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: {
          push: true,
          email: true,
          sms: false,
          inApp: true,
          categories: {
            achievements: true,
            reminders: true,
            social: true,
            updates: true,
            marketing: false,
          },
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        },
        privacy: {
          analytics: true,
          crashReporting: true,
          personalization: true,
          locationTracking: false,
          dataSharing: false,
          thirdPartyIntegrations: false,
        },
        accessibility: {
          screenReader: false,
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          voiceControl: false,
        },
        units: 'metric',
        currency: 'USD',
        timezone: await DeviceInfo.getTimezone(),
      },
      demographics: {
        interests: [],
      },
      behavior: {
        sessionFrequency: 'daily',
        averageSessionDuration: 0,
        preferredTimeOfDay: 'morning',
        mostUsedFeatures: [],
        navigationPatterns: [],
        interactionStyle: 'casual',
        retentionRisk: 'low',
        lifetimeValue: 0,
        churnProbability: 0,
      },
      engagement: {
        dau: false,
        wau: false,
        mau: false,
        sessionCount: 0,
        screenViews: 0,
        interactions: 0,
        timeSpent: 0,
        bounceRate: 0,
        stickiness: 0,
        recency: 0,
        frequency: 0,
        monetary: 0,
      },
      carbonFootprint: {
        totalEmissions: 0,
        reductions: 0,
        offsetsPurchased: 0,
        categories: {},
        trends: {
          daily: [],
          weekly: [],
          monthly: [],
        },
        goals: {
          target: 0,
          progress: 0,
          deadline: 0,
        },
        comparisons: {
          global: 0,
          country: 0,
          peers: 0,
        },
      },
      achievements: [],
      segments: [],
      customAttributes: {},
    };

    await this.cacheUserData();
  }

  // Timer management
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(async () => {
      await this.flush();
    }, this.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // Storage methods
  private async loadCachedData(): Promise<void> {
    try {
      const [userData, abTestData] = await Promise.all([
        AsyncStorage.getItem('analytics_user'),
        AsyncStorage.getItem('analytics_ab_tests'),
      ]);

      if (userData) {
        this.currentUser = JSON.parse(userData);
      }

      if (abTestData) {
        const tests = JSON.parse(abTestData);
        this.abTests = new Map(Object.entries(tests));
      }
    } catch (error) {
      console.error('Failed to load cached analytics data:', error);
    }
  }

  private async cacheUserData(): Promise<void> {
    try {
      if (this.currentUser) {
        await AsyncStorage.setItem(
          'analytics_user',
          JSON.stringify(this.currentUser),
        );
      }
    } catch (error) {
      console.error('Failed to cache user data:', error);
    }
  }

  private async cacheSessionData(): Promise<void> {
    try {
      if (this.currentSession) {
        const sessions = await this.getCachedSessions();
        sessions.push(this.currentSession);

        // Keep only last 100 sessions
        const recentSessions = sessions.slice(-100);

        await AsyncStorage.setItem(
          'analytics_sessions',
          JSON.stringify(recentSessions),
        );
      }
    } catch (error) {
      console.error('Failed to cache session data:', error);
    }
  }

  private async cacheEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      const cachedEvents = await this.getCachedEvents();
      cachedEvents.push(...events);

      // Keep only last 1000 events
      const recentEvents = cachedEvents.slice(-1000);

      await AsyncStorage.setItem(
        'analytics_events',
        JSON.stringify(recentEvents),
      );
    } catch (error) {
      console.error('Failed to cache events:', error);
    }
  }

  private async getCachedSessions(): Promise<UserSession[]> {
    try {
      const data = await AsyncStorage.getItem('analytics_sessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cached sessions:', error);
      return [];
    }
  }

  private async getCachedEvents(): Promise<AnalyticsEvent[]> {
    try {
      const data = await AsyncStorage.getItem('analytics_events');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cached events:', error);
      return [];
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.stopFlushTimer();

    if (this.currentSession) {
      await this.endSession('user');
    }

    await this.flush();
  }

  // Debug methods
  getDebugInfo(): {
    isInitialized: boolean;
    hasUser: boolean;
    hasSession: boolean;
    queueSize: number;
    abTestCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      hasUser: !!this.currentUser,
      hasSession: !!this.currentSession,
      queueSize: this.eventQueue.length,
      abTestCount: this.abTests.size,
    };
  }
}

export default new EnhancedUserAnalyticsService();
