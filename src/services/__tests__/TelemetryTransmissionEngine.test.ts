jest.mock(
  'expo-sensors',
  () => ({
    Accelerometer: {
      isAvailableAsync: jest.fn(() => Promise.resolve(true)),
      setUpdateInterval: jest.fn(),
      addListener: jest.fn(),
    },
  }),
  { virtual: true },
);

import { telemetryTransmissionEngine } from '../TelemetryTransmissionEngine';
import { microMobilityTelemetryService } from '../MicroMobilityTelemetryService';
import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';
import { modernAPMService } from '../ModernAPMService';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('../ModernAPMService', () => ({
  modernAPMService: {
    startTraceSimple: jest.fn(() => Promise.resolve('trace-id')),
    stopTraceSimple: jest.fn(() => Promise.resolve()),
  },
}));

describe('TelemetryTransmissionEngine', () => {
  let getBufferedPayloadsMock: jest.Mock;
  let clearBufferMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    getBufferedPayloadsMock = jest.fn(() =>
      Promise.resolve([{ lat: 0, lon: 0 }]),
    );
    clearBufferMock = jest.fn(() => Promise.resolve());

    jest
      .spyOn(microMobilityTelemetryService, 'getBufferedPayloads')
      .mockImplementation(getBufferedPayloadsMock);
    jest
      .spyOn(microMobilityTelemetryService, 'clearBuffer')
      .mockImplementation(clearBufferMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects sync if NOT on wifi', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ type: 'cellular' });
    (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(2); // Charging

    const result = await telemetryTransmissionEngine.performOffPeakSync();

    expect(result).toBe(false);
    expect(modernAPMService.startTraceSimple).not.toHaveBeenCalled();
    expect(clearBufferMock).not.toHaveBeenCalled();
  });

  it('rejects sync if NOT charging', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ type: 'wifi' });
    (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(1); // Unplugged

    const result = await telemetryTransmissionEngine.performOffPeakSync();

    expect(result).toBe(false);
    expect(modernAPMService.startTraceSimple).not.toHaveBeenCalled();
    expect(clearBufferMock).not.toHaveBeenCalled();
  });

  it('accepts sync if on wifi AND charging', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ type: 'wifi' });
    (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(2); // Charging

    const result = await telemetryTransmissionEngine.performOffPeakSync();

    expect(result).toBe(true);
    expect(modernAPMService.startTraceSimple).toHaveBeenCalled();
    expect(clearBufferMock).toHaveBeenCalled();
    expect(modernAPMService.stopTraceSimple).toHaveBeenCalledWith(
      'telemetry_bulk_upload_job',
      { success: 'true', count: '1' },
    );
  });

  it('bypasses constraints on developer force override', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ type: 'cellular' });
    (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(1); // Unplugged

    // Even though network/battery constraints fail, forceOverride is true
    const result = await telemetryTransmissionEngine.performOffPeakSync(true);

    expect(result).toBe(true);
    expect(clearBufferMock).toHaveBeenCalled();
  });
});
