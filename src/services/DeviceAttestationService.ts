import { Platform } from 'react-native';

import DeviceInfo from 'react-native-device-info';
import * as Keychain from 'react-native-keychain';

import { advancedEncryptionService } from './AdvancedEncryptionService';
import { enhancedPerformanceService } from './EnhancedPerformanceService';
import { loggingService } from './LoggingService';

export interface DeviceIdentity {
  readonly deviceId: string;
  readonly fingerprint: string;
  readonly hardwareSignature: string;
  readonly osSignature: string;
  readonly appSignature: string;
  readonly timestamp: number;
}

export interface AttestationResult {
  readonly isValid: boolean;
  readonly confidence: 'low' | 'medium' | 'high';
  readonly deviceIdentity: DeviceIdentity;
  readonly integrityChecks: readonly IntegrityCheck[];
  readonly riskFactors: readonly RiskFactor[];
  readonly attestationTime: number;
}

export interface IntegrityCheck {
  readonly type:
    | 'root'
    | 'debug'
    | 'hook'
    | 'emulator'
    | 'tamper'
    | 'signature';
  readonly status: 'pass' | 'fail' | 'warning';
  readonly description: string;
  readonly evidence?: string;
}

export interface RiskFactor {
  readonly type: 'environment' | 'device' | 'behavior' | 'network';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly mitigation?: string;
}

export interface AttestationConfig {
  readonly enableRootDetection: boolean;
  readonly enableEmulatorDetection: boolean;
  readonly enableDebugDetection: boolean;
  readonly enableSignatureVerification: boolean;
  readonly enableBehaviorAnalysis: boolean;
  readonly strictMode: boolean; // Fail on any security issue
  readonly cacheDuration: number; // milliseconds
}

class DeviceAttestationService {
  private readonly config: AttestationConfig;
  private cachedAttestation?: AttestationResult;
  private lastAttestationTime = 0;
  private behaviorMetrics = new Map<string, number>();
  private suspiciousActivityCount = 0;

  // Hardware fingerprinting constants
  private readonly FINGERPRINT_COMPONENTS = [
    'uniqueId',
    'deviceId',
    'brand',
    'model',
    'systemVersion',
    'buildNumber',
    'bundleId',
    'deviceType',
    'hasSystemFeature',
    'getSystemAvailableFeatures',
  ] as const;

  constructor() {
    this.config = {
      enableRootDetection: !__DEV__,
      enableEmulatorDetection: true,
      enableDebugDetection: !__DEV__,
      enableSignatureVerification: !__DEV__,
      enableBehaviorAnalysis: true,
      strictMode: !__DEV__,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    };
  }

  public async initialize(): Promise<void> {
    const startTime = Date.now();

    try {
      // Perform initial device attestation
      const attestation = await this.performDeviceAttestation();

      if (this.config.strictMode && !attestation.isValid) {
        throw new Error(
          `Device attestation failed: ${attestation.riskFactors
            .map(r => r.description)
            .join(', ')}`,
        );
      }

      // Initialize behavior monitoring
      this.initializeBehaviorMonitoring();

      enhancedPerformanceService.recordMetric(
        'device_attestation_init',
        Date.now() - startTime,
        'ms',
      );

      loggingService.info('Device Attestation Service initialized', {
        isValid: attestation.isValid,
        confidence: attestation.confidence,
        integrityChecks: attestation.integrityChecks.length,
        riskFactors: attestation.riskFactors.length,
      });
    } catch (error) {
      loggingService.error('Device Attestation Service initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Perform comprehensive device attestation
   */
  public async performDeviceAttestation(
    forceRefresh = false,
  ): Promise<AttestationResult> {
    const startTime = Date.now();

    try {
      // Check cache if not forcing refresh
      if (!forceRefresh && this.isCacheValid()) {
        return this.cachedAttestation as AttestationResult;
      }

      // Generate device identity
      const deviceIdentity = await this.generateDeviceIdentity();

      // Perform integrity checks
      const integrityChecks = await this.performIntegrityChecks();

      // Analyze risk factors
      const riskFactors = await this.analyzeRiskFactors(integrityChecks);

      // Calculate confidence level
      const confidence = this.calculateConfidenceLevel(
        integrityChecks,
        riskFactors,
      );

      // Determine overall validity
      const isValid = this.determineValidity(integrityChecks, riskFactors);

      const attestation: AttestationResult = {
        isValid,
        confidence,
        deviceIdentity,
        integrityChecks,
        riskFactors,
        attestationTime: Date.now() - startTime,
      };

      // Cache the result
      this.cacheAttestation(attestation);

      // Log attestation result
      await this.logAttestationResult(attestation);

      enhancedPerformanceService.recordMetric(
        'device_attestation_time',
        attestation.attestationTime,
        'ms',
      );

      return attestation;
    } catch (error) {
      loggingService.error('Device attestation failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Return failed attestation
      return {
        isValid: false,
        confidence: 'low',
        deviceIdentity: await this.generateBasicDeviceIdentity(),
        integrityChecks: [
          {
            type: 'tamper',
            status: 'fail',
            description: 'Attestation process failed',
            evidence: error instanceof Error ? error.message : String(error),
          },
        ],
        riskFactors: [
          {
            type: 'device',
            severity: 'critical',
            description: 'Device attestation process compromised',
          },
        ],
        attestationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Verify device identity against stored baseline
   */
  public async verifyDeviceIdentity(
    expectedIdentity: DeviceIdentity,
  ): Promise<boolean> {
    try {
      const currentIdentity = await this.generateDeviceIdentity();

      // Compare core identity components
      const identityMatch =
        currentIdentity.deviceId === expectedIdentity.deviceId &&
        currentIdentity.fingerprint === expectedIdentity.fingerprint &&
        currentIdentity.hardwareSignature ===
          expectedIdentity.hardwareSignature;

      if (!identityMatch) {
        loggingService.warn('Device identity verification failed', {
          expectedDeviceId: await advancedEncryptionService.hashData(
            expectedIdentity.deviceId,
          ),
          currentDeviceId: await advancedEncryptionService.hashData(
            currentIdentity.deviceId,
          ),
          expectedFingerprint: expectedIdentity.fingerprint.substring(0, 8),
          currentFingerprint: currentIdentity.fingerprint.substring(0, 8),
        });
      }

      return identityMatch;
    } catch (error) {
      loggingService.error('Device identity verification error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Record suspicious behavior for analysis
   */
  public recordSuspiciousActivity(
    activity: string,
    severity: 'low' | 'medium' | 'high',
  ): void {
    this.suspiciousActivityCount++;

    const currentCount = this.behaviorMetrics.get(activity) || 0;
    this.behaviorMetrics.set(activity, currentCount + 1);

    loggingService.warn('Suspicious activity recorded', {
      activity,
      severity,
      count: currentCount + 1,
      totalSuspiciousActivities: this.suspiciousActivityCount,
    });

    // Trigger re-attestation if too many suspicious activities
    if (this.suspiciousActivityCount > 10) {
      this.invalidateCache();
    }
  }

  /**
   * Get current device trust score
   */
  public async getDeviceTrustScore(): Promise<number> {
    const attestation = await this.performDeviceAttestation();

    let score = 100;

    // Deduct points for failed integrity checks
    for (const check of attestation.integrityChecks) {
      if (check.status === 'fail') {
        score -= check.type === 'root' ? 30 : 20;
      } else if (check.status === 'warning') {
        score -= 10;
      }
    }

    // Deduct points for risk factors
    for (const risk of attestation.riskFactors) {
      switch (risk.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Deduct points for suspicious behavior
    score -= Math.min(this.suspiciousActivityCount * 2, 20);

    return Math.max(0, score);
  }

  /**
   * Get cached attestation if valid
   */
  public getCachedAttestation(): AttestationResult | null {
    return this.isCacheValid()
      ? (this.cachedAttestation as AttestationResult)
      : null;
  }

  /**
   * Invalidate cached attestation
   */
  public invalidateCache(): void {
    this.cachedAttestation = undefined;
    this.lastAttestationTime = 0;
  }

  // Private methods

  private async generateDeviceIdentity(): Promise<DeviceIdentity> {
    try {
      const components = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getDeviceId(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBuildNumber(),
        DeviceInfo.getBundleId(),
        DeviceInfo.getDeviceType(),
        this.getHardwareFingerprint(),
        this.getOSFingerprint(),
        this.getAppFingerprint(),
      ]);

      const deviceId = components[0];
      const fingerprint = await advancedEncryptionService.hashData(
        components.join('|'),
      );
      const hardwareSignature = await advancedEncryptionService.hashData(
        components.slice(2, 8).join('|'),
      );
      const osSignature = await advancedEncryptionService.hashData(
        components[4],
      );
      const appSignature = await advancedEncryptionService.hashData(
        components[5] + components[6],
      );

      return {
        deviceId,
        fingerprint,
        hardwareSignature,
        osSignature,
        appSignature,
        timestamp: Date.now(),
      };
    } catch (error) {
      loggingService.error('Device identity generation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.generateBasicDeviceIdentity();
    }
  }

  private async generateBasicDeviceIdentity(): Promise<DeviceIdentity> {
    return {
      deviceId: 'unknown',
      fingerprint: 'unknown',
      hardwareSignature: 'unknown',
      osSignature: 'unknown',
      appSignature: 'unknown',
      timestamp: Date.now(),
    };
  }

  private async performIntegrityChecks(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];

    try {
      // Root/Jailbreak detection
      if (this.config.enableRootDetection) {
        const rootCheck = await this.checkRootJailbreak();
        checks.push(rootCheck);
      }

      // Emulator detection
      if (this.config.enableEmulatorDetection) {
        const emulatorCheck = await this.checkEmulator();
        checks.push(emulatorCheck);
      }

      // Debug detection
      if (this.config.enableDebugDetection) {
        const debugCheck = await this.checkDebugEnvironment();
        checks.push(debugCheck);
      }

      // Signature verification
      if (this.config.enableSignatureVerification) {
        const signatureCheck = await this.checkAppSignature();
        checks.push(signatureCheck);
      }

      // Hook detection
      const hookCheck = this.checkHooks();
      checks.push(hookCheck);

      // Tamper detection
      const tamperCheck = this.checkTampering();
      checks.push(tamperCheck);
    } catch (error) {
      checks.push({
        type: 'tamper',
        status: 'fail',
        description: 'Integrity check process failed',
        evidence: error instanceof Error ? error.message : String(error),
      });
    }

    return checks;
  }

  private async checkRootJailbreak(): Promise<IntegrityCheck> {
    try {
      if (Platform.OS === 'android') {
        return this.checkAndroidRoot();
      } else if (Platform.OS === 'ios') {
        return this.checkiOSJailbreak();
      }

      return {
        type: 'root',
        status: 'pass',
        description: 'Platform not supported for root detection',
      };
    } catch (error) {
      return {
        type: 'root',
        status: 'fail',
        description: 'Root detection failed',
        evidence: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private checkAndroidRoot(): IntegrityCheck {
    // Check for common root indicators
    const rootIndicators = [
      '/system/app/Superuser.apk',
      '/sbin/su',
      '/system/bin/su',
      '/system/xbin/su',
      '/data/local/xbin/su',
      '/data/local/bin/su',
      '/system/sd/xbin/su',
      '/system/bin/failsafe/su',
      '/data/local/su',
    ];

    // In a real implementation, you would check for these files
    // For now, we'll check for development mode as an indicator
    const isDev = __DEV__;

    if (isDev) {
      return {
        type: 'root',
        status: 'warning',
        description: 'Development environment detected',
        evidence: 'Application running in development mode',
      };
    }

    return {
      type: 'root',
      status: 'pass',
      description: 'No root indicators detected',
    };
  }

  private checkiOSJailbreak(): IntegrityCheck {
    // Check for common jailbreak indicators
    const jailbreakIndicators = [
      '/Applications/Cydia.app',
      '/Library/MobileSubstrate/MobileSubstrate.dylib',
      '/bin/bash',
      '/usr/sbin/sshd',
      '/etc/apt',
      '/private/var/lib/apt/',
    ];

    // In a real implementation, you would check for these paths
    // For now, we'll check for development mode
    const isDev = __DEV__;

    if (isDev) {
      return {
        type: 'root',
        status: 'warning',
        description: 'Development environment detected',
        evidence: 'Application running in development mode',
      };
    }

    return {
      type: 'root',
      status: 'pass',
      description: 'No jailbreak indicators detected',
    };
  }

  private async checkEmulator(): Promise<IntegrityCheck> {
    try {
      const isEmulator = await DeviceInfo.isEmulator();

      if (isEmulator) {
        return {
          type: 'emulator',
          status: 'warning',
          description: 'Application running on emulator',
          evidence: 'DeviceInfo.isEmulator() returned true',
        };
      }

      return {
        type: 'emulator',
        status: 'pass',
        description: 'Running on physical device',
      };
    } catch (error) {
      return {
        type: 'emulator',
        status: 'fail',
        description: 'Emulator detection failed',
        evidence: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkDebugEnvironment(): Promise<IntegrityCheck> {
    const debugIndicators: string[] = [];

    // Check for development mode
    if (__DEV__) {
      debugIndicators.push('Development mode enabled');
    }

    // Check for React DevTools
    if (typeof (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
      debugIndicators.push('React DevTools detected');
    }

    // Check for Flipper
    if (typeof (global as any).__FLIPPER__ !== 'undefined') {
      debugIndicators.push('Flipper debugging tool detected');
    }

    if (debugIndicators.length > 0) {
      return {
        type: 'debug',
        status: 'warning',
        description: 'Debug environment detected',
        evidence: debugIndicators.join(', '),
      };
    }

    return {
      type: 'debug',
      status: 'pass',
      description: 'No debug environment detected',
    };
  }

  private async checkAppSignature(): Promise<IntegrityCheck> {
    try {
      // In a real implementation, you would verify the app signature
      // against a known good signature
      const bundleId = await DeviceInfo.getBundleId();

      if (bundleId.includes('debug') || bundleId.includes('dev')) {
        return {
          type: 'signature',
          status: 'warning',
          description: 'Debug build signature detected',
          evidence: `Bundle ID: ${bundleId}`,
        };
      }

      return {
        type: 'signature',
        status: 'pass',
        description: 'App signature valid',
      };
    } catch (error) {
      return {
        type: 'signature',
        status: 'fail',
        description: 'Signature verification failed',
        evidence: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private checkHooks(): IntegrityCheck {
    const suspiciousGlobals = [
      'frida',
      'xposed',
      'substrate',
      'cydia',
      '_orig',
    ];

    const detectedHooks = suspiciousGlobals.filter(
      global => typeof (global as any)[global] !== 'undefined',
    );

    if (detectedHooks.length > 0) {
      return {
        type: 'hook',
        status: 'fail',
        description: 'Function hooks detected',
        evidence: `Detected: ${detectedHooks.join(', ')}`,
      };
    }

    return {
      type: 'hook',
      status: 'pass',
      description: 'No function hooks detected',
    };
  }

  private checkTampering(): IntegrityCheck {
    try {
      // Check for modified global objects
      const originalConsole = console;
      const originalSetTimeout = setTimeout;
      const originalFetch = fetch;

      if (
        console !== originalConsole ||
        setTimeout !== originalSetTimeout ||
        fetch !== originalFetch
      ) {
        return {
          type: 'tamper',
          status: 'warning',
          description: 'Global object modification detected',
        };
      }

      return {
        type: 'tamper',
        status: 'pass',
        description: 'No tampering detected',
      };
    } catch (error) {
      return {
        type: 'tamper',
        status: 'fail',
        description: 'Tamper detection failed',
        evidence: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async analyzeRiskFactors(
    integrityChecks: IntegrityCheck[],
  ): Promise<RiskFactor[]> {
    const riskFactors: RiskFactor[] = [];

    // Analyze failed integrity checks
    for (const check of integrityChecks) {
      if (check.status === 'fail') {
        riskFactors.push({
          type: 'device',
          severity: this.mapCheckToSeverity(check.type),
          description: `Integrity check failed: ${check.description}`,
          mitigation: this.getCheckMitigation(check.type),
        });
      }
    }

    // Analyze behavior patterns
    if (this.config.enableBehaviorAnalysis) {
      const behaviorRisks = this.analyzeBehaviorPatterns();
      riskFactors.push(...behaviorRisks);
    }

    // Check environment risks
    const environmentRisks = await this.analyzeEnvironmentRisks();
    riskFactors.push(...environmentRisks);

    return riskFactors;
  }

  private analyzeBehaviorPatterns(): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (this.suspiciousActivityCount > 5) {
      risks.push({
        type: 'behavior',
        severity: 'medium',
        description: `High suspicious activity count: ${this.suspiciousActivityCount}`,
        mitigation: 'Monitor user behavior patterns',
      });
    }

    return risks;
  }

  private async analyzeEnvironmentRisks(): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];

    try {
      const isEmulator = await DeviceInfo.isEmulator();
      if (isEmulator) {
        risks.push({
          type: 'environment',
          severity: 'medium',
          description: 'Running on emulator/simulator',
          mitigation: 'Consider restricting sensitive operations',
        });
      }

      if (__DEV__) {
        risks.push({
          type: 'environment',
          severity: 'low',
          description: 'Development environment detected',
          mitigation: 'Ensure production build for release',
        });
      }
    } catch (error) {
      risks.push({
        type: 'environment',
        severity: 'medium',
        description: 'Unable to analyze environment',
      });
    }

    return risks;
  }

  private calculateConfidenceLevel(
    integrityChecks: IntegrityCheck[],
    riskFactors: RiskFactor[],
  ): 'low' | 'medium' | 'high' {
    const failedChecks = integrityChecks.filter(
      c => c.status === 'fail',
    ).length;
    const criticalRisks = riskFactors.filter(
      r => r.severity === 'critical',
    ).length;
    const highRisks = riskFactors.filter(r => r.severity === 'high').length;

    if (failedChecks > 2 || criticalRisks > 0) {
      return 'low';
    }

    if (failedChecks > 0 || highRisks > 1) {
      return 'medium';
    }

    return 'high';
  }

  private determineValidity(
    integrityChecks: IntegrityCheck[],
    riskFactors: RiskFactor[],
  ): boolean {
    const criticalFailures = integrityChecks.filter(
      c => c.status === 'fail' && (c.type === 'root' || c.type === 'hook'),
    ).length;

    const criticalRisks = riskFactors.filter(
      r => r.severity === 'critical',
    ).length;

    return criticalFailures === 0 && criticalRisks === 0;
  }

  private mapCheckToSeverity(
    checkType: IntegrityCheck['type'],
  ): RiskFactor['severity'] {
    switch (checkType) {
      case 'root':
      case 'hook':
        return 'critical';
      case 'debug':
      case 'emulator':
        return 'medium';
      case 'tamper':
        return 'high';
      case 'signature':
        return 'high';
      default:
        return 'medium';
    }
  }

  private getCheckMitigation(checkType: IntegrityCheck['type']): string {
    switch (checkType) {
      case 'root':
        return 'Block access or limit functionality on rooted devices';
      case 'debug':
        return 'Ensure production build and disable debug features';
      case 'emulator':
        return 'Consider restricting emulator access for sensitive operations';
      case 'hook':
        return 'Implement anti-hooking measures and code obfuscation';
      case 'tamper':
        return 'Implement integrity protection and code signing';
      case 'signature':
        return 'Verify app signature and implement certificate pinning';
      default:
        return 'Implement appropriate security measures';
    }
  }

  private async getHardwareFingerprint(): Promise<string> {
    try {
      const components = await Promise.all([
        DeviceInfo.getDeviceId(),
        DeviceInfo.getModel(),
        DeviceInfo.getBrand(),
        DeviceInfo.getDeviceType(),
      ]);
      return components.join('|');
    } catch {
      return 'unknown';
    }
  }

  private async getOSFingerprint(): Promise<string> {
    try {
      const components = await Promise.all([
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBuildNumber(),
        Platform.OS,
        Platform.Version.toString(),
      ]);
      return components.join('|');
    } catch {
      return 'unknown';
    }
  }

  private async getAppFingerprint(): Promise<string> {
    try {
      const components = await Promise.all([
        DeviceInfo.getBundleId(),
        DeviceInfo.getVersion(),
        DeviceInfo.getBuildNumber(),
      ]);
      return components.join('|');
    } catch {
      return 'unknown';
    }
  }

  private initializeBehaviorMonitoring(): void {
    // Initialize behavior tracking
    this.behaviorMetrics.clear();
    this.suspiciousActivityCount = 0;

    loggingService.debug('Behavior monitoring initialized');
  }

  private isCacheValid(): boolean {
    return (
      this.cachedAttestation !== undefined &&
      Date.now() - this.lastAttestationTime < this.config.cacheDuration
    );
  }

  private cacheAttestation(attestation: AttestationResult): void {
    this.cachedAttestation = attestation;
    this.lastAttestationTime = Date.now();
  }

  private async logAttestationResult(
    attestation: AttestationResult,
  ): Promise<void> {
    const logLevel = attestation.isValid ? 'info' : 'warn';

    loggingService[logLevel]('Device attestation completed', {
      isValid: attestation.isValid,
      confidence: attestation.confidence,
      deviceFingerprint: attestation.deviceIdentity.fingerprint.substring(0, 8),
      integrityChecksPassed: attestation.integrityChecks.filter(
        c => c.status === 'pass',
      ).length,
      integrityChecksFailed: attestation.integrityChecks.filter(
        c => c.status === 'fail',
      ).length,
      riskFactorsCritical: attestation.riskFactors.filter(
        r => r.severity === 'critical',
      ).length,
      riskFactorsHigh: attestation.riskFactors.filter(
        r => r.severity === 'high',
      ).length,
      attestationTime: attestation.attestationTime,
    });

    // Store attestation result securely
    try {
      const attestationData = JSON.stringify({
        timestamp: Date.now(),
        isValid: attestation.isValid,
        confidence: attestation.confidence,
        fingerprint: attestation.deviceIdentity.fingerprint,
      });

      const encrypted =
        await advancedEncryptionService.encryptData(attestationData);

      await Keychain.setInternetCredentials(
        'device_attestation',
        'system',
        JSON.stringify(encrypted),
        {
          accessControl:
            Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        },
      );
    } catch (error) {
      loggingService.error('Failed to store attestation result', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleanup device attestation service
   */
  public cleanup(): void {
    this.invalidateCache();
    this.behaviorMetrics.clear();
    this.suspiciousActivityCount = 0;

    loggingService.info('Device Attestation Service cleaned up');
  }
}

// Create and export singleton instance
export const deviceAttestationService = new DeviceAttestationService();
export default deviceAttestationService;
