import { advancedEncryptionService } from './AdvancedEncryptionService';
import { enhancedPerformanceService } from './EnhancedPerformanceService';
import { loggingService } from './LoggingService';
import { Platform } from 'react-native';

export interface CertificatePin {
  readonly hostname: string;
  readonly pins: readonly string[]; // SHA-256 hashes
  readonly includeSubdomains: boolean;
  readonly expiryDate?: Date;
}

export interface RequestSecurityOptions {
  readonly enableSigning: boolean;
  readonly enableRateLimit: boolean;
  readonly enableRetry: boolean;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly customHeaders?: Record<string, string>;
}

export interface SignedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly body?: string;
  readonly timestamp: number;
  readonly nonce: string;
  readonly signature: string;
}

export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly blockDurationMs: number;
}

export interface ApiSecurityConfig {
  readonly certificatePinning: boolean;
  readonly requestSigning: boolean;
  readonly apiKeyRotation: boolean;
  readonly rateLimiting: boolean;
  readonly tlsVersion: '1.2' | '1.3';
  readonly allowInsecure: boolean;
}

class NetworkSecurityService {
  private readonly config: ApiSecurityConfig;
  private readonly certificatePins: Map<string, CertificatePin> = new Map();
  private readonly rateLimiters: Map<string, RateLimiter> = new Map();
  private readonly requestNonces: Set<string> = new Set();
  private apiKeyRotationTimer?: NodeJS.Timeout;
  private currentApiKey?: string;

  // Default certificate pins for production
  private readonly DEFAULT_PINS: readonly CertificatePin[] = [
    {
      hostname: 'api.kindred.app',
      pins: [
        'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary cert
        'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup cert
      ],
      includeSubdomains: true,
      expiryDate: new Date('2025-12-31'),
    },
    {
      hostname: 'auth.kindred.app',
      pins: [
        'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
        'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=',
      ],
      includeSubdomains: false,
    },
  ] as const;

  constructor() {
    this.config = {
      certificatePinning: !__DEV__,
      requestSigning: true,
      apiKeyRotation: true,
      rateLimiting: true,
      tlsVersion: '1.3',
      allowInsecure: __DEV__,
    };

    // Initialize default certificate pins
    this.initializeCertificatePins();
  }

  async initialize(): Promise<void> {
    const startTime = Date.now();

    try {
      // Initialize API key
      await this.initializeApiKey();

      // Start API key rotation if enabled
      if (this.config.apiKeyRotation) {
        this.startApiKeyRotation();
      }

      // Initialize rate limiters
      this.initializeRateLimiters();

      enhancedPerformanceService.recordMetric(
        'network_security_init',
        Date.now() - startTime,
        'ms',
      );

      loggingService.info('Network Security Service initialized', {
        certificatePinning: this.config.certificatePinning,
        requestSigning: this.config.requestSigning,
        apiKeyRotation: this.config.apiKeyRotation,
        tlsVersion: this.config.tlsVersion,
      });
    } catch (error) {
      loggingService.error('Network Security Service initialization failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Make a secure HTTP request with all security features enabled
   */
  async makeSecureRequest(
    url: string,
    options: RequestInit & RequestSecurityOptions = {},
  ): Promise<Response> {
    const startTime = Date.now();

    try {
      // Validate URL and extract hostname
      const urlObject = new URL(url);
      const hostname = urlObject.hostname;

      // Certificate pinning validation
      if (this.config.certificatePinning) {
        await this.validateCertificatePin(hostname);
      }

      // Rate limiting check
      if (this.config.rateLimiting && options.enableRateLimit !== false) {
        await this.checkRateLimit(hostname);
      }

      // Prepare secure request
      const secureOptions = await this.prepareSecureRequest(url, options);

      // Execute request with retry logic
      const response = await this.executeRequestWithRetry(url, secureOptions);

      // Validate response
      await this.validateResponse(response);

      enhancedPerformanceService.recordMetric(
        'secure_request_time',
        Date.now() - startTime,
        'ms',
      );

      return response;
    } catch (error) {
      loggingService.error('Secure request failed', {
        url: this.sanitizeUrl(url),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Sign a request with HMAC for integrity verification
   */
  async signRequest(
    method: string,
    url: string,
    body?: string,
    headers: Record<string, string> = {},
  ): Promise<SignedRequest> {
    try {
      const timestamp = Date.now().toString();
      const nonce = this.generateNonce();
      const requestData = `${method.toUpperCase()}${url}${timestamp}${nonce}${
        body || ''
      }`;

      // Get signing key
      const signingKey = await this.getSigningKey();

      // Create HMAC signature
      const signature = await advancedEncryptionService.createHMAC(
        requestData,
        signingKey,
      );

      const signedHeaders = {
        ...headers,
        'X-API-Key': await this.getCurrentApiKey(),
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
        'X-Client-Version': this.getClientVersion(),
        'X-Device-Fingerprint': await this.getDeviceFingerprint(),
        'X-Request-ID': this.generateRequestId(),
      };

      // Store nonce to prevent replay attacks
      this.storeNonce(nonce);

      return {
        url,
        method: method.toUpperCase(),
        headers: signedHeaders,
        body,
        timestamp: parseInt(timestamp, 10),
        nonce,
        signature,
      };
    } catch (error) {
      loggingService.error('Request signing failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Request signing failed');
    }
  }

  /**
   * Verify request signature (for incoming requests if needed)
   */
  async verifyRequestSignature(signedRequest: SignedRequest): Promise<boolean> {
    try {
      const { method, url, body, timestamp, nonce, signature } = signedRequest;

      // Check timestamp (prevent replay attacks)
      const now = Date.now();
      const requestAge = now - timestamp;
      const maxAge = 5 * 60 * 1000; // 5 minutes

      if (requestAge > maxAge) {
        loggingService.warn('Request signature verification failed: expired', {
          requestAge,
          maxAge,
        });
        return false;
      }

      // Check nonce (prevent replay attacks)
      if (this.requestNonces.has(nonce)) {
        loggingService.warn(
          'Request signature verification failed: nonce reuse',
          {
            nonce,
          },
        );
        return false;
      }

      // Recreate signature
      const requestData = `${method}${url}${timestamp}${nonce}${body || ''}`;
      const signingKey = await this.getSigningKey();
      const expectedSignature = await advancedEncryptionService.createHMAC(
        requestData,
        signingKey,
      );

      // Verify signature
      const isValid = await advancedEncryptionService.verifyHMAC(
        requestData,
        signature,
        signingKey,
      );

      if (!isValid) {
        loggingService.warn(
          'Request signature verification failed: invalid signature',
        );
        return false;
      }

      return true;
    } catch (error) {
      loggingService.error('Request signature verification error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Add or update certificate pin for a hostname
   */
  addCertificatePin(pin: CertificatePin): void {
    this.certificatePins.set(pin.hostname, pin);
    loggingService.info('Certificate pin added', {
      hostname: pin.hostname,
      pinCount: pin.pins.length,
      includeSubdomains: pin.includeSubdomains,
    });
  }

  /**
   * Remove certificate pin for a hostname
   */
  removeCertificatePin(hostname: string): void {
    this.certificatePins.delete(hostname);
    loggingService.info('Certificate pin removed', { hostname });
  }

  /**
   * Get current API key with automatic rotation
   */
  async getCurrentApiKey(): Promise<string> {
    if (!this.currentApiKey) {
      await this.initializeApiKey();
    }
    return this.currentApiKey!;
  }

  /**
   * Manually rotate API key
   */
  async rotateApiKey(): Promise<void> {
    try {
      const newApiKey = await this.generateApiKey();
      const oldApiKey = this.currentApiKey;

      this.currentApiKey = newApiKey;

      loggingService.info('API key rotated', {
        oldKeyHash: oldApiKey
          ? await advancedEncryptionService.hashData(oldApiKey)
          : 'none',
        newKeyHash: await advancedEncryptionService.hashData(newApiKey),
      });
    } catch (error) {
      loggingService.error('API key rotation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Private methods

  private initializeCertificatePins(): void {
    for (const pin of this.DEFAULT_PINS) {
      this.certificatePins.set(pin.hostname, pin);
    }
  }

  private async initializeApiKey(): Promise<void> {
    this.currentApiKey = await this.generateApiKey();
  }

  private async generateApiKey(): Promise<string> {
    const randomBytes = advancedEncryptionService.generateSecureRandomBytes(32);
    const apiKey = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    return `ak_${apiKey}`;
  }

  private startApiKeyRotation(): void {
    const rotationInterval = 24 * 60 * 60 * 1000; // 24 hours

    this.apiKeyRotationTimer = setInterval(async () => {
      try {
        await this.rotateApiKey();
      } catch (error) {
        loggingService.error('Scheduled API key rotation failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, rotationInterval);
  }

  private initializeRateLimiters(): void {
    const defaultConfig: RateLimitConfig = {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes
    };

    // Initialize rate limiters for common domains
    const domains = ['api.kindred.app', 'auth.kindred.app'];
    for (const domain of domains) {
      this.rateLimiters.set(domain, new RateLimiter(defaultConfig));
    }
  }

  private async validateCertificatePin(hostname: string): Promise<void> {
    const pin = this.certificatePins.get(hostname);

    if (!pin) {
      // Check for subdomain pins
      const subdomainPin = Array.from(this.certificatePins.values()).find(
        p => p.includeSubdomains && hostname.endsWith(`.${p.hostname}`),
      );

      if (!subdomainPin) {
        if (!this.config.allowInsecure) {
          throw new Error(`No certificate pin found for ${hostname}`);
        }
        loggingService.warn(
          'No certificate pin found, allowing insecure connection',
          {
            hostname,
          },
        );
        return;
      }
    }

    // In a real implementation, this would validate the actual certificate
    // For now, we'll just log the validation attempt
    loggingService.debug('Certificate pin validation', {
      hostname,
      pinCount: pin?.pins.length || 0,
    });
  }

  private async checkRateLimit(hostname: string): Promise<void> {
    const rateLimiter = this.rateLimiters.get(hostname);

    if (rateLimiter) {
      const isAllowed = await rateLimiter.isRequestAllowed();

      if (!isAllowed) {
        throw new Error(`Rate limit exceeded for ${hostname}`);
      }
    }
  }

  private async prepareSecureRequest(
    url: string,
    options: RequestInit & RequestSecurityOptions,
  ): Promise<RequestInit> {
    const {
      enableSigning = this.config.requestSigning,
      timeout = 30000,
      customHeaders = {},
      ...fetchOptions
    } = options;

    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': this.getUserAgent(),
      ...customHeaders,
    };

    // Add security headers
    headers = {
      ...headers,
      'X-Requested-With': 'XMLHttpRequest',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    };

    // Sign request if enabled
    if (enableSigning) {
      const method = fetchOptions.method || 'GET';
      const body =
        typeof fetchOptions.body === 'string' ? fetchOptions.body : undefined;

      const signedRequest = await this.signRequest(method, url, body, headers);
      headers = signedRequest.headers;
    }

    return {
      ...fetchOptions,
      headers,
      // Note: timeout would be handled by AbortController in a full implementation
    };
  }

  private async executeRequestWithRetry(
    url: string,
    options: RequestInit & { maxRetries?: number; enableRetry?: boolean },
  ): Promise<Response> {
    const maxRetries = options.maxRetries || 3;
    const enableRetry = options.enableRetry !== false;

    let lastError: Error | undefined;

    for (
      let attempt = 1;
      attempt <= (enableRetry ? maxRetries : 1);
      attempt++
    ) {
      try {
        const response = await fetch(url, options);

        if (response.ok) {
          return response;
        }

        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Retry server errors (5xx) and network errors
        if (attempt < maxRetries && enableRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff
          await this.sleep(delay);
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries && enableRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private async validateResponse(response: Response): Promise<void> {
    // Validate response headers
    const contentType = response.headers.get('content-type');

    if (contentType && !contentType.includes('application/json')) {
      loggingService.warn('Unexpected response content type', {
        contentType,
        url: this.sanitizeUrl(response.url),
      });
    }

    // Check for security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
    ];

    for (const header of securityHeaders) {
      if (!response.headers.get(header)) {
        loggingService.warn('Missing security header in response', {
          header,
          url: this.sanitizeUrl(response.url),
        });
      }
    }
  }

  private generateNonce(): string {
    const bytes = advancedEncryptionService.generateSecureRandomBytes(16);
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `req_${timestamp}_${random}`;
  }

  private storeNonce(nonce: string): void {
    this.requestNonces.add(nonce);

    // Clean up old nonces (keep only last 1000)
    if (this.requestNonces.size > 1000) {
      const noncesArray = Array.from(this.requestNonces);
      const toDelete = noncesArray.slice(0, noncesArray.length - 1000);
      for (const oldNonce of toDelete) {
        this.requestNonces.delete(oldNonce);
      }
    }
  }

  private async getSigningKey(): Promise<string> {
    // In a real implementation, this would retrieve a secure signing key
    // For now, we'll use a derived key from the API key
    const apiKey = await this.getCurrentApiKey();
    return await advancedEncryptionService.hashData(`signing_${apiKey}`);
  }

  private async getDeviceFingerprint(): Promise<string> {
    // This would typically be provided by the RuntimeSecurityService
    return 'device_fingerprint_placeholder';
  }

  private getClientVersion(): string {
    // This would typically come from app config
    return '1.0.0';
  }

  private getUserAgent(): string {
    return `Kindred/${this.getClientVersion()} (${Platform.OS} ${
      Platform.Version
    })`;
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObject = new URL(url);
      return `${urlObject.protocol}//${urlObject.hostname}${urlObject.pathname}`;
    } catch {
      return 'invalid-url';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup network security service
   */
  cleanup(): void {
    if (this.apiKeyRotationTimer) {
      clearInterval(this.apiKeyRotationTimer);
      this.apiKeyRotationTimer = undefined;
    }

    this.certificatePins.clear();
    this.rateLimiters.clear();
    this.requestNonces.clear();
    this.currentApiKey = undefined;

    loggingService.info('Network Security Service cleaned up');
  }
}

/**
 * Rate limiter implementation
 */
class RateLimiter {
  private requests: number[] = [];
  private blockedUntil = 0;

  constructor(private config: RateLimitConfig) {}

  async isRequestAllowed(): Promise<boolean> {
    const now = Date.now();

    // Check if currently blocked
    if (now < this.blockedUntil) {
      return false;
    }

    // Clean old requests outside the window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.config.windowMs,
    );

    // Check if we've exceeded the limit
    if (this.requests.length >= this.config.maxRequests) {
      this.blockedUntil = now + this.config.blockDurationMs;
      loggingService.warn('Rate limit exceeded, blocking requests', {
        requestCount: this.requests.length,
        maxRequests: this.config.maxRequests,
        blockedUntil: this.blockedUntil,
      });
      return false;
    }

    // Add current request
    this.requests.push(now);
    return true;
  }
}

// Create and export singleton instance
export const networkSecurityService = new NetworkSecurityService();
export default networkSecurityService;
