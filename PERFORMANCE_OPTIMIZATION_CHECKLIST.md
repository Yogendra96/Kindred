# ⚡ Performance Optimization Checklist

## Mobile-First Performance Standards

### 🎯 Performance Targets (React Native)
| Metric | Target | Critical Threshold | Tool/Method |
|--------|--------|-------------------|-------------|
| **App Startup** | < 3 seconds | 5 seconds | `enhancedPerformanceService` |
| **Memory Usage** | < 200MB | 400MB | `enhancedMemoryManager` |
| **Bundle Size** | < 150MB | 200MB | `advancedBundleOptimizer` |
| **Network Latency** | < 1 second | 3 seconds | `networkPerformanceOptimizer` |
| **Render Time** | < 16ms (60fps) | 32ms (30fps) | `usePerformanceMonitoring` |
| **Battery Impact** | Low | Medium | Platform monitoring |

## 🚀 Performance Services Integration

### **1. Bundle Optimization**
```typescript
// Use the Advanced Bundle Optimizer
import { advancedBundleOptimizer } from '@services/AdvancedBundleOptimizer';

// Check bundle health
const analysis = await advancedBundleOptimizer.analyzeAppBundle();
const recommendations = advancedBundleOptimizer.getTopOptimizations(5);
const health = advancedBundleOptimizer.checkPerformanceTargets();

console.log(`Bundle Health: ${health.score}/100`);
```

### **2. Memory Management**
```typescript
// Use Enhanced Memory Manager
import { enhancedMemoryManager } from '@services/EnhancedMemoryManager';

// Monitor memory health
await enhancedMemoryManager.initialize();
const analysis = await enhancedMemoryManager.getMemoryAnalysis();
const health = enhancedMemoryManager.getMemoryHealthStatus();

// Cleanup when needed
if (health.status === 'critical') {
  await enhancedMemoryManager.performMemoryCleanup(true);
}
```

### **3. Network Optimization**
```typescript
// Use Network Performance Optimizer
import { networkPerformanceOptimizer } from '@services/NetworkPerformanceOptimizer';

// Optimize requests
const response = await networkPerformanceOptimizer.optimizeRequest(url, {
  priority: 'high',
  method: 'GET'
});

// Check network health
const analysis = await networkPerformanceOptimizer.analyzeNetworkPerformance();
```

## 📱 React Native Specific Optimizations

### **Component Performance**
```typescript
// Use performance monitoring hook
import { usePerformanceMonitoring } from '@hooks/usePerformanceMonitoring';

const MyComponent = () => {
  const { renderTime } = usePerformanceMonitoring({
    threshold: 16, // 60fps threshold
    onSlowRender: (time) => console.warn(`Slow render: ${time}ms`)
  });

  // Use React.memo for expensive components
  return React.memo(() => <ExpensiveComponent />);
};
```

### **Image Optimization**
```typescript
// Use FastImage for better caching
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  style={{ width: 100, height: 100 }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### **List Performance**
```typescript
// Use optimized FlatList patterns
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={20}
  windowSize={21}
  getItemLayout={getItemLayout} // If item height is fixed
/>
```

## 🧠 Memory Optimization Strategies

### **1. Component Cleanup**
```typescript
useEffect(() => {
  // Setup subscriptions
  const subscription = someService.subscribe(callback);
  
  return () => {
    // Cleanup subscriptions
    subscription.unsubscribe();
  };
}, []);
```

### **2. Image Memory Management**
```typescript
// Use enhancedMemoryManager for image cleanup
const cleanupImages = async () => {
  const result = await enhancedMemoryManager.performMemoryCleanup();
  console.log(`Cleaned ${result.savings} bytes`);
};
```

### **3. Service Memory Monitoring**
```typescript
// Monitor service memory usage
const breakdown = enhancedMemoryManager.getMemoryBreakdown();
if (breakdown) {
  console.log(`Images: ${breakdown.images} bytes`);
  console.log(`Components: ${breakdown.components} bytes`);
  console.log(`Services: ${breakdown.services} bytes`);
}
```

## 🌐 Network Performance

### **1. Request Optimization**
```typescript
// Use intelligent caching and retry
const optimizedFetch = async (url: string) => {
  return await networkPerformanceOptimizer.optimizeRequest(url, {
    priority: 'medium',
    headers: { 'Cache-Control': 'max-age=3600' }
  });
};
```

### **2. Background Sync**
```typescript
// Use network-aware requests
const syncData = async () => {
  const connectionQuality = await networkPerformanceOptimizer.analyzeNetworkPerformance();
  
  if (connectionQuality.reliability > 0.8) {
    // Good connection - sync everything
    await fullSync();
  } else {
    // Poor connection - sync critical data only
    await criticalSync();
  }
};
```

## 📊 Performance Monitoring

### **1. Real-time Metrics**
```typescript
// Monitor app performance continuously
import { observabilityService } from '@services/ObservabilityService';

const trackUserAction = async (action: string) => {
  const startTime = performance.now();
  
  try {
    await performAction();
    
    const duration = performance.now() - startTime;
    await observabilityService.trackMetric('user_action_duration', {
      action,
      duration,
      success: true
    });
  } catch (error) {
    await observabilityService.trackError('user_action_failed', error);
  }
};
```

### **2. Performance Alerts**
```typescript
// Set up performance alerts
const checkPerformanceThresholds = () => {
  const memoryHealth = enhancedMemoryManager.getMemoryHealthStatus();
  
  if (memoryHealth.status === 'critical') {
    console.warn('🚨 Critical memory usage detected!');
    // Trigger cleanup or user notification
  }
};
```

## 🔋 Battery Optimization

### **1. Background Processing**
```typescript
// Use background tasks efficiently
import BackgroundJob from 'react-native-background-job';

const startBackgroundSync = () => {
  BackgroundJob.start({
    jobKey: 'carbonSync',
    period: 300000, // 5 minutes
    requiredNetworkType: BackgroundJob.UNMETERED, // WiFi only
  });
};
```

### **2. Location Services**
```typescript
// Optimize location tracking
import { LocationService } from '@services/LocationService';

const optimizedLocationTracking = async () => {
  const location = await LocationService.getCurrentLocation({
    accuracy: 'balanced', // Not highest accuracy
    timeout: 10000,
    maximumAge: 300000 // 5 minutes cache
  });
};
```

## 🚀 Bundle Optimization

### **1. Code Splitting**
```typescript
// Use React.lazy for route-based splitting
const ProfileScreen = React.lazy(() => import('@screens/ProfileScreen'));
const AnalyticsScreen = React.lazy(() => import('@screens/AnalyticsScreen'));

// Use dynamic imports for heavy libraries
const loadChartLibrary = async () => {
  const { Chart } = await import('react-native-chart-kit');
  return Chart;
};
```

### **2. Tree Shaking**
```typescript
// Use named imports to enable tree shaking
import { calculateEmissions } from '@services/CarbonAPIService'; // ✅ Good
import * as CarbonAPI from '@services/CarbonAPIService'; // ❌ Bad

// Import only what you need from libraries
import { format } from 'date-fns'; // ✅ Good
import * as dateFns from 'date-fns'; // ❌ Bad
```

## 🔍 Performance Debugging

### **1. Debug Commands**
```bash
# Performance analysis
bun run bundle:analyze          # Bundle size analysis
bun run test:performance       # Performance tests
npx react-native-bundle-visualizer  # Visual bundle analysis

# Memory debugging
npx flipper                    # Memory profiler
```

### **2. Performance Profiling**
```typescript
// Use built-in profiler
const ProfiledComponent = React.memo(MyComponent);

// Or use custom performance tracking
const withPerformanceTracking = (Component) => {
  return (props) => {
    const startTime = performance.now();
    
    useEffect(() => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) {
        console.warn(`Slow component: ${renderTime}ms`);
      }
    });
    
    return <Component {...props} />;
  };
};
```

## ✅ Pre-Release Performance Checklist

### **Bundle Analysis**
- [ ] Bundle size under 150MB target
- [ ] No duplicate dependencies
- [ ] Tree shaking enabled
- [ ] Code splitting implemented for large screens

### **Memory Management**
- [ ] Memory usage under 200MB
- [ ] No memory leaks detected
- [ ] Image memory properly managed
- [ ] Component cleanup implemented

### **Network Performance**
- [ ] Request caching enabled
- [ ] Network retry logic implemented
- [ ] Background sync optimized
- [ ] Connection quality awareness

### **UI Performance**
- [ ] 60fps on target devices
- [ ] Smooth animations
- [ ] Optimized list rendering
- [ ] Image loading optimized

### **Battery Impact**
- [ ] Background processing minimized
- [ ] Location services optimized
- [ ] Network usage efficient
- [ ] CPU-intensive tasks optimized

---

**🎯 Use these performance services and patterns to maintain optimal app performance across all user scenarios!**