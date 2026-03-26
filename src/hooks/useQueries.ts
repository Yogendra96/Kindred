/**
 * TanStack Query Hooks
 * Modern data fetching and caching for API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import logger from '../services/LoggerService';
import { ErrorHandler } from '../utils/errorHandler';

// Mock API functions (replace with real API calls)
const api = {
  // Carbon API
  fetchCarbonData: async () => {
    const log = logger.withTag('api:fetchCarbonData');
    const stopPerf = log.perf('fetch');
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      log.info('Carbon data fetched successfully');
      return {
        total: 12.5,
        transportation: 4.2,
        food: 3.1,
        energy: 3.8,
        waste: 1.4,
      };
    } catch (err) {
      throw ErrorHandler.handle(err, 'api:fetchCarbonData', true);
    } finally {
      stopPerf();
    }
  },

  calculateEmissions: async (activity: { type: string; amount: number }) => {
    const log = logger.withTag('api:calculateEmissions');
    const stopPerf = log.perf('calculate');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      log.info('Emissions calculated successfully');
      return {
        emissions: activity.amount * 2.5,
        category: activity.type,
      };
    } catch (err) {
      throw ErrorHandler.handle(err, 'api:calculateEmissions', true);
    } finally {
      stopPerf();
    }
  },

  // User API
  fetchUserProfile: async (userId: string) => {
    const log = logger.withTag('api:fetchUserProfile');
    const stopPerf = log.perf('fetch');
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      log.info('User profile fetched successfully');
      return {
        id: userId,
        name: 'Alex Green',
        email: 'alex@kindred.app',
        avatar: 'https://i.pravatar.cc/150?img=12',
      };
    } catch (err) {
      throw ErrorHandler.handle(err, 'api:fetchUserProfile', true);
    } finally {
      stopPerf();
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUserProfile: async (updates: any) => {
    const log = logger.withTag('api:updateUserProfile');
    const stopPerf = log.perf('update');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      log.info('User profile updated successfully');
      return { ...updates, updatedAt: new Date().toISOString() };
    } catch (err) {
      throw ErrorHandler.handle(err, 'api:updateUserProfile', true);
    } finally {
      stopPerf();
    }
  },

  // Achievements API
  fetchAchievements: async () => {
    const log = logger.withTag('api:fetchAchievements');
    const stopPerf = log.perf('fetch');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      log.info('Achievements fetched successfully');
      return [
        { id: '1', title: 'First Steps', unlocked: true },
        { id: '2', title: 'Week Warrior', unlocked: true },
        { id: '3', title: 'Carbon Reducer', unlocked: false },
      ];
    } catch (err) {
      throw ErrorHandler.handle(err, 'api:fetchAchievements', true);
    } finally {
      stopPerf();
    }
  },

  // Leaderboard API
  fetchLeaderboard: async () => {
    const log = logger.withTag('api:fetchLeaderboard');
    const stopPerf = log.perf('fetch');
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      log.info('Leaderboard fetched successfully');
      return [
        { rank: 1, name: 'Emma Thompson', emissions: 145.2 },
        { rank: 2, name: 'Michael Chen', emissions: 152.8 },
        { rank: 3, name: 'Alex Green', emissions: 158.3 },
      ];
    } catch (err) {
      throw ErrorHandler.handle(err, 'api:fetchLeaderboard', true);
    } finally {
      stopPerf();
    }
  },
};

// Query Keys (for cache management)
export const queryKeys = {
  carbon: ['carbon'] as const,
  carbonHistory: (period: string) => ['carbon', 'history', period] as const,
  user: (id: string) => ['user', id] as const,
  achievements: ['achievements'] as const,
  leaderboard: ['leaderboard'] as const,
  recommendations: ['recommendations'] as const,
};

// ==========================================
// CARBON QUERIES
// ==========================================

/**
 * Fetch current carbon footprint data
 */
export const useCarbonData = () => {
  return useQuery({
    queryKey: queryKeys.carbon,
    queryFn: api.fetchCarbonData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
};

/**
 * Calculate emissions for an activity
 */
export const useCalculateEmissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.calculateEmissions,
    onSuccess: _data => {
      // Invalidate carbon data to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.carbon });
    },
  });
};

// ==========================================
// USER QUERIES
// ==========================================

/**
 * Fetch user profile
 */
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => api.fetchUserProfile(userId),
    enabled: !!userId, // Only run if userId exists
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateUserProfile,
    onSuccess: (data, _variables) => {
      // Update the cache optimistically
      queryClient.setQueryData(queryKeys.user(data.id), data);
    },
  });
};

// ==========================================
// ACHIEVEMENTS QUERIES
// ==========================================

/**
 * Fetch user achievements
 */
export const useAchievements = () => {
  return useQuery({
    queryKey: queryKeys.achievements,
    queryFn: api.fetchAchievements,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

// ==========================================
// LEADERBOARD QUERIES
// ==========================================

/**
 * Fetch leaderboard data
 */
export const useLeaderboard = () => {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: api.fetchLeaderboard,
    staleTime: 1000 * 60 * 2, // 2 minutes (fresh data)
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
  });
};

// ==========================================
// HELPER HOOKS
// ==========================================

/**
 * Prefetch data for better UX
 */
export const usePrefetchData = () => {
  const queryClient = useQueryClient();

  const prefetchCarbon = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.carbon,
      queryFn: api.fetchCarbonData,
    });
  };

  const prefetchAchievements = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.achievements,
      queryFn: api.fetchAchievements,
    });
  };

  const prefetchLeaderboard = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.leaderboard,
      queryFn: api.fetchLeaderboard,
    });
  };

  return {
    prefetchCarbon,
    prefetchAchievements,
    prefetchLeaderboard,
  };
};

/**
 * Clear all cache (useful for logout)
 */
export const useClearCache = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.clear();
  };
};
