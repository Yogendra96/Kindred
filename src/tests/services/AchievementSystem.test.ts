import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import AchievementSystemService, { AchievementUtils } from '../../services/AchievementSystem';
import { TestDataFactory, TestHelpers } from '../utils/testUtils';

// Mock Firebase modules
jest.mock('@react-native-firebase/firestore');
jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-async-storage/async-storage');

// Mock other services
jest.mock('../../services/PerformanceMonitoringService', () => ({
  startTrace: jest.fn(),
  stopTrace: jest.fn(),
}));

jest.mock('../../services/SocialFeaturesService', () => ({
  getCurrentUser: jest.fn(() => ({
    uid: 'test-user-id',
    stats: {
      level: 1,
      totalCarbonSaved: 0,
      activitiesLogged: 0,
      streakDays: 0,
      friendsCount: 0,
      challengesCompleted: 0,
    },
  })),
  createActivity: jest.fn(),
  shareActivity: jest.fn(),
}));

describe('AchievementSystemService', () => {
  let achievementService: typeof AchievementSystemService;
  let mockFirestore: jest.Mocked<any>;
  let mockAuth: jest.Mocked<any>;
  let mockAsyncStorage: jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset singleton instance
    (AchievementSystemService as any).instance = undefined;
    achievementService = AchievementSystemService;

    // Setup Firebase mocks
    mockFirestore = firestore as jest.Mocked<any>;
    mockAuth = auth as jest.Mocked<any>;
    mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

    // Setup default mock implementations
    mockFirestore.mockReturnValue({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
          set: jest.fn(() => Promise.resolve()),
          update: jest.fn(() => Promise.resolve()),
          onSnapshot: jest.fn(),
        })),
        add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
        where: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ docs: [] })),
          orderBy: jest.fn(() => ({
            get: jest.fn(() => Promise.resolve({ docs: [] })),
          })),
        })),
        orderBy: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ docs: [] })),
        })),
      })),
      FieldValue: {
        increment: jest.fn(),
      },
    });

    mockAuth.mockReturnValue({
      currentUser: {
        uid: 'test-user-id',
        email: 'test@example.com',
      },
      onAuthStateChanged: jest.fn(),
    });

    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = AchievementSystemService;
      const instance2 = AchievementSystemService;

      expect(instance1).toBe(instance2);
    });

    it('should load cached data on initialization', async () => {
      const cachedBadges = [TestDataFactory.createBadge()];
      mockAsyncStorage.getItem.mockImplementation(key => {
        if (key === 'achievement_badges') {
          return Promise.resolve(JSON.stringify(cachedBadges));
        }
        return Promise.resolve(null);
      });

      const _badges = achievementService.getAvailableBadges();

      await TestHelpers.waitFor(100); // Wait for async initialization

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('achievement_badges');
    });

    it('should setup auth state listener', () => {
      expect(mockAuth().onAuthStateChanged).toHaveBeenCalled();
    });
  });

  describe('Badge Management', () => {
    it('should return available badges', () => {
      const badges = achievementService.getAvailableBadges();

      expect(Array.isArray(badges)).toBe(true);
      expect(badges.every(badge => !badge.isHidden)).toBe(true);
    });

    it('should return all badges including hidden ones', () => {
      const allBadges = achievementService.getAllBadges();
      const availableBadges = achievementService.getAvailableBadges();

      expect(allBadges.length).toBeGreaterThanOrEqual(availableBadges.length);
    });

    it('should find badge by ID', () => {
      const allBadges = achievementService.getAllBadges();
      if (allBadges.length > 0) {
        const firstBadge = allBadges[0];
        const foundBadge = achievementService.getBadgeById(firstBadge.id);

        expect(foundBadge).toEqual(firstBadge);
      }
    });

    it('should return null for non-existent badge ID', () => {
      const badge = achievementService.getBadgeById('non-existent-id');

      expect(badge).toBeNull();
    });

    it('should filter badges by category', () => {
      const carbonBadges = achievementService.getBadgesByCategory('carbon');

      expect(carbonBadges.every(badge => badge.category === 'carbon')).toBe(true);
    });

    it('should filter badges by rarity', () => {
      const commonBadges = achievementService.getBadgesByRarity('common');

      expect(commonBadges.every(badge => badge.rarity === 'common')).toBe(true);
    });
  });

  describe('User Achievement Management', () => {
    it('should load user achievements from Firestore', async () => {
      const mockAchievements = [
        {
          id: '1',
          userId: 'test-user-id',
          badgeId: 'badge-1',
          isCompleted: true,
        },
        {
          id: '2',
          userId: 'test-user-id',
          badgeId: 'badge-2',
          isCompleted: false,
        },
      ];

      mockFirestore()
        .collection()
        .where()
        .orderBy()
        .get.mockResolvedValue({
          docs: mockAchievements.map(achievement => ({
            id: achievement.id,
            data: () => achievement,
          })),
        });

      const achievements = await achievementService.loadUserAchievements('test-user-id');

      expect(achievements).toHaveLength(2);
      expect(mockFirestore().collection).toHaveBeenCalledWith('achievements');
    });

    it('should return completed achievements', () => {
      // This would require the service to have loaded achievements first
      const completedAchievements = achievementService.getCompletedAchievements();

      expect(Array.isArray(completedAchievements)).toBe(true);
      expect(completedAchievements.every(achievement => achievement.isCompleted)).toBe(true);
    });

    it('should return in-progress achievements', () => {
      const inProgressAchievements = achievementService.getInProgressAchievements();

      expect(Array.isArray(inProgressAchievements)).toBe(true);
      expect(inProgressAchievements.every(achievement => !achievement.isCompleted)).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should get progress tracking map', () => {
      const progressMap = achievementService.getProgressTracking();

      expect(progressMap instanceof Map).toBe(true);
    });

    it('should get progress for specific badge', () => {
      const allBadges = achievementService.getAllBadges();
      if (allBadges.length > 0) {
        const firstBadge = allBadges[0];
        const progress = achievementService.getBadgeProgress(firstBadge.id);

        // Progress might be null if not tracked yet
        if (progress) {
          expect(progress.badgeId).toBe(firstBadge.id);
          expect(progress.badge).toEqual(firstBadge);
          expect(typeof progress.percentage).toBe('number');
        }
      }
    });
  });

  describe('User Stats Management', () => {
    it('should load user stats from Firestore', async () => {
      const mockStats = TestDataFactory.createUser().stats;

      mockFirestore()
        .collection()
        .doc()
        .get.mockResolvedValue({
          exists: true,
          data: () => mockStats,
        });

      const stats = await achievementService.loadUserStats('test-user-id');

      expect(stats).toBeTruthy();
      expect(mockFirestore().collection).toHaveBeenCalledWith('userAchievementStats');
    });

    it('should create initial stats if they do not exist', async () => {
      mockFirestore().collection().doc().get.mockResolvedValue({
        exists: false,
      });

      mockFirestore().collection().doc().set.mockResolvedValue();

      const stats = await achievementService.loadUserStats('test-user-id');

      expect(stats).toBeTruthy();
      expect(stats?.userId).toBe('test-user-id');
      expect(stats?.totalBadges).toBe(0);
      expect(mockFirestore().collection().doc().set).toHaveBeenCalled();
    });

    it('should return current user stats', () => {
      const stats = achievementService.getUserStats();

      // Stats might be null if not loaded yet
      if (stats) {
        expect(typeof stats.totalBadges).toBe('number');
        expect(typeof stats.totalPoints).toBe('number');
        expect(typeof stats.completionRate).toBe('number');
      }
    });
  });

  describe('Notifications', () => {
    it('should return all notifications', () => {
      const notifications = achievementService.getNotifications();

      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should return unread notifications', () => {
      const unreadNotifications = achievementService.getUnreadNotifications();

      expect(Array.isArray(unreadNotifications)).toBe(true);
      expect(unreadNotifications.every(notification => !notification.isRead)).toBe(true);
    });

    it('should mark notification as read', async () => {
      mockFirestore().collection().doc().update.mockResolvedValue();

      await achievementService.markNotificationAsRead('test-notification-id');

      expect(mockFirestore().collection().doc().update).toHaveBeenCalledWith({
        isRead: true,
      });
    });
  });

  describe('Sharing', () => {
    it('should share achievement', async () => {
      const mockAchievement = TestDataFactory.createAchievement();

      // Mock the achievement exists in the service
      (achievementService as any).userAchievements = [mockAchievement];

      mockFirestore().collection().doc().update.mockResolvedValue();

      await achievementService.shareAchievement(mockAchievement.id);

      expect(mockFirestore().collection().doc().update).toHaveBeenCalledWith({
        shareCount: expect.anything(),
      });
    });

    it('should throw error when sharing non-existent achievement', async () => {
      await expect(achievementService.shareAchievement('non-existent-id')).rejects.toThrow(
        'Achievement not found',
      );
    });
  });

  describe('Cache Management', () => {
    it('should clear all cached data', async () => {
      await achievementService.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('achievement_badges');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('achievement_user_achievements');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('achievement_user_stats');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('achievement_notifications');
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      mockFirestore()
        .collection()
        .where()
        .orderBy()
        .get.mockRejectedValue(new Error('Firestore error'));

      const achievements = await achievementService.loadUserAchievements('test-user-id');

      expect(achievements).toEqual([]);
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw error during initialization
      expect(() => AchievementSystemService).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should load badges quickly', async () => {
      const startTime = performance.now();
      achievementService.getAvailableBadges();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should be very fast for cached data
    });

    it('should handle large number of achievements efficiently', async () => {
      const manyAchievements = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        userId: 'test-user-id',
        badgeId: `badge-${i}`,
        isCompleted: i % 2 === 0,
      }));

      mockFirestore()
        .collection()
        .where()
        .orderBy()
        .get.mockResolvedValue({
          docs: manyAchievements.map(achievement => ({
            id: achievement.id,
            data: () => achievement,
          })),
        });

      const startTime = performance.now();
      await achievementService.loadUserAchievements('test-user-id');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should handle 1000 achievements in <100ms
    });
  });
});

describe('AchievementUtils', () => {
  describe('formatRarity', () => {
    it('should format rarity correctly', () => {
      expect(AchievementUtils.formatRarity('common')).toBe('Common');
      expect(AchievementUtils.formatRarity('uncommon')).toBe('Uncommon');
      expect(AchievementUtils.formatRarity('rare')).toBe('Rare');
      expect(AchievementUtils.formatRarity('epic')).toBe('Epic');
      expect(AchievementUtils.formatRarity('legendary')).toBe('Legendary');
    });
  });

  describe('getRarityColor', () => {
    it('should return correct colors for each rarity', () => {
      expect(AchievementUtils.getRarityColor('common')).toBe('#9CA3AF');
      expect(AchievementUtils.getRarityColor('uncommon')).toBe('#10B981');
      expect(AchievementUtils.getRarityColor('rare')).toBe('#3B82F6');
      expect(AchievementUtils.getRarityColor('epic')).toBe('#8B5CF6');
      expect(AchievementUtils.getRarityColor('legendary')).toBe('#F59E0B');
    });
  });

  describe('formatProgress', () => {
    it('should format progress percentage correctly', () => {
      expect(AchievementUtils.formatProgress(5, 10)).toBe('50%');
      expect(AchievementUtils.formatProgress(3, 10)).toBe('30%');
      expect(AchievementUtils.formatProgress(10, 10)).toBe('100%');
      expect(AchievementUtils.formatProgress(15, 10)).toBe('100%'); // Should cap at 100%
    });

    it('should handle edge cases', () => {
      expect(AchievementUtils.formatProgress(0, 10)).toBe('0%');
      expect(AchievementUtils.formatProgress(1, 3)).toBe('33%'); // Should round
    });
  });

  describe('calculateAchievementScore', () => {
    it('should calculate score correctly', () => {
      const achievements = [
        TestDataFactory.createAchievement({
          isCompleted: true,
          badge: TestDataFactory.createBadge({
            rarity: 'common',
            rewards: { points: 100 },
          }),
        }),
        TestDataFactory.createAchievement({
          isCompleted: true,
          badge: TestDataFactory.createBadge({
            rarity: 'rare',
            rewards: { points: 200 },
          }),
        }),
        TestDataFactory.createAchievement({
          isCompleted: false, // Should not count
          badge: TestDataFactory.createBadge({
            rarity: 'epic',
            rewards: { points: 500 },
          }),
        }),
      ];

      const score = AchievementUtils.calculateAchievementScore(achievements);

      // common: 100 * 1 = 100, rare: 200 * 3 = 600, epic: not completed
      expect(score).toBe(700);
    });

    it('should return 0 for no completed achievements', () => {
      const achievements = [TestDataFactory.createAchievement({ isCompleted: false })];

      const score = AchievementUtils.calculateAchievementScore(achievements);

      expect(score).toBe(0);
    });
  });

  describe('getAchievementLevel', () => {
    it('should calculate level from score correctly', () => {
      expect(AchievementUtils.getAchievementLevel(0)).toBe(1);
      expect(AchievementUtils.getAchievementLevel(500)).toBe(1);
      expect(AchievementUtils.getAchievementLevel(1000)).toBe(2);
      expect(AchievementUtils.getAchievementLevel(2500)).toBe(3);
      expect(AchievementUtils.getAchievementLevel(10000)).toBe(11);
    });
  });

  describe('formatTimeSince', () => {
    it('should format time correctly', () => {
      const now = new Date();
      const today = now.toISOString();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();

      expect(AchievementUtils.formatTimeSince(today)).toBe('Today');
      expect(AchievementUtils.formatTimeSince(yesterday)).toBe('Yesterday');
      expect(AchievementUtils.formatTimeSince(weekAgo)).toBe('1 weeks ago');
      expect(AchievementUtils.formatTimeSince(monthAgo)).toBe('1 months ago');
      expect(AchievementUtils.formatTimeSince(yearAgo)).toBe('1 years ago');
    });
  });
});
