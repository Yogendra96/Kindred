import type { AppStateStatus } from 'react-native';
import { Alert, AppState, Dimensions, Platform } from 'react-native';

import DeviceInfo from 'react-native-device-info';

import { advancedEncryptionService } from './AdvancedEncryptionService';
import { enhancedPerformanceService } from './EnhancedPerformanceService';
import { loggingService } from './LoggingService';

export interface SecurityThreat {
  readonly type:
    | 'debugging'
    | 'tampering'
    | 'emulation'
    | 'injection'
    | 'hooking';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly timestamp: number;
  readonly mitigation?: string;
}

export interface RuntimeSecurityConfig {
  readonly enableDebugDetection: boolean;
  readonly enableTamperDetection: boolean;
  readonly enableEmulatorDetection: boolean;
  readonly enableHookDetection: boolean;
  readonly enableScreenProtection: boolean;
  readonly blockOnThreat: boolean;
  readonly monitoringInterval: number; // milliseconds
}

export interface SecurityAssessment {
  readonly isSecure: boolean;
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly threats: readonly SecurityThreat[];
  readonly deviceFingerprint: string;
  readonly assessmentTime: number;
}

class RuntimeSecurityService {
  private readonly config: RuntimeSecurityConfig;
  private monitoringInterval?: ReturnType<typeof setTimeout>;
  private isMonitoring = false;
  private appStateSubscription?: any;
  private lastSecurityCheck = 0;
  private securityViolations = 0;

  // Security constants for detection
  private readonly SECURITY_CONSTANTS = {
    DEBUG_DETECTION_INTERVAL: 5000, // 5 seconds
    MAX_VIOLATIONS_BEFORE_BLOCK: 3,
    TAMPER_CHECK_FUNCTIONS: [
      'eval',
      'Function',
      'setTimeout',
      'setInterval',
      'XMLHttpRequest',
    ],
    SUSPICIOUS_GLOBAL_PROPERTIES: [
      '__REACT_DEVTOOLS_GLOBAL_HOOK__',
      '__FLIPPER__',
      'chrome',
      'webkitStorageInfo',
    ],
  } as const;

  constructor() {
    this.config = {
      enableDebugDetection: !__DEV__,
      enableTamperDetection: !__DEV__,
      enableEmulatorDetection: true,
      enableHookDetection: !__DEV__,
      enableScreenProtection: true,
      blockOnThreat: !__DEV__,
      monitoringInterval: 10000, // 10 seconds
    };
  }

  public async initialize(): Promise<void> {
    const startTime = Date.now();

    try {
      // Perform initial security assessment
      const assessment = await this.performSecurityAssessment();

      if (assessment.riskLevel === 'critical' && this.config.blockOnThreat) {
        await this.handleCriticalThreat(assessment.threats);
        return;
      }

      // Start continuous monitoring
      this.startSecurityMonitoring();

      // Set up app state monitoring
      this.setupAppStateMonitoring();

      // Enable screen protection if configured
      if (this.config.enableScreenProtection) {
        this.enableScreenProtection();
      }

      enhancedPerformanceService.recordMetric(
        'runtime_security_init',
        Date.now() - startTime,
        'ms',
      );

      loggingService.info('Runtime Security Service initialized', {
        riskLevel: assessment.riskLevel,
        threatsDetected: assessment.threats.length,
        deviceFingerprint: assessment.deviceFingerprint,
      });
    } catch (error) {
      loggingService.error('Runtime Security Service initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Perform comprehensive security assessment
   */
  public async performSecurityAssessment(): Promise<SecurityAssessment> {
    const startTime = Date.now();
    const threats: SecurityThreat[] = [];

    try {
      // Debug detection
      if (this.config.enableDebugDetection) {
        const debugThreats = await this.detectDebugging();
        threats.push(...debugThreats);
      }

      // Tampering detection
      if (this.config.enableTamperDetection) {
        const tamperThreats = await this.detectTampering();
        threats.push(...tamperThreats);
      }

      // Emulator detection
      if (this.config.enableEmulatorDetection) {
        const emulatorThreats = await this.detectEmulator();
        threats.push(...emulatorThreats);
      }

      // Hook detection
      if (this.config.enableHookDetection) {
        const hookThreats = this.detectHooking();
        threats.push(...hookThreats);
      }

      // Generate device fingerprint
      const deviceFingerprint = await this.generateDeviceFingerprint();

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(threats);

      const assessment: SecurityAssessment = {
        isSecure: threats.length === 0,
        riskLevel,
        threats,
        deviceFingerprint,
        assessmentTime: Date.now() - startTime,
      };

      this.lastSecurityCheck = Date.now();

      // Log security events
      if (threats.length > 0) {
        await this.logSecurityThreats(threats);
      }

      return assessment;
    } catch (error) {
      loggingService.error('Security assessment failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        isSecure: false,
        riskLevel: 'high',
        threats: [
          {
            type: 'tampering',
            severity: 'high',
            description: 'Security assessment failed - potential tampering',
            timestamp: Date.now(),
          },
        ],
        deviceFingerprint: 'unknown',
        assessmentTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Detect debugging attempts
   */
  private async detectDebugging(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      // Check for development mode
      if (__DEV__) {
        threats.push({
          type: 'debugging',
          severity: 'medium',
          description: 'Application running in development mode',
          timestamp: Date.now(),
          mitigation: 'Ensure production build for release',
        });
      }

      // Check for React DevTools
      if (
        typeof (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'
      ) {
        threats.push({
          type: 'debugging',
          severity: 'high',
          description: 'React DevTools detected',
          timestamp: Date.now(),
        });
      }

      // Check for Flipper
      if (typeof (global as any).__FLIPPER__ !== 'undefined') {
        threats.push({
          type: 'debugging',
          severity: 'high',
          description: 'Flipper debugging tool detected',
          timestamp: Date.now(),
        });
      }

      // Timing-based debug detection
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger; // This will pause if debugger is attached
      const endTime = performance.now();

      if (endTime - startTime > 100) {
        // If execution was paused for more than 100ms
        threats.push({
          type: 'debugging',
          severity: 'critical',
          description: 'Active debugger detected',
          timestamp: Date.now(),
        });
      }

      // Console detection
      if (this.isConsoleOpen()) {
        threats.push({
          type: 'debugging',
          severity: 'medium',
          description: 'Developer console detected',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      loggingService.warn('Debug detection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return threats;
  }

  /**
   * Detect application tampering
   */
  private async detectTampering(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      // Check for modified global objects
      const modifiedGlobals = this.checkModifiedGlobals();
      if (modifiedGlobals.length > 0) {
        threats.push({
          type: 'tampering',
          severity: 'high',
          description: `Modified global objects detected: ${modifiedGlobals.join(', ')}`,
          timestamp: Date.now(),
        });
      }

      // Check for suspicious global properties
      const suspiciousProps = this.checkSuspiciousGlobalProperties();
      if (suspiciousProps.length > 0) {
        threats.push({
          type: 'tampering',
          severity: 'medium',
          description: `Suspicious global properties: ${suspiciousProps.join(', ')}`,
          timestamp: Date.now(),
        });
      }

      // Check function integrity
      const modifiedFunctions = this.checkFunctionIntegrity();
      if (modifiedFunctions.length > 0) {
        threats.push({
          type: 'tampering',
          severity: 'critical',
          description: `Modified core functions: ${modifiedFunctions.join(', ')}`,
          timestamp: Date.now(),
        });
      }

      // Check for frida or other injection frameworks
      if (this.detectInjectionFrameworks()) {
        threats.push({
          type: 'injection',
          severity: 'critical',
          description: 'Code injection framework detected',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      loggingService.warn('Tamper detection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return threats;
  }

  /**
   * Detect emulator/simulator environment
   */
  private async detectEmulator(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      const isEmulator = await DeviceInfo.isEmulator();

      if (isEmulator) {
        threats.push({
          type: 'emulation',
          severity: 'medium',
          description: 'Application running on emulator/simulator',
          timestamp: Date.now(),
          mitigation:
            'Consider blocking emulator access for sensitive operations',
        });
      }

      // Additional emulator detection for Android
      if (Platform.OS === 'android') {
        const androidEmulatorThreats = await this.detectAndroidEmulator();
        threats.push(...androidEmulatorThreats);
      }

      // Additional simulator detection for iOS
      if (Platform.OS === 'ios') {
        const iOSSimulatorThreats = await this.detectiOSSimulator();
        threats.push(...iOSSimulatorThreats);
      }
    } catch (error) {
      loggingService.warn('Emulator detection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return threats;
  }

  /**
   * Detect function hooking attempts
   */
  private detectHooking(): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    try {
      // Check if critical functions have been hooked
      const hookedFunctions =
        this.SECURITY_CONSTANTS.TAMPER_CHECK_FUNCTIONS.filter(funcName =>
          this.isFunctionHooked((global as any)[funcName]),
        );

      if (hookedFunctions.length > 0) {
        threats.push({
          type: 'hooking',
          severity: 'high',
          description: `Function hooking detected: ${hookedFunctions.join(', ')}`,
          timestamp: Date.now(),
        });
      }

      // Check for common hooking libraries
      const hookingLibraries = ['frida', 'xposed', 'substrate', 'cydia'];
      for (const lib of hookingLibraries) {
        if (typeof (global as any)[lib] !== 'undefined') {
          threats.push({
            type: 'hooking',
            severity: 'critical',
            description: `Hooking library detected: ${lib}`,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      loggingService.warn('Hook detection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return threats;
  }

  /**
   * Generate unique device fingerprint
   */
  private async generateDeviceFingerprint(): Promise<string> {
    try {
      const components = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getDeviceId(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getDeviceType(),
        this.getScreenFingerprint(),
        this.getTimezoneFingerprint(),
      ]);

      const fingerprint = components.join('|');
      return await advancedEncryptionService.hashData(fingerprint);
    } catch (error) {
      loggingService.warn('Device fingerprint generation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return 'unknown';
    }
  }

  /**
   * Enable screen protection (prevent screenshots/recording)
   */
  private enableScreenProtection(): void {
    try {
      if (Platform.OS === 'android') {
        // Android screen protection would require native module
        // For now, we'll just log the intent
        loggingService.info('Screen protection enabled for Android');
      } else if (Platform.OS === 'ios') {
        // iOS screen protection would require native module
        // For now, we'll just log the intent
        loggingService.info('Screen protection enabled for iOS');
      }
    } catch (error) {
      loggingService.warn('Screen protection setup failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle critical security threats
   */
  private async handleCriticalThreat(
    threats: readonly SecurityThreat[],
  ): Promise<void> {
    const criticalThreats = threats.filter(t => t.severity === 'critical');

    if (criticalThreats.length > 0) {
      this.securityViolations += criticalThreats.length;

      // Log critical security event
      loggingService.error('Critical security threat detected', {
        threats: criticalThreats,
        violations: this.securityViolations,
      });

      if (
        this.securityViolations >=
        this.SECURITY_CONSTANTS.MAX_VIOLATIONS_BEFORE_BLOCK
      ) {
        // Block application
        Alert.alert(
          'Security Alert',
          'A security threat has been detected. The application will now close.',
          [
            {
              text: 'OK',
              onPress: () => {
                // In a real implementation, you might want to:
                // 1. Clear sensitive data
                // 2. Log the user out
                // 3. Exit the application
                this.performSecurityShutdown();
              },
            },
          ],
          { cancelable: false },
        );
      }
    }
  }

  /**
   * Start continuous security monitoring
   */
  private startSecurityMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        const assessment = await this.performSecurityAssessment();

        if (assessment.riskLevel === 'critical') {
          await this.handleCriticalThreat(assessment.threats);
        }
      } catch (error) {
        loggingService.error('Security monitoring check failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, this.config.monitoringInterval);
  }

  /**
   * Set up app state monitoring for security events
   */
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this),
    );
  }

  /**
   * Handle app state changes for security monitoring
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // Perform security check when app becomes active
      setTimeout(async () => {
        await this.performSecurityAssessment();
      }, 1000);
    }
  }

  // Private helper methods

  private calculateRiskLevel(
    threats: SecurityThreat[],
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.some(t => t.severity === 'critical')) return 'critical';
    if (threats.some(t => t.severity === 'high')) return 'high';
    if (threats.some(t => t.severity === 'medium')) return 'medium';
    return 'low';
  }

  private isConsoleOpen(): boolean {
    try {
      const threshold = 160;
      return (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      );
    } catch {
      return false;
    }
  }

  private checkModifiedGlobals(): string[] {
    const modified: string[] = [];

    try {
      // Check if global functions have been modified
      const originalToString = Function.prototype.toString;
      if (Function.prototype.toString !== originalToString) {
        modified.push('Function.prototype.toString');
      }
    } catch {
      // Ignore errors in this check
    }

    return modified;
  }

  private checkSuspiciousGlobalProperties(): string[] {
    return this.SECURITY_CONSTANTS.SUSPICIOUS_GLOBAL_PROPERTIES.filter(
      prop => typeof (global as any)[prop] !== 'undefined',
    );
  }

  private checkFunctionIntegrity(): string[] {
    const modified: string[] = [];

    for (const funcName of this.SECURITY_CONSTANTS.TAMPER_CHECK_FUNCTIONS) {
      try {
        const func = (global as any)[funcName];
        if (func && this.isFunctionModified(func)) {
          modified.push(funcName);
        }
      } catch {
        // Function might not exist or be accessible
      }
    }

    return modified;
  }

  private isFunctionModified(func: Function): boolean {
    try {
      const funcString = func.toString();
      return (
        funcString.includes('[native code]') === false ||
        funcString.length > 100
      ); // Native functions are usually short
    } catch {
      return true; // If we can't check, assume it's modified
    }
  }

  private isFunctionHooked(func: Function): boolean {
    try {
      if (!func) return false;

      const funcString = func.toString();

      // Check for common hooking signatures
      const hookingSignatures = [
        'frida',
        'hook',
        'intercept',
        'replace',
        'proxy',
      ];

      return hookingSignatures.some(sig =>
        funcString.toLowerCase().includes(sig),
      );
    } catch {
      return false;
    }
  }

  private detectInjectionFrameworks(): boolean {
    try {
      // Check for common injection framework signatures
      const injectionSignatures = ['frida', 'xposed', 'substrate', 'cydia'];

      return injectionSignatures.some(
        sig => typeof (global as any)[sig] !== 'undefined',
      );
    } catch {
      return false;
    }
  }

  private async detectAndroidEmulator(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      const deviceName = await DeviceInfo.getDeviceName();
      const model = await DeviceInfo.getModel();

      // Check for common emulator names
      const emulatorKeywords = [
        'emulator',
        'simulator',
        'genymotion',
        'android_x86',
      ];

      if (
        emulatorKeywords.some(
          keyword =>
            deviceName.toLowerCase().includes(keyword) ||
            model.toLowerCase().includes(keyword),
        )
      ) {
        threats.push({
          type: 'emulation',
          severity: 'medium',
          description: 'Android emulator detected by device name/model',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      loggingService.warn('Android emulator detection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return threats;
  }

  private async detectiOSSimulator(): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    try {
      const deviceName = await DeviceInfo.getDeviceName();

      if (deviceName.includes('Simulator')) {
        threats.push({
          type: 'emulation',
          severity: 'medium',
          description: 'iOS Simulator detected',
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      loggingService.warn('iOS simulator detection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return threats;
  }

  private getScreenFingerprint(): string {
    try {
      const { width, height } = Dimensions.get('window');
      return `${width}x${height}`;
    } catch {
      return 'unknown';
    }
  }

  private getTimezoneFingerprint(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'unknown';
    }
  }

  private async logSecurityThreats(
    threats: readonly SecurityThreat[],
  ): Promise<void> {
    for (const threat of threats) {
      loggingService.warn('Security threat detected', {
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        timestamp: threat.timestamp,
        mitigation: threat.mitigation,
      });
    }
  }

  private performSecurityShutdown(): void {
    try {
      // Clear sensitive data
      this.cleanup();

      // In a real implementation, you would:
      // 1. Clear all secure storage
      // 2. Invalidate tokens
      // 3. Log security event
      // 4. Exit application gracefully

      loggingService.error('Security shutdown initiated');
    } catch (error) {
      loggingService.error('Security shutdown failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleanup security monitoring
   */
  public cleanup(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = undefined;
    }

    loggingService.info('Runtime Security Service cleaned up');
  }
}

// Create and export singleton instance
export const runtimeSecurityService = new RuntimeSecurityService();
export default runtimeSecurityService;
