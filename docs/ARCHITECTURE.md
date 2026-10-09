# Kindred Architecture Documentation

## System Architecture Overview

Kindred follows a **Service-Oriented Architecture (SOA)** with **Zustand + Firebase onSnapshot hooks for state management** and **Firebase-powered backend services**. The application is built using modern React Native patterns with TypeScript for type safety and comprehensive testing coverage.

## High-Level Architecture Diagram

```mermaid
graph TB
  subgraph "Mobile App Layer"
    UI[React Native UI Components]
    NAV[React Navigation]
    ZUSTAND[Zustand Stores<br/>Local UI State Only]
    FIREBASE_HOOKS[Firebase onSnapshot Hooks<br/>Real-Time Server State]
    TANSTACK[TanStack Query<br/>API Data Fetching & Caching]
    ERROR[Error Boundaries]
  end

  subgraph "Service Layer"
    CARBON[CarbonAPIService]
    ML[MLCarbonPrediction]
    SECURITY[SecurityService]
    ANALYTICS[AnalyticsService]
    PERF[PerformanceService]
    LOCATION[LocationService]
    ACHIEVE[AchievementSystem]
    RECOMMEND[SmartRecommendationsEngine]
  end

  subgraph "Data Layer"
    FIREBASE[(Firebase Firestore)]
    STORAGE[(Secure Storage)]
    CACHE[(Cache Layer)]
    SQLITE[(Local SQLite)]
    SYNC[Offline Sync Engine]
  end

  subgraph "External Services"
    CARBON_API[Carbon Footprint APIs]
    GOOGLE_AUTH[Google Authentication]
    MAPS[Maps & Geocoding]
    ML_MODELS[TensorFlow.js Models]
  end

  subgraph "Server Logic"
    CLOUD_FUNCTIONS[Firebase Cloud Functions<br/>Wallet, Activity Scoring,<br/>Gift Cards, Ad Rewards]
    APPCHECK[Firebase AppCheck<br/>Fraud Prevention]
  end

  subgraph "Monitoring & Recovery"
    HEALTH[Service Health Monitor]
    BACKUP[Backup & Recovery]
    ALERTS[Alert System]
  end

  UI --> ERROR
  ERROR --> NAV
  UI --> ZUSTAND
  UI --> FIREBASE_HOOKS
  UI --> TANSTACK
  NAV --> ZUSTAND

  ZUSTAND --> CARBON
  ZUSTAND --> ML
  ZUSTAND --> SECURITY
  ZUSTAND --> ANALYTICS
  ZUSTAND --> PERF
  ZUSTAND --> LOCATION
  ZUSTAND --> ACHIEVE
  ZUSTAND --> RECOMMEND

  FIREBASE_HOOKS --> FIREBASE
  TANSTACK --> FIREBASE

  CARBON --> FIREBASE
  CARBON --> CARBON_API
  ML --> ML_MODELS
  SECURITY --> STORAGE
  ANALYTICS --> FIREBASE
  LOCATION --> MAPS
  ACHIEVE --> FIREBASE
  RECOMMEND --> FIREBASE

  FIREBASE --> CACHE
  FIREBASE --> SYNC
  SECURITY --> SQLITE
  ANALYTICS --> CACHE

  CLOUD_FUNCTIONS --> FIREBASE
  APPCHECK --> FIREBASE

  HEALTH --> CARBON
  HEALTH --> ML
  HEALTH --> SECURITY
  HEALTH --> ANALYTICS
  HEALTH --> PERF
  HEALTH --> LOCATION
  HEALTH --> ACHIEVE
  HEALTH --> RECOMMEND

  HEALTH --> ALERTS
  BACKUP --> FIREBASE
  BACKUP --> STORAGE
  BACKUP --> SQLITE
```

## Core Architecture Patterns

### 1. **Service-Oriented Architecture (SOA)**

Each major feature domain has a dedicated service with clear responsibilities:

```mermaid
graph LR
  subgraph "Core Services"
    A[CarbonAPIService] --> B[Data Processing]
    C[MLCarbonPrediction] --> D[AI/ML Operations]
    E[SecurityService] --> F[Security & Auth]
    G[LocationService] --> H[Geolocation]
  end

  subgraph "Support Services"
    I[AnalyticsService] --> J[User Analytics]
    K[PerformanceService] --> L[Performance Monitoring]
    M[AchievementSystem] --> N[Gamification]
    O[SmartRecommendationsEngine] --> P[AI Recommendations]
  end
```

### 2. **Zustand + Firebase State Pattern**

State management is split into three distinct layers, each handling a specific domain:

```mermaid
graph TD
  subgraph "Local UI State (Zustand)"
    APP_STORE[useAppStore] --> THEME["theme, notifications, consent"]
    APP_STORE --> PERSIST[Persisted to AsyncStorage]
    APP_STORE --> COMPONENTS[React Components<br/>via direct hook call]
  end

  subgraph "Real-Time Server State (Firebase onSnapshot)"
    USE_WALLET[useWallet] --> WALLET_STATE["{ balanceCents, totalEarnedCents }"]
    USE_CARBON[useCarbon] --> CARBON_STATE["{ footprint, transport, energy, food }"]
    USE_SDG[useSDG] --> SDG_STATE["{ esg: { total } }"]
    USE_CORPORATE[useCorporate] --> CORP_STATE["{ linkedCompany, isVerified, points }"]

    WALLET_STATE --> FIRESTORE_USERS[(Firestore<br/>users/{uid})]
    CARBON_STATE --> FIRESTORE_USERS
    SDG_STATE --> FIRESTORE_USERS
    CORP_STATE --> FIRESTORE_USERS
  end

  subgraph "API Data (TanStack Query)"
    TANSTACK[useCarbonData, useUserProfile, etc.] --> QUERY_CACHE[Query Cache<br/>staleTime / gcTime]
    TANSTACK --> COMPONENTS_2[React Components]
    QUERY_CACHE --> AUTO_REFRESH[Auto-refetch & Cache Invalidation]
  end

  subgraph "Server-Authoritative Logic (Cloud Functions)"
    FUNCTIONS[Firebase Cloud Functions] --> WALLET_AGG[Wallet Aggregation]
    FUNCTIONS --> ACTIVITY_SCORE[Activity Scoring]
    FUNCTIONS --> GIFT_CARD[Gift Card Redemption]
    FUNCTIONS --> AD_REWARD[Ad Reward Verification]
    FUNCTIONS --> EMAIL_VERIFY[Email Verification]
  end
```

**Key design decisions:**

- **Zustand (`useAppStore`)** handles local-only UI concerns: theme preferences, notification settings, consent flags. These have no server equivalent and are persisted to `AsyncStorage` via `zustand/middleware/persist`.
- **Firebase onSnapshot hooks** (`useWallet`, `useCarbon`, `useSDG`, `useCorporate`) subscribe to Firestore documents in real time. They return plain React state -- no global store needed. The components that call them get live updates automatically.
- **TanStack Query** manages API calls with built-in caching, background refetching, and optimistic updates. Stale times vary by data type: carbon data refreshes every 5 minutes, leaderboard every 2 minutes.
- **Firebase Cloud Functions** own the authoritative business logic -- wallet aggregation, activity scoring, email verification, gift card redemption, and ad reward verification. The client never writes directly to business-critical collections.
- **No Provider wrapper needed.** Zustand stores and Firebase hooks are accessed directly from any component via hook calls, eliminating the need for a wrapping Provider.

### 3. **Component Architecture**

Components follow a hierarchical structure with clear data flow:

```mermaid
graph TD
  APP[App.tsx] --> ERROR_BOUNDARY[ErrorBoundary]
  ERROR_BOUNDARY --> SAFE_AREA[SafeAreaProvider]
  SAFE_AREA --> NAV_CONTAINER[NavigationContainer]

  NAV_CONTAINER --> AUTH_NAV[AuthNavigator]
  NAV_CONTAINER --> APP_NAV[AppNavigator]

  APP_NAV --> TABS[Bottom Tabs]
  TABS --> HOME[HomeScreen]
  TABS --> CARBON[CarbonScreen]
  TABS --> SOCIAL[SocialScreen]
  TABS --> PROFILE[ProfileScreen]

  HOME --> CARBON_CARD[CarbonFootprintCard]
  HOME --> ACTIVITY_TRACKER[ActivityTracker]
  HOME --> ECO_TIPS[EcoTips]
```

**State access pattern:**

```mermaid
graph LR
  COMPONENT[Screen Component] --> ZUSTAND["useAppStore()<br/>Direct hook call"]
  COMPONENT --> ON_SNAPSHOT["useCarbon() / useWallet()<br/>Firebase onSnapshot hooks"]
  COMPONENT --> TANSTACK["useCarbonData()<br/>TanStack Query hook"]
```

Zustand stores and Firebase hooks are consumed via direct hook calls inside components. There is no central Provider element -- any component can call `useAppStore()` or `useCarbon()` directly.

## Data Flow Architecture

### 1. **Carbon Tracking Data Flow**

```mermaid
sequenceDiagram
  participant User
  participant UI
  participant Zustand
  participant FirebaseHooks
  participant CarbonAPI
  participant Firebase
  participant ML

  User->>UI: Add Activity
  UI->>Zustand: Update local state (optimistic)
  UI->>CarbonAPI: Calculate Footprint
  CarbonAPI->>Firebase: Store Activity
  CarbonAPI->>ML: Update Prediction Model
  ML->>Firebase: Store Predictions
  FirebaseHooks->>FirebaseHooks: onSnapshot triggers
  FirebaseHooks->>UI: Real-time update with server data
  UI->>User: Show Updated Footprint
```

### 2. **Authentication Flow**

```mermaid
sequenceDiagram
  participant User
  participant UI
  participant Zustand
  participant Security
  participant Firebase
  participant Storage

  User->>UI: Login Request
  UI->>Security: Authenticate
  Security->>Firebase: Verify Credentials
  Firebase->>Security: User Data
  Security->>Storage: Store Encrypted Token
  Security->>Zustand: Update auth flags in local state
  UI->>User: Navigate to App
```

### 3. **Performance Monitoring Flow**

```mermaid
sequenceDiagram
  participant Component
  participant PerfHook
  participant PerfService
  participant Analytics
  participant Firebase

  Component->>PerfHook: Mount
  PerfHook->>PerfService: Start Monitoring
  Component->>PerfHook: Render
  PerfHook->>PerfService: Record Metric
  PerfService->>Analytics: Log Performance
  Analytics->>Firebase: Send Data
  Note over PerfService: Alert if >16ms render
```

## Service Architecture Details

### 1. **CarbonAPIService Architecture**

```mermaid
graph TD
  CARBON_API[CarbonAPIService] --> CACHE[Smart Caching Layer]
  CARBON_API --> RATE_LIMITER[Rate Limiting]
  CARBON_API --> EXTERNAL_APIS[External Carbon APIs]

  CACHE --> MEMORY[In-Memory Cache]
  CACHE --> PERSISTENT[Persistent Storage]

  EXTERNAL_APIS --> EMISSION_FACTORS[Emission Factor APIs]
  EXTERNAL_APIS --> PRODUCT_DB[Product Database APIs]
  EXTERNAL_APIS --> TRANSPORT_API[Transport APIs]

  CARBON_API --> CALCULATOR[Carbon Calculator]
  CALCULATOR --> TRANSPORT[Transport Calculations]
  CALCULATOR --> ENERGY[Energy Calculations]
  CALCULATOR --> FOOD[Food Calculations]
  CALCULATOR --> WASTE[Waste Calculations]
```

**Key Features:**

- **Smart Caching**: TTL-based caching with different lifetimes per data type
- **Rate Limiting**: 100 requests/minute with exponential backoff
- **Batch Processing**: Efficient bulk calculations
- **Regional Support**: Location-based emission factors
- **Error Handling**: Graceful degradation with cached fallbacks

### 2. **ML Architecture (TensorFlow.js)**

```mermaid
graph TD
  ML_SERVICE[MLCarbonPrediction] --> MODEL_MANAGER[Model Manager]
  MODEL_MANAGER --> TRAINING[Model Training]
  MODEL_MANAGER --> PREDICTION[Prediction Engine]
  MODEL_MANAGER --> EVALUATION[Model Evaluation]

  TRAINING --> FEATURE_ENG[Feature Engineering]
  TRAINING --> NEURAL_NET[Neural Network]
  TRAINING --> VALIDATION[Model Validation]

  FEATURE_ENG --> USER_DATA[User Behavior Data]
  FEATURE_ENG --> CONTEXT_DATA[Contextual Data]
  FEATURE_ENG --> TEMPORAL_DATA[Temporal Features]

  NEURAL_NET --> LAYER1[Dense Layer 64]
  NEURAL_NET --> LAYER2[Dense Layer 32]
  NEURAL_NET --> LAYER3[Dense Layer 16]
  NEURAL_NET --> OUTPUT[Output Layer 4]
```

**Neural Network Architecture:**

- **Input Layer**: 25+ features (user behavior, context, temporal)
- **Hidden Layers**: 64 -> 32 -> 16 neurons with dropout regularization
- **Output Layer**: 4 categories (transport, energy, food, waste)
- **Optimization**: Adam optimizer with learning rate scheduling
- **Training**: Continuous learning from user interactions

### 3. **Security Architecture**

```mermaid
graph TD
  SECURITY[SecurityService] --> ENCRYPTION[AES-256 Encryption]
  SECURITY --> AUTH[Authentication Manager]
  SECURITY --> SESSION[Session Management]
  SECURITY --> VALIDATION[Input Validation]

  ENCRYPTION --> KEY_MANAGEMENT[Key Management]
  ENCRYPTION --> DATA_ENCRYPTION[Data Encryption]

  AUTH --> BIOMETRIC[Biometric Auth]
  AUTH --> PASSWORD[Password Auth]
  AUTH --> SOCIAL[Social Auth]

  SESSION --> TIMEOUT[Session Timeout]
  SESSION --> REFRESH[Token Refresh]
  SESSION --> CLEANUP[Session Cleanup]

  VALIDATION --> SQL_INJECTION[SQL Injection Prevention]
  VALIDATION --> XSS[XSS Protection]
  VALIDATION --> SANITIZATION[Data Sanitization]
```

**Security Features:**

- **256-bit AES encryption** for sensitive data
- **Biometric authentication** with fallback options
- **Session management** with 30-minute timeout
- **Brute force protection** with login attempt limiting
- **Input validation** preventing injection attacks

### 4. **Performance Monitoring Architecture**

```mermaid
graph TD
  PERF[PerformanceService] --> METRICS[Metrics Collection]
  PERF --> ANALYSIS[Performance Analysis]
  PERF --> ALERTS[Alert System]
  PERF --> OPTIMIZATION[Auto Optimization]

  METRICS --> RENDER[Render Metrics]
  METRICS --> MEMORY[Memory Metrics]
  METRICS --> NETWORK[Network Metrics]
  METRICS --> CPU[CPU Metrics]

  RENDER --> FPS[FPS Monitoring]
  RENDER --> COMPONENT[Component Timing]

  MEMORY --> HEAP[JS Heap Monitoring]
  MEMORY --> NATIVE[Native Memory]

  ANALYSIS --> TRENDS[Trend Analysis]
  ANALYSIS --> BOTTLENECKS[Bottleneck Detection]
  ANALYSIS --> REPORTS[Performance Reports]
```

**Performance Features:**

- **Real-time monitoring** with < 100ms overhead
- **60fps tracking** with 16ms render threshold alerts
- **Memory leak detection** with automatic cleanup
- **Network performance** analysis with timeout detection
- **Automated optimization** suggestions

## Testing Architecture

### 1. **Testing Pyramid**

```mermaid
graph TD
  E2E[End-to-End Tests] --> DETOX[Detox Tests]
  E2E --> MAESTRO[Maestro Tests]

  INTEGRATION[Integration Tests] --> STORE_TESTS[Store Integration]
  INTEGRATION --> HOOK_TESTS[Hook Integration]
  INTEGRATION --> NAV_TESTS[Navigation Tests]
  INTEGRATION --> SERVICE_TESTS[Service Integration]

  UNIT[Unit Tests] --> COMPONENT_TESTS[Component Tests]
  UNIT --> SERVICE_UNIT[Service Unit Tests]
  UNIT --> UTILITY_TESTS[Utility Tests]

  PERFORMANCE[Performance Tests] --> RENDER_PERF[Render Performance]
  PERFORMANCE --> MEMORY_PERF[Memory Performance]
  PERFORMANCE --> NETWORK_PERF[Network Performance]
```

### 2. **Test Coverage Strategy**

```mermaid
pie title Test Coverage Distribution (75% Minimum)
  "Unit Tests" : 60
  "Integration Tests" : 25
  "E2E Tests" : 10
  "Performance Tests" : 5
```

## Deployment Architecture

### 1. **Build Pipeline**

```mermaid
graph LR
  DEV[Development] --> LINT[Linting & Type Check]
  LINT --> UNIT[Unit Tests]
  UNIT --> INTEGRATION[Integration Tests]
  INTEGRATION --> BUILD[Build App]
  BUILD --> E2E[E2E Tests]
  E2E --> DEPLOY[Deploy]

  DEPLOY --> STAGING[Staging Environment]
  DEPLOY --> PRODUCTION[Production Environment]
```

### 2. **Environment Configuration**

```mermaid
graph TD
  CONFIG[Environment Config] --> DEV_ENV[Development]
  CONFIG --> STAGING_ENV[Staging]
  CONFIG --> PROD_ENV[Production]

  DEV_ENV --> DEV_FIREBASE[Firebase Dev]
  DEV_ENV --> DEV_APIS[Development APIs]
  DEV_ENV --> MOCK_SERVICES[Mock Services]

  STAGING_ENV --> STAGING_FIREBASE[Firebase Staging]
  STAGING_ENV --> STAGING_APIS[Staging APIs]
  STAGING_ENV --> TEST_DATA[Test Data]

  PROD_ENV --> PROD_FIREBASE[Firebase Production]
  PROD_ENV --> PROD_APIS[Production APIs]
  PROD_ENV --> ANALYTICS[Production Analytics]
```

## Scalability Considerations

### 1. **Horizontal Scaling**

- **Service isolation** allows independent scaling
- **Caching strategies** reduce external API dependencies
- **Database sharding** potential for user data
- **CDN integration** for static assets

### 2. **Performance Optimization**

- **Bundle splitting** for faster initial load
- **Lazy loading** for non-critical components
- **Image optimization** with progressive loading
- **Background sync** for offline capabilities

### 3. **Monitoring & Observability**

- **Real-time performance monitoring** with Firebase
- **Error tracking** with comprehensive logging
- **User analytics** for feature usage insights
- **Business metrics** for sustainability impact

## Security Architecture

### 1. **Data Protection**

```mermaid
graph TD
  DATA[User Data] --> CLASSIFICATION[Data Classification]
  CLASSIFICATION --> SENSITIVE[Sensitive Data]
  CLASSIFICATION --> PUBLIC[Public Data]

  SENSITIVE --> ENCRYPTION[AES-256 Encryption]
  SENSITIVE --> ACCESS_CONTROL[Access Control]
  SENSITIVE --> AUDIT[Audit Logging]

  PUBLIC --> ANONYMIZATION[Data Anonymization]
  PUBLIC --> AGGREGATION[Data Aggregation]
```

### 2. **Authentication & Authorization**

- **Multi-factor authentication** with biometric options
- **Role-based access control** for admin features
- **Session management** with secure token handling
- **OAuth integration** with Google Sign-In

### 3. **Privacy Compliance**

- **GDPR compliance** with data portability
- **Data minimization** principles
- **User consent management**
- **Right to deletion** implementation

## Error Handling & Recovery Architecture

### 1. **Service Failure Cascade Management**

```mermaid
graph TD
  SERVICE_FAIL[Service Failure] --> CIRCUIT_BREAKER[Circuit Breaker]
  CIRCUIT_BREAKER --> FALLBACK[Fallback Strategy]
  CIRCUIT_BREAKER --> RETRY[Retry with Backoff]

  FALLBACK --> CACHE[Use Cached Data]
  FALLBACK --> OFFLINE[Offline Mode]
  FALLBACK --> GRACEFUL[Graceful Degradation]

  RETRY --> SUCCESS[Service Recovery]
  RETRY --> PERSISTENT_FAIL[Persistent Failure]

  PERSISTENT_FAIL --> USER_NOTIFICATION[Notify User]
  PERSISTENT_FAIL --> ANALYTICS_LOG[Log for Analysis]
  PERSISTENT_FAIL --> ALTERNATIVE_SERVICE[Alternative Service]
```

### 2. **Security Flow Architecture**

```mermaid
sequenceDiagram
  participant User
  participant App
  participant Security
  participant Biometric
  participant Encryption
  participant Storage

  User->>App: Access Sensitive Data
  App->>Security: Check Auth Status
  Security->>Biometric: Request Biometric Auth
  Biometric->>Security: Auth Result

  alt Authentication Success
    Security->>Encryption: Decrypt Data Key
    Encryption->>Storage: Retrieve Encrypted Data
    Storage->>Encryption: Return Encrypted Data
    Encryption->>Security: Decrypted Data
    Security->>App: Authorized Data
    App->>User: Display Data
  else Authentication Failed
    Security->>App: Auth Failure
    App->>User: Access Denied
  end
```

### 3. **Offline-First Data Sync Architecture**

```mermaid
graph TD
  USER_ACTION[User Action] --> LOCAL_STORAGE[Local Storage]
  LOCAL_STORAGE --> SYNC_QUEUE[Sync Queue]

  NETWORK_CHECK{Network Available?}
  SYNC_QUEUE --> NETWORK_CHECK

  NETWORK_CHECK -->|Yes| FIREBASE_SYNC[Firebase Sync]
  NETWORK_CHECK -->|No| QUEUE_PERSIST[Persist in Queue]

  FIREBASE_SYNC --> CONFLICT_CHECK{Conflict Detected?}
  CONFLICT_CHECK -->|No| SYNC_SUCCESS[Sync Success]
  CONFLICT_CHECK -->|Yes| CONFLICT_RESOLUTION[Conflict Resolution]

  CONFLICT_RESOLUTION --> LAST_WRITE_WINS[Last Write Wins]
  CONFLICT_RESOLUTION --> USER_CHOICE[Present to User]
  CONFLICT_RESOLUTION --> MERGE_STRATEGY[Smart Merge]

  SYNC_SUCCESS --> LOCAL_UPDATE[Update Local Cache]
  LOCAL_UPDATE --> UI_REFRESH[Refresh UI]
```

## API Contracts & Interfaces

### 1. **Service Interface Standards**

```typescript
// Standard Service Interface
interface Service {
  // Health check
  isHealthy(): Promise<boolean>;

  // Initialize service
  initialize(config: ServiceConfig): Promise<void>;

  // Cleanup resources
  cleanup(): Promise<void>;

  // Handle errors gracefully
  handleError(error: Error): ServiceErrorResponse;

  // Get service metrics
  getMetrics(): ServiceMetrics;
}

// Performance tracking for all services
interface PerformanceTracked {
  startTrace(name: string): void;
  stopTrace(name: string): void;
  recordMetric(name: string, value: number): void;
}
```

### 2. **Carbon API Service Contract**

```typescript
interface CarbonAPIInterface {
  calculateEmissions(data: ActivityData): Promise<CarbonFootprint>;
  getEmissionFactors(region: string): Promise<EmissionFactors>;
  batchCalculate(activities: ActivityData[]): Promise<CarbonFootprint[]>;

  // Error handling
  fallbackCalculation(data: ActivityData): CarbonFootprint;
  validateInput(data: ActivityData): ValidationResult;
}
```

### 3. **Security Service Contract**

```typescript
interface SecurityServiceInterface {
  encrypt(data: string, key?: string): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData): Promise<string>;
  secureStore(key: string, value: any): Promise<void>;
  secureRetrieve(key: string): Promise<any>;

  // Session management
  createSession(user: User): Promise<Session>;
  validateSession(sessionId: string): Promise<boolean>;
  refreshSession(sessionId: string): Promise<Session>;
}
```

## Disaster Recovery & Backup Strategy

### 1. **Data Backup Architecture**

```mermaid
graph TD
  USER_DATA[User Data] --> LOCAL_BACKUP[Local Backup]
  USER_DATA --> CLOUD_BACKUP[Cloud Backup]

  LOCAL_BACKUP --> ENCRYPTED_STORAGE[Encrypted Local Storage]
  CLOUD_BACKUP --> FIREBASE_BACKUP[Firebase Backup]
  CLOUD_BACKUP --> SECURE_CLOUD[Secure Cloud Storage]

  RECOVERY_TRIGGER[Data Loss Detected] --> RECOVERY_PROCESS[Recovery Process]
  RECOVERY_PROCESS --> SOURCE_PRIORITY[Priority: Cloud > Local > Cache]
  SOURCE_PRIORITY --> DATA_RESTORATION[Data Restoration]
  DATA_RESTORATION --> INTEGRITY_CHECK[Data Integrity Check]
  INTEGRITY_CHECK --> USER_NOTIFICATION[Notify User of Recovery]
```

### 2. **Service Health Monitoring**

```mermaid
graph LR
  HEALTH_MONITOR[Service Health Monitor] --> SERVICE_CHECK[Periodic Health Checks]
  SERVICE_CHECK --> RESPONSE_TIME[Response Time Check]
  SERVICE_CHECK --> ERROR_RATE[Error Rate Monitoring]
  SERVICE_CHECK --> RESOURCE_USAGE[Resource Usage Check]

  RESPONSE_TIME --> ALERT_SLOW[Alert: Slow Response]
  ERROR_RATE --> ALERT_ERRORS[Alert: High Error Rate]
  RESOURCE_USAGE --> ALERT_MEMORY[Alert: Memory Usage]

  ALERT_SLOW --> AUTO_RECOVERY[Automatic Recovery]
  ALERT_ERRORS --> SERVICE_RESTART[Service Restart]
  ALERT_MEMORY --> MEMORY_CLEANUP[Memory Cleanup]
```

### 3. **Performance Budget Enforcement**

| Service            | Response Time Budget | Memory Budget | Error Rate Budget |
| ------------------ | -------------------- | ------------- | ----------------- |
| CarbonAPIService   | < 200ms              | < 20MB        | < 0.1%            |
| MLCarbonPrediction | < 500ms              | < 50MB        | < 0.5%            |
| SecurityService    | < 100ms              | < 10MB        | < 0.01%           |
| LocationService    | < 150ms              | < 15MB        | < 0.2%            |
| PerformanceService | < 50ms               | < 5MB         | < 0.05%           |

### 4. **Alerting & Escalation**

```mermaid
graph TD
  THRESHOLD_EXCEEDED[Performance Threshold Exceeded] --> LEVEL_1[Level 1: Log Warning]
  LEVEL_1 --> CONTINUE_MONITORING[Continue Monitoring]

  PERSISTENT_ISSUE[Issue Persists > 5min] --> LEVEL_2[Level 2: User Notification]
  LEVEL_2 --> GRACEFUL_DEGRADATION[Enable Graceful Degradation]

  CRITICAL_FAILURE[Critical Failure] --> LEVEL_3[Level 3: Emergency Mode]
  LEVEL_3 --> OFFLINE_MODE[Switch to Offline Mode]
  LEVEL_3 --> ANALYTICS_ALERT[Send Analytics Alert]
  LEVEL_3 --> RECOVERY_ATTEMPT[Attempt Auto-Recovery]
```

---

This enhanced architecture provides a robust, fault-tolerant foundation for the Kindred sustainability tracking application, with comprehensive error handling, disaster recovery, and monitoring capabilities that ensure high availability and excellent user experience even under adverse conditions.
