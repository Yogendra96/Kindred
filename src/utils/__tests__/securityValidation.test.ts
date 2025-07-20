/**
 * @fileoverview Unit tests for security validation utilities
 */

import {
  DataSanitizer,
  defaultRateLimiter,
  defaultValidator,
  InputValidator,
  RateLimiter,
  SecurityHeaderValidator,
} from '../securityValidation';

describe('InputValidator', () => {
  let validator: InputValidator;

  beforeEach(() => {
    validator = new InputValidator();
  });

  describe('validateString', () => {
    it('should validate basic string input', () => {
      const result = validator.validateString('Hello World');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedValue).toBe('Hello World');
    });

    it('should reject non-string input', () => {
      const result = validator.validateString(123);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input must be a string');
    });

    it('should enforce maximum length', () => {
      const validator = new InputValidator({ maxStringLength: 10 });
      const result = validator.validateString('This is a very long string');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('String length exceeds maximum of 10 characters');
      expect(result.sanitizedValue).toBe('This is a ');
    });

    it('should block dangerous patterns', () => {
      const result = validator.validateString('<script>alert("xss")</script>');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('blocked pattern'))).toBe(true);
      expect(result.sanitizedValue).toBe('alert("xss")');
    });

    it('should remove HTML tags when not allowed', () => {
      const validator = new InputValidator({ allowHtml: false });
      const result = validator.validateString('Hello <b>World</b>');

      expect(result.sanitizedValue).toBe('Hello World');
    });

    it('should remove special characters when not allowed', () => {
      const validator = new InputValidator({ allowSpecialChars: false });
      const result = validator.validateString('Hello & "World"');

      expect(result.sanitizedValue).toBe('Hello  World');
    });

    it('should validate custom patterns', () => {
      const validator = new InputValidator({
        customPatterns: [/^\d{3}-\d{2}-\d{4}$/], // SSN pattern
      });

      const validResult = validator.validateString('123-45-6789');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validateString('invalid-ssn');
      expect(invalidResult.isValid).toBe(false);
      expect(
        invalidResult.errors.some(error => error.includes('does not match required pattern')),
      ).toBe(true);
    });
  });

  describe('validateNumber', () => {
    it('should validate numeric input', () => {
      const result = validator.validateNumber(42);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedValue).toBe(42);
    });

    it('should validate string numbers', () => {
      const result = validator.validateNumber('42.5');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(42.5);
    });

    it('should reject non-numeric input', () => {
      const result = validator.validateNumber('not-a-number');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input is not a valid number');
    });

    it('should reject infinite values', () => {
      const result = validator.validateNumber(Infinity);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input must be a finite number');
    });

    it('should enforce maximum value', () => {
      const validator = new InputValidator({ maxNumberValue: 100 });
      const result = validator.validateNumber(150);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number exceeds maximum absolute value of 100');
    });

    it('should reject objects and arrays', () => {
      const objectResult = validator.validateNumber({});
      const arrayResult = validator.validateNumber([]);

      expect(objectResult.isValid).toBe(false);
      expect(arrayResult.isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate proper email format', () => {
      const result = validator.validateEmail('user@example.com');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('user@example.com');
    });

    it('should normalize email case', () => {
      const result = validator.validateEmail('USER@EXAMPLE.COM');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('user@example.com');
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
      ];

      invalidEmails.forEach(email => {
        const result = validator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Invalid email format');
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate HTTPS URLs', () => {
      const result = validator.validateUrl('https://example.com');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('https://example.com/');
    });

    it('should validate HTTP URLs', () => {
      const result = validator.validateUrl('http://example.com');

      expect(result.isValid).toBe(true);
    });

    it('should reject dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'ftp://example.com',
      ];

      dangerousUrls.forEach(url => {
        const result = validator.validateUrl(url);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject malformed URLs', () => {
      const result = validator.validateUrl('not-a-url');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });
  });

  describe('validateObject', () => {
    it('should validate objects with required keys', () => {
      const obj = { name: 'John', email: 'john@example.com' };
      const result = validator.validateObject(obj, ['name', 'email']);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toStrictEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should reject non-objects', () => {
      const result = validator.validateObject('not-an-object', []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input must be an object');
    });

    it('should reject arrays', () => {
      const result = validator.validateObject([], []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input must be an object');
    });

    it('should check for missing required keys', () => {
      const obj = { name: 'John' };
      const result = validator.validateObject(obj, ['name', 'email']);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required property: email');
    });

    it('should validate object property values', () => {
      const obj = { name: '<script>alert("xss")</script>', age: 25 };
      const result = validator.validateObject(obj, ['name', 'age']);

      // Should sanitize the name but keep the valid age
      expect(result.sanitizedValue?.name).toBe('alert("xss")');
      expect(result.sanitizedValue?.age).toBe(25);
    });
  });
});

describe('SecurityHeaderValidator', () => {
  describe('validateCSP', () => {
    it('should validate basic CSP', () => {
      const csp = "default-src 'self'; script-src 'self'; style-src 'self'";
      const result = SecurityHeaderValidator.validateCSP(csp);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(csp);
    });

    it('should reject empty CSP', () => {
      const result = SecurityHeaderValidator.validateCSP('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CSP must be a non-empty string');
    });

    it('should warn about dangerous directives', () => {
      const csp = "default-src 'self' 'unsafe-eval'; script-src 'unsafe-inline'";
      const result = SecurityHeaderValidator.validateCSP(csp);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('unsafe directive'))).toBe(true);
    });

    it('should check for required directives', () => {
      const csp = "object-src 'none'"; // Missing required directives
      const result = SecurityHeaderValidator.validateCSP(csp);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('missing required directive'))).toBe(true);
    });
  });

  describe('validateApiToken', () => {
    it('should validate proper API tokens', () => {
      const token = 'abc123def456ghi789jkl012mno345pqr';
      const result = SecurityHeaderValidator.validateApiToken(token);

      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe(token);
    });

    it('should reject short tokens', () => {
      const result = SecurityHeaderValidator.validateApiToken('short');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API token too short (minimum 32 characters)');
    });

    it('should reject very long tokens', () => {
      const longToken = 'a'.repeat(600);
      const result = SecurityHeaderValidator.validateApiToken(longToken);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API token too long (maximum 512 characters)');
    });

    it('should reject tokens with invalid characters', () => {
      const result = SecurityHeaderValidator.validateApiToken('token-with-@-invalid-chars!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API token contains invalid characters');
    });

    it('should reject non-string tokens', () => {
      const result = SecurityHeaderValidator.validateApiToken(123);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API token must be a string');
    });
  });
});

describe('DataSanitizer', () => {
  describe('sanitizeControlChars', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00World\x1F\x7F';
      const result = DataSanitizer.sanitizeControlChars(input);

      expect(result).toBe('HelloWorld');
    });

    it('should preserve normal characters', () => {
      const input = 'Hello World!@#$%^&*()';
      const result = DataSanitizer.sanitizeControlChars(input);

      expect(result).toBe(input);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("XSS")</script>';
      const result = DataSanitizer.escapeHtml(input);

      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape ampersands', () => {
      const input = "Ben & Jerry's";
      const result = DataSanitizer.escapeHtml(input);

      expect(result).toBe('Ben &amp; Jerry&#x27;s');
    });
  });

  describe('sanitizeSql', () => {
    it('should remove SQL injection characters', () => {
      const input = "'; DROP TABLE users; --";
      const result = DataSanitizer.sanitizeSql(input);

      expect(result).toBe(' ');
    });

    it('should remove SQL keywords', () => {
      const input = 'SELECT * FROM users WHERE id = 1';
      const result = DataSanitizer.sanitizeSql(input);

      expect(result).toBe('  * FROM users WHERE id = 1');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should normalize multiple spaces', () => {
      const input = 'Hello    World   !';
      const result = DataSanitizer.normalizeWhitespace(input);

      expect(result).toBe('Hello World !');
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '   Hello World   ';
      const result = DataSanitizer.normalizeWhitespace(input);

      expect(result).toBe('Hello World');
    });
  });

  describe('deepSanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert("xss")</script>',
        details: {
          description: 'Safe & sound',
          meta: ['<b>bold</b>', 'normal'],
        },
      };

      const result = DataSanitizer.deepSanitizeObject(input);

      expect(result.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(result.details.description).toBe('Safe &amp; sound');
      expect(result.details.meta[0]).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
    });

    it('should handle primitive values', () => {
      expect(DataSanitizer.deepSanitizeObject('string')).toBe('string');
      expect(DataSanitizer.deepSanitizeObject(123)).toBe(123);
      expect(DataSanitizer.deepSanitizeObject(null)).toBe(null);
      expect(DataSanitizer.deepSanitizeObject(undefined)).toBe(undefined);
    });
  });
});

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow requests within limit', () => {
    expect(rateLimiter.isAllowed('user1')).toBe(true);
    expect(rateLimiter.isAllowed('user1')).toBe(true);
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    // Use up all attempts
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');

    // This should be blocked
    expect(rateLimiter.isAllowed('user1')).toBe(false);
  });

  it('should reset after time window', () => {
    // Use up all attempts
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(false);

    // Move time forward
    jest.advanceTimersByTime(1001);

    // Should be allowed again
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('should track different identifiers separately', () => {
    // Use up attempts for user1
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(false);

    // user2 should still be allowed
    expect(rateLimiter.isAllowed('user2')).toBe(true);
  });

  it('should reset specific identifier', () => {
    // Use up attempts
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    rateLimiter.isAllowed('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(false);

    // Reset and should be allowed again
    rateLimiter.reset('user1');
    expect(rateLimiter.isAllowed('user1')).toBe(true);
  });

  it('should return correct remaining attempts', () => {
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(3);

    rateLimiter.isAllowed('user1');
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(2);

    rateLimiter.isAllowed('user1');
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(1);

    rateLimiter.isAllowed('user1');
    expect(rateLimiter.getRemainingAttempts('user1')).toBe(0);
  });
});

describe('Default instances', () => {
  it('should export default validator instance', () => {
    expect(defaultValidator).toBeInstanceOf(InputValidator);
  });

  it('should export default rate limiter instance', () => {
    expect(defaultRateLimiter).toBeInstanceOf(RateLimiter);
  });

  it('should use default validator for basic validation', () => {
    const result = defaultValidator.validateString('test');
    expect(result.isValid).toBe(true);
  });

  it('should use default rate limiter for rate limiting', () => {
    expect(defaultRateLimiter.isAllowed('test-user')).toBe(true);
  });
});
