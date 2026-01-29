/**
 * Global Context Service
 * Provides country-level comparisons, global averages, and historical context
 * Uses Our World in Data (OWID) methodology and bundled data
 *
 * Data Sources:
 * - OWID CO2 Dataset: https://github.com/owid/co2-data
 * - Climate TRACE for real-time country data
 */

// Note: AsyncStorage, loggingService, and climateTraceService are available for
// future enhancements (caching, error logging, real-time country data fetching)

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface CountryData {
  code: string;
  name: string;
  region: string;
  population: number;
  gdpPerCapita: number;
  emissions: number; // tonnes CO2 per year (total)
  emissionsPerCapita: number; // tonnes CO2 per person per year
  cumulativeEmissions: number; // total historical emissions
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
}

export interface GlobalAverages {
  worldEmissions: number; // total global emissions (Gt CO2)
  worldPerCapita: number; // global per capita (tonnes)
  medianPerCapita: number; // median country per capita
  parisAlignedTarget: number; // 2030 target per capita
  netZeroTarget: number; // 2050 target per capita
}

export interface UserGlobalContext {
  userFootprint: number; // user's annual tonnes CO2
  countryCode: string;
  countryName: string;
  countryAverage: number;
  worldAverage: number;

  // Comparisons
  vsCountryAverage: {
    difference: number;
    percentDifference: number;
    isBelowAverage: boolean;
  };
  vsWorldAverage: {
    difference: number;
    percentDifference: number;
    isBelowAverage: boolean;
  };

  // Rankings
  globalPercentile: number; // user is in top X% of global emitters
  countryPercentile: number; // user is in top X% of country emitters

  // Historical context
  historicalEquivalent: {
    year: number;
    country: string;
    description: string;
  };

  // Targets
  parisGap: number; // tonnes above 2030 target
  netZeroGap: number; // tonnes above 2050 target

  // Insights
  insights: string[];
}

export interface HistoricalComparison {
  year: number;
  country: string;
  countryName: string;
  perCapita: number;
}

// =============================================================================
// Bundled Country Data (OWID-based)
// This data is bundled with the app for offline access
// Last updated: December 2024
// =============================================================================

const COUNTRY_DATA: Record<string, CountryData> = {
  USA: {
    code: 'USA',
    name: 'United States',
    region: 'North America',
    population: 334000000,
    gdpPerCapita: 76000,
    emissions: 5000000000, // 5 Gt
    emissionsPerCapita: 14.9,
    cumulativeEmissions: 416000000000, // 416 Gt historical
    trend: { direction: 'decreasing', changePercent: -2.1 },
  },
  CHN: {
    code: 'CHN',
    name: 'China',
    region: 'Asia',
    population: 1410000000,
    gdpPerCapita: 12500,
    emissions: 11400000000, // 11.4 Gt
    emissionsPerCapita: 8.1,
    cumulativeEmissions: 284000000000,
    trend: { direction: 'stable', changePercent: 0.5 },
  },
  IND: {
    code: 'IND',
    name: 'India',
    region: 'Asia',
    population: 1380000000,
    gdpPerCapita: 2400,
    emissions: 2700000000, // 2.7 Gt
    emissionsPerCapita: 2.0,
    cumulativeEmissions: 54000000000,
    trend: { direction: 'increasing', changePercent: 4.2 },
  },
  GBR: {
    code: 'GBR',
    name: 'United Kingdom',
    region: 'Europe',
    population: 67000000,
    gdpPerCapita: 46000,
    emissions: 320000000,
    emissionsPerCapita: 4.7,
    cumulativeEmissions: 78000000000,
    trend: { direction: 'decreasing', changePercent: -4.5 },
  },
  DEU: {
    code: 'DEU',
    name: 'Germany',
    region: 'Europe',
    population: 83000000,
    gdpPerCapita: 51000,
    emissions: 640000000,
    emissionsPerCapita: 7.7,
    cumulativeEmissions: 92000000000,
    trend: { direction: 'decreasing', changePercent: -3.2 },
  },
  FRA: {
    code: 'FRA',
    name: 'France',
    region: 'Europe',
    population: 67000000,
    gdpPerCapita: 44000,
    emissions: 290000000,
    emissionsPerCapita: 4.3,
    cumulativeEmissions: 38000000000,
    trend: { direction: 'stable', changePercent: -0.5 },
  },
  JPN: {
    code: 'JPN',
    name: 'Japan',
    region: 'Asia',
    population: 125000000,
    gdpPerCapita: 39000,
    emissions: 1060000000,
    emissionsPerCapita: 8.5,
    cumulativeEmissions: 68000000000,
    trend: { direction: 'decreasing', changePercent: -1.8 },
  },
  BRA: {
    code: 'BRA',
    name: 'Brazil',
    region: 'South America',
    population: 214000000,
    gdpPerCapita: 8900,
    emissions: 480000000,
    emissionsPerCapita: 2.2,
    cumulativeEmissions: 15000000000,
    trend: { direction: 'stable', changePercent: 1.2 },
  },
  CAN: {
    code: 'CAN',
    name: 'Canada',
    region: 'North America',
    population: 38000000,
    gdpPerCapita: 52000,
    emissions: 570000000,
    emissionsPerCapita: 15.0,
    cumulativeEmissions: 32000000000,
    trend: { direction: 'stable', changePercent: -0.3 },
  },
  AUS: {
    code: 'AUS',
    name: 'Australia',
    region: 'Oceania',
    population: 26000000,
    gdpPerCapita: 60000,
    emissions: 380000000,
    emissionsPerCapita: 14.6,
    cumulativeEmissions: 18000000000,
    trend: { direction: 'decreasing', changePercent: -2.5 },
  },
  RUS: {
    code: 'RUS',
    name: 'Russia',
    region: 'Europe',
    population: 144000000,
    gdpPerCapita: 12000,
    emissions: 1760000000,
    emissionsPerCapita: 12.2,
    cumulativeEmissions: 115000000000,
    trend: { direction: 'stable', changePercent: 0.8 },
  },
  KOR: {
    code: 'KOR',
    name: 'South Korea',
    region: 'Asia',
    population: 52000000,
    gdpPerCapita: 34000,
    emissions: 590000000,
    emissionsPerCapita: 11.3,
    cumulativeEmissions: 18000000000,
    trend: { direction: 'stable', changePercent: 1.0 },
  },
  MEX: {
    code: 'MEX',
    name: 'Mexico',
    region: 'North America',
    population: 129000000,
    gdpPerCapita: 10000,
    emissions: 470000000,
    emissionsPerCapita: 3.6,
    cumulativeEmissions: 18000000000,
    trend: { direction: 'stable', changePercent: 0.5 },
  },
  IDN: {
    code: 'IDN',
    name: 'Indonesia',
    region: 'Asia',
    population: 274000000,
    gdpPerCapita: 4300,
    emissions: 620000000,
    emissionsPerCapita: 2.3,
    cumulativeEmissions: 12000000000,
    trend: { direction: 'increasing', changePercent: 3.5 },
  },
  SAU: {
    code: 'SAU',
    name: 'Saudi Arabia',
    region: 'Asia',
    population: 35000000,
    gdpPerCapita: 23000,
    emissions: 590000000,
    emissionsPerCapita: 16.8,
    cumulativeEmissions: 18000000000,
    trend: { direction: 'increasing', changePercent: 2.1 },
  },
  ZAF: {
    code: 'ZAF',
    name: 'South Africa',
    region: 'Africa',
    population: 60000000,
    gdpPerCapita: 6000,
    emissions: 430000000,
    emissionsPerCapita: 7.2,
    cumulativeEmissions: 15000000000,
    trend: { direction: 'stable', changePercent: -0.8 },
  },
  NGA: {
    code: 'NGA',
    name: 'Nigeria',
    region: 'Africa',
    population: 213000000,
    gdpPerCapita: 2100,
    emissions: 135000000,
    emissionsPerCapita: 0.6,
    cumulativeEmissions: 3000000000,
    trend: { direction: 'increasing', changePercent: 2.8 },
  },
  NLD: {
    code: 'NLD',
    name: 'Netherlands',
    region: 'Europe',
    population: 17500000,
    gdpPerCapita: 57000,
    emissions: 140000000,
    emissionsPerCapita: 8.0,
    cumulativeEmissions: 12000000000,
    trend: { direction: 'decreasing', changePercent: -3.8 },
  },
  SWE: {
    code: 'SWE',
    name: 'Sweden',
    region: 'Europe',
    population: 10500000,
    gdpPerCapita: 56000,
    emissions: 37000000,
    emissionsPerCapita: 3.5,
    cumulativeEmissions: 4500000000,
    trend: { direction: 'decreasing', changePercent: -5.2 },
  },
  NOR: {
    code: 'NOR',
    name: 'Norway',
    region: 'Europe',
    population: 5500000,
    gdpPerCapita: 89000,
    emissions: 41000000,
    emissionsPerCapita: 7.5,
    cumulativeEmissions: 2800000000,
    trend: { direction: 'decreasing', changePercent: -2.0 },
  },
};

// Historical per capita emissions for context
const HISTORICAL_EMISSIONS: HistoricalComparison[] = [
  { year: 1960, country: 'USA', countryName: 'United States', perCapita: 16.0 },
  { year: 1970, country: 'USA', countryName: 'United States', perCapita: 20.0 },
  { year: 1980, country: 'USA', countryName: 'United States', perCapita: 19.5 },
  { year: 1990, country: 'USA', countryName: 'United States', perCapita: 19.0 },
  { year: 2000, country: 'USA', countryName: 'United States', perCapita: 20.2 },
  { year: 2010, country: 'USA', countryName: 'United States', perCapita: 17.0 },
  {
    year: 1960,
    country: 'GBR',
    countryName: 'United Kingdom',
    perCapita: 11.0,
  },
  { year: 1980, country: 'GBR', countryName: 'United Kingdom', perCapita: 9.5 },
  { year: 2000, country: 'GBR', countryName: 'United Kingdom', perCapita: 9.0 },
  { year: 1960, country: 'DEU', countryName: 'Germany', perCapita: 10.5 },
  { year: 1990, country: 'DEU', countryName: 'Germany', perCapita: 12.0 },
  { year: 1960, country: 'FRA', countryName: 'France', perCapita: 6.0 },
  { year: 1990, country: 'FRA', countryName: 'France', perCapita: 6.5 },
  { year: 1960, country: 'JPN', countryName: 'Japan', perCapita: 3.0 },
  { year: 1990, country: 'JPN', countryName: 'Japan', perCapita: 9.0 },
  { year: 1990, country: 'CHN', countryName: 'China', perCapita: 2.0 },
  { year: 2010, country: 'CHN', countryName: 'China', perCapita: 6.0 },
  { year: 1990, country: 'IND', countryName: 'India', perCapita: 0.8 },
  { year: 2010, country: 'IND', countryName: 'India', perCapita: 1.4 },
];

// Global constants
const GLOBAL_AVERAGES: GlobalAverages = {
  worldEmissions: 37.4, // Gt CO2 (2023)
  worldPerCapita: 4.7, // tonnes per person
  medianPerCapita: 2.8, // median country
  parisAlignedTarget: 2.5, // 2030 target to stay below 1.5°C
  netZeroTarget: 0.5, // 2050 target
};

// =============================================================================
// Global Context Service
// =============================================================================

class GlobalContextService {
  private static instance: GlobalContextService;
  private readonly CACHE_PREFIX = 'global_context_';

  private constructor() {}

  public static getInstance(): GlobalContextService {
    if (!GlobalContextService.instance) {
      GlobalContextService.instance = new GlobalContextService();
    }
    return GlobalContextService.instance;
  }

  // ===========================================================================
  // Country Data
  // ===========================================================================

  /**
   * Get data for a specific country
   */
  getCountryData(countryCode: string): CountryData | null {
    return COUNTRY_DATA[countryCode.toUpperCase()] || null;
  }

  /**
   * Get all available countries
   */
  getAllCountries(): CountryData[] {
    return Object.values(COUNTRY_DATA);
  }

  /**
   * Get country per capita emissions
   */
  getCountryPerCapita(countryCode: string): number {
    const country = this.getCountryData(countryCode);
    return country?.emissionsPerCapita || GLOBAL_AVERAGES.worldPerCapita;
  }

  /**
   * Get countries by region
   */
  getCountriesByRegion(region: string): CountryData[] {
    return Object.values(COUNTRY_DATA).filter(
      c => c.region.toLowerCase() === region.toLowerCase(),
    );
  }

  // ===========================================================================
  // Global Averages
  // ===========================================================================

  /**
   * Get global averages
   */
  getGlobalAverages(): GlobalAverages {
    return { ...GLOBAL_AVERAGES };
  }

  /**
   * Get world per capita average
   */
  getWorldPerCapita(): number {
    return GLOBAL_AVERAGES.worldPerCapita;
  }

  /**
   * Get Paris-aligned target
   */
  getParisAlignedTarget(): number {
    return GLOBAL_AVERAGES.parisAlignedTarget;
  }

  // ===========================================================================
  // User Context
  // ===========================================================================

  /**
   * Get comprehensive global context for a user
   */
  async getUserGlobalContext(
    userFootprint: number,
    countryCode: string,
  ): Promise<UserGlobalContext> {
    const country = this.getCountryData(countryCode);
    const countryAverage =
      country?.emissionsPerCapita || GLOBAL_AVERAGES.worldPerCapita;
    const worldAverage = GLOBAL_AVERAGES.worldPerCapita;

    // Calculate comparisons
    const vsCountryDiff = userFootprint - countryAverage;
    const vsWorldDiff = userFootprint - worldAverage;

    // Calculate percentiles
    const globalPercentile = this.calculateGlobalPercentile(userFootprint);
    const countryPercentile = this.calculateCountryPercentile(
      userFootprint,
      countryCode,
    );

    // Find historical equivalent
    const historicalEquivalent = this.findHistoricalEquivalent(userFootprint);

    // Calculate gaps to targets
    const parisGap = Math.max(
      0,
      userFootprint - GLOBAL_AVERAGES.parisAlignedTarget,
    );
    const netZeroGap = Math.max(
      0,
      userFootprint - GLOBAL_AVERAGES.netZeroTarget,
    );

    // Generate insights
    const insights = this.generateInsights(
      userFootprint,
      countryAverage,
      worldAverage,
      globalPercentile,
      country,
    );

    return {
      userFootprint,
      countryCode,
      countryName: country?.name || countryCode,
      countryAverage,
      worldAverage,
      vsCountryAverage: {
        difference: vsCountryDiff,
        percentDifference: (vsCountryDiff / countryAverage) * 100,
        isBelowAverage: vsCountryDiff < 0,
      },
      vsWorldAverage: {
        difference: vsWorldDiff,
        percentDifference: (vsWorldDiff / worldAverage) * 100,
        isBelowAverage: vsWorldDiff < 0,
      },
      globalPercentile,
      countryPercentile,
      historicalEquivalent,
      parisGap,
      netZeroGap,
      insights,
    };
  }

  /**
   * Calculate where user falls in global emissions distribution
   * Returns percentile (e.g., 15 means user is in top 15% of emitters)
   */
  private calculateGlobalPercentile(userFootprint: number): number {
    // Based on global distribution (simplified model)
    // Most people emit 0-2 tonnes, wealthy nations 8-20+ tonnes
    if (userFootprint <= 1) return 95; // Bottom 5%
    if (userFootprint <= 2) return 80; // Bottom 20%
    if (userFootprint <= 4) return 60; // Bottom 40%
    if (userFootprint <= 6) return 45; // Bottom 55%
    if (userFootprint <= 8) return 30; // Top 30%
    if (userFootprint <= 12) return 15; // Top 15%
    if (userFootprint <= 16) return 8; // Top 8%
    if (userFootprint <= 20) return 4; // Top 4%
    return 2; // Top 2%
  }

  /**
   * Calculate where user falls in their country's distribution
   */
  private calculateCountryPercentile(
    userFootprint: number,
    countryCode: string,
  ): number {
    const country = this.getCountryData(countryCode);
    if (!country) return 50;

    const countryAvg = country.emissionsPerCapita;
    const ratio = userFootprint / countryAvg;

    // Assume normal-ish distribution around country average
    if (ratio <= 0.3) return 95;
    if (ratio <= 0.5) return 80;
    if (ratio <= 0.75) return 60;
    if (ratio <= 1.0) return 45;
    if (ratio <= 1.25) return 30;
    if (ratio <= 1.5) return 18;
    if (ratio <= 2.0) return 8;
    return 3;
  }

  /**
   * Find a historical equivalent for user's footprint
   */
  private findHistoricalEquivalent(userFootprint: number): {
    year: number;
    country: string;
    description: string;
  } {
    // Find closest match in historical data
    let closest = HISTORICAL_EMISSIONS[0];
    let closestDiff = Math.abs(userFootprint - closest.perCapita);

    for (const entry of HISTORICAL_EMISSIONS) {
      const diff = Math.abs(userFootprint - entry.perCapita);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = entry;
      }
    }

    return {
      year: closest.year,
      country: closest.countryName,
      description: `Similar to the average ${closest.countryName} resident in ${closest.year}`,
    };
  }

  /**
   * Generate personalized insights based on user's context
   */
  private generateInsights(
    userFootprint: number,
    countryAverage: number,
    worldAverage: number,
    globalPercentile: number,
    country: CountryData | null,
  ): string[] {
    const insights: string[] = [];

    // Global comparison
    if (userFootprint < worldAverage) {
      insights.push(
        `You're ${((1 - userFootprint / worldAverage) * 100).toFixed(
          0,
        )}% below the global average! 🌍`,
      );
    } else {
      insights.push(
        `You emit ${(userFootprint / worldAverage).toFixed(
          1,
        )}x the global average`,
      );
    }

    // Country comparison
    if (country && userFootprint < countryAverage) {
      insights.push(
        `You're ${((1 - userFootprint / countryAverage) * 100).toFixed(
          0,
        )}% below the ${country.name} average`,
      );
    }

    // Percentile insight
    if (globalPercentile <= 20) {
      insights.push(
        `You're in the top ${100 - globalPercentile}% of global emitters`,
      );
    } else if (globalPercentile >= 80) {
      insights.push(
        `You're in the bottom ${
          100 - globalPercentile
        }% of global emitters - great job!`,
      );
    }

    // Paris alignment
    if (userFootprint <= GLOBAL_AVERAGES.parisAlignedTarget) {
      insights.push("🎉 You're already Paris-aligned for 2030!");
    } else {
      const reduction = userFootprint - GLOBAL_AVERAGES.parisAlignedTarget;
      insights.push(
        `Reduce ${reduction.toFixed(1)}t more to be Paris-aligned for 2030`,
      );
    }

    // World citizen badge hint
    if (userFootprint <= worldAverage && userFootprint > worldAverage * 0.9) {
      insights.push(
        "Almost there! A bit more effort and you'll unlock the World Citizen badge",
      );
    }

    return insights;
  }

  // ===========================================================================
  // Rankings & Leaderboards
  // ===========================================================================

  /**
   * Get countries ranked by per capita emissions
   */
  getCountryRankings(order: 'asc' | 'desc' = 'desc'): CountryData[] {
    const countries = Object.values(COUNTRY_DATA);
    return countries.sort((a, b) =>
      order === 'desc'
        ? b.emissionsPerCapita - a.emissionsPerCapita
        : a.emissionsPerCapita - b.emissionsPerCapita,
    );
  }

  /**
   * Get countries making the most progress (decreasing emissions)
   */
  getProgressLeaders(): CountryData[] {
    return Object.values(COUNTRY_DATA)
      .filter(c => c.trend.direction === 'decreasing')
      .sort((a, b) => a.trend.changePercent - b.trend.changePercent);
  }

  /**
   * Get country's rank in per capita emissions
   */
  getCountryRank(countryCode: string): number {
    const rankings = this.getCountryRankings('desc');
    const index = rankings.findIndex(c => c.code === countryCode.toUpperCase());
    return index === -1 ? rankings.length : index + 1;
  }

  // ===========================================================================
  // Impact Calculations
  // ===========================================================================

  /**
   * Calculate the global impact if everyone matched user's footprint
   */
  calculateGlobalImpact(userFootprint: number): {
    totalEmissions: number;
    difference: number;
    percentChange: number;
    description: string;
  } {
    const worldPopulation = 8e9;
    const currentGlobalEmissions = GLOBAL_AVERAGES.worldEmissions * 1e9; // tonnes
    const ifEveryoneMatched = userFootprint * worldPopulation;
    const difference = ifEveryoneMatched - currentGlobalEmissions;
    const percentChange = (difference / currentGlobalEmissions) * 100;

    let description: string;
    if (percentChange < -50) {
      description = 'Global emissions would drop dramatically!';
    } else if (percentChange < -20) {
      description = 'Global emissions would significantly decrease';
    } else if (percentChange < 0) {
      description = 'Global emissions would decrease';
    } else if (percentChange < 20) {
      description = 'Global emissions would slightly increase';
    } else {
      description = 'Global emissions would increase significantly';
    }

    return {
      totalEmissions: ifEveryoneMatched / 1e9, // Gt
      difference: difference / 1e9, // Gt
      percentChange,
      description,
    };
  }

  /**
   * Calculate how many "Earths" we'd need if everyone lived like the user
   */
  calculateEarthsNeeded(userFootprint: number): number {
    // Sustainable per capita is roughly 2 tonnes
    const sustainablePerCapita = 2.0;
    return userFootprint / sustainablePerCapita;
  }

  // ===========================================================================
  // Formatting Helpers
  // ===========================================================================

  /**
   * Format footprint with context
   */
  formatFootprintWithContext(
    userFootprint: number,
    countryCode: string,
  ): string {
    const country = this.getCountryData(countryCode);
    const countryAvg =
      country?.emissionsPerCapita || GLOBAL_AVERAGES.worldPerCapita;

    if (userFootprint < countryAvg) {
      const percent = ((1 - userFootprint / countryAvg) * 100).toFixed(0);
      return `${userFootprint.toFixed(1)}t/yr (${percent}% below ${
        country?.name || 'country'
      } avg)`;
    } else {
      const percent = ((userFootprint / countryAvg - 1) * 100).toFixed(0);
      return `${userFootprint.toFixed(1)}t/yr (${percent}% above ${
        country?.name || 'country'
      } avg)`;
    }
  }

  /**
   * Get emoji indicator for footprint level
   */
  getFootprintEmoji(userFootprint: number): string {
    if (userFootprint <= 2) return '🌱'; // Excellent
    if (userFootprint <= 4) return '🌿'; // Good
    if (userFootprint <= 6) return '🌲'; // Average
    if (userFootprint <= 10) return '🏭'; // Above average
    return '💨'; // High
  }

  /**
   * Get progress color based on comparison
   */
  getProgressColor(userFootprint: number, target: number): string {
    const ratio = userFootprint / target;
    if (ratio <= 0.8) return '#22C55E'; // Green
    if (ratio <= 1.0) return '#84CC16'; // Lime
    if (ratio <= 1.2) return '#EAB308'; // Yellow
    if (ratio <= 1.5) return '#F97316'; // Orange
    return '#EF4444'; // Red
  }
}

// Export singleton instance
export const globalContextService = GlobalContextService.getInstance();
export default GlobalContextService;
