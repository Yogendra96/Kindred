# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kindred** is a React Native application focused on carbon footprint tracking and sustainability. Built with React Native 0.73.6, TypeScript, and modern development practices.

## Essential Commands

### Development
- `bun start` - Start Metro bundler (use --reset-cache if needed)
- `bun android` - Run on Android emulator/device
- `bun ios` - Run on iOS simulator/device
- `bun run pod:install` - Install iOS CocoaPods dependencies (required after native dependency changes)

### Code Quality & Testing
- `bun run lint` - Run ESLint (add --fix to auto-fix issues)
- `bun run typecheck` - Run TypeScript type checking
- `bun run format` - Format code with Prettier
- `bun run test` - Run unit tests with coverage
- `bun run test:unit` - Run unit tests only
- `bun run test:integration` - Run integration tests
- `bun run test:e2e` - Run Detox end-to-end tests
- `bun run test:performance` - Run performance tests
- `bun run test:accessibility` - Run accessibility tests

### Build Commands
- `bun run android:release` - Build Android release APK
- `bun run ios:release` - Build iOS release
- `bun run bundle:analyze` - Analyze bundle size

### Maintenance
- `bun run clean:all` - Clean all caches and dependencies
- `bun run reset` - Complete reset (clean + reinstall + pod install)
- `bun run validate` - Run lint, typecheck, and tests (pre-commit validation)

## Architecture & Code Organization

### System Architecture Pattern
- **Service-Oriented Architecture (SOA)** with 8 core enhanced services
- **Redux Slice Pattern** for predictable state management
- **Component Hierarchy** with clear data flow and error boundaries
- **Performance-First Design** with real-time monitoring integration

### Directory Structure
```
src/
├── components/          # Reusable UI components with Storybook stories
├── screens/            # Screen components (auth/, main/)
├── navigation/         # Navigation configuration
├── store/              # Redux Toolkit store with slices (auth, user, carbon)
├── services/           # 8 Enhanced business logic services
├── utils/              # Utility functions and helpers
├── hooks/              # Custom React hooks with performance monitoring
├── constants/          # App constants and configuration
├── types/              # TypeScript definitions and interfaces
├── config/             # Environment-specific configuration
├── theme/              # Dynamic theming system
└── tests/              # Test utilities and comprehensive test setup
```

### Core Service Architecture
The app follows a **service-oriented architecture** with 8 enhanced services:

1. **CarbonAPIService** - Real-time carbon calculations with external API integration
2. **MLCarbonPrediction** - TensorFlow.js neural network for footprint prediction
3. **EnhancedSecurityService** - 256-bit AES encryption and biometric auth
4. **EnhancedAnalyticsService** - Comprehensive user behavior analytics
5. **EnhancedPerformanceService** - Real-time performance monitoring (<100ms overhead)
6. **LocationService** - Privacy-aware location tracking with battery optimization
7. **AchievementSystem** - Gamification with 7 categories and 5 rarity levels
8. **SmartRecommendationsEngine** - AI-powered personalized suggestions

### Key Technologies
- **Package Manager**: Bun (required - specified in engines)
- **State Management**: Redux Toolkit with slices pattern (auth, user, carbon)
- **Navigation**: React Navigation with typed navigation
- **AI/ML**: TensorFlow.js with neural networks (64→32→16→4 architecture)
- **Testing**: Jest + Detox E2E + Maestro + 75% coverage requirement
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks
- **Performance**: Multi-layered monitoring with 60fps/16ms tracking
- **Security**: End-to-end encryption with biometric authentication

### Import Aliases
Use absolute imports with `@` prefixes:
```typescript
import { Button } from '@components/Button';
import { userSlice } from '@store/slices/userSlice';
import { CarbonAPIService } from '@services/CarbonAPIService';
import { usePerformanceMonitoring } from '@hooks/usePerformanceMonitoring';
```

## Application Features

### Core Focus: Sustainability & Carbon Tracking
- Carbon footprint calculation and tracking
- Analytics dashboard for environmental impact
- Achievement system with gamification
- ML-based carbon prediction
- Carbon offset marketplace integration

### Service Integration Patterns
- **Singleton Pattern**: Centralized service instances with global access
- **Observer Pattern**: Real-time data updates and notifications  
- **Strategy Pattern**: Platform-specific implementations (iOS/Android)
- **Decorator Pattern**: Performance monitoring and caching layers
- **Factory Pattern**: Service configuration and initialization

### Service Interdependencies & Data Flow
- **CarbonAPIService** ↔ **MLCarbonPrediction** (bidirectional data exchange)
- **SmartRecommendationsEngine** → Multiple services (data aggregation hub)
- **EnhancedAnalyticsService** → All services (comprehensive usage tracking)
- **EnhancedSecurityService** → All services (data protection layer)
- **LocationService** → **CarbonAPIService** (location-based calculations)
- **AchievementSystem** → All services (progress tracking integration)

## Development Practices

### Code Architecture Guidelines
When working with this codebase, follow these architectural principles:

1. **Service-First Development**: Always use the appropriate enhanced service for business logic
   - Use `CarbonAPIService` for carbon calculations, not direct API calls
   - Use `EnhancedSecurityService` for encryption, not raw crypto operations
   - Use `EnhancedPerformanceService` for monitoring, not manual tracking

2. **Performance-Aware Development**: Every component should consider performance
   - Implement performance monitoring hooks (`usePerformanceMonitoring`)
   - Use `React.memo` for expensive components
   - Monitor render times with 16ms threshold awareness
   - Leverage the built-in performance dashboard for optimization

3. **Security-First Implementation**: Security is integrated, not added later
   - Use `EnhancedSecurityService` for all sensitive data operations
   - Implement proper input validation through the security service
   - Never store sensitive data without encryption
   - Follow session management patterns established in the security service

### TypeScript Configuration
- **Strict mode enabled** - no `any` types allowed
- **Path mapping** configured for clean imports with `@` aliases
- **Target ES2022** with modern language features
- **Interface-driven development** with comprehensive type definitions

### Component Standards
- Use `React.memo` for performance optimization (required for >16ms renders)
- Implement proper TypeScript interfaces with strict typing
- Follow accessibility best practices with comprehensive labeling
- Include Storybook stories for UI components (required)
- Write comprehensive tests (75% coverage requirement)
- Integrate performance monitoring in complex components

### Testing Strategy
- **Unit tests**: Jest + React Native Testing Library
- **Integration tests**: Redux and navigation testing
- **E2E tests**: Detox with iOS Simulator (iPhone 15 Pro) and Android Emulator (Pixel 7 API 34)
- **Performance tests**: Custom performance monitoring
- **Accessibility tests**: Screen reader and contrast testing

## Configuration Files

### Key Config Files
- `metro.config.js` - Metro bundler with enhanced caching
- `babel.config.js` - Babel with module resolution
- `tsconfig.json` - Strict TypeScript configuration
- `.eslintrc.js` - ESLint with React Native rules
- `.env.example` - Comprehensive environment variables template

### Environment Management
- Multiple environment support (development, staging, production)
- Feature flags for experimental features
- Firebase and social authentication configuration
- Over 100+ configurable environment variables

## Build & Deployment

### Platform Requirements
- **Node.js**: 18+ (specified in engines)
- **Bun**: Latest version
- **Java**: 24 for Android builds
- **Android SDK**: API level 34+
- **Xcode**: Latest for iOS development

### Build Optimization
- Hermes JavaScript engine enabled for both platforms
- Enhanced Metro configuration with performance optimizations
- Bundle analysis tools for size monitoring
- Parallel build processing

## Debugging & Development Tools

### Enhanced Development Features
- **DevTools component**: Runtime debugging interface
- **Performance monitoring hooks**: Real-time performance metrics
- **Global development utilities**: `global.devUtils` in development mode
- **VS Code integration**: Launch configurations for Hermes debugging

### Troubleshooting Commands
- `bun run clean:metro` - Clear Metro cache
- `bun run clean:watchman` - Clear Watchman cache  
- `bun run clean:pods` - Clean iOS Pods
- `bun run clean:gradle` - Clean Android Gradle cache
- `bun run doctor` - Check React Native environment setup

## Performance Considerations

- **Performance Guide**: Comprehensive 290+ line optimization guide available
- **Monitoring**: Built-in performance monitoring service
- **Memory Management**: Automatic memory usage tracking
- **Bundle Analysis**: Regular bundle size monitoring
- **Native Driver**: Use for animations where possible

## Security & Best Practices

- Enhanced security service with data encryption
- Biometric authentication support
- No hardcoded secrets (use environment variables)
- Input sanitization and validation
- Session management and timeout handling

## Testing Configuration

### Jest Configuration
- **Coverage threshold**: 75% minimum
- **Multiple test projects**: Unit, integration, performance, accessibility
- **Enhanced test utilities**: `renderWithProviders` helper
- **Comprehensive mocking**: React Native modules and services

### E2E Testing (Detox)
- **iOS**: iPhone 15 Pro simulator
- **Android**: Pixel 7 API 34 emulator
- **Configuration**: Separate debug configurations for each platform

## Important Notes

### Critical Development Guidelines
- Always run `bun run pod:install` after adding native dependencies
- Use Bun as the package manager (not npm or yarn)
- Pre-commit hooks automatically run lint, format, and type checks
- All components should have corresponding tests and Storybook stories
- Performance monitoring is built-in - leverage the enhanced services
- The app has comprehensive development documentation in DEVELOPMENT.md and DEVELOPMENT_GUIDE.md

## 🚀 Quick Decision Guide

### When to Use Which Service?
```typescript
// ✅ Carbon calculations
const footprint = await CarbonAPIService.calculateEmissions(activityData);

// ✅ Store sensitive data  
await EnhancedSecurityService.secureStore('user_token', sensitiveData);

// ✅ Component performance monitoring
const { renderTime, memoryUsage } = usePerformanceMonitoring();

// ✅ Get user location
const location = await LocationService.getCurrentLocation({ 
  accuracy: 'high', 
  privacy: 'approximate' 
});

// ✅ Track user events
EnhancedAnalyticsService.trackEvent('carbon_activity_added', { 
  type: 'walking', 
  duration: 30 
});

// ✅ ML predictions
const prediction = await MLCarbonPrediction.predictCarbonFootprint(userData);

// ✅ Achievement checks
await AchievementSystem.checkForNewAchievements(userId);

// ✅ Get recommendations
const suggestions = await SmartRecommendationsEngine.generateRecommendations(userProfile);
```

### Service Usage Best Practices

#### **Carbon Calculations**
```typescript
// ✅ DO: Use service with error handling
try {
  const result = await CarbonAPIService.calculateEmissions({
    type: 'transport',
    mode: 'car',
    distance: 15.5,
    region: 'US'
  });
} catch (error) {
  // Service handles fallback automatically
  console.error('Carbon calculation failed:', error);
}

// ❌ DON'T: Direct API calls
fetch('https://carbon-api.com/calculate') // Wrong!
```

#### **Security Operations**
```typescript
// ✅ DO: Use security service
const encrypted = await EnhancedSecurityService.encrypt(sensitiveData);
await EnhancedSecurityService.secureStore('key', encrypted);

// ❌ DON'T: Direct storage
AsyncStorage.setItem('sensitive', data); // Insecure!
```

#### **Performance Monitoring**
```typescript
// ✅ DO: Monitor complex components
const ExpensiveComponent = () => {
  const { renderTime } = usePerformanceMonitoring({
    threshold: 16, // ms
    onSlowRender: (time) => console.warn(`Slow render: ${time}ms`)
  });
  
  return <ComplexUIComponent />;
};

// ✅ DO: Track service performance
EnhancedPerformanceService.measureAsync('data_fetch', async () => {
  return await CarbonAPIService.getHistory();
});
```

### Architecture Documentation
- **PROJECT_OVERVIEW.md**: Comprehensive project features and capabilities
- **ARCHITECTURE.md**: Detailed system architecture with Mermaid diagrams
- **DEVELOPMENT_GUIDE.md**: Extended development practices and patterns
- **PERFORMANCE_GUIDE.md**: 290+ line performance optimization guide

## 🚨 Common Anti-Patterns to Avoid

### ❌ What NOT to Do
```typescript
// ❌ DON'T: Skip performance monitoring
const Component = () => {
  // This could be slow, but no monitoring
  return <ExpensiveChart data={hugeDataset} />;
};

// ❌ DON'T: Direct service instantiation
const carbonService = new CarbonAPIService(); // Use singleton!

// ❌ DON'T: Ignore error handling
const data = await CarbonAPIService.calculateEmissions(input); // No try/catch

// ❌ DON'T: Store sensitive data unencrypted
AsyncStorage.setItem('password', userPassword); // Security risk!

// ❌ DON'T: Bypass the Redux store
setUserData(newData); // Should use Redux actions

// ❌ DON'T: Ignore performance thresholds
// Component taking 50ms to render with no optimization
```

## 🎯 Performance Thresholds & Actions

### When 16ms Render Threshold is Exceeded:
```typescript
const ComponentWithMonitoring = () => {
  const { renderTime } = usePerformanceMonitoring({
    threshold: 16,
    onSlowRender: (time) => {
      // Automatic actions:
      // 1. Log performance issue
      // 2. Track in analytics
      // 3. Consider React.memo
      // 4. Check for unnecessary re-renders
      console.warn(`Slow render detected: ${time}ms`);
    }
  });
  
  // Use React.memo for expensive components
  return React.memo(() => <ExpensiveComponent />);
};
```

### Memory Limit Actions:
| Service | Memory Limit | Action When Exceeded |
|---------|-------------|---------------------|
| CarbonAPIService | 20MB | Clear cache, reduce batch size |
| MLCarbonPrediction | 50MB | Reduce model complexity |
| EnhancedPerformanceService | 5MB | Limit metrics history |
| LocationService | 15MB | Clear location history |

### Performance Considerations
- **Real-time monitoring**: 60fps tracking with 16ms render threshold alerts
- **Memory management**: Automatic cleanup and leak detection  
- **Service efficiency**: <100ms overhead for performance monitoring
- **Bundle optimization**: Analyze with `bun run bundle:analyze`
- **ML model efficiency**: TensorFlow.js optimized for mobile performance
- **Network efficiency**: Smart caching with TTL management
- **Battery optimization**: Background task management