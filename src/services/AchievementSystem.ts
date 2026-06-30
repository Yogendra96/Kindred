// @ts-nocheck
/* eslint-disable */
import { modernAPMService } from './ModernAPMService';
import SocialFeaturesService from './SocialFeaturesService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import firebase from '../utils/firebaseInit';
import { MOCK_ACHIEVEMENTS } from '../utils/demoData';

// Safety check for Firebase app
const ensureFirebase = () => {
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp({
        apiKey: 'dummy-api-key-for-local-dev',
        appId: '1:1234567890:ios:abcdef',
        projectId: 'kindred-dummy-project',
        messagingSenderId: '1234567890',
      });
    } catch (e) {}
  }
};

// Types for Achievement System
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // SVG string or icon name
  category: 'carbon' | 'social' | 'streak' | 'challenge' | 'milestone' | 'special' | 'climate'; // NEW: Climate intelligence badges
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type:
      | 'carbon_saved'
      | 'streak_days'
      | 'activities_count'
      | 'friends_count'
      | 'challenges_completed'
      | 'level_reached'
      | 'custom';
    value: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
    additionalCriteria?: Record<string, any>;
  };
  rewards: {
    points: number;
    carbonCredits?: number;
    unlocks?: string[]; // Unlock other features or badges
  };
  isHidden: boolean; // Secret achievements
  isActive: boolean;
  createdDate: string;
  metadata: {
    difficulty: number; // 1-10 scale
    estimatedTime: string; // e.g., "1 week", "1 month"
    tips?: string[];
  };
}

export interface Achievement {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  unlockedDate: string;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  isCompleted: boolean;
  notificationSent: boolean;
  shareCount: number;
  metadata: {
    unlockMethod?: string;
    location?: {
      latitude: number;
      longitude: number;
      city?: string;
    };
    context?: Record<string, any>;
  };
}

export interface UserAchievementStats {
  userId: string;
  totalBadges: number;
  badgesByCategory: Record<Badge['category'], number>;
  badgesByRarity: Record<Badge['rarity'], number>;
  totalPoints: number;
  completionRate: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: string;
  };
  milestones: {
    firstBadge: string;
    latestBadge: string;
    rarest: Badge['rarity'];
    favoriteCategory: Badge['category'];
  };
  leaderboardRank: {
    global: number;
    friends: number;
    local: number;
  };
}

export interface AchievementProgress {
  badgeId: string;
  badge: Badge;
  currentProgress: number;
  targetProgress: number;
  percentage: number;
  isCompleted: boolean;
  estimatedCompletion?: string;
  nextMilestone?: {
    value: number;
    description: string;
  };
}

export interface AchievementNotification {
  id: string;
  userId: string;
  type: 'badge_unlocked' | 'progress_milestone' | 'streak_milestone' | 'level_up';
  title: string;
  message: string;
  badgeId?: string;
  badge?: Badge;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actions?: {
    label: string;
    action: string;
    data?: Record<string, any>;
  }[];
}

class AchievementSystemService {
  private static instance: AchievementSystemService;
  private performanceService = modernAPMService;
  private socialService = SocialFeaturesService;
  private availableBadges: Badge[] = [];
  private userAchievements: Achievement[] = [];
  private userStats: UserAchievementStats | null = null;
  private progressTracking: Map<string, AchievementProgress> = new Map();
  private notifications: AchievementNotification[] = [];

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): AchievementSystemService {
    if (!AchievementSystemService.instance) {
      AchievementSystemService.instance = new AchievementSystemService();
    }
    return AchievementSystemService.instance;
  }

  private async initializeService(): Promise<void> {
    ensureFirebase();
    try {
      await this.loadCachedData();
      await this.loadAvailableBadges();
      this.setupAuthListener();
      this.setupProgressTracking();
    } catch (error) {
      console.error('Error initializing achievement system:', error);
    }
  }

  private setupAuthListener(): void {
    try {
      if (!firebase.apps.length) return;
      auth().onAuthStateChanged(async user => {
        if (user) {
          await this.loadUserAchievements(user.uid);
          await this.loadUserStats(user.uid);
          await this.updateProgressTracking();
        } else {
          this.userAchievements = [];
          this.userStats = null;
          this.progressTracking.clear();
        }
      });
    } catch (e) {
      console.warn('Could not setup auth listener for Achievement System:', e);
    }
  }

  // Badge Management
  private async loadAvailableBadges(): Promise<void> {
    try {
      await this.performanceService.startTrace('load_badges');

      if (!firebase.apps.length) {
        throw new Error('Firebase not initialized, using default badges');
      }

      // Load from Firestore
      const badgesSnapshot = await firestore()
        .collection('badges')
        .where('isActive', '==', true)
        .orderBy('category')
        .orderBy('rarity')
        .get();

      const badges = badgesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Badge[];

      // Add default badges if none exist
      if (badges.length === 0) {
        badges.push(...this.getDefaultBadges());
      }

      this.availableBadges = badges;
      await this.saveCachedData();

      await this.performanceService.stopTrace('load_badges', {
        badges_count: badges.length.toString(),
      });
    } catch (error) {
      await this.performanceService.stopTrace('load_badges', {
        status: 'error',
        error: String(error),
      });
      console.warn('Could not load badges from Firestore:', error);

      // Fallback to default badges
      this.availableBadges = this.getDefaultBadges();
    }
  }

  private getDefaultBadges(): Badge[] {
    return [
      {
        id: 'first_step',
        name: 'First Step',
        description: 'Log your first carbon-saving activity',
        icon: '🌱',
        category: 'milestone',
        rarity: 'common',
        requirements: {
          type: 'activities_count',
          value: 1,
          timeframe: 'all-time',
        },
        rewards: {
          points: 50,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 1,
          estimatedTime: '1 day',
          tips: ['Start with simple activities like walking instead of driving'],
        },
      },
      {
        id: 'carbon_saver',
        name: 'Carbon Saver',
        description: 'Save 10kg of CO₂ emissions',
        icon: '🌍',
        category: 'carbon',
        rarity: 'common',
        requirements: {
          type: 'carbon_saved',
          value: 10,
          timeframe: 'all-time',
        },
        rewards: {
          points: 100,
          carbonCredits: 5,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 3,
          estimatedTime: '1 week',
          tips: ['Focus on transportation and energy-saving activities'],
        },
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 7-day activity streak',
        icon: '🔥',
        category: 'streak',
        rarity: 'uncommon',
        requirements: {
          type: 'streak_days',
          value: 7,
          timeframe: 'all-time',
        },
        rewards: {
          points: 200,
          unlocks: ['streak_multiplier'],
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 5,
          estimatedTime: '1 week',
          tips: ['Set daily reminders to log activities'],
        },
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Add 5 friends to your network',
        icon: '🦋',
        category: 'social',
        rarity: 'common',
        requirements: {
          type: 'friends_count',
          value: 5,
          timeframe: 'all-time',
        },
        rewards: {
          points: 150,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 4,
          estimatedTime: '2 weeks',
          tips: ['Share your achievements to attract friends'],
        },
      },
      {
        id: 'challenge_champion',
        name: 'Challenge Champion',
        description: 'Complete 3 challenges',
        icon: '🏆',
        category: 'challenge',
        rarity: 'rare',
        requirements: {
          type: 'challenges_completed',
          value: 3,
          timeframe: 'all-time',
        },
        rewards: {
          points: 500,
          carbonCredits: 20,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 7,
          estimatedTime: '1 month',
          tips: ['Join group challenges for better motivation'],
        },
      },
      {
        id: 'eco_warrior',
        name: 'Eco Warrior',
        description: 'Save 100kg of CO₂ emissions',
        icon: '⚔️',
        category: 'carbon',
        rarity: 'epic',
        requirements: {
          type: 'carbon_saved',
          value: 100,
          timeframe: 'all-time',
        },
        rewards: {
          points: 1000,
          carbonCredits: 50,
          unlocks: ['eco_warrior_title'],
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 9,
          estimatedTime: '3 months',
          tips: ['Focus on high-impact activities like renewable energy'],
        },
      },
      {
        id: 'planet_guardian',
        name: 'Planet Guardian',
        description: 'Reach level 10 and save 500kg CO₂',
        icon: '🌟',
        category: 'special',
        rarity: 'legendary',
        requirements: {
          type: 'custom',
          value: 1,
          additionalCriteria: {
            level: 10,
            carbonSaved: 500,
          },
        },
        rewards: {
          points: 5000,
          carbonCredits: 200,
          unlocks: ['planet_guardian_title', 'exclusive_themes'],
        },
        isHidden: true,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 10,
          estimatedTime: '6 months',
          tips: ['This is the ultimate achievement - keep pushing!'],
        },
      },
      // =========================================================================
      // CLIMATE INTELLIGENCE BADGES (NEW)
      // Powered by Climate TRACE, WattTime, OpenAQ integrations
      // =========================================================================
      {
        id: 'world_citizen',
        name: 'World Citizen',
        description: 'Reduce footprint below the global average (4.7t/year)',
        icon: '🌍',
        category: 'carbon',
        rarity: 'epic',
        requirements: {
          type: 'custom',
          value: 1,
          additionalCriteria: {
            footprintBelowWorldAverage: true,
            sustainedWeeks: 4,
          },
        },
        rewards: {
          points: 1500,
          carbonCredits: 75,
          unlocks: ['global_leaderboard_access'],
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 8,
          estimatedTime: '2 months',
          tips: [
            'Focus on transportation and home energy',
            'Track your progress with the Global Context dashboard',
          ],
        },
      },
      {
        id: 'grid_whisperer',
        name: 'Grid Whisperer',
        description: 'Use optimal charging windows 10 times based on grid carbon intensity',
        icon: '⚡',
        category: 'carbon',
        rarity: 'rare',
        requirements: {
          type: 'custom',
          value: 10,
          additionalCriteria: {
            optimalWindowsUsed: 10,
          },
        },
        rewards: {
          points: 800,
          carbonCredits: 30,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 6,
          estimatedTime: '3 weeks',
          tips: [
            'Check grid carbon before charging EV or running appliances',
            'Enable notifications for optimal charging windows',
          ],
        },
      },
      {
        id: 'air_aware',
        name: 'Air Aware',
        description: 'Check air quality before outdoor activities 15 times',
        icon: '💨',
        category: 'milestone',
        rarity: 'uncommon',
        requirements: {
          type: 'custom',
          value: 15,
          additionalCriteria: {
            airQualityChecks: 15,
          },
        },
        rewards: {
          points: 400,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 3,
          estimatedTime: '2 weeks',
          tips: [
            'Build a habit of checking AQI before exercise',
            'Air quality data helps you avoid pollution peaks',
          ],
        },
      },
      {
        id: 'know_your_neighbor',
        name: 'Know Your Neighbor',
        description: 'Explore 25 nearby emission sources on the map',
        icon: '🔍',
        category: 'milestone',
        rarity: 'rare',
        requirements: {
          type: 'custom',
          value: 25,
          additionalCriteria: {
            sourcesExplored: 25,
          },
        },
        rewards: {
          points: 600,
          unlocks: ['emission_map_layers'],
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 5,
          estimatedTime: '1 month',
          tips: [
            'Tap on emission sources in the map to learn more',
            "Discover what industries contribute to your area's emissions",
          ],
        },
      },
      {
        id: 'sector_specialist',
        name: 'Sector Specialist',
        description: 'Learn about emissions from 10 different industry sectors',
        icon: '📊',
        category: 'milestone',
        rarity: 'uncommon',
        requirements: {
          type: 'custom',
          value: 10,
          additionalCriteria: {
            sectorsExplored: 10,
          },
        },
        rewards: {
          points: 350,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 4,
          estimatedTime: '2 weeks',
          tips: [
            'Browse the sector breakdown in your emissions dashboard',
            'Each sector has unique reduction opportunities',
          ],
        },
      },
      {
        id: 'country_champion',
        name: 'Country Champion',
        description: "Beat your country's average emissions for 3 consecutive months",
        icon: '🏅',
        category: 'carbon',
        rarity: 'epic',
        requirements: {
          type: 'custom',
          value: 1,
          additionalCriteria: {
            belowCountryAverage: true,
            consecutiveMonths: 3,
          },
        },
        rewards: {
          points: 2000,
          carbonCredits: 100,
          unlocks: ['country_leaderboard_featured'],
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 8,
          estimatedTime: '3 months',
          tips: [
            'Compare your footprint to national averages in Global Context',
            'Focus on your highest-impact categories',
          ],
        },
      },
      {
        id: 'paris_aligned',
        name: 'Paris Aligned',
        description: 'Achieve a footprint below the 2030 Paris Agreement target (2.5t/year)',
        icon: '🌡️',
        category: 'carbon',
        rarity: 'legendary',
        requirements: {
          type: 'custom',
          value: 1,
          additionalCriteria: {
            footprintBelow: 2.5,
            sustainedMonths: 1,
          },
        },
        rewards: {
          points: 3000,
          carbonCredits: 150,
          unlocks: ['paris_badge_frame', 'climate_leader_title'],
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 10,
          estimatedTime: '6 months',
          tips: [
            "This is the gold standard - you're a true climate leader!",
            'Requires lifestyle changes across all categories',
          ],
        },
      },
      {
        id: 'renewable_scout',
        name: 'Renewable Scout',
        description: 'Charge devices 5 times when grid is 50%+ renewable',
        icon: '☀️',
        category: 'carbon',
        rarity: 'uncommon',
        requirements: {
          type: 'custom',
          value: 5,
          additionalCriteria: {
            renewableCharges: 5,
            minRenewablePercent: 50,
          },
        },
        rewards: {
          points: 300,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 4,
          estimatedTime: '2 weeks',
          tips: ['Check the power breakdown before charging', 'Solar peaks are usually midday'],
        },
      },
      {
        id: 'emission_historian',
        name: 'Emission Historian',
        description: 'Compare your footprint to 5 different historical country averages',
        icon: '📜',
        category: 'milestone',
        rarity: 'rare',
        requirements: {
          type: 'custom',
          value: 5,
          additionalCriteria: {
            historicalComparisons: 5,
          },
        },
        rewards: {
          points: 500,
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 3,
          estimatedTime: '1 week',
          tips: [
            'Explore the "Time Travel" feature to see historical comparisons',
            'Learn how emissions have changed over decades',
          ],
        },
      },
      {
        id: 'corporate_investigator',
        name: 'Corporate Investigator',
        description: 'Check emissions data for 10 companies via product scans',
        icon: '🔬',
        category: 'milestone',
        rarity: 'rare',
        requirements: {
          type: 'custom',
          value: 10,
          additionalCriteria: {
            corporateScans: 10,
          },
        },
        rewards: {
          points: 700,
          unlocks: ['corporate_comparison_tool'],
        },
        isHidden: false,
        isActive: true,
        createdDate: new Date().toISOString(),
        metadata: {
          difficulty: 5,
          estimatedTime: '3 weeks',
          tips: [
            'Scan product barcodes to see manufacturer emissions',
            'Make informed purchasing decisions',
          ],
        },
      },
    ];
  }

  public getAvailableBadges(): Badge[] {
    return this.availableBadges.filter(badge => !badge.isHidden);
  }

  public getAllBadges(): Badge[] {
    return this.availableBadges;
  }

  public getBadgeById(badgeId: string): Badge | null {
    return this.availableBadges.find(badge => badge.id === badgeId) || null;
  }

  public getBadgesByCategory(category: Badge['category']): Badge[] {
    return this.availableBadges.filter(badge => badge.category === category);
  }

  public getBadgesByRarity(rarity: Badge['rarity']): Badge[] {
    return this.availableBadges.filter(badge => badge.rarity === rarity);
  }

  // User Achievement Management
  public async loadUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      await this.performanceService.startTrace('load_user_achievements');

      // Demo Mode Fallback
      if (!firebase.apps.length || firebase.app().options.projectId?.includes('dummy')) {
        this.userAchievements = MOCK_ACHIEVEMENTS as any;
        return MOCK_ACHIEVEMENTS as any;
      }

      const achievementsSnapshot = await firestore()
        .collection('achievements')
        .where('userId', '==', userId)
        .orderBy('unlockedDate', 'desc')
        .get();

      const achievements = achievementsSnapshot.docs.map(doc => {
        const data = doc.data();
        const badge = this.getBadgeById(data.badgeId);
        return {
          id: doc.id,
          ...data,
          badge,
        };
      }) as Achievement[];

      this.userAchievements = achievements;
      await this.saveCachedData();

      await this.performanceService.stopTrace('load_user_achievements', {
        achievements_count: achievements.length.toString(),
      });

      return achievements;
    } catch (error) {
      await this.performanceService.stopTrace('load_user_achievements', {
        status: 'error',
        error: String(error),
      });
      console.error('Error loading user achievements:', error);
      return [];
    }
  }

  public getUserAchievements(): Achievement[] {
    return this.userAchievements;
  }

  public getCompletedAchievements(): Achievement[] {
    return this.userAchievements.filter(achievement => achievement.isCompleted);
  }

  public getInProgressAchievements(): Achievement[] {
    return this.userAchievements.filter(achievement => !achievement.isCompleted);
  }

  // Progress Tracking
  private setupProgressTracking(): void {
    // Set up real-time listeners for user stats changes
    const currentUser = this.socialService.getCurrentUser();
    if (currentUser) {
      this.trackUserProgress(currentUser.uid);
    }
  }

  private async trackUserProgress(userId: string): Promise<void> {
    try {
      // Listen to user stats changes
      const unsubscribe = firestore()
        .collection('users')
        .doc(userId)
        .onSnapshot(async doc => {
          if (doc.exists) {
            const userData = doc.data();
            await this.checkForNewAchievements(userId, userData.stats);
          }
        });

      // Store unsubscribe function for cleanup
      // In a real app, you'd want to manage this properly
    } catch (error) {
      console.error('Error setting up progress tracking:', error);
    }
  }

  private async updateProgressTracking(): Promise<void> {
    try {
      const currentUser = this.socialService.getCurrentUser();
      if (!currentUser) return;

      const userStats = currentUser.stats;
      const progressMap = new Map<string, AchievementProgress>();

      for (const badge of this.availableBadges) {
        const currentProgress = this.calculateBadgeProgress(badge, userStats);
        const isCompleted = this.userAchievements.some(
          achievement => achievement.badgeId === badge.id && achievement.isCompleted,
        );

        const progress: AchievementProgress = {
          badgeId: badge.id,
          badge,
          currentProgress,
          targetProgress: badge.requirements.value,
          percentage: Math.min((currentProgress / badge.requirements.value) * 100, 100),
          isCompleted,
          estimatedCompletion: this.calculateEstimatedCompletion(badge, currentProgress),
          nextMilestone: this.calculateNextMilestone(badge, currentProgress),
        };

        progressMap.set(badge.id, progress);
      }

      this.progressTracking = progressMap;
      await this.saveCachedData();
    } catch (error) {
      console.error('Error updating progress tracking:', error);
    }
  }

  private calculateBadgeProgress(badge: Badge, userStats: any): number {
    switch (badge.requirements.type) {
      case 'carbon_saved':
        return userStats.totalCarbonSaved || 0;
      case 'streak_days':
        return userStats.streakDays || 0;
      case 'activities_count':
        return userStats.activitiesLogged || 0;
      case 'friends_count':
        return userStats.friendsCount || 0;
      case 'challenges_completed':
        return userStats.challengesCompleted || 0;
      case 'level_reached':
        return userStats.level || 0;
      case 'custom':
        return this.calculateCustomProgress(badge, userStats);
      default:
        return 0;
    }
  }

  private calculateCustomProgress(badge: Badge, userStats: any): number {
    // Handle custom badge requirements
    const criteria = badge.requirements.additionalCriteria || {};

    if (badge.id === 'planet_guardian') {
      const levelMet = (userStats.level || 0) >= criteria.level;
      const carbonMet = (userStats.totalCarbonSaved || 0) >= criteria.carbonSaved;
      return levelMet && carbonMet ? 1 : 0;
    }

    return 0;
  }

  private calculateEstimatedCompletion(badge: Badge, currentProgress: number): string | undefined {
    if (currentProgress >= badge.requirements.value) return undefined;

    const remaining = badge.requirements.value - currentProgress;
    const progressRate = this.getProgressRate(badge.requirements.type);

    if (progressRate <= 0) return undefined;

    const daysRemaining = Math.ceil(remaining / progressRate);

    if (daysRemaining <= 7) return `${daysRemaining} days`;
    if (daysRemaining <= 30) return `${Math.ceil(daysRemaining / 7)} weeks`;
    return `${Math.ceil(daysRemaining / 30)} months`;
  }

  private getProgressRate(type: Badge['requirements']['type']): number {
    // Estimate daily progress rates based on user history
    // This is simplified - in a real app, you'd analyze user patterns
    switch (type) {
      case 'carbon_saved':
        return 2; // 2kg CO₂ per day average
      case 'activities_count':
        return 1; // 1 activity per day
      case 'streak_days':
        return 1; // 1 day per day
      case 'friends_count':
        return 0.2; // 1 friend per 5 days
      case 'challenges_completed':
        return 0.1; // 1 challenge per 10 days
      default:
        return 0;
    }
  }

  private calculateNextMilestone(
    badge: Badge,
    currentProgress: number,
  ): { value: number; description: string } | undefined {
    const target = badge.requirements.value;
    const milestones = [0.25, 0.5, 0.75, 1.0].map(p => Math.floor(target * p));

    for (const milestone of milestones) {
      if (currentProgress < milestone) {
        const percentage = Math.floor((milestone / target) * 100);
        return {
          value: milestone,
          description: `${percentage}% complete`,
        };
      }
    }

    return undefined;
  }

  public getProgressTracking(): Map<string, AchievementProgress> {
    return this.progressTracking;
  }

  public getBadgeProgress(badgeId: string): AchievementProgress | null {
    return this.progressTracking.get(badgeId) || null;
  }

  // Achievement Unlocking
  private async checkForNewAchievements(userId: string, userStats: any): Promise<void> {
    try {
      const newAchievements: Achievement[] = [];

      for (const badge of this.availableBadges) {
        // Skip if already unlocked
        const alreadyUnlocked = this.userAchievements.some(
          achievement => achievement.badgeId === badge.id && achievement.isCompleted,
        );

        if (alreadyUnlocked) continue;

        // Check if requirements are met
        const currentProgress = this.calculateBadgeProgress(badge, userStats);
        const requirementsMet = this.checkRequirements(badge, currentProgress, userStats);

        if (requirementsMet) {
          const achievement = await this.unlockAchievement(userId, badge, currentProgress);
          if (achievement) {
            newAchievements.push(achievement);
          }
        }
      }

      if (newAchievements.length > 0) {
        await this.handleNewAchievements(newAchievements);
      }
    } catch (error) {
      console.error('Error checking for new achievements:', error);
    }
  }

  private checkRequirements(badge: Badge, currentProgress: number, userStats: any): boolean {
    if (badge.requirements.type === 'custom') {
      return this.checkCustomRequirements(badge, userStats);
    }

    return currentProgress >= badge.requirements.value;
  }

  private checkCustomRequirements(badge: Badge, userStats: any): boolean {
    const criteria = badge.requirements.additionalCriteria || {};

    if (badge.id === 'planet_guardian') {
      const levelMet = (userStats.level || 0) >= criteria.level;
      const carbonMet = (userStats.totalCarbonSaved || 0) >= criteria.carbonSaved;
      return levelMet && carbonMet;
    }

    return false;
  }

  private async unlockAchievement(
    userId: string,
    badge: Badge,
    currentProgress: number,
  ): Promise<Achievement | null> {
    try {
      const achievement: Omit<Achievement, 'id'> = {
        userId,
        badgeId: badge.id,
        badge,
        unlockedDate: new Date().toISOString(),
        progress: {
          current: currentProgress,
          target: badge.requirements.value,
          percentage: 100,
        },
        isCompleted: true,
        notificationSent: false,
        shareCount: 0,
        metadata: {
          unlockMethod: 'automatic',
        },
      };

      // Save to Firestore
      const docRef = await firestore().collection('achievements').add(achievement);

      const savedAchievement: Achievement = {
        id: docRef.id,
        ...achievement,
      };

      // Update local cache
      this.userAchievements.push(savedAchievement);
      await this.saveCachedData();

      return savedAchievement;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return null;
    }
  }

  private async handleNewAchievements(achievements: Achievement[]): Promise<void> {
    try {
      // Update user stats
      await this.updateUserStats();

      // Create notifications
      for (const achievement of achievements) {
        await this.createAchievementNotification(achievement);
      }

      // Create social activities
      for (const achievement of achievements) {
        await this.createSocialActivity(achievement);
      }

      // Update progress tracking
      await this.updateProgressTracking();
    } catch (error) {
      console.error('Error handling new achievements:', error);
    }
  }

  private async createAchievementNotification(achievement: Achievement): Promise<void> {
    try {
      const notification: Omit<AchievementNotification, 'id'> = {
        userId: achievement.userId,
        type: 'badge_unlocked',
        title: `Badge Unlocked: ${achievement.badge.name}!`,
        message: achievement.badge.description,
        badgeId: achievement.badgeId,
        badge: achievement.badge,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority:
          achievement.badge.rarity === 'legendary'
            ? 'high'
            : achievement.badge.rarity === 'epic'
            ? 'medium'
            : 'low',
        actions: [
          {
            label: 'Share',
            action: 'share_achievement',
            data: { achievementId: achievement.id },
          },
          {
            label: 'View Progress',
            action: 'view_achievements',
          },
        ],
      };

      const docRef = await firestore().collection('notifications').add(notification);

      const savedNotification: AchievementNotification = {
        id: docRef.id,
        ...notification,
      };

      this.notifications.unshift(savedNotification);
      await this.saveCachedData();
    } catch (error) {
      console.error('Error creating achievement notification:', error);
    }
  }

  private async createSocialActivity(achievement: Achievement): Promise<void> {
    try {
      await this.socialService.createActivity({
        type: 'badge_earned',
        title: `Earned the "${achievement.badge.name}" badge!`,
        description: achievement.badge.description,
        data: {
          badgeId: achievement.badgeId,
          category: achievement.badge.category,
        },
        isPublic: true,
      });
    } catch (error) {
      console.error('Error creating social activity for achievement:', error);
    }
  }

  // User Stats Management
  public async loadUserStats(userId: string): Promise<UserAchievementStats | null> {
    try {
      const statsDoc = await firestore().collection('userAchievementStats').doc(userId).get();

      if (statsDoc.exists) {
        const stats = statsDoc.data() as UserAchievementStats;
        this.userStats = stats;
        return stats;
      }

      // Create initial stats if they don't exist
      const initialStats = await this.createInitialUserStats(userId);
      this.userStats = initialStats;
      return initialStats;
    } catch (error) {
      console.error('Error loading user stats:', error);
      return null;
    }
  }

  private async createInitialUserStats(userId: string): Promise<UserAchievementStats> {
    const initialStats: UserAchievementStats = {
      userId,
      totalBadges: 0,
      badgesByCategory: {
        carbon: 0,
        social: 0,
        streak: 0,
        challenge: 0,
        milestone: 0,
        special: 0,
        climate: 0,
      },
      badgesByRarity: {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      },
      totalPoints: 0,
      completionRate: 0,
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: '',
      },
      milestones: {
        firstBadge: '',
        latestBadge: '',
        rarest: 'common',
        favoriteCategory: 'milestone',
      },
      leaderboardRank: {
        global: 0,
        friends: 0,
        local: 0,
      },
    };

    await firestore().collection('userAchievementStats').doc(userId).set(initialStats);

    return initialStats;
  }

  private async updateUserStats(): Promise<void> {
    try {
      if (!this.userStats) return;

      const completedAchievements = this.getCompletedAchievements();
      const totalBadges = completedAchievements.length;

      // Calculate badges by category and rarity
      const badgesByCategory = {
        carbon: 0,
        social: 0,
        streak: 0,
        challenge: 0,
        milestone: 0,
        special: 0,
        climate: 0,
      };
      const badgesByRarity = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };
      let totalPoints = 0;

      for (const achievement of completedAchievements) {
        badgesByCategory[achievement.badge.category]++;
        badgesByRarity[achievement.badge.rarity]++;
        totalPoints += achievement.badge.rewards.points;
      }

      // Calculate completion rate
      const completionRate = (totalBadges / this.availableBadges.length) * 100;

      // Find milestones
      const sortedAchievements = [...completedAchievements].sort(
        (a, b) => new Date(a.unlockedDate).getTime() - new Date(b.unlockedDate).getTime(),
      );

      const firstBadge = sortedAchievements[0]?.badge.name || '';
      const latestBadge = sortedAchievements[sortedAchievements.length - 1]?.badge.name || '';

      // Find rarest badge
      const rarityOrder: Badge['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      let rarest: Badge['rarity'] = 'common';
      for (const achievement of completedAchievements) {
        if (rarityOrder.indexOf(achievement.badge.rarity) > rarityOrder.indexOf(rarest)) {
          rarest = achievement.badge.rarity;
        }
      }

      // Find favorite category
      const favoriteCategory = Object.entries(badgesByCategory).reduce((a, b) =>
        badgesByCategory[a[0] as Badge['category']] > badgesByCategory[b[0] as Badge['category']]
          ? a
          : b,
      )[0] as Badge['category'];

      const updatedStats: UserAchievementStats = {
        ...this.userStats,
        totalBadges,
        badgesByCategory,
        badgesByRarity,
        totalPoints,
        completionRate,
        milestones: {
          firstBadge,
          latestBadge,
          rarest,
          favoriteCategory,
        },
      };

      await firestore()
        .collection('userAchievementStats')
        .doc(this.userStats.userId)
        .update(updatedStats);

      this.userStats = updatedStats;
      await this.saveCachedData();
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  public getUserStats(): UserAchievementStats | null {
    return this.userStats;
  }

  // Notifications
  public getNotifications(): AchievementNotification[] {
    return this.notifications;
  }

  public getUnreadNotifications(): AchievementNotification[] {
    return this.notifications.filter(notification => !notification.isRead);
  }

  public async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await firestore().collection('notifications').doc(notificationId).update({ isRead: true });

      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        await this.saveCachedData();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Sharing
  public async shareAchievement(achievementId: string): Promise<void> {
    try {
      const achievement = this.userAchievements.find(a => a.id === achievementId);
      if (!achievement) throw new Error('Achievement not found');

      await this.socialService.shareActivity({
        id: `achievement_${achievementId}`,
        uid: achievement.userId,
        type: 'badge_earned',
        title: `I earned the "${achievement.badge.name}" badge!`,
        description: achievement.badge.description,
        timestamp: achievement.unlockedDate,
        isPublic: true,
        likes: { count: 0, users: [] },
        comments: [],
      });

      // Update share count
      await firestore()
        .collection('achievements')
        .doc(achievementId)
        .update({
          shareCount: firestore.FieldValue.increment(1),
        });

      achievement.shareCount++;
      await this.saveCachedData();
    } catch (error) {
      console.error('Error sharing achievement:', error);
      throw error;
    }
  }

  // Cache Management
  private async loadCachedData(): Promise<void> {
    try {
      const [badgesData, achievementsData, statsData, notificationsData] = await Promise.all([
        AsyncStorage.getItem('achievement_badges'),
        AsyncStorage.getItem('achievement_user_achievements'),
        AsyncStorage.getItem('achievement_user_stats'),
        AsyncStorage.getItem('achievement_notifications'),
      ]);

      if (badgesData) this.availableBadges = JSON.parse(badgesData);
      if (achievementsData) this.userAchievements = JSON.parse(achievementsData);
      if (statsData) this.userStats = JSON.parse(statsData);
      if (notificationsData) this.notifications = JSON.parse(notificationsData);
    } catch (error) {
      console.error('Error loading cached achievement data:', error);
    }
  }

  private async saveCachedData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('achievement_badges', JSON.stringify(this.availableBadges)),
        AsyncStorage.setItem(
          'achievement_user_achievements',
          JSON.stringify(this.userAchievements),
        ),
        AsyncStorage.setItem('achievement_user_stats', JSON.stringify(this.userStats)),
        AsyncStorage.setItem('achievement_notifications', JSON.stringify(this.notifications)),
      ]);
    } catch (error) {
      console.error('Error saving cached achievement data:', error);
    }
  }

  public async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('achievement_badges'),
        AsyncStorage.removeItem('achievement_user_achievements'),
        AsyncStorage.removeItem('achievement_user_stats'),
        AsyncStorage.removeItem('achievement_notifications'),
      ]);

      this.availableBadges = [];
      this.userAchievements = [];
      this.userStats = null;
      this.notifications = [];
      this.progressTracking.clear();
    } catch (error) {
      console.error('Error clearing achievement cache:', error);
    }
  }
}

export default AchievementSystemService.getInstance();

// Utility functions
export const AchievementUtils = {
  // Format badge rarity for display
  formatRarity: (rarity: Badge['rarity']): string => {
    const rarityMap = {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary',
    };
    return rarityMap[rarity];
  },

  // Get rarity color
  getRarityColor: (rarity: Badge['rarity']): string => {
    const colorMap = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
    };
    return colorMap[rarity];
  },

  // Format progress percentage
  formatProgress: (current: number, target: number): string => {
    const percentage = Math.min((current / target) * 100, 100);
    return `${Math.round(percentage)}%`;
  },

  // Calculate achievement score
  calculateAchievementScore: (achievements: Achievement[]): number => {
    return achievements.reduce((total, achievement) => {
      if (achievement.isCompleted) {
        const rarityMultiplier = {
          common: 1,
          uncommon: 2,
          rare: 3,
          epic: 5,
          legendary: 10,
        }[achievement.badge.rarity];

        return total + achievement.badge.rewards.points * rarityMultiplier;
      }
      return total;
    }, 0);
  },

  // Get achievement level from score
  getAchievementLevel: (score: number): number => {
    return Math.floor(score / 1000) + 1;
  },

  // Format time since achievement
  formatTimeSince: (timestamp: string): string => {
    const now = new Date();
    const achievementTime = new Date(timestamp);
    const diffMs = now.getTime() - achievementTime.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return `${Math.floor(diffDays / 365)} years ago`;
  },
};
