# 🐛 Issues to Fix - Native Bridge White Screen

## Current Status: ⚠️ NATIVE WHITE SCREEN (May 2026)

**UPDATE:** The previous white screen issue caused by Metro Bundler configuration and asset registry paths has been **RESOLVED**. Metro now successfully builds and serves the 7MB `index.bundle` without errors.

However, a **NEW** white screen issue has emerged. The app builds and installs successfully on the Android emulator, but shows a blank white screen because the React Native C++ Bridge is crashing natively during initialization.

---

## 🔍 Root Cause Analysis

### Native Bridge Crash Identified

**Logcat Error:**
```
[Error: Non-js exception: AppRegistryBinding::stopSurface failed. Global was not installed.]
```

**Context:**
- The crash occurs in the C++ layer of the React Native engine.
- `Global was not installed` means the JavaScript engine (Hermes/JSC) failed to initialize properly in the native environment, or `AppRegistry.registerComponent` was never successfully invoked by the bridge.
- The UI hierarchy dump shows only a completely empty `FrameLayout`. The React `ReactViewGroup` root component never mounts.
- This happens even if `index.js` and `App.tsx` are reduced to a minimal `<View>` with absolutely no imports.

### Accompanying Native Exceptions

While debugging the bridge crash, the following asynchronous Java exception was repeatedly observed in Logcat:
```
W CameraX : Caused by: java.lang.IllegalArgumentException: No available camera can be found
```
**Hypothesis:** The `react-native-vision-camera` (or similar) module might be throwing synchronous or asynchronous errors during initialization on an emulator lacking a physical camera, which could be corrupting the native React instance setup.

---

## ✅ Recently Resolved Issues

1. **Metro Bundler Errors (FIXED)**
   - The asset registry path and `babel.config.js` issues are resolved.
   - `curl "http://localhost:8081/index.bundle?platform=android&dev=true"` returns `200 OK`.

2. **Firebase Initialization (FIXED)**
   - `firebaseInit.ts` was throwing a `TypeError: Cannot read property 'default' of undefined`.
   - Fixed by changing to a default import: `import firebase from '@react-native-firebase/app'`.

3. **Theme Styling Crash (FIXED)**
   - `ErrorBoundaryUnified.tsx` and `AppErrorBoundary.tsx` were crashing on early renders because `constants.ts` properties (`COLORS`, `SPACING`) were undefined.
   - Fixed by applying defensive null-checks (`?.`) and fallback hex strings.

---

## 🎯 Recommended Solution Steps (For Next Agent)

### Step 1: Deep Native Clean
The corrupted bridge state requires clearing out all native and bundler caches:
```bash
cd android && ./gradlew clean
cd .. && bun run clean:metro
```

### Step 2: Investigate Native UI Blockers
Check `android/app/src/main/java/com/kindred/MainActivity.kt` and `MainApplication.kt` for:
- Misconfigured `react-native-bootsplash` or `react-native-splash-screen` logic.
- Ensure `fabricEnabled` (New Architecture) is correctly configured if it's toggled on.

### Step 3: Address CameraX Exceptions
Evaluate if the Camera module needs to be mocked or bypassed during development on the emulator to prevent native thread corruption.

### Step 4: Re-compile Android
Run a fresh build:
```bash
npx react-native run-android
```
Then monitor `adb logcat` specifically for the `AppRegistryBinding` error.

---

Last Updated: May 14, 2026
Status: Investigating Native Bridge Initialization Failure
Priority: CRITICAL - Blocking all development