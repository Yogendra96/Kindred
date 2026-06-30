// @ts-nocheck
/* eslint-disable */
import { modernAPMService } from './ModernAPMService';
import { zeroTrustSecurityService } from './ZeroTrustSecurityService';
import loggingService from './LoggerService';
import { Platform } from 'react-native';

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
  maxMessageQueueSize: number;
  enableCompression: boolean;
  authToken?: string;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount?: number;
}

export interface WebSocketEventHandler {
  (message: WebSocketMessage): void | Promise<void>;
}

export interface ConnectionStats {
  isConnected: boolean;
  reconnectAttempts: number;
  lastConnected?: Date;
  lastDisconnected?: Date;
  messagesSent: number;
  messagesReceived: number;
  queuedMessages: number;
  averageLatency: number;
  errors: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private connectionStats: ConnectionStats;
  private latencyTracking: Map<string, number> = new Map();

  constructor() {
    this.config = {
      url: process.env.WEBSOCKET_URL || 'wss://api.kindred.app/ws',
      reconnectAttempts: 5,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
      maxMessageQueueSize: 100,
      enableCompression: true,
    };

    this.connectionStats = {
      isConnected: false,
      reconnectAttempts: 0,
      messagesSent: 0,
      messagesReceived: 0,
      queuedMessages: 0,
      averageLatency: 0,
      errors: 0,
    };
  }

  async initialize(config?: Partial<WebSocketConfig>): Promise<void> {
    const startTime = Date.now();

    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Set auth token from security service
      const authToken = await zeroTrustSecurityService.secureRetrieve('auth_token');
      if (authToken) {
        this.config.authToken = authToken;
      }

      loggingService.info('WebSocket service initialized', {
        url: this.config.url,
        reconnectAttempts: this.config.reconnectAttempts,
      });

      modernAPMService.recordMetric({
        name: 'websocket_service_init',
        value: Date.now() - startTime,
        unit: 'ms',
        severity: 'low',
      });
    } catch (error) {
      loggingService.error('WebSocket service initialization failed', {
        error: error.message,
      });
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      loggingService.warn('WebSocket already connected');
      return;
    }

    const startTime = Date.now();

    try {
      await this.establishConnection();

      this.connectionStats.lastConnected = new Date();
      this.connectionStats.isConnected = true;
      this.connectionStats.reconnectAttempts = 0;

      // Start heartbeat
      this.startHeartbeat();

      // Process queued messages
      await this.processMessageQueue();

      modernAPMService.recordMetric({
        name: 'websocket_connection_time',
        value: Date.now() - startTime,
        unit: 'ms',
        severity: 'low',
      });

      loggingService.info('WebSocket connected successfully');
    } catch (error) {
      this.connectionStats.errors++;
      loggingService.error('WebSocket connection failed', {
        error: error.message,
      });

      if (!this.isReconnecting) {
        this.scheduleReconnect();
      }

      throw error;
    }
  }

  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.buildConnectionUrl();
        const protocols = this.config.protocols || [];

        this.ws = new WebSocket(wsUrl, protocols);

        // Configure WebSocket options
        if (Platform.OS !== 'web') {
          // React Native specific configurations
          (this.ws as any).binaryType = 'arraybuffer';
        }

        this.ws.onopen = event => {
          loggingService.info('WebSocket connection opened');
          this.setupEventHandlers();
          resolve();
        };

        this.ws.onclose = event => {
          this.handleDisconnection(event.code, event.reason);
        };

        this.ws.onerror = error => {
          loggingService.error('WebSocket error', { error });
          this.connectionStats.errors++;
          reject(new Error(`WebSocket connection error: ${error}`));
        };

        this.ws.onmessage = event => {
          this.handleIncomingMessage(event.data);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private buildConnectionUrl(): string {
    const url = new URL(this.config.url);

    // Add authentication
    if (this.config.authToken) {
      url.searchParams.set('token', this.config.authToken);
    }

    // Add client info
    url.searchParams.set('platform', Platform.OS);
    url.searchParams.set('version', '1.0.0');

    // Add compression support
    if (this.config.enableCompression) {
      url.searchParams.set('compression', 'gzip');
    }

    return url.toString();
  }

  private setupEventHandlers(): void {
    // Send connection acknowledgment
    this.sendMessage({
      id: this.generateMessageId(),
      type: 'connection_ack',
      payload: {
        platform: Platform.OS,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      priority: 'high',
    });
  }

  private handleIncomingMessage(data: string | ArrayBuffer): void {
    try {
      const messageData = typeof data === 'string' ? data : this.arrayBufferToString(data);
      const message: WebSocketMessage = JSON.parse(messageData);

      // Track latency for ping/pong messages
      if (message.type === 'pong' && message.id) {
        const sentTime = this.latencyTracking.get(message.id);
        if (sentTime) {
          const latency = Date.now() - sentTime;
          this.updateLatencyStats(latency);
          this.latencyTracking.delete(message.id);
        }
      }

      this.connectionStats.messagesReceived++;

      // Emit to registered handlers
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(async handler => {
          try {
            await handler(message);
          } catch (error) {
            loggingService.error('Error in WebSocket message handler', {
              messageType: message.type,
              error: error.message,
            });
          }
        });
      }

      loggingService.debug('WebSocket message received', {
        type: message.type,
        id: message.id,
      });
    } catch (error) {
      loggingService.error('Error parsing WebSocket message', {
        error: error.message,
      });
    }
  }

  private arrayBufferToString(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    return binaryString;
  }

  private handleDisconnection(code: number, reason: string): void {
    this.connectionStats.isConnected = false;
    this.connectionStats.lastDisconnected = new Date();

    this.stopHeartbeat();

    loggingService.warn('WebSocket disconnected', { code, reason });

    // Emit disconnection event
    this.emitEvent('connection_lost', {
      code,
      reason,
      timestamp: Date.now(),
    });

    // Schedule reconnection for non-intentional disconnections
    if (code !== 1000 && !this.isReconnecting) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.connectionStats.reconnectAttempts >= this.config.reconnectAttempts) {
      loggingService.error('Max reconnection attempts reached');
      this.emitEvent('connection_failed', {
        attempts: this.connectionStats.reconnectAttempts,
        timestamp: Date.now(),
      });
      return;
    }

    this.isReconnecting = true;
    this.connectionStats.reconnectAttempts++;

    const delay = this.config.reconnectInterval * this.connectionStats.reconnectAttempts;

    this.reconnectTimer = setTimeout(async () => {
      try {
        loggingService.info('Attempting WebSocket reconnection', {
          attempt: this.connectionStats.reconnectAttempts,
        });

        await this.connect();
        this.isReconnecting = false;
      } catch (error) {
        loggingService.error('Reconnection attempt failed', {
          error: error.message,
        });
        this.scheduleReconnect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const pingId = this.generateMessageId();
        this.latencyTracking.set(pingId, Date.now());

        this.sendMessage({
          id: pingId,
          type: 'ping',
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
          priority: 'low',
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private updateLatencyStats(latency: number): void {
    const totalLatency = this.connectionStats.averageLatency * this.connectionStats.messagesSent;
    this.connectionStats.averageLatency =
      (totalLatency + latency) / (this.connectionStats.messagesSent + 1);

    modernAPMService.recordMetric({
      name: 'websocket_latency',
      value: latency,
      unit: 'ms',
      severity: 'low',
    });
  }

  async sendMessage(message: WebSocketMessage): Promise<void> {
    // Add to queue if not connected
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.queueMessage(message);
      return;
    }

    try {
      const messageData = JSON.stringify(message);

      // Send based on priority
      this.ws.send(messageData);

      this.connectionStats.messagesSent++;

      loggingService.debug('WebSocket message sent', {
        type: message.type,
        id: message.id,
        priority: message.priority,
      });
    } catch (error) {
      loggingService.error('Error sending WebSocket message', {
        error: error.message,
        messageType: message.type,
      });

      // Queue message for retry
      this.queueMessage(message);
    }
  }

  private queueMessage(message: WebSocketMessage): void {
    // Remove oldest low-priority messages if queue is full
    if (this.messageQueue.length >= this.config.maxMessageQueueSize) {
      const lowPriorityIndex = this.messageQueue.findIndex(msg => msg.priority === 'low');
      if (lowPriorityIndex !== -1) {
        this.messageQueue.splice(lowPriorityIndex, 1);
      } else {
        this.messageQueue.shift(); // Remove oldest message
      }
    }

    // Insert message based on priority
    const insertIndex = this.messageQueue.findIndex(
      msg => this.getPriorityValue(msg.priority) < this.getPriorityValue(message.priority),
    );

    if (insertIndex === -1) {
      this.messageQueue.push(message);
    } else {
      this.messageQueue.splice(insertIndex, 0, message);
    }

    this.connectionStats.queuedMessages = this.messageQueue.length;

    loggingService.debug('Message queued', {
      type: message.type,
      priority: message.priority,
      queueSize: this.messageQueue.length,
    });
  }

  private getPriorityValue(priority: string): number {
    const priorities = { low: 1, normal: 2, high: 3, critical: 4 };
    return priorities[priority] || 2;
  }

  private async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      await this.sendMessage(message);
    }

    this.connectionStats.queuedMessages = this.messageQueue.length;
  }

  subscribe(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler);

    loggingService.debug('WebSocket event handler subscribed', { eventType });

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(eventType);
        }
      }
    };
  }

  private emitEvent(eventType: string, payload: any): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: eventType,
      payload,
      timestamp: Date.now(),
      priority: 'normal',
    };

    this.handleIncomingMessage(JSON.stringify(message));
  }

  disconnect(): void {
    this.isReconnecting = false;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connectionStats.isConnected = false;
    this.connectionStats.lastDisconnected = new Date();

    loggingService.info('WebSocket disconnected by client');
  }

  getConnectionStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.connectionStats.isConnected;
  }

  async updateAuthToken(token: string): Promise<void> {
    this.config.authToken = token;
    await zeroTrustSecurityService.secureStore('auth_token', token);

    // Reconnect with new token if currently connected
    if (this.isConnected()) {
      this.disconnect();
      await this.connect();
    }
  }

  private generateMessageId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for common message types
  async sendCarbonUpdate(carbonData: any): Promise<void> {
    await this.sendMessage({
      id: this.generateMessageId(),
      type: 'carbon_update',
      payload: carbonData,
      timestamp: Date.now(),
      priority: 'normal',
    });
  }

  async sendAchievementUnlock(achievement: any): Promise<void> {
    await this.sendMessage({
      id: this.generateMessageId(),
      type: 'achievement_unlocked',
      payload: achievement,
      timestamp: Date.now(),
      priority: 'high',
    });
  }

  async sendChallengeProgress(progress: any): Promise<void> {
    await this.sendMessage({
      id: this.generateMessageId(),
      type: 'challenge_progress',
      payload: progress,
      timestamp: Date.now(),
      priority: 'normal',
    });
  }

  async sendFriendActivity(activity: any): Promise<void> {
    await this.sendMessage({
      id: this.generateMessageId(),
      type: 'friend_activity',
      payload: activity,
      timestamp: Date.now(),
      priority: 'normal',
    });
  }

  async joinRoom(roomId: string): Promise<void> {
    await this.sendMessage({
      id: this.generateMessageId(),
      type: 'join_room',
      payload: { roomId },
      timestamp: Date.now(),
      priority: 'high',
    });
  }

  async leaveRoom(roomId: string): Promise<void> {
    await this.sendMessage({
      id: this.generateMessageId(),
      type: 'leave_room',
      payload: { roomId },
      timestamp: Date.now(),
      priority: 'high',
    });
  }

  async sendChatMessage(roomId: string, message: string): Promise<void> {
    await this.sendMessage({
      id: this.generateMessageId(),
      type: 'chat_message',
      payload: { roomId, message },
      timestamp: Date.now(),
      priority: 'normal',
    });
  }
}

// Create and export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
