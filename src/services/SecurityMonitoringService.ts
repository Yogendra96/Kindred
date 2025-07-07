import { advancedEncryptionService } from './AdvancedEncryptionService';
import { deviceAttestationService } from './DeviceAttestationService';
import { enhancedPerformanceService } from './EnhancedPerformanceService';
import { loggingService } from './LoggingService';
import { mfaService } from './MFAService';
import { networkSecurityService } from './NetworkSecurityService';
import { runtimeSecurityService } from './RuntimeSecurityService';
import type { AppStateStatus } from 'react-native';
import { Platform, AppState } from 'react-native';
import * as Keychain from 'react-native-keychain';

export interface SecurityEvent {
  readonly id: string;
  readonly type: SecurityEventType;
  readonly severity: SecuritySeverity;
  readonly timestamp: number;
  readonly source: string;
  readonly description: string;
  readonly metadata?: Record<string, unknown>;
  readonly userId?: string;
  readonly deviceId?: string;
  readonly sessionId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly location?: string;
}

export type SecurityEventType =
  | 'authentication_failed'
  | 'authentication_success'
  | 'authorization_denied'
  | 'suspicious_activity'
  | 'device_compromise'
  | 'data_access'
  | 'configuration_change'
  | 'policy_violation'
  | 'malware_detected'
  | 'network_anomaly'
  | 'privilege_escalation'
  | 'data_exfiltration'
  | 'injection_attempt'
  | 'brute_force_attack'
  | 'account_lockout';

export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAlert {
  readonly id: string;
  readonly eventId: string;
  readonly title: string;
  readonly description: string;
  readonly severity: SecuritySeverity;
  readonly timestamp: number;
  readonly acknowledged: boolean;
  readonly response?: SecurityResponse;
}

export interface SecurityResponse {
  readonly action: 'block' | 'monitor' | 'alert' | 'log' | 'quarantine';
  readonly timestamp: number;
  readonly automated: boolean;
  readonly details?: string;
}

export interface SecurityMetrics {
  readonly totalEvents: number;
  readonly eventsByType: Record<SecurityEventType, number>;
  readonly eventsBySeverity: Record<SecuritySeverity, number>;
  readonly alertsGenerated: number;
  readonly alertsAcknowledged: number;
  readonly averageResponseTime: number;
  readonly topThreats: readonly string[];
  readonly riskScore: number;
  readonly periodStart: number;
  readonly periodEnd: number;
}

export interface MonitoringConfig {
  readonly enableRealTimeMonitoring: boolean;
  readonly enableThreatDetection: boolean;
  readonly enableBehaviorAnalysis: boolean;
  readonly enableAnomalyDetection: boolean;
  readonly alertThresholds: Record<SecuritySeverity, number>;
  readonly retentionPeriod: number; // days
  readonly maxEventQueueSize: number;
  readonly monitoringInterval: number; // milliseconds
}

export interface ThreatIntelligence {
  readonly threatType: string;
  readonly indicators: readonly string[];
  readonly severity: SecuritySeverity;
  readonly description: string;
  readonly mitigations: readonly string[];
  readonly lastUpdated: number;
}

class SecurityMonitoringService {
  private readonly config: MonitoringConfig;
  private readonly eventQueue: SecurityEvent[] = [];
  private readonly alerts: Map<string, SecurityAlert> = new Map();
  private readonly threatIntelligence: Map<string, ThreatIntelligence> =
    new Map();
  private readonly behaviorBaseline: Map<string, number> = new Map();

  private monitoringInterval?: ReturnType<typeof setTimeout>;
  private appStateSubscription?: any;
  private isMonitoring = false;
  private eventCounter = 0;
  private lastRiskAssessment = 0;

  // Analytics tracking
  private readonly analytics = {
    eventCounts: new Map<SecurityEventType, number>(),
    severityCounts: new Map<SecuritySeverity, number>(),
    responseTime: [] as number[],
    threatTrends: new Map<string, number>(),
  };

  constructor() {
    this.config = {
      enableRealTimeMonitoring: true,
      enableThreatDetection: true,
      enableBehaviorAnalysis: true,
      enableAnomalyDetection: true,
      alertThresholds: {
        info: 100,
        low: 50,
        medium: 20,
        high: 5,
        critical: 1,
      },
      retentionPeriod: 30, // 30 days
      maxEventQueueSize: 1000,
      monitoringInterval: 5000, // 5 seconds
    };

    // Initialize threat intelligence
    this.initializeThreatIntelligence();
  }

  public async initialize(): Promise<void> {
    const startTime = Date.now();

    try {
      // Load existing events and alerts
      await this.loadSecurityData();

      // Start real-time monitoring
      if (this.config.enableRealTimeMonitoring) {
        this.startRealTimeMonitoring();
      }

      // Set up app state monitoring
      this.setupAppStateMonitoring();

      // Initialize behavior baselines
      await this.initializeBehaviorBaselines();

      // Start threat detection
      if (this.config.enableThreatDetection) {
        this.startThreatDetection();
      }

      enhancedPerformanceService.recordMetric(
        'security_monitoring_init',
        Date.now() - startTime,
        'ms',
      );

      // Log initialization
      await this.logSecurityEvent({
        type: 'configuration_change',
        severity: 'info',
        source: 'SecurityMonitoringService',
        description: 'Security monitoring service initialized',
        metadata: {
          realTimeMonitoring: this.config.enableRealTimeMonitoring,
          threatDetection: this.config.enableThreatDetection,
          behaviorAnalysis: this.config.enableBehaviorAnalysis,
          anomalyDetection: this.config.enableAnomalyDetection,
        },
      });

      loggingService.info('Security Monitoring Service initialized', {
        eventQueueSize: this.eventQueue.length,
        alertsCount: this.alerts.size,
        threatIntelligenceCount: this.threatIntelligence.size,
      });
    } catch (error) {
      loggingService.error(
        'Security Monitoring Service initialization failed',
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }
  }

  /**
   * Log a security event
   */
  public async logSecurityEvent(
    eventData: Omit<SecurityEvent, 'id' | 'timestamp'>,
  ): Promise<string> {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...eventData,
    };

    // Add event to queue
    this.addEventToQueue(event);

    // Update analytics
    this.updateAnalytics(event);

    // Check for threats
    if (this.config.enableThreatDetection) {
      await this.analyzeThreat(event);
    }

    // Check for anomalies
    if (this.config.enableAnomalyDetection) {
      await this.detectAnomalies(event);
    }

    // Generate alerts if needed
    await this.processEventAlerts(event);

    // Log to persistent storage
    await this.persistSecurityEvent(event);

    loggingService.debug('Security event logged', {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      source: event.source,
    });

    return event.id;
  }

  /**
   * Get security events with filtering
   */
  public getSecurityEvents(filter?: {
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    source?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): SecurityEvent[] {
    let events = [...this.eventQueue];

    if (filter) {
      if (filter.type) {
        events = events.filter(e => e.type === filter.type);
      }
      if (filter.severity) {
        events = events.filter(e => e.severity === filter.severity);
      }
      if (filter.source) {
        events = events.filter(e => e.source === filter.source);
      }
      if (filter.startTime) {
        events = events.filter(e => e.timestamp >= (filter.startTime as number));
      }
      if (filter.endTime) {
        events = events.filter(e => e.timestamp <= (filter.endTime as number));
      }
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    if (filter?.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  /**
   * Get active security alerts
   */
  public getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge a security alert
   */
  public async acknowledgeAlert(
    alertId: string,
    response?: Omit<SecurityResponse, 'timestamp' | 'automated'>,
  ): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    const updatedAlert: SecurityAlert = {
      ...alert,
      acknowledged: true,
      response: response
        ? {
            ...response,
            timestamp: Date.now(),
            automated: false,
          }
        : undefined,
    };

    this.alerts.set(alertId, updatedAlert);

    // Log the acknowledgment
    await this.logSecurityEvent({
      type: 'configuration_change',
      severity: 'info',
      source: 'SecurityMonitoringService',
      description: `Security alert acknowledged: ${alertId}`,
      metadata: {
        alertId,
        originalSeverity: alert.severity,
        response: response?.action,
      },
    });

    loggingService.info('Security alert acknowledged', {
      alertId,
      severity: alert.severity,
      response: response?.action,
    });
  }

  /**
   * Get security metrics for a time period
   */
  public getSecurityMetrics(startTime?: number, endTime?: number): SecurityMetrics {
    const start = startTime || Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
    const end = endTime || Date.now();

    const events = this.getSecurityEvents({ startTime: start, endTime: end });

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] =
        (eventsBySeverity[event.severity] || 0) + 1;
    }

    const alerts = Array.from(this.alerts.values()).filter(
      alert => alert.timestamp >= start && alert.timestamp <= end,
    );

    const topThreats = Array.from(this.analytics.threatTrends.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([threat]) => threat);

    const riskScore = this.calculateRiskScore(events);

    return {
      totalEvents: events.length,
      eventsByType: eventsByType as Record<SecurityEventType, number>,
      eventsBySeverity: eventsBySeverity as Record<SecuritySeverity, number>,
      alertsGenerated: alerts.length,
      alertsAcknowledged: alerts.filter(a => a.acknowledged).length,
      averageResponseTime: this.calculateAverageResponseTime(),
      topThreats,
      riskScore,
      periodStart: start,
      periodEnd: end,
    };
  }

  /**
   * Perform comprehensive security assessment
   */
  public async performSecurityAssessment(): Promise<{
    overallRisk: SecuritySeverity;
    recommendations: readonly string[];
    findings: readonly SecurityEvent[];
  }> {
    const findings: SecurityEvent[] = [];
    const recommendations: string[] = [];

    try {
      // Check runtime security
      const runtimeAssessment =
        await runtimeSecurityService.performSecurityAssessment();
      if (!runtimeAssessment.isSecure) {
        findings.push({
          id: this.generateEventId(),
          type: 'device_compromise',
          severity: runtimeAssessment.riskLevel as SecuritySeverity,
          timestamp: Date.now(),
          source: 'RuntimeSecurityService',
          description: `Runtime security assessment failed: ${runtimeAssessment.threats.length} threats detected`,
          metadata: { threats: runtimeAssessment.threats },
        });
        recommendations.push('Address runtime security threats immediately');
      }

      // Check device attestation
      const deviceAttestation =
        await deviceAttestationService.performDeviceAttestation();
      if (!deviceAttestation.isValid) {
        findings.push({
          id: this.generateEventId(),
          type: 'device_compromise',
          severity: 'high',
          timestamp: Date.now(),
          source: 'DeviceAttestationService',
          description: 'Device attestation failed',
          metadata: {
            confidence: deviceAttestation.confidence,
            riskFactors: deviceAttestation.riskFactors,
          },
        });
        recommendations.push('Verify device integrity and trust status');
      }

      // Check MFA status
      const mfaState = mfaService.getAuthenticationState();
      if (!mfaState.isAuthenticated) {
        findings.push({
          id: this.generateEventId(),
          type: 'authentication_failed',
          severity: 'medium',
          timestamp: Date.now(),
          source: 'MFAService',
          description: 'User not authenticated with MFA',
          metadata: { authState: mfaState },
        });
        recommendations.push('Ensure proper multi-factor authentication');
      }

      // Analyze recent security events
      const recentEvents = this.getSecurityEvents({
        startTime: Date.now() - 60 * 60 * 1000, // Last hour
        limit: 100,
      });

      const criticalEvents = recentEvents.filter(
        e => e.severity === 'critical',
      );
      if (criticalEvents.length > 0) {
        recommendations.push(
          'Investigate and respond to critical security events',
        );
      }

      // Calculate overall risk
      const overallRisk = this.calculateOverallRisk(findings);

      // Log security assessment
      await this.logSecurityEvent({
        type: 'configuration_change',
        severity: 'info',
        source: 'SecurityMonitoringService',
        description: 'Comprehensive security assessment completed',
        metadata: {
          overallRisk,
          findingsCount: findings.length,
          recommendationsCount: recommendations.length,
        },
      });

      return {
        overallRisk,
        recommendations,
        findings,
      };
    } catch (error) {
      await this.logSecurityEvent({
        type: 'configuration_change',
        severity: 'high',
        source: 'SecurityMonitoringService',
        description: 'Security assessment failed',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return {
        overallRisk: 'high',
        recommendations: ['Fix security assessment system'],
        findings: [],
      };
    }
  }

  /**
   * Export security data for compliance
   */
  public async exportSecurityData(format: 'json' | 'csv' = 'json'): Promise<string> {
    const events = this.getSecurityEvents();
    const alerts = Array.from(this.alerts.values());
    const metrics = this.getSecurityMetrics();

    const exportData = {
      exportTimestamp: Date.now(),
      events,
      alerts,
      metrics,
      configuration: this.config,
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // CSV format implementation would go here
      return 'CSV export not implemented';
    }
  }

  // Private methods

  private addEventToQueue(event: SecurityEvent): void {
    this.eventQueue.push(event);

    // Maintain queue size limit
    if (this.eventQueue.length > this.config.maxEventQueueSize) {
      this.eventQueue.shift(); // Remove oldest event
    }
  }

  private updateAnalytics(event: SecurityEvent): void {
    // Update event type counts
    const typeCount = this.analytics.eventCounts.get(event.type) || 0;
    this.analytics.eventCounts.set(event.type, typeCount + 1);

    // Update severity counts
    const severityCount =
      this.analytics.severityCounts.get(event.severity) || 0;
    this.analytics.severityCounts.set(event.severity, severityCount + 1);

    // Update threat trends
    if (event.type.includes('attack') || event.type.includes('malware')) {
      const threatCount = this.analytics.threatTrends.get(event.type) || 0;
      this.analytics.threatTrends.set(event.type, threatCount + 1);
    }
  }

  private async analyzeThreat(event: SecurityEvent): Promise<void> {
    // Check against threat intelligence
    for (const [threatType, intelligence] of this.threatIntelligence) {
      const isMatch = intelligence.indicators.some(
        indicator =>
          event.description.toLowerCase().includes(indicator.toLowerCase()) ||
          JSON.stringify(event.metadata || {})
            .toLowerCase()
            .includes(indicator.toLowerCase()),
      );

      if (isMatch) {
        await this.logSecurityEvent({
          type: 'malware_detected',
          severity: intelligence.severity,
          source: 'ThreatIntelligence',
          description: `Threat detected: ${threatType}`,
          metadata: {
            originalEventId: event.id,
            threatType,
            indicators: intelligence.indicators,
            mitigations: intelligence.mitigations,
          },
        });
      }
    }
  }

  private async detectAnomalies(event: SecurityEvent): Promise<void> {
    // Simple anomaly detection based on frequency
    const recentEvents = this.getSecurityEvents({
      type: event.type,
      startTime: Date.now() - 60 * 60 * 1000, // Last hour
    });

    const baseline = this.behaviorBaseline.get(event.type) || 5;

    if (recentEvents.length > baseline * 3) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        source: 'AnomalyDetection',
        description: `Anomalous activity detected: ${event.type}`,
        metadata: {
          eventCount: recentEvents.length,
          baseline,
          threshold: baseline * 3,
        },
      });
    }
  }

  private async processEventAlerts(event: SecurityEvent): Promise<void> {
    const threshold = this.config.alertThresholds[event.severity];

    // Check if we should generate an alert
    const recentSimilarEvents = this.getSecurityEvents({
      type: event.type,
      severity: event.severity,
      startTime: Date.now() - 60 * 60 * 1000, // Last hour
    });

    if (recentSimilarEvents.length >= threshold) {
      const alert: SecurityAlert = {
        id: this.generateAlertId(),
        eventId: event.id,
        title: `Security Alert: ${event.type}`,
        description: `${event.severity.toUpperCase()} severity event detected: ${
          event.description
        }`,
        severity: event.severity,
        timestamp: Date.now(),
        acknowledged: false,
      };

      this.alerts.set(alert.id, alert);

      // Auto-respond to critical alerts
      if (event.severity === 'critical') {
        await this.autoRespond(alert, event);
      }
    }
  }

  private async autoRespond(
    alert: SecurityAlert,
    event: SecurityEvent,
  ): Promise<void> {
    let action: SecurityResponse['action'] = 'monitor';

    // Determine appropriate automatic response
    switch (event.type) {
      case 'brute_force_attack':
      case 'injection_attempt':
        action = 'block';
        break;
      case 'malware_detected':
      case 'device_compromise':
        action = 'quarantine';
        break;
      case 'data_exfiltration':
        action = 'alert';
        break;
      default:
        action = 'monitor';
    }

    const response: SecurityResponse = {
      action,
      timestamp: Date.now(),
      automated: true,
      details: `Automatic response to ${event.severity} ${event.type}`,
    };

    const updatedAlert: SecurityAlert = {
      ...alert,
      response,
    };

    this.alerts.set(alert.id, updatedAlert);

    await this.logSecurityEvent({
      type: 'configuration_change',
      severity: 'info',
      source: 'AutoResponse',
      description: `Automatic security response: ${action}`,
      metadata: {
        alertId: alert.id,
        originalEventId: event.id,
        action,
      },
    });
  }

  private startRealTimeMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        // Perform periodic security checks
        await this.performPeriodicChecks();

        // Clean up old events
        this.cleanupOldEvents();

        // Update threat intelligence
        await this.updateThreatIntelligence();
      } catch (error) {
        loggingService.error('Real-time monitoring check failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, this.config.monitoringInterval);

    loggingService.info('Real-time security monitoring started');
  }

  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this),
    );
  }

  private async handleAppStateChange(
    nextAppState: AppStateStatus,
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'configuration_change',
      severity: 'info',
      source: 'AppStateMonitor',
      description: `App state changed to: ${nextAppState}`,
      metadata: { appState: nextAppState },
    });

    if (nextAppState === 'active') {
      // Perform security check when app becomes active
      setTimeout(async () => {
        await this.performSecurityAssessment();
      }, 1000);
    }
  }

  private async performPeriodicChecks(): Promise<void> {
    // Check if it's time for risk assessment
    if (Date.now() - this.lastRiskAssessment > 60 * 60 * 1000) {
      // Every hour
      await this.performSecurityAssessment();
      this.lastRiskAssessment = Date.now();
    }

    // Monitor system resources
    const metrics = this.getSecurityMetrics(Date.now() - 60 * 60 * 1000); // Last hour

    if (metrics.riskScore > 80) {
      await this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        source: 'PeriodicCheck',
        description: 'High risk score detected',
        metadata: { riskScore: metrics.riskScore, metrics },
      });
    }
  }

  private cleanupOldEvents(): void {
    const cutoffTime =
      Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000;

    const initialCount = this.eventQueue.length;
    const filteredEvents = this.eventQueue.filter(
      event => event.timestamp > cutoffTime,
    );

    if (filteredEvents.length !== initialCount) {
      this.eventQueue.splice(0, this.eventQueue.length, ...filteredEvents);

      loggingService.debug('Cleaned up old security events', {
        removedCount: initialCount - filteredEvents.length,
        remainingCount: filteredEvents.length,
      });
    }
  }

  private async updateThreatIntelligence(): Promise<void> {
    // In a real implementation, this would fetch latest threat intelligence
    // For now, we'll just update timestamps
    for (const [key, intelligence] of this.threatIntelligence) {
      if (Date.now() - intelligence.lastUpdated > 24 * 60 * 60 * 1000) {
        // Update threat intelligence (simplified)
        this.threatIntelligence.set(key, {
          ...intelligence,
          lastUpdated: Date.now(),
        });
      }
    }
  }

  private async initializeBehaviorBaselines(): Promise<void> {
    // Initialize baseline behavior patterns
    const eventTypes: SecurityEventType[] = [
      'authentication_failed',
      'authentication_success',
      'data_access',
      'suspicious_activity',
    ];

    for (const eventType of eventTypes) {
      const recentEvents = this.getSecurityEvents({
        type: eventType,
        startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      });

      const dailyAverage = recentEvents.length / 7;
      this.behaviorBaseline.set(
        eventType,
        Math.max(1, Math.ceil(dailyAverage)),
      );
    }
  }

  private initializeThreatIntelligence(): void {
    // Initialize with basic threat intelligence
    this.threatIntelligence.set('sql_injection', {
      threatType: 'sql_injection',
      indicators: ['SELECT', 'DROP', 'UNION', '--', ';--', 'xp_cmdshell'],
      severity: 'high',
      description: 'SQL injection attack attempt',
      mitigations: ['Input validation', 'Parameterized queries', 'WAF'],
      lastUpdated: Date.now(),
    });

    this.threatIntelligence.set('xss', {
      threatType: 'xss',
      indicators: ['<script>', 'javascript:', 'onerror=', 'onload='],
      severity: 'medium',
      description: 'Cross-site scripting attempt',
      mitigations: [
        'Output encoding',
        'Content Security Policy',
        'Input sanitization',
      ],
      lastUpdated: Date.now(),
    });

    this.threatIntelligence.set('malware', {
      threatType: 'malware',
      indicators: ['trojan', 'virus', 'malware', 'backdoor', 'rootkit'],
      severity: 'critical',
      description: 'Malware detection',
      mitigations: ['Quarantine', 'System scan', 'Incident response'],
      lastUpdated: Date.now(),
    });
  }

  private calculateRiskScore(events: SecurityEvent[]): number {
    let score = 0;

    for (const event of events) {
      switch (event.severity) {
        case 'critical':
          score += 25;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
        case 'info':
          score += 1;
          break;
      }
    }

    return Math.min(100, score);
  }

  private calculateOverallRisk(findings: SecurityEvent[]): SecuritySeverity {
    if (findings.some(f => f.severity === 'critical')) return 'critical';
    if (findings.some(f => f.severity === 'high')) return 'high';
    if (findings.some(f => f.severity === 'medium')) return 'medium';
    if (findings.some(f => f.severity === 'low')) return 'low';
    return 'info';
  }

  private calculateAverageResponseTime(): number {
    if (this.analytics.responseTime.length === 0) return 0;

    const sum = this.analytics.responseTime.reduce((a, b) => a + b, 0);
    return sum / this.analytics.responseTime.length;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async persistSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const eventData = JSON.stringify(event);
      const encrypted = await advancedEncryptionService.encryptData(eventData);

      await Keychain.setInternetCredentials(
        `security_event_${event.id}`,
        'system',
        JSON.stringify(encrypted),
        {
          accessControl:
            Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        },
      );
    } catch (error) {
      loggingService.error('Failed to persist security event', {
        eventId: event.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async loadSecurityData(): Promise<void> {
    try {
      // In a real implementation, this would load events from secure storage
      loggingService.debug('Security data loaded from storage');
    } catch (error) {
      loggingService.warn('Failed to load security data', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private startThreatDetection(): void {
    // Initialize threat detection algorithms
    loggingService.info('Threat detection started');
  }

  /**
   * Cleanup security monitoring service
   */
  public cleanup(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = undefined;
    }

    // Clear sensitive data
    this.eventQueue.length = 0;
    this.alerts.clear();
    this.threatIntelligence.clear();
    this.behaviorBaseline.clear();
    this.analytics.eventCounts.clear();
    this.analytics.severityCounts.clear();
    this.analytics.threatTrends.clear();

    loggingService.info('Security Monitoring Service cleaned up');
  }
}

// Create and export singleton instance
export const securityMonitoringService = new SecurityMonitoringService();
export default securityMonitoringService;
