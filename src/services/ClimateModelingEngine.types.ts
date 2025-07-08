/**
 * 🌍 Climate Modeling Engine - Type Definitions
 * Following KISS principle: Simple, focused types for climate predictions
 * File size target: <100 lines for easy maintenance
 */

// Core Climate Prediction Types
export interface ClimateModelingResult {
  readonly globalPrediction: GlobalClimateData;
  readonly localPrediction: LocalClimateData;
  readonly carbonImpact: CarbonImpactProjection;
  readonly scenarios: ClimateScenario[];
  readonly confidence: ModelConfidence;
  readonly dataSource: DataSourceInfo;
}

export interface GlobalClimateData {
  readonly temperature: TemperatureProjection;
  readonly precipitation: PrecipitationProjection;
  readonly seaLevel: SeaLevelProjection;
  readonly extremeEvents: ExtremeEventProjection;
  readonly carbonCycle: CarbonCycleData;
}

export interface LocalClimateData {
  readonly coordinates: GeographicCoordinate;
  readonly temperature: TemperatureProjection;
  readonly precipitation: PrecipitationProjection;
  readonly airQuality: AirQualityProjection;
  readonly ecosystemHealth: EcosystemHealthProjection;
  readonly userRelevance: UserRelevanceScore;
}

export interface CarbonImpactProjection {
  readonly currentEmissions: number; // tons CO2e
  readonly projectedEmissions: EmissionProjection[];
  readonly reductionPotential: number; // tons CO2e
  readonly offsetRequirement: number; // tons CO2e
  readonly timelineToNeutral: number; // years
}

// Temperature and Weather Types
export interface TemperatureProjection {
  readonly current: number; // Celsius
  readonly projections: TimeSeriesProjection[];
  readonly anomaly: number; // vs 1900-2000 baseline
  readonly extremes: TemperatureExtremes;
}

export interface PrecipitationProjection {
  readonly current: number; // mm/year
  readonly projections: TimeSeriesProjection[];
  readonly seasonality: SeasonalPattern[];
  readonly droughtRisk: RiskAssessment;
  readonly floodRisk: RiskAssessment;
}

export interface TimeSeriesProjection {
  readonly year: number;
  readonly value: number;
  readonly uncertainty: _UncertaintyRange;
  readonly scenario: string; // RCP2.6, RCP4.5, RCP8.5
}

export interface _UncertaintyRange {
  readonly lower: number; // 5th percentile
  readonly upper: number; // 95th percentile
  readonly median: number; // 50th percentile
}

// Climate Scenarios and Models
export interface ClimateScenario {
  readonly id: string;
  readonly name: string; // "Current Policies", "Paris Agreement", "Net Zero 2050"
  readonly description: string;
  readonly emissions: EmissionPathway;
  readonly impacts: ScenarioImpacts;
  readonly probability: number; // 0-1
}

export interface EmissionPathway {
  readonly co2: TimeSeriesProjection[];
  readonly methane: TimeSeriesProjection[];
  readonly nitrousOxide: TimeSeriesProjection[];
  readonly totalGHG: TimeSeriesProjection[];
}

export interface ScenarioImpacts {
  readonly temperatureIncrease: number; // Celsius by 2100
  readonly seaLevelRise: number; // meters by 2100
  readonly economicImpact: number; // % GDP loss
  readonly biodiversityLoss: number; // % species at risk
}

// API Integration Types
export interface ClimateAPIConfig {
  readonly primaryAPI: 'nasa' | 'noaa' | 'copernicus' | 'openweather';
  readonly fallbackAPIs: string[];
  readonly apiKeys: Record<string, string>;
  readonly cacheTTL: number; // ms
  readonly rateLimit: number; // requests per minute
}

export interface DataSourceInfo {
  readonly primary: string;
  readonly models: string[]; // CMIP6, GFS, ECMWF
  readonly lastUpdated: number; // timestamp
  readonly resolution: string; // "1km", "25km", "100km"
  readonly coverage: 'global' | 'regional' | 'local';
}

// Mobile Processing Constraints
export interface MobileClimateConfig {
  readonly processingLevel: 'light' | 'standard' | 'detailed';
  readonly maxDataSize: number; // bytes
  readonly offlineCapable: boolean;
  readonly updateFrequency: number; // hours
  readonly backgroundProcessing: boolean;
}

// Risk Assessment Types
export interface RiskAssessment {
  readonly level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  readonly probability: number; // 0-1
  readonly timeframe: number; // years
  readonly impact: 'minimal' | 'minor' | 'moderate' | 'major' | 'severe';
}

export interface ModelConfidence {
  readonly overall: number; // 0-1
  readonly temperature: number; // 0-1
  readonly precipitation: number; // 0-1
  readonly extremeEvents: number; // 0-1
  readonly dataQuality: DataQualityMetrics;
}

export interface DataQualityMetrics {
  readonly completeness: number; // 0-1
  readonly accuracy: number; // 0-1
  readonly timeliness: number; // 0-1
  readonly consistency: number; // 0-1
}

// Geographic and User Context
export interface GeographicCoordinate {
  readonly latitude: number;
  readonly longitude: number;
  readonly elevation?: number; // meters
  readonly region: string;
  readonly country: string;
}

export interface UserRelevanceScore {
  readonly overall: number; // 0-1
  readonly personalImpact: number; // 0-1
  readonly actionableInsights: number; // 0-1
  readonly urgency: number; // 0-1
}

// Extended Climate Data Types
export interface SeaLevelProjection {
  readonly current: number; // meters above baseline
  readonly projections: TimeSeriesProjection[];
  readonly coastalRisk: RiskAssessment;
}

export interface ExtremeEventProjection {
  readonly heatWaves: EventFrequency;
  readonly droughts: EventFrequency;
  readonly floods: EventFrequency;
  readonly storms: EventFrequency;
}

export interface EventFrequency {
  readonly historical: number; // events per decade
  readonly projected: number; // events per decade
  readonly intensity: 'low' | 'moderate' | 'high' | 'extreme';
}

export interface AirQualityProjection {
  readonly currentAQI: number;
  readonly projections: TimeSeriesProjection[];
  readonly pollutants: PollutantProjection[];
}

export interface PollutantProjection {
  readonly type: 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO';
  readonly current: number; // μg/m³
  readonly projected: number; // μg/m³
  readonly healthImpact: 'low' | 'moderate' | 'unhealthy' | 'hazardous';
}

export interface EcosystemHealthProjection {
  readonly biodiversityIndex: number; // 0-1
  readonly habitatLoss: number; // % projected loss
  readonly speciesAtRisk: number; // count
  readonly carbonSequestration: number; // tons CO2/year capacity
}

export interface CarbonCycleData {
  readonly atmosphericCO2: number; // ppm
  readonly oceanAcidification: number; // pH
  readonly landCarbonSink: number; // GtC/year
  readonly oceanCarbonSink: number; // GtC/year
}

export interface TemperatureExtremes {
  readonly maxTemperature: number; // Celsius
  readonly minTemperature: number; // Celsius
  readonly heatWaveDays: number; // days per year
  readonly freezingDays: number; // days per year
}

export interface SeasonalPattern {
  readonly season: 'spring' | 'summer' | 'autumn' | 'winter';
  readonly precipitation: number; // mm
  readonly temperature: number; // Celsius
  readonly variability: number; // coefficient of variation
}

export interface EmissionProjection {
  readonly year: number;
  readonly total: number; // tons CO2e
  readonly bySource: Record<string, number>; // transport, energy, etc.
  readonly uncertainty: _UncertaintyRange;
}