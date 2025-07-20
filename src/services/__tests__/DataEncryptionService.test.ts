import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

import DataEncryptionService from '../DataEncryptionService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock CryptoJS
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  lib: {
    WordArray: {
      random: jest.fn(),
    },
  },
  enc: {
    Utf8: {
      parse: jest.fn(),
      stringify: jest.fn(),
    },
    Hex: {
      parse: jest.fn(),
    },
    Base64: {
      stringify: jest.fn(),
      parse: jest.fn(),
    },
  },
  mode: {
    CBC: 'CBC',
    ECB: 'ECB',
    CFB: 'CFB',
    OFB: 'OFB',
    CTR: 'CTR',
  },
  pad: {
    Pkcs7: 'Pkcs7',
    AnsiX923: 'AnsiX923',
    Iso10126: 'Iso10126',
    NoPadding: 'NoPadding',
  },
  PBKDF2: jest.fn(),
  SHA1: jest.fn(),
  SHA256: jest.fn(),
  SHA512: jest.fn(),
  MD5: jest.fn(),
  HmacSHA1: jest.fn(),
  HmacSHA256: jest.fn(),
  HmacSHA512: jest.fn(),
  HmacMD5: jest.fn(),
  algo: {
    SHA256: 'SHA256',
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockCryptoJS = CryptoJS as jest.Mocked<typeof CryptoJS>;

describe('DataEncryptionService', () => {
  let service: typeof DataEncryptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = DataEncryptionService;

    // Reset service state
    service.clearCache();

    // Setup default mocks
    mockCryptoJS.lib.WordArray.random.mockReturnValue({
      toString: () => 'mock-random-string',
    } as any);

    mockCryptoJS.PBKDF2.mockReturnValue({
      toString: () => 'mock-derived-key',
    } as any);

    mockCryptoJS.AES.encrypt.mockReturnValue({
      toString: () => 'mock-encrypted-data',
    } as any);

    mockCryptoJS.AES.decrypt.mockReturnValue({
      toString: () => 'mock-decrypted-data',
    } as any);

    mockCryptoJS.SHA256.mockReturnValue({
      toString: () => 'mock-hash',
    } as any);

    mockCryptoJS.enc.Utf8.parse.mockReturnValue('mock-parsed' as any);
    mockCryptoJS.enc.Base64.stringify.mockReturnValue('mock-compressed');
    mockCryptoJS.enc.Base64.parse.mockReturnValue({
      toString: () => 'mock-decompressed',
    } as any);
  });

  describe('Initialization', () => {
    it('should initialize without master password', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('existing-master-key');

      await expect(service.initialize()).resolves.not.toThrow();
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('master_encryption_key');
    });

    it('should initialize with master password', async () => {
      const masterPassword = 'test-password';

      await expect(service.initialize(masterPassword)).resolves.not.toThrow();
      expect(mockCryptoJS.PBKDF2).toHaveBeenCalled();
    });

    it('should create new master key if none exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await service.initialize();

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'master_encryption_key',
        expect.any(String),
      );
    });

    it('should handle initialization errors', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(service.initialize()).rejects.toThrow(
        'Encryption service initialization failed',
      );
    });
  });

  describe('Encryption and Decryption', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue('test-master-key');
      await service.initialize();
    });

    it('should encrypt data successfully', async () => {
      const testData = 'test data to encrypt';

      const result = await service.encrypt(testData);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('algorithm');
      expect(mockCryptoJS.AES.encrypt).toHaveBeenCalled();
    });

    it('should decrypt data successfully', async () => {
      const encryptedData = {
        data: 'encrypted-data',
        iv: 'test-iv',
        salt: 'test-salt',
        timestamp: Date.now(),
        algorithm: 'AES-256',
      };

      const result = await service.decrypt(encryptedData);

      expect(result).toBe('mock-decrypted-data');
      expect(mockCryptoJS.AES.decrypt).toHaveBeenCalled();
    });

    it('should encrypt with custom password', async () => {
      const testData = 'test data';
      const customPassword = 'custom-password';

      await service.encrypt(testData, customPassword);

      expect(mockCryptoJS.PBKDF2).toHaveBeenCalled();
    });

    it('should handle encryption errors', async () => {
      mockCryptoJS.AES.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      await expect(service.encrypt('test')).rejects.toThrow('Data encryption failed');
    });

    it('should handle decryption errors', async () => {
      mockCryptoJS.AES.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const encryptedData = {
        data: 'encrypted-data',
        iv: 'test-iv',
        salt: 'test-salt',
        timestamp: Date.now(),
        algorithm: 'AES-256',
      };

      await expect(service.decrypt(encryptedData)).rejects.toThrow('Data decryption failed');
    });

    it('should handle empty decryption result', async () => {
      mockCryptoJS.AES.decrypt.mockReturnValue({
        toString: () => '',
      } as any);

      const encryptedData = {
        data: 'encrypted-data',
        iv: 'test-iv',
        salt: 'test-salt',
        timestamp: Date.now(),
        algorithm: 'AES-256',
      };

      await expect(service.decrypt(encryptedData)).rejects.toThrow(
        'Decryption failed - invalid key or corrupted data',
      );
    });
  });

  describe('Secure Storage', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue('test-master-key');
      await service.initialize();
    });

    it('should store data securely with encryption', async () => {
      const key = 'test-key';
      const data = { test: 'data' };

      await service.secureStore(key, data);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(key, expect.any(String));
    });

    it('should store data without encryption when disabled', async () => {
      const key = 'test-key';
      const data = 'test data';

      await service.secureStore(key, data, { encrypt: false });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(key, data);
    });

    it('should store data with compression', async () => {
      const key = 'test-key';
      const data = 'test data';

      await service.secureStore(key, data, { compress: true });

      expect(mockCryptoJS.enc.Base64.stringify).toHaveBeenCalled();
    });

    it('should store data with expiry', async () => {
      const key = 'test-key';
      const data = 'test data';
      const expiry = 3600000; // 1 hour

      await service.secureStore(key, data, { expiry });

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should retrieve stored data', async () => {
      const key = 'test-key';
      const storedData = JSON.stringify({
        data: 'encrypted-data',
        iv: 'test-iv',
        salt: 'test-salt',
        timestamp: Date.now(),
        algorithm: 'AES-256',
      });

      mockAsyncStorage.getItem.mockResolvedValue(storedData);

      const result = await service.secureRetrieve(key);

      expect(result).toBe('mock-decrypted-data');
    });

    it('should return null for non-existent data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await service.secureRetrieve('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle expired data', async () => {
      const key = 'test-key';
      const expiredData = JSON.stringify({
        data: 'some-data',
        expiry: Date.now() - 1000, // Expired 1 second ago
      });

      mockAsyncStorage.getItem.mockResolvedValue(expiredData);

      const result = await service.secureRetrieve(key, { expiry: 3600000 });

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(key);
    });

    it('should remove stored data', async () => {
      const key = 'test-key';

      await service.secureRemove(key);

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(key);
    });
  });

  describe('Hashing', () => {
    it('should hash data with SHA256 by default', () => {
      const data = 'test data';

      const result = service.hash(data);

      expect(mockCryptoJS.SHA256).toHaveBeenCalledWith(data);
      expect(result).toBe('mock-hash');
    });

    it('should hash data with specified algorithm', () => {
      const data = 'test data';

      service.hash(data, 'SHA1');
      expect(mockCryptoJS.SHA1).toHaveBeenCalledWith(data);

      service.hash(data, 'SHA512');
      expect(mockCryptoJS.SHA512).toHaveBeenCalledWith(data);

      service.hash(data, 'MD5');
      expect(mockCryptoJS.MD5).toHaveBeenCalledWith(data);
    });

    it('should generate HMAC', () => {
      const data = 'test data';
      const key = 'test key';

      service.hmac(data, key);

      expect(mockCryptoJS.HmacSHA256).toHaveBeenCalledWith(data, key);
    });

    it('should generate HMAC with different algorithms', () => {
      const data = 'test data';
      const key = 'test key';

      service.hmac(data, key, 'SHA1');
      expect(mockCryptoJS.HmacSHA1).toHaveBeenCalledWith(data, key);

      service.hmac(data, key, 'SHA512');
      expect(mockCryptoJS.HmacSHA512).toHaveBeenCalledWith(data, key);

      service.hmac(data, key, 'MD5');
      expect(mockCryptoJS.HmacMD5).toHaveBeenCalledWith(data, key);
    });
  });

  describe('Key Management', () => {
    it('should derive key from password', async () => {
      const password = 'test-password';
      const salt = 'test-salt';

      const result = await service.deriveKey(password, salt);

      expect(mockCryptoJS.PBKDF2).toHaveBeenCalled();
      expect(result).toBe('mock-derived-key');
    });

    it('should generate random key', () => {
      const length = 32;

      const result = service.generateRandomKey(length);

      expect(mockCryptoJS.lib.WordArray.random).toHaveBeenCalledWith(length);
      expect(result).toBe('mock-random-string');
    });

    it('should rotate key', async () => {
      const keyAlias = 'test-alias';

      const result = await service.rotateKey(keyAlias);

      expect(result).toBe('mock-random-string');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(`key_${keyAlias}`, expect.any(String));
    });
  });

  describe('Field-level Encryption', () => {
    beforeEach(async () => {
      mockAsyncStorage.getItem.mockResolvedValue('test-master-key');
      await service.initialize();
    });

    it('should encrypt specified fields', async () => {
      const data = {
        publicField: 'public data',
        sensitiveField: 'sensitive data',
        anotherSensitiveField: { nested: 'data' },
      };

      const secureFields = [
        { fieldName: 'sensitiveField', encryptionLevel: 'high' as const },
        {
          fieldName: 'anotherSensitiveField',
          encryptionLevel: 'medium' as const,
        },
      ];

      const result = await service.encryptFields(data, secureFields);

      expect(result.publicField).toBe('public data');
      expect(result.sensitiveField).toHaveProperty('data');
      expect(result.anotherSensitiveField).toHaveProperty('data');
    });

    it('should decrypt specified fields', async () => {
      const encryptedData = {
        publicField: 'public data',
        sensitiveField: {
          data: 'encrypted-data',
          iv: 'test-iv',
          salt: 'test-salt',
          timestamp: Date.now(),
          algorithm: 'AES-256',
        },
      };

      const secureFields = [{ fieldName: 'sensitiveField', encryptionLevel: 'high' as const }];

      const result = await service.decryptFields(encryptedData, secureFields);

      expect(result.publicField).toBe('public data');
      expect(result.sensitiveField).toBe('mock-decrypted-data');
    });
  });

  describe('Data Integrity', () => {
    it('should create checksum', async () => {
      const data = 'test data';

      const result = await service.createChecksum(data);

      expect(mockCryptoJS.SHA256).toHaveBeenCalledWith(data);
      expect(result).toBe('mock-hash');
    });

    it('should verify checksum', async () => {
      const data = 'test data';
      const checksum = 'mock-hash';

      const result = await service.verifyChecksum(data, checksum);

      expect(result).toBe(true);
    });

    it('should return false for invalid checksum', async () => {
      const data = 'test data';
      const invalidChecksum = 'invalid-hash';

      const result = await service.verifyChecksum(data, invalidChecksum);

      expect(result).toBe(false);
    });
  });

  describe('Utilities', () => {
    it('should validate encrypted data structure', () => {
      const validData = {
        data: 'encrypted-data',
        iv: 'test-iv',
        salt: 'test-salt',
        timestamp: Date.now(),
        algorithm: 'AES-256',
      };

      const invalidData = {
        data: 'encrypted-data',
        // missing required fields
      };

      expect(service.validateEncryptedData(validData)).toBe(true);
      expect(service.validateEncryptedData(invalidData)).toBe(false);
    });

    it('should test encryption functionality', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('test-master-key');
      await service.initialize();

      // Mock successful encryption/decryption cycle
      mockCryptoJS.AES.decrypt.mockReturnValue({
        toString: () => 'This is a test string for encryption validation',
      } as any);

      const result = await service.testEncryption();

      expect(result).toBe(true);
    });

    it('should handle test encryption failure', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('test-master-key');
      await service.initialize();

      mockCryptoJS.AES.encrypt.mockImplementation(() => {
        throw new Error('Test encryption failed');
      });

      const result = await service.testEncryption();

      expect(result).toBe(false);
    });

    it('should clear cache', () => {
      service.clearCache();

      // This test mainly ensures the method doesn't throw
      expect(true).toBe(true);
    });

    it('should get encryption metrics', () => {
      const metrics = service.getEncryptionMetrics();

      expect(metrics).toHaveProperty('averageEncryptionTime');
      expect(metrics).toHaveProperty('averageDecryptionTime');
      expect(metrics).toHaveProperty('averageCompressionRatio');
      expect(metrics).toHaveProperty('totalOperations');
    });

    it('should perform secure delete', async () => {
      const key = 'test-key';

      await service.secureDelete(key);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(key, expect.any(String));
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(key);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(service.secureStore('key', 'data')).rejects.toThrow(
        'Failed to store data securely',
      );
    });

    it('should handle retrieval errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Retrieval error'));

      await expect(service.secureRetrieve('key')).rejects.toThrow(
        'Failed to retrieve data securely',
      );
    });

    it('should handle hashing errors gracefully', () => {
      mockCryptoJS.SHA256.mockImplementation(() => {
        throw new Error('Hashing error');
      });

      expect(() => service.hash('data')).toThrow('Data hashing failed');
    });

    it('should handle HMAC errors gracefully', () => {
      mockCryptoJS.HmacSHA256.mockImplementation(() => {
        throw new Error('HMAC error');
      });

      expect(() => service.hmac('data', 'key')).toThrow('HMAC generation failed');
    });
  });
});
