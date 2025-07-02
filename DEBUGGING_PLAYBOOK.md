# 🔍 Debugging Playbook

## Emergency Debugging Workflows

### 🚨 App Won't Start

#### **Metro Bundler Issues**
```bash
# Step 1: Clear all caches
bun run clean:metro
bun run clean:watchman

# Step 2: Reset dependencies
rm -rf node_modules
bun install

# Step 3: Reset React Native
bun run reset

# Step 4: Check for port conflicts
lsof -ti:8081 | xargs kill -9  # Kill Metro on port 8081
```

#### **iOS Build Failures**
```bash
# Step 1: Clean iOS build
cd ios && xcodebuild clean
cd .. && rm -rf ios/build

# Step 2: Reset Pods
bun run clean:pods
bun run pod:install

# Step 3: Check iOS simulator
xcrun simctl list devices  # List available simulators
```

#### **Android Build Failures**
```bash
# Step 1: Clean Android build
bun run clean:gradle
cd android && ./gradlew clean && cd ..

# Step 2: Check Android setup
bun run doctor  # React Native environment check

# Step 3: Reset ADB
adb kill-server && adb start-server
```

### 💾 Memory Issues

#### **Memory Leak Detection**
```typescript
// Use Enhanced Memory Manager for diagnosis
const diagnoseMemoryLeaks = async () => {
  const analysis = await enhancedMemoryManager.getMemoryAnalysis();
  
  console.log('=== MEMORY ANALYSIS ===');
  console.log(`Total Usage: ${analysis.totalUsage} MB`);
  console.log(`Available: ${analysis.available} MB`);
  console.log(`Peak Usage: ${analysis.peak} MB`);
  
  if (analysis.leaks.length > 0) {
    console.log('\n🚨 MEMORY LEAKS DETECTED:');
    analysis.leaks.forEach(leak => {
      console.log(`- ${leak.source}: ${leak.size} MB (${leak.type})`);
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  analysis.recommendations.forEach(rec => {
    console.log(`- ${rec.action}: ${rec.description}`);
  });
};

// Usage: await diagnoseMemoryLeaks();
```

#### **Memory Cleanup Procedure**
```typescript
const emergencyMemoryCleanup = async () => {
  console.log('🧹 Starting emergency memory cleanup...');
  
  // Step 1: Check current status
  const health = enhancedMemoryManager.getMemoryHealthStatus();
  console.log(`Current status: ${health.status} (${health.percentage}%)`);
  
  // Step 2: Perform cleanup
  const result = await enhancedMemoryManager.performMemoryCleanup(true);
  console.log(`Cleanup result: ${result.success ? '✅' : '❌'}`);
  console.log(`Memory freed: ${result.savings} bytes`);
  
  // Step 3: Verify improvement
  const newHealth = enhancedMemoryManager.getMemoryHealthStatus();
  console.log(`New status: ${newHealth.status} (${newHealth.percentage}%)`);
};
```

### 📊 Performance Issues

#### **Bundle Size Analysis**
```typescript
const diagnoseBundleIssues = async () => {
  console.log('📦 Analyzing bundle performance...');
  
  const analysis = await advancedBundleOptimizer.analyzeAppBundle();
  
  console.log(`Bundle Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Gzipped: ${(analysis.gzippedSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (analysis.duplicates.length > 0) {
    console.log('\n🔍 DUPLICATE MODULES:');
    analysis.duplicates.forEach(dup => {
      console.log(`- ${dup.name}: ${dup.count} copies (${dup.size} bytes each)`);
    });
  }
  
  console.log('\n🚀 TOP OPTIMIZATIONS:');
  const topOptimizations = advancedBundleOptimizer.getTopOptimizations(5);
  topOptimizations.forEach((opt, i) => {
    console.log(`${i + 1}. ${opt.description} (Save: ${opt.expectedSavings} bytes)`);
  });
};
```

#### **Render Performance Debugging**
```typescript
// Add to slow component for debugging
const withRenderProfiling = (Component, componentName) => {
  return React.memo((props) => {
    const renderStart = performance.now();
    
    useEffect(() => {
      const renderTime = performance.now() - renderStart;
      if (renderTime > 16) {
        console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
        console.log('Props:', props);
        console.trace('Render trace');
      }
    });
    
    return <Component {...props} />;
  });
};

// Usage:
// export default withRenderProfiling(MyComponent, 'MyComponent');
```

### 🌐 Network Issues

#### **API Request Debugging**
```typescript
const debugNetworkRequests = async () => {
  const analysis = await networkPerformanceOptimizer.analyzeNetworkPerformance();
  
  console.log('🌐 NETWORK ANALYSIS');
  console.log(`Connection Type: ${analysis.connectionType}`);
  console.log(`Speed: ${analysis.speed} Mbps`);
  console.log(`Reliability: ${(analysis.reliability * 100).toFixed(1)}%`);
  console.log(`Latency: ${analysis.latency}ms`);
  
  if (analysis.reliability < 0.8) {
    console.log('\n⚠️ POOR NETWORK CONDITIONS DETECTED');
    console.log('Recommendations:');
    console.log('- Enable offline mode');
    console.log('- Reduce request frequency');
    console.log('- Use cached data when possible');
  }
};
```

#### **API Failure Recovery**
```typescript
const recoverFromAPIFailures = async (failedRequest) => {
  console.log('🔄 Attempting API failure recovery...');
  
  try {
    // Step 1: Check network status
    const networkStatus = await networkPerformanceOptimizer.analyzeNetworkPerformance();
    
    if (networkStatus.reliability < 0.5) {
      console.log('❌ Network too unreliable, switching to offline mode');
      return getCachedData(failedRequest);
    }
    
    // Step 2: Retry with optimized request
    const optimizedRequest = await networkPerformanceOptimizer.optimizeRequest(
      failedRequest.url,
      {
        ...failedRequest.options,
        retryStrategy: 'exponential',
        priority: 'high'
      }
    );
    
    return optimizedRequest;
  } catch (error) {
    console.log('❌ Recovery failed, using fallback');
    return getFallbackData(failedRequest);
  }
};
```

### 🔐 Service Integration Issues

#### **Service Dependency Failure**
```typescript
const diagnoseServiceDependencies = async () => {
  console.log('🔍 Diagnosing service dependencies...');
  
  const services = [
    { name: 'ObservabilityService', instance: observabilityService },
    { name: 'EnhancedMemoryManager', instance: enhancedMemoryManager },
    { name: 'AdvancedBundleOptimizer', instance: advancedBundleOptimizer },
    { name: 'NetworkPerformanceOptimizer', instance: networkPerformanceOptimizer },
    { name: 'ClimateModelingEngine', instance: climateModelingEngine }
  ];
  
  for (const service of services) {
    try {
      const isHealthy = await checkServiceHealth(service.instance);
      console.log(`${service.name}: ${isHealthy ? '✅' : '❌'}`);
      
      if (!isHealthy) {
        console.log(`  └─ Attempting to restart ${service.name}...`);
        await restartService(service.instance);
      }
    } catch (error) {
      console.log(`${service.name}: ❌ Critical failure`);
      console.log(`  └─ Error: ${error.message}`);
    }
  }
};

const checkServiceHealth = async (service) => {
  // Generic health check
  if (typeof service.getHealthStatus === 'function') {
    const health = await service.getHealthStatus();
    return health.status === 'healthy';
  }
  
  if (typeof service.isInitialized === 'function') {
    return service.isInitialized();
  }
  
  return true; // Assume healthy if no health check available
};
```

### 🎯 TypeScript Debugging

#### **Type Error Resolution**
```bash
# Step 1: Run type check with detailed output
bun run typecheck --listFiles

# Step 2: Check for circular dependencies
madge --circular --extensions ts,tsx src/

# Step 3: Generate type coverage report
type-coverage --detail --strict

# Step 4: Check for unused exports
ts-unused-exports tsconfig.json
```

#### **Common Type Issues**
```typescript
// Issue: 'any' type usage
// Fix: Create proper interfaces
interface UnknownApiResponse {
  readonly data: unknown;
  readonly status: 'success' | 'error';
  readonly message?: string;
}

// Issue: Missing null checks
// Fix: Use optional chaining and nullish coalescing
const safeValue = data?.property?.value ?? 'default';

// Issue: Complex union types
// Fix: Use type guards
const isValidData = (data: unknown): data is ValidDataType => {
  return typeof data === 'object' && 
         data !== null && 
         'requiredProperty' in data;
};
```

### 🧪 Testing Debugging

#### **Test Failure Analysis**
```bash
# Run tests with verbose output
bun test --verbose --no-cache

# Run specific test file
bun test src/services/AdvancedBundleOptimizer.test.ts

# Run tests with coverage
bun run test:coverage

# Debug test with inspect
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### **Mock Debugging**
```typescript
// Debug mock calls
afterEach(() => {
  console.log('Mock calls for observabilityService.trackMetric:');
  console.log(observabilityService.trackMetric.mock.calls);
  
  console.log('Mock calls for carbonAPIService.calculateEmissions:');
  console.log(carbonAPIService.calculateEmissions.mock.calls);
  
  jest.clearAllMocks();
});
```

### 🔧 Environment Debugging

#### **React Native Environment Check**
```bash
# Complete environment diagnosis
bun run doctor

# Check React Native version
react-native --version

# Check device/simulator connection
react-native run-ios --list-devices
react-native run-android --list-devices

# Check Metro bundler health
curl http://localhost:8081/status
```

#### **Development Tools Check**
```bash
# Check Bun installation
bun --version

# Check Node version
node --version

# Check watchman
watchman version

# Check iOS tools (macOS only)
xcode-select --print-path
xcrun simctl list devices
```

### 📱 Device-Specific Issues

#### **iOS Simulator Issues**
```bash
# Reset iOS simulator
xcrun simctl erase all

# Boot specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Check simulator logs
xcrun simctl spawn booted log stream --predicate 'processImagePath ENDSWITH "Kindred"'
```

#### **Android Emulator Issues**
```bash
# List available AVDs
emulator -list-avds

# Start emulator with debugging
emulator -avd Pixel_7_API_34 -verbose

# Check Android logs
adb logcat | grep Kindred
```

## 🚨 Emergency Recovery Procedures

### **Complete Reset Procedure**
```bash
#!/bin/bash
echo "🚨 EMERGENCY RESET PROCEDURE"

# 1. Stop all processes
killall -9 "Metro" "node" "React Native" 2>/dev/null || true

# 2. Clean everything
bun run clean:all
rm -rf node_modules
rm -rf ios/build
rm -rf android/build

# 3. Reinstall
bun install

# 4. iOS specific
cd ios && pod install && cd ..

# 5. Restart
bun start --reset-cache

echo "✅ Emergency reset complete"
```

### **Service Recovery Procedure**
```typescript
const emergencyServiceRecovery = async () => {
  console.log('🚨 EMERGENCY SERVICE RECOVERY');
  
  // 1. Stop all services
  const services = [
    climateModelingEngine,
    advancedBundleOptimizer,
    networkPerformanceOptimizer
  ];
  
  for (const service of services) {
    try {
      if (typeof service.stop === 'function') {
        await service.stop();
      }
    } catch (error) {
      console.warn(`Failed to stop service: ${error.message}`);
    }
  }
  
  // 2. Clear memory
  await enhancedMemoryManager.performMemoryCleanup(true);
  
  // 3. Restart core services only
  try {
    await observabilityService.restart();
    await enhancedMemoryManager.restart();
    console.log('✅ Core services restarted');
  } catch (error) {
    console.error('❌ Core service restart failed:', error);
  }
};
```

---

**🎯 Use this playbook for systematic debugging and quick issue resolution!**