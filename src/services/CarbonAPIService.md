# CarbonAPIService Documentation

## Overview

The **CarbonAPIService** is the core service responsible for carbon footprint calculations, external API integration, and environmental data management. It provides real-time carbon emission calculations across multiple categories (transport, energy, food, waste) with smart caching and fallback mechanisms.

## Key Features

- ✅ **Real-time carbon calculations** with external API integration
- ✅ **Smart caching system** with TTL management
- ✅ **Fallback calculations** when APIs are unavailable
- ✅ **Rate limiting** with exponential backoff (100 requests/minute)
- ✅ **Batch processing** for multiple calculations
- ✅ **Regional emission factors** for accurate localized calculations
- ✅ **Product barcode scanning** integration
- ✅ **Performance monitoring** with <200ms response time target

## API Reference

### Core Methods

#### `calculateEmissions(data: ActivityData): Promise<CarbonFootprint>`
Calculates carbon emissions for a given activity.

```typescript
const footprint = await CarbonAPIService.calculateEmissions({
  type: 'transport',
  mode: 'car',
  distance: 15.5,
  region: 'US',
  timestamp: new Date().toISOString()
});

// Returns:
// {
//   transport: 3.2,
//   energy: 0,
//   food: 0,
//   waste: 0,
//   total: 3.2,
//   confidence: 0.95
// }
```

#### `getEmissionFactors(region: string, category?: string): Promise<EmissionFactors>`
Retrieves emission factors for a specific region and category.

```typescript
const factors = await CarbonAPIService.getEmissionFactors('US', 'transport');

// Returns:
// {
//   car: { perKm: 0.21, unit: 'kg CO2e' },
//   bus: { perKm: 0.05, unit: 'kg CO2e' },
//   train: { perKm: 0.03, unit: 'kg CO2e' }
// }
```

#### `batchCalculate(activities: ActivityData[]): Promise<CarbonFootprint[]>`
Processes multiple activities efficiently in a single request.

```typescript
const results = await CarbonAPIService.batchCalculate([
  { type: 'transport', mode: 'car', distance: 10 },
  { type: 'energy', source: 'electricity', amount: 25 },
  { type: 'food', category: 'meat', servings: 2 }
]);
```

#### `getProductFootprint(barcode: string): Promise<ProductFootprint>`
Gets carbon footprint data for a product via barcode.

```typescript
const product = await CarbonAPIService.getProductFootprint('1234567890123');

// Returns:
// {
//   name: 'Organic Bananas',
//   category: 'food',
//   carbonFootprint: 0.5,
//   unit: 'kg CO2e per kg',
//   source: 'verified'
// }
```

### Analytics & History Methods

#### `getHistory(userId: string, options?: HistoryOptions): Promise<HistoryEntry[]>`
Retrieves user's carbon footprint history.

```typescript
const history = await CarbonAPIService.getHistory('user123', {
  days: 30,
  category: 'transport',
  aggregation: 'daily'
});
```

#### `getCarbonBudget(userId: string): Promise<CarbonBudget>`
Gets user's carbon budget and progress.

```typescript
const budget = await CarbonAPIService.getCarbonBudget('user123');

// Returns:
// {
//   monthly: 500,
//   current: 342.5,
//   remaining: 157.5,
//   daysLeft: 12,
//   onTrack: true
// }
```

#### `getCarbonTrends(userId: string, period: string): Promise<TrendData>`
Analyzes carbon footprint trends over time.

```typescript
const trends = await CarbonAPIService.getCarbonTrends('user123', 'monthly');

// Returns:
// {
//   trend: 'decreasing',
//   changePercent: -12.5,
//   categories: {
//     transport: -15.2,
//     energy: -8.1,
//     food: 2.3
//   }
// }
```

### Recommendation Methods

#### `getRecommendations(userId: string, context?: RecommendationContext): Promise<Recommendation[]>`
Gets personalized carbon reduction recommendations.

```typescript
const recommendations = await CarbonAPIService.getRecommendations('user123', {
  location: { lat: 37.7749, lng: -122.4194 },
  timeOfDay: 'morning',
  preferences: ['public_transport', 'vegetarian']
});
```

### Cache Management

#### `clearCache(category?: string): Promise<void>`
Clears service cache for a specific category or all data.

```typescript
// Clear all cache
await CarbonAPIService.clearCache();

// Clear specific category
await CarbonAPIService.clearCache('transport');
```

#### `getCacheStats(): CacheStats`
Returns cache usage statistics.

```typescript
const stats = CarbonAPIService.getCacheStats();

// Returns:
// {
//   size: '2.5MB',
//   entries: 1247,
//   hitRate: 0.89,
//   oldestEntry: '2024-01-15T10:30:00Z'
// }
```

### Service Health & Monitoring

#### `isHealthy(): Promise<boolean>`
Checks service health status.

```typescript
const healthy = await CarbonAPIService.isHealthy();
if (!healthy) {
  console.warn('CarbonAPIService is unhealthy');
}
```

#### `getMetrics(): ServiceMetrics`
Returns comprehensive service performance metrics.

```typescript
const metrics = CarbonAPIService.getMetrics();

// Returns:
// {
//   responseTime: { avg: 156, p95: 234, p99: 445 },
//   errorRate: 0.02,
//   requestCount: 15623,
//   cacheHitRate: 0.89,
//   memoryUsage: '18.5MB'
// }
```

## Configuration

### Environment Variables

```bash
# Required
CARBON_API_KEY=your_api_key_here
CARBON_API_BASE_URL=https://api.carbonfact.com

# Optional
CARBON_API_TIMEOUT=5000
CARBON_CACHE_TTL=1800000
CARBON_RATE_LIMIT=100
CARBON_FALLBACK_ENABLED=true
```

### Service Configuration

```typescript
const config = {
  apiKey: process.env.CARBON_API_KEY,
  baseURL: process.env.CARBON_API_BASE_URL,
  timeout: 5000,
  retries: 3,
  cacheTTL: {
    emissionFactors: 24 * 60 * 60 * 1000, // 24 hours
    calculations: 30 * 60 * 1000,         // 30 minutes
    products: 7 * 24 * 60 * 60 * 1000     // 7 days
  },
  rateLimit: {
    requests: 100,
    windowMs: 60 * 1000 // 1 minute
  }
};
```

## Error Handling

### Error Types

```typescript
// Network errors
try {
  const result = await CarbonAPIService.calculateEmissions(data);
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    // Falls back to cached data or offline calculations
    console.log('Using fallback calculation');
  }
}

// Rate limit errors
catch (error) {
  if (error.code === 'RATE_LIMITED') {
    // Automatic exponential backoff retry
    console.log('Rate limited, retrying in', error.retryAfter, 'ms');
  }
}

// Validation errors
catch (error) {
  if (error.code === 'VALIDATION_ERROR') {
    console.error('Invalid input data:', error.details);
  }
}
```

### Fallback Strategies

1. **Cached Data**: Uses previously calculated values
2. **Offline Calculations**: Uses built-in emission factors
3. **Graceful Degradation**: Returns estimated values with lower confidence

```typescript
// Service automatically handles fallbacks
const result = await CarbonAPIService.calculateEmissions(data);

// Check if result is from fallback
if (result.source === 'cache' || result.confidence < 0.8) {
  // Handle reduced accuracy scenario
  showUser('Estimated calculation (offline mode)');
}
```

## Performance Optimization

### Response Time Targets
- **Primary calculations**: < 200ms
- **Batch operations**: < 500ms  
- **Cache retrieval**: < 50ms
- **Product lookups**: < 300ms

### Memory Management
- **Cache size limit**: 20MB
- **Automatic cleanup**: Removes entries older than 24 hours
- **LRU eviction**: Removes least recently used items when limit reached

### Best Practices

```typescript
// ✅ DO: Use batch processing for multiple calculations
const results = await CarbonAPIService.batchCalculate(activities);

// ❌ DON'T: Make individual API calls
activities.forEach(async (activity) => {
  await CarbonAPIService.calculateEmissions(activity); // Inefficient!
});

// ✅ DO: Check cache before expensive operations
const cached = CarbonAPIService.getCachedResult(key);
if (!cached) {
  const result = await CarbonAPIService.calculateEmissions(data);
}

// ✅ DO: Handle errors gracefully
try {
  const result = await CarbonAPIService.calculateEmissions(data);
} catch (error) {
  // Service handles fallback automatically
  console.warn('API call failed, using fallback:', error);
}
```

## Integration Examples

### React Component Integration

```typescript
import { CarbonAPIService } from '@services/CarbonAPIService';
import { usePerformanceMonitoring } from '@hooks/usePerformanceMonitoring';

const CarbonCalculator = () => {
  const [footprint, setFootprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const { measureAsync } = usePerformanceMonitoring();

  const calculateFootprint = async (activityData) => {
    setLoading(true);
    try {
      const result = await measureAsync('carbon_calculation', 
        () => CarbonAPIService.calculateEmissions(activityData)
      );
      setFootprint(result);
    } catch (error) {
      console.error('Calculation failed:', error);
      // Service automatically falls back to offline calculation
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {footprint && (
        <Text>Carbon Footprint: {footprint.total} kg CO2e</Text>
      )}
      {footprint?.source === 'cache' && (
        <Text style={{ color: 'orange' }}>
          Estimated (offline calculation)
        </Text>
      )}
    </View>
  );
};
```

### Redux Integration

```typescript
// Redux Thunk action
export const calculateCarbonFootprint = (activityData) => async (dispatch) => {
  dispatch({ type: 'CARBON_CALCULATION_START' });
  
  try {
    const result = await CarbonAPIService.calculateEmissions(activityData);
    dispatch({ 
      type: 'CARBON_CALCULATION_SUCCESS', 
      payload: result 
    });
    
    // Track analytics
    EnhancedAnalyticsService.trackEvent('carbon_calculated', {
      category: activityData.type,
      emissions: result.total
    });
    
  } catch (error) {
    dispatch({ 
      type: 'CARBON_CALCULATION_ERROR', 
      payload: error.message 
    });
  }
};
```

## Testing

### Unit Tests

```typescript
import { CarbonAPIService } from '../CarbonAPIService';

// Mock external dependencies
jest.mock('@react-native-firebase/firestore');

describe('CarbonAPIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CarbonAPIService.clearCache();
  });

  it('should calculate emissions correctly', async () => {
    const activityData = {
      type: 'transport',
      mode: 'car',
      distance: 10
    };

    const result = await CarbonAPIService.calculateEmissions(activityData);
    
    expect(result.total).toBeGreaterThan(0);
    expect(result.transport).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should handle API failures gracefully', async () => {
    // Simulate network error
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await CarbonAPIService.calculateEmissions(activityData);
    
    // Should fallback to offline calculation
    expect(result).toBeDefined();
    expect(result.source).toBe('fallback');
  });

  it('should respect rate limits', async () => {
    // Make 101 requests (exceeds limit of 100/minute)
    const promises = Array(101).fill().map(() => 
      CarbonAPIService.calculateEmissions(activityData)
    );

    const results = await Promise.allSettled(promises);
    const rejected = results.filter(r => r.status === 'rejected');
    
    expect(rejected.length).toBeGreaterThan(0);
    expect(rejected[0].reason.code).toBe('RATE_LIMITED');
  });
});
```

### Performance Tests

```typescript
describe('CarbonAPIService Performance', () => {
  it('should respond within 200ms', async () => {
    const start = Date.now();
    await CarbonAPIService.calculateEmissions(activityData);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(200);
  });

  it('should handle batch processing efficiently', async () => {
    const activities = Array(10).fill(activityData);
    
    const start = Date.now();
    await CarbonAPIService.batchCalculate(activities);
    const duration = Date.now() - start;
    
    // Should be faster than individual calculations
    expect(duration).toBeLessThan(500);
  });
});
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   ```
   Error: CarbonAPIService: Invalid API key
   Solution: Check CARBON_API_KEY environment variable
   ```

2. **Rate Limit Exceeded**
   ```
   Error: Rate limit exceeded, retry after 60000ms
   Solution: Service automatically retries with exponential backoff
   ```

3. **Network Timeout**
   ```
   Error: Request timeout after 5000ms
   Solution: Service falls back to cached/offline calculation
   ```

### Debug Commands

```typescript
// Enable debug mode
CarbonAPIService.setDebugMode(true);

// Get service status
console.log('Service health:', await CarbonAPIService.isHealthy());
console.log('Cache stats:', CarbonAPIService.getCacheStats());
console.log('Metrics:', CarbonAPIService.getMetrics());

// Clear cache and reset
await CarbonAPIService.clearCache();
await CarbonAPIService.initialize();
```

---

**CarbonAPIService** is the foundation of carbon tracking in Kindred, providing reliable, fast, and accurate carbon footprint calculations with comprehensive error handling and fallback mechanisms.