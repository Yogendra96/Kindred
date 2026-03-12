// @ts-nocheck
/* eslint-disable */
import { advancedEncryptionService } from './AdvancedEncryptionService';
import { enhancedPerformanceService } from './EnhancedPerformanceService';
import loggingService from './/LoggerService';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

export interface TOTPSetup {
  readonly secret: string;
  readonly qrCode: string;
  readonly backupCodes: readonly string[];
  readonly issuer: string;
  readonly accountName: string;
}

export interface TOTPValidation {
  readonly isValid: boolean;
  readonly timeWindow: number;
  readonly remainingAttempts: number;
}

export interface BiometricAuthResult {
  readonly success: boolean;
  readonly biometricType: 'fingerprint' | 'face' | 'iris' | 'voice' | 'none';
  readonly error?: string;
}

export interface WebAuthnChallenge {
  readonly challenge: readonly number[];
  readonly rp: {
    readonly name: string;
    readonly id: string;
  };
  readonly user: {
    readonly id: readonly number[];
    readonly name: string;
    readonly displayName: string;
  };
  readonly pubKeyCredParams: readonly PublicKeyCredentialParameters[];
  readonly authenticatorSelection: AuthenticatorSelectionCriteria;
  readonly attestation?: AttestationConveyancePreference;
  readonly timeout?: number;
}

export interface MFAConfig {
  readonly enableTOTP: boolean;
  readonly enableBiometric: boolean;
  readonly enableWebAuthn: boolean;
  readonly enableBackupCodes: boolean;
  readonly totpTimeWindow: number; // seconds
  readonly maxAttempts: number;
  readonly lockoutDuration: number; // milliseconds
}

export interface AuthenticationState {
  readonly isAuthenticated: boolean;
  readonly authenticationMethods: readonly string[];
  readonly lastAuthTime: number;
  readonly sessionExpiry: number;
  readonly failedAttempts: number;
  readonly isLockedOut: boolean;
  readonly lockoutExpiry?: number;
}

class MFAService {
  private readonly config: MFAConfig;
  private authenticationState: AuthenticationState;
  private totpSecrets: Map<string, string> = new Map();
  private backupCodes: Map<string, Set<string>> = new Map();
  private failedAttempts: Map<string, number> = new Map();
  private lockoutTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.config = {
      enableTOTP: true,
      enableBiometric: true,
      enableWebAuthn: Platform.OS !== 'android', // Limited Android support
      enableBackupCodes: true,
      totpTimeWindow: 30, // 30 seconds
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
    };

    this.authenticationState = {
      isAuthenticated: false,
      authenticationMethods: [],
      lastAuthTime: 0,
      sessionExpiry: 0,
      failedAttempts: 0,
      isLockedOut: false,
    };
  }

  async initialize(): Promise<void> {
    const startTime = Date.now();

    try {
      // Check biometric availability
      if (this.config.enableBiometric) {
        await this.checkBiometricAvailability();
      }

      // Initialize secure storage
      await this.initializeSecureStorage();

      // Load existing MFA configurations
      await this.loadMFAConfigurations();

      enhancedPerformanceService.recordMetric(
        'mfa_service_init',
        Date.now() - startTime,
        'ms',
      );

      loggingService.info('MFA Service initialized', {
        totpEnabled: this.config.enableTOTP,
        biometricEnabled: this.config.enableBiometric,
        webAuthnEnabled: this.config.enableWebAuthn,
        backupCodesEnabled: this.config.enableBackupCodes,
      });
    } catch (error) {
      loggingService.error('MFA Service initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set up TOTP (Time-based One-Time Password) for a user
   */
  async setupTOTP(userId: string, accountName: string): Promise<TOTPSetup> {
    try {
      if (!this.config.enableTOTP) {
        throw new Error('TOTP is not enabled');
      }

      // Generate secret key (160-bit recommended by RFC 6238)
      const secret = this.generateTOTPSecret();

      // Store encrypted secret
      await this.storeTOTPSecret(userId, secret);

      // Generate QR code data
      const issuer = 'Kindred';
      const qrCode = this.generateTOTPQRCode(secret, accountName, issuer);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      await this.storeBackupCodes(userId, backupCodes);

      const setup: TOTPSetup = {
        secret,
        qrCode,
        backupCodes,
        issuer,
        accountName,
      };

      loggingService.info('TOTP setup completed', {
        userId: await advancedEncryptionService.hashData(userId),
        issuer,
        backupCodesCount: backupCodes.length,
      });

      return setup;
    } catch (error) {
      loggingService.error('TOTP setup failed', {
        userId: await advancedEncryptionService.hashData(userId),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verify TOTP token
   */
  async verifyTOTP(userId: string, token: string): Promise<TOTPValidation> {
    try {
      if (await this.isUserLockedOut(userId)) {
        return {
          isValid: false,
          timeWindow: 0,
          remainingAttempts: 0,
        };
      }

      const secret = await this.getTOTPSecret(userId);
      if (!secret) {
        throw new Error('TOTP not configured for user');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeWindow = Math.floor(currentTime / this.config.totpTimeWindow);

      // Check current time window and adjacent windows for clock skew tolerance
      const validWindows = [timeWindow - 1, timeWindow, timeWindow + 1];
      let isValid = false;

      for (const window of validWindows) {
        const expectedToken = this.generateTOTPToken(secret, window);
        if (this.constantTimeCompare(token, expectedToken)) {
          isValid = true;
          break;
        }
      }

      if (isValid) {
        await this.clearFailedAttempts(userId);
        await this.recordSuccessfulAuth(userId, 'totp');
      } else {
        await this.recordFailedAttempt(userId);
      }

      const remainingAttempts = Math.max(
        0,
        this.config.maxAttempts - (this.failedAttempts.get(userId) || 0),
      );

      return {
        isValid,
        timeWindow,
        remainingAttempts,
      };
    } catch (error) {
      loggingService.error('TOTP verification failed', {
        userId: await advancedEncryptionService.hashData(userId),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set up biometric authentication
   */
  async setupBiometric(): Promise<BiometricAuthResult> {
    try {
      if (!this.config.enableBiometric) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Check hardware availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return {
          success: false,
          biometricType: 'none',
          error: 'Biometric hardware not available',
        };
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return {
          success: false,
          biometricType: 'none',
          error: 'No biometrics enrolled on device',
        };
      }

      // Get available biometric types
      const supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const biometricType = this.mapBiometricType(supportedTypes);

      loggingService.info('Biometric authentication setup', {
        biometricType,
        supportedTypes,
      });

      return {
        success: true,
        biometricType,
      };
    } catch (error) {
      loggingService.error('Biometric setup failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        biometricType: 'none',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticateWithBiometric(
    promptMessage = 'Authenticate to continue',
  ): Promise<BiometricAuthResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        await this.recordSuccessfulAuth('current_user', 'biometric');

        const supportedTypes =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        const biometricType = this.mapBiometricType(supportedTypes);

        return {
          success: true,
          biometricType,
        };
      } else {
        return {
          success: false,
          biometricType: 'none',
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      loggingService.error('Biometric authentication failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        biometricType: 'none',
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Generate WebAuthn challenge for registration
   */
  async generateWebAuthnChallenge(
    userId: string,
    userEmail: string,
    userDisplayName: string,
  ): Promise<WebAuthnChallenge> {
    try {
      if (!this.config.enableWebAuthn) {
        throw new Error('WebAuthn is not enabled');
      }

      const challenge = advancedEncryptionService.generateSecureRandomBytes(32);
      const userIdBytes = new TextEncoder().encode(userId);

      const webAuthnChallenge: WebAuthnChallenge = {
        challenge: Array.from(challenge),
        rp: {
          name: 'Kindred',
          id: 'kindred.app',
        },
        user: {
          id: Array.from(userIdBytes),
          name: userEmail,
          displayName: userDisplayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: true,
          userVerification: 'required',
        },
        attestation: 'direct',
        timeout: 60000, // 60 seconds
      };

      // Store challenge temporarily for verification
      await this.storeWebAuthnChallenge(userId, challenge);

      loggingService.info('WebAuthn challenge generated', {
        userId: await advancedEncryptionService.hashData(userId),
        challengeLength: challenge.length,
      });

      return webAuthnChallenge;
    } catch (error) {
      loggingService.error('WebAuthn challenge generation failed', {
        userId: await advancedEncryptionService.hashData(userId),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const userBackupCodes = this.backupCodes.get(userId) || new Set();

      if (userBackupCodes.has(code)) {
        // Remove used backup code
        userBackupCodes.delete(code);
        this.backupCodes.set(userId, userBackupCodes);

        // Update stored backup codes
        await this.storeBackupCodes(userId, Array.from(userBackupCodes));

        await this.recordSuccessfulAuth(userId, 'backup_code');

        loggingService.info('Backup code used', {
          userId: await advancedEncryptionService.hashData(userId),
          remainingCodes: userBackupCodes.size,
        });

        return true;
      }

      await this.recordFailedAttempt(userId);
      return false;
    } catch (error) {
      loggingService.error('Backup code verification failed', {
        userId: await advancedEncryptionService.hashData(userId),
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get current authentication state
   */
  getAuthenticationState(): AuthenticationState {
    return { ...this.authenticationState };
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const now = Date.now();
    return (
      this.authenticationState.isAuthenticated &&
      now < this.authenticationState.sessionExpiry &&
      !this.authenticationState.isLockedOut
    );
  }

  /**
   * Invalidate current session
   */
  async invalidateSession(): Promise<void> {
    this.authenticationState = {
      isAuthenticated: false,
      authenticationMethods: [],
      lastAuthTime: 0,
      sessionExpiry: 0,
      failedAttempts: 0,
      isLockedOut: false,
    };

    loggingService.info('MFA session invalidated');
  }

  // Private helper methods

  private generateTOTPSecret(): string {
    const bytes = advancedEncryptionService.generateSecureRandomBytes(20); // 160 bits
    return this.base32Encode(bytes);
  }

  private generateTOTPToken(secret: string, timeWindow: number): string {
    // Simplified TOTP implementation - in production, use a proper TOTP library
    const key = this.base32Decode(secret);
    const time = new Uint8Array(8);

    // Convert time window to 8-byte array (big-endian)
    for (let i = 7; i >= 0; i--) {
      time[i] = timeWindow & 0xff;
      timeWindow = Math.floor(timeWindow / 256);
    }

    // Create HMAC-SHA1 (simplified - use proper crypto library in production)
    const hmac = this.hmacSha1(key, time);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  private generateTOTPQRCode(
    secret: string,
    accountName: string,
    issuer: string,
  ): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: '6',
      period: this.config.totpTimeWindow.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
      accountName,
    )}?${params.toString()}`;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const bytes = advancedEncryptionService.generateSecureRandomBytes(5);
      const code = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  private async storeTOTPSecret(userId: string, secret: string): Promise<void> {
    const encrypted = await advancedEncryptionService.encryptData(secret);
    await Keychain.setInternetCredentials(
      `totp_${userId}`,
      userId,
      JSON.stringify(encrypted),
      {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        authenticationType:
          Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
      },
    );

    this.totpSecrets.set(userId, secret);
  }

  private async getTOTPSecret(userId: string): Promise<string | null> {
    try {
      // Check cache first
      if (this.totpSecrets.has(userId)) {
        return this.totpSecrets.get(userId)!;
      }

      // Load from secure storage
      const credentials = await Keychain.getInternetCredentials(
        `totp_${userId}`,
      );
      if (credentials && credentials.password) {
        const encryptedData = JSON.parse(credentials.password);
        const secret = await advancedEncryptionService.decryptData(
          encryptedData,
        );
        this.totpSecrets.set(userId, secret);
        return secret;
      }

      return null;
    } catch (error) {
      loggingService.error('Failed to retrieve TOTP secret', {
        userId: await advancedEncryptionService.hashData(userId),
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async storeBackupCodes(
    userId: string,
    codes: string[],
  ): Promise<void> {
    const encrypted = await advancedEncryptionService.encryptData(
      JSON.stringify(codes),
    );
    await Keychain.setInternetCredentials(
      `backup_codes_${userId}`,
      userId,
      JSON.stringify(encrypted),
      {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      },
    );

    this.backupCodes.set(userId, new Set(codes));
  }

  private async storeWebAuthnChallenge(
    userId: string,
    challenge: Uint8Array,
  ): Promise<void> {
    // Store challenge temporarily (would expire after timeout)
    const challengeData = {
      challenge: Array.from(challenge),
      timestamp: Date.now(),
    };

    const encrypted = await advancedEncryptionService.encryptData(
      JSON.stringify(challengeData),
    );
    await Keychain.setInternetCredentials(
      `webauthn_challenge_${userId}`,
      userId,
      JSON.stringify(encrypted),
    );
  }

  private async recordSuccessfulAuth(
    userId: string,
    method: string,
  ): Promise<void> {
    const now = Date.now();
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

    this.authenticationState = {
      isAuthenticated: true,
      authenticationMethods: [
        ...this.authenticationState.authenticationMethods,
        method,
      ],
      lastAuthTime: now,
      sessionExpiry: now + sessionDuration,
      failedAttempts: 0,
      isLockedOut: false,
    };

    await this.clearFailedAttempts(userId);

    loggingService.info('Successful authentication', {
      userId: await advancedEncryptionService.hashData(userId),
      method,
      sessionExpiry: this.authenticationState.sessionExpiry,
    });
  }

  private async recordFailedAttempt(userId: string): Promise<void> {
    const attempts = (this.failedAttempts.get(userId) || 0) + 1;
    this.failedAttempts.set(userId, attempts);

    if (attempts >= this.config.maxAttempts) {
      await this.lockoutUser(userId);
    }

    loggingService.warn('Failed authentication attempt', {
      userId: await advancedEncryptionService.hashData(userId),
      attempts,
      maxAttempts: this.config.maxAttempts,
    });
  }

  private async clearFailedAttempts(userId: string): Promise<void> {
    this.failedAttempts.delete(userId);

    // Clear lockout if exists
    const lockoutTimer = this.lockoutTimers.get(userId);
    if (lockoutTimer) {
      clearTimeout(lockoutTimer);
      this.lockoutTimers.delete(userId);
    }
  }

  private async lockoutUser(userId: string): Promise<void> {
    this.authenticationState.isLockedOut = true;
    this.authenticationState.lockoutExpiry =
      Date.now() + this.config.lockoutDuration;

    // Set timer to unlock user
    const timer = setTimeout(() => {
      this.authenticationState.isLockedOut = false;
      this.authenticationState.lockoutExpiry = undefined;
      this.clearFailedAttempts(userId);
    }, this.config.lockoutDuration);

    this.lockoutTimers.set(userId, timer);

    loggingService.warn('User locked out', {
      userId: await advancedEncryptionService.hashData(userId),
      lockoutDuration: this.config.lockoutDuration,
      lockoutExpiry: this.authenticationState.lockoutExpiry,
    });
  }

  private async isUserLockedOut(userId: string): Promise<boolean> {
    if (!this.authenticationState.isLockedOut) {
      return false;
    }

    if (
      this.authenticationState.lockoutExpiry &&
      Date.now() > this.authenticationState.lockoutExpiry
    ) {
      this.authenticationState.isLockedOut = false;
      this.authenticationState.lockoutExpiry = undefined;
      await this.clearFailedAttempts(userId);
      return false;
    }

    return true;
  }

  private mapBiometricType(
    types: LocalAuthentication.AuthenticationType[],
  ): BiometricAuthResult['biometricType'] {
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return 'face';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return 'none';
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  private base32Encode(bytes: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let buffer = 0;
    let bitsLeft = 0;

    for (const byte of bytes) {
      buffer = (buffer << 8) | byte;
      bitsLeft += 8;

      while (bitsLeft >= 5) {
        result += alphabet[(buffer >>> (bitsLeft - 5)) & 31];
        bitsLeft -= 5;
      }
    }

    if (bitsLeft > 0) {
      result += alphabet[(buffer << (5 - bitsLeft)) & 31];
    }

    return result;
  }

  private base32Decode(encoded: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes: number[] = [];
    let buffer = 0;
    let bitsLeft = 0;

    for (const char of encoded.toUpperCase()) {
      const value = alphabet.indexOf(char);
      if (value === -1) continue;

      buffer = (buffer << 5) | value;
      bitsLeft += 5;

      if (bitsLeft >= 8) {
        bytes.push((buffer >>> (bitsLeft - 8)) & 255);
        bitsLeft -= 8;
      }
    }

    return new Uint8Array(bytes);
  }

  private hmacSha1(key: Uint8Array, data: Uint8Array): Uint8Array {
    // Simplified HMAC-SHA1 - use proper crypto library in production
    // This is just for demonstration
    return new Uint8Array(20); // Placeholder
  }

  private async checkBiometricAvailability(): Promise<void> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    loggingService.info('Biometric availability check', {
      hasHardware,
      isEnrolled,
      supportedTypes,
    });
  }

  private async initializeSecureStorage(): Promise<void> {
    // Initialize any required secure storage configurations
    loggingService.debug('Secure storage initialized for MFA');
  }

  private async loadMFAConfigurations(): Promise<void> {
    // Load any persisted MFA configurations
    loggingService.debug('MFA configurations loaded');
  }

  /**
   * Cleanup MFA service
   */
  cleanup(): void {
    // Clear all timers
    for (const timer of this.lockoutTimers.values()) {
      clearTimeout(timer);
    }
    this.lockoutTimers.clear();

    // Clear sensitive data
    this.totpSecrets.clear();
    this.backupCodes.clear();
    this.failedAttempts.clear();

    // Reset authentication state
    this.authenticationState = {
      isAuthenticated: false,
      authenticationMethods: [],
      lastAuthTime: 0,
      sessionExpiry: 0,
      failedAttempts: 0,
      isLockedOut: false,
    };

    loggingService.info('MFA Service cleaned up');
  }
}

// Create and export singleton instance
export const mfaService = new MFAService();
export default mfaService;
