/**
 * Advanced Security Validation Utilities
 *
 * Provides comprehensive input validation, sanitization, and security checks
 * to prevent common security vulnerabilities in React Native applications.
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: unknown;
}

/**
 * Security configuration options
 */
export interface SecurityConfig {
  /** Maximum string length allowed */
  maxStringLength?: number;
  /** Maximum number value allowed */
  maxNumberValue?: number;
  /** Whether to allow HTML tags */
  allowHtml?: boolean;
  /** Whether to allow special characters */
  allowSpecialChars?: boolean;
  /** Custom validation patterns */
  customPatterns?: RegExp[];
  /** Blocked patterns */
  blockedPatterns?: RegExp[];
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxStringLength: 1000,
  maxNumberValue: Number.MAX_SAFE_INTEGER,
  allowHtml: false,
  allowSpecialChars: true,
  customPatterns: [],
  blockedPatterns: [
    /(<script[\S\s]*?<\/script>)/gi, // Script tags
    /(javascript:)/gi, // JavaScript URLs
    /(data:text\/html)/gi, // Data URLs with HTML
    /(on\w+\s*=)/gi, // Event handlers
    /(<iframe)/gi, // iframes
    /(<object)/gi, // objects
    /(<embed)/gi, // embeds
    /(eval\s*\()/gi, // eval calls
    /(document\.write)/gi, // document.write
    /(window\.location)/gi, // location changes
  ],
};

/**
 * Comprehensive Input Validator
 *
 * Validates and sanitizes user input to prevent security vulnerabilities
 * including XSS, injection attacks, and data validation issues.
 *
 * @example
 * ```typescript
 * const validator = new InputValidator({
 *   maxStringLength: 500,
 *   allowHtml: false,
 * });
 *
 * const result = validator.validateString(userInput);
 * if (result.isValid) {
 *   // Use result.sanitizedValue
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export class InputValidator {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Validate and sanitize string input
   */
  validateString(input: unknown): ValidationResult {
    const errors: string[] = [];

    // Type check
    if (typeof input !== 'string') {
      return {
        isValid: false,
        errors: ['Input must be a string'],
      };
    }

    let sanitizedValue = input;

    // Length validation
    if (
      this.config.maxStringLength &&
      input.length > this.config.maxStringLength
    ) {
      errors.push(
        `String length exceeds maximum of ${this.config.maxStringLength} characters`,
      );
      sanitizedValue = input.substring(0, this.config.maxStringLength);
    }

    // Check for blocked patterns
    for (const pattern of this.config.blockedPatterns ?? []) {
      if (pattern.test(input)) {
        errors.push(`Input contains blocked pattern: ${pattern.source}`);
        sanitizedValue = sanitizedValue.replace(pattern, '');
      }
    }

    // HTML sanitization
    if (!this.config.allowHtml) {
      const htmlPattern = /<[^>]*>/g;
      if (htmlPattern.test(sanitizedValue)) {
        sanitizedValue = sanitizedValue.replace(htmlPattern, '');
      }
    }

    // Special character validation
    if (!this.config.allowSpecialChars) {
      const specialCharPattern = /["&'<>]/g;
      sanitizedValue = sanitizedValue.replace(specialCharPattern, '');
    }

    // Custom pattern validation
    for (const pattern of this.config.customPatterns ?? []) {
      if (!pattern.test(sanitizedValue)) {
        errors.push(`Input does not match required pattern: ${pattern.source}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue,
    };
  }

  /**
   * Validate numeric input
   */
  validateNumber(input: unknown): ValidationResult {
    const errors: string[] = [];

    // Type check and conversion
    let numValue: number;
    if (typeof input === 'string') {
      numValue = parseFloat(input);
    } else if (typeof input === 'number') {
      numValue = input;
    } else {
      return {
        isValid: false,
        errors: ['Input must be a number or numeric string'],
      };
    }

    // NaN check
    if (isNaN(numValue)) {
      errors.push('Input is not a valid number');
    }

    // Infinity check
    if (!isFinite(numValue)) {
      errors.push('Input must be a finite number');
    }

    // Range validation
    if (
      this.config.maxNumberValue &&
      Math.abs(numValue) > this.config.maxNumberValue
    ) {
      errors.push(
        `Number exceeds maximum absolute value of ${this.config.maxNumberValue}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? numValue : undefined,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(input: unknown): ValidationResult {
    const stringResult = this.validateString(input);
    if (!stringResult.isValid) {
      return stringResult;
    }

    const email = stringResult.sanitizedValue as string;
    const emailPattern = /^[\w%+.-]+@[\d.A-Za-z-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(email)) {
      return {
        isValid: false,
        errors: ['Invalid email format'],
      };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedValue: email.toLowerCase().trim(),
    };
  }

  /**
   * Validate URL format
   */
  validateUrl(input: unknown): ValidationResult {
    const stringResult = this.validateString(input);
    if (!stringResult.isValid) {
      return stringResult;
    }

    const url = stringResult.sanitizedValue as string;

    try {
      const urlObj = new URL(url);

      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return {
          isValid: false,
          errors: ['URL must use HTTP or HTTPS protocol'],
        };
      }

      return {
        isValid: true,
        errors: [],
        sanitizedValue: urlObj.toString(),
      };
    } catch {
      return {
        isValid: false,
        errors: ['Invalid URL format'],
      };
    }
  }

  /**
   * Validate object structure
   */
  validateObject(input: unknown, requiredKeys: string[]): ValidationResult {
    const errors: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {
        isValid: false,
        errors: ['Input must be an object'],
      };
    }

    const obj = input as Record<string, unknown>;

    // Check for required keys
    this.validateRequiredKeys(obj, requiredKeys, errors);

    // Validate and sanitize properties
    const sanitizedObj = this.validateObjectProperties(obj, errors);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedObj,
    };
  }

  /**
   * Helper method to validate required keys
   */
  private validateRequiredKeys(
    obj: Record<string, unknown>,
    requiredKeys: string[],
    errors: string[],
  ): void {
    for (const key of requiredKeys) {
      if (!(key in obj)) {
        errors.push(`Missing required property: ${key}`);
      }
    }
  }

  /**
   * Helper method to validate object properties
   */
  private validateObjectProperties(
    obj: Record<string, unknown>,
    errors: string[],
  ): Record<string, unknown> {
    const sanitizedObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const keyResult = this.validateString(key);
      if (!keyResult.isValid) {
        errors.push(`Invalid object key: ${key}`);
        continue;
      }

      const sanitizedValue = this.validatePropertyValue(key, value, errors);
      if (sanitizedValue !== undefined) {
        sanitizedObj[keyResult.sanitizedValue as string] = sanitizedValue;
      }
    }

    return sanitizedObj;
  }

  /**
   * Helper method to validate individual property values
   */
  private validatePropertyValue(
    key: string,
    value: unknown,
    errors: string[],
  ): unknown {
    if (typeof value === 'string') {
      return this.validateStringProperty(key, value, errors);
    }

    if (typeof value === 'number') {
      return this.validateNumberProperty(key, value, errors);
    }

    return value;
  }

  /**
   * Helper method to validate string properties
   */
  private validateStringProperty(
    key: string,
    value: string,
    errors: string[],
  ): string | undefined {
    const valueResult = this.validateString(value);
    if (valueResult.isValid) {
      return valueResult.sanitizedValue as string;
    }

    errors.push(
      `Invalid value for key ${key}: ${valueResult.errors.join(', ')}`,
    );
    return undefined;
  }

  /**
   * Helper method to validate number properties
   */
  private validateNumberProperty(
    key: string,
    value: number,
    errors: string[],
  ): number | undefined {
    const valueResult = this.validateNumber(value);
    if (valueResult.isValid) {
      return valueResult.sanitizedValue as number;
    }

    errors.push(
      `Invalid value for key ${key}: ${valueResult.errors.join(', ')}`,
    );
    return undefined;
  }
}

/**
 * Security Headers Validator
 *
 * Validates security-related headers and configurations
 */
export class SecurityHeaderValidator {
  /**
   * Validate Content Security Policy
   */
  static validateCSP(csp: string): ValidationResult {
    const errors: string[] = [];

    if (!csp || typeof csp !== 'string') {
      return {
        isValid: false,
        errors: ['CSP must be a non-empty string'],
      };
    }

    // Check for dangerous directives
    const dangerousPatterns = [
      /'unsafe-eval'/i,
      /'unsafe-inline'/i,
      /data:/i,
      /\*/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(csp)) {
        errors.push(
          `CSP contains potentially unsafe directive: ${pattern.source}`,
        );
      }
    }

    // Check for required directives
    const requiredDirectives = ['default-src', 'script-src', 'style-src'];
    for (const directive of requiredDirectives) {
      if (!csp.includes(directive)) {
        errors.push(`CSP missing required directive: ${directive}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: csp,
    };
  }

  /**
   * Validate API token format
   */
  static validateApiToken(token: unknown): ValidationResult {
    if (typeof token !== 'string') {
      return {
        isValid: false,
        errors: ['API token must be a string'],
      };
    }

    const errors: string[] = [];

    // Length check
    if (token.length < 32) {
      errors.push('API token too short (minimum 32 characters)');
    }

    if (token.length > 512) {
      errors.push('API token too long (maximum 512 characters)');
    }

    // Format check (alphanumeric + some special chars)
    const tokenPattern = /^[\w.-]+$/;
    if (!tokenPattern.test(token)) {
      errors.push('API token contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: token,
    };
  }
}

/**
 * Data Sanitizer Utility
 *
 * Provides static methods for common sanitization tasks
 */
export class DataSanitizer {
  /**
   * Remove null bytes and control characters
   */
  static sanitizeControlChars(input: string): string {
    // Use safer approach to remove control characters (0-31 and 127)
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\u0000-\u001F\u007F]/g, '');
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(input: string): string {
    const htmlEntities = new Map<string, string>([
      ['&', '&amp;'],
      ['<', '&lt;'],
      ['>', '&gt;'],
      ['"', '&quot;'],
      ["'", '&#x27;'],
      ['/', '&#x2F;'],
    ]);

    return input.replace(/["&'/<>]/g, char => htmlEntities.get(char) ?? char);
  }

  /**
   * Sanitize SQL input (basic protection)
   */
  static sanitizeSql(input: string): string {
    return input
      .replace(/["';\\]/g, '') // Remove dangerous SQL characters
      .replace(
        /\b(select|insert|update|delete|drop|create|alter|exec|union)\b/gi,
        '',
      ); // Remove SQL keywords
  }

  /**
   * Normalize whitespace
   */
  static normalizeWhitespace(input: string): string {
    return input
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim(); // Remove leading/trailing whitespace
  }

  /**
   * Deep sanitize object
   */
  static deepSanitizeObject(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return this.escapeHtml(this.sanitizeControlChars(obj));
    }

    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(item => this.deepSanitizeObject(item));
      }

      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeControlChars(key);
        // Use safer property assignment to avoid object injection
        const sanitizedValue = this.deepSanitizeObject(value);
        Object.defineProperty(sanitized, sanitizedKey, {
          value: sanitizedValue,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * Rate Limiter for API calls
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 100, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) ?? [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(
      timestamp => now - timestamp < this.windowMs,
    );

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);

    return true;
  }

  /**
   * Reset attempts for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const attempts = this.attempts.get(identifier) ?? [];
    const now = Date.now();
    const validAttempts = attempts.filter(
      timestamp => now - timestamp < this.windowMs,
    );

    return Math.max(0, this.maxAttempts - validAttempts.length);
  }
}

// Export default validator instance
export const defaultValidator = new InputValidator();
export const defaultRateLimiter = new RateLimiter();
