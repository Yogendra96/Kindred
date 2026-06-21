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

import { microMobilityTelemetryService } from '../MicroMobilityTelemetryService';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationService } from '../LocationService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../LocationService', () => ({
  locationService: {
    getCurrentLocation: jest.fn(() =>
      Promise.resolve({
        latitude: 40.7128,
        longitude: -74.006,
        altitude: 10,
        speed: 1.5,
      }),
    ),
  },
}));

describe('MicroMobilityTelemetryService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await microMobilityTelemetryService.clearBuffer();
  });

  afterEach(() => {
    microMobilityTelemetryService.stopTracking();
  });

  it('starts tracking correctly', async () => {
    const addListenerMock = jest.fn(() => ({ remove: jest.fn() }));
    (Accelerometer.addListener as jest.Mock).mockImplementationOnce(
      addListenerMock,
    );

    await microMobilityTelemetryService.startTracking('walking');

    expect(Accelerometer.isAvailableAsync).toHaveBeenCalled();
    expect(Accelerometer.setUpdateInterval).toHaveBeenCalledWith(200);
    expect(Accelerometer.addListener).toHaveBeenCalled();
  });

  it('calculates variance and dumps buffer effectively', async () => {
    let mockCallback = (data: any) => {};
    const addListenerMock = jest.fn(callback => {
      mockCallback = callback;
      return { remove: jest.fn() };
    });
    (Accelerometer.addListener as jest.Mock).mockImplementation(
      addListenerMock,
    );

    await microMobilityTelemetryService.startTracking('walking');

    // Simulate 50 accelerometer readings (the BUFFER_DUMP_THRESHOLD)
    for (let i = 0; i < 50; i++) {
      // Simulate varying vibration on Z axis
      const vibrationZ = 1.0 + (i % 2 === 0 ? 0.3 : -0.2);
      mockCallback({ x: 0, y: 0, z: vibrationZ, timestamp: Date.now() });
    }

    // Process buffer dump is async internally inside processSensorData
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(AsyncStorage.setItem).toHaveBeenCalled();

    // Evaluate written data
    const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
    expect(setItemCalls.length).toBeGreaterThan(0);

    const writtenArgs = JSON.parse(setItemCalls[0][1]);
    expect(writtenArgs.length).toBe(1); // 1 array containing 1 payload
    expect(writtenArgs[0].routingContext).toBe('walking');
    expect(writtenArgs[0].altitude).toBe(10);
    expect(writtenArgs[0].surfaceVibrationHertz).toBeGreaterThan(0); // Variance logic proved
  });

  it('handles accelerometer not available', async () => {
    (Accelerometer.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await microMobilityTelemetryService.startTracking('walking');
    expect(Accelerometer.setUpdateInterval).not.toHaveBeenCalled();
  });

  it('ignores start tracking if already active', async () => {
    await microMobilityTelemetryService.startTracking('walking');
    (Accelerometer.isAvailableAsync as jest.Mock).mockClear();
    await microMobilityTelemetryService.startTracking('cycling');
    expect(Accelerometer.isAvailableAsync).not.toHaveBeenCalled();
  });

  it('ignores stop tracking if not active', () => {
    // Should not throw
    microMobilityTelemetryService.stopTracking();
  });

  it('retrieves buffered payloads successfully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([{ lat: 10, lon: 20 }]),
    );
    const payloads = await microMobilityTelemetryService.getBufferedPayloads();
    expect(payloads.length).toBe(1);
    expect(payloads[0].lat).toBe(10);
  });

  it('returns empty array when no buffered payloads exist', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const payloads = await microMobilityTelemetryService.getBufferedPayloads();
    expect(payloads.length).toBe(0);
  });

  it('caps buffer at 5000 items', async () => {
    const existing = new Array(5005).fill({ lat: 0, lon: 0 });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(existing),
    );

    // Trigger dump to write to disk
    let mockCallback = (data: any) => {};
    (Accelerometer.addListener as jest.Mock).mockImplementationOnce(
      callback => {
        mockCallback = callback;
        return { remove: jest.fn() };
      },
    );

    await microMobilityTelemetryService.startTracking('walking');
    for (let i = 0; i < 50; i++) {
      mockCallback({ x: 0, y: 0, z: 1, timestamp: Date.now() });
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
    const writtenArgs = JSON.parse(setItemCalls[setItemCalls.length - 1][1]);
    expect(writtenArgs.length).toBe(5000);
  });

  it('handles clear buffer errors', async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error('AsyncStorage error'),
    );
    await microMobilityTelemetryService.clearBuffer(); // Should catch error
  });
});
