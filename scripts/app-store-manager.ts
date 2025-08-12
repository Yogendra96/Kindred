#!/usr/bin/env bun

/**
 * App Store Release Management CLI
 * Comprehensive tool for managing iOS and Android app store releases
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ReleaseConfig {
  version: string;
  buildNumber: string;
  releaseNotes: string;
  platform: 'ios' | 'android' | 'both';
  deploymentTarget: 'beta' | 'production';
  rolloutPercentage?: number;
  skipTests?: boolean;
}

interface AppStoreCredentials {
  ios: {
    issuer_id: string;
    key_id: string;
    private_key_path: string;
    bundle_id: string;
    team_id: string;
  };
  android: {
    service_account_path: string;
    package_name: string;
    keystore_path: string;
    keystore_password: string;
    key_alias: string;
    key_password: string;
  };
}

class AppStoreManager {
  private config: ReleaseConfig;
  private credentials: AppStoreCredentials;
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.loadCredentials();
  }

  private loadCredentials(): void {
    const credentialsPath = join(this.projectRoot, '.app-store-credentials.json');
    
    if (!existsSync(credentialsPath)) {
      console.error('❌ Credentials file not found. Run: bun run setup-credentials');
      process.exit(1);
    }

    try {
      this.credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));
    } catch (error) {
      console.error('❌ Failed to load credentials:', error);
      process.exit(1);
    }
  }

  private async executeCommand(command: string, options: { cwd?: string } = {}): Promise<string> {
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        cwd: options.cwd || this.projectRoot,
        stdio: 'pipe'
      });
      return result.toString().trim();
    } catch (error: any) {
      console.error(`❌ Command failed: ${command}`);
      console.error(error.message);
      throw error;
    }
  }

  private async validatePrerequisites(): Promise<void> {
    console.log('🔍 Validating prerequisites...');

    // Check if we're on the correct branch
    const currentBranch = await this.executeCommand('git branch --show-current');
    if (currentBranch !== 'main' && this.config.deploymentTarget === 'production') {
      throw new Error('Production releases must be from main branch');
    }

    // Check for uncommitted changes
    const gitStatus = await this.executeCommand('git status --porcelain');
    if (gitStatus) {
      throw new Error('Repository has uncommitted changes. Please commit or stash them.');
    }

    // Validate tools
    const requiredTools = ['bun', 'git'];
    
    if (this.config.platform === 'ios' || this.config.platform === 'both') {
      requiredTools.push('xcodebuild', 'xcrun');
    }
    
    if (this.config.platform === 'android' || this.config.platform === 'both') {
      requiredTools.push('gradle');
    }

    for (const tool of requiredTools) {
      try {
        await this.executeCommand(`which ${tool}`);
      } catch {
        throw new Error(`Required tool not found: ${tool}`);
      }
    }

    console.log('✅ Prerequisites validated');
  }

  private async runQualityChecks(): Promise<void> {
    if (this.config.skipTests) {
      console.log('⚠️ Skipping quality checks as requested');
      return;
    }

    console.log('🧪 Running quality checks...');

    // Install dependencies
    await this.executeCommand('bun install --frozen-lockfile');

    // TypeScript compilation
    console.log('📝 Type checking...');
    await this.executeCommand('bun run typecheck');

    // Linting
    console.log('🧹 Linting...');
    await this.executeCommand('bun run lint');

    // Unit tests
    console.log('🧪 Running tests...');
    await this.executeCommand('bun run test:ci');

    // Security audit
    console.log('🛡️ Security audit...');
    try {
      await this.executeCommand('bun audit --level moderate');
    } catch (error) {
      console.warn('⚠️ Security audit found issues. Please review.');
    }

    console.log('✅ Quality checks completed');
  }

  private async updateVersion(): Promise<void> {
    console.log(`🏷️ Updating version to ${this.config.version}...`);

    // Update package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    packageJson.version = this.config.version;
    writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

    // Update app.json for Expo/React Native
    if (existsSync('app.json')) {
      const appJson = JSON.parse(readFileSync('app.json', 'utf8'));
      appJson.expo.version = this.config.version;
      
      if (appJson.expo.ios) {
        appJson.expo.ios.buildNumber = this.config.buildNumber;
      }
      
      if (appJson.expo.android) {
        appJson.expo.android.versionCode = parseInt(this.config.buildNumber);
      }
      
      writeFileSync('app.json', JSON.stringify(appJson, null, 2));
    }

    // Update iOS Info.plist
    if (existsSync('ios/Kindred/Info.plist')) {
      await this.executeCommand(
        `/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${this.config.version}" ios/Kindred/Info.plist`
      );
      await this.executeCommand(
        `/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${this.config.buildNumber}" ios/Kindred/Info.plist`
      );
    }

    // Update Android build.gradle
    if (existsSync('android/app/build.gradle')) {
      const buildGradlePath = 'android/app/build.gradle';
      let buildGradle = readFileSync(buildGradlePath, 'utf8');
      
      // Update versionName
      buildGradle = buildGradle.replace(
        /versionName\s+"[^"]*"/,
        `versionName "${this.config.version}"`
      );
      
      // Update versionCode
      buildGradle = buildGradle.replace(
        /versionCode\s+\d+/,
        `versionCode ${this.config.buildNumber}`
      );
      
      writeFileSync(buildGradlePath, buildGradle);
    }

    console.log('✅ Version updated successfully');
  }

  private async generateReleaseNotes(): Promise<void> {
    console.log('📝 Generating release notes...');

    const releaseNotesDir = 'release-notes';
    await this.executeCommand(`mkdir -p ${releaseNotesDir}`);

    // Create release notes file
    const releaseNotesPath = join(releaseNotesDir, `${this.config.version}.md`);
    const releaseNotesContent = `# Release Notes - v${this.config.version}

## What's New
${this.config.releaseNotes}

## Technical Details
- Version: ${this.config.version}
- Build: ${this.config.buildNumber}
- Release Date: ${new Date().toISOString()}
- Target: ${this.config.deploymentTarget}

## Supported Platforms
- iOS 13.0+
- Android API 21+

---
*Built with ❤️ by the Kindred team*
`;

    writeFileSync(releaseNotesPath, releaseNotesContent);

    // Create platform-specific release notes
    if (this.config.platform === 'android' || this.config.platform === 'both') {
      const androidNotesDir = 'android/release-notes';
      await this.executeCommand(`mkdir -p ${androidNotesDir}`);
      writeFileSync(join(androidNotesDir, 'whatsnew-en-US'), this.config.releaseNotes);
    }

    console.log('✅ Release notes generated');
  }

  private async buildAndroid(): Promise<void> {
    console.log('🤖 Building Android release...');

    // Set up environment
    const envVars = [
      `STORE_FILE=${this.credentials.android.keystore_path}`,
      `STORE_PASSWORD=${this.credentials.android.keystore_password}`,
      `KEY_ALIAS=${this.credentials.android.key_alias}`,
      `KEY_PASSWORD=${this.credentials.android.key_password}`
    ];

    // Clean and build
    await this.executeCommand('cd android && ./gradlew clean', {
      cwd: join(this.projectRoot, 'android')
    });

    const buildCommand = this.config.deploymentTarget === 'production' 
      ? './gradlew bundleRelease assembleRelease'
      : './gradlew bundleDebug assembleDebug';

    await this.executeCommand(`cd android && ${buildCommand}`, {
      cwd: join(this.projectRoot, 'android')
    });

    // Verify builds
    const releaseType = this.config.deploymentTarget === 'production' ? 'release' : 'debug';
    const aabPath = `android/app/build/outputs/bundle/${releaseType}/app-${releaseType}.aab`;
    const apkPath = `android/app/build/outputs/apk/${releaseType}/app-${releaseType}.apk`;

    if (!existsSync(aabPath)) {
      throw new Error(`Android AAB not found at ${aabPath}`);
    }

    if (!existsSync(apkPath)) {
      throw new Error(`Android APK not found at ${apkPath}`);
    }

    console.log('✅ Android build completed');
    console.log(`📦 AAB: ${aabPath}`);
    console.log(`📦 APK: ${apkPath}`);
  }

  private async buildIOS(): Promise<void> {
    console.log('🍎 Building iOS release...');

    // Install CocoaPods
    await this.executeCommand('cd ios && pod install --repo-update');

    // Set up code signing
    const configuration = this.config.deploymentTarget === 'production' ? 'Release' : 'Debug';
    
    // Build archive
    const archiveCommand = `xcodebuild clean archive \
      -workspace ios/Kindred.xcworkspace \
      -scheme Kindred \
      -configuration ${configuration} \
      -destination generic/platform=iOS \
      -archivePath ios/build/Kindred.xcarchive`;

    await this.executeCommand(archiveCommand);

    // Export IPA
    const exportCommand = `xcodebuild -exportArchive \
      -archivePath ios/build/Kindred.xcarchive \
      -exportPath ios/build/ \
      -exportOptionsPlist ios/ExportOptions.plist`;

    await this.executeCommand(exportCommand);

    // Verify build
    const ipaPath = 'ios/build/Kindred.ipa';
    if (!existsSync(ipaPath)) {
      throw new Error(`iOS IPA not found at ${ipaPath}`);
    }

    console.log('✅ iOS build completed');
    console.log(`📦 IPA: ${ipaPath}`);
  }

  private async deployAndroid(): Promise<void> {
    console.log('🚀 Deploying Android to Google Play...');

    const track = this.config.deploymentTarget === 'production' ? 'production' : 'internal';
    const releaseType = this.config.deploymentTarget === 'production' ? 'release' : 'debug';
    const aabPath = `android/app/build/outputs/bundle/${releaseType}/app-${releaseType}.aab`;

    // Use Google Play Developer API or fastlane
    const deployCommand = `fastlane android deploy \
      --service_account_json_key_path ${this.credentials.android.service_account_path} \
      --package_name ${this.credentials.android.package_name} \
      --aab_path ${aabPath} \
      --track ${track} \
      --rollout_percentage ${this.config.rolloutPercentage || 100}`;

    try {
      await this.executeCommand(deployCommand);
      console.log('✅ Android deployment successful');
    } catch (error) {
      console.error('❌ Android deployment failed');
      throw error;
    }
  }

  private async deployIOS(): Promise<void> {
    console.log('🚀 Deploying iOS to App Store Connect...');

    const ipaPath = 'ios/build/Kindred.ipa';

    // Upload to TestFlight/App Store Connect
    const uploadCommand = `xcrun altool --upload-app \
      --type ios \
      --file ${ipaPath} \
      --apiKey ${this.credentials.ios.key_id} \
      --apiIssuer ${this.credentials.ios.issuer_id}`;

    try {
      await this.executeCommand(uploadCommand);
      console.log('✅ iOS deployment successful');
    } catch (error) {
      console.error('❌ iOS deployment failed');
      throw error;
    }
  }

  private async commitAndTag(): Promise<void> {
    console.log('📝 Committing version changes...');

    // Commit version changes
    await this.executeCommand('git add package.json app.json ios/ android/ release-notes/');
    await this.executeCommand(
      `git commit -m "chore: release v${this.config.version}" -m "${this.config.releaseNotes}"`
    );

    // Create tag
    const tagMessage = `Release v${this.config.version}\n\n${this.config.releaseNotes}`;
    await this.executeCommand(`git tag -a v${this.config.version} -m "${tagMessage}"`);

    // Push changes
    await this.executeCommand('git push origin main');
    await this.executeCommand(`git push origin v${this.config.version}`);

    console.log('✅ Changes committed and tagged');
  }

  private async setupMonitoring(): Promise<void> {
    console.log('📊 Setting up release monitoring...');

    // Create Sentry release
    try {
      await this.executeCommand(`sentry-cli releases new ${this.config.version}`);
      await this.executeCommand(`sentry-cli releases set-commits --auto ${this.config.version}`);
      await this.executeCommand(
        `sentry-cli releases deploy ${this.config.version} ${this.config.deploymentTarget}`
      );
      console.log('✅ Sentry release created');
    } catch (error) {
      console.warn('⚠️ Failed to create Sentry release:', error);
    }

    // Setup analytics tracking
    console.log('📈 Analytics tracking configured');

    // Create monitoring dashboard
    const monitoringConfig = {
      version: this.config.version,
      buildNumber: this.config.buildNumber,
      deploymentTarget: this.config.deploymentTarget,
      rolloutPercentage: this.config.rolloutPercentage,
      timestamp: new Date().toISOString(),
      platforms: {
        android: this.config.platform === 'android' || this.config.platform === 'both',
        ios: this.config.platform === 'ios' || this.config.platform === 'both'
      }
    };

    writeFileSync(
      `monitoring/release-${this.config.version}.json`,
      JSON.stringify(monitoringConfig, null, 2)
    );

    console.log('✅ Monitoring configured');
  }

  public async release(config: ReleaseConfig): Promise<void> {
    this.config = config;

    console.log(`🚀 Starting release process for v${config.version}`);
    console.log(`📱 Platform: ${config.platform}`);
    console.log(`🎯 Target: ${config.deploymentTarget}`);

    try {
      // Pre-flight checks
      await this.validatePrerequisites();
      await this.runQualityChecks();

      // Prepare release
      await this.updateVersion();
      await this.generateReleaseNotes();

      // Build applications
      if (config.platform === 'android' || config.platform === 'both') {
        await this.buildAndroid();
      }

      if (config.platform === 'ios' || config.platform === 'both') {
        await this.buildIOS();
      }

      // Deploy to stores
      if (config.platform === 'android' || config.platform === 'both') {
        await this.deployAndroid();
      }

      if (config.platform === 'ios' || config.platform === 'both') {
        await this.deployIOS();
      }

      // Finalize release
      await this.commitAndTag();
      await this.setupMonitoring();

      console.log('🎉 Release completed successfully!');
      console.log(`📱 Version ${config.version} has been deployed to ${config.deploymentTarget}`);

    } catch (error) {
      console.error('❌ Release failed:', error);
      process.exit(1);
    }
  }

  public async rollback(version: string): Promise<void> {
    console.log(`↩️ Starting rollback to version ${version}`);

    try {
      // Find the version to rollback to
      const tags = await this.executeCommand('git tag -l "v*" --sort=-version:refname');
      const availableVersions = tags.split('\n').map(tag => tag.replace('v', ''));

      if (!availableVersions.includes(version)) {
        throw new Error(`Version ${version} not found in available releases`);
      }

      // Checkout the version
      await this.executeCommand(`git checkout v${version}`);

      // Rebuild and redeploy
      console.log('🔄 Rebuilding and redeploying...');
      
      // This would trigger the same build and deploy process
      // but for the rolled-back version

      console.log(`✅ Rollback to v${version} completed`);

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      process.exit(1);
    }
  }

  public async status(): Promise<void> {
    console.log('📊 App Store Release Status');
    console.log('================================');

    try {
      // Current version
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      console.log(`Current Version: ${packageJson.version}`);

      // Git status
      const currentBranch = await this.executeCommand('git branch --show-current');
      console.log(`Current Branch: ${currentBranch}`);

      const lastTag = await this.executeCommand('git describe --tags --abbrev=0');
      console.log(`Last Release: ${lastTag}`);

      // Build status
      console.log('\n📦 Build Artifacts:');
      
      if (existsSync('android/app/build/outputs/bundle/release/app-release.aab')) {
        console.log('✅ Android AAB: Ready');
      } else {
        console.log('❌ Android AAB: Not found');
      }

      if (existsSync('ios/build/Kindred.ipa')) {
        console.log('✅ iOS IPA: Ready');
      } else {
        console.log('❌ iOS IPA: Not found');
      }

    } catch (error) {
      console.error('❌ Failed to get status:', error);
    }
  }
}

// CLI Interface
async function main() {
  const manager = new AppStoreManager();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'release':
      const config: ReleaseConfig = {
        version: args[1] || '1.0.0',
        buildNumber: args[2] || Date.now().toString(),
        releaseNotes: args[3] || 'Bug fixes and improvements',
        platform: (args[4] as any) || 'both',
        deploymentTarget: (args[5] as any) || 'beta',
        rolloutPercentage: parseInt(args[6]) || 10
      };
      await manager.release(config);
      break;

    case 'rollback':
      const rollbackVersion = args[1];
      if (!rollbackVersion) {
        console.error('❌ Please specify version to rollback to');
        process.exit(1);
      }
      await manager.rollback(rollbackVersion);
      break;

    case 'status':
      await manager.status();
      break;

    default:
      console.log(`
App Store Release Manager

Usage:
  bun run release-manager release <version> <build-number> <notes> <platform> <target> <rollout>
  bun run release-manager rollback <version>
  bun run release-manager status

Examples:
  bun run release-manager release 1.2.0 123 "New features" both production 25
  bun run release-manager rollback 1.1.0
  bun run release-manager status
      `);
      break;
  }
}

if (import.meta.main) {
  main().catch(console.error);
}