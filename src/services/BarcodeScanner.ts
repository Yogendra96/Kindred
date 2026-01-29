import PerformanceMonitoringService from './PerformanceMonitoringService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { BarCodeScanner } from 'expo-barcode-scanner';
// import { runOnJS } from 'react-native-reanimated'; // Optional dependency
// Commented out unused imports - kept for future camera integration
// import {
//   Camera,
//   useCameraDevices,
//   useFrameProcessor,
// } from 'react-native-vision-camera';

// Types for Product Carbon Footprint
export interface ProductInfo {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  image?: string;
  weight?: number;
  volume?: number;
  packaging: {
    materials: string[];
    recyclable: boolean;
    biodegradable: boolean;
    packagingWeight: number;
  };
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  ingredients?: string[];
  certifications: string[]; // organic, fair-trade, etc.
  origin: {
    country: string;
    region?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  manufacturer: {
    name: string;
    sustainabilityRating?: number;
    certifications: string[];
  };
}

export interface CarbonFootprintData {
  productId: string;
  barcode: string;
  totalCarbonFootprint: number; // kg CO2e
  breakdown: {
    production: number;
    transportation: number;
    packaging: number;
    disposal: number;
  };
  methodology: string;
  dataSource: string;
  lastUpdated: string;
  confidence: number; // 0-1
  alternatives: {
    productId: string;
    name: string;
    carbonFootprint: number;
    reason: string;
  }[];
  sustainabilityScore: {
    overall: number;
    environmental: number;
    social: number;
    economic: number;
  };
  recommendations: {
    action: string;
    impact: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
}

export interface ScanResult {
  barcode: string;
  format: string;
  productInfo?: ProductInfo;
  carbonFootprint?: CarbonFootprintData;
  scanTimestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ScanHistory {
  id: string;
  userId: string;
  scanResult: ScanResult;
  userRating?: number;
  userNotes?: string;
  purchased: boolean;
  alternatives?: string[];
}

class BarcodeScannerService {
  private static instance: BarcodeScannerService;
  private apiClient: AxiosInstance;
  private performanceService = PerformanceMonitoringService;
  private scanHistory: ScanHistory[] = [];
  private productCache = new Map<string, ProductInfo>();
  private carbonCache = new Map<string, CarbonFootprintData>();

  private constructor() {
    this.apiClient = axios.create({
      baseURL:
        process.env.PRODUCT_API_URL || 'https://api.openfoodfacts.org/api/v0',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Kindred-CarbonTracker/1.0',
      },
    });

    this.setupInterceptors();
    this.loadCachedData();
  }

  public static getInstance(): BarcodeScannerService {
    if (!BarcodeScannerService.instance) {
      BarcodeScannerService.instance = new BarcodeScannerService();
    }
    return BarcodeScannerService.instance;
  }

  private setupInterceptors(): void {
    this.apiClient.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const trace = await this.performanceService.trackNetworkRequest(
          config.url || '',
          config.method?.toUpperCase() || 'GET',
        );
        (
          config as InternalAxiosRequestConfig & { metadata?: unknown }
        ).metadata = { trace, startTime: performance.now() };
        return config;
      },
      error => Promise.reject(error),
    );

    this.apiClient.interceptors.response.use(
      response => {
        const { trace } =
          (
            response.config as InternalAxiosRequestConfig & {
              metadata?: {
                trace?: { stop: (status: number, size?: number) => void };
              };
            }
          ).metadata || {};
        if (trace) {
          trace.stop(response.status, JSON.stringify(response.data).length);
        }
        return response;
      },
      error => {
        const { trace } =
          (
            error.config as InternalAxiosRequestConfig & {
              metadata?: { trace?: { stop: (status: number) => void } };
            }
          )?.metadata || {};
        if (trace) {
          trace.stop(error.response?.status || 0);
        }
        return Promise.reject(error);
      },
    );
  }

  // Request camera permissions
  public async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  // Check if camera permissions are granted
  public async hasCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await BarCodeScanner.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }

  // Scan barcode using Expo BarCodeScanner
  public async scanBarcodeWithExpo(
    onScan: (result: ScanResult) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const hasPermission = await this.hasCameraPermissions();
      if (!hasPermission) {
        const granted = await this.requestCameraPermissions();
        if (!granted) {
          throw new Error('Camera permission denied');
        }
      }

      // This would be used in a React component with BarCodeScanner
      // The actual scanning happens in the component
    } catch (error) {
      onError(error as Error);
    }
  }

  // Process scanned barcode
  public async processScanResult(
    barcode: string,
    format: string,
    location?: { latitude: number; longitude: number },
  ): Promise<ScanResult> {
    try {
      await this.performanceService.startTrace('barcode_processing');

      const scanResult: ScanResult = {
        barcode,
        format,
        scanTimestamp: new Date().toISOString(),
        location,
      };

      // Get product information
      const productInfo = await this.getProductInfo(barcode);
      if (productInfo) {
        scanResult.productInfo = productInfo;

        // Get carbon footprint data
        const carbonFootprint = await this.getCarbonFootprint(
          barcode,
          productInfo,
        );
        if (carbonFootprint) {
          scanResult.carbonFootprint = carbonFootprint;
        }
      }

      // Save to scan history
      await this.saveScanToHistory(scanResult);

      await this.performanceService.stopTrace('barcode_processing', {
        barcode_found: productInfo ? 'true' : 'false',
        carbon_data_found: scanResult.carbonFootprint ? 'true' : 'false',
      });

      return scanResult;
    } catch (error) {
      await this.performanceService.stopTrace('barcode_processing', {
        status: 'error',
        error: String(error),
      });
      throw error;
    }
  }

  // Get product information from various APIs
  private async getProductInfo(barcode: string): Promise<ProductInfo | null> {
    // Check cache first
    if (this.productCache.has(barcode)) {
      return this.productCache.get(barcode)!;
    }

    try {
      // Try OpenFoodFacts API first
      let productInfo = await this.getProductFromOpenFoodFacts(barcode);

      if (!productInfo) {
        // Try other APIs as fallback
        productInfo = await this.getProductFromUPCDatabase(barcode);
      }

      if (!productInfo) {
        productInfo = await this.getProductFromBarcodeLookup(barcode);
      }

      if (productInfo) {
        // Cache the result
        this.productCache.set(barcode, productInfo);
        await this.saveCachedData();
      }

      return productInfo;
    } catch (error) {
      console.error('Error getting product info:', error);
      return null;
    }
  }

  private async getProductFromOpenFoodFacts(
    barcode: string,
  ): Promise<ProductInfo | null> {
    try {
      const response = await this.apiClient.get(`/product/${barcode}.json`);
      const product = response.data.product;

      if (!product || response.data.status === 0) {
        return null;
      }

      return {
        barcode,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || 'Unknown Brand',
        category: product.categories || 'Unknown Category',
        description: product.generic_name,
        image: product.image_url,
        weight: product.quantity ? parseFloat(product.quantity) : undefined,
        packaging: {
          materials: product.packaging_tags || [],
          recyclable: product.packaging_tags?.includes('recyclable') || false,
          biodegradable:
            product.packaging_tags?.includes('biodegradable') || false,
          packagingWeight: 0, // Not available in OpenFoodFacts
        },
        nutritionalInfo: product.nutriments
          ? {
              calories: product.nutriments.energy_kcal_100g || 0,
              protein: product.nutriments.proteins_100g || 0,
              carbs: product.nutriments.carbohydrates_100g || 0,
              fat: product.nutriments.fat_100g || 0,
              fiber: product.nutriments.fiber_100g || 0,
            }
          : undefined,
        ingredients: product.ingredients_text_en?.split(', ') || [],
        certifications: product.labels_tags || [],
        origin: {
          country: product.countries || 'Unknown',
          region: product.origins,
        },
        manufacturer: {
          name: product.manufacturing_places || product.brands || 'Unknown',
          certifications: product.labels_tags || [],
        },
      };
    } catch (error) {
      console.error('Error fetching from OpenFoodFacts:', error);
      return null;
    }
  }

  private async getProductFromUPCDatabase(
    _barcode: string,
  ): Promise<ProductInfo | null> {
    try {
      // This would use a UPC database API
      // Implementation depends on the specific API chosen
      // TODO: Implement actual UPC database API integration
    } catch (error) {
      console.error('Error fetching from UPC database:', error);
    }
    return null;
  }

  private async getProductFromBarcodeLookup(
    _barcode: string,
  ): Promise<ProductInfo | null> {
    try {
      // This would use a barcode lookup API
      // Implementation depends on the specific API chosen
      // TODO: Implement actual barcode lookup API integration
    } catch (error) {
      console.error('Error fetching from barcode lookup:', error);
    }
    return null;
  }

  // Get carbon footprint data
  private async getCarbonFootprint(
    barcode: string,
    productInfo: ProductInfo,
  ): Promise<CarbonFootprintData | null> {
    // Check cache first
    if (this.carbonCache.has(barcode)) {
      return this.carbonCache.get(barcode)!;
    }

    try {
      // Try to get carbon footprint from specialized APIs
      let carbonData = await this.getCarbonFromHowGoodAPI(barcode, productInfo);

      if (!carbonData) {
        carbonData = await this.getCarbonFromCarbonTrustAPI(
          barcode,
          productInfo,
        );
      }

      if (!carbonData) {
        // Calculate estimated carbon footprint
        carbonData = await this.calculateEstimatedCarbonFootprint(productInfo);
      }

      if (carbonData) {
        // Cache the result
        this.carbonCache.set(barcode, carbonData);
        await this.saveCachedData();
      }

      return carbonData;
    } catch (error) {
      console.error('Error getting carbon footprint:', error);
      return null;
    }
  }

  private async getCarbonFromHowGoodAPI(
    _barcode: string,
    _productInfo: ProductInfo,
  ): Promise<CarbonFootprintData | null> {
    try {
      // This would integrate with HowGood API
      // Implementation depends on API access
      // TODO: Implement actual HowGood API integration
    } catch (error) {
      console.error('Error fetching from HowGood API:', error);
    }
    return null;
  }

  private async getCarbonFromCarbonTrustAPI(
    _barcode: string,
    _productInfo: ProductInfo,
  ): Promise<CarbonFootprintData | null> {
    try {
      // This would integrate with Carbon Trust API
      // Implementation depends on API access
      // TODO: Implement actual Carbon Trust API integration
    } catch (error) {
      console.error('Error fetching from Carbon Trust API:', error);
    }
    return null;
  }

  private async calculateEstimatedCarbonFootprint(
    productInfo: ProductInfo,
  ): Promise<CarbonFootprintData> {
    // Calculate estimated carbon footprint based on product category and origin
    const categoryEmissions = this.getCategoryEmissionFactor(
      productInfo.category,
    );
    const transportEmissions = this.calculateTransportEmissions(
      productInfo.origin.country,
    );
    const packagingEmissions = this.calculatePackagingEmissions(
      productInfo.packaging,
    );

    const production = categoryEmissions * (productInfo.weight || 1);
    const transportation = transportEmissions;
    const packaging = packagingEmissions;
    const disposal = production * 0.1; // Estimate 10% of production emissions

    const total = production + transportation + packaging + disposal;

    return {
      productId: productInfo.barcode,
      barcode: productInfo.barcode,
      totalCarbonFootprint: total,
      breakdown: {
        production,
        transportation,
        packaging,
        disposal,
      },
      methodology: 'Estimated based on category and origin',
      dataSource: 'Kindred Internal Calculation',
      lastUpdated: new Date().toISOString(),
      confidence: 0.6, // Lower confidence for estimates
      alternatives: [],
      sustainabilityScore: {
        overall: this.calculateSustainabilityScore(productInfo),
        environmental: this.calculateEnvironmentalScore(productInfo),
        social: this.calculateSocialScore(productInfo),
        economic: this.calculateEconomicScore(productInfo),
      },
      recommendations: this.generateProductRecommendations(productInfo, total),
    };
  }

  private getCategoryEmissionFactor(category: string): number {
    // Emission factors in kg CO2e per kg of product
    const factors: Record<string, number> = {
      meat: 15.0,
      dairy: 3.2,
      vegetables: 0.4,
      fruits: 0.3,
      grains: 0.8,
      beverages: 0.5,
      'processed-food': 2.0,
      electronics: 50.0,
      clothing: 8.0,
      household: 2.5,
      'personal-care': 1.5,
    };

    const normalizedCategory = category.toLowerCase();
    for (const [key, factor] of Object.entries(factors)) {
      if (normalizedCategory.includes(key)) {
        return factor;
      }
    }

    return 1.0; // Default factor
  }

  private calculateTransportEmissions(country: string): number {
    // Estimate transport emissions based on origin country
    const distances: Record<string, number> = {
      local: 0.1,
      usa: 0.5,
      canada: 0.6,
      mexico: 0.8,
      europe: 1.2,
      asia: 2.0,
      'south-america': 1.5,
      africa: 1.8,
      australia: 2.2,
    };

    const normalizedCountry = country.toLowerCase();
    for (const [region, emission] of Object.entries(distances)) {
      if (normalizedCountry.includes(region)) {
        return emission;
      }
    }

    return 1.0; // Default transport emission
  }

  private calculatePackagingEmissions(
    packaging: ProductInfo['packaging'],
  ): number {
    let emissions = 0;

    for (const material of packaging.materials) {
      switch (material.toLowerCase()) {
        case 'plastic':
          emissions += 0.5;
          break;
        case 'glass':
          emissions += 0.3;
          break;
        case 'aluminum':
          emissions += 0.8;
          break;
        case 'paper':
        case 'cardboard':
          emissions += 0.2;
          break;
        default:
          emissions += 0.3;
      }
    }

    return emissions;
  }

  private calculateSustainabilityScore(productInfo: ProductInfo): number {
    let score = 50; // Base score

    // Organic certification
    if (productInfo.certifications.some(cert => cert.includes('organic'))) {
      score += 20;
    }

    // Fair trade
    if (productInfo.certifications.some(cert => cert.includes('fair-trade'))) {
      score += 15;
    }

    // Recyclable packaging
    if (productInfo.packaging.recyclable) {
      score += 10;
    }

    // Local origin
    if (productInfo.origin.country.toLowerCase().includes('local')) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  private calculateEnvironmentalScore(productInfo: ProductInfo): number {
    // Similar to sustainability score but focused on environmental factors
    return this.calculateSustainabilityScore(productInfo);
  }

  private calculateSocialScore(productInfo: ProductInfo): number {
    let score = 50;

    if (productInfo.certifications.some(cert => cert.includes('fair-trade'))) {
      score += 30;
    }

    if (productInfo.manufacturer.certifications.length > 0) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private calculateEconomicScore(_productInfo: ProductInfo): number {
    // This would consider factors like local economy support, fair pricing, etc.
    return 70; // Placeholder
  }

  private generateProductRecommendations(
    productInfo: ProductInfo,
    carbonFootprint: number,
  ): CarbonFootprintData['recommendations'] {
    const recommendations: CarbonFootprintData['recommendations'] = [];

    if (carbonFootprint > 5.0) {
      recommendations.push({
        action: 'Look for local alternatives to reduce transport emissions',
        impact: 'Could reduce footprint by 20-40%',
        difficulty: 'easy',
      });
    }

    if (!productInfo.packaging.recyclable) {
      recommendations.push({
        action: 'Choose products with recyclable packaging',
        impact: 'Reduces waste and packaging emissions',
        difficulty: 'easy',
      });
    }

    if (!productInfo.certifications.some(cert => cert.includes('organic'))) {
      recommendations.push({
        action: 'Consider organic alternatives',
        impact: 'Supports sustainable farming practices',
        difficulty: 'medium',
      });
    }

    return recommendations;
  }

  // Save scan to history
  private async saveScanToHistory(scanResult: ScanResult): Promise<void> {
    try {
      const historyItem: ScanHistory = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'current_user', // This should come from auth context
        scanResult,
        purchased: false,
      };

      this.scanHistory.unshift(historyItem);

      // Keep only last 100 scans
      if (this.scanHistory.length > 100) {
        this.scanHistory = this.scanHistory.slice(0, 100);
      }

      await AsyncStorage.setItem(
        'barcode_scan_history',
        JSON.stringify(this.scanHistory),
      );
    } catch (error) {
      console.error('Error saving scan to history:', error);
    }
  }

  // Get scan history
  public async getScanHistory(): Promise<ScanHistory[]> {
    return this.scanHistory;
  }

  // Update scan history item
  public async updateScanHistory(
    scanId: string,
    updates: Partial<
      Pick<
        ScanHistory,
        'userRating' | 'userNotes' | 'purchased' | 'alternatives'
      >
    >,
  ): Promise<void> {
    try {
      const index = this.scanHistory.findIndex(item => item.id === scanId);
      if (index !== -1) {
        this.scanHistory[index] = { ...this.scanHistory[index], ...updates };
        await AsyncStorage.setItem(
          'barcode_scan_history',
          JSON.stringify(this.scanHistory),
        );
      }
    } catch (error) {
      console.error('Error updating scan history:', error);
    }
  }

  // Load cached data
  private async loadCachedData(): Promise<void> {
    try {
      const [historyData, productCacheData, carbonCacheData] =
        await Promise.all([
          AsyncStorage.getItem('barcode_scan_history'),
          AsyncStorage.getItem('product_cache'),
          AsyncStorage.getItem('carbon_cache'),
        ]);

      if (historyData) {
        this.scanHistory = JSON.parse(historyData);
      }

      if (productCacheData) {
        const cacheData = JSON.parse(productCacheData);
        this.productCache = new Map(cacheData);
      }

      if (carbonCacheData) {
        const cacheData = JSON.parse(carbonCacheData);
        this.carbonCache = new Map(cacheData);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }

  // Save cached data
  private async saveCachedData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          'product_cache',
          JSON.stringify(Array.from(this.productCache.entries())),
        ),
        AsyncStorage.setItem(
          'carbon_cache',
          JSON.stringify(Array.from(this.carbonCache.entries())),
        ),
      ]);
    } catch (error) {
      console.error('Error saving cached data:', error);
    }
  }

  // Clear cache
  public async clearCache(): Promise<void> {
    try {
      this.productCache.clear();
      this.carbonCache.clear();
      await Promise.all([
        AsyncStorage.removeItem('product_cache'),
        AsyncStorage.removeItem('carbon_cache'),
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Get cache statistics
  public getCacheStats(): {
    productCacheSize: number;
    carbonCacheSize: number;
    scanHistorySize: number;
  } {
    return {
      productCacheSize: this.productCache.size,
      carbonCacheSize: this.carbonCache.size,
      scanHistorySize: this.scanHistory.length,
    };
  }
}

export default BarcodeScannerService.getInstance();

// Utility functions for barcode scanning
export const BarcodeUtils = {
  // Validate barcode format
  isValidBarcode: (barcode: string): boolean => {
    // Check for common barcode formats
    const formats = [
      /^\d{12}$/, // UPC-A
      /^\d{13}$/, // EAN-13
      /^\d{8}$/, // EAN-8
      /^\d{14}$/, // ITF-14
    ];

    return formats.some(format => format.test(barcode));
  },

  // Format barcode for display
  formatBarcode: (barcode: string): string => {
    if (barcode.length === 12) {
      // UPC-A format: 123456 789012
      return `${barcode.slice(0, 6)} ${barcode.slice(6)}`;
    } else if (barcode.length === 13) {
      // EAN-13 format: 1 234567 890123
      return `${barcode.slice(0, 1)} ${barcode.slice(1, 7)} ${barcode.slice(
        7,
      )}`;
    }
    return barcode;
  },

  // Get barcode type
  getBarcodeType: (barcode: string): string => {
    if (/^\d{12}$/.test(barcode)) return 'UPC-A';
    if (/^\d{13}$/.test(barcode)) return 'EAN-13';
    if (/^\d{8}$/.test(barcode)) return 'EAN-8';
    if (/^\d{14}$/.test(barcode)) return 'ITF-14';
    return 'Unknown';
  },
};
