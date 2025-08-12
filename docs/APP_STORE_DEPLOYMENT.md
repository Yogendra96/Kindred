# 📱 App Store Deployment Guide

This guide covers the comprehensive app store deployment automation system for Kindred, including automated builds, releases, rollouts, and rollback procedures for both iOS App Store and Google Play Store.

## 🔧 Setup Requirements

### Prerequisites
- **Node.js**: 20+
- **Bun**: Latest version
- **Xcode**: 15.2+ (for iOS builds)
- **Android Studio**: Latest with SDK 34+ (for Android builds)
- **Fastlane**: `gem install fastlane`
- **Git**: Latest version

### Required Secrets and Credentials

#### iOS App Store Connect
- `APPSTORE_ISSUER_ID`: App Store Connect API issuer ID
- `APPSTORE_API_KEY_ID`: App Store Connect API key ID  
- `APPSTORE_API_PRIVATE_KEY`: App Store Connect API private key
- `IOS_CERTIFICATE`: Distribution certificate (base64 encoded)
- `IOS_CERTIFICATE_PASSWORD`: Certificate password
- `IOS_PROVISIONING_PROFILE`: Provisioning profile (base64 encoded)
- `IOS_PROVISIONING_PROFILE_NAME`: Provisioning profile name
- `IOS_TEAM_ID`: Apple Developer Team ID
- `IOS_CODE_SIGN_IDENTITY`: Code signing identity name

#### Google Play Store
- `GOOGLE_PLAY_SERVICE_ACCOUNT`: Service account JSON key (base64 encoded)
- `GOOGLE_PLAY_JSON_KEY_PATH`: Path to service account JSON file
- `ANDROID_KEYSTORE`: Release keystore (base64 encoded)
- `ANDROID_STORE_PASSWORD`: Keystore password
- `ANDROID_KEY_ALIAS`: Key alias
- `ANDROID_KEY_PASSWORD`: Key password

#### Additional Services
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `SENTRY_AUTH_TOKEN`: Sentry authentication token
- `PAGERDUTY_WEBHOOK`: PagerDuty webhook for alerts

## 🚀 Deployment Methods

### 1. GitHub Actions Workflow (Recommended)

#### Manual Deployment
Trigger deployment manually through GitHub Actions:

```bash
# Navigate to GitHub repository
# Go to Actions tab
# Select "Advanced App Store Automation" workflow
# Click "Run workflow"
# Configure options:
#   - Deployment Target: beta | production | rollback
#   - Rollout Percentage: 5 | 10 | 25 | 50 | 100
#   - Version Bump: patch | minor | major
#   - Release Notes: Custom message
```

#### Automatic Deployment
Automatic deployment triggers on:
- **Push to main branch**: Triggers beta deployment
- **Git tag creation** (`v*`): Triggers production deployment

### 2. CLI Release Manager

Use the custom release manager script for advanced control:

```bash
# Release to both platforms (beta)
bun run release-manager release 1.2.0 auto "New features and improvements" both beta 10

# Release to production with 25% rollout
bun run release-manager release 1.2.0 auto "Major update" both production 25

# iOS only release
bun run release-manager release 1.2.1 auto "iOS bug fixes" ios production 100

# Android only release  
bun run release-manager release 1.2.1 auto "Android improvements" android production 50

# Check deployment status
bun run release-manager status

# Emergency rollback
bun run release-manager rollback 1.1.9
```

### 3. Fastlane Commands

Direct fastlane commands for granular control:

#### Cross-platform
```bash
# Deploy beta to both platforms
fastlane deploy_beta

# Deploy production to both platforms
fastlane deploy_production rollout:0.25

# Emergency rollback
fastlane emergency_rollback
```

#### iOS Specific
```bash
# iOS beta (TestFlight)
fastlane ios beta

# iOS production (App Store)
fastlane ios release

# iOS screenshots
fastlane ios screenshots

# iOS metadata update
fastlane ios metadata
```

#### Android Specific
```bash
# Android internal testing
fastlane android internal

# Android production with rollout
fastlane android production rollout:0.1

# Increase Android rollout
fastlane android increase_rollout rollout:0.5

# Halt Android rollout
fastlane android halt_rollout
```

### 4. Package.json Scripts

Quick deployment scripts via npm/bun:

```bash
# Beta deployment
bun run deploy:beta

# Production deployment  
bun run deploy:production

# Platform-specific deployments
bun run deploy:ios:beta
bun run deploy:ios:release
bun run deploy:android:internal
bun run deploy:android:production

# Emergency rollback
bun run deploy:rollback
```

## 📊 Deployment Pipeline Stages

### 1. Pre-deployment Validation
- ✅ Git branch validation (main for production)
- ✅ Uncommitted changes check
- ✅ Version bump and tagging
- ✅ TypeScript compilation
- ✅ ESLint validation
- ✅ Unit test execution
- ✅ Security vulnerability scan
- ✅ Bundle analysis

### 2. Build Process
- 🤖 **Android**: AAB and APK generation with signing
- 🍎 **iOS**: Archive and IPA creation with code signing
- 📦 Build artifact verification
- 🔍 Size and performance validation

### 3. Store Deployment
- 🚀 **Google Play**: Internal testing → Staged production rollout
- 🚀 **App Store**: TestFlight → App Store review submission
- 📈 Rollout percentage management
- 📊 Real-time deployment monitoring

### 4. Post-deployment
- 📊 Sentry release tracking
- 📈 Analytics configuration
- 🔔 Alert setup
- 📢 Team notifications
- 📋 Release documentation

## 🎯 Deployment Strategies

### Beta Deployment
```yaml
Target: Internal testing
Platforms: iOS (TestFlight) + Android (Internal Testing)
Rollout: 100% to beta testers
Approval: Automatic
Duration: Immediate
```

### Production Deployment
```yaml
Target: Public app stores
Platforms: iOS (App Store) + Android (Google Play)
Rollout: Staged (5% → 10% → 25% → 50% → 100%)
Approval: Manual for iOS, Automatic for Android
Duration: 2-7 days (iOS review) + Staged rollout
```

### Emergency Rollback
```yaml
Target: Immediate issue resolution
Action: Halt current rollout, revert to previous version
Platforms: Both platforms
Duration: Immediate (Android), Manual (iOS)
Notification: PagerDuty + Slack alerts
```

## 📈 Staged Rollout Management

### Automatic Progression
The system automatically progresses rollouts based on health metrics:

1. **Initial Release**: 5% rollout
2. **Health Check**: Monitor for 2 hours
3. **Progressive Rollout**: Increase based on metrics
   - Crash rate < 1.0% → Increase to 10%
   - Error rate < 2.0% → Increase to 25%
   - User satisfaction > 4.0 → Increase to 50%
   - All metrics healthy → Complete rollout (100%)

### Manual Override
```bash
# Increase rollout percentage
fastlane android increase_rollout rollout:0.5

# Halt rollout immediately
fastlane android halt_rollout

# Resume halted rollout
fastlane android production rollout:0.25
```

## 🔄 Rollback Procedures

### Automatic Rollback Triggers
- Crash rate > 2.0%
- Error rate > 5.0%
- Critical security vulnerability
- Performance regression > 50%
- User rating drops below 3.5

### Manual Rollback Process
1. **Identify Issue**: Monitoring alerts or user reports
2. **Halt Rollout**: Stop current deployment
3. **Assess Impact**: Determine affected users
4. **Execute Rollback**: Revert to previous stable version
5. **Communicate**: Notify team and users
6. **Post-mortem**: Document and improve

### Rollback Commands
```bash
# Emergency rollback (all platforms)
bun run deploy:rollback

# Platform-specific rollback
fastlane android halt_rollout
# iOS requires manual App Store Connect action
```

## 📊 Monitoring and Alerting

### Key Metrics Tracked
- **Deployment Success Rate**: Target > 95%
- **Build Time**: Target < 20 minutes
- **App Store Approval Time**: Average 24-48 hours
- **Rollout Progression**: Health-based automation
- **User Adoption**: Version upgrade rates

### Alert Channels
- **Slack**: Real-time deployment status
- **PagerDuty**: Critical issues and failures
- **Email**: Daily deployment reports
- **Sentry**: Error tracking and performance

### Monitoring Dashboards
- **GitHub Actions**: Build and deployment status
- **Sentry**: Release tracking and error monitoring
- **App Store Connect**: iOS metrics and reviews
- **Google Play Console**: Android metrics and reviews

## 🛡️ Security Considerations

### Credential Management
- All secrets stored in GitHub Secrets
- Credentials rotated quarterly
- Access logs monitored
- Multi-factor authentication required

### Code Signing
- Separate certificates for development/distribution
- Automatic certificate renewal
- Keychain security on build machines
- Provisioning profile management

### Release Integrity
- Git tag verification
- Build artifact checksums
- Code signing validation
- Store upload verification

## 🚨 Troubleshooting

### Common Issues

#### iOS Build Failures
```bash
# Certificate issues
security find-identity -v -p codesigning

# Provisioning profile issues
security cms -D -i profile.mobileprovision

# Xcode version mismatch
xcode-select --print-path
```

#### Android Build Failures
```bash
# Keystore issues
keytool -list -v -keystore release.keystore

# Gradle configuration
./gradlew clean build --debug

# SDK issues  
sdkmanager --list
```

#### Deployment Failures
```bash
# Check credentials
fastlane run validate_play_store_json_key json_key:"path/to/key.json"

# Verify app bundle
bundletool validate --bundle=app.aab

# Check App Store Connect status
spaceship list_apps
```

### Support Resources
- **Documentation**: `/docs/APP_STORE_DEPLOYMENT.md`
- **Slack Channel**: `#app-store-deployments`
- **On-call Engineer**: Via PagerDuty
- **Apple Developer Support**: developer.apple.com/support
- **Google Play Support**: support.google.com/googleplay/android-developer

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Code review completed and approved
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed with no critical issues
- [ ] Performance regression tests passed
- [ ] Release notes prepared and reviewed
- [ ] App store metadata updated
- [ ] Screenshots and assets updated (if needed)

### During Deployment
- [ ] Monitor build progress in GitHub Actions
- [ ] Verify successful artifact upload
- [ ] Check initial rollout metrics
- [ ] Monitor error rates and crash reports
- [ ] Validate app functionality in production

### Post-deployment
- [ ] Confirm app store listing updates
- [ ] Monitor user feedback and reviews
- [ ] Track adoption and upgrade rates
- [ ] Document any issues or improvements
- [ ] Schedule next release planning

## 🔄 Continuous Improvement

### Metrics Collection
- Build time optimization
- Deployment success rates
- Time to production
- Rollback frequency
- User satisfaction scores

### Process Improvements
- Automated testing expansion
- Build pipeline optimization
- Release note automation
- Monitoring enhancement
- Team training and onboarding

This deployment system provides enterprise-grade app store automation with comprehensive monitoring, staged rollouts, and emergency rollback capabilities for production-ready mobile applications.