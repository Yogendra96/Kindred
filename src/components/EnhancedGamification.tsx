// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable, AnimatedProgress } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'carbon' | 'activity' | 'social' | 'streak' | 'milestone';
  type: 'progress' | 'binary' | 'count';
  target: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  badge?: string;
  hidden?: boolean;
  prerequisites?: string[];
}

interface UserLevel {
  level: number;
  currentXP: number;
  xpToNext: number;
  totalXP: number;
  title: string;
  perks: string[];
}

interface Streak {
  type: string;
  current: number;
  longest: number;
  lastUpdate: number;
  active: boolean;
}

interface Reward {
  id: string;
  type: 'badge' | 'title' | 'theme' | 'feature' | 'discount';
  name: string;
  description: string;
  icon: string;
  cost: number;
  unlocked: boolean;
  equipped?: boolean;
  category: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  target: number;
  current: number;
  reward: {
    xp: number;
    points: number;
    items?: string[];
  };
  startDate: number;
  endDate: number;
  completed: boolean;
  icon: string;
}

interface GamificationContextType {
  userLevel: UserLevel;
  achievements: Achievement[];
  streaks: Record<string, Streak>;
  rewards: Reward[];
  challenges: Challenge[];
  totalPoints: number;
  unlockedAchievements: Achievement[];
  addXP: (amount: number, source: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: (type: string, increment?: boolean) => void;
  completeChallenge: (challengeId: string) => void;
  purchaseReward: (rewardId: string) => boolean;
  equipReward: (rewardId: string) => void;
  getAchievementsByCategory: (category: string) => Achievement[];
  getActiveStreaks: () => Streak[];
  getCompletionPercentage: () => number;
}

const defaultUserLevel: UserLevel = {
  level: 1,
  currentXP: 0,
  xpToNext: 100,
  totalXP: 0,
  title: 'Eco Beginner',
  perks: [],
};

const GamificationContext = createContext<GamificationContextType | null>(null);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
};

interface GamificationProviderProps {
  children: React.ReactNode;
  enableNotifications?: boolean;
  autoSave?: boolean;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({
  children,
  enableNotifications = true,
  autoSave = true,
}) => {
  const [userLevel, setUserLevel] = useState<UserLevel>(defaultUserLevel);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streaks, setStreaks] = useState<Record<string, Streak>>({});
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(
    null,
  );

  useEffect(() => {
    initializeGamification();
  }, []);

  useEffect(() => {
    if (autoSave) {
      saveGamificationData();
    }
  }, [
    userLevel,
    achievements,
    streaks,
    rewards,
    challenges,
    totalPoints,
    autoSave,
  ]);

  const initializeGamification = async () => {
    try {
      await loadGamificationData();
      await initializeAchievements();
      await initializeRewards();
      await initializeChallenges();
    } catch (error) {
      console.error('Error initializing gamification:', error);
    }
  };

  const loadGamificationData = async () => {
    try {
      const [
        levelData,
        achievementsData,
        streaksData,
        rewardsData,
        challengesData,
        pointsData,
      ] = await Promise.all([
        AsyncStorage.getItem('user_level'),
        AsyncStorage.getItem('achievements'),
        AsyncStorage.getItem('streaks'),
        AsyncStorage.getItem('rewards'),
        AsyncStorage.getItem('challenges'),
        AsyncStorage.getItem('total_points'),
      ]);

      if (levelData) setUserLevel(JSON.parse(levelData));
      if (achievementsData) setAchievements(JSON.parse(achievementsData));
      if (streaksData) setStreaks(JSON.parse(streaksData));
      if (rewardsData) setRewards(JSON.parse(rewardsData));
      if (challengesData) setChallenges(JSON.parse(challengesData));
      if (pointsData) setTotalPoints(JSON.parse(pointsData));
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  const saveGamificationData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('user_level', JSON.stringify(userLevel)),
        AsyncStorage.setItem('achievements', JSON.stringify(achievements)),
        AsyncStorage.setItem('streaks', JSON.stringify(streaks)),
        AsyncStorage.setItem('rewards', JSON.stringify(rewards)),
        AsyncStorage.setItem('challenges', JSON.stringify(challenges)),
        AsyncStorage.setItem('total_points', JSON.stringify(totalPoints)),
      ]);
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  };

  const initializeAchievements = async () => {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_track',
        title: 'First Steps',
        description: 'Track your first carbon footprint activity',
        icon: 'footsteps',
        category: 'activity',
        type: 'binary',
        target: 1,
        current: 0,
        unlocked: false,
        rarity: 'common',
        points: 10,
      },
      {
        id: 'week_streak',
        title: 'Week Warrior',
        description: 'Maintain a 7-day tracking streak',
        icon: 'calendar',
        category: 'streak',
        type: 'progress',
        target: 7,
        current: 0,
        unlocked: false,
        rarity: 'rare',
        points: 50,
      },
      {
        id: 'carbon_saver',
        title: 'Carbon Saver',
        description: 'Reduce your carbon footprint by 100kg',
        icon: 'leaf',
        category: 'carbon',
        type: 'progress',
        target: 100,
        current: 0,
        unlocked: false,
        rarity: 'epic',
        points: 100,
      },
      {
        id: 'social_butterfly',
        title: 'Social Butterfly',
        description: 'Share 10 eco-tips with friends',
        icon: 'share-social',
        category: 'social',
        type: 'count',
        target: 10,
        current: 0,
        unlocked: false,
        rarity: 'rare',
        points: 75,
      },
      {
        id: 'eco_master',
        title: 'Eco Master',
        description: 'Reach level 10',
        icon: 'trophy',
        category: 'milestone',
        type: 'progress',
        target: 10,
        current: 1,
        unlocked: false,
        rarity: 'legendary',
        points: 500,
        hidden: true,
      },
    ];

    // Merge with existing achievements
    setAchievements(prev => {
      if (prev.length === 0) {
        return defaultAchievements;
      }

      const existingIds = new Set(prev.map(a => a.id));
      const newAchievements = defaultAchievements.filter(
        a => !existingIds.has(a.id),
      );

      return [...prev, ...newAchievements];
    });
  };

  const initializeRewards = async () => {
    const defaultRewards: Reward[] = [
      {
        id: 'dark_theme',
        type: 'theme',
        name: 'Dark Theme',
        description: 'Unlock the dark theme',
        icon: 'moon',
        cost: 100,
        unlocked: false,
        category: 'themes',
      },
      {
        id: 'eco_warrior_badge',
        type: 'badge',
        name: 'Eco Warrior',
        description: 'Show off your environmental commitment',
        icon: 'shield',
        cost: 200,
        unlocked: false,
        category: 'badges',
      },
      {
        id: 'carbon_tracker_title',
        type: 'title',
        name: 'Carbon Tracker',
        description: 'Display this title on your profile',
        icon: 'ribbon',
        cost: 150,
        unlocked: false,
        category: 'titles',
      },
      {
        id: 'advanced_analytics',
        type: 'feature',
        name: 'Advanced Analytics',
        description: 'Unlock detailed carbon footprint analytics',
        icon: 'analytics',
        cost: 500,
        unlocked: false,
        category: 'features',
      },
    ];

    setRewards(prev => {
      if (prev.length === 0) {
        return defaultRewards;
      }

      const existingIds = new Set(prev.map(r => r.id));
      const newRewards = defaultRewards.filter(r => !existingIds.has(r.id));

      return [...prev, ...newRewards];
    });
  };

  const initializeChallenges = async () => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    const defaultChallenges: Challenge[] = [
      {
        id: 'daily_track',
        title: 'Daily Tracker',
        description: 'Track your carbon footprint today',
        type: 'daily',
        target: 1,
        current: 0,
        reward: { xp: 25, points: 10 },
        startDate: now,
        endDate: now + dayMs,
        completed: false,
        icon: 'today',
      },
      {
        id: 'weekly_reduction',
        title: 'Weekly Reducer',
        description: 'Reduce your carbon footprint by 10kg this week',
        type: 'weekly',
        target: 10,
        current: 0,
        reward: { xp: 100, points: 50 },
        startDate: now,
        endDate: now + weekMs,
        completed: false,
        icon: 'trending-down',
      },
    ];

    setChallenges(prev => {
      // Remove expired challenges and add new ones
      const activeChallenges = prev.filter(c => c.endDate > now);
      const existingIds = new Set(activeChallenges.map(c => c.id));
      const newChallenges = defaultChallenges.filter(
        c => !existingIds.has(c.id),
      );

      return [...activeChallenges, ...newChallenges];
    });
  };

  const calculateXPForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  };

  const getLevelTitle = (level: number): string => {
    if (level < 5) return 'Eco Beginner';
    if (level < 10) return 'Green Enthusiast';
    if (level < 20) return 'Carbon Conscious';
    if (level < 35) return 'Sustainability Advocate';
    if (level < 50) return 'Eco Warrior';
    return 'Planet Guardian';
  };

  const getLevelPerks = (level: number): string[] => {
    const perks: string[] = [];
    if (level >= 5) perks.push('Advanced tracking features');
    if (level >= 10) perks.push('Custom themes');
    if (level >= 20) perks.push('Detailed analytics');
    if (level >= 35) perks.push('Community features');
    if (level >= 50) perks.push('Expert insights');
    return perks;
  };

  const addXP = useCallback(
    (amount: number, source: string) => {
      setUserLevel(prev => {
        let newXP = prev.currentXP + amount;
        let newLevel = prev.level;
        let xpToNext = prev.xpToNext;

        // Check for level up
        while (newXP >= xpToNext) {
          newXP -= xpToNext;
          newLevel++;
          xpToNext = calculateXPForLevel(newLevel);

          // Trigger level up celebration
          if (enableNotifications) {
            HapticFeedbackService.triggerSuccess();
            // Show level up notification
          }
        }

        const newUserLevel: UserLevel = {
          level: newLevel,
          currentXP: newXP,
          xpToNext: xpToNext - newXP,
          totalXP: prev.totalXP + amount,
          title: getLevelTitle(newLevel),
          perks: getLevelPerks(newLevel),
        };

        // Update milestone achievements
        if (newLevel > prev.level) {
          updateAchievementProgress('eco_master', newLevel);
        }

        return newUserLevel;
      });
    },
    [enableNotifications],
  );

  const updateAchievementProgress = useCallback(
    (achievementId: string, progress: number) => {
      setAchievements(prev =>
        prev.map(achievement => {
          if (achievement.id === achievementId && !achievement.unlocked) {
            const newCurrent = Math.min(progress, achievement.target);
            const shouldUnlock = newCurrent >= achievement.target;

            if (shouldUnlock) {
              unlockAchievement(achievementId);
            }

            return {
              ...achievement,
              current: newCurrent,
            };
          }
          return achievement;
        }),
      );
    },
    [],
  );

  const unlockAchievement = useCallback(
    (achievementId: string) => {
      setAchievements(prev =>
        prev.map(achievement => {
          if (achievement.id === achievementId && !achievement.unlocked) {
            const unlockedAchievement = {
              ...achievement,
              unlocked: true,
              unlockedAt: Date.now(),
            };

            // Add points and XP
            setTotalPoints(prevPoints => prevPoints + achievement.points);
            addXP(achievement.points * 2, `Achievement: ${achievement.title}`);

            // Show achievement modal
            if (enableNotifications) {
              setNewAchievement(unlockedAchievement);
              setShowAchievementModal(true);
              HapticFeedbackService.triggerSuccess();
            }

            return unlockedAchievement;
          }
          return achievement;
        }),
      );
    },
    [addXP, enableNotifications],
  );

  const updateStreak = useCallback(
    (type: string, increment: boolean = true) => {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      setStreaks(prev => {
        const currentStreak = prev[type] || {
          type,
          current: 0,
          longest: 0,
          lastUpdate: 0,
          active: false,
        };

        const timeSinceLastUpdate = now - currentStreak.lastUpdate;
        const isConsecutive = timeSinceLastUpdate <= dayMs * 1.5; // Allow some flexibility

        let newCurrent = currentStreak.current;
        let newActive = currentStreak.active;

        if (increment) {
          if (isConsecutive || currentStreak.current === 0) {
            newCurrent = currentStreak.current + 1;
            newActive = true;
          } else {
            newCurrent = 1; // Reset streak
            newActive = true;
          }
        } else if (timeSinceLastUpdate > dayMs * 2) {
          newCurrent = 0;
          newActive = false;
        }

        const newStreak: Streak = {
          ...currentStreak,
          current: newCurrent,
          longest: Math.max(currentStreak.longest, newCurrent),
          lastUpdate: increment ? now : currentStreak.lastUpdate,
          active: newActive,
        };

        // Update streak achievements
        if (type === 'daily_tracking' && newCurrent >= 7) {
          updateAchievementProgress('week_streak', newCurrent);
        }

        return {
          ...prev,
          [type]: newStreak,
        };
      });
    },
    [updateAchievementProgress],
  );

  const completeChallenge = useCallback(
    (challengeId: string) => {
      setChallenges(prev =>
        prev.map(challenge => {
          if (challenge.id === challengeId && !challenge.completed) {
            // Award rewards
            addXP(challenge.reward.xp, `Challenge: ${challenge.title}`);
            setTotalPoints(prevPoints => prevPoints + challenge.reward.points);

            if (enableNotifications) {
              HapticFeedbackService.triggerSuccess();
            }

            return {
              ...challenge,
              completed: true,
            };
          }
          return challenge;
        }),
      );
    },
    [addXP, enableNotifications],
  );

  const purchaseReward = useCallback(
    (rewardId: string): boolean => {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward || reward.unlocked || totalPoints < reward.cost) {
        return false;
      }

      setTotalPoints(prev => prev - reward.cost);
      setRewards(prev =>
        prev.map(r => (r.id === rewardId ? { ...r, unlocked: true } : r)),
      );

      if (enableNotifications) {
        HapticFeedbackService.triggerSuccess();
      }

      return true;
    },
    [rewards, totalPoints, enableNotifications],
  );

  const equipReward = useCallback((rewardId: string) => {
    setRewards(prev =>
      prev.map(reward => {
        if (reward.type === 'badge' || reward.type === 'title') {
          return {
            ...reward,
            equipped: reward.id === rewardId ? !reward.equipped : false,
          };
        }
        return reward;
      }),
    );
  }, []);

  const getAchievementsByCategory = useCallback(
    (category: string) => {
      return achievements.filter(a => a.category === category);
    },
    [achievements],
  );

  const getActiveStreaks = useCallback(() => {
    return Object.values(streaks).filter(s => s.active);
  }, [streaks]);

  const getCompletionPercentage = useCallback(() => {
    const totalAchievements = achievements.filter(a => !a.hidden).length;
    const unlockedCount = achievements.filter(
      a => a.unlocked && !a.hidden,
    ).length;
    return totalAchievements > 0
      ? (unlockedCount / totalAchievements) * 100
      : 0;
  }, [achievements]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);

  const contextValue: GamificationContextType = {
    userLevel,
    achievements,
    streaks,
    rewards,
    challenges,
    totalPoints,
    unlockedAchievements,
    addXP,
    updateAchievementProgress,
    unlockAchievement,
    updateStreak,
    completeChallenge,
    purchaseReward,
    equipReward,
    getAchievementsByCategory,
    getActiveStreaks,
    getCompletionPercentage,
  };

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}

      {/* Achievement Unlock Modal */}
      <Modal
        visible={showAchievementModal}
        transparent
        animationType='fade'
        onRequestClose={() => setShowAchievementModal(false)}
      >
        <AchievementUnlockModal
          achievement={newAchievement}
          onClose={() => {
            setShowAchievementModal(false);
            setNewAchievement(null);
          }}
        />
      </Modal>
    </GamificationContext.Provider>
  );
};

// Achievement Unlock Modal Component
interface AchievementUnlockModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  achievement,
  onClose,
}) => {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievement) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]).start();
    }
  }, [achievement]);

  if (!achievement) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '#9E9E9E';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return ['#9E9E9E', '#757575'];
      case 'rare':
        return ['#2196F3', '#1976D2'];
      case 'epic':
        return ['#9C27B0', '#7B1FA2'];
      case 'legendary':
        return ['#FF9800', '#F57C00'];
      default:
        return ['#9E9E9E', '#757575'];
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <Animated.View
        style={[
          styles.achievementModal,
          {
            backgroundColor: theme.colors.surface,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getRarityGradient(achievement.rarity)}
          style={styles.achievementHeader}
        >
          <Text style={styles.achievementUnlockedText}>
            Achievement Unlocked!
          </Text>

          <Animated.View
            style={[
              styles.achievementIconContainer,
              {
                transform: [
                  {
                    rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ]}
          >
            <Ionicons name={achievement.icon as any} size={60} color='white' />
          </Animated.View>
        </LinearGradient>

        <View style={styles.achievementContent}>
          <Text
            style={[styles.achievementTitle, { color: theme.colors.onSurface }]}
          >
            {achievement.title}
          </Text>

          <Text
            style={[
              styles.achievementDescription,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {achievement.description}
          </Text>

          <View style={styles.achievementRewards}>
            <View style={styles.rewardItem}>
              <Ionicons
                name='star'
                size={16}
                color={getRarityColor(achievement.rarity)}
              />
              <Text
                style={[styles.rewardText, { color: theme.colors.onSurface }]}
              >
                {achievement.points} Points
              </Text>
            </View>

            <View style={styles.rewardItem}>
              <Ionicons
                name='trending-up'
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.rewardText, { color: theme.colors.onSurface }]}
              >
                {achievement.points * 2} XP
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.rarityText,
              { color: getRarityColor(achievement.rarity) },
            ]}
          >
            {achievement.rarity.toUpperCase()}
          </Text>
        </View>

        <AnimatedTouchable
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: theme.colors.primary },
          ]}
          animationType='scale'
          hapticType='medium'
        >
          <Text style={styles.closeButtonText}>Awesome!</Text>
        </AnimatedTouchable>
      </Animated.View>
    </View>
  );
};

// User Level Display Component
interface UserLevelDisplayProps {
  showDetails?: boolean;
  compact?: boolean;
  testID?: string;
}

export const UserLevelDisplay: React.FC<UserLevelDisplayProps> = ({
  showDetails = true,
  compact = false,
  testID,
}) => {
  const { theme } = useTheme();
  const { userLevel } = useGamification();

  const progressPercentage =
    (userLevel.currentXP / (userLevel.currentXP + userLevel.xpToNext)) * 100;

  if (compact) {
    return (
      <View
        style={[
          styles.levelDisplayCompact,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
        testID={testID}
      >
        <Text style={[styles.levelNumber, { color: theme.colors.primary }]}>
          {userLevel.level}
        </Text>
        <View style={styles.levelProgressCompact}>
          <AnimatedProgress
            progress={progressPercentage}
            color={theme.colors.primary}
            backgroundColor={theme.colors.outline}
            height={4}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.levelDisplay, { backgroundColor: theme.colors.surface }]}
      testID={testID}
    >
      <View style={styles.levelHeader}>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelTitle, { color: theme.colors.onSurface }]}>
            Level {userLevel.level}
          </Text>
          <Text style={[styles.levelSubtitle, { color: theme.colors.primary }]}>
            {userLevel.title}
          </Text>
        </View>

        <View
          style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name='trophy' size={24} color='white' />
        </View>
      </View>

      {showDetails && (
        <>
          <View style={styles.xpContainer}>
            <Text
              style={[styles.xpText, { color: theme.colors.onSurfaceVariant }]}
            >
              {userLevel.currentXP} / {userLevel.currentXP + userLevel.xpToNext}{' '}
              XP
            </Text>
            <Text
              style={[
                styles.xpToNext,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {userLevel.xpToNext} XP to next level
            </Text>
          </View>

          <AnimatedProgress
            progress={progressPercentage}
            color={theme.colors.primary}
            backgroundColor={theme.colors.surfaceVariant}
            height={8}
            borderRadius={4}
          />

          {userLevel.perks.length > 0 && (
            <View style={styles.perksContainer}>
              <Text
                style={[styles.perksTitle, { color: theme.colors.onSurface }]}
              >
                Level Perks:
              </Text>
              {userLevel.perks.map((perk, index) => (
                <View key={index} style={styles.perkItem}>
                  <Ionicons
                    name='checkmark-circle'
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.perkText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {perk}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
};

// Achievement Card Component
interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
  testID?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  testID,
}) => {
  const { theme } = useTheme();

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '#9E9E9E';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const progressPercentage =
    achievement.type === 'binary'
      ? achievement.unlocked
        ? 100
        : 0
      : (achievement.current / achievement.target) * 100;

  return (
    <AnimatedTouchable
      onPress={onPress}
      style={[
        styles.achievementCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: achievement.unlocked
            ? getRarityColor(achievement.rarity)
            : theme.colors.outline,
          opacity: achievement.unlocked ? 1 : 0.7,
        },
      ]}
      animationType='scale'
      hapticType='selection'
      testID={testID}
    >
      <View style={styles.achievementCardHeader}>
        <View
          style={[
            styles.achievementIcon,
            {
              backgroundColor: achievement.unlocked
                ? getRarityColor(achievement.rarity)
                : theme.colors.surfaceVariant,
            },
          ]}
        >
          <Ionicons
            name={achievement.icon as any}
            size={24}
            color={
              achievement.unlocked ? 'white' : theme.colors.onSurfaceVariant
            }
          />
        </View>

        {achievement.unlocked && (
          <View style={styles.unlockedBadge}>
            <Ionicons
              name='checkmark-circle'
              size={16}
              color={getRarityColor(achievement.rarity)}
            />
          </View>
        )}
      </View>

      <Text
        style={[styles.achievementCardTitle, { color: theme.colors.onSurface }]}
      >
        {achievement.title}
      </Text>

      <Text
        style={[
          styles.achievementCardDescription,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {achievement.description}
      </Text>

      {!achievement.unlocked && achievement.type !== 'binary' && (
        <View style={styles.progressContainer}>
          <AnimatedProgress
            progress={progressPercentage}
            color={getRarityColor(achievement.rarity)}
            backgroundColor={theme.colors.surfaceVariant}
            height={4}
            borderRadius={2}
          />
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {achievement.current} / {achievement.target}
          </Text>
        </View>
      )}

      <View style={styles.achievementFooter}>
        <Text
          style={[
            styles.pointsText,
            { color: getRarityColor(achievement.rarity) },
          ]}
        >
          {achievement.points} pts
        </Text>
        <Text
          style={[
            styles.rarityBadge,
            { color: getRarityColor(achievement.rarity) },
          ]}
        >
          {achievement.rarity.toUpperCase()}
        </Text>
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  achievementModal: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
  },
  achievementHeader: {
    padding: 24,
    alignItems: 'center',
  },
  achievementUnlockedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  achievementIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    padding: 24,
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  achievementRewards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  closeButton: {
    margin: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  levelDisplay: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  levelDisplayCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  levelSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  levelProgressCompact: {
    flex: 1,
  },
  xpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '500',
  },
  xpToNext: {
    fontSize: 12,
  },
  perksContainer: {
    marginTop: 12,
  },
  perksTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  perkText: {
    fontSize: 12,
    flex: 1,
  },
  achievementCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    margin: 8,
  },
  achievementCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  achievementCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementCardDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rarityBadge: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default GamificationProvider;
