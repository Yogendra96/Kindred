import carbonAPIService from '../CarbonAPIService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CarbonAPIService', () => {
  let service: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Clear the singleton cache
    if ((carbonAPIService as any).cache) {
      (carbonAPIService as any).cache.clear();
    }

    // Mock axios.create to return our mocked instance
    const mockAxiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    service = carbonAPIService;
    // Re-assign the private api property for easy mocking in tests
    (service as any).api = mockAxiosInstance;
  });

  describe('getEmissionFactors', () => {
    it('should return emission factors successfully', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            category: 'transport',
            factor: 0.5,
            lastUpdated: '2023-01-01T00:00:00.000Z',
          },
        ],
      };

      (service as any).api.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getEmissionFactors('transport');

      expect((service as any).api.get).toHaveBeenCalledWith('/emission-factors', {
        params: { category: 'transport' },
      });
      expect(result[0].id).toEqual('1');
      expect(result[0].lastUpdated).toBeInstanceOf(Date);
    });

    it('should use the cache on subsequent calls', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            category: 'transport',
            factor: 0.5,
            lastUpdated: '2023-01-01T00:00:00.000Z',
          },
        ],
      };

      (service as any).api.get.mockResolvedValueOnce(mockResponse);

      await service.getEmissionFactors('transport');
      await service.getEmissionFactors('transport'); // second call

      // Should only be called once because the second call hits the cache
      expect((service as any).api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('calculateEmissions', () => {
    it('should calculate emissions successfully', async () => {
      const mockRequest = { activityType: 'flight', amount: 1000, unit: 'km' };
      const mockResponse = {
        data: {
          emissions: 250,
          factor: { id: 'f1', lastUpdated: '2023-01-01T00:00:00.000Z' },
          confidence: 0.9,
        },
      };

      (service as any).api.post.mockResolvedValueOnce(mockResponse);

      const result = await service.calculateEmissions(mockRequest);

      expect((service as any).api.post).toHaveBeenCalledWith('/calculate', mockRequest);
      expect(result.emissions).toEqual(250);
      expect(result.factor.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockResponse = {
        data: { status: 'healthy', version: '1.0' },
      };

      (service as any).api.get.mockResolvedValueOnce(mockResponse);

      const result = await service.healthCheck();

      expect(result.status).toBe('healthy');
      expect((service as any).api.get).toHaveBeenCalledWith('/health');
    });
  });
});
