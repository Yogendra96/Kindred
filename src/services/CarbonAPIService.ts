// @ts-nocheck
/* eslint-disable */
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import { CARBON_API_KEY, CARBON_API_BASE_URL } from '@env';
import loggingService from './/LoggerService';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
      requestId: string;
    };
  }
}

// Types for Carbon API
export interface CarbonEmissionFactor {
  id: string;
  category: string;
  subcategory: string;
  factor: number; // kg CO2 per unit
  unit: string;
  region?: string;
  source: string;
  lastUpdated: Date;
}

export interface CarbonCalculationRequest {
  activityType: string;
  amount: number;
  unit: string;
  region?: string;
  additionalParams?: Record<string, any>;
}

export interface CarbonCalculationResponse {
  emissions: number; // kg CO2
  factor: CarbonEmissionFactor;
  confidence: number; // 0-1
  breakdown?: {
    direct: number;
    indirect: number;
    lifecycle?: number;
  };
  recommendations?: string[];
}

export interface ProductCarbonFootprint {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  emissions: {
    production: number;
    transportation: number;
    packaging: number;
    disposal: number;
    total: number;
  };
  certifications: string[];
  alternatives?: {
    name: string;
    emissions: number;
    reason: string;
  }[];
  lastUpdated: Date;
}

export interface CarbonOffsetProject {
  id: string;
  name: string;
  type: 'forestry' | 'renewable' | 'efficiency' | 'capture' | 'community';
  location: string;
  pricePerTon: number; // USD
  availableCredits: number;
  certification: string[];
  description: string;
  images: string[];
  impact: {
    co2Reduced: number;
    beneficiaries?: number;
    additionalBenefits: string[];
  };
  timeline: {
    start: Date;
    end: Date;
    verification: Date;
  };
}

export interface CarbonBudget {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target: number; // kg CO2
  current: number; // kg CO2
  remaining: number; // kg CO2
  categories: {
    transport: number;
    energy: number;
    food: number;
    consumption: number;
    other: number;
  };
  recommendations: {
    category: string;
    action: string;
    potential: number; // kg CO2 savings
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
}

export interface CarbonTrend {
  period: string;
  emissions: number;
  target: number;
  categories: Record<string, number>;
  comparison: {
    previousPeriod: number;
    average: number;
    percentile: number;
  };
}

export interface APIError {
  code: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
  timestamp: Date;
}

interface APIErrorResponse {
  code?: string;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

class CarbonAPIService {
  private api: AxiosInstance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> =
    new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> =
    new Map();
  private logger: typeof loggingService;

  constructor() {
    this.logger = loggingService;

    this.api = axios.create({
      baseURL: CARBON_API_BASE_URL || 'https://api.carbonfootprint.com/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Kindred-App/1.0',
        'X-API-Key': CARBON_API_KEY,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      config => {
        // Add request ID for tracking
        config.metadata = {
          requestId: this.generateRequestId(),
          startTime: Date.now(),
        };

        // Check rate limits
        this.checkRateLimit(config.url || '');

        // Add authentication if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.api.interceptors.response.use(
      response => {
        // Track performance
        const duration = response.config.metadata?.startTime
          ? Date.now() - response.config.metadata.startTime
          : 0;
        this.logger.debug('API call completed', {
          url: response.config.url,
          status: 'success',
          duration,
        });

        // Update rate limit tracking
        this.updateRateLimit(response);

        return response;
      },
      (error: AxiosError) => {
        // Track error
        const duration = error.config?.metadata?.startTime
          ? Date.now() - error.config.metadata.startTime
          : 0;

        this.logger.error('API call failed', {
          url: error.config?.url,
          status: 'error',
          duration,
          statusCode: error.response?.status,
        });

        // Handle specific error cases
        return this.handleAPIError(error);
      },
    );
  }

  // Emission Factors
  async getEmissionFactors(
    category?: string,
    region?: string,
  ): Promise<CarbonEmissionFactor[]> {
    const cacheKey = `emission-factors-${category || 'all'}-${
      region || 'global'
    }`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {};
    if (category) params.category = category;
    if (region) params.region = region;

    const response = await this.api.get('/emission-factors', { params });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const factors = response.data.map((factor: any) => ({
      ...factor,
      lastUpdated: new Date(factor.lastUpdated),
    }));

    this.setCache(cacheKey, factors, 3600000); // 1 hour TTL
    return factors;
  }

  async getEmissionFactor(
    activityType: string,
    region?: string,
  ): Promise<CarbonEmissionFactor | null> {
    const cacheKey = `emission-factor-${activityType}-${region || 'global'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/emission-factors/${activityType}`, {
        params: { region },
      });

      const factor = {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated),
      };

      this.setCache(cacheKey, factor, 3600000); // 1 hour TTL
      return factor;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Carbon Calculations
  async calculateEmissions(
    request: CarbonCalculationRequest,
  ): Promise<CarbonCalculationResponse> {
    const startTime = Date.now();

    try {
      const response = await this.api.post('/calculate', request);
      const result = {
        ...response.data,
        factor: {
          ...response.data.factor,
          lastUpdated: new Date(response.data.factor.lastUpdated),
        },
      };

      this.logger.info('Carbon calculation completed', {
        activityType: request.activityType,
        emissions: result.emissions,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      this.logger.error('Carbon calculation failed', {
        activityType: request.activityType,
        duration: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  }

  async batchCalculateEmissions(
    requests: CarbonCalculationRequest[],
  ): Promise<CarbonCalculationResponse[]> {
    const startTime = Date.now();

    try {
      const response = await this.api.post('/calculate/batch', { requests });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results = response.data.map((result: any) => ({
        ...result,
        factor: {
          ...result.factor,
          lastUpdated: new Date(result.factor.lastUpdated),
        },
      }));

      this.logger.info('Batch carbon calculation completed', {
        batchSize: requests.length,
        duration: Date.now() - startTime,
      });

      return results;
    } catch (error) {
      this.logger.error('Batch carbon calculation failed', {
        batchSize: requests.length,
        duration: Date.now() - startTime,
        error: error.message,
      });
      throw error;
    }
  }

  // Product Carbon Footprint
  async getProductFootprint(
    barcode: string,
  ): Promise<ProductCarbonFootprint | null> {
    const cacheKey = `product-footprint-${barcode}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/products/${barcode}`);
      const product = {
        ...response.data,
        lastUpdated: new Date(response.data.lastUpdated),
      };

      this.setCache(cacheKey, product, 86400000); // 24 hours TTL
      return product;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async searchProducts(
    query: string,
    category?: string,
    limit: number = 20,
  ): Promise<ProductCarbonFootprint[]> {
    const response = await this.api.get('/products/search', {
      params: { q: query, category, limit },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((product: any) => ({
      ...product,
      lastUpdated: new Date(product.lastUpdated),
    }));
  }

  // Carbon Offset Projects
  async getOffsetProjects(
    type?: string,
    location?: string,
    maxPrice?: number,
  ): Promise<CarbonOffsetProject[]> {
    const cacheKey = `offset-projects-${type || 'all'}-${location || 'all'}-${
      maxPrice || 'any'
    }`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {};
    if (type) params.type = type;
    if (location) params.location = location;
    if (maxPrice) params.maxPrice = maxPrice;

    const response = await this.api.get('/offset-projects', { params });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projects = response.data.map((project: any) => ({
      ...project,
      timeline: {
        start: new Date(project.timeline.start),
        end: new Date(project.timeline.end),
        verification: new Date(project.timeline.verification),
      },
    }));

    this.setCache(cacheKey, projects, 1800000); // 30 minutes TTL
    return projects;
  }

  async getOffsetProject(id: string): Promise<CarbonOffsetProject | null> {
    const cacheKey = `offset-project-${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/offset-projects/${id}`);
      const project = {
        ...response.data,
        timeline: {
          start: new Date(response.data.timeline.start),
          end: new Date(response.data.timeline.end),
          verification: new Date(response.data.timeline.verification),
        },
      };

      this.setCache(cacheKey, project, 1800000); // 30 minutes TTL
      return project;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Carbon Budget and Tracking
  async getCarbonBudget(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ): Promise<CarbonBudget> {
    const response = await this.api.get(`/users/${userId}/budget`, {
      params: { period },
    });

    return response.data;
  }

  async updateCarbonBudget(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    target: number,
  ): Promise<CarbonBudget> {
    const response = await this.api.put(`/users/${userId}/budget`, {
      period,
      target,
    });

    return response.data;
  }

  async getCarbonTrends(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): Promise<CarbonTrend[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = { period };
    if (startDate) params.startDate = startDate.toISOString();
    if (endDate) params.endDate = endDate.toISOString();

    const response = await this.api.get(`/users/${userId}/trends`, { params });
    return response.data;
  }

  // Benchmarking and Comparisons
  async getBenchmarks(
    category: string,
    region?: string,
    demographic?: Record<string, any>,
  ): Promise<{
    average: number;
    median: number;
    percentiles: Record<string, number>;
    sampleSize: number;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = { category };
    if (region) params.region = region;
    if (demographic) params.demographic = JSON.stringify(demographic);

    const response = await this.api.get('/benchmarks', { params });
    return response.data;
  }

  async compareEmissions(
    userId: string,
    category: string,
    period: 'month' | 'quarter' | 'year',
  ): Promise<{
    userEmissions: number;
    averageEmissions: number;
    percentile: number;
    ranking: number;
    totalUsers: number;
  }> {
    const response = await this.api.get(`/users/${userId}/compare`, {
      params: { category, period },
    });

    return response.data;
  }

  // Recommendations
  async getRecommendations(
    userId: string,
    category?: string,
    limit: number = 10,
  ): Promise<
    {
      id: string;
      title: string;
      description: string;
      category: string;
      impact: number; // kg CO2 potential savings
      difficulty: 'easy' | 'medium' | 'hard';
      cost: 'free' | 'low' | 'medium' | 'high';
      timeframe: string;
      actions: string[];
    }[]
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = { limit };
    if (category) params.category = category;

    const response = await this.api.get(`/users/${userId}/recommendations`, {
      params,
    });
    return response.data;
  }

  // Utility Methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAuthToken(): string | null {
    // Implement your auth token retrieval logic
    return null;
  }

  private checkRateLimit(endpoint: string): void {
    const now = Date.now();
    const tracker = this.rateLimitTracker.get(endpoint);

    if (tracker) {
      if (now < tracker.resetTime) {
        if (tracker.count >= 100) {
          // Assuming 100 requests per minute
          throw new Error(`Rate limit exceeded for ${endpoint}`);
        }
        tracker.count++;
      } else {
        // Reset the counter
        tracker.count = 1;
        tracker.resetTime = now + 60000; // 1 minute
      }
    } else {
      this.rateLimitTracker.set(endpoint, {
        count: 1,
        resetTime: now + 60000,
      });
    }
  }

  private updateRateLimit(response: AxiosResponse): void {
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];

    if (remaining && reset) {
      const endpoint = response.config.url || '';
      this.rateLimitTracker.set(endpoint, {
        count: 100 - parseInt(remaining),
        resetTime: parseInt(reset) * 1000,
      });
    }
  }

  private handleAPIError(error: AxiosError): Promise<never> {
    const errorData = error.response?.data as APIErrorResponse | undefined;
    const apiError: APIError = {
      code: errorData?.code || 'UNKNOWN_ERROR',
      message: errorData?.message || error.message,
      details: errorData?.details,
      timestamp: new Date(),
    };

    // Log error for monitoring
    this.logger.error('Carbon API Error', {
      code: apiError.code,
      message: apiError.message,
      endpoint: error.config?.url,
      method: error.config?.method,
      details: apiError.details,
    });

    return Promise.reject(apiError);
  }

  // Cache Management
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // Health Check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    features: Record<string, boolean>;
  }> {
    const startTime = Date.now();

    try {
      const response = await this.api.get('/health');
      const latency = Date.now() - startTime;

      return {
        status: response.data.status,
        latency,
        features: response.data.features,
      };
    } catch (_error) {
      const latency = Date.now() - startTime;

      return {
        status: 'unhealthy',
        latency,
        features: {},
      };
    }
  }
}

// Create and export singleton instance
export const carbonAPIService = new CarbonAPIService();
export default carbonAPIService;
