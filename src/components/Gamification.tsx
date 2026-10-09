/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable, AnimatedProgress } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

const GamificationContext = createContext<GamificationContextType | null>(null);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) throw new Error('useGamification must be used within GamificationProvider');
  return context;
};

/**
 * Gamification Provider Component
 * Manages user levels, achievements, streaks, and rewards
 */
export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLevel, setUserLevel] = useState({
    level: 1,
    currentXP: 0,
    xpToNext: 100,
    totalXP: 0,
    title: 'Eco Beginner',
    perks: [],
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streaks, setStreaks] = useState<Record<string, Streak>>({});
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem('gamification_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserLevel(parsed.userLevel);
        setAchievements(parsed.achievements);
        setStreaks(parsed.streaks);
        setRewards(parsed.rewards);
        setChallenges(parsed.challenges);
        setTotalPoints(parsed.totalPoints);
      }
    } catch (e) {
      console.error('Load gamification data failed', e);
    }
  };

  const saveData = async () => {
    try {
      const data = { userLevel, achievements, streaks, rewards, challenges, totalPoints };
      await AsyncStorage.setItem('gamification_data', JSON.stringify(data));
    } catch (e) {
      console.error('Save gamification data failed', e);
    }
  };

  useEffect(() => {
    saveData();
  }, [userLevel, achievements, streaks, rewards, challenges, totalPoints]);

  const addXP = (amount: number, source: string) => {
    setUserLevel(prev => {
      let newXP = prev.currentXP + amount;
      let newLevel = prev.level;
      let xpToNext = prev.xpToNext;

      if (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        xpToNext = Math.floor(xpToNext * 1.2);
        HapticFeedbackService.triggerSuccess();
      }

      return {
        ...prev,
        level: newLevel,
        currentXP: newXP,
        xpToNext,
        totalXP: prev.totalXP + amount,
      };
    });
  };

  // The functions below complete the GamificationContextType contract. They were
  // previously omitted; consumers of useGamification() may rely on them.
  const updateAchievementProgress = (achievementId: string, progress: number) => {
    setAchievements(prev =>
      prev.map(a =>
        a.id === achievementId
          ? {
              ...a,
              current: Math.min(progress, a.target),
              unlocked: progress >= a.target,
              unlockedAt: progress >= a.target && !a.unlocked ? a.unlockedAt ?? Date.now() : a.unlockedAt,
            }
          : a,
      ),
    );
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev =>
      prev.map(a =>
        a.id === achievementId && !a.unlocked
          ? { ...a, unlocked: true, unlockedAt: Date.now() }
          : a,
      ),
    );
  };

  const updateStreak = (type: string, increment = true) => {
    setStreaks(prev => {
      const previous = prev[type] ?? {
        type,
        current: 0,
        longest: 0,
        lastUpdate: 0,
        active: false,
      };
      const current = increment ? previous.current + 1 : 0;
      return {
        ...prev,
        [type]: {
          ...previous,
          current,
          longest: Math.max(previous.longest, current),
          lastUpdate: Date.now(),
          active: current > 0,
        },
      };
    });
  };

  const completeChallenge = (challengeId: string) => {
    setChallenges(prev =>
      prev.map(c =>
        c.id === challengeId ? { ...c, completed: true, current: c.target } : c,
      ),
    );
  };

  const purchaseReward = (rewardId: string): boolean => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || reward.unlocked || totalPoints < reward.cost) return false;
    setRewards(prev =>
      prev.map(r => (r.id === rewardId ? { ...r, unlocked: true } : r)),
    );
    setTotalPoints(prev => prev - reward.cost);
    return true;
  };

  const equipReward = (rewardId: string) => {
    setRewards(prev =>
      prev.map(r => ({ ...r, equipped: r.id === rewardId && r.unlocked })),
    );
  };

  const getAchievementsByCategory = (category: string): Achievement[] =>
    achievements.filter(a => a.category === category);

  const getActiveStreaks = (): Streak[] => Object.values(streaks).filter(s => s.active);

  const getCompletionPercentage = (): number => {
    if (achievements.length === 0) return 0;
    return Math.round(
      (achievements.filter(a => a.unlocked).length / achievements.length) * 100,
    );
  };

  // Other context functions omitted for brevity in this refactor,
  // keeping the core structure and types.

  return (
    <GamificationContext.Provider
      value={{
        userLevel,
        achievements,
        streaks,
        rewards,
        challenges,
        totalPoints,
        unlockedAchievements: achievements.filter(a => a.unlocked),
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
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

// Sub-components like UserLevelDisplay, AchievementCard would also be in this file if exported.
export const UserLevelDisplay = () => {
  const { theme } = useTheme();
  const { userLevel } = useGamification();
  return (
    <View style={styles.levelDisplay}>
      <Text style={{ color: theme.colors.onSurface }}>
        Level {userLevel.level}: {userLevel.title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  levelDisplay: { padding: 16, borderRadius: 12, margin: 16, backgroundColor: '#f0f0f0' },
});

export default GamificationProvider;
