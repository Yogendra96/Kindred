# ⚡ Service Integration Quick Reference

## 🎯 Critical Service Dependencies (Instant Lookup)

### **Central Hub Pattern**
```
ObservabilityService ← 16+ services (ALL track metrics here)
├── CarbonAPIService → MLCarbonPrediction → CarbonTwinEngine
├── EnhancedPerformanceService → AdvancedBundleOptimizer
├── EnhancedMemoryManager → NetworkPerformanceOptimizer  
├── ClimateModelingEngine → CarbonAPIService
└── SecurityMonitoringService → All sensitive operations
```

### **🚨 Integration Failure Quick Fixes**

#### **ObservabilityService Connection Failed**
```typescript
// Quick Fix: Check if service is initialized
if (!observabilityService.isInitialized()) {
  await observabilityService.initialize();
}

// Emergency fallback: Disable tracking temporarily
const safeTrack = (metric, data) => {
  try {
    observabilityService.trackMetric(metric, data);
  } catch (error) {
    console.warn('Observability tracking failed:', error);
  }
};
```

#### **Memory Manager Critical Status**
```typescript
// Emergency cleanup when memory critical
const emergencyCleanup = async () => {
  const health = enhancedMemoryManager.getMemoryHealthStatus();
  if (health.status === 'critical') {
    await enhancedMemoryManager.performMemoryCleanup(true);
    console.log(`Emergency cleanup freed ${health.savings} bytes`);
  }
};
```

#### **Climate API Rate Limiting**
```typescript
// Handle rate limiting gracefully
const safeClimateRequest = async (coords) => {
  try {
    return await climateModelingEngine.getClimateProjection(coords);
  } catch (error) {
    if (error.status === 429) {
      console.warn('Rate limited, using cached data');
      return climateModelingEngine.getCachedProjection(coords);
    }
    throw error;
  }
};
```

## 🔧 Common Integration Patterns

### **Pattern 1: Service with Observability**
```typescript
class YourNewService {
  async yourMethod() {
    const startTime = performance.now();
    try {
      const result = await this.processData();
      
      // ✅ REQUIRED: Track success
      await observabilityService.trackMetric('your_service_success', {
        duration: performance.now() - startTime,
        dataSize: result.length
      });
      
      return result;
    } catch (error) {
      // ✅ REQUIRED: Track errors
      await observabilityService.trackError('your_service_error', error);
      throw error;
    }
  }
}
```

### **Pattern 2: Memory-Aware Service**
```typescript
class MemoryAwareService {
  async processLargeData(data) {
    // Check memory before processing
    const memoryStatus = enhancedMemoryManager.getMemoryHealthStatus();
    
    if (memoryStatus.percentage > 80) {
      await enhancedMemoryManager.performMemoryCleanup();
    }
    
    // Process in chunks if memory constrained
    const chunkSize = memoryStatus.status === 'critical' ? 100 : 1000;
    return this.processInChunks(data, chunkSize);
  }
}
```

### **Pattern 3: Network-Optimized Service**
```typescript
class NetworkOptimizedService {
  async fetchData(url) {
    // ✅ Use network optimizer for all requests
    return await networkPerformanceOptimizer.optimizeRequest(url, {
      priority: 'medium',
      retryStrategy: 'exponential',
      cacheStrategy: 'smart'
    });
  }
}
```

## 📊 Service Health Quick Checks

### **System Health Command**
```typescript
const quickHealthCheck = async () => {
  const health = {
    memory: enhancedMemoryManager.getMemoryHealthStatus(),
    bundle: advancedBundleOptimizer.checkPerformanceTargets(),
    network: await networkPerformanceOptimizer.analyzeNetworkPerformance(),
    observability: observabilityService.getHealthStatus()
  };
  
  console.table(health);
  return health;
};

// Usage in development
// global.quickHealthCheck = quickHealthCheck;
```

### **Service Dependency Validation**
```typescript
const validateServiceDependencies = async () => {
  const checks = [
    { name: 'ObservabilityService', check: () => observabilityService.isInitialized() },
    { name: 'MemoryManager', check: () => enhancedMemoryManager.isRunning() },
    { name: 'BundleOptimizer', check: () => advancedBundleOptimizer.isEnabled() },
    { name: 'NetworkOptimizer', check: () => networkPerformanceOptimizer.isActive() }
  ];
  
  for (const { name, check } of checks) {
    const status = await check();
    console.log(`${name}: ${status ? '✅' : '❌'}`);
  }
};
```

## 🚨 Emergency Recovery Procedures

### **Service Cascade Failure Recovery**
```typescript
const emergencyServiceRecovery = async () => {
  console.log('🚨 Starting emergency service recovery...');
  
  // 1. Stop all non-critical services
  await Promise.allSettled([
    climateModelingEngine.pause(),
    advancedBundleOptimizer.pause(),
    // Keep core services running
  ]);
  
  // 2. Clear memory aggressively
  await enhancedMemoryManager.performMemoryCleanup(true);
  
  // 3. Reset network optimization
  await networkPerformanceOptimizer.reset();
  
  // 4. Restart services one by one
  await climateModelingEngine.restart();
  await advancedBundleOptimizer.restart();
  
  console.log('✅ Emergency recovery complete');
};
```

### **Performance Degradation Response**
```typescript
const handlePerformanceDegradation = async () => {
  const health = await quickHealthCheck();
  
  if (health.memory.status === 'critical') {
    await enhancedMemoryManager.performMemoryCleanup(true);
  }
  
  if (health.bundle.score < 70) {
    console.warn('Bundle performance degraded, analyzing...');
    const analysis = await advancedBundleOptimizer.analyzeAppBundle();
    console.log('Top optimizations:', analysis.optimizationSuggestions.slice(0, 3));
  }
  
  if (health.network.reliability < 0.8) {
    console.warn('Network issues detected, switching to offline mode');
    await networkPerformanceOptimizer.enableOfflineMode();
  }
};
```

## 🔍 Service Performance Thresholds

| Service | Memory Limit | Response Time | Action When Exceeded |
|---------|-------------|---------------|---------------------|
| CarbonAPIService | 20MB | 500ms | Cache more aggressively |
| MLCarbonPrediction | 50MB | 1000ms | Reduce model complexity |
| ClimateModelingEngine | 30MB | 2000ms | Use cached predictions |
| EnhancedMemoryManager | 5MB | 100ms | Limit metrics history |
| AdvancedBundleOptimizer | 10MB | 200ms | Reduce analysis depth |

## 📱 Mobile-Specific Considerations

### **Battery Optimization Integration**
```typescript
const batteryAwareOperation = async (operation) => {
  const batteryLevel = await DeviceInfo.getBatteryLevel();
  
  if (batteryLevel < 0.2) {
    // Low battery: reduce service intensity
    await enhancedMemoryManager.enableLowPowerMode();
    await networkPerformanceOptimizer.enableBatterySavingMode();
  }
  
  return await operation();
};
```

### **Network Awareness Integration**
```typescript
const networkAwareOperation = async (operation) => {
  const networkInfo = await networkPerformanceOptimizer.getNetworkInfo();
  
  if (networkInfo.type === 'cellular' && networkInfo.isMetered) {
    // Cellular connection: optimize for data usage
    await climateModelingEngine.enableDataSavingMode();
  }
  
  return await operation();
};
```

---

**🎯 Use this reference for instant service integration and quick problem resolution!**