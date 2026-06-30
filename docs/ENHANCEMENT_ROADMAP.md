# Kindred Enhancement Roadmap 🚀

**Last Updated:** June 27, 2026  
**Current Phase:** Path B — Advanced Feature Development

---

## ✅ Completed

### Path A: Tech Debt & Quality

- [x] TypeScript strict mode, ESLint, Prettier, pre-commit hooks
- [x] Jest test suite configuration + 75% coverage target
- [x] Documentation overhaul (README, docs map, all guides)
- [x] Metro bundler stabilisation + 16KB page alignment fix

### Path B1: Real-Time Social & Gamification

- [x] WebSocket service with room-based pub/sub + reconnect
- [x] Real-time activity feed with live pulse animation
- [x] Neighbourhood leaderboards (anonymous + friends)
- [x] Streaks, missions, weekly/monthly challenges
- [x] Live connection status indicator

### Path B2: AI Vision for Waste Categorization

- [x] Camera integration (`SmartCameraCapture.tsx`)
- [x] TensorFlow.js prediction pipeline with dev mock fallback
- [x] `AIVisionService.ts` — model download, cache, inference
- [x] `ComputerVisionCarbonEngine.ts` — image preprocessing
- [x] E2E Maestro test covering camera flow

### Path B3: Advanced Offline Data Persistence

- [x] `OfflineQueueService` — FIFO, idempotent, MERGE/LWW conflict resolution
- [x] `BackgroundSyncService` — background drain via expo-task-manager
- [x] `CacheService v2` — LRU memory + disk TTL policies
- [x] `OfflineBanner` — 4-state animated status banner
- [x] Redux store: field filters, compression, migration versioning
- [x] `useNetworkStatus v2` — auto-triggers drain on reconnect
- [x] 10/10 unit tests passing

### Path B4: Advanced Insights Dashboard

- [x] Period selector tab bar (Week / Month / Year)
- [x] Carbon overview hero card wired to real Redux history
- [x] GitHub-style activity heatmap (`CarbonHeatmap.tsx`)
- [x] Category donut chart + animated breakdown bars (circular Svg segments)
- [x] Predictive forecasting (linear regression on history)
- [x] Behavioural pattern insight cards
- [x] City average / community comparative analytics
- [x] Pure `insightsEngine.ts` utility (no side effects, fully testable)

### Path B6: Theme & UI/UX Consistency Redesigns

- [x] Rebuilt **Carbon Twin**, **Verification Center**, **Direct Offsetting** (Offset Screen), and
      **Learning Center** screens with deep dark SVG linear gradients, Phosphor icons, and
      frosted-glass `GlassCard` panels.
- [x] Refactored reusable components (`GlassCard`, `GlassBadge`) with React Native `StyleProp`
      typings and moved all inline styling to stylesheets.
- [x] Cleaned up remaining ESLint/TypeScript compilation warnings across `MapScreen`,
      `MarketplaceScreen`, `ProfileScreen`, `SocialScreen`, and `VeganCalculatorScreen` (zero
      compiler or linter warnings across all main screens).

### Path B7: GDPR Compliance & Privacy Security

- [x] Built first-launch `PrivacyConsentModal` overlay detailing location processing, telemetry, and
      caching.
- [x] Dynamic telemetry & analytics opt-out toggles synced between Settings Redux store and Firebase
      Analytics.
- [x] Local Eco-location tracking toggle in Settings.
- [x] Self-service account deletion and data purge flow in ProfileScreen.

### Path B8: Enhanced Gamification & Rewards Center

- [x] Standardized badges gallery distinguishing unlocked vs locked achievements with criteria
      targets
- [x] Interactive Eco-Buddy "Carbon Pet" SVG seedling growing dynamically based on Redux ecosystem
      health
- [x] Water Buddy, Plant Seedling, and Nurture Biodiversity points-based interactions
- [x] Virtual Rewards Store for custom themes, vouchers, and certificates utilizing `AsyncStorage`
      caching
- [x] Climate Leagues & Tournaments standings and reward pool previews
- [x] Automated test integration with Haptic and Blur mocks mapped in `setup.ts`

### Path B9: Verified Carbon Marketplace & Subscriptions

- [x] Rebuilt OffsetScreen.tsx with multi-tab layout (Offsets, Subscription, My Certifications)
- [x] Integrated Gold Standard & Verra registry details drawer showing VCS/GS IDs, methodologies,
      and registry links
- [x] Rendered interactive UN SDG alignment grids on project sheets
- [x] Implemented sliders for custom retirement weights with secure mock checkout overlays
- [x] Wired up dynamic monthly subscription tiers auto-calculated from user footprint history
- [x] Embedded active subscription summaries and redirect selectors inside the Marketplace tab

---

## 🔄 In Progress

### Path B5: Smart Health & IoT Integration (PLANNED)

**Status:** In backlog — ready to draft implementation plan  
**Timeline:** ~1 session

- [ ] HealthKit/Google Fit permission flow
- [ ] Automatic transport mode detection (walk/cycle/drive)
- [ ] Smart home energy monitoring stubs
- [ ] Automatic carbon logging from health data

---

## 🔲 Backlog — Priority Order

### 1. Smart Health & IoT Integration 📱

**Impact:** Removes all manual logging friction — the app tracks passively  
**Tech:** Apple HealthKit, Google Fit, Nest/Ecobee thermostat APIs

- [ ] HealthKit/Google Fit permission flow
- [ ] Automatic transport mode detection (walk/cycle/drive)
- [ ] Smart home energy monitoring stubs
- [ ] Automatic carbon logging from health data

---

### 2. Sustainable Marketplace Extensions 🌳

**Impact:** Direct partner integrations and ecosystem growth

- [ ] Local eco-business directory
- [ ] Sustainable product recommendations with affiliate integration

### 4. Enterprise / B2B Features 🏢

**Impact:** B2B revenue stream

- [ ] Corporate carbon tracking dashboard
- [ ] Team leaderboards and reporting
- [ ] Admin dashboard for organisations
- [ ] White-label customisation options
- [ ] Enterprise API
- [ ] Corporate sustainability reporting (GHG Protocol)

---

### 5. Advanced Offline Capabilities 📡

**Impact:** Reliability in low-connectivity areas

- [ ] Full offline mode with background sync (queue foundation done ✅)
- [ ] Offline analytics processing
- [ ] Smart conflict resolution UI (user resolves merge conflicts)
- [ ] Offline map tiles for eco-location Map screen

---

### 6. Community Platform 🌍

**Impact:** Network effects and long-term retention

- [ ] Local eco-events and meetups calendar
- [ ] Community carbon challenges by city/region
- [ ] Expert-led content and webinars
- [ ] User-generated eco-tips
- [ ] Community moderation system

---

### 7. Accessibility & Internationalisation 🌐

**Impact:** Global market reach

- [ ] Multi-language support (i18n) — Arabic, Spanish, French priority
- [ ] Right-to-left layout support
- [ ] Screen reader optimisation (WCAG 2.1 AA)
- [ ] Voice-to-carbon tracking integration
- [ ] Cultural carbon calculation variations

---

## 🔒 Privacy & Compliance (Critical — Run Alongside All Features)

> See `docs/PRIVACY_AUDIT.md` (pending) for full findings.

- [ ] GDPR consent screen on first launch
- [ ] Data deletion flow (user can delete all data)
- [ ] Analytics opt-out mechanism
- [ ] Token storage audit (AsyncStorage → Keychain for sensitive tokens)
- [ ] Location permission gating audit
- [ ] Privacy policy screen in-app
- [ ] CCPA compliance for US users

---

## 📊 Success Metrics

### User Engagement

- Daily Active Users (DAU) increase +300%
- Session duration +200%
- Feature adoption rate >70%
- 7-day retention >60%

### Business

- Revenue via marketplace + subscriptions
- Enterprise client acquisition
- App Store rating >4.5⭐

### Technical

- App performance scores >95%
- Zero critical security vulnerabilities
- 99.9% crash-free sessions
- <2s cold start globally
