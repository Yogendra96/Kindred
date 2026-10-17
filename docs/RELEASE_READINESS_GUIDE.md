# Kindred — App Store & Google Play Release Readiness Guide

**Status:** ✅ Configured & Store-Compliant  
**Platforms:** iOS 13.0+ · Android API 24+ (Targeting API 34)

---

## 1. Native Permissions Audit

Both platform manifests are configured with user-facing purpose strings and scoped permissions:

### iOS (`ios/Kindred/Info.plist`)

| Permission Key                        | Review Purpose String                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `NSLocationWhenInUseUsageDescription` | Kindred uses your location to discover nearby eco-friendly locations, recycling centers, and EV chargers on the Impact Map. |
| `NSCameraUsageDescription`            | Kindred uses your camera to scan products, food items, and receipts for real-time carbon footprint calculations.            |
| `NSPhotoLibraryUsageDescription`      | Kindred uses your photo library to let you upload product images and customize your profile avatar.                         |
| `NSUserTrackingUsageDescription`      | Kindred uses tracking to deliver personalized eco-rewards and relevant sustainability opportunities.                        |

### Android (`android/app/src/main/AndroidManifest.xml`)

- `INTERNET`, `ACCESS_NETWORK_STATE`: For real-time carbon data sync and Firebase auth.
- `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`: Impact Map eco-location discovery.
- `CAMERA`: AI Vision scanner.
- `POST_NOTIFICATIONS`: Android 13+ push notifications (Firebase Cloud Messaging).
- `com.google.android.gms.permission.AD_ID`: Android 13+ Google Mobile Ads rewarded video
  attribution.
- `usesCleartextTraffic="false"`: Enforces TLS 1.3 / HTTPS across all network requests.

---

## 2. Apple Privacy Manifest (`PrivacyInfo.xcprivacy`)

Located at: `ios/Kindred/PrivacyInfo.xcprivacy`

Apple requires privacy manifests for third-party SDKs and apps accessing designated APIs and
collecting user data. Kindred declares:

### Designated API Access:

- **`NSPrivacyAccessedAPICategoryFileTimestamp`** (Reasons `C617.1`, `0A2A.1`, `3B52.1`): Local
  bundle file management.
- **`NSPrivacyAccessedAPICategoryUserDefaults`** (Reasons `CA92.1`, `1C8F.1`, `C56D.1`): App
  preferences and offline cache.
- **`NSPrivacyAccessedAPICategoryDiskSpace`** (Reasons `E174.1`, `85F4.1`): Local storage safety and
  cache evictions.
- **`NSPrivacyAccessedAPICategorySystemBootTime`** (Reason `35F9.1`): Performance telemetry and
  timestamp calculations.

### Collected Data Types (`NSPrivacyCollectedDataTypes`):

- **`NSPrivacyCollectedDataTypePreciseLocation`**: App Functionality (Impact Map, Eco-places),
  Linked to user.
- **`NSPrivacyCollectedDataTypeUserID`**: App Functionality, Analytics, Linked to user.
- **`NSPrivacyCollectedDataTypeEmailAddress`**: App Functionality (Account & OTP), Linked to user.
- **`NSPrivacyCollectedDataTypeProductInteraction`**: Analytics (PostHog telemetry), Linked to user.
  Gated by user opt-out toggle.
- **`NSPrivacyCollectedDataTypeCrashData` & `NSPrivacyCollectedDataTypePerformanceData`**: App
  Functionality / Diagnostics (Sentry, Crashlytics), Not linked to user.
- **`NSPrivacyCollectedDataTypeDeviceID`**: Third-Party Advertising & Analytics (AdMob IDFA),
  Linked, Tracking: `true`.

### Tracking & ATT Transparency:

- **`NSPrivacyTracking`**: Set to `<true/>` to align with `NSUserTrackingUsageDescription` and AdMob
  personalized rewarded ads.
- **`NSPrivacyTrackingDomains`**: Discloses `googleads.g.doubleclick.net`,
  `pubads.g.doubleclick.net`, and `pagead2.googlesyndication.com`.

### Account Deletion & Right to Erasure (App Store Guideline 5.1.1(v) & GDPR Art. 17):

- **Cloud Function Cascade**: Server-side callable `deleteUserAccount` and Auth trigger
  `onUserDeleted` purge `/users/{uid}`, all subcollections (`activities`, `transactions`,
  `offsets`), plus auxiliary documents in `emailVerifications` and `_rateLimits`.
- **Client In-App Flow**: Accessible directly in `ProfileScreen` with immediate confirmation dialog,
  local cache eviction (`AsyncStorage.clear()`), zero-trust session termination, and live links to
  Privacy Policy and Terms of Service.

---

## 3. Google Play Data Safety Questionnaire Mappings

When submitting the Data Safety form in Google Play Console:

| Data Type                          | Collected?     | Shared?                    | Purpose                                   | Ephemeral? |
| ---------------------------------- | -------------- | -------------------------- | ----------------------------------------- | ---------- |
| **Approximate & Precise Location** | Yes            | No                         | App functionality (Impact Map eco-places) | Yes        |
| **Email Address & User ID**        | Yes            | No                         | Account management, Corporate matching    | No         |
| **Photos and Videos**              | Yes (optional) | No                         | AI Vision scanning & profile avatar       | Yes        |
| **App Performance & Crash Logs**   | Yes            | Yes (Firebase Crashlytics) | Analytics & Diagnostics                   | No         |
| **Device or other IDs**            | Yes            | Yes (AdMob)                | Advertising & Analytics                   | No         |

---

## 4. Production Build & Release Commands (Fastlane & Manual)

### Automated Fastlane Releases (Recommended):

Run from repository root:

```bash
# Automated iOS build & upload to TestFlight:
npm run fastlane:ios
# or: fastlane ios beta

# Automated Android bundle & upload to Google Play Internal track:
npm run fastlane:android
# or: fastlane android beta
```

---

### Manual Compilation:

#### Android (Release AAB for Google Play):

1. Generate your production upload keystore (if not already done):
   ```bash
   keytool -genkey -v -keystore kindred-release-key.keystore -alias kindred-key -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Build the Android App Bundle (AAB):
   ```bash
   cd android && ./gradlew bundleRelease
   ```
   _Artifact generated:_ `android/app/build/outputs/bundle/release/app-release.aab`

#### iOS (Release Archive for App Store Connect):

1. Open Xcode:
   ```bash
   xed ios
   ```
2. Select your Team under **Signing & Capabilities**.
3. Choose **Product → Archive** to compile and distribute directly to TestFlight / App Store
   Connect.

---

## 5. Automated CI/CD (Strategy 1)

Located at: `.github/workflows/ci.yml`

- **Triggers:** Push to `main`, `master`, `develop`, `feature/**`, and all Pull Requests.
- **Runner:** Ubuntu Linux (`ubuntu-latest`, 1x multiplier, 100% within free monthly tier).
- **Execution Matrix:**
  1. Java 21 OpenJDK setup (for local Firestore emulator)
  2. Node.js 20 setup with npm cache
  3. `npm run typecheck` (TypeScript 0 errors)
  4. `npm run lint` (ESLint 0 errors)
  5. `npm test -- --no-coverage` (245 Jest React Native tests)
  6. `npm run test:rules` (22 Firestore security rules tests in emulator)
