/**
 * CarbonAPIService Integration Tests
 * Tests the complete integration of CarbonAPIService with external APIs and other services
 */

import { CarbonAPIService } from '../../CarbonAPIService';
import { EnhancedAnalyticsService } from '../../EnhancedAnalyticsService';
import { EnhancedSecurityService } from '../../EnhancedSecurityService';

// Mock external dependencies
jest.mock('axios');
jest.mock('../../EnhancedAnalyticsService');
jest.mock('../../EnhancedSecurityService');

describe('CarbonAPIService Integration Tests', () => {
  let carbonService: CarbonAPIService;
  let mockAnalytics: jest.Mocked<EnhancedAnalyticsService>;
  let mockSecurity: jest.Mocked<EnhancedSecurityService>;

  beforeEach(() => {
    carbonService = new CarbonAPIService();
    mockAnalytics = EnhancedAnalyticsService as jest.Mocked<
      typeof EnhancedAnalyticsService
    >;
    mockSecurity = EnhancedSecurityService as jest.Mocked<
      typeof EnhancedSecurityService
    >;

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock responses
    mockSecurity.encrypt = jest.fn().mockResolvedValue('encrypted-data');
    mockSecurity.decrypt = jest.fn().mockResolvedValue('decrypted-data');
    mockAnalytics.trackEvent = jest.fn();
  });

  describe('Service Integration Flow', () => {
    it('should integrate with analytics service for emission calculations', async () => {
      const activityData = {
        type: 'transport',
        subtype: 'car',
        distance: 10,
        unit: 'km',
        fuelType: 'petrol',
      };

      // Mock successful API response
      const axios = require('axios');
      axios.post.mockResolvedValue({
        data: {
          emissions: 2.5,
          unit: 'kg CO2',
          factors: {
            distance: 10,
            emissionFactor: 0.25,
          },
        },
      });

      const result = await carbonService.calculateEmissions(activityData);

      // Verify analytics tracking
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'carbon_calculation_completed',
        expect.objectContaining({
          type: 'transport',
          emissions: 2.5,
          success: true,
        }),
      );

      expect(result.emissions).toBe(2.5);
    });

    it('should integrate with security service for data encryption', async () => {
      const sensitiveData = {
        userId: 'user-123',
        location: { lat: 40.7128, lng: -74.006 },
        activityType: 'transport',
      };

      // Mock encrypted storage
      mockSecurity.secureStore = jest.fn().mockResolvedValue();

      await carbonService.storeUserActivity(sensitiveData);

      // Verify security integration
      expect(mockSecurity.secureStore).toHaveBeenCalledWith(
        expect.stringContaining('user_activity'),
        expect.any(String), // Encrypted data
      );
    });

    it('should handle cross-service error propagation', async () => {
      const activityData = { type: 'transport', distance: 10 };

      // Mock analytics service failure
      mockAnalytics.trackEvent.mockImplementation(() => {
        throw new Error('Analytics service unavailable');
      });

      // Mock successful API call
      const axios = require('axios');
      axios.post.mockResolvedValue({
        data: { emissions: 2.5, unit: 'kg CO2' },
      });

      // Should still complete carbon calculation even if analytics fails
      const result = await carbonService.calculateEmissions(activityData);
      expect(result.emissions).toBe(2.5);

      // But should log the analytics error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Analytics tracking failed'),
      );
    });
  });

  describe('Data Persistence Integration', () => {
    it('should integrate with secure storage for caching results', async () => {
      const activityData = { type: 'energy', amount: 100, unit: 'kWh' };

      // Mock cache miss, then API call, then cache storage
      mockSecurity.secureRetrieve = jest
        .fn()
        .mockResolvedValueOnce(null) // Cache miss
        .mockResolvedValueOnce('cached-result'); // Cache hit on second call

      const axios = require('axios');
      axios.post.mockResolvedValue({
        data: { emissions: 45.2, unit: 'kg CO2' },
      });

      // First call - should hit API and cache result
      const result1 = await carbonService.calculateEmissions(activityData);
      expect(mockSecurity.secureStore).toHaveBeenCalledWith(
        expect.stringContaining('cache'),
        expect.any(String),
      );

      // Second call - should use cached result
      const result2 = await carbonService.calculateEmissions(activityData);
      expect(axios.post).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should sync data across multiple service instances', async () => {
      const service1 = new CarbonAPIService();
      const service2 = new CarbonAPIService();

      const activityData = {
        type: 'food',
        foodType: 'beef',
        amount: 1,
        unit: 'kg',
      };

      // Mock shared cache
      const sharedCache = new Map();
      mockSecurity.secureStore.mockImplementation(async (key, value) => {
        sharedCache.set(key, value);
      });
      mockSecurity.secureRetrieve.mockImplementation(async key => {
        return sharedCache.get(key) || null;
      });

      const axios = require('axios');
      axios.post.mockResolvedValue({
        data: { emissions: 60.0, unit: 'kg CO2' },
      });

      // Service1 calculates and caches
      await service1.calculateEmissions(activityData);

      // Service2 should get cached result
      const result = await service2.calculateEmissions(activityData);
      expect(result.emissions).toBe(60.0);

      // Verify API was only called once
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('Real-time Data Flow', () => {
    it('should stream real-time updates to subscribers', async () => {
      const subscribers = [];
      const mockSubscriber = jest.fn();
      subscribers.push(mockSubscriber);

      // Mock real-time emission data
      const emissionUpdate = {
        timestamp: Date.now(),
        totalEmissions: 125.5,
        todaysEmissions: 12.3,
        weeklyAverage: 15.8,
      };

      // Simulate real-time update
      await carbonService.broadcastEmissionUpdate(emissionUpdate);

      // Verify subscriber received update
      expect(mockSubscriber).toHaveBeenCalledWith(emissionUpdate);

      // Verify analytics tracking
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'realtime_emission_update',
        expect.objectContaining(emissionUpdate),
      );
    });

    it('should handle concurrent calculation requests', async () => {
      const activities = [
        { type: 'transport', distance: 5 },
        { type: 'transport', distance: 10 },
        { type: 'energy', amount: 50 },
      ];

      const axios = require('axios');
      axios.post
        .mockResolvedValueOnce({ data: { emissions: 1.25 } })
        .mockResolvedValueOnce({ data: { emissions: 2.5 } })
        .mockResolvedValueOnce({ data: { emissions: 22.6 } });

      // Execute concurrent requests
      const promises = activities.map(activity =>
        carbonService.calculateEmissions(activity),
      );

      const results = await Promise.all(promises);

      // Verify all calculations completed
      expect(results).toHaveLength(3);
      expect(results[0].emissions).toBe(1.25);
      expect(results[1].emissions).toBe(2.5);
      expect(results[2].emissions).toBe(22.6);

      // Verify proper analytics tracking for each
      expect(mockAnalytics.trackEvent).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const activities = Array.from({ length: 50 }, (_, i) => ({
        type: 'transport',
        distance: i + 1,
        unit: 'km',
      }));

      const axios = require('axios');
      axios.post.mockImplementation(() =>
        Promise.resolve({ data: { emissions: Math.random() * 10 } }),
      );

      // Execute load test
      const { result, metrics } =
        await global.performanceUtils.measureExecutionTime(
          () =>
            Promise.all(
              activities.map(activity =>
                carbonService.calculateEmissions(activity),
              ),
            ),
          'carbon_load_test',
        );

      expect(result).toHaveLength(50);

      // Performance assertions
      global.performanceUtils.assertPerformance(metrics, {
        maxRenderTime: 5000, // 5 second max for 50 calculations
      });
    });

    it('should handle memory efficiently with large datasets', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'transport',
        emissions: Math.random() * 100,
        timestamp: Date.now() - i * 1000,
      }));

      const initialMemory = global.performanceUtils.trackMemoryUsage();

      // Process large dataset
      await carbonService.batchProcessActivities(largeDataset);

      const finalMemory = global.performanceUtils.trackMemoryUsage();

      if (initialMemory && finalMemory) {
        const memoryDelta = finalMemory.used - initialMemory.used;
        expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      }
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from API failures using fallback data', async () => {
      const activityData = { type: 'transport', distance: 15 };

      // Mock API failure, then fallback data from cache
      const axios = require('axios');
      axios.post.mockRejectedValueOnce(new Error('API unavailable'));

      mockSecurity.secureRetrieve.mockResolvedValue(
        JSON.stringify({
          emissions: 3.75, // Fallback calculation
          source: 'fallback',
          timestamp: Date.now(),
        }),
      );

      const result = await carbonService.calculateEmissions(activityData);

      expect(result.emissions).toBe(3.75);
      expect(result.source).toBe('fallback');

      // Verify error was tracked
      expect(mockAnalytics.trackEvent).toHaveBeenCalledWith(
        'carbon_api_fallback',
        expect.objectContaining({
          reason: 'API unavailable',
          fallbackUsed: true,
        }),
      );
    });

    it('should maintain service availability during partial failures', async () => {
      // Mock analytics service failure but continue core functionality
      mockAnalytics.trackEvent.mockImplementation(() => {
        throw new Error('Analytics down');
      });

      const axios = require('axios');
      axios.post.mockResolvedValue({
        data: { emissions: 4.2, unit: 'kg CO2' },
      });

      const activityData = { type: 'transport', distance: 20 };
      const result = await carbonService.calculateEmissions(activityData);

      // Core functionality should still work
      expect(result.emissions).toBe(4.2);

      // Service should remain stable
      expect(carbonService.isHealthy()).toBe(true);
    });
  });

  describe('Integration Test Cleanup', () => {
    afterEach(async () => {
      // Clean up any test data
      await carbonService.clearTestData?.();

      // Reset service state
      carbonService.reset?.();

      // Clear performance metrics
      global.performanceUtils.clearMetrics();
    });
  });
});
