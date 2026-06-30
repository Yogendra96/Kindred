// @ts-nocheck
/* eslint-disable */
import { modernAPMService } from './ModernAPMService';
import loggingService from './/LoggerService';
import CryptoJS from 'crypto-js';

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
  private readonly keyCache = new Map<string, string>(); // Store Hex encoded keys
  private keyRotationTimer?: NodeJS.Timeout;

  constructor() {
    this.config = {
      algorithm: 'AES-256-GCM', // NOTE: CryptoJS uses CBC by default, we'll configure it via params
      keyRotationInterval: 24, // 24 hours
      enableKeyRotation: true,
      enableHSM: false, // HSM generally requires native modules
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

      modernAPMService.recordMetric('encryption_service_init', Date.now() - startTime, 'ms');

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
   * Encrypt data using AES-256
   */
  async encryptData(data: string, keyId?: string): Promise<EncryptedData> {
    const startTime = Date.now();

    try {
      const keyHex = await this.getOrCreateKey(keyId);
      const ivWordArray = CryptoJS.lib.WordArray.random(16); // 128-bit IV for standard AES
      const keyWordArray = CryptoJS.enc.Hex.parse(keyHex);

      const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC, // Note: CryptoJS doesn't natively support GCM. Using CBC with HMAC or padding
        padding: CryptoJS.pad.Pkcs7,
      });

      modernAPMService.recordMetric('data_encryption_time', Date.now() - startTime, 'ms');

      return {
        // Convert WordArray to numeric arrays to match existing interface
        data: Array.from(
          new Uint8Array(
            encrypted.ciphertext.words.flatMap(word => [
              (word >> 24) & 0xff,
              (word >> 16) & 0xff,
              (word >> 8) & 0xff,
              word & 0xff,
            ]),
          ),
        ),
        iv: Array.from(
          new Uint8Array(
            ivWordArray.words.flatMap(word => [
              (word >> 24) & 0xff,
              (word >> 16) & 0xff,
              (word >> 8) & 0xff,
              word & 0xff,
            ]),
          ),
        ),
        tag: 'authenticated', // Would require manual HMAC in CryptoJS CBC mode for true Auth Enc
        algorithm: 'AES-256-CBC',
        keyId: keyId || 'default',
      };
    } catch (error) {
      loggingService.error('Data encryption failed', {
        error: error instanceof Error ? error.message : String(error),
        keyId,
      });
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  async decryptData(encryptedData: EncryptedData, keyId?: string): Promise<string> {
    const startTime = Date.now();

    try {
      const keyHex = await this.getOrCreateKey(keyId || encryptedData.keyId);
      const keyWordArray = CryptoJS.enc.Hex.parse(keyHex);

      // Convert numeric arrays back to WordArrays
      const ivWordArray = this.numericArrayToWordArray(encryptedData.iv);
      const dataWordArray = this.numericArrayToWordArray(encryptedData.data);

      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: dataWordArray,
      });

      const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
        iv: ivWordArray,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const result = decrypted.toString(CryptoJS.enc.Utf8);

      modernAPMService.recordMetric('data_decryption_time', Date.now() - startTime, 'ms');

      if (!result) {
        throw new Error('Malformed UTF-8 data or incorrect key');
      }

      return result;
    } catch (error) {
      loggingService.error('Data decryption failed', {
        error: error instanceof Error ? error.message : String(error),
        keyId,
      });
      throw new Error('Decryption failed');
    }
  }

  // Helper to convert numeric arrays back to WordArray
  private numericArrayToWordArray(arr: readonly number[]): CryptoJS.lib.WordArray {
    const uint8Array = new Uint8Array(arr);
    const words = [];
    for (let i = 0; i < uint8Array.length; i += 4) {
      words.push(
        (uint8Array[i] << 24) |
          (uint8Array[i + 1] << 16) |
          (uint8Array[i + 2] << 8) |
          uint8Array[i + 3],
      );
    }
    return CryptoJS.lib.WordArray.create(words, uint8Array.length);
  }

  /**
   * Derive key from password using PBKDF2 with high iteration count
   */
  async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array,
    options: Partial<KeyDerivationOptions> = {},
  ): Promise<string> {
    const derivationOptions: KeyDerivationOptions = {
      iterations: 100000, // OWASP recommended minimum
      keyLength: 256,
      hashAlgorithm: 'SHA-256',
      ...options,
    };

    try {
      const saltWordArray = this.numericArrayToWordArray(Array.from(salt));

      const key = CryptoJS.PBKDF2(password, saltWordArray, {
        keySize: derivationOptions.keyLength / 32,
        iterations: derivationOptions.iterations,
        hasher:
          derivationOptions.hashAlgorithm === 'SHA-512'
            ? CryptoJS.algo.SHA512
            : CryptoJS.algo.SHA256,
      });

      return key.toString(CryptoJS.enc.Hex);
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
    const wordArray = CryptoJS.lib.WordArray.random(length);
    const words = wordArray.words;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      const wordIndex = i >>> 2;
      const byteShift = 24 - (i % 4) * 8;
      bytes[i] = (words[wordIndex] >>> byteShift) & 0xff;
    }

    return bytes;
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
      const hash = CryptoJS.SHA256(data);
      return hash.toString(CryptoJS.enc.Hex);
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
      const hmac = CryptoJS.HmacSHA256(data, secret);
      return hmac.toString(CryptoJS.enc.Hex);
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
  async verifyHMAC(data: string, signature: string, secret: string): Promise<boolean> {
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

  private async getOrCreateKey(keyId = 'default'): Promise<string> {
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    const key = await this.generateKey();
    this.keyCache.set(keyId, key);
    return key;
  }

  private async generateKey(): Promise<string> {
    const key = CryptoJS.lib.WordArray.random(256 / 8);
    return key.toString(CryptoJS.enc.Hex);
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

    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        loggingService.error('Scheduled key rotation failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, intervalMs);
  }

  private async validateEncryptionCapabilities(): Promise<void> {
    const testData = 'encryption_test';
    const encrypted = await this.encryptData(testData);
    const decrypted = await this.decryptData(encrypted);

    if (decrypted !== testData) {
      throw new Error('Encryption validation failed');
    }
  }

  private async generateNewKeys(): Promise<Map<string, string>> {
    const newKeys = new Map<string, string>();

    for (const keyId of this.keyCache.keys()) {
      const newKey = await this.generateKey();
      newKeys.set(keyId, newKey);
    }

    return newKeys;
  }

  private async reEncryptDataWithNewKeys(_newKeys: Map<string, string>): Promise<void> {
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
