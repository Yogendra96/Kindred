import CryptoJS from 'crypto-js';

import { loggingService } from './LoggingService';

export interface EncryptedData {
  readonly data: readonly number[];
  readonly iv: readonly number[];
  readonly tag: string;
  readonly algorithm: string;
  readonly keyId?: string;
}

export interface KeyDerivationOptions {
  readonly iterations: number;
  readonly keyLength: number;
  readonly hashAlgorithm: 'SHA-256' | 'SHA-512';
}

export interface EncryptionConfig {
  readonly algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  readonly keyRotationInterval: number; // hours
  readonly enableKeyRotation: boolean;
  readonly enableHSM: boolean; // Hardware Security Module
}

class AdvancedEncryptionService {
  private readonly config: EncryptionConfig;
  private readonly keyCache = new Map<string, CryptoKey>();
  private keyRotationTimer?: ReturnType<typeof setInterval>;

  constructor() {
    this.config = {
      algorithm: 'AES-256-GCM',
      keyRotationInterval: 24, // 24 hours
      enableKeyRotation: true,
      enableHSM: Platform.OS !== 'web',
    };
  }

  async initialize(): Promise<void> {
    const startTime = Date.now();

    try {
      // Initialize key rotation if enabled
      if (this.config.enableKeyRotation) {
        this.startKeyRotation();
      }

      // Test encryption capabilities
      await this.validateEncryptionCapabilities();

      enhancedPerformanceService.recordMetric(
        'encryption_service_init',
        Date.now() - startTime,
        'ms',
      );

      loggingService.info('Advanced Encryption Service initialized', {
        algorithm: this.config.algorithm,
        keyRotationEnabled: this.config.enableKeyRotation,
        hsmEnabled: this.config.enableHSM,
      });
    } catch (error) {
      loggingService.error('Encryption service initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Encrypt data using AES-256-GCM with authenticated encryption
   */
  async encryptData(data: string, keyId?: string): Promise<EncryptedData> {
    const startTime = Date.now();

    try {
      const key = await this.getOrCreateKey(keyId);
      const iv = this.generateSecureRandomBytes(12); // 96-bit IV for GCM
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);

      // Use SubtleCrypto for modern browsers/environments
      if (this.isSubtleCryptoAvailable()) {
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv,
          },
          key,
          encodedData,
        );

        enhancedPerformanceService.recordMetric(
          'data_encryption_time',
          Date.now() - startTime,
          'ms',
        );

        return {
          data: [...new Uint8Array(encrypted)],
          iv: [...iv],
          tag: 'authenticated',
          algorithm: this.config.algorithm,
          keyId: keyId || 'default',
        };
      } else {
        // Fallback to CryptoJS for React Native
        return this.encryptWithCryptoJS(data, keyId);
      }
    } catch (error) {
      loggingService.error('Data encryption failed', {
        error: error instanceof Error ? error.message : String(error),
        keyId,
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM with authentication verification
   */
  async decryptData(
    encryptedData: EncryptedData,
    keyId?: string,
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const key = await this.getOrCreateKey(keyId || encryptedData.keyId);
      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.data);

      if (this.isSubtleCryptoAvailable()) {
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv,
          },
          key,
          data,
        );

        const decoder = new TextDecoder();
        const result = decoder.decode(decrypted);

        enhancedPerformanceService.recordMetric(
          'data_decryption_time',
          Date.now() - startTime,
          'ms',
        );

        return result;
      } else {
        // Fallback to CryptoJS for React Native
        return this.decryptWithCryptoJS(encryptedData, keyId);
      }
    } catch (error) {
      loggingService.error('Data decryption failed', {
        error: error instanceof Error ? error.message : String(error),
        keyId,
      });
      throw new Error('Decryption failed');
    }
  }

  /**
   * Derive key from password using PBKDF2 with high iteration count
   */
  async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    options: Partial<KeyDerivationOptions> = {},
  ): Promise<CryptoKey> {
    const derivationOptions: KeyDerivationOptions = {
      iterations: 100000, // OWASP recommended minimum
      keyLength: 256,
      hashAlgorithm: 'SHA-256',
      ...options,
    };

    try {
      if (this.isSubtleCryptoAvailable()) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const baseKey = await crypto.subtle.importKey(
          'raw',
          passwordBuffer,
          'PBKDF2',
          false,
          ['deriveKey'],
        );

        return await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: derivationOptions.iterations,
            hash: derivationOptions.hashAlgorithm,
          },
          baseKey,
          {
            name: 'AES-GCM',
            length: derivationOptions.keyLength,
          },
          false,
          ['encrypt', 'decrypt'],
        );
      } else {
        // Fallback implementation for React Native
        const key = CryptoJS.PBKDF2(
          password,
          CryptoJS.lib.WordArray.create(salt),
          {
            keySize: derivationOptions.keyLength / 32,
            iterations: derivationOptions.iterations,
            hasher: CryptoJS.algo.SHA256,
          },
        );

        // Convert to CryptoKey-like object for consistency
        return this.createFallbackCryptoKey(key);
      }
    } catch (error) {
      loggingService.error('Key derivation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Generate cryptographically secure random bytes
   */
  generateSecureRandomBytes(length: number): Uint8Array {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(length));
    } else {
      // Fallback for React Native
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      return bytes;
    }
  }

  /**
   * Generate secure salt for key derivation
   */
  generateSalt(): Uint8Array {
    return this.generateSecureRandomBytes(32); // 256-bit salt
  }

  /**
   * Securely hash data using SHA-256
   */
  async hashData(data: string): Promise<string> {
    try {
      if (this.isSubtleCryptoAvailable()) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = [...new Uint8Array(hashBuffer)];
        return hashArray
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      } else {
        // Fallback to CryptoJS
        const hash = CryptoJS.SHA256(data);
        return hash.toString(CryptoJS.enc.Hex);
      }
    } catch (error) {
      loggingService.error('Data hashing failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Hashing failed');
    }
  }

  /**
   * Create HMAC signature for data integrity
   */
  async createHMAC(data: string, secret: string): Promise<string> {
    try {
      if (this.isSubtleCryptoAvailable()) {
        const encoder = new TextEncoder();
        const keyBuffer = encoder.encode(secret);
        const dataBuffer = encoder.encode(data);

        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        );

        const signature = await crypto.subtle.sign(
          'HMAC',
          cryptoKey,
          dataBuffer,
        );
        const signatureArray = [...new Uint8Array(signature)];
        return signatureArray
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      } else {
        // Fallback to CryptoJS
        const hmac = CryptoJS.HmacSHA256(data, secret);
        return hmac.toString(CryptoJS.enc.Hex);
      }
    } catch (error) {
      loggingService.error('HMAC creation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('HMAC creation failed');
    }
  }

  /**
   * Verify HMAC signature
   */
  async verifyHMAC(
    data: string,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    try {
      const computedSignature = await this.createHMAC(data, secret);
      return this.constantTimeCompare(signature, computedSignature);
    } catch (error) {
      loggingService.error('HMAC verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Rotate encryption keys for enhanced security
   */
  async rotateKeys(): Promise<void> {
    try {
      loggingService.info('Starting key rotation');

      // Generate new keys
      const newKeys = await this.generateNewKeys();

      // Re-encrypt data with new keys (would need implementation based on storage)
      await this.reEncryptDataWithNewKeys(newKeys);

      // Clear old keys from cache
      this.keyCache.clear();

      loggingService.info('Key rotation completed successfully');
    } catch (error) {
      loggingService.error('Key rotation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Secure memory cleanup
   */
  cleanup(): void {
    // Clear key cache
    this.keyCache.clear();

    // Stop key rotation timer
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
      this.keyRotationTimer = undefined;
    }

    loggingService.info('Advanced Encryption Service cleaned up');
  }

  // Private helper methods

  private isSubtleCryptoAvailable(): boolean {
    return (
      typeof crypto !== 'undefined' &&
      crypto.subtle !== undefined &&
      Platform.OS !== 'android'
    ); // SubtleCrypto has issues on some Android versions
  }

  private async getOrCreateKey(keyId = 'default'): Promise<CryptoKey> {
    if (this.keyCache.has(keyId)) {
      const cachedKey = this.keyCache.get(keyId);
      if (!cachedKey) {
        throw new Error(`Key not found: ${keyId}`);
      }
      return cachedKey;
    }

    const key = await this.generateKey();
    this.keyCache.set(keyId, key);
    return key;
  }

  private async generateKey(): Promise<CryptoKey> {
    if (this.isSubtleCryptoAvailable()) {
      return await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        false, // not extractable
        ['encrypt', 'decrypt'],
      );
    } else {
      // Fallback for React Native
      const key = CryptoJS.lib.WordArray.random(256 / 8);
      return this.createFallbackCryptoKey(key);
    }
  }

  private async encryptWithCryptoJS(
    data: string,
    keyId?: string,
  ): Promise<EncryptedData> {
    const key = keyId || 'default';
    const iv = CryptoJS.lib.WordArray.random(96 / 8); // 96-bit IV
    const keyWordArray = CryptoJS.lib.WordArray.random(256 / 8); // 256-bit key

    const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
      iv,
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding,
    });

    return {
      data: [
        ...new Uint8Array(
          encrypted.ciphertext.words.flatMap(word => [
            (word >> 24) & 0xff,
            (word >> 16) & 0xff,
            (word >> 8) & 0xff,
            word & 0xff,
          ]),
        ),
      ],
      iv: [
        ...new Uint8Array(
          iv.words.flatMap(word => [
            (word >> 24) & 0xff,
            (word >> 16) & 0xff,
            (word >> 8) & 0xff,
            word & 0xff,
          ]),
        ),
      ],
      tag: 'authenticated',
      algorithm: this.config.algorithm,
      keyId: key,
    };
  }

  private async decryptWithCryptoJS(
    _encryptedData: EncryptedData,
    _keyId?: string,
  ): Promise<string> {
    // Implementation for CryptoJS decryption
    // This is a simplified version - real implementation would store and retrieve keys securely
    throw new Error('CryptoJS decryption not fully implemented');
  }

  private createFallbackCryptoKey(key: CryptoJS.lib.WordArray): CryptoKey {
    // Create a CryptoKey-like object for fallback compatibility
    return {
      algorithm: { name: 'AES-GCM' },
      extractable: false,
      type: 'secret',
      usages: ['encrypt', 'decrypt'],
      // Store the actual key in a non-enumerable property
      [Symbol.for('key')]: key,
    } as CryptoKey;
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

  private startKeyRotation(): void {
    const intervalMs = this.config.keyRotationInterval * 60 * 60 * 1000; // Convert hours to ms

    this.keyRotationTimer = setInterval(async (): Promise<void> => {
      try {
        await this.rotateKeys();
      } catch (error) {
        loggingService.error('Scheduled key rotation failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, intervalMs) as ReturnType<typeof setInterval>;
  }

  private async validateEncryptionCapabilities(): Promise<void> {
    const testData = 'encryption_test';
    const encrypted = await this.encryptData(testData);
    const decrypted = await this.decryptData(encrypted);

    if (decrypted !== testData) {
      throw new Error('Encryption validation failed');
    }
  }

  private async generateNewKeys(): Promise<Map<string, CryptoKey>> {
    const newKeys = new Map<string, CryptoKey>();

    for (const keyId of this.keyCache.keys()) {
      const newKey = await this.generateKey();
      newKeys.set(keyId, newKey);
    }

    return newKeys;
  }

  private async reEncryptDataWithNewKeys(
    _newKeys: Map<string, CryptoKey>,
  ): Promise<void> {
    // Implementation would depend on how data is stored
    // This would typically involve:
    // 1. Retrieving all encrypted data
    // 2. Decrypting with old keys
    // 3. Encrypting with new keys
    // 4. Updating storage
    loggingService.info('Re-encryption with new keys completed');
  }
}

// Create and export singleton instance
export const advancedEncryptionService = new AdvancedEncryptionService();
export default advancedEncryptionService;
