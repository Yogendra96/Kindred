import type { AccelerometerMeasurement } from 'expo-sensors';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationService } from './LocationService';
import loggingService from './LoggerService';

const log = loggingService.withTag('MicroMobilityTelemetry');

export type MicroMobilityTelemetry = {
  timestamp: number;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  surfaceVibrationHertz: number; // Derived from accelerometer FFT/Variance
  routingContext: 'walking' | 'cycling';
};

const TELEMETRY_STORAGE_KEY = '@kindred_telemetry_buffer';
const BUFFER_DUMP_THRESHOLD = 50; // Save to disk after 50 readings
const ACCELEROMETER_INTERVAL_MS = 200; // 5 Hz

export class MicroMobilityTelemetryService {
  private static instance: MicroMobilityTelemetryService;
  private isActive: boolean = false;
  private accelSubscription: any = null;
  private memoryBuffer: AccelerometerMeasurement[] = [];
  private currentContext: 'walking' | 'cycling' = 'walking';

  private constructor() {}

  public static getInstance(): MicroMobilityTelemetryService {
    if (!MicroMobilityTelemetryService.instance) {
      MicroMobilityTelemetryService.instance =
        new MicroMobilityTelemetryService();
    }
    return MicroMobilityTelemetryService.instance;
  }

  public async startTracking(context: 'walking' | 'cycling' = 'walking') {
    if (this.isActive) return;
    this.currentContext = context;
    this.isActive = true;

    try {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        log.warn('Accelerometer is not available on this device');
        return;
      }

      Accelerometer.setUpdateInterval(ACCELEROMETER_INTERVAL_MS);
      this.accelSubscription = Accelerometer.addListener(data => {
        this.processSensorData(data);
      });
      log.info(`Started green route telemetry tracking (${context})`);
    } catch (e) {
      log.error('Failed to start accelerometer', e);
      this.isActive = false;
    }
  }

  public stopTracking() {
    if (!this.isActive) return;
    if (this.accelSubscription) {
      this.accelSubscription.remove();
      this.accelSubscription = null;
    }
    this.isActive = false;
    // Flush remaining memory buffer
    this.processBufferDump();
    log.info('Stopped green route telemetry tracking');
  }

  private async processSensorData(data: AccelerometerMeasurement) {
    this.memoryBuffer.push(data);

    if (this.memoryBuffer.length >= BUFFER_DUMP_THRESHOLD) {
      this.processBufferDump();
    }
  }

  private async processBufferDump() {
    if (this.memoryBuffer.length === 0) return;

    // Shallow copy and clear immediately to prevent race conditions during async dumping
    const chunk = [...this.memoryBuffer];
    this.memoryBuffer = [];

    // Derive the approximate surface roughness (Vibration Hertz variance)
    const zVariance = this.calculateVariance(chunk.map(c => c.z));

    try {
      // In a real production mapping, this passive GPS poll can be augmented
      // by the explicit routing hook. For now we fetch the last known GPS coordinate.
      const location = await locationService.getCurrentLocation();

      const payload: MicroMobilityTelemetry = {
        timestamp: Date.now(),
        lat: location.latitude,
        lon: location.longitude,
        altitude: location.altitude || 0,
        speed: location.speed || 0,
        surfaceVibrationHertz: Math.min(Math.max(zVariance * 100, 0), 100), // Scale variance roughly to a 0-100 metric
        routingContext: this.currentContext,
      };

      await this.saveToDisk(payload);
    } catch (e) {
      // If location fails, we silently drop the chunk.
      // Do not log aggressively to save battery/disk space.
    }
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b) / values.length;
  }

  private async saveToDisk(payload: MicroMobilityTelemetry) {
    try {
      const existingRaw = await AsyncStorage.getItem(TELEMETRY_STORAGE_KEY);
      let existing: MicroMobilityTelemetry[] = [];
      if (existingRaw) {
        existing = JSON.parse(existingRaw);
      }

      existing.push(payload);

      // Safety limit: Don't let the telemetry buffer exceed ~5000 items (approx sequence of an hour walk at 1 item per 10s dump)
      if (existing.length > 5000) {
        existing = existing.slice(existing.length - 5000);
      }

      await AsyncStorage.setItem(
        TELEMETRY_STORAGE_KEY,
        JSON.stringify(existing),
      );
    } catch (e) {
      log.error('Failed to write telemetry payload to Edge buffer', e);
    }
  }

  public async getBufferedPayloads(): Promise<MicroMobilityTelemetry[]> {
    try {
      const existingRaw = await AsyncStorage.getItem(TELEMETRY_STORAGE_KEY);
      if (existingRaw) {
        return JSON.parse(existingRaw) as MicroMobilityTelemetry[];
      }
    } catch (e) {
      log.error('Failed to read buffered payloads', e);
    }
    return [];
  }

  public async clearBuffer() {
    try {
      await AsyncStorage.removeItem(TELEMETRY_STORAGE_KEY);
    } catch (e) {
      log.error('Failed to clear telemetry buffer', e);
    }
  }
}

export const microMobilityTelemetryService =
  MicroMobilityTelemetryService.getInstance();
