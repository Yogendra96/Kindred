import perf, { FirebasePerformanceTypes } from '@react-native-firebase/perf';
import { InteractionManager, Platform } from 'react-native';

interface TracingOptions {
  attributes?: Record<string, string>;
  isCustom?: boolean;
}

class PerformanceService {
  private static instance: PerformanceService;
  private static traces: Map<string, FirebasePerformanceTypes.Trace> = new Map();
  private static httpMetrics: Map<string, FirebasePerformanceTypes.HttpMetric> = new Map();
  private static isEnabled = true;

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
      await perf().setPerformanceCollectionEnabled(true);
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  static async startTrace(traceName: string, options: TracingOptions = {}): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const trace = await perf().startTrace(traceName);

      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          trace.putAttribute(key, value);
        });
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
    incrementBy: number = 1
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

  static async putMetric(traceName: string, metricName: string, value: number): Promise<void> {
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
    httpMethod: FirebasePerformanceTypes.HttpMethod
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
    }
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const metric = this.httpMetrics.get(metricId);
      if (metric) {
        if (responseInfo?.responseCode) {
          metric.setHttpResponseCode(responseInfo.responseCode);
        }
        if (responseInfo?.responseSize) {
          metric.setResponseContentType(responseInfo.contentType || 'application/json');
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
    renderTime: number
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

  async measureOperation(operationName: string, operation: () => Promise<any>): Promise<any> {
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

  async measureNetworkRequest(requestName: string, request: () => Promise<any>): Promise<any> {
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
