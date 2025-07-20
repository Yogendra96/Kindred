import { Platform } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import _Keychain from 'react-native-keychain';

import { loggingService } from './LoggingService';

// Global type declarations
declare global {
  var __DEV__: boolean;
}

// Use Timer type instead of NodeJS.Timeout namespace
// type Timer = ReturnType<typeof setInterval>; // TODO: Add when needed

interface SecurityConfig {
  encryptionKey?: string;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  enableBiometrics?: boolean;
  enablePinLock?: boolean;
  dataRetentionDays?: number;
}

interface SecurityEvent {
  type: 'login' | 'logout' | 'failed_login' | 'data_access' | 'security_violation';
  timestamp: number;
  userId?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SessionData {
  userId: string;
  token: string;
  expiresAt: number;
  lastActivity: number;
  deviceId: string;
}

/**
 * Enhanced Security Service for comprehensive app security
 */
export class EnhancedSecurityService {
  private static instance: EnhancedSecurityService;
  private logger: typeof loggingService;
  private sessionTimeout: ReturnType<typeof setTimeout> | null = null;
  private config: SecurityConfig;
  private securityEvents: SecurityEvent[] = [];
  private currentSession: SessionData | null = null;
  private loginAttempts: Map<string, number> = new Map();
  private encryptionKey: string;

  private constructor(config: SecurityConfig = {}) {
    this.logger = loggingService;
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      enableBiometrics: true,
      enablePinLock: false,
      dataRetentionDays: 30,
      ...config,
    };
    this.encryptionKey = config.encryptionKey || this.generateEncryptionKey();
  }

  static getInstance(config?: SecurityConfig): EnhancedSecurityService {
    if (!EnhancedSecurityService.instance) {
      EnhancedSecurityService.instance = new EnhancedSecurityService(config);
    }
    return EnhancedSecurityService.instance;
  }

  /**
   * Initialize security service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadSecurityEvents();
      await this.validateExistingSession();
      this.setupSecurityMonitoring();
      this.cleanupOldData();
      this.logger.info('Enhanced security service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize security service:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Securely store data
   */
  async secureStore(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const encryptedValue = this.encrypt(serializedValue);
      await AsyncStorage.setItem(`secure_${key}`, encryptedValue);

      this.logSecurityEvent({
        type: 'data_access',
        timestamp: Date.now(),
        details: { action: 'store', key },
        severity: 'low',
      });
    } catch (error) {
      this.logger.error('Secure store failed:', error);
      throw error;
    }
  }

  /**
   * Securely retrieve data
   */
  async secureRetrieve(key: string): Promise<any> {
    try {
      const encryptedValue = await AsyncStorage.getItem(`secure_${key}`);
      if (!encryptedValue) return null;

      const decryptedValue = this.decrypt(encryptedValue);
      const value = JSON.parse(decryptedValue);

      this.logSecurityEvent({
        type: 'data_access',
        timestamp: Date.now(),
        details: { action: 'retrieve', key },
        severity: 'low',
      });

      return value;
    } catch (error) {
      this.logger.error('Secure retrieve failed:', error);
      return null;
    }
  }

  /**
   * Securely remove data
   */
  async secureRemove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`secure_${key}`);

      this.logSecurityEvent({
        type: 'data_access',
        timestamp: Date.now(),
        details: { action: 'remove', key },
        severity: 'low',
      });
    } catch (error) {
      this.logger.error('Secure remove failed:', error);
      throw error;
    }
  }

  /**
   * Create a secure session
   */
  async createSession(userId: string, token: string): Promise<SessionData> {
    try {
      const deviceId = await this.getDeviceId();
      const session: SessionData = {
        userId,
        token,
        expiresAt: Date.now() + this.config.sessionTimeout!,
        lastActivity: Date.now(),
        deviceId,
      };

      await this.secureStore('current_session', session);
      this.currentSession = session;

      this.logSecurityEvent({
        type: 'login',
        timestamp: Date.now(),
        userId,
        details: { deviceId },
        severity: 'medium',
      });

      // Reset login attempts on successful login
      this.loginAttempts.delete(userId);

      return session;
    } catch (error) {
      this.logger.error('Session creation failed:', error);
      throw error;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        this.currentSession = await this.secureRetrieve('current_session');
      }

      if (!this.currentSession) return false;

      const now = Date.now();

      // Check if session expired
      if (now > this.currentSession.expiresAt) {
        await this.destroySession();
        return false;
      }

      // Update last activity
      this.currentSession.lastActivity = now;
      this.currentSession.expiresAt = now + this.config.sessionTimeout!;
      await this.secureStore('current_session', this.currentSession);

      return true;
    } catch (error) {
      this.logger.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Destroy current session
   */
  async destroySession(): Promise<void> {
    try {
      if (this.currentSession) {
        this.logSecurityEvent({
          type: 'logout',
          timestamp: Date.now(),
          userId: this.currentSession.userId,
          severity: 'medium',
        });
      }

      await this.secureRemove('current_session');
      this.currentSession = null;
    } catch (error) {
      this.logger.error('Session destruction failed:', error);
    }
  }

  /**
   * Record failed login attempt
   */
  recordFailedLogin(userId: string): boolean {
    const attempts = (this.loginAttempts.get(userId) || 0) + 1;
    this.loginAttempts.set(userId, attempts);

    this.logSecurityEvent({
      type: 'failed_login',
      timestamp: Date.now(),
      userId,
      details: { attempts },
      severity: attempts >= this.config.maxLoginAttempts! ? 'high' : 'medium',
    });

    return attempts >= this.config.maxLoginAttempts!;
  }

  /**
   * Check if user is locked out
   */
  isUserLockedOut(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId) || 0;
    return attempts >= this.config.maxLoginAttempts!;
  }

  /**
   * Reset login attempts for user
   */
  resetLoginAttempts(userId: string): void {
    this.loginAttempts.delete(userId);
  }

  /**
   * Validate data integrity
   */
  validateDataIntegrity(data: any, expectedHash?: string): boolean {
    try {
      const dataString = JSON.stringify(data);
      const hash = CryptoJS.SHA256(dataString).toString();

      if (expectedHash) {
        return hash === expectedHash;
      }

      return true; // If no expected hash, assume valid
    } catch (error) {
      this.logger.error('Data integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Generate data hash for integrity checking
   */
  generateDataHash(data: any): string {
    try {
      const dataString = JSON.stringify(data);
      return CryptoJS.SHA256(dataString).toString();
    } catch (error) {
      this.logger.error('Hash generation failed:', error);
      throw error;
    }
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate input against common injection patterns
   */
  validateInput(input: string): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // SQL injection patterns
    const sqlPatterns = [
      /('|(--)|(;)|(\|)|(\*))/i,
      /(exec(\s|\+)+(s|x)p\w+)/i,
      /union.*select/i,
      /insert.*into/i,
      /delete.*from/i,
      /update.*set/i,
    ];

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
    ];

    // Check SQL injection
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        violations.push('Potential SQL injection detected');
        break;
      }
    }

    // Check XSS
    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        violations.push('Potential XSS attack detected');
        break;
      }
    }

    if (violations.length > 0) {
      this.logSecurityEvent({
        type: 'security_violation',
        timestamp: Date.now(),
        details: { input: input.substring(0, 100), violations },
        severity: 'high',
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Get current session info
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Get security events
   */
  getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Get security summary
   */
  getSecuritySummary(): any {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.securityEvents.filter(event => event.timestamp > last24Hours);
    const criticalEvents = recentEvents.filter(event => event.severity === 'critical');
    const highSeverityEvents = recentEvents.filter(event => event.severity === 'high');
    const failedLogins = recentEvents.filter(event => event.type === 'failed_login');

    return {
      session: {
        isActive: !!this.currentSession,
        userId: this.currentSession?.userId,
        expiresAt: this.currentSession?.expiresAt,
        lastActivity: this.currentSession?.lastActivity,
      },
      events: {
        total: this.securityEvents.length,
        last24Hours: recentEvents.length,
        critical: criticalEvents.length,
        highSeverity: highSeverityEvents.length,
        failedLogins: failedLogins.length,
      },
      lockouts: {
        activeUsers: [...this.loginAttempts.entries()]
          .filter(([_, attempts]) => attempts >= this.config.maxLoginAttempts!)
          .map(([userId]) => userId),
      },
      config: {
        sessionTimeout: this.config.sessionTimeout,
        maxLoginAttempts: this.config.maxLoginAttempts,
        enableBiometrics: this.config.enableBiometrics,
        enablePinLock: this.config.enablePinLock,
      },
    };
  }

  /**
   * Log security event
   */
  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.shift();
    }

    // Log to console in development
    if (__DEV__) {
      const logLevel = event.severity === 'critical' || event.severity === 'high' ? 'warn' : 'info';
      this.logger[logLevel](`Security event: ${event.type}`, event);
    }

    // Save to storage periodically
    this.saveSecurityEvents();
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  /**
   * Get device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = CryptoJS.lib.WordArray.random(128 / 8).toString();
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      this.logger.error('Failed to get device ID:', error);
      return 'unknown';
    }
  }

  /**
   * Validate existing session on startup
   */
  private async validateExistingSession(): Promise<void> {
    try {
      const session = await this.secureRetrieve('current_session');
      if (session) {
        const now = Date.now();
        if (now <= session.expiresAt) {
          this.currentSession = session;
        } else {
          await this.secureRemove('current_session');
        }
      }
    } catch (error) {
      this.logger.error('Failed to validate existing session:', error);
    }
  }

  /**
   * Setup security monitoring
   */
  private setupSecurityMonitoring(): void {
    // Monitor for suspicious activity patterns
    setInterval(
      () => {
        this.analyzeSecurityPatterns();
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }

  /**
   * Analyze security patterns
   */
  private analyzeSecurityPatterns(): void {
    const now = Date.now();
    const last10Minutes = now - 10 * 60 * 1000;

    const recentEvents = this.securityEvents.filter(event => event.timestamp > last10Minutes);
    const failedLogins = recentEvents.filter(event => event.type === 'failed_login');

    // Check for brute force attacks
    if (failedLogins.length > 10) {
      this.logSecurityEvent({
        type: 'security_violation',
        timestamp: now,
        details: {
          pattern: 'potential_brute_force',
          count: failedLogins.length,
        },
        severity: 'critical',
      });
    }
  }

  /**
   * Load security events from storage
   */
  private async loadSecurityEvents(): Promise<void> {
    try {
      const events = await this.secureRetrieve('security_events');
      if (events && Array.isArray(events)) {
        this.securityEvents = events;
      }
    } catch (error) {
      this.logger.error('Failed to load security events:', error);
    }
  }

  /**
   * Save security events to storage
   */
  private async saveSecurityEvents(): Promise<void> {
    try {
      await this.secureStore('security_events', this.securityEvents);
    } catch (error) {
      this.logger.error('Failed to save security events:', error);
    }
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.config.dataRetentionDays! * 24 * 60 * 60 * 1000;
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoffTime);
  }

  /**
   * Export security data for analysis
   */
  exportSecurityData(): any {
    return {
      summary: this.getSecuritySummary(),
      events: this.securityEvents,
      config: this.config,
      metadata: {
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Clear all security data
   */
  async clearSecurityData(): Promise<void> {
    try {
      this.securityEvents = [];
      this.loginAttempts.clear();
      await this.destroySession();
      await this.secureRemove('security_events');
      this.logger.info('Security data cleared');
    } catch (error) {
      this.logger.error('Failed to clear security data:', error);
    }
  }
}

// Create and export singleton instance
export const enhancedSecurityService = EnhancedSecurityService.getInstance();
export default EnhancedSecurityService;
