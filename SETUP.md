# 🚀 Kindred React Native Setup Guide

Complete setup instructions for iOS and Android development.

## 📋 Prerequisites Overview

**Required for Development:**
- **Node.js**: 18+ (specified in engines)
- **Bun**: Latest version (required package manager)
- **Java**: JDK 24 for Android builds
- **Platform Tools**: Xcode (iOS) / Android Studio (Android)
- **React Native**: 0.80.1 with New Architecture optimizations
- **React**: 19.1.0 with concurrent features and performance improvements

## 🔄 **Latest Updates (2025-07-03) - COMPLETED**
- ✅ **React Native 0.73.6 → 0.80.1** (New Architecture optimizations)
- ✅ **React 18.2.0 → 19.1.0** (concurrent features, performance)
- ✅ **Firebase SDK v19 → v22.2.1** (3 major versions updated)
- ✅ **ESLint 8.57.1 → 9.30.0** (flat config system)
- ✅ **Victory Native** replaces react-native-chart-kit (deprecated)
- ✅ **Expo Image** replaces react-native-fast-image (outdated) 
- ✅ **React Navigation v6 → v7** (major performance improvements)
- ✅ **TypeScript 5.8.3** (strict mode enabled)
- ✅ **Zero security vulnerabilities** (100% secure)

---

## 🛠️ Step 1: Core Environment Setup

### **Node.js 18+ Installation**

#### macOS:
```bash
# Using Homebrew (recommended)
brew install node@18

# Verify installation
node --version  # Should show 18.x.x or higher
```

#### Windows:
```bash
# Download from nodejs.org or use Chocolatey
choco install nodejs --version=18.19.0

# Verify installation
node --version
```

#### Linux (Ubuntu/Debian):
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
```

### **Bun Package Manager (Required)**

#### All Platforms:
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Restart terminal, then verify
bun --version

# Add to PATH if needed (check installer output)
export PATH="$HOME/.bun/bin:$PATH"
```

**⚠️ Important**: This project requires Bun. Do NOT use npm or yarn.

---

## 📱 Step 2: iOS Development Setup (macOS Only)

### **Xcode Installation**
```bash
# Install Xcode from App Store (14.0+)
# OR download from Apple Developer portal

# Install Xcode Command Line Tools
sudo xcode-select --install

# Verify installation
xcode-select --print-path
```

### **iOS Simulator Setup**
```bash
# Open Xcode
# Go to Xcode > Preferences > Components
# Install iOS 17.0+ Simulator

# List available simulators
xcrun simctl list devices

# Boot iPhone 15 Pro (project default)
xcrun simctl boot "iPhone 15 Pro"
```

### **CocoaPods Setup**
```bash
# Install CocoaPods (required for iOS dependencies)
sudo gem install cocoapods

# Verify installation
pod --version

# If Ruby/gem issues, use Homebrew:
brew install cocoapods
```

### **iOS Development Verification**
```bash
# Check iOS development environment
npx react-native doctor

# Should show all iOS requirements as ✅
```

---

## 🤖 Step 3: Android Development Setup

### **Java JDK 24 Installation**

#### macOS:
```bash
# Using Homebrew
brew install openjdk@24

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@24/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
java --version  # Should show 24.x.x
```

#### Windows:
```bash
# Download Oracle JDK 24 or use Chocolatey
choco install openjdk24

# Verify
java --version
```

#### Linux:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-24-jdk

# Verify
java --version
```

### **Android Studio Installation**

#### All Platforms:
1. **Download Android Studio** from https://developer.android.com/studio
2. **Install with default settings**
3. **Open Android Studio** and run through setup wizard
4. **Install required SDK components**:
   - Android SDK Platform 34 (API level 34)
   - Android SDK Build-Tools 34.0.0
   - Android Emulator
   - Android SDK Platform-Tools

### **Environment Variables Setup**

#### macOS/Linux (.zshrc or .bashrc):
```bash
# Android SDK paths
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Apply changes
source ~/.zshrc  # or ~/.bashrc
```

#### Windows (System Properties > Environment Variables):
```
ANDROID_HOME: C:\Users\%USERNAME%\AppData\Local\Android\Sdk
PATH: Add %ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%ANDROID_HOME%\tools
```

### **Android Emulator Setup**
```bash
# Open Android Studio
# Tools > AVD Manager > Create Virtual Device

# Create Pixel 7 API 34 (project default)
# - Device: Pixel 7
# - System Image: API 34 (Android 14)
# - AVD Name: Pixel_7_API_34

# Verify emulator
emulator -list-avds
```

### **Android Development Verification**
```bash
# Check Android development environment
npx react-native doctor

# Should show all Android requirements as ✅
```

---

## 🔧 Step 4: React Native 0.80.1 Specific Setup

### **React Native CLI Installation**
```bash
# Install React Native CLI globally
npm install -g @react-native-community/cli

# Verify installation
npx react-native --version  # Should show 0.80.1
```

### **React Native 0.80.1 Requirements**
- **Hermes Engine**: Enabled by default (optimized for performance)
- **New Architecture**: Enabled (Fabric/TurboModules for better performance)
- **Node.js**: 18+ required for compatibility
- **Metro**: Enhanced bundler with React Native 0.80.1
- **React 19.1.0**: Concurrent features and improved performance

### **Verify React Native Environment**
```bash
# Complete environment check
npx react-native doctor

# Expected output:
# ✅ Node.js
# ✅ Bun  
# ✅ Android SDK
# ✅ Android NDK
# ✅ Xcode
# ✅ CocoaPods
```

---

## 📦 Step 5: Project Setup

### **Clone and Install Dependencies**
```bash
# Clone the repository
git clone <your-repository-url>
cd Kindred

# Install dependencies (MUST use Bun)
bun install

# Install iOS dependencies (macOS only)
bun run pod:install
```

### **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Key variables to configure:
# - GOOGLE_SERVICES_API_KEY
# - FIREBASE_CONFIG
# - API_BASE_URL
# - Environment specific settings
```

### **Platform-Specific Setup**

#### iOS Setup:
```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Or use the npm script
bun run pod:install

# Verify iOS setup
bun ios --list-devices
```

#### Android Setup:
```bash
# Clean and prepare Android
cd android && ./gradlew clean && cd ..

# Verify Android setup
bun android --list-devices
```

---

## 🧪 Step 6: Verification & First Run

### **Environment Health Check**
```bash
# Complete project validation
bun run validate

# This runs:
# - ESLint check
# - TypeScript compilation
# - Test suite
# - Dependency verification
```

### **Start Development Server**
```bash
# Start Metro bundler
bun start

# Keep this terminal open
```

### **Run on iOS** (New Terminal)
```bash
# Run on iOS simulator
bun ios

# Or specify device
bun ios --device "iPhone 15 Pro"
```

### **Run on Android** (New Terminal)
```bash
# Run on Android emulator
bun android

# Or specify emulator
bun android --device Pixel_7_API_34
```

### **Verify App Launch**
You should see:
- ✅ App launches without errors
- ✅ "Welcome to Kindred" screen appears
- ✅ Navigation works
- ✅ No red error screens

---

## 🚨 Troubleshooting Common Issues

### **iOS Issues**

#### **CocoaPods Errors**
```bash
# Clear CocoaPods cache
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

#### **Xcode Build Errors**
```bash
# Clean Xcode build
cd ios && xcodebuild clean && cd ..
rm -rf ios/build

# Restart Metro with cache reset
bun start --reset-cache
```

#### **iOS Simulator Issues**
```bash
# Reset all simulators
xcrun simctl erase all

# Boot specific simulator
xcrun simctl boot "iPhone 15 Pro"
```

### **Android Issues**

#### **Gradle Build Errors**
```bash
# Clean Gradle build
cd android && ./gradlew clean && cd ..

# Reset Android cache
rm -rf android/app/build
```

#### **Android Emulator Issues**
```bash
# Kill and restart ADB
adb kill-server && adb start-server

# List connected devices
adb devices

# Start emulator manually
emulator -avd Pixel_7_API_34
```

#### **Environment Variable Issues**
```bash
# Verify Android SDK path
echo $ANDROID_HOME

# Should output: /Users/[username]/Library/Android/sdk (macOS)
# Or: C:\Users\[username]\AppData\Local\Android\Sdk (Windows)
```

### **React Native 0.73.6 Specific Issues**

#### **Metro Bundler Issues**
```bash
# Clear Metro cache
bun run clean:metro

# Reset watchman (macOS/Linux)
watchman watch-del-all

# Restart with clean cache
bun start --reset-cache
```

#### **Hermes Engine Issues**
```bash
# Verify Hermes is enabled
# Check metro.config.js for Hermes configuration
# Should be enabled by default in RN 0.73.6
```

### **Dependency Issues**
```bash
# Clean install
rm -rf node_modules
bun install

# iOS dependencies
bun run pod:install

# Complete reset
bun run reset
```

---

## ⚡ Performance Optimization Setup

### **Development Mode Optimizations**
```bash
# Enable Flipper debugging (optional)
bun run flipper

# Enable performance monitoring
# Already configured in the project
```

### **Production Build Verification**
```bash
# Build Android release
bun run android:release

# Build iOS release (requires Apple Developer account)
bun run ios:release
```

---

## 🧪 Testing Setup Verification

### **Run Test Suite**
```bash
# Unit tests
bun test

# Integration tests
bun run test:integration

# E2E tests (requires simulators/emulators)
bun run test:e2e
```

### **Performance Tests**
```bash
# Performance benchmarks
bun run test:performance

# Bundle analysis
bun run bundle:analyze
```

---

## 📚 Additional Resources

### **React Native 0.73.6 Documentation**
- [React Native 0.73.6 Release Notes](https://github.com/facebook/react-native/releases/tag/v0.73.6)
- [Upgrading to React Native 0.73](https://react-native-community.github.io/upgrade-helper/)

### **Platform-Specific Guides**
- [iOS Development Setup](https://reactnative.dev/docs/environment-setup?guide=native&platform=ios)
- [Android Development Setup](https://reactnative.dev/docs/environment-setup?guide=native&platform=android)

### **Project Documentation**
- `QUICK_START_GUIDE.md` - Developer onboarding
- `DEVELOPMENT_GUIDE.md` - Development workflow
- `DEBUGGING_PLAYBOOK.md` - Troubleshooting guide
- `CLAUDE.md` - Project architecture and commands

---

## ✅ Setup Completion Checklist

### **Environment Setup**
- [ ] Node.js 18+ installed and verified
- [ ] Bun package manager installed and working
- [ ] Java JDK 24 installed (for Android)
- [ ] Xcode installed with Command Line Tools (macOS)
- [ ] Android Studio installed with SDK 34+
- [ ] React Native environment passes `npx react-native doctor`

### **Project Setup**
- [ ] Repository cloned
- [ ] Dependencies installed with `bun install`
- [ ] iOS dependencies installed with `bun run pod:install`
- [ ] Environment variables configured (`.env` file)
- [ ] Project validation passes (`bun run validate`)

### **Platform Verification**
- [ ] iOS simulator running and app launches
- [ ] Android emulator running and app launches
- [ ] No red error screens on either platform
- [ ] Navigation and core features working

### **Development Tools**
- [ ] Metro bundler starts without errors
- [ ] Hot reloading works on both platforms
- [ ] Tests pass (`bun test`)
- [ ] Code quality tools work (`bun run lint`, `bun run typecheck`)

---

**🎉 Congratulations! Your Kindred React Native development environment is ready!**

**Next Steps**: 
1. Read `QUICK_START_GUIDE.md` for development workflow
2. Check `CLAUDE.md` for project architecture
3. Start coding with `bun start` and `bun ios`/`bun android`