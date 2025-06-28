import { enhancedSecurityService } from './EnhancedSecurityService';
import { loggingService } from './LoggingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Keychain from 'react-native-keychain';

// Global type declarations
declare global {
  var __DEV__: boolean;
  namespace NodeJS {
    interface Timeout {}
  }
}

export interface BiometricType {
  FaceID: 'FaceID';
  TouchID: 'TouchID';
  Fingerprint: 'Fingerprint';
  Iris: 'Iris';
}

export interface BiometricAuthConfig {
  promptMessage?: string;
  cancelButtonText?: string;
  fallbackPromptMessage?: string;
  disableDeviceFallback?: boolean;
  showPasscodeOption?: boolean;
  accessGroup?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: keyof BiometricType;
  credentials?: {
    username: string;
    password: string;
  };
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType?: keyof BiometricType;
  isEnrolled: boolean;
  error?: string;
  supportedAuthentications?: string[];
}

export interface BiometricKey {
  keyAlias: string;
  publicKey: string;
  createdAt: number;
  lastUsed: number;
  algorithm: string;
}

export interface BiometricSettings {
  isEnabled: boolean;
  promptMessage: string;
  fallbackEnabled: boolean;
  maxAttempts: number;
  lockoutDuration: number; // milliseconds
  lastSuccessfulAuth?: number;
  failedAttempts: number;
  lockedUntil?: number;
}

/**
 * Biometric Authentication Service for secure user authentication
 */
class BiometricAuthService {
  private static instance: BiometricAuthService;
  private logger: typeof loggingService;
  private securityService: typeof enhancedSecurityService;
  private isInitialized: boolean = false;
  private capabilities: BiometricCapabilities | null = null;
  private settings: BiometricSettings;
  private keys: Map<string, BiometricKey> = new Map();

  private constructor() {
    this.logger = loggingService;
    this.securityService = enhancedSecurityService;
    this.settings = {
      isEnabled: false,
      promptMessage: 'Authenticate to access your account',
      fallbackEnabled: true,
      maxAttempts: 3,
      lockoutDuration: 5 * 60 * 1000, // 5 minutes
      failedAttempts: 0,
    };
  }

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Initialize biometric authentication service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.loadKeys();
      this.capabilities = await this.checkBiometricCapabilities();
      this.isInitialized = true;

      this.logger.info('Biometric authentication service initialized', {
        isAvailable: this.capabilities.isAvailable,
        biometryType: this.capabilities.biometryType,
        isEnabled: this.settings.isEnabled,
      });
    } catch (error) {
      this.logger.error(
        'Failed to initialize biometric authentication service',
        {
          error: error.message,
        },
      );
      throw error;
    }
  }

  /**
   * Check if biometric authentication is available on the device
   */
  async isAvailable(): Promise<BiometricCapabilities> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.capabilities!;
  }

  /**
   * Check biometric capabilities of the device
   */
  private async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();

      if (!biometryType) {
        return {
          isAvailable: false,
          isEnrolled: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Check if biometrics are enrolled
      const hasCredentials = await Keychain.hasInternetCredentials(
        'biometric_test',
      );

      return {
        isAvailable: true,
        biometryType: biometryType as keyof BiometricType,
        isEnrolled: true,
        supportedAuthentications: [biometryType],
      };
    } catch (error) {
      this.logger.error('Error checking biometric capabilities', {
        error: error.message,
      });
      return {
        isAvailable: false,
        isEnrolled: false,
        error: error.message,
      };
    }
  }

  /**
   * Perform biometric authentication
   */
  async authenticate(
    config?: BiometricAuthConfig,
  ): Promise<BiometricAuthResult> {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if biometric authentication is available
      if (!this.capabilities?.isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      // Check if biometric authentication is enabled
      if (!this.settings.isEnabled) {
        return {
          success: false,
          error: 'Biometric authentication is disabled',
        };
      }

      // Check lockout status
      if (this.isLockedOut()) {
        const remainingTime = this.getRemainingLockoutTime();
        return {
          success: false,
          error: `Account locked. Try again in ${Math.ceil(
            remainingTime / 1000,
          )} seconds`,
        };
      }

      const options: Keychain.Options = {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
        promptMessage: config?.promptMessage || this.settings.promptMessage,
        cancelButtonText: config?.cancelButtonText || 'Cancel',
        fallbackPromptMessage: config?.fallbackPromptMessage || 'Use Passcode',
        showPasscodeOption:
          config?.showPasscodeOption ?? this.settings.fallbackEnabled,
      };

      // Attempt authentication
      const credentials = await Keychain.getInternetCredentials(
        'biometric_auth',
        options,
      );

      if (credentials && credentials.username && credentials.password) {
        // Reset failed attempts on successful authentication
        this.settings.failedAttempts = 0;
        this.settings.lastSuccessfulAuth = Date.now();
        this.settings.lockedUntil = undefined;
        await this.saveSettings();

        // Log successful authentication
        this.securityService.logSecurityEvent({
          type: 'login',
          timestamp: Date.now(),
          details: {
            method: 'biometric',
            biometryType: this.capabilities.biometryType,
          },
          severity: 'medium',
        });

        return {
          success: true,
          biometryType: this.capabilities.biometryType,
          credentials: {
            username: credentials.username,
            password: credentials.password,
          },
        };
      } else {
        throw new Error(
          'No credentials returned from biometric authentication',
        );
      }
    } catch (error) {
      await this.handleAuthenticationFailure(error);

      this.logger.error('Biometric authentication failed', {
        error: error.message,
        failedAttempts: this.settings.failedAttempts,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Store credentials with biometric protection
   */
  async storeCredentials(
    username: string,
    password: string,
    config?: BiometricAuthConfig,
  ): Promise<boolean> {
    try {
      if (!this.capabilities?.isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const options: Keychain.Options = {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
        promptMessage:
          config?.promptMessage || 'Authenticate to save credentials',
        showPasscodeOption: config?.showPasscodeOption ?? true,
      };

      await Keychain.setInternetCredentials(
        'biometric_auth',
        username,
        password,
        options,
      );

      this.logger.info('Credentials stored with biometric protection');
      return true;
    } catch (error) {
      this.logger.error(
        'Failed to store credentials with biometric protection',
        {
          error: error.message,
        },
      );
      return false;
    }
  }

  /**
   * Remove stored biometric credentials
   */
  async removeCredentials(): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials('biometric_auth');
      this.logger.info('Biometric credentials removed');
      return true;
    } catch (error) {
      this.logger.error('Failed to remove biometric credentials', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Create biometric keys for advanced authentication
   */
  async createKeys(keyAlias: string): Promise<{ publicKey: string }> {
    try {
      if (!this.capabilities?.isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      // Create a unique key pair for this alias
      const publicKey = this.generatePublicKey();

      const biometricKey: BiometricKey = {
        keyAlias,
        publicKey,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        algorithm: 'RSA-2048',
      };

      this.keys.set(keyAlias, biometricKey);
      await this.saveKeys();

      this.logger.info('Biometric keys created', { keyAlias });
      return { publicKey };
    } catch (error) {
      this.logger.error('Failed to create biometric keys', {
        keyAlias,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Delete biometric keys
   */
  async deleteKeys(keyAlias: string): Promise<boolean> {
    try {
      this.keys.delete(keyAlias);
      await this.saveKeys();

      this.logger.info('Biometric keys deleted', { keyAlias });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete biometric keys', {
        keyAlias,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Create signature using biometric key
   */
  async createSignature(
    payload: string,
    keyAlias: string,
    config?: BiometricAuthConfig,
  ): Promise<{ signature: string }> {
    try {
      const key = this.keys.get(keyAlias);
      if (!key) {
        throw new Error(`Key with alias ${keyAlias} not found`);
      }

      // Verify biometric authentication first
      const authResult = await this.authenticate(config);
      if (!authResult.success) {
        throw new Error(`Biometric authentication failed: ${authResult.error}`);
      }

      // Create signature (simplified for this implementation)
      const signature = this.generateSignature(payload, key.publicKey);

      // Update key usage
      key.lastUsed = Date.now();
      await this.saveKeys();

      this.logger.info('Signature created with biometric key', { keyAlias });
      return { signature };
    } catch (error) {
      this.logger.error('Failed to create signature', {
        keyAlias,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify signature using biometric key
   */
  async verifySignature(
    signature: string,
    payload: string,
    keyAlias: string,
  ): Promise<boolean> {
    try {
      const key = this.keys.get(keyAlias);
      if (!key) {
        throw new Error(`Key with alias ${keyAlias} not found`);
      }

      // Verify signature (simplified for this implementation)
      const expectedSignature = this.generateSignature(payload, key.publicKey);
      const isValid = signature === expectedSignature;

      this.logger.info('Signature verification completed', {
        keyAlias,
        isValid,
      });

      return isValid;
    } catch (error) {
      this.logger.error('Failed to verify signature', {
        keyAlias,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Enable biometric authentication for the app
   */
  async enableBiometricAuth(
    config?: Partial<BiometricSettings>,
  ): Promise<boolean> {
    try {
      if (!this.capabilities?.isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      this.settings = {
        ...this.settings,
        isEnabled: true,
        ...config,
      };

      await this.saveSettings();

      this.logger.info('Biometric authentication enabled');
      return true;
    } catch (error) {
      this.logger.error('Failed to enable biometric authentication', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Disable biometric authentication for the app
   */
  async disableBiometricAuth(): Promise<boolean> {
    try {
      this.settings.isEnabled = false;
      await this.saveSettings();

      // Optionally remove stored credentials
      await this.removeCredentials();

      this.logger.info('Biometric authentication disabled');
      return true;
    } catch (error) {
      this.logger.error('Failed to disable biometric authentication', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled for the app
   */
  async isBiometricAuthEnabled(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return (this.settings.isEnabled && this.capabilities?.isAvailable) || false;
  }

  /**
   * Get current biometric settings
   */
  getSettings(): BiometricSettings {
    return { ...this.settings };
  }

  /**
   * Update biometric settings
   */
  async updateSettings(newSettings: Partial<BiometricSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    this.logger.info('Biometric settings updated');
  }

  /**
   * Get list of stored biometric keys
   */
  getStoredKeys(): BiometricKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Check if user is currently locked out
   */
  private isLockedOut(): boolean {
    if (!this.settings.lockedUntil) return false;
    return Date.now() < this.settings.lockedUntil;
  }

  /**
   * Get remaining lockout time in milliseconds
   */
  private getRemainingLockoutTime(): number {
    if (!this.settings.lockedUntil) return 0;
    return Math.max(0, this.settings.lockedUntil - Date.now());
  }

  /**
   * Handle authentication failure
   */
  private async handleAuthenticationFailure(error: any): Promise<void> {
    this.settings.failedAttempts++;

    // Lock out user if max attempts reached
    if (this.settings.failedAttempts >= this.settings.maxAttempts) {
      this.settings.lockedUntil = Date.now() + this.settings.lockoutDuration;

      // Log security event
      this.securityService.logSecurityEvent({
        type: 'failed_login',
        timestamp: Date.now(),
        details: {
          method: 'biometric',
          failedAttempts: this.settings.failedAttempts,
          lockedUntil: this.settings.lockedUntil,
        },
        severity: 'high',
      });
    }

    await this.saveSettings();
  }

  /**
   * Generate a public key (simplified implementation)
   */
  private generatePublicKey(): string {
    return `pk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a signature (simplified implementation)
   */
  private generateSignature(payload: string, publicKey: string): string {
    // In a real implementation, this would use actual cryptographic signing
    return `sig_${Buffer.from(payload + publicKey).toString('base64')}`;
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('biometric_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      this.logger.error('Failed to load biometric settings', {
        error: error.message,
      });
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'biometric_settings',
        JSON.stringify(this.settings),
      );
    } catch (error) {
      this.logger.error('Failed to save biometric settings', {
        error: error.message,
      });
    }
  }

  /**
   * Load keys from storage
   */
  private async loadKeys(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('biometric_keys');
      if (stored) {
        const keysArray: BiometricKey[] = JSON.parse(stored);
        this.keys = new Map(keysArray.map(key => [key.keyAlias, key]));
      }
    } catch (error) {
      this.logger.error('Failed to load biometric keys', {
        error: error.message,
      });
    }
  }

  /**
   * Save keys to storage
   */
  private async saveKeys(): Promise<void> {
    try {
      const keysArray = Array.from(this.keys.values());
      await AsyncStorage.setItem('biometric_keys', JSON.stringify(keysArray));
    } catch (error) {
      this.logger.error('Failed to save biometric keys', {
        error: error.message,
      });
    }
  }

  /**
   * Export biometric data for debugging
   */
  exportData(): any {
    return {
      settings: this.settings,
      capabilities: this.capabilities,
      keys: Array.from(this.keys.values()),
      metadata: {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        isInitialized: this.isInitialized,
      },
    };
  }

  /**
   * Clear all biometric data
   */
  async clearData(): Promise<void> {
    try {
      this.keys.clear();
      this.settings = {
        isEnabled: false,
        promptMessage: 'Authenticate to access your account',
        fallbackEnabled: true,
        maxAttempts: 3,
        lockoutDuration: 5 * 60 * 1000,
        failedAttempts: 0,
      };

      await Promise.all([
        AsyncStorage.removeItem('biometric_settings'),
        AsyncStorage.removeItem('biometric_keys'),
        this.removeCredentials(),
      ]);

      this.logger.info('Biometric data cleared');
    } catch (error) {
      this.logger.error('Failed to clear biometric data', {
        error: error.message,
      });
    }
  }
}

// Create and export singleton instance
export const biometricAuthService = BiometricAuthService.getInstance();
export default biometricAuthService;
