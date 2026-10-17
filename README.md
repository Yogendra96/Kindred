# Kindred — Carbon Footprint Tracking App

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.81.4-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript)
![Zustand](https://img.shields.io/badge/Zustand-5-7B68EE)
![Firebase](https://img.shields.io/badge/Firebase-25.1.0-FFCA28?logo=firebase)
![License](https://img.shields.io/badge/License-Private-red)

[Quick Start](#-quick-start) • [Screens](#-app-screens) • [Architecture](#-architecture) •
[Testing](#-testing)

</div>

---

## What is Kindred?

Kindred is a React Native app that helps people track, understand, and reduce their carbon
footprint. It combines real-time Firebase data sync with local state management for a responsive
mobile experience.

### Current State

- **252 React Native tests across 16 suites**, all passing
- **22 Firestore Security Rules unit tests** in Firebase emulator, all passing
- **274 total automated tests across 22 suites**, 100% passing
- **7 Firebase Cloud Functions** handling server-side logic & secure payouts
- **PostHog & Sentry Telemetry**: Automatic click/touch capture, screen tracking, session replays,
  and native crash symbolication with 1-click replay deep links
- **Strategy 1 CI/CD**: GitHub Actions automated PR test pipeline (Ubuntu Linux) + local one-command
  Fastlane release deployments
- **Store Release Ready**: iOS Info.plist usage descriptions, Apple Privacy Manifest, Android 13+
  permissions
- **AdMob rewarded ads** with server-side verification (SSV)
- **Cashfree Payouts integration** for 24/7 instant UPI & bank transfers (India)
- **Xoxoday Plum integration** for 100+ country brand vouchers & gift cards
- **Hardened Firestore Security Rules** (client write protection on wallets & transactions)
- **Corporate email verification** flow with SendGrid & domain scoring
- **AppCheck + rate limiting** on all callable functions

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm**
- **Xcode** (for iOS) or **Android Studio** (for Android)
- **CocoaPods** (for iOS): `sudo gem install cocoapods`

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd KindredFixed

# 2. Install dependencies
npm install

# 3. Install iOS pods (iOS only)
cd ios && pod install && cd ..

# 4. Copy environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Running the App

```bash
# Start Metro bundler
npx react-native start

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```

### Common Commands

```bash
# Code Quality
npx tsc --noEmit           # TypeScript check
npx eslint .               # Lint check
npx prettier --check .     # Format check

# Testing
npx jest --no-coverage     # Run all unit tests (245 tests)
npm run test:rules         # Run Firestore rules tests in emulator (22 tests)
npx jest --coverage        # Run with coverage report
npx jest --watch           # Watch mode

# Deployment (Fastlane)
npm run fastlane:ios       # Build and deploy iOS to TestFlight
npm run fastlane:android   # Build and deploy Android to Google Play Internal

# Maintenance
npx react-native start --reset-cache   # Start with clean cache
```

---

## App Screens

### Navigation

- **Bottom Tab Bar:** Home · Map · Profile · Social · Market · Awards
- **Stack Screens (from Home):** Carbon Twin · AI Vision · Verification · Vegan Calculator ·
  Analytics · Learning Center

### Implemented Screens

| Screen                  | Tab     | Features                                                                                              |
| ----------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| **Home**                | Home    | Carbon footprint tracker, daily breakdown, quick-access to stack screens                              |
| **Local Impact Map**    | Map     | Eco-location listings (recycling, organic, EV charging, thrift, green space), category filter         |
| **Profile**             | Profile | Avatar, stats (CO₂ saved, streak, points), badges, notification/privacy/theme settings                |
| **Community**           | Social  | Leaderboard (friends/global), challenges (daily/weekly/monthly/global), accountability groups         |
| **Kindred Market**      | Market  | Sustainable thrift store with search, category filter, CO₂ saved per item + carbon offset marketplace |
| **Achievements**        | Awards  | Badge gallery, points display, unlock progress                                                        |
| **Carbon Twin**         | Stack   | Bio-digital twin visualization dashboard                                                              |
| **AI Vision**           | Stack   | Camera-based product carbon scanning                                                                  |
| **Verification Center** | Stack   | Community verification and trust network                                                              |
| **Vegan Calculator**    | Stack   | Live tickers (animals/CO₂/water), global vs personal mode, ad-reward credits, tree planting           |
| **Analytics Dashboard** | Stack   | Weekly chart, category breakdown, reduction goals                                                     |
| **Learning Center**     | Stack   | Articles, videos, quizzes filterable by topic (Diet/Energy/Transport/Waste/Nature)                    |

---

## Architecture

### State Management

Kindred uses a dual-layer state approach:

- **Zustand 5** for local UI state (preferences, theme, UI flags)
- **Firebase onSnapshot hooks** for real-time server data (wallet, carbon, SDG, corporate)

Redux, Redux Toolkit, and Redux Persist were removed in favor of this lighter setup.

```
┌──────────────────────────────┐
│     PRESENTATION LAYER       │
│  React Native + TypeScript   │
└──────────────┬───────────────┘
               ↕
┌──────────────────────────────┐
│     STATE MANAGEMENT         │
│  Zustand 5 (local UI state)  │
│  Firebase onSnapshot (data)  │
└──────────────┬───────────────┘
               ↕
┌──────────────────────────────┐
│       SERVICE LAYER          │
│  Firebase Auth / Firestore   │
│  Cloud Functions (7)         │
│  Cashfree / Xoxoday / AppCheck│
└──────────────┬───────────────┘
               ↕
┌──────────────────────────────┐
│       DATA LAYER             │
│  Firebase Backend Services   │
└──────────────────────────────┘
```

### Tech Stack

| Layer                   | Technology                                                       |
| ----------------------- | ---------------------------------------------------------------- |
| **Framework**           | React Native 0.81.4                                              |
| **Language**            | TypeScript 5.7.3                                                 |
| **State (Local)**       | Zustand 5                                                        |
| **State (Server)**      | Firebase onSnapshot hooks                                        |
| **Navigation**          | React Navigation 7.x                                             |
| **Backend**             | Firebase Auth, Firestore, Cloud Functions                        |
| **Security**            | Firebase AppCheck, rate limiting, Firestore Rules hardening      |
| **Ads**                 | AdMob rewarded ads with server-side verification                 |
| **Payouts**             | Cashfree Payouts (Instant UPI) & Xoxoday Plum (Global Vouchers)  |
| **Testing**             | Jest, React Testing Library, Firebase Emulator Rules Suite       |
| **Telemetry & Actions** | PostHog (Touch Autocapture, Funnels, User Paths, Session Replay) |
| **Error Monitoring**    | Sentry (Native/JS Crash Symbolication, Deep Replay Linking)      |
| **CI/CD**               | GitHub Actions (Ubuntu Linux, 1x multiplier, PR validation)      |
| **Release Automation**  | Fastlane (TestFlight & Google Play Internal tracks)              |
| **Linting**             | ESLint (flat config), Prettier 3.9.5                             |
| **Package Manager**     | npm                                                              |

### Firebase Cloud Functions

| Function                       | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `onTransactionCreated`         | Handle wallet aggregation and transaction tracking        |
| `onActivityLogged`             | Process carbon activity events & update SDG scores        |
| `requestWorkEmailVerification` | Send corporate email verification code via SendGrid       |
| `verifyWorkEmailCode`          | Confirm corporate email ownership and activate multiplier |
| `payoutToUPI`                  | Process 24/7 instant UPI bank payout via Cashfree         |
| `redeemVoucher`                | Redeem brand voucher/gift card via Xoxoday Plum           |
| `redeemGiftCard`               | Backwards-compatible alias for voucher redemptions        |
| `onAdRewardVerified`           | Server-side AdMob reward verification                     |

### Fraud Prevention & Security

- **AppCheck** on all callable functions prevents unauthorized API access
- **Rate limiting** protects against abuse of verification and payout endpoints
- **Hardened Firestore Rules** strictly prohibit client writes to `transactions` or direct balance
  editing on `users`
- **Server-side ad verification** ensures rewarded ad claims are authentic

---

## Project Structure

```
KindredFixed/
├── src/
│   ├── services/          # Business logic services
│   ├── components/        # UI components
│   ├── store/             # Zustand stores
│   ├── screens/           # App screens
│   ├── navigation/        # React Navigation setup
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript definitions
│   └── config/            # App configuration
├── functions/             # Firebase Cloud Functions (7)
├── fastlane/              # Fastlane release automation (iOS & Android)
├── .github/workflows/     # GitHub Actions CI pipeline
├── ios/                   # iOS native code
├── android/               # Android native code
├── __tests__/             # Jest tests (245 tests, 15 suites)
└── docs/                  # Documentation
```

---

## Testing

```bash
# Run React Native unit tests without coverage (fast)
npx jest --no-coverage

# Run Firestore Security Rules tests in local emulator
npm run test:rules

# Run with coverage report
npx jest --coverage

# Watch mode
npx jest --watch

# Run specific test file
npx jest --no-coverage path/to/test
```

**Current:** 274 total tests (252 React Native unit tests + 22 Firestore emulator rules tests), all
passing across 22 suites.

---

## Platform Support

| Platform    | Requirements                    |
| ----------- | ------------------------------- |
| **iOS**     | iOS 13.0+, Xcode, CocoaPods     |
| **Android** | API 24+, Android Studio, Gradle |

---

## Documentation

The `docs/` directory contains detailed guides:

- **Project Overview** — High-level goals and functionality
- **Architecture** — Technical stack and patterns
- **Development Guide** — Coding standards and workflow
- **Troubleshooting** — Common build and runtime issues
- **Upgrade Summary** — Recent package upgrade notes

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_app_id

# Carbon API
CARBON_API_KEY=your_carbon_api_key
CARBON_API_BASE_URL=https://api.carboninterface.com/v1

# Google Services
GOOGLE_MAPS_API_KEY=your_maps_key

# Feature Flags
ENABLE_CARBON_TWIN=true
ENABLE_COMMUNITY_VERIFICATION=true
```

---

## Contributing

### Workflow

1. **Branch naming:** `feature/`, `bugfix/`, `hotfix/`
2. **Commits:** Follow Conventional Commits
3. **Pull requests:** Must pass all quality gates

### Quality Gates

- TypeScript compilation (`npx tsc --noEmit`)
- ESLint passing (`npx eslint .`)
- Prettier formatted (`npx prettier --check .`)
- Tests passing (`npx jest --no-coverage`)

---

## License

**Private — All Rights Reserved**

This project is proprietary and confidential.

---

<div align="center">

[Documentation](./docs) • [Issues](./docs/INTEGRATION_ISSUES.md)

</div>
