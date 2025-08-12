import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// Types for Data Encryption
export interface EncryptionConfig {
  algorithm?: 'AES' | 'DES' | 'TripleDES' | 'RC4';
  mode?: 'CBC' | 'ECB' | 'CFB' | 'OFB' | 'CTR';
  padding?: 'Pkcs7' | 'AnsiX923' | 'Iso10126' | 'NoPadding';
  keySize?: 128 | 192 | 256;
  ivSize?: number;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  timestamp: number;
  algorithm: string;
}

export interface KeyDerivationConfig {
  iterations?: number;
  keySize?: number;
  hasher?: any;
}

export interface SecureStorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  expiry?: number; // in milliseconds
  keyAlias?: string;
}

export interface EncryptionMetrics {
  encryptionTime: number;
  decryptionTime: number;
  dataSize: number;
  encryptedSize: number;
  compressionRatio?: number;
}

export interface SecureField {
  fieldName: string;
  encryptionLevel: 'low' | 'medium' | 'high';
  rotationInterval?: number; // in days
}

class DataEncryptionService {
  private defaultConfig: EncryptionConfig = {
    algorithm: 'AES',
    mode: 'CBC',
    padding: 'Pkcs7',
    keySize: 256,
    ivSize: 16,
  };

  private keyDerivationConfig: KeyDerivationConfig = {
    iterations: 10000,
    keySize: 256 / 32,
    hasher: CryptoJS.algo.SHA256,
  };

  private masterKey: string | null = null;
  private keyCache: Map<string, string> = new Map();
  private encryptionMetrics: Map<string, EncryptionMetrics> = new Map();

  // Initialize encryption service
  async initialize(masterPassword?: string): Promise<void> {
    try {
      if (masterPassword) {
        this.masterKey = await this.deriveKey(masterPassword, 'master-salt');
      } else {
        // Generate or retrieve master key from secure storage
        this.masterKey = await this.getOrCreateMasterKey();
      }
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  // Basic encryption/decryption
  async encrypt(
    data: string,
    password?: string,
    config: EncryptionConfig = {},
  ): Promise<EncryptedData> {
    const startTime = Date.now();

    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const key = password ? await this.deriveKey(password) : this.masterKey;

      if (!key) {
        throw new Error('No encryption key available');
      }

      // Generate random IV and salt
      const iv = CryptoJS.lib.WordArray.random(finalConfig.ivSize ?? 16);
      const salt = CryptoJS.lib.WordArray.random(16);

      // Encrypt data
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv,
        mode: CryptoJS.mode[finalConfig.mode ?? 'CBC'],
        padding: CryptoJS.pad[finalConfig.padding ?? 'Pkcs7'],
      });

      const result: EncryptedData = {
        data: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString(),
        timestamp: Date.now(),
        algorithm: `${finalConfig.algorithm}-${finalConfig.keySize}`,
      };

      // Record metrics
      this.recordEncryptionMetrics(
        'encrypt',
        startTime,
        data.length,
        result.data.length,
      );

      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  async decrypt(
    encryptedData: EncryptedData,
    password?: string,
    config: EncryptionConfig = {},
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const finalConfig = { ...this.defaultConfig, ...config };
      const key = password ? await this.deriveKey(password) : this.masterKey;

      if (!key) {
        throw new Error('No decryption key available');
      }

      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key, {
        iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
        mode: CryptoJS.mode[finalConfig.mode ?? 'CBC'],
        padding: CryptoJS.pad[finalConfig.padding ?? 'Pkcs7'],
      });

      const result = decrypted.toString(CryptoJS.enc.Utf8);

      if (!result) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      // Record metrics
      this.recordEncryptionMetrics(
        'decrypt',
        startTime,
        encryptedData.data.length,
        result.length,
      );

      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Secure storage operations
  async secureStore(
    key: string,
    data: any,
    options: SecureStorageOptions = {},
  ): Promise<void> {
    try {
      let processedData =
        typeof data === 'string' ? data : JSON.stringify(data);

      // Compress data if requested
      if (options.compress) {
        processedData = await this.compressData(processedData);
      }

      // Encrypt data if requested (default: true)
      if (options.encrypt !== false) {
        const encrypted = await this.encrypt(processedData);
        processedData = JSON.stringify(encrypted);
      }

      // Add expiry if specified
      if (options.expiry) {
        const expiryData = {
          data: processedData,
          expiry: Date.now() + options.expiry,
        };
        processedData = JSON.stringify(expiryData);
      }

      await AsyncStorage.setItem(key, processedData);
    } catch (error) {
      console.error('Secure storage failed:', error);
      throw new Error('Failed to store data securely');
    }
  }

  async secureRetrieve(
    key: string,
    options: SecureStorageOptions = {},
  ): Promise<any> {
    try {
      let storedData = await AsyncStorage.getItem(key);

      if (!storedData) {
        return null;
      }

      // Check expiry if applicable
      if (options.expiry) {
        try {
          const expiryData = JSON.parse(storedData);
          if (expiryData.expiry && Date.now() > expiryData.expiry) {
            await AsyncStorage.removeItem(key);
            return null;
          }
          storedData = expiryData.data;
        } catch {
          // Data might not have expiry format, continue
        }
      }

      // Decrypt data if it was encrypted
      if (options.encrypt !== false) {
        try {
          const encryptedData = JSON.parse(storedData);
          if (encryptedData.data && encryptedData.iv) {
            storedData = await this.decrypt(encryptedData);
          }
        } catch {
          // Data might not be encrypted, continue
        }
      }

      // Decompress data if it was compressed
      if (options.compress) {
        storedData = await this.decompressData(storedData);
      }

      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(storedData);
      } catch {
        return storedData;
      }
    } catch (error) {
      console.error('Secure retrieval failed:', error);
      throw new Error('Failed to retrieve data securely');
    }
  }

  async secureRemove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Secure removal failed:', error);
      throw new Error('Failed to remove data securely');
    }
  }

  // Hash functions
  hash(
    data: string,
    algorithm: 'SHA1' | 'SHA256' | 'SHA512' | 'MD5' = 'SHA256',
  ): string {
    try {
      switch (algorithm) {
        case 'SHA1':
          return CryptoJS.SHA1(data).toString();
        case 'SHA256':
          return CryptoJS.SHA256(data).toString();
        case 'SHA512':
          return CryptoJS.SHA512(data).toString();
        case 'MD5':
          return CryptoJS.MD5(data).toString();
        default:
          return CryptoJS.SHA256(data).toString();
      }
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error('Data hashing failed');
    }
  }

  hmac(
    data: string,
    key: string,
    algorithm: 'SHA1' | 'SHA256' | 'SHA512' | 'MD5' = 'SHA256',
  ): string {
    try {
      switch (algorithm) {
        case 'SHA1':
          return CryptoJS.HmacSHA1(data, key).toString();
        case 'SHA256':
          return CryptoJS.HmacSHA256(data, key).toString();
        case 'SHA512':
          return CryptoJS.HmacSHA512(data, key).toString();
        case 'MD5':
          return CryptoJS.HmacMD5(data, key).toString();
        default:
          return CryptoJS.HmacSHA256(data, key).toString();
      }
    } catch (error) {
      console.error('HMAC generation failed:', error);
      throw new Error('HMAC generation failed');
    }
  }

  // Key management
  async deriveKey(
    password: string,
    salt?: string,
    config: KeyDerivationConfig = {},
  ): Promise<string> {
    try {
      const finalConfig = { ...this.keyDerivationConfig, ...config };
      const saltWordArray = salt
        ? CryptoJS.enc.Utf8.parse(salt)
        : CryptoJS.lib.WordArray.random(16);

      const key = CryptoJS.PBKDF2(password, saltWordArray, {
        keySize: finalConfig.keySize ?? 256 / 32,
        iterations: finalConfig.iterations ?? 10000,
        hasher: finalConfig.hasher ?? CryptoJS.algo.SHA256,
      });

      return key.toString();
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Key derivation failed');
    }
  }

  generateRandomKey(length: number = 32): string {
    try {
      return CryptoJS.lib.WordArray.random(length).toString();
    } catch (error) {
      console.error('Random key generation failed:', error);
      throw new Error('Random key generation failed');
    }
  }

  async rotateKey(keyAlias: string): Promise<string> {
    try {
      const newKey = this.generateRandomKey();
      this.keyCache.set(keyAlias, newKey);

      // Store new key securely
      await this.secureStore(`key_${keyAlias}`, newKey);

      return newKey;
    } catch (error) {
      console.error('Key rotation failed:', error);
      throw new Error('Key rotation failed');
    }
  }

  // Field-level encryption
  async encryptFields(
    data: Record<string, any>,
    secureFields: SecureField[],
  ): Promise<Record<string, any>> {
    try {
      const result = { ...data };

      for (const field of secureFields) {
        if (result[field.fieldName] !== undefined) {
          const fieldData =
            typeof result[field.fieldName] === 'string'
              ? result[field.fieldName]
              : JSON.stringify(result[field.fieldName]);

          const encrypted = await this.encrypt(fieldData);
          result[field.fieldName] = encrypted;
        }
      }

      return result;
    } catch (error) {
      console.error('Field encryption failed:', error);
      throw new Error('Field encryption failed');
    }
  }

  async decryptFields(
    data: Record<string, any>,
    secureFields: SecureField[],
  ): Promise<Record<string, any>> {
    try {
      const result = { ...data };

      for (const field of secureFields) {
        if (
          result[field.fieldName] &&
          typeof result[field.fieldName] === 'object'
        ) {
          try {
            const decrypted = await this.decrypt(result[field.fieldName]);

            // Try to parse as JSON, keep as string if parsing fails
            try {
              result[field.fieldName] = JSON.parse(decrypted);
            } catch {
              result[field.fieldName] = decrypted;
            }
          } catch (error) {
            console.warn(`Failed to decrypt field ${field.fieldName}:`, error);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Field decryption failed:', error);
      throw new Error('Field decryption failed');
    }
  }

  // Data integrity
  async createChecksum(data: string): Promise<string> {
    return this.hash(data, 'SHA256');
  }

  async verifyChecksum(data: string, checksum: string): Promise<boolean> {
    try {
      const calculatedChecksum = await this.createChecksum(data);
      return calculatedChecksum === checksum;
    } catch (error) {
      console.error('Checksum verification failed:', error);
      return false;
    }
  }

  // Compression utilities
  private async compressData(data: string): Promise<string> {
    // Simple compression using base64 encoding
    // In a real implementation, you might use a proper compression library
    try {
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
    } catch (error) {
      console.error('Data compression failed:', error);
      return data;
    }
  }

  private async decompressData(data: string): Promise<string> {
    try {
      return CryptoJS.enc.Base64.parse(data).toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Data decompression failed:', error);
      return data;
    }
  }

  // Utility methods
  private async getOrCreateMasterKey(): Promise<string> {
    try {
      let masterKey = await AsyncStorage.getItem('master_encryption_key');

      if (!masterKey) {
        masterKey = this.generateRandomKey(32);
        await AsyncStorage.setItem('master_encryption_key', masterKey);
      }

      return masterKey;
    } catch (error) {
      console.error('Master key retrieval/creation failed:', error);
      throw new Error('Master key setup failed');
    }
  }

  private recordEncryptionMetrics(
    operation: 'encrypt' | 'decrypt',
    startTime: number,
    inputSize: number,
    outputSize: number,
  ): void {
    const duration = Date.now() - startTime;
    const key = `${operation}_${Date.now()}`;

    const metrics: EncryptionMetrics = {
      encryptionTime: operation === 'encrypt' ? duration : 0,
      decryptionTime: operation === 'decrypt' ? duration : 0,
      dataSize: inputSize,
      encryptedSize: outputSize,
      compressionRatio: outputSize / inputSize,
    };

    this.encryptionMetrics.set(key, metrics);

    // Keep only last 100 metrics
    if (this.encryptionMetrics.size > 100) {
      const firstKey = this.encryptionMetrics.keys().next().value;
      this.encryptionMetrics.delete(firstKey);
    }
  }

  // Analytics and monitoring
  getEncryptionMetrics(): {
    averageEncryptionTime: number;
    averageDecryptionTime: number;
    averageCompressionRatio: number;
    totalOperations: number;
  } {
    const metrics = [...this.encryptionMetrics.values()];

    if (metrics.length === 0) {
      return {
        averageEncryptionTime: 0,
        averageDecryptionTime: 0,
        averageCompressionRatio: 1,
        totalOperations: 0,
      };
    }

    const encryptionTimes = metrics
      .filter(m => m.encryptionTime > 0)
      .map(m => m.encryptionTime);
    const decryptionTimes = metrics
      .filter(m => m.decryptionTime > 0)
      .map(m => m.decryptionTime);
    const compressionRatios = metrics
      .filter(m => m.compressionRatio)
      .map(m => m.compressionRatio!);

    return {
      averageEncryptionTime:
        encryptionTimes.reduce((a, b) => a + b, 0) / encryptionTimes.length ||
        0,
      averageDecryptionTime:
        decryptionTimes.reduce((a, b) => a + b, 0) / decryptionTimes.length ||
        0,
      averageCompressionRatio:
        compressionRatios.reduce((a, b) => a + b, 0) /
          compressionRatios.length || 1,
      totalOperations: metrics.length,
    };
  }

  // Security utilities
  async secureDelete(key: string): Promise<void> {
    try {
      // Overwrite with random data before deletion
      const randomData = this.generateRandomKey(1024);
      await AsyncStorage.setItem(key, randomData);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Secure deletion failed:', error);
      throw new Error('Secure deletion failed');
    }
  }

  clearCache(): void {
    this.keyCache.clear();
    this.encryptionMetrics.clear();
  }

  // Validation
  validateEncryptedData(data: any): data is EncryptedData {
    return (
      typeof data === 'object' &&
      typeof data.data === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.salt === 'string' &&
      typeof data.timestamp === 'number' &&
      typeof data.algorithm === 'string'
    );
  }

  // Debug helpers
  async testEncryption(): Promise<boolean> {
    try {
      const testData = 'This is a test string for encryption validation';
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);

      return testData === decrypted;
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }
}

export default new DataEncryptionService();
