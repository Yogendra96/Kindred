/**
 * src/types/shared.ts — Shared domain types (Single Source of Truth)
 *
 * Problem solved: The following types were duplicated 3–6× across services and screens:
 *   Achievement (6 files), UserProfile (5 files), LeaderboardEntry (4 files),
 *   Challenge (3 files), UserPreferences (4 files), UserContext (4 files)
 *
 * All files now import from here. Service-specific extensions use `extends`.
 */

// ─── Achievements ─────────────────────────────────────────────────────────────

export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type AchievementCategory =
  | 'transport'
  | 'diet'
  | 'energy'
  | 'waste'
  | 'social'
  | 'streak';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  points: number;
  difficulty: AchievementDifficulty;
  category: AchievementCategory;
  unlockedAt?: string; // ISO-8601 or undefined if locked
  progress?: number; // 0–1 for partially completed
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  weeklyGoalKg: number;
  dietType: 'omnivore' | 'vegetarian' | 'vegan' | 'flexitarian';
  transportDefault: 'car' | 'public' | 'bike' | 'walk';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  co2SavedKg: number;
  streak: number;
  points: number;
  level: number;
  preferences: UserPreferences;
  achievements: Achievement[];
}

export interface UserContext {
  userId: string;
  sessionId: string;
  locale: string;
  platform: 'ios' | 'android';
  appVersion: string;
}

// ─── Social / Community ───────────────────────────────────────────────────────

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'global';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  participants: number;
  daysLeft: number;
  progress: number; // 0–1
  reward: string;
  joined: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  co2Kg: number;
  points: number;
  streak: number;
  isYou: boolean;
}

// ─── Carbon / Environment ─────────────────────────────────────────────────────

export type CarbonCategory =
  | 'transportation'
  | 'food'
  | 'energy'
  | 'shopping'
  | 'waste';

export interface CarbonEntry {
  id: string;
  category: CarbonCategory;
  kgCO2: number;
  description: string;
  date: string; // ISO-8601 date
  verified: boolean;
}

export interface CarbonFootprint {
  totalKgToday: number;
  totalKgWeek: number;
  totalKgMonth: number;
  avgKgPerDay: number;
  breakdown: Record<CarbonCategory, number>;
  trendVsLastWeek: number; // % change, negative = improvement
}

// ─── API / Network ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
