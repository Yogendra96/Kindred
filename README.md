# Kindred — The Ethical, Plant-Based & Planet-Positive Super-App

<div align="center">

![React Native](https://img.shields.io/badge/React_Native-0.82_New_Architecture-61DAFB?logo=react)
![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript)
![Tests](https://img.shields.io/badge/Tests-316_Passing-38EF7D)
![Suites](https://img.shields.io/badge/Suites-25_Passing-38EF7D)
![License](https://img.shields.io/badge/License-Private-red)

[Quick Start](#-quick-start) • [Super-App Ecosystem](#-super-app-ecosystem) •
[Architecture](#-architecture) • [Companion Web Portal](#-companion-web-portal-path-b) •
[Testing](#-testing) • [Safety & Security](#-safety--security)

</div>

---

## 🌍 What is Kindred?

**Kindred** is the world’s first unified **cruelty-free, plant-based, and planet-positive super-app
ecosystem**. It bridges real-time hardware telemetry and background carbon tracking with an
expansive suite of ethical lifestyle pillars: cruelty-free job discovery, ethical e-commerce, farm
sanctuary stays, animal rescue micro-donations, global vegan travel survival guides, and safe
proximity meetups.

---

## 🚀 Super-App Ecosystem

```
                                Kindred Platform
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
💼 Cruelty-Free Careers        🛒 Veggregator Shop           🏡 Vegan Stays
• Verified plant employers     • Artisan Cashew Cheeses      • Sanctuary guest cabins
• Food science & biomaterials  • Vegan Snickers bars         • OpenStreetMap verified
• 1-Click ethical apply        • "Sell on Veggregator"       • 100% plant kitchens
• Remote, hybrid & onsite      • Zero-emissions cloud meals  • Down-free bedding
        │                              │                              │
        ├──────────────────────────────┼──────────────────────────────┤
        │                              │                              │
🐾 Animal Rescue Hub           🌍 Vegan World Travel         ❤️ Vegan Social & Meet
• 5 global farm sanctuaries    • 12 Country flashcards       • Dating, friends, meetups
• Direct micro-donations       • Native script waiter cards  • Fuzzed safe proximity radar
• Interactive map pins         • Street food video vlogs     • Icebreakers & report/block
• Meal & medical sponsorships  • Hidden trap ingredient alerts• Zero-stalking fuzzed GPS
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                         🚀 Ethical Launchpad (Plant VC)
                         • Product Hunt for plant food tech
                         • Seed micro-backing & backer perks
                         • Precision fermentation & biomaterials
```

### Core Modules Breakdown

1. **Cruelty-Free Careers & Vegan Job Board (`VeganJobsScreen`):**
   - Verified 100% plant-based employers (_Silk & Oat Labs, Catskill Animal Sanctuary, CrueltyFree
     Carbon OS, The Humane League, BioWeave Materials_).
   - Filter by workplace type (_Remote, Hybrid, On-site_) and category chips.
   - 1-Click Quick Apply with Kindred Verified Applicant credentials.

2. **Veggregator & Ethical Brand Marketplace (`VeggregatorScreen`):**
   - Direct-to-consumer ethical storefronts and artisan brands.
   - Featured items: _Crunchy Peanut Caramel & Nougat Bar_ (vegan Snickers alternative), _Wild Fig &
     Activated Almond Bar_, _Cave-Aged Cashew Truffle Camembert_, and _Mycelium Root Leather Bags_.
   - **"Sell on Veggregator" Portal:** Independent makers apply, sign the cruelty-free pledge, and
     instantly publish their storefront.
   - Cart & checkout with Kindred points and zero-emission delivery courier.

3. **Vegan Stays & Sanctuary Homestays (`VeganStaysScreen`):**
   - 100% plant-based accommodations tagged on OpenStreetMap
     (`diet:vegan=only;tourism=guest_house`).
   - Guest cabins at farm sanctuaries where **100% of booking fees sponsor rescued animals**.
   - Strict cruelty-free house policies: plant-only kitchens, down-free bedding, and organic
     gardens.
   - Integrated booking engine with dates, guest counters, and Kindred Karma discounts.

4. **Animal Shelter & Rescue Hub (`WalletScreen` + `MapScreen`):**
   - Verified farm sanctuaries: _Catskill Animal Sanctuary, Peepal Farm, Woodstock Farm Sanctuary,
     and Dean Farm Trust_.
   - Transparent micro-donation tiers to sponsor fresh hay, pediatric calf milk, and surgical trauma
     care.
   - Interactive map pins with instant "Donate Meal" CTA.

5. **Global Vegan Travel & Dining Flashcards (`VeganTravelScreen`):**
   - Comprehensive guides for **12 countries** (Japan, Thailand, Italy, Mexico, India, Vietnam,
     France, Germany, Spain, Greece, UK, South Korea).
   - Full-screen high-contrast waiter flashcards in native scripts (Japanese, Thai, Hindi, etc.)
     stating clear dietary boundaries.
   - **Local Street Food Vlogs & Reels:** Streaming open, privacy-respecting video guides via
     Piped/Invidious APIs.

6. **Vegan Dating, Friendship & Community Meetups (`VeganMeetScreen`):**
   - Mode switcher: _Dating_, _Friends_, or _Meetups_.
   - **Safe Fuzzed Proximity Radar:** Fuzzes user distances into broad bands (`~1.4 km away`) to
     completely prevent triangulation or stalking.
   - Community safety: 1-tap Report & Block modals, icebreakers, and verified badges.

7. **Ethical Launchpad & Plant Tech VC (`EthicalLaunchpadScreen`):**
   - Product Hunt and seed micro-backing for emerging plant innovations (precision-fermented dairy,
     grown mushroom sneakers, AI sanctuary health monitors).
   - Upvoting system with optimistic karma rewards.
   - Backer seed tiers with prototype perks and impact certificates.

---

## 🏛️ Dual-Stack Architecture

Kindred operates as a synchronized **Dual-Stack Platform**:

```
                       Kindred Dual-Stack Platform
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       │                                                         │
📱 Mobile Super-App (New Architecture)                  🌐 Web Portal (Next.js 15)
• React Native 0.82 (Fabric + TurboModules)             • Server-Side Rendered (SSR)
• Background micro-mobility telemetry                   • Google Jobs Schema.org JSON-LD
• AI Vision Camera scanner                              • Google Shopping Product schemas
• Real-time proximity radar & meetups                   • Public sanctuary donation pages
• Biometric wallet & offline storage                    • Universal Deep Links (kindred://)
```

---

## 🌐 Companion Web Portal (`web/`)

Located in the [`web/`](./web) directory, the companion web portal powers Kindred's public SEO
footprint:

- **Google Jobs Auto-Indexing (`/jobs`):** Emits structured Schema.org `JobPosting` data.
- **Google Shopping Storefronts (`/veggregator`):** Emits structured Schema.org `Product` data.
- **Sanctuary Stays Directory (`/stays`):** Public directory of OpenStreetMap-verified stays.
- **Direct Rescue Donations (`/rescues`):** Public web donation landing pages.
- **Travel Phrase Cards (`/travel`):** Search engine indexed country guides.
- **Smart App Banners:** Universal links routing mobile web visitors seamlessly into the native app.

To run the web portal:

```bash
cd web
npm install
npm run dev
```

---

## 🧪 Testing & Quality Gates

The Kindred codebase is covered by **316 automated tests across 25 suites** running in CI/CD.

```bash
# Run full Jest test suite (316 tests across 25 suites)
npm test

# Run tests without coverage (fast mode)
npx jest --no-coverage

# Run TypeScript strict typecheck
npm run typecheck

# Run specific suite
npx jest src/screens/main/__tests__/VeganStaysScreen.test.tsx --no-coverage
npx jest src/screens/main/__tests__/EthicalLaunchpadScreen.test.tsx --no-coverage
npx jest src/screens/main/__tests__/VeggregatorScreen.test.tsx --no-coverage
npx jest src/screens/main/__tests__/VeganJobsScreen.test.tsx --no-coverage
npx jest src/screens/main/__tests__/VeganTravelScreen.test.tsx --no-coverage
npx jest src/screens/main/__tests__/VeganMeetScreen.test.tsx --no-coverage
```

---

## 🛡️ Safety, Privacy & Security

1. **Anti-Stalking Location Obfuscation:** The social and meetup radar fuzzes coordinates into broad
   regional radius bands. Exact GPS coordinates are processed exclusively on-device.
2. **Community Protection:** Mandatory 1-tap Report and Block controls with automated moderation
   hooks on all social features.
3. **Hardened Firestore Security Rules:** Zero client-side write permissions on user transaction
   balances, karma points, or payout ledgers. All financial mutations execute through authenticated
   Cloud Functions.
4. **AppCheck & Rate Limiting:** All cloud endpoints enforce Firebase AppCheck and IP/UID rate
   limiting to prevent automated scraping or denial-of-service.

---

## 📱 Quick Start (Mobile)

### Prerequisites

- Node.js 18+ & npm
- Xcode (iOS simulator / device, iOS 17+)
- Android Studio (Android emulator / device, API 24+)
- CocoaPods (`pod --version`)

### Running iOS

```bash
npm install
cd ios && pod install && cd ..
npm run ios
```

### Running Android

```bash
npm install
npm run android
```

---

## 📄 License & Confidentiality

**Private — All Rights Reserved.** Proprietary software developed by Kindred Earth Inc.
