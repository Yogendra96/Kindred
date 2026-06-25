# Kindred Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Service Integration Issues

#### 1. **CarbonAPIService Initialization Failures**

**Problem**: Service fails to initialize or throws connection errors

```
Error: CarbonAPIService initialization failed: Network timeout
```

**Diagnosis**:

```bash
# Check service health
bun run validate
curl -I https://api.carbon-service.com/health
```

**Solutions**:

```typescript
// 1. Check environment variables
console.log('Carbon API Key:', process.env.CARBON_API_KEY?.slice(0, 8) + '...');

// 2. Implement fallback initialization
try {
  await CarbonAPIService.initialize();
} catch (error) {
  console.warn('Primary API failed, using fallback calculations');
  CarbonAPIService.enableFallbackMode();
}

// 3. Clear cache and retry
await CarbonAPIService.clearCache();
await CarbonAPIService.initialize();
```

#### 2. **Performance Threshold Exceeded**

**Problem**: Components consistently exceeding 16ms render threshold

```
Warning: Component 'CarbonDashboard' render time: 45ms (threshold: 16ms)
```

**Diagnosis**:

```typescript
// Use performance profiler
const { renderTime, bottlenecks } = usePerformanceMonitoring({
  detailed: true,
  profileComponents: true,
});

console.log('Render bottlenecks:', bottlenecks);
```

**Solutions**:

```typescript
// 1. Implement React.memo with proper comparison
const CarbonDashboard = React.memo(
  ({ data, filters }) => {
    // Component logic
  },
  (prevProps, nextProps) => {
    return prevProps.data.timestamp === nextProps.data.timestamp;
  },
);

// 2. Use useMemo for expensive calculations
const expensiveCalculation = useMemo(() => {
  return data.reduce((acc, item) => acc + item.carbonValue, 0);
}, [data.length, data[0]?.timestamp]);

// 3. Implement virtual scrolling for large lists
import { VirtualizedList } from 'react-native';

// 4. Lazy load components
const LazyChart = lazy(() => import('./CarbonChart'));
```

#### 3. **Memory Leaks in Monitoring**

**Problem**: Memory usage continuously increasing

```
Warning: Memory usage: 250MB (threshold: 200MB)
Error: JavaScript heap out of memory
```

**Diagnosis**:

```bash
# Monitor memory in development
npm run test:performance -- --memory
```

**Solutions**:

```typescript
// 1. Proper cleanup in useEffect
useEffect(() => {
  const interval = setInterval(updateMetrics, 1000);
  const listener = AppState.addEventListener('change', handleAppState);

  return () => {
    clearInterval(interval);
    listener?.remove();
    // Clear any cached data
    PerformanceService.cleanup();
  };
}, []);

// 2. Limit data retention
const usePerformanceMonitoring = (options = {}) => {
  const [metrics, setMetrics] = useState([]);

  const addMetric = metric => {
    setMetrics(prev => [...prev.slice(-50), metric]); // Keep only last 50
  };
};

// 3. Use WeakMap for object associations
const componentMetrics = new WeakMap();
```

#### 4. **Authentication Token Expiry**

**Problem**: User randomly logged out or API calls failing

```
Error: Authentication failed: Token expired
Error: Session invalid
```

**Diagnosis**:

```typescript
// Check token status
const isValid = await EnhancedSecurityService.validateSession();
const tokenInfo = await EnhancedSecurityService.getTokenInfo();
console.log('Token expires at:', tokenInfo.expiresAt);
```

**Solutions**:

```typescript
// 1. Implement automatic token refresh
const apiCall = async (endpoint, data) => {
  try {
    return await api.request(endpoint, data);
  } catch (error) {
    if (error.status === 401) {
      await EnhancedSecurityService.refreshSession();
      return await api.request(endpoint, data); // Retry
    }
    throw error;
  }
};

// 2. Proactive token refresh
useEffect(() => {
  const checkTokenExpiry = async () => {
    const timeLeft = await EnhancedSecurityService.getTimeUntilExpiry();
    if (timeLeft < 5 * 60 * 1000) {
      // 5 minutes
      await EnhancedSecurityService.refreshSession();
    }
  };

  const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
  return () => clearInterval(interval);
}, []);
```

### Build & Environment Issues

#### 5. **Metro Bundle Failures**

**Problem**: Metro bundler fails or extremely slow

```
Error: Metro bundler failed to start
Error: Unable to resolve module '@services/CarbonAPIService'
```

**Diagnosis**:

```bash
# Clear all caches
bun run clean:all

# Check Metro config
npx react-native config

# Verify path resolution
node -e "console.log(require.resolve('./src/services/CarbonAPIService'))"
```

**Solutions**:

```bash
# 1. Reset Metro cache
bun run clean:metro
bun start --reset-cache

# 2. Reinstall dependencies
bun run reset

# 3. Check Babel configuration
# Ensure babel.config.js has correct module resolution

# 4. Verify import paths
# Use absolute imports: @services/CarbonAPIService
# Not relative: ../../services/CarbonAPIService
```

#### 6. **iOS Build Errors**

**Problem**: iOS build fails with CocoaPods errors

```
Error: CocoaPods could not find compatible versions for pod
Error: Undefined symbol: _OBJC_CLASS_$_TensorFlowLiteSwift
```

**Solutions**:

```bash
# 1. Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
cd ..
bun run pod:install

# 2. Update CocoaPods
sudo gem install cocoapods
pod repo update

# 3. Clear Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# 4. For TensorFlow issues
cd ios
pod install --repo-update
```

#### 7. **Android Build Errors**

**Problem**: Android build fails with Gradle errors

```
Error: Task ':app:bundleReleaseJsAndAssets' FAILED
Error: Could not resolve all files for configuration ':app:debugRuntimeClasspath'
```

**Solutions**:

```bash
# 1. Clean Gradle cache
cd android
./gradlew clean
rm -rf .gradle
cd ..

# 2. Reset Android project
bun run clean:gradle
bun run clean:all

# 3. Check Java version
java -version # Should be Java 11+

# 4. Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version=7.6
```

### Testing Issues

#### 8. **E2E Test Failures**

**Problem**: Detox tests failing or flaky

```
Error: DetoxError: Failed to locate element with testID 'carbon-dashboard'
Error: Test timed out after 60000ms
```

**Solutions**:

```bash
# 1. Rebuild test apps
bun run test:e2e:build

# 2. Reset simulator
xcrun simctl erase all

# 3. Check test device setup
detox test --configuration ios.sim.debug --loglevel verbose

# 4. Update testIDs in components
<View testID="carbon-dashboard">
  <Text testID="carbon-total">42.5</Text>
</View>
```

#### 9. **Jest Test Failures**

**Problem**: Unit tests failing with mock errors

```
Error: Cannot find module '@services/CarbonAPIService'
Error: TypeError: mockImplementation is not a function
```

**Solutions**:

```typescript
// 1. Check Jest configuration in jest.config.js
moduleNameMapper: {
  '^@services/(.*)$': '<rootDir>/src/services/$1',
}

// 2. Proper service mocking
jest.mock('@services/CarbonAPIService', () => ({
  CarbonAPIService: {
    calculateEmissions: jest.fn(),
    getHistory: jest.fn(),
  }
}));

// 3. Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Performance Issues

#### 10. **Slow App Launch**

**Problem**: App takes >5 seconds to launch

```
Performance: App launch took 8.2 seconds (target: <3 seconds)
```

**Solutions**:

```typescript
// 1. Lazy load non-critical services
const initializeApp = async () => {
  // Critical services first
  await EnhancedSecurityService.initialize();
  await CarbonAPIService.initialize();

  // Non-critical services in background
  setTimeout(() => {
    AchievementSystem.initialize();
    SmartRecommendationsEngine.initialize();
  }, 1000);
};

// 2. Optimize bundle size
bun run bundle:analyze

// 3. Use Hermes engine (already enabled)
// 4. Implement splash screen properly
```

#### 11. **High Memory Usage**

**Problem**: App using >200MB RAM

```
Warning: Memory usage: 285MB (target: <200MB)
```

**Solutions**:

```typescript
// 1. Monitor component memory usage
const useMemoryMonitoring = () => {
  useEffect(() => {
    const checkMemory = () => {
      if (performance.memory) {
        console.log('Memory:', performance.memory.usedJSHeapSize / 1048576, 'MB');
      }
    };

    const interval = setInterval(checkMemory, 5000);
    return () => clearInterval(interval);
  }, []);
};

// 2. Implement image caching limits
const IMAGE_CACHE_LIMIT = 50 * 1024 * 1024; // 50MB

// 3. Clear unused data periodically
useEffect(() => {
  const cleanup = () => {
    CarbonAPIService.clearOldCache();
    PerformanceService.clearOldMetrics();
  };

  const interval = setInterval(cleanup, 30 * 60 * 1000); // 30 minutes
  return () => clearInterval(interval);
}, []);
```

## 🔍 Diagnostic Commands

### Environment Check

```bash
# Complete environment validation
bun run validate

# Check specific areas
bun run lint
bun run typecheck
bun run test:unit

# Performance analysis
bun run test:performance
bun run bundle:analyze
```

### Service Health Check

```typescript
// Add to DevTools component for debugging
const ServiceHealthChecker = () => {
  const [health, setHealth] = useState({});

  useEffect(() => {
    const checkServices = async () => {
      const services = [
        'CarbonAPIService',
        'EnhancedSecurityService',
        'EnhancedPerformanceService',
        'LocationService',
        'MLCarbonPrediction',
      ];

      const healthCheck = {};
      for (const service of services) {
        try {
          healthCheck[service] = (await window[service]?.isHealthy()) || false;
        } catch (error) {
          healthCheck[service] = false;
        }
      }

      setHealth(healthCheck);
    };

    checkServices();
  }, []);

  return (
    <View>
      {Object.entries(health).map(([service, isHealthy]) => (
        <Text key={service} style={{ color: isHealthy ? 'green' : 'red' }}>
          {service}: {isHealthy ? '✅' : '❌'}
        </Text>
      ))}
    </View>
  );
};
```

### Debug Mode Activation

```typescript
// Add to development builds
if (__DEV__) {
  // Enable debug mode for all services
  global.DEBUG_SERVICES = true;

  // Add debug utilities
  global.debugUtils = {
    clearAllCaches: () => {
      CarbonAPIService.clearCache();
      EnhancedPerformanceService.clearMetrics();
    },
    resetServices: () => {
      // Re-initialize all services
    },
    getServiceMetrics: () => {
      return {
        carbon: CarbonAPIService.getMetrics(),
        performance: EnhancedPerformanceService.getMetrics(),
        security: EnhancedSecurityService.getMetrics(),
      };
    },
  };
}
```

## 📞 Getting Help

### Internal Resources

1. **ARCHITECTURE.md** - System architecture and design patterns
2. **PROJECT_OVERVIEW.md** - Feature overview and capabilities
3. **DEVELOPMENT_GUIDE.md** - Extended development practices
4. **PERFORMANCE_GUIDE.md** - Performance optimization guide

### When to Escalate

- Service initialization failures persisting >1 hour
- Memory leaks not resolved by standard cleanup
- Performance degradation >50% from baseline
- Security service failures or encryption errors
- Critical user-facing bugs in production

### Debug Information to Collect

```typescript
const debugInfo = {
  version: require('./package.json').version,
  platform: Platform.OS,
  device: DeviceInfo.getModel(),
  memory: performance.memory?.usedJSHeapSize,
  services: global.debugUtils?.getServiceMetrics(),
  errors: ErrorBoundary.getLastErrors(),
  performance: PerformanceService.getSummary(),
};

console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
```

---

**Remember**: Most issues can be resolved by following the service-first architecture and using the
built-in error handling and recovery mechanisms. When in doubt, check service health and clear
caches first.
