# 🐛 Issues to Fix - White Screen Problem

## Current Status: ⚠️ WHITE SCREEN

The app builds and installs successfully on **Pixel 9 Pro XL (Android 16)**, but shows a white screen. Metro bundler is running but has configuration issues preventing the JavaScript bundle from loading.

---

## 🔍 Root Cause Analysis

### Metro Bundler Errors Identified

1. **Missing Asset Registry Path** (CRITICAL)
   ```
   Unable to resolve module missing-asset-registry-path from
   /Users/yogibairagi/Developer/KindredFixed/node_modules/@react-navigation/elements/lib/module/assets/clear-icon.png
   ```

2. **Babel Plugin Configuration** (FIXED ✅)
   - Was: `'react-native-dotenv'`
   - Fixed to: `'module:react-native-dotenv'`

3. **Removed Dependencies** (FIXED ✅)
   - Removed `react-native-reanimated` (conflicting with RN 0.82 new arch)
   - Removed `react-native-gesture-handler` (not essential for demo)
   - Removed import from `index.js`

---

## 📋 Detailed Issues

### Issue #1: Asset Registry Path Not Configured

**Error:**
```
missing-asset-registry-path could not be found
```

**Location:** Metro configuration

**Root Cause:** The `assetRegistryPath` is not properly configured in the transformer settings.

**Solution:**
Add to `babel.config.js` transformer section or `metro.config.js`:
```javascript
transformer: {
  assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  // ... other settings
}
```

### Issue #2: React Navigation Elements Assets

**Error:** React Navigation is trying to load PNG assets but the asset registry isn't configured.

**Affected Package:** `@react-navigation/elements`

**Files:**
- `node_modules/@react-navigation/elements/lib/module/assets/clear-icon.png`
- `node_modules/@react-navigation/elements/lib/module/assets/back-icon.png`

**Solution:** Properly configure Metro to handle PNG assets from node_modules.

### Issue #3: Metro Config Complexity

**Problem:** The metro.config.js has complex conditional logic that might be causing issues.

**Current Issues:**
- Duplicate transformer configurations
- Conflicting development/production settings
- Missing proper asset handling

---

## 🔧 Quick Fixes to Try (In Order)

### Fix #1: Add Asset Registry Path to Metro Config

```javascript
// metro.config.js
transformer: {
  assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  // ... rest of config
}
```

### Fix #2: Simplify Metro Config

Replace the complex metro.config.js with a minimal version:

```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
```

### Fix #3: Reinstall Dependencies

```bash
# Clean everything
rm -rf node_modules
rm -rf .metro-cache
rm -rf android/build
rm -rf ios/build

# Reinstall
bun install

# Reset Metro cache
bun start --reset-cache
```

### Fix #4: Check if React Native Assets Are Loading

Test the bundle directly:
```bash
curl "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" > bundle.txt
cat bundle.txt | head -50
```

If you see errors, that's the issue. If you see JavaScript code, Metro is working.

---

## 📦 Missing Dependencies Check

Verify these are installed:
```bash
bun list | grep -E "react-native|@react-navigation"
```

Should see:
- react-native@0.82.0
- @react-navigation/native@^7.0.0
- @react-navigation/bottom-tabs@^7.0.0
- @react-navigation/native-stack@^7.0.0
- react-native-screens@^4.0.0
- react-native-safe-area-context@^5.0.0

---

## 🎯 Recommended Solution Steps

### Step 1: Simplify Metro Config
1. Backup current `metro.config.js`
2. Replace with minimal config (see Fix #2 above)
3. Restart Metro: `lsof -ti:8081 | xargs kill -9; bun start --reset-cache`

### Step 2: Test Bundle Generation
```bash
curl "http://localhost:8081/index.bundle?platform=android&dev=true" > /tmp/test-bundle.js
head -100 /tmp/test-bundle.js
```

If this shows JavaScript code starting with `__d(function(...`, Metro is working!

### Step 3: Reinstall App
```bash
cd android && ./gradlew clean
cd .. && bun android
```

### Step 4: Check Device Logs
```bash
adb logcat -c
adb shell am start -n com.kindred/.MainActivity
sleep 5
adb logcat -d | grep -i "reactnativejs\|error\|exception" | tail -50
```

---

## 🔍 Debugging Commands

### Check Metro is Running
```bash
curl http://localhost:8081/status
# Should return: {"packager":"running"}
```

### Check Bundle Loads
```bash
curl -I "http://localhost:8081/index.bundle?platform=android"
# Should return: HTTP/1.1 200 OK
```

### Check Device Connection
```bash
adb devices
# Should show: emulator-5554  device
```

### Force Reload on Device
```bash
adb shell input text "RR"
```

---

## 📝 Configuration Files That Need Review

1. **metro.config.js** - Too complex, needs simplification
2. **babel.config.js** - Check all plugins are compatible
3. **package.json** - Verify all dependencies are correct versions
4. **android/app/build.gradle** - Verify newArchEnabled=true works

---

## ✅ What's Working

- ✅ Metro bundler starts successfully
- ✅ Android build completes
- ✅ APK installs on Pixel 9 Pro XL
- ✅ App launches (shows white screen)
- ✅ New Architecture is enabled
- ✅ Hermes is enabled
- ✅ TypeScript compilation works
- ✅ All native dependencies build successfully

---

## ❌ What's Not Working

- ❌ JavaScript bundle doesn't load on device
- ❌ Metro serves errors instead of valid bundle
- ❌ Asset registry path is missing/misconfigured
- ❌ React Navigation assets can't be resolved

---

## 🎯 Expected Outcome

Once fixed, you should see:
1. Metro bundler serves valid JavaScript without errors
2. App loads and shows HomeScreen with:
   - User profile header
   - Carbon footprint card
   - Three tabs (Overview, Activities, Insights)
   - Custom bar chart
   - Achievements
   - Challenges
   - Demo mode banner

---

## 📚 Reference Links

- [Metro Configuration Docs](https://metrobundler.dev/docs/configuration)
- [React Native Asset Registry](https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/Image/AssetRegistry.js)
- [New Architecture Setup](https://reactnative.dev/docs/new-architecture-intro)

---

## 🚀 Next Steps

1. Try Fix #2 (Simplify Metro Config) - **HIGHEST PRIORITY**
2. Test bundle generation
3. If bundle works, reinstall app
4. If still fails, check device logs for JavaScript errors
5. Consider temporarily disabling SVG transformer to isolate issue

---

Last Updated: $(date)
Status: Investigating Metro bundler configuration issues
Priority: CRITICAL - Blocking all development