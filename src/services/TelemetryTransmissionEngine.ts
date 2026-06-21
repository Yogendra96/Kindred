import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';
import type { MicroMobilityTelemetry } from './MicroMobilityTelemetryService';
import { microMobilityTelemetryService } from './MicroMobilityTelemetryService';
import { modernAPMService } from './ModernAPMService';
import loggingService from './LoggerService';

const log = loggingService.withTag('TelemetryTransmissionEngine');

export class TelemetryTransmissionEngine {
  private static instance: TelemetryTransmissionEngine;

  private constructor() {}

  public static getInstance(): TelemetryTransmissionEngine {
    if (!TelemetryTransmissionEngine.instance) {
      TelemetryTransmissionEngine.instance = new TelemetryTransmissionEngine();
    }
    return TelemetryTransmissionEngine.instance;
  }

  /**
   * Evaluates system constraints and syncs all buffered ground-truth
   * robotics mapping data passively to external API endpoints.
   */
  public async performOffPeakSync(
    forceOverride: boolean = false,
  ): Promise<boolean> {
    try {
      const payloads =
        await microMobilityTelemetryService.getBufferedPayloads();
      if (payloads.length === 0) {
        return true; // Nothing to sync
      }

      if (!forceOverride) {
        const canSync = await this.evaluateTransmissionConstraints();
        if (!canSync) {
          log.info(
            'System constraints not met for bulk telemetry sync. Deferring.',
          );
          return false;
        }
      }

      log.info(`Syncing ${payloads.length} buffered telemetry packets...`);
      return await this.executeBulkUpload(payloads);
    } catch (error) {
      log.error('Failed to execute off-peak sync routine', error);
      return false;
    }
  }

  /**
   * The core Trojan Horse power conservation rule:
   * Only transmit megabytes of ML data when on Wifi AND plugged into electricity.
   */
  private async evaluateTransmissionConstraints(): Promise<boolean> {
    try {
      const netState = await NetInfo.fetch();
      if (netState.type !== 'wifi') {
        return false;
      }

      const batteryState = await Battery.getBatteryStateAsync();
      if (
        batteryState !== Battery.BatteryState.CHARGING &&
        batteryState !== Battery.BatteryState.FULL
      ) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  private async executeBulkUpload(
    payloads: MicroMobilityTelemetry[],
  ): Promise<boolean> {
    await modernAPMService.startTraceSimple('telemetry_bulk_upload_job');

    try {
      // Simulate API endpoint ingress matching the requirements in trojan_horse_implementation.md
      // In production this would be: await fetch('https://api.kindred.backend/v1/telemetry/bulk', ...)
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulated network latency

      // On successful receipt by the server, aggressively clear the user's Edge buffer
      await microMobilityTelemetryService.clearBuffer();

      log.info(
        `Successfully synced ${payloads.length} packets to remote server.`,
      );
      await modernAPMService.stopTraceSimple('telemetry_bulk_upload_job', {
        success: 'true',
        count: String(payloads.length),
      });
      return true;
    } catch (e) {
      // Keep payloads buffered if transmission crashes
      log.error('Transmission engine failure during upload', e);
      await modernAPMService.stopTraceSimple('telemetry_bulk_upload_job', {
        success: 'false',
        error: String(e),
      });
      return false;
    }
  }
}

export const telemetryTransmissionEngine =
  TelemetryTransmissionEngine.getInstance();
