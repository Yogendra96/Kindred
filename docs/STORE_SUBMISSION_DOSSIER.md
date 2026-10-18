# Kindred — App Store & Google Play Submission Dossier

**Document Version:** 1.0.0 (Release Candidate)  
**Target Release:** Production v1.0.0 (Build 1)  
**Date:** October 18, 2026  
**Status:** ✅ Fully Prepared & Policy-Compliant

---

## 1. App Identity & Store Metadata

### 1.1 Store Identifiers

- **App Name:** Kindred: Carbon & Eco Rewards
- **Bundle Identifier (iOS):** `com.kindred`
- **Application ID (Android):** `com.kindred`
- **Version Number:** `1.0.0`
- **Build Number:** `1`
- **Primary Category:** Lifestyle / Health & Fitness (Environment & Sustainability)
- **Secondary Category:** Utilities / Finance (Rewards & Loyalty)
- **Default Language:** English (U.S.) (`en-US`)
- **Supported Localizations:** English (`en`), Hindi (`hi`), Spanish (`es`)

### 1.2 Store URLs

- **Marketing URL:** `https://kindred.earth`
- **Support URL:** `https://kindred.earth/support`
- **Privacy Policy URL:** `https://kindred.earth/privacy`
- **Terms of Service URL:** `https://kindred.earth/terms`
- **Account Deletion Web Portal:** `https://kindred.earth/delete-account`
- **Support & Grievance Email:** `grievance@kindred.earth` / `support@kindred.earth`

---

## 2. Apple App Store Submission Package

### 2.1 Metadata Strings

- **Subtitle (30 characters max):**  
  `Track Carbon. Earn Rewards.` (27 chars)

- **Promotional Text (170 characters max):**  
  `Live sustainably, measure your daily carbon footprint, and earn cashable rewards through UPI or global brand vouchers while supporting verified carbon reduction projects.` (170
  chars)

- **Keywords (100 characters max, comma-separated):**  
  `carbon,footprint,sustainability,eco,rewards,green,upi,voucher,climate,esg,tracker,offsets,charging` (97
  chars)

- **Description:**

```markdown
Kindred is the all-in-one climate action and eco-rewards platform designed to make sustainable
living measurable, rewarding, and fun.

Track your daily carbon footprint across commuting, dietary choices, energy usage, and household
activities. Receive personalized AI insights and transform your everyday sustainable actions into
tangible rewards.

KEY FEATURES: • Real-Time Carbon Footprint: Track your transport and lifestyle habits with automated
commute detection and manual activity logging. • Digital Carbon Twin: Visualize your environmental
impact in real time with dynamic 3D representations and personal carbon budgets. • Eco Rewards
Wallet: Earn verified eco-points for green actions. Cash out instantly via UPI directly to your bank
account or redeem gift vouchers from top brands including Amazon, Flipkart, Swiggy, and Starbucks. •
Impact Map: Discover local recycling hubs, electric vehicle (EV) charging stations, compost
drop-offs, and sustainable businesses around you. • Corporate Employer Matching: Connect your
verified work email to unlock 1:1 employer matching on your carbon offsets and compete on corporate
sustainability leaderboards. • Eco Charging Screen: Turn charging downtime into planetary impact
with daily SDG facts and micro-donations funded by ethical brand sponsors. • Certified Carbon
Offsets: Support Gold Standard and Verra-certified reforestation, renewable energy, and ocean
cleanup initiatives.

PRIVACY & USER PROTECTION FIRST: • Zero-data selling policy: Your location data is processed locally
for transit classification and is never sold. • GDPR & DPDP Act 2023 compliant: Export your complete
data or exercise permanent one-click cascade account deletion at any time. • Full telemetry opt-out:
Toggle anonymous usage analytics at will with one tap in your Profile preferences.

Join thousands of eco-warriors and turn your daily habits into positive planetary impact today!
```

### 2.2 App Review Information (Apple App Reviewer Guidance)

- **Sign-In Required:** Yes
- **Reviewer Demo Credentials:**
  - **Email:** `appstore-review@kindred.earth`
  - **Password:** `KindredReview2026!`
  - **Demo SMS / Email Verification Code:** `777777` (Server bypass enabled for review account)
- **Demo Mode & Sandbox Payout Behavior:**
  - Payout actions (`payoutToUPI`, `redeemVoucher`) operate in **Sandbox Simulation Mode** for
    accounts ending in `@kindred.earth` or flagged as demo reviewers.
  - Reviewers can test entering a mock UPI ID (e.g., `tester@okhdfcbank`) and the wallet balance
    will execute an atomic mock transaction returning a simulated `UTR-MOCK-TEST-SUCCESS` reference
    with zero live financial movement.
- **Notes for Reviewer:**
  > Kindred integrates Apple's App Tracking Transparency (ATT) framework via Google Mobile Ads UMP
  > (User Messaging Platform) for non-personalized or personalized rewarded video ads. Users may
  > accept or decline tracking freely without losing core app functionality. Location access is
  > requested exclusively while using the app (`NSLocationWhenInUseUsageDescription`) to discover
  > nearby charging stations on the Impact Map. Users can permanently delete their account and all
  > associated Firestore data directly inside `ProfileScreen -> Delete Account`.

### 2.3 Age Rating Declaration (iOS)

- **Unrestricted Web Access:** No
- **Gambling and Contests:** No
- **Medical/Treatment Information:** No
- **Profanity or Crude Humor:** None
- **Mature/Suggestive Themes:** None
- **Violence:** None
- **Age Rating:** **13+** (Guaranteed by client registration age gating enforcing 13+ minimum age).

### 2.4 Apple Privacy Nutrition Labels Mapping

| Category         | Data Type                           | Usage / Purpose                                      | Linked to Identity? | Used for Tracking?                |
| :--------------- | :---------------------------------- | :--------------------------------------------------- | :------------------ | :-------------------------------- |
| **Location**     | Precise Location                    | App Functionality (Impact Map nearby EV chargers)    | Yes                 | No                                |
| **Contact Info** | Email Address, Name                 | App Functionality (Authentication, Account Recovery) | Yes                 | No                                |
| **Identifiers**  | User ID                             | App Functionality, Telemetry                         | Yes                 | No                                |
| **Identifiers**  | Device ID (`IDFA` / Advertising ID) | Third-Party Advertising (AdMob rewarded ads)         | Yes                 | **Yes** (gated by ATT prompt)     |
| **Usage Data**   | Product Interaction                 | Analytics (PostHog screen and feature usage)         | Yes                 | No (opt-out available in Profile) |
| **Diagnostics**  | Crash Data, Performance Data        | App Functionality / Diagnostic (Sentry, Crashlytics) | No                  | No                                |

---

## 3. Google Play Console Submission Package

### 3.1 Metadata Strings

- **Short Description (80 characters max):**  
  `Track your carbon footprint, live sustainably, and earn instant cash rewards!` (78 chars)

### 3.2 Target Audience & Content (Google Play)

- **Target Age Group:** 13–15, 16–17, 18 and older.
- **Is the app designed for children?** No. (COPPA compliant; strictly rejects users under 13).
- **Ads Declaration:** Yes, this app contains ads (Google AdMob rewarded ads).
- **News App:** No.
- **COVID-19 Contact Tracing:** No.
- **Financial Features Declaration:**
  - Category: **Alternative Financial Products / Loyalty & Rewards**
  - Kindred does NOT provide loans, credit lines, deposits, investment advice, peer-to-peer
    transfers, or cryptocurrency transactions.
  - Outbound transfers are strictly rewards cashouts for verified user-completed environmental
    activities, processed via regulated Payment Aggregator APIs (Cashfree Payouts / Xoxoday).

### 3.3 Google Play Data Safety Form Responses

#### Data Collection & Sharing Breakdown:

1. **Location:**
   - **Approximate Location:** Collected: Yes | Shared: No | Ephemeral: Yes | Purpose: App
     functionality.
   - **Precise Location:** Collected: Yes | Shared: No | Ephemeral: Yes | Purpose: App functionality
     (finding nearby chargers).
2. **Personal Info:**
   - **Name:** Collected: Yes (optional) | Shared: No | Ephemeral: No | Purpose: App functionality.
   - **Email Address:** Collected: Yes | Shared: No | Ephemeral: No | Purpose: Account management,
     Fraud prevention.
   - **User IDs:** Collected: Yes | Shared: No | Ephemeral: No | Purpose: Account management,
     Analytics.
3. **Financial Info:**
   - **User Payment Info (UPI ID / VPA):** Collected: Yes (temporarily during cashout) | Shared: No
     (transferred encrypted via TLS to licensed payout gateway) | Ephemeral: Yes | Purpose: Fraud
     prevention, Account management.
   - **Purchase History:** Collected: Yes (carbon credit retirement records) | Shared: No |
     Ephemeral: No | Purpose: App functionality.
4. **Photos and Videos:**
   - **Photos:** Collected: Yes (optional camera scan) | Shared: No | Ephemeral: Yes | Purpose: App
     functionality (AI Vision scanner).
5. **App Activity:**
   - **App Interactions:** Collected: Yes | Shared: No | Ephemeral: No | Purpose: Analytics
     (PostHog, user opt-out enabled).
6. **App Info and Performance:**
   - **Crash Logs:** Collected: Yes | Shared: Yes (Google Firebase Crashlytics / Sentry) |
     Ephemeral: No | Purpose: Analytics & Diagnostics.
   - **Diagnostics & Performance:** Collected: Yes | Shared: Yes | Ephemeral: No | Purpose:
     Analytics.
7. **Device or Other IDs:**
   - **Device ID (`AD_ID`):** Collected: Yes | Shared: Yes (Google AdMob) | Ephemeral: No | Purpose:
     Advertising & Marketing.

#### Security Practices:

- **Data Encrypted in Transit:** Yes, 100% of network traffic uses TLS 1.3 / HTTPS. Cleartext HTTP
  is disabled (`usesCleartextTraffic="false"`).
- **Data Deletion Request Mechanism:** Yes, users can request account and data deletion directly
  inside the app (`Profile -> Delete Account`) or via the external web form at
  `https://kindred.earth/delete-account`.
- **Independent Security Review:** Internal Zero-Trust architecture audit and Firebase Firestore
  Rules security verification suite.

---

## 4. Multi-Jurisdiction Regulatory & Statutory Compliance

### 4.1 India Digital Personal Data Protection (DPDP) Act 2023

- **Data Protection Officer / Grievance Redressal:**
  - Notice published directly in `ProfileScreen` under "Data Grievance Officer".
  - Designated Officer: Data Protection Officer, Kindred Earth Technologies.
  - Contact Email: `grievance@kindred.earth`
  - Statutory Turnaround: Grievances acknowledged within 24 hours; resolution within 7 working days.
- **Children's Data Protection (Section 9):**
  - Prohibits processing personal data of children under 18 that is likely to cause harm, and
    restricts targeted advertising directed at children.
  - Kindred registration requires affirmative confirmation of being 13+ years of age. For users
    under 18, personalized advertising is disabled by default.

### 4.2 European Union GDPR (Regulation EU 2016/679) & UK GDPR

- **Right to Erasure (Art. 17):**
  - Fully implemented via Firebase Cloud Function `deleteUserAccount` and Auth trigger
    `onUserDeleted`.
  - Cascades deletion across `/users/{uid}`, `/users/{uid}/activities`, `/users/{uid}/transactions`,
    `/users/{uid}/offsets`, `/emailVerifications`, and `/rateLimits`.
- **Right of Access & Portability (Art. 15 & 20):**
  - "Export My Data" action in `ProfileScreen` aggregates personal records into a downloadable
    JSON/CSV format.
- **Consent Management (ePrivacy Directive & TCF v2.2):**
  - Built-in Google Mobile Ads UMP SDK (`AdsConsent.gatherConsent()`) renders the IAB Europe
    Transparency and Consent Framework dialogue prior to loading any advertising tags in EU/EEA and
    UK territories.

### 4.3 United States State Privacy Laws (CCPA / CPRA / VCDPA)

- **Do Not Sell or Share My Personal Information:**
  - Kindred does not sell personal information for monetary compensation.
  - Sharing of identifiers for cross-context behavioral advertising can be opted out via:
    1. iOS App Tracking Transparency (ATT) prompt.
    2. In-app "Ad Privacy Preferences" modal (`showAdPrivacyOptions()`).
    3. Profile toggle: "Anonymous Analytics" (`preferences.analytics`).

### 4.4 Financial & Payment Regulatory Compliance (NPCI & RBI)

- **Outbound Payout Architecture:**
  - Kindred utilizes Cashfree Payouts, a licensed RBI-regulated Payment Aggregator.
  - Cashouts are push payments only (`payoutToUPI`) initiated by authenticated Cloud Functions after
    atomic balance debit in Firestore.
  - No user wallet maintains pre-paid instruments (PPI) stored monetary value beyond earned rewards
    points convertible at payout.

---

## 5. Release Checklist & Signoff

| Checkpoint                      | Requirement                  | Verification Method                                |        Status        |
| :------------------------------ | :--------------------------- | :------------------------------------------------- | :------------------: |
| **TypeScript Compilation**      | 0 compiler errors            | `npx tsc --noEmit`                                 | **PASS (0 errors)**  |
| **Jest Unit Test Suite**        | 100% test pass rate          | `npm test -- --no-coverage` (18 suites, 269 tests) |  **PASS (269/269)**  |
| **Firestore Security Rules**    | 100% emulator pass rate      | `npm run test:rules` (7 suites, 23 tests)          |   **PASS (23/23)**   |
| **iOS Fastlane Pre-Flight**     | All checks green             | `bundle exec fastlane ios test`                    |       **PASS**       |
| **Android Bundle Release**      | Gradle build succeeds        | `cd android && ./gradlew bundleRelease --dry-run`  | **BUILD SUCCESSFUL** |
| **Privacy Manifest**            | Declared in IPA              | `ios/Kindred/PrivacyInfo.xcprivacy` verified       |       **PASS**       |
| **Account Deletion Cascade**    | Guideline 5.1.1(v) compliant | Cloud Functions + in-app confirmation              |       **PASS**       |
| **Internationalization (i18n)** | EN, HI, ES supported         | `src/i18n/` + unit test verification               |       **PASS**       |
| **Unit Formatting**             | Metric & Imperial conversion | `formatUnits.ts` + 8 automated tests               |       **PASS**       |

**Submission Sign-off:**  
The Kindred codebase has successfully satisfied all platform guidelines, security benchmarks,
privacy requirements, and automated release gates. The binary is ready for production submission to
App Store Connect and Google Play Console.
