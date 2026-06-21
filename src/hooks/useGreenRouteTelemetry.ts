import { useState, useCallback, useEffect } from 'react';
import { microMobilityTelemetryService } from '../services/MicroMobilityTelemetryService';
import { telemetryTransmissionEngine } from '../services/TelemetryTransmissionEngine';
import loggingService from '../services/LoggerService';

const log = loggingService.withTag('useGreenRouteTelemetry');

export const useGreenRouteTelemetry = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [bufferedCount, setBufferedCount] = useState<number>(0);

  // Expose a way to monitor how many payloads are currently buffered locally
  const refreshBufferedCount = useCallback(async () => {
    const payloads = await microMobilityTelemetryService.getBufferedPayloads();
    setBufferedCount(payloads.length);
  }, []);

  const startGreenRoute = useCallback(
    async (context: 'walking' | 'cycling' = 'walking') => {
      log.info(`Initiating Green Route UI session (${context})`);
      setIsTracking(true);
      await microMobilityTelemetryService.startTracking(context);
      // Refresh count just in case there are stale buffers
      await refreshBufferedCount();
    },
    [refreshBufferedCount],
  );

  const stopGreenRoute = useCallback(async () => {
    log.info('Terminating Green Route UI session');
    setIsTracking(false);
    microMobilityTelemetryService.stopTracking();
    await refreshBufferedCount();
  }, [refreshBufferedCount]);

  // A developer override to force a data transmission right now, overriding Battery/Wifi rules
  const forceTransmission = useCallback(async () => {
    log.info('Developer override: Forcing telemetry transmission to backend');
    const success = await telemetryTransmissionEngine.performOffPeakSync(true);
    await refreshBufferedCount();
    return success;
  }, [refreshBufferedCount]);

  // Try to cleanly stop tracking if the component unmounts unexpectedly
  useEffect(() => {
    return () => {
      if (isTracking) {
        log.warn(
          'Green Route hook unmounted while active. Terminating tracking as safety measure.',
        );
        microMobilityTelemetryService.stopTracking();
      }
    };
  }, [isTracking]);

  return {
    isTracking,
    bufferedCount,
    startGreenRoute,
    stopGreenRoute,
    forceTransmission,
  };
};
