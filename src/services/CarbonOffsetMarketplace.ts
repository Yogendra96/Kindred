// @ts-nocheck
/* eslint-disable */
import type { AxiosInstance, AxiosInstance } from 'axios';
import axios from 'axios';
import { queryClient, queryKeys } from './QueryService';
import { modernAPMService } from './ModernAPMService';
import axios from 'axios';

// Types for Carbon Offset Marketplace
export interface CarbonOffset {
  id: string;
  name: string;
  description: string;
  pricePerTon: number;
  currency: string;
  projectType:
    | 'forestry'
    | 'renewable_energy'
    | 'methane_capture'
    | 'direct_air_capture'
    | 'blue_carbon';
  location: {
    country: string;
    region: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  certifications: string[];
  vintage: number; // Year the credits were generated
  availableCredits: number;
  totalCredits: number;
  verificationStandard: 'VCS' | 'CDM' | 'Gold_Standard' | 'CAR' | 'ACR';
  additionalBenefits: string[];
  images: string[];
  documents: {
    name: string;
    url: string;
    type: 'pdf' | 'doc' | 'image';
  }[];
  rating: number;
  reviews: number;
  impactMetrics: {
    co2Reduced: number;
    treesPlanted?: number;
    renewableEnergyGenerated?: number;
    wasteReduced?: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
    milestones: {
      date: string;
      description: string;
      completed: boolean;
    }[];
  };
  provider: {
    id: string;
    name: string;
    logo: string;
    rating: number;
    verified: boolean;
  };
}

export interface OffsetPurchase {
  id: string;
  userId: string;
  offsetId: string;
  quantity: number; // tons of CO2
  totalPrice: number;
  currency: string;
  purchaseDate: string;
  status: 'pending' | 'confirmed' | 'retired' | 'cancelled';
  certificateUrl?: string;
  retirementDate?: string;
  retirementReason: string;
  transactionId: string;
}

export interface MarketplaceFilters {
  projectType?: CarbonOffset['projectType'][];
  priceRange?: {
    min: number;
    max: number;
  };
  location?: {
    countries?: string[];
    regions?: string[];
  };
  verificationStandard?: CarbonOffset['verificationStandard'][];
  vintage?: {
    min: number;
    max: number;
  };
  rating?: {
    min: number;
  };
  additionalBenefits?: string[];
  sortBy?: 'price' | 'rating' | 'vintage' | 'availability';
  sortOrder?: 'asc' | 'desc';
}

export interface OffsetCalculation {
  carbonFootprint: number; // tons CO2
  recommendedOffsets: {
    offsetId: string;
    quantity: number;
    price: number;
    reasoning: string;
  }[];
  totalCost: number;
  impactSummary: {
    treesEquivalent: number;
    carsOffRoadEquivalent: number;
    homeEnergyEquivalent: number;
  };
}

class CarbonOffsetMarketplaceService {
  private static instance: CarbonOffsetMarketplaceService;
  private apiClient: AxiosInstance;
  private performanceService = modernAPMService;

  private constructor() {
    this.apiClient = axios.create({
      baseURL:
        process.env.CARBON_MARKETPLACE_API_URL ||
        'https://api.carbonmarketplace.com/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CARBON_MARKETPLACE_API_KEY}`,
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): CarbonOffsetMarketplaceService {
    if (!CarbonOffsetMarketplaceService.instance) {
      CarbonOffsetMarketplaceService.instance =
        new CarbonOffsetMarketplaceService();
    }
    return CarbonOffsetMarketplaceService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor for performance tracking
    this.apiClient.interceptors.request.use(
      async config => {
        const trace = await this.performanceService.trackNetworkRequest(
          config.url || '',
          config.method?.toUpperCase() || 'GET',
        );
        config.metadata = { trace, startTime: performance.now() };
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor
    this.apiClient.interceptors.response.use(
      response => {
        const { trace } = response.config.metadata || {};
        if (trace) {
          trace.stop(response.status, JSON.stringify(response.data).length);
        }
        return response;
      },
      error => {
        const { trace } = error.config?.metadata || {};
        if (trace) {
          trace.stop(error.response?.status || 0);
        }
        return Promise.reject(error);
      },
    );
  }

  // Fetch available carbon offsets
  public async getOffsets(
    filters?: MarketplaceFilters,
  ): Promise<CarbonOffset[]> {
    try {
      const response = await this.apiClient.get('/offsets', {
        params: filters,
      });
      return response.data.offsets;
    } catch (error) {
      console.error('Error fetching carbon offsets:', error);
      throw new Error('Failed to fetch carbon offsets');
    }
  }

  // Get specific offset details
  public async getOffsetDetails(offsetId: string): Promise<CarbonOffset> {
    try {
      const response = await this.apiClient.get(`/offsets/${offsetId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching offset details:', error);
      throw new Error('Failed to fetch offset details');
    }
  }

  // Calculate recommended offsets based on carbon footprint
  public async calculateRecommendedOffsets(
    carbonFootprint: number,
    preferences?: {
      budget?: number;
      projectTypes?: CarbonOffset['projectType'][];
      location?: string;
    },
  ): Promise<OffsetCalculation> {
    try {
      const response = await this.apiClient.post('/calculate-offsets', {
        carbonFootprint,
        preferences,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating recommended offsets:', error);
      throw new Error('Failed to calculate recommended offsets');
    }
  }

  // Purchase carbon offsets
  public async purchaseOffset(
    offsetId: string,
    quantity: number,
    paymentMethod: {
      type: 'card' | 'bank' | 'crypto';
      details: any;
    },
    retirementReason: string = 'Personal carbon footprint offset',
  ): Promise<OffsetPurchase> {
    try {
      const response = await this.apiClient.post('/purchases', {
        offsetId,
        quantity,
        paymentMethod,
        retirementReason,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user() });

      return response.data;
    } catch (error) {
      console.error('Error purchasing offset:', error);
      throw new Error('Failed to purchase carbon offset');
    }
  }

  // Get user's offset purchases
  public async getUserPurchases(userId: string): Promise<OffsetPurchase[]> {
    try {
      const response = await this.apiClient.get(`/users/${userId}/purchases`);
      return response.data.purchases;
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      throw new Error('Failed to fetch user purchases');
    }
  }

  // Retire carbon credits
  public async retireCredits(
    purchaseId: string,
    retirementReason: string,
  ): Promise<{ certificateUrl: string; retirementDate: string }> {
    try {
      const response = await this.apiClient.post(
        `/purchases/${purchaseId}/retire`,
        {
          retirementReason,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error retiring credits:', error);
      throw new Error('Failed to retire carbon credits');
    }
  }

  // Get offset project updates
  public async getProjectUpdates(offsetId: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/offsets/${offsetId}/updates`);
      return response.data.updates;
    } catch (error) {
      console.error('Error fetching project updates:', error);
      throw new Error('Failed to fetch project updates');
    }
  }

  // Search offsets
  public async searchOffsets(
    query: string,
    filters?: MarketplaceFilters,
  ): Promise<CarbonOffset[]> {
    try {
      const response = await this.apiClient.get('/offsets/search', {
        params: {
          q: query,
          ...filters,
        },
      });
      return response.data.offsets;
    } catch (error) {
      console.error('Error searching offsets:', error);
      throw new Error('Failed to search offsets');
    }
  }

  // Get marketplace statistics
  public async getMarketplaceStats(): Promise<{
    totalOffsetsAvailable: number;
    totalCO2Offset: number;
    averagePrice: number;
    topProjects: CarbonOffset[];
    recentPurchases: number;
  }> {
    try {
      const response = await this.apiClient.get('/marketplace/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching marketplace stats:', error);
      throw new Error('Failed to fetch marketplace statistics');
    }
  }

  // Get offset price history
  public async getPriceHistory(
    offsetId: string,
    period: '1M' | '3M' | '6M' | '1Y' | 'ALL',
  ): Promise<{ date: string; price: number }[]> {
    try {
      const response = await this.apiClient.get(
        `/offsets/${offsetId}/price-history`,
        {
          params: { period },
        },
      );
      return response.data.priceHistory;
    } catch (error) {
      console.error('Error fetching price history:', error);
      throw new Error('Failed to fetch price history');
    }
  }

  // Verify offset authenticity
  public async verifyOffset(offsetId: string): Promise<{
    isValid: boolean;
    verificationDetails: {
      standard: string;
      registryId: string;
      issuanceDate: string;
      verificationDate: string;
      verifier: string;
    };
  }> {
    try {
      const response = await this.apiClient.get(`/offsets/${offsetId}/verify`);
      return response.data;
    } catch (error) {
      console.error('Error verifying offset:', error);
      throw new Error('Failed to verify offset');
    }
  }

  // Get impact report
  public async getImpactReport(userId: string): Promise<{
    totalCO2Offset: number;
    totalSpent: number;
    projectsSupported: number;
    impactBreakdown: {
      projectType: string;
      co2Offset: number;
      percentage: number;
    }[];
    certificates: string[];
    environmentalImpact: {
      treesEquivalent: number;
      carsOffRoadEquivalent: number;
      homeEnergyEquivalent: number;
    };
  }> {
    try {
      const response = await this.apiClient.get(
        `/users/${userId}/impact-report`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching impact report:', error);
      throw new Error('Failed to fetch impact report');
    }
  }

  // Subscribe to offset project updates
  public async subscribeToProjectUpdates(
    offsetId: string,
    notificationPreferences: {
      email: boolean;
      push: boolean;
      frequency: 'immediate' | 'weekly' | 'monthly';
    },
  ): Promise<void> {
    try {
      await this.apiClient.post(`/offsets/${offsetId}/subscribe`, {
        notificationPreferences,
      });
    } catch (error) {
      console.error('Error subscribing to project updates:', error);
      throw new Error('Failed to subscribe to project updates');
    }
  }

  // Get carbon offset recommendations based on user behavior
  public async getPersonalizedRecommendations(
    userId: string,
    carbonFootprint: number,
  ): Promise<{
    recommendations: CarbonOffset[];
    reasoning: string[];
    potentialImpact: {
      co2Reduction: number;
      costEffectiveness: number;
      alignmentScore: number;
    };
  }> {
    try {
      const response = await this.apiClient.post(
        '/recommendations/personalized',
        {
          userId,
          carbonFootprint,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw new Error('Failed to fetch personalized recommendations');
    }
  }
}

export default CarbonOffsetMarketplaceService.getInstance();

// Utility functions for marketplace integration
export const MarketplaceUtils = {
  // Calculate cost per ton
  calculateCostPerTon: (offset: CarbonOffset): number => {
    return offset.pricePerTon;
  },

  // Calculate total cost for quantity
  calculateTotalCost: (offset: CarbonOffset, quantity: number): number => {
    return offset.pricePerTon * quantity;
  },

  // Format currency
  formatCurrency: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  // Calculate environmental impact equivalents
  calculateImpactEquivalents: (co2Tons: number) => {
    return {
      treesPlanted: Math.round(co2Tons * 16), // Approximate trees needed to offset 1 ton CO2
      carsOffRoad: Math.round(co2Tons / 4.6), // Average car emits 4.6 tons CO2/year
      homeEnergyMonths: Math.round(co2Tons / 0.5), // Average home emits 0.5 tons CO2/month
    };
  },

  // Validate offset quality
  validateOffsetQuality: (
    offset: CarbonOffset,
  ): {
    score: number;
    factors: string[];
  } => {
    let score = 0;
    const factors: string[] = [];

    // Verification standard
    if (['VCS', 'Gold_Standard', 'CDM'].includes(offset.verificationStandard)) {
      score += 25;
      factors.push('High-quality verification standard');
    }

    // Recent vintage
    const currentYear = new Date().getFullYear();
    if (offset.vintage >= currentYear - 5) {
      score += 20;
      factors.push('Recent vintage');
    }

    // Provider rating
    if (offset.provider.rating >= 4.0) {
      score += 20;
      factors.push('High-rated provider');
    }

    // Additional benefits
    if (offset.additionalBenefits.length > 0) {
      score += 15;
      factors.push('Additional environmental benefits');
    }

    // Transparency (documents available)
    if (offset.documents.length > 0) {
      score += 10;
      factors.push('Transparent documentation');
    }

    // Project rating
    if (offset.rating >= 4.0) {
      score += 10;
      factors.push('High project rating');
    }

    return { score, factors };
  },
};
