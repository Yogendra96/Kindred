# Native Firebase & AppCheck Setup (Required for Production)

The JS SDKs are installed, but **native Firebase is not yet linked** on either platform.
Without this setup, Firebase features (Auth, Firestore, Functions, AppCheck) run in
mock/debug mode only.

## 1. Android (blocking)

### 1a. Add `google-services.json`
Download from Firebase Console → Project Settings → Your Android app → `google-services.json`.
Place at `android/app/google-services.json`.

### 1b. Apply the Google Services plugin
`android/build.gradle` (root):
```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.4.2'
  }
}
```
`android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 1c. AppCheck (Play Integrity)
`android/app/build.gradle`:
```gradle
dependencies {
  implementation 'com.google.android.gms:play-services-integrity:18.2.0'
}
```
Enable the **Play Integrity** provider in Firebase Console:
App Check → Apps → Android → Enforce → Play Integrity.

## 2. iOS (blocking)

### 2a. Install pods
`GoogleService-Info.plist` already exists at `ios/Kindred/`. Run:
```bash
cd ios && pod install
```
This links `RNFBApp`, `RNFBAuth`, `RNFBFirestore`, `RNFBFunctions`, `RNFBAppCheck`, etc.

### 2b. AppDelegate initialization
`ios/Kindred/AppDelegate.swift` — add **before** `super.application(...)`:
```swift
import FirebaseCore
import RNFBAppCheckModule
// ...
RNFBAppCheckModule.sharedInstance()
FirebaseApp.configure()
```

### 2c. AppCheck (DeviceCheck)
Enable the **DeviceCheck** provider in Firebase Console:
App Check → Apps → iOS → Enforce → DeviceCheck.
(Keychain Sharing must be enabled in the Xcode entitlements for DeviceCheck tokens.)

## 3. After linking

The JS side is already wired in `src/utils/firebaseInit.ts`:
- Dev builds use the DEBUG AppCheck provider (allows local testing)
- Release builds use the DEFAULT provider (device attestation)

Verify:
```bash
npx tsc --noEmit          # types
npx jest --no-coverage    # tests
cd ios && pod install     # iOS native link
```
