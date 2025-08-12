import { InteractionManager, Platform } from 'react-native';

// Global type declarations
declare global {
  var __DEV__: boolean;
}

// React Native imports are now at the top

// Mock Firebase Performance for development
interface MockTrace {
  start(): void;
  stop(): void;
  putAttribute(name: string, value: string): void;
  incrementMetric(name: string, value?: number): void;
}

interface MockHttpMetric {
  start(): void;
  stop(): void;
  setHttpResponseCode(code: number): void;
  setRequestPayloadSize(bytes: number): void;
  setResponseContentType(contentType: string): void;
  setResponsePayloadSize(bytes: number): void;
  putAttribute(name: string, value: string): void;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const mockPerf = {
  setPerformanceCollectionEnabled: async (_enabled: boolean) => {},
  trace: (_name: string): MockTrace => ({
    start: () => {},
    stop: () => {},
    putAttribute: () => {},
    incrementMetric: () => {},
  }),
  httpMetric: (_url: string, _method: HttpMethod): MockHttpMetric => ({
    start: () => {},
    stop: () => {},
    setHttpResponseCode: () => {},
    setRequestPayloadSize: () => {},
    setResponseContentType: () => {},
    setResponsePayloadSize: () => {},
    putAttribute: () => {},
  }),
};

// InteractionManager and Platform are now imported at the top

interface TracingOptions {
  attributes?: Record<string, string>;
  isCustom?: boolean;
}

class PerformanceService {
  private static instance: PerformanceService;
  private static traces: Map<string, MockTrace> = new Map();
  private static httpMetrics: Map<string, MockHttpMetric> = new Map();
  private static isEnabled = true;
  private traces: Map<string, MockTrace>;
  private isEnabled: boolean;

  private constructor() {
    this.traces = new Map();
    this.isEnabled = __DEV__ ? false : true;
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  static async initialize(): Promise<void> {
    try {
      await mockPerf.setPerformanceCollectionEnabled(true);
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  static async startTrace(
    traceName: string,
    options: TracingOptions = {},
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const trace = await perf().startTrace(traceName);

      if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
          trace.putAttribute(key, value);
        }
      }

      this.traces.set(traceName, trace);
    } catch (error) {
      console.error('Failed to start trace:', error);
    }
  }

  static async stopTrace(traceName: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        await trace.stop();
        this.traces.delete(traceName);
      }
    } catch (error) {
      console.error('Failed to stop trace:', error);
    }
  }

  static async incrementMetric(
    traceName: string,
    metricName: string,
    incrementBy: number = 1,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.incrementMetric(metricName, incrementBy);
      }
    } catch (error) {
      console.error('Failed to increment metric:', error);
    }
  }

  static async putMetric(
    traceName: string,
    metricName: string,
    value: number,
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const trace = this.traces.get(traceName);
      if (trace) {
        trace.putMetric(metricName, value);
      }
    } catch (error) {
      console.error('Failed to put metric:', error);
    }
  }

  static async startNetworkMonitoring(
    url: string,
    httpMethod: HttpMethod,
  ): Promise<string> {
    if (!this.isEnabled) return '';

    try {
      const metric = await perf().newHttpMetric(url, httpMethod);
      const metricId = `${httpMethod}_${url}_${Date.now()}`;
      this.httpMetrics.set(metricId, metric);
      await metric.start();
      return metricId;
    } catch (error) {
      console.error('Failed to start network monitoring:', error);
      return '';
    }
  }

  static async stopNetworkMonitoring(
    metricId: string,
    responseInfo?: {
      responseCode?: number;
      responseSize?: number;
      contentType?: string;
    },
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const metric = this.httpMetrics.get(metricId);
      if (metric) {
        if (responseInfo?.responseCode) {
          metric.setHttpResponseCode(responseInfo.responseCode);
        }
        if (responseInfo?.responseSize) {
          metric.setResponseContentType(
            responseInfo.contentType || 'application/json',
          );
          metric.setResponsePayloadSize(responseInfo.responseSize);
        }
        await metric.stop();
        this.httpMetrics.delete(metricId);
      }
    } catch (error) {
      console.error('Failed to stop network monitoring:', error);
    }
  }

  static async measureScreenLoadTime(screenName: string): Promise<void> {
    const traceName = `screen_load_${screenName}`;
    await this.startTrace(traceName, {
      attributes: {
        screen: screenName,
        platform: Platform.OS,
      },
    });

    // Return a cleanup function to be called when the screen unmounts
    return async () => {
      await this.stopTrace(traceName);
    };
  }

  static async measureComponentRenderTime(
    componentName: string,
    renderTime: number,
  ): Promise<void> {
    const traceName = `component_render_${componentName}`;
    await this.startTrace(traceName, {
      attributes: {
        component: componentName,
        platform: Platform.OS,
      },
    });
    await this.putMetric(traceName, 'render_time', renderTime);
    await this.stopTrace(traceName);
  }

  static enablePerformanceCollection(): void {
    this.isEnabled = true;
    perf().setPerformanceCollectionEnabled(true);
  }

  static disablePerformanceCollection(): void {
    this.isEnabled = false;
    perf().setPerformanceCollectionEnabled(false);
  }

  async measureScreenLoad(screenName: string): Promise<void> {
    const traceName = `screen_load_${screenName}`;
    await PerformanceService.startTrace(traceName);

    InteractionManager.runAfterInteractions(async () => {
      await PerformanceService.stopTrace(traceName);
    });
  }

  async measureOperation(
    operationName: string,
    operation: () => Promise<any>,
  ): Promise<any> {
    const traceName = `operation_${operationName}`;
    await PerformanceService.startTrace(traceName);

    try {
      const startTime = Date.now();
      const result = await operation();
      const duration = Date.now() - startTime;

      await PerformanceService.stopTrace(traceName, {
        duration_ms: duration,
      });

      return result;
    } catch (error) {
      await PerformanceService.stopTrace(traceName, {
        error: 1,
        duration_ms: Date.now() - performance.now(),
      });
      throw error;
    }
  }

  async measureNetworkRequest(
    requestName: string,
    request: () => Promise<any>,
  ): Promise<any> {
    if (!this.isEnabled) return request();

    const trace = await perf().startTrace(`network_${requestName}`);
    const httpMetric = await perf().newHttpMetric(requestName, 'GET');

    try {
      await httpMetric.start();
      const startTime = Date.now();
      const response = await request();
      const duration = Date.now() - startTime;

      httpMetric.setHttpResponseCode(response?.status || 200);
      httpMetric.setResponseContentType(response?.headers?.['content-type']);
      await httpMetric.stop();

      trace.putMetric('duration_ms', duration);
      trace.putMetric('response_size', JSON.stringify(response).length);
      await trace.stop();

      return response;
    } catch (error) {
      httpMetric.setHttpResponseCode(error?.response?.status || 500);
      await httpMetric.stop();

      trace.putMetric('error', 1);
      await trace.stop();

      throw error;
    }
  }

  enableMonitoring(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

export const performanceService = PerformanceService.getInstance();
export default performanceService;
