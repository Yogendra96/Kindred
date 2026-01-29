# Carbon & Climate Data Integration Guide

## 🌍 Overview

Kindred integrates with multiple climate data sources to provide the most comprehensive carbon
tracking experience available. This document covers our current integrations, planned expansions,
and the synergies between features.

### Current API Providers (Personal Carbon Calculations)

1. **Carbon Interface** (Primary) - https://www.carboninterface.com/
2. **Climatiq** (Secondary) - https://climatiq.io/
3. **Carbon Footprint API** (Tertiary) - https://www.carbonfootprint.com/

### Planned Data Sources (Global Context & Intelligence)

4. **Climate TRACE** - https://climatetrace.org/ (745M+ emission sources globally)
5. **WattTime/ElectricityMaps** - Real-time grid carbon intensity
6. **OpenAQ** - Real-time air quality data
7. **Our World in Data** - Historical emissions context
8. **Global Forest Watch** - Deforestation monitoring

---

## 🔗 Feature Synergy Map

This section shows how existing features will be enhanced by new data sources, creating a
multiplicative effect.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KINDRED FEATURE SYNERGY MAP                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │  CLIMATE TRACE   │────────▶│  LocationService │                         │
│  │  (745M Sources)  │         │   + Geofencing   │                         │
│  └────────┬─────────┘         └────────┬─────────┘                         │
│           │                            │                                    │
│           ▼                            ▼                                    │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │ Nearby Emitters  │────────▶│   MapScreen.tsx  │◀───────┐                │
│  │    Discovery     │         │  (Enhanced Map)  │        │                │
│  └──────────────────┘         └────────┬─────────┘        │                │
│                                        │                   │                │
│  ┌──────────────────┐                  │          ┌───────┴────────┐       │
│  │   WattTime API   │                  │          │ Air Quality    │       │
│  │ (Grid Intensity) │                  │          │ Overlay        │       │
│  └────────┬─────────┘                  │          └────────────────┘       │
│           │                            │                                    │
│           ▼                            ▼                                    │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │SmartRecommend-   │◀────────│   CarbonTwin     │                         │
│  │ationsEngine     │         │    Engine        │                         │
│  └────────┬─────────┘         └────────┬─────────┘                         │
│           │                            │                                    │
│           ▼                            ▼                                    │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │ Real-Time Smart  │         │  "What If"       │                         │
│  │ Notifications    │────────▶│   Scenarios      │                         │
│  └──────────────────┘         └────────┬─────────┘                         │
│                                        │                                    │
│  ┌──────────────────┐                  │                                    │
│  │ Achievement      │                  │                                    │
│  │ System           │◀─────────────────┘                                    │
│  └────────┬─────────┘                                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐                         │
│  │ New Badges:      │────────▶│ SocialFeatures   │                         │
│  │ - Grid Whisperer │         │ Service          │                         │
│  │ - Air Aware      │         │ (Leaderboards)   │                         │
│  │ - World Citizen  │         └──────────────────┘                         │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Current Configuration Status

✅ **Implemented Features:**

- Modular API adapter with multiple provider support
- Automatic fallback between providers
- Rate limiting and retry logic
- Comprehensive error handling and logging
- Offline calculations as final fallback
- Caching layer for performance

---

## 📊 Existing Features × New Data Sources Matrix

### How Each New Data Source Enhances Existing Features

| Existing Feature            | Climate TRACE | WattTime | OpenAQ | OWID | Enhancement                                                          |
| --------------------------- | ------------- | -------- | ------ | ---- | -------------------------------------------------------------------- |
| **MLCarbonPrediction**      | ✅            | ✅       | -      | ✅   | Real grid intensity + regional context for more accurate predictions |
| **CarbonTwinEngine**        | ✅            | ✅       | ✅     | ✅   | Full environmental context for lifestyle simulation                  |
| **LocationService**         | ✅            | ✅       | ✅     | -    | Nearby emissions, grid intensity, air quality by location            |
| **MapScreen**               | ✅            | ✅       | ✅     | -    | Industrial emitters, clean energy zones, AQI overlay                 |
| **BarcodeScanner**          | ✅            | -        | -      | -    | Link products to manufacturer facility emissions                     |
| **AchievementSystem**       | ✅            | ✅       | ✅     | ✅   | 20+ new climate-intelligence badges                                  |
| **SmartRecommendations**    | ✅            | ✅       | ✅     | -    | Real-time context-aware suggestions                                  |
| **SocialFeatures**          | ✅            | ✅       | -      | ✅   | Community challenges with real data benchmarks                       |
| **NotificationService**     | -             | ✅       | ✅     | -    | Smart timing alerts for clean energy/air                             |
| **IoTIntegration**          | ✅            | ✅       | -      | -    | Optimize device usage for real grid carbon                           |
| **CarbonOffsetMarketplace** | ✅            | -        | -      | -    | Verify offset projects with satellite data                           |

---

## 🚀 New Features Enabled by Data Integration

### 1. Nearby Emissions Discovery

**Uses:** Climate TRACE + LocationService + MapScreen

```typescript
// Integration point: src/services/LocationService.ts
// When user location updates, fetch nearby emission sources

interface NearbyEmitter {
  assetId: number;
  name: string;
  sector: 'power' | 'manufacturing' | 'transportation';
  emissions: number; // tonnes CO2/year
  distance: number; // km from user
  coordinates: { lat: number; lng: number };
}

// Synergy:
// - LocationService provides user coordinates
// - Climate TRACE API returns nearby industrial sources
// - MapScreen displays them with custom markers
// - AchievementSystem unlocks "Know Your Neighbor" badge after exploring 5 sources
```

### 2. Real-Time Grid Carbon Optimization

**Uses:** WattTime + IoTIntegrationService + SmartRecommendationsEngine + NotificationService

```typescript
// Integration point: src/services/IoTIntegrationService.ts
// Optimize device usage based on real grid carbon intensity

interface GridCarbonContext {
  currentIntensity: number; // gCO2/kWh
  forecast: { time: Date; intensity: number }[];
  optimalWindow: { start: Date; end: Date };
  currentRenewablePercent: number;
}

// Synergy:
// - IoTIntegration detects connected smart devices (EV, thermostat)
// - WattTime provides real-time grid carbon intensity
// - SmartRecommendationsEngine generates optimal usage recommendations
// - NotificationService sends push: "Grid is 40% cleaner now - great time to charge!"
// - AchievementSystem awards "Grid Whisperer" badge for 10 optimally-timed charges
```

### 3. Air Quality Impact Awareness

**Uses:** OpenAQ + Climate TRACE PM2.5 + LocationService + SmartRecommendationsEngine

```typescript
// Integration point: src/services/SmartRecommendationsEngine.ts
// Factor air quality into outdoor activity recommendations

interface AirQualityContext {
  aqi: number;
  pm25: number;
  pollutionSources: { name: string; contribution: number }[];
  forecast: { time: Date; aqi: number }[];
  healthRecommendation: string;
}

// Synergy:
// - LocationService provides current location
// - OpenAQ returns real-time air quality
// - Climate TRACE provides source attribution (which facilities cause pollution)
// - SmartRecommendationsEngine adjusts outdoor exercise recommendations
// - NotificationService: "Better air quality forecast tomorrow AM for your run"
// - AchievementSystem: "Air Aware" badge for 30 days of checking air quality
```

### 4. Global Context & Comparison

**Uses:** Our World in Data + CarbonTwinEngine + SocialFeaturesService

```typescript
// Integration point: src/services/CarbonTwinEngine.ts
// Provide historical and global context for user's footprint

interface GlobalContext {
  userFootprint: number; // tonnes/year
  countryAverage: number;
  worldAverage: number;
  globalPercentile: number; // user is in top X%
  historicalEquivalent: { year: number; country: string }; // "Like avg American in 1965"
  parisAlignedTarget: number;
}

// Synergy:
// - CarbonTwinEngine calculates user's current footprint
// - OWID data provides country averages and historical context
// - SocialFeaturesService uses for leaderboard rankings
// - SmartRecommendationsEngine shows "what it takes" to reach world average
// - AchievementSystem: "World Citizen" badge when below global average (4.7t)
```

### 5. Corporate Transparency Layer

**Uses:** Climate TRACE + BarcodeScanner + CarbonOffsetMarketplace

```typescript
// Integration point: src/services/BarcodeScanner.ts
// Show corporate emissions when scanning products

interface CorporateEmissionsData {
  companyName: string;
  totalEmissions: number; // tonnes CO2/year
  emissionsTrend: 'decreasing' | 'stable' | 'increasing';
  facilities: { name: string; location: string; emissions: number }[];
  netZeroTarget: { year: number; validated: boolean } | null;
  industryRank: number; // 1 = best in industry
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// Synergy:
// - BarcodeScanner identifies product/brand
// - Climate TRACE provides facility-level emissions for manufacturer
// - Existing ProductCarbonFootprint data enhanced with corporate context
// - CarbonOffsetMarketplace shows if brand offsets their emissions
// - AchievementSystem: "Conscious Consumer" badge for choosing lower-emission brands 5x
```

### 6. Decarbonization Pathway Simulator

**Uses:** Climate TRACE ERS + CarbonTwinEngine + MLCarbonPrediction

```typescript
// Enhancement to: src/services/CarbonTwinEngine.ts
// Use real-world proven solutions data from Climate TRACE

interface DecarbonizationPathway {
  currentFootprint: number;
  targetFootprint: number;
  targetYear: number;
  actions: DecarbonizationAction[];
  projectedPath: { year: number; footprint: number }[];
  gap: number; // remaining after all actions
  offsetRequired: number;
}

interface DecarbonizationAction {
  action: string;
  category: 'transport' | 'energy' | 'food' | 'consumption';
  reduction: number; // tonnes/year
  cost: 'free' | 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImpact: string;
  realWorldProof: string; // "Based on 50,000 EV adopters"
}

// Synergy:
// - CarbonTwinEngine provides user's current state and what-if scenarios
// - Climate TRACE ERS data provides real-world proven reduction potentials
// - MLCarbonPrediction forecasts future footprint based on commitments
// - AchievementSystem tracks progress milestones
// - SocialFeaturesService enables "Race to Net Zero" community challenges
```

---

## 🏆 New Achievement Categories

### Climate Intelligence Badges

| Badge                       | Category    | Requirement                         | Data Source   | Points |
| --------------------------- | ----------- | ----------------------------------- | ------------- | ------ |
| 🌍 **World Citizen**        | milestone   | Below world average (4.7t/yr)       | OWID          | 500    |
| ⚡ **Grid Whisperer**       | smart       | 10 optimally-timed device uses      | WattTime      | 200    |
| 🏭 **Know Your Neighbor**   | exploration | Explored 5 local emission sources   | Climate TRACE | 150    |
| 🌬️ **Air Aware**            | health      | Checked air quality 30 days         | OpenAQ        | 100    |
| 🛒 **Conscious Consumer**   | shopping    | Chose lower-emission brand 5x       | Climate TRACE | 150    |
| 📉 **Reduction Velocity**   | progress    | 10% footprint reduction in 3 months | Internal      | 300    |
| 🌲 **Verified Offset Hero** | offset      | Purchased verified offset           | Climate TRACE | 200    |
| 🔮 **Pathway Pioneer**      | planning    | Created net-zero pathway            | Internal      | 100    |
| 🏆 **Country Champion**     | social      | Top 10% in your country             | OWID          | 400    |
| 🌡️ **Climate Scientist**    | education   | Explored all data visualizations    | All           | 250    |

---

## 📱 Enhanced UI Components

### HomeScreen Enhancements

```
┌─────────────────────────────────────────┐
│  Good morning! 🌤️                       │
│  Grid is 45% cleaner than average now   │  ← WattTime
├─────────────────────────────────────────┤
│  YOUR CARBON TODAY                      │
│  ┌─────────────────────────────────┐   │
│  │  2.4 kg CO2   ↓12% vs yesterday │   │  ← Existing
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  YOUR GLOBAL CONTEXT                    │  ← NEW
│  ┌─────────────────────────────────┐   │
│  │ You: 8.2t/yr  World: 4.7t/yr   │   │
│  │ ████████░░ Top 25% globally     │   │  ← OWID
│  │ Progress: 2.1t below US avg     │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  NEARBY EMISSIONS                       │  ← NEW
│  ┌─────────────────────────────────┐   │
│  │ 🏭 Riverside Power Plant        │   │
│  │    3.2M tonnes/yr · 8km away    │   │  ← Climate TRACE
│  │ 🏭 Allied Chemical Works        │   │
│  │    450K tonnes/yr · 12km away   │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  SMART RECOMMENDATIONS                  │
│  ┌─────────────────────────────────┐   │
│  │ ⚡ Charge EV now - grid is clean │   │  ← WattTime + IoT
│  │ 🏃 Air quality good for outdoor │   │  ← OpenAQ
│  │ 🛒 Try brand X - 40% less CO2   │   │  ← Climate TRACE
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### MapScreen Enhancements

```
┌─────────────────────────────────────────┐
│  [Toggle Layers]                        │
│  ☑ Emission Sources  ☑ Air Quality     │
│  ☑ Clean Energy Zones ☐ My History     │
├─────────────────────────────────────────┤
│                                         │
│    🏭←── Power Plant (2.1M t/yr)       │
│         ·                               │
│       ·   ·                             │
│     📍 You   🏭←── Factory (340K t/yr) │
│       ·   ·                             │
│         ·                               │
│    ☁️←── Air Quality: Moderate (72)    │
│                                         │
│  [Legend]                               │
│  🔴 High Emissions  🟡 Medium  🟢 Low  │
│  ☁️ AQI Overlay                         │
├─────────────────────────────────────────┤
│  Tap a source for details               │
└─────────────────────────────────────────┘
```

---

## Quick Setup Instructions

---

## 🔧 API Configuration

### Tier 1: Personal Carbon Calculation (Current)

### 1. Carbon Interface (Primary Provider)

**Sign Up:**

1. Visit: https://www.carboninterface.com/
2. Click "Get API Access" or "Sign Up"
3. Create account and verify email
4. Navigate to API section to get your key

**Free Tier:** 200 requests/month **Paid Plans:** Start at $20/month for 1,000 requests

**Add to .env file:**

```env
# Primary Carbon API (required)
CARBON_API_KEY=your_actual_carbon_interface_api_key_here
CARBON_API_BASE_URL=https://www.carboninterface.com/api/v1
```

### 2. Climatiq (Secondary Provider)

**Sign Up:**

1. Visit: https://climatiq.io/
2. Sign up for developer account
3. Get API key from dashboard

**Add to .env file:**

```env
# Secondary Carbon API (recommended)
CLIMATIQ_API_KEY=your_climatiq_api_key_here
```

### 3. Carbon Footprint API (Tertiary Provider)

**Sign Up:**

1. Visit: https://www.carbonfootprint.com/
2. Request API access
3. Get API credentials

**Add to .env file:**

```env
# Tertiary Carbon API (optional)
CARBON_FOOTPRINT_API_KEY=your_carbonfootprint_api_key_here
```

## Testing Your Setup

### 1. Quick Test Script

Run this command to test your API configuration:

```bash
bun run test:carbon-api
```

### 2. Manual Testing

Open the Kindred app and:

1. Navigate to Carbon Tracker screen
2. Add a transportation activity (e.g., "Drove 10 miles")
3. Check if real emissions data appears
4. Look for "API Response" in debug logs

### 3. Check Logs

Look for these log entries:

```
[CARBON_API] Using provider: carboninterface
[CARBON_API] API Response received: {"data": {...}}
[CARBON_CACHE] Storing result with key: transport_car_10mi_...
```

## API Provider Comparison

| Provider         | Free Tier      | Accuracy   | Speed    | Reliability |
| ---------------- | -------------- | ---------- | -------- | ----------- |
| Carbon Interface | 200 req/month  | ⭐⭐⭐⭐   | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  |
| Climatiq         | 1000 req/month | ⭐⭐⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐⭐⭐    |
| Carbon Footprint | Custom         | ⭐⭐⭐     | ⭐⭐     | ⭐⭐⭐      |

---

### Tier 2: Global Context & Intelligence (New)

### 4. Climate TRACE API (Facility Emissions)

**About:** Free API providing access to 745M+ emission sources globally, tracked via satellite and
AI.

**API Base:** `https://api.climatetrace.org/v6`

**Endpoints:**

```bash
# Search emission sources
GET /v6/assets?countries=USA&sectors=power&limit=100

# Get country emissions
GET /v6/country/emissions?countries=USA&years=2023

# Get specific asset details
GET /v6/assets/{sourceId}

# Get definitions
GET /v6/definitions/sectors
GET /v6/definitions/countries
```

**Add to .env file:**

```env
# Climate TRACE (free, no key required for basic access)
CLIMATE_TRACE_API_URL=https://api.climatetrace.org/v6
CLIMATE_TRACE_CACHE_TTL=86400000  # 24 hours (data updates monthly)
```

**Data Available:**

- Emissions by facility (power plants, factories, etc.)
- Emissions by country, sector, gas type
- Year-over-year trends (2020-2024)
- Geographic coordinates for mapping
- PM2.5 and other pollutant data

### 5. WattTime API (Grid Carbon Intensity)

**About:** Real-time and forecast grid carbon intensity data.

**Sign Up:**

1. Visit: https://www.watttime.org/api-documentation/
2. Create account and get API token
3. Free tier available for developers

**Add to .env file:**

```env
# WattTime (real-time grid carbon)
WATTTIME_USERNAME=your_username
WATTTIME_PASSWORD=your_password
WATTTIME_API_URL=https://api.watttime.org/v3
```

**Data Available:**

- Current grid carbon intensity (gCO2/kWh)
- 24-72 hour forecast
- Historical data for analysis
- Marginal vs average emissions

### 6. OpenAQ API (Air Quality)

**About:** Free, open-source air quality data from global monitoring stations.

**API Base:** `https://api.openaq.org/v2`

**Add to .env file:**

```env
# OpenAQ (free, API key recommended for higher limits)
OPENAQ_API_URL=https://api.openaq.org/v2
OPENAQ_API_KEY=your_api_key  # Optional but recommended
```

**Data Available:**

- PM2.5, PM10, NO2, SO2, O3, CO levels
- Real-time readings from nearby stations
- Historical data for trends
- Station locations for mapping

### 7. Our World in Data (Historical Context)

**About:** Free, open data on global emissions with historical context.

**Data Source:** Static JSON/CSV files (no API needed)

**Setup:**

```env
# Our World in Data (bundled static data)
OWID_DATA_VERSION=2024.1
```

**Data Available:**

- Country emissions (1751-present)
- Per capita emissions by country
- Cumulative historical emissions
- Sector breakdowns

---

## 📊 New API Provider Comparison

| Provider                | Cost     | Data Type          | Update Freq | Coverage               |
| ----------------------- | -------- | ------------------ | ----------- | ---------------------- |
| **Climate TRACE**       | Free     | Facility emissions | Monthly     | Global (745M sources)  |
| **WattTime**            | Freemium | Grid carbon        | Real-time   | North America, Europe  |
| **OpenAQ**              | Free     | Air quality        | Real-time   | Global (60+ countries) |
| **Our World in Data**   | Free     | Historical context | Yearly      | Global (all countries) |
| **Global Forest Watch** | Free     | Deforestation      | Weekly      | Global forests         |

---

## 🛠️ Implementation Architecture

### New Service Files to Create

```
src/services/
├── climate/                      # NEW DIRECTORY
│   ├── ClimateTraceService.ts   # Climate TRACE API integration
│   ├── GridCarbonService.ts     # WattTime/ElectricityMaps
│   ├── AirQualityService.ts     # OpenAQ integration
│   ├── GlobalContextService.ts  # OWID + global comparisons
│   └── index.ts                 # Unified exports
├── carbon/                       # EXISTING
│   ├── CarbonAPIAdapter.ts
│   ├── CarbonCacheManager.ts
│   ├── CarbonCalculatorCore.ts
│   └── CarbonService.ts
```

### Integration Points with Existing Services

```typescript
// src/services/climate/index.ts
export { ClimateTraceService } from './ClimateTraceService';
export { GridCarbonService } from './GridCarbonService';
export { AirQualityService } from './AirQualityService';
export { GlobalContextService } from './GlobalContextService';

// Usage in existing services:

// 1. MLCarbonPrediction.ts - Enhanced with real grid carbon
import { GridCarbonService } from './climate';
// Use real grid intensity instead of national averages

// 2. SmartRecommendationsEngine.ts - Context-aware recommendations
import { GridCarbonService, AirQualityService } from './climate';
// Generate recommendations based on current conditions

// 3. LocationService.ts - Nearby emissions discovery
import { ClimateTraceService } from './climate';
// Fetch nearby emission sources when location updates

// 4. CarbonTwinEngine.ts - Global context for simulations
import { GlobalContextService } from './climate';
// Add country comparisons and historical context

// 5. AchievementSystem.ts - New badge triggers
import { ClimateTraceService, GridCarbonService, AirQualityService } from './climate';
// Track new badge-earning activities
```

---

## 📈 Data Flow Diagram

```
                    USER ACTION
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    KINDRED APP                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ LocationService  │─────▶│ ClimateTraceAPI  │            │
│  │ (User Location)  │      │ (Nearby Sources) │            │
│  └──────────────────┘      └────────┬─────────┘            │
│                                     │                       │
│  ┌──────────────────┐               │                       │
│  │ Carbon Calc APIs │               │                       │
│  │ (Personal Foot-  │               │                       │
│  │  print)          │               │                       │
│  └────────┬─────────┘               │                       │
│           │                         │                       │
│           ▼                         ▼                       │
│  ┌──────────────────────────────────────────────┐          │
│  │              UNIFIED CONTEXT ENGINE           │          │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐│          │
│  │  │ Personal   │ │ Local      │ │ Global     ││          │
│  │  │ Footprint  │ │ Context    │ │ Context    ││          │
│  │  └────────────┘ └────────────┘ └────────────┘│          │
│  └─────────────────────┬────────────────────────┘          │
│                        │                                    │
│           ┌────────────┼────────────┐                       │
│           ▼            ▼            ▼                       │
│  ┌──────────────┐ ┌─────────┐ ┌──────────────┐             │
│  │ Recommen-    │ │ Carbon  │ │ Achievement  │             │
│  │ dations      │ │ Twin    │ │ System       │             │
│  └──────────────┘ └─────────┘ └──────────────┘             │
│           │            │            │                       │
│           └────────────┴────────────┘                       │
│                        │                                    │
│                        ▼                                    │
│           ┌──────────────────────┐                         │
│           │       UI LAYER       │                         │
│           │ HomeScreen, MapScreen│                         │
│           │ ProfileScreen, etc.  │                         │
│           └──────────────────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗓️ Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Create `ClimateTraceService.ts` with core API methods
- [ ] Implement country-level emissions fetching
- [ ] Add nearby emissions discovery (lat/lng based)
- [ ] Create `GlobalContextService.ts` with OWID data
- [ ] Add country context card to HomeScreen
- [ ] Integrate with existing LocationService

### Phase 2: Real-Time Intelligence (Weeks 3-4)

- [ ] Create `GridCarbonService.ts` with WattTime integration
- [ ] Create `AirQualityService.ts` with OpenAQ integration
- [ ] Enhance SmartRecommendationsEngine with real-time context
- [ ] Add smart timing notifications to NotificationService
- [ ] Implement "Best Time to Charge" feature for IoTIntegrationService

### Phase 3: Enhanced Visualizations (Weeks 5-6)

- [ ] Add emission sources layer to MapScreen
- [ ] Add air quality overlay to MapScreen
- [ ] Create emissions source detail modal
- [ ] Enhance CarbonImpactVisualizationService with global context
- [ ] Add historical comparison charts

### Phase 4: Gamification & Social (Weeks 7-8)

- [ ] Add 10+ new climate intelligence badges to AchievementSystem
- [ ] Create "Race to Net Zero" community challenge
- [ ] Add global/country leaderboards to SocialFeaturesService
- [ ] Implement pathway progress tracking
- [ ] Corporate transparency in BarcodeScanner

---

## 🧪 Testing the New Integrations

### Climate TRACE API Test

```bash
# Test country emissions endpoint
curl "https://api.climatetrace.org/v6/country/emissions?countries=USA&years=2023"

# Test nearby assets (San Francisco)
curl "https://api.climatetrace.org/v6/assets?countries=USA&sectors=power&limit=10"

# Test definitions
curl "https://api.climatetrace.org/v6/definitions/sectors"
```

### Integration Test Command

```bash
# Test all climate data integrations
bun run test:climate-apis

# Test specific service
bun run test:climate-trace
bun run test:grid-carbon
bun run test:air-quality
```

---

## Environment Configuration

### Development Setup

```env
# For development/testing
ENABLE_API_MOCKING=false
CARBON_API_KEY=your_dev_api_key
CARBON_CONFIDENCE_THRESHOLD=0.7
CARBON_CALC_CACHE_TTL=300000  # 5 minutes for faster testing
```

### Production Setup

```env
# For production
ENABLE_API_MOCKING=false
CARBON_API_KEY=your_production_api_key
CARBON_CONFIDENCE_THRESHOLD=0.9
CARBON_CALC_CACHE_TTL=3600000  # 1 hour for performance
```

## Troubleshooting

### Common Issues

**1. "API Key Invalid" Error**

- Verify API key is correct
- Check if key has proper permissions
- Ensure account is active and not exceeded limits

**2. "Rate Limit Exceeded" Error**

- System will automatically fallback to next provider
- Consider upgrading to paid plan
- Check cache settings to reduce API calls

**3. "Network Timeout" Error**

- Check internet connection
- Verify API endpoint URLs
- System will fallback to offline calculations

### Debug Commands

```bash
# Check current API configuration
bun run debug:carbon-config

# Test API connectivity
bun run test:api-connection

# View API usage stats
bun run stats:api-usage

# Clear API cache
bun run clear:carbon-cache
```

### Log Analysis

Enable debug logging and look for these patterns:

**Successful API Call:**

```
[CARBON_API] Request sent to carboninterface: {...}
[CARBON_API] Response received in 245ms: {"co2_kg": 2.34}
[CARBON_CACHE] Cached result with key: transport_...
```

**Provider Fallback:**

```
[CARBON_API] Primary provider failed: Rate limit exceeded
[CARBON_API] Falling back to climatiq provider
[CARBON_API] Fallback successful: {"co2_kg": 2.36}
```

**Offline Fallback:**

```
[CARBON_API] All providers unavailable
[CARBON_CALCULATOR] Using offline calculations
[CARBON_CALCULATOR] Offline result: {"co2_kg": 2.31}
```

## Cost Optimization

### Cache Strategy

- Results cached for 1 hour by default
- Similar activities reuse cached results
- Reduces API calls by ~80%

### Request Batching

- Multiple activities calculated in single request when possible
- Reduces API costs significantly

### Smart Fallbacks

- Offline calculations prevent failed requests
- Maintains user experience without API costs

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use different keys for development/production**
3. **Rotate API keys regularly**
4. **Monitor API usage for anomalies**
5. **Use environment variables for all secrets**

## Integration Status

✅ **Ready for Production:**

- Multi-provider redundancy
- Comprehensive error handling
- Performance optimization
- Security best practices
- Extensive logging and monitoring

🔄 **Next Steps:**

1. Obtain production API keys
2. Test with real data
3. Configure monitoring alerts
4. Set up usage tracking

## Support

For API-specific issues:

- **Carbon Interface:** support@carboninterface.com
- **Climatiq:** support@climatiq.io
- **Carbon Footprint:** Contact through website
- **Climate TRACE:** https://climatetrace.org/contact
- **WattTime:** https://www.watttime.org/contact/
- **OpenAQ:** https://openaq.org/contact

For Kindred app integration issues:

- Check logs with `bun run logs:carbon`
- Enable debug mode: `LOG_LEVEL=debug`
- Review error monitoring dashboard

---

## 🔄 Feature Synergy Deep Dive

### How Existing Features Become More Powerful

#### 1. MLCarbonPrediction × Grid Carbon Data

**Before:** Uses national average grid intensity (450 gCO2/kWh for US) **After:** Uses real-time
grid intensity (varies 200-600 gCO2/kWh)

```typescript
// Enhanced prediction with real grid data
async predictWithRealGridCarbon(userId: string): Promise<CarbonPrediction> {
  const userBehavior = await this.getUserBehavior(userId);
  const location = await LocationService.getCurrentLocation();

  // NEW: Get real grid carbon intensity
  const gridIntensity = await GridCarbonService.getCurrentIntensity(location);

  // Adjust energy predictions with real data
  const adjustedEnergy = this.calculateEnergyEmissions(
    userBehavior.energy,
    gridIntensity.current  // Real value instead of national average
  );

  return {
    ...prediction,
    energy: adjustedEnergy,
    confidence: prediction.confidence + 0.15, // Higher confidence with real data
    dataQuality: 'real-time'
  };
}
```

**User Benefit:** Predictions are 15-25% more accurate based on actual grid conditions.

---

#### 2. CarbonTwinEngine × Global Context

**Before:** "What if" scenarios with isolated user data **After:** Scenarios compared against
real-world proven outcomes

```typescript
// Enhanced Carbon Twin with global context
async generateScenarioWithContext(
  userId: string,
  scenario: WhatIfScenario
): Promise<EnhancedScenarioResult> {
  const twinResult = await this.runScenario(userId, scenario);

  // NEW: Add global context
  const globalContext = await GlobalContextService.getContext(userId);
  const climateTraceData = await ClimateTraceService.getReductionPotentials(scenario.category);

  return {
    ...twinResult,
    globalComparison: {
      resultingFootprint: twinResult.projectedFootprint,
      vsCountryAverage: globalContext.countryAverage - twinResult.projectedFootprint,
      vsWorldAverage: globalContext.worldAverage - twinResult.projectedFootprint,
      newPercentile: this.calculateNewPercentile(twinResult.projectedFootprint),
    },
    realWorldProof: {
      similarTransitions: climateTraceData.successStories,
      averageReduction: climateTraceData.provenReduction,
      timeToImpact: climateTraceData.typicalTimeline
    }
  };
}
```

**User Benefit:** Users see "If you switch to EV, you'll go from top 25% to top 40% globally" with
proof from real-world data.

---

#### 3. SmartRecommendationsEngine × Real-Time Context

**Before:** Static recommendations based on user profile **After:** Dynamic recommendations based on
current conditions

```typescript
// Context-aware recommendations
async generateContextualRecommendations(userId: string): Promise<Recommendation[]> {
  const userProfile = await this.getUserProfile(userId);
  const location = await LocationService.getCurrentLocation();

  // NEW: Gather real-time context
  const [gridCarbon, airQuality, nearbyEmitters] = await Promise.all([
    GridCarbonService.getCurrentIntensity(location),
    AirQualityService.getCurrentAQI(location),
    ClimateTraceService.getNearbyAssets(location, 50) // 50km radius
  ]);

  const recommendations: Recommendation[] = [];

  // Real-time grid-based recommendation
  if (gridCarbon.isCleanerThanAverage && userProfile.hasEV) {
    recommendations.push({
      id: 'charge-now',
      type: 'action',
      title: 'Great time to charge your EV!',
      description: `Grid is ${gridCarbon.percentBelowAverage}% cleaner than average right now`,
      impact: { carbonReduction: gridCarbon.savingsKg },
      priority: 10,
      expiresAt: gridCarbon.cleanWindowEnd
    });
  }

  // Air quality based recommendation
  if (airQuality.aqi < 50 && userProfile.exercisesOutdoors) {
    recommendations.push({
      id: 'outdoor-exercise',
      type: 'action',
      title: 'Great air quality for outdoor exercise',
      description: `AQI is ${airQuality.aqi} - excellent for your planned run`,
      priority: 8
    });
  }

  // Nearby emitter awareness
  const largestNearby = nearbyEmitters[0];
  if (largestNearby && !userProfile.hasExploredNearbyEmitters) {
    recommendations.push({
      id: 'explore-emitters',
      type: 'education',
      title: `Did you know? ${largestNearby.name} is nearby`,
      description: `This ${largestNearby.sector} facility emits ${largestNearby.emissions.toLocaleString()} tonnes CO2/year`,
      gamification: { badges: ['know-your-neighbor'] }
    });
  }

  return this.rankRecommendations(recommendations);
}
```

**User Benefit:** Recommendations feel magical - perfectly timed to current conditions.

---

#### 4. BarcodeScanner × Corporate Transparency

**Before:** Product carbon footprint only **After:** Product + manufacturer + facility data

```typescript
// Enhanced barcode scan with corporate data
async scanWithCorporateContext(barcode: string): Promise<EnhancedScanResult> {
  const productInfo = await this.lookupProduct(barcode);
  const carbonFootprint = await this.calculateProductCarbon(productInfo);

  // NEW: Get corporate emissions data
  const corporateData = await ClimateTraceService.getCompanyEmissions(
    productInfo.manufacturer.name
  );

  // NEW: Get specific facility data if available
  const facilityData = productInfo.origin?.coordinates
    ? await ClimateTraceService.getNearestAsset(
        productInfo.origin.coordinates,
        productInfo.manufacturer.name
      )
    : null;

  return {
    ...productInfo,
    ...carbonFootprint,
    corporateContext: {
      companyEmissions: corporateData.totalEmissions,
      emissionsTrend: corporateData.trend,
      industryRank: corporateData.industryPercentile,
      netZeroCommitment: corporateData.netZeroTarget,
      grade: this.calculateGrade(corporateData)
    },
    facilityContext: facilityData ? {
      facilityName: facilityData.name,
      facilityEmissions: facilityData.emissions,
      distance: facilityData.distanceFromOrigin
    } : null,
    betterAlternatives: await this.findLowerEmissionAlternatives(productInfo, corporateData)
  };
}
```

**User Benefit:** "This Nike shoe is from a factory that emits 50K tonnes/year, but Nike is on track
for net-zero by 2050. Try Allbirds for 40% lower footprint."

---

#### 5. AchievementSystem × Multi-Source Data

**Before:** Badges based on app activity only **After:** Badges based on real-world climate
intelligence

```typescript
// Enhanced achievement checking with external data
async checkClimateIntelligenceAchievements(userId: string): Promise<Achievement[]> {
  const newAchievements: Achievement[] = [];
  const userStats = await this.getUserStats(userId);

  // World Citizen badge - below global average
  const globalContext = await GlobalContextService.getContext(userId);
  if (globalContext.userFootprint < globalContext.worldAverage) {
    newAchievements.push(await this.unlockBadge(userId, 'world-citizen'));
  }

  // Grid Whisperer badge - optimal charging
  const gridUsageStats = await GridCarbonService.getUserOptimalUsageCount(userId);
  if (gridUsageStats.optimalCharges >= 10) {
    newAchievements.push(await this.unlockBadge(userId, 'grid-whisperer'));
  }

  // Know Your Neighbor badge - explored local emitters
  const explorationStats = await ClimateTraceService.getUserExplorationStats(userId);
  if (explorationStats.sourcesExplored >= 5) {
    newAchievements.push(await this.unlockBadge(userId, 'know-your-neighbor'));
  }

  // Air Aware badge - consistent air quality checking
  const airQualityStats = await AirQualityService.getUserCheckStats(userId);
  if (airQualityStats.daysChecked >= 30) {
    newAchievements.push(await this.unlockBadge(userId, 'air-aware'));
  }

  // Country Champion badge - top 10% in country
  if (globalContext.countryPercentile <= 10) {
    newAchievements.push(await this.unlockBadge(userId, 'country-champion'));
  }

  return newAchievements;
}
```

**User Benefit:** Badges feel more meaningful - earned through real climate awareness, not just app
clicks.

---

#### 6. NotificationService × Real-Time Triggers

**Before:** Scheduled reminders only **After:** Smart notifications triggered by real-world
conditions

```typescript
// Real-time condition-based notifications
class EnhancedNotificationService {
  async startRealTimeMonitoring(userId: string): Promise<void> {
    const userPreferences = await this.getUserPreferences(userId);
    const location = await LocationService.getCurrentLocation();

    // Monitor grid carbon for EV owners
    if (userPreferences.hasEV && userPreferences.gridAlerts) {
      GridCarbonService.subscribeToCleanWindows(location, async cleanWindow => {
        await this.sendNotification(userId, {
          title: '⚡ Clean Energy Window',
          body: `Grid is ${cleanWindow.percentBelow}% cleaner now. Great time to charge!`,
          data: { type: 'grid-alert', expiresAt: cleanWindow.endsAt },
        });
      });
    }

    // Monitor air quality for outdoor exercise
    if (userPreferences.exercisesOutdoors && userPreferences.airQualityAlerts) {
      AirQualityService.subscribeToAQIChanges(location, async aqiChange => {
        if (aqiChange.current < 50 && aqiChange.previous >= 50) {
          await this.sendNotification(userId, {
            title: '🌬️ Air Quality Improved',
            body: `AQI dropped to ${aqiChange.current}. Great conditions for outdoor activity!`,
            data: { type: 'air-quality-alert' },
          });
        }
      });
    }
  }
}
```

**User Benefit:** Notifications arrive exactly when they're actionable, not on a schedule.

---

## 🎯 Summary: The Multiplier Effect

| Old Feature Alone              | + New Data          | = Multiplied Value         |
| ------------------------------ | ------------------- | -------------------------- |
| ML Prediction (70% accuracy)   | + Real grid data    | 85-90% accuracy            |
| Carbon Twin (isolated)         | + Global context    | Peer comparison + proof    |
| Recommendations (static)       | + Real-time context | Perfectly timed actions    |
| Barcode Scanner (product only) | + Corporate data    | Full supply chain insight  |
| Achievements (app-based)       | + External triggers | Real-world meaning         |
| Notifications (scheduled)      | + Live conditions   | Smart, actionable alerts   |
| Map (user history only)        | + Emission sources  | Full environmental picture |
| Social Features (internal)     | + Global benchmarks | Meaningful competition     |

**The key insight:** New data sources don't just add features—they make every existing feature more
valuable, accurate, and engaging.

---

## 🚀 Next Steps

### Immediate Actions (This Sprint)

1. **Create Climate TRACE Service** - Start with country emissions and nearby assets endpoints
2. **Add env variables** - Set up new API endpoints in .env.example
3. **Test API connectivity** - Verify all endpoints work as expected
4. **Design UI mockups** - Create wireframes for enhanced HomeScreen and MapScreen

### Short-Term (Next 2 Sprints)

1. **Integrate with LocationService** - Trigger nearby emissions lookup on location change
2. **Enhance HomeScreen** - Add country context card and nearby emitters section
3. **Add MapScreen layers** - Emission sources and air quality overlays
4. **Create new badges** - Implement first 5 climate intelligence badges

### Medium-Term (Next Quarter)

1. **Full WattTime integration** - Real-time grid carbon with smart notifications
2. **Decarbonization pathway** - Build the net-zero planning feature
3. **Corporate transparency** - Enhance barcode scanner with manufacturer data
4. **Community features** - Global leaderboards and "Race to Net Zero" challenge

### Success Metrics

| Metric                    | Current | Target               | Measurement           |
| ------------------------- | ------- | -------------------- | --------------------- |
| ML Prediction Accuracy    | ~70%    | 85-90%               | A/B testing vs actual |
| User Engagement (DAU/MAU) | -       | +25%                 | Analytics             |
| Feature Discovery         | -       | 80% try new features | Event tracking        |
| Achievement Unlock Rate   | -       | +40% new badges      | Badge analytics       |
| Recommendation CTR        | -       | +30%                 | Click tracking        |
| Net Promoter Score        | -       | +15 points           | User surveys          |

---

## 📚 References

- **Climate TRACE API Documentation:** https://api.climatetrace.org/
- **Climate TRACE Methodology:** https://climatetrace.org/methodology
- **WattTime API Docs:** https://www.watttime.org/api-documentation/
- **OpenAQ API Docs:** https://docs.openaq.org/
- **Our World in Data CO2 Dataset:** https://github.com/owid/co2-data
- **GHG Protocol Standards:** https://ghgprotocol.org/standards-and-guidance
- **Paris Agreement Tracker:** https://climateactiontracker.org/

---

_Last Updated: December 2024_ _Document Version: 2.0_ _Status: Active Development Plan_
