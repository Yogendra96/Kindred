import React, { type ReactNode } from 'react';

// Global type declarations
declare global {
  var __DEV__: boolean;
}

// Mock QueryClient and QueryClientProvider for development
interface QueryClientConfig {
  defaultOptions?: {
    queries?: {
      staleTime?: number;
      gcTime?: number;
      retry?:
        | boolean
        | number
        | ((failureCount: number, error: any) => boolean);
      refetchOnWindowFocus?: boolean;
      refetchOnReconnect?: boolean;
    };
    mutations?: {
      retry?: boolean | number;
    };
  };
}

class QueryClient {
  constructor(config?: QueryClientConfig) {
    // Mock implementation
  }
}

interface QueryClientProviderProps {
  client: QueryClient;
  children: ReactNode;
}

const QueryClientProvider: React.FC<QueryClientProviderProps> = ({
  children,
}) => {
  return <>{children}</>;
};

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Query keys factory
export const queryKeys = {
  all: ['kindred'] as const,
  carbon: () => [...queryKeys.all, 'carbon'] as const,
  carbonFootprint: (userId: string) =>
    [...queryKeys.carbon(), 'footprint', userId] as const,
  carbonHistory: (userId: string) =>
    [...queryKeys.carbon(), 'history', userId] as const,
  carbonGoals: (userId: string) =>
    [...queryKeys.carbon(), 'goals', userId] as const,
  ecoTips: () => [...queryKeys.all, 'ecoTips'] as const,
  ecoTipsByCategory: (category: string) =>
    [...queryKeys.ecoTips(), category] as const,
  user: () => [...queryKeys.all, 'user'] as const,
  userProfile: (userId: string) =>
    [...queryKeys.user(), 'profile', userId] as const,
  userAchievements: (userId: string) =>
    [...queryKeys.user(), 'achievements', userId] as const,
  leaderboard: () => [...queryKeys.all, 'leaderboard'] as const,
  marketplace: () => [...queryKeys.all, 'marketplace'] as const,
  marketplaceProducts: () => [...queryKeys.marketplace(), 'products'] as const,
  analytics: () => [...queryKeys.all, 'analytics'] as const,
  recommendations: (userId: string) =>
    [...queryKeys.all, 'recommendations', userId] as const,
};

// Utility functions for cache management
export const invalidateQueries = {
  carbon: () => queryClient.invalidateQueries({ queryKey: queryKeys.carbon() }),
  carbonFootprint: (userId: string) =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.carbonFootprint(userId),
    }),
  ecoTips: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.ecoTips() }),
  user: () => queryClient.invalidateQueries({ queryKey: queryKeys.user() }),
  leaderboard: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard() }),
  all: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
};

// Prefetch utilities
export const prefetchQueries = {
  carbonFootprint: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.carbonFootprint(userId),
      staleTime: 5 * 60 * 1000,
    });
  },
  ecoTips: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.ecoTips(),
      staleTime: 30 * 60 * 1000, // 30 minutes for tips
    });
  },
};
