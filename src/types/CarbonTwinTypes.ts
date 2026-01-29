/**
 * 🌟 Carbon Twin Type Definitions
 * Comprehensive type system for revolutionary carbon footprint digital twin technology
 */

// Simulation and Analysis Types
export interface SimulationTimeframe {
  readonly start: number;
  readonly end: number;
  readonly resolution: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface SimulationAssumption {
  readonly assumptionId: string;
  readonly category:
    | 'economic'
    | 'behavioral'
    | 'technological'
    | 'environmental'
    | 'social';
  readonly description: string;
  readonly confidence: number;
  readonly impact: 'low' | 'medium' | 'high';
  readonly sensitivity: number;
}

export interface SensitivityAnalysis {
  readonly analysisId: string;
  readonly parameters: SensitivityParameter[];
  readonly scenarios: SensitivityScenario[];
  readonly keyDrivers: KeyDriver[];
  readonly uncertaintyRange: UncertaintyRange;
}

export interface SensitivityParameter {
  readonly parameterId: string;
  readonly name: string;
  readonly baseValue: number;
  readonly range: { min: number; max: number };
  readonly impact: number;
}

export interface SensitivityScenario {
  readonly scenarioId: string;
  readonly name: string;
  readonly parameters: ParameterValue[];
  readonly outcome: SimulationOutcome;
}

export interface KeyDriver {
  readonly driverId: string;
  readonly name: string;
  readonly influence: number;
  readonly controllability: number;
  readonly description: string;
}

export interface UncertaintyRange {
  readonly lower: number;
  readonly upper: number;
  readonly confidence: number;
  readonly distribution: 'normal' | 'uniform' | 'triangular' | 'beta';
}

export interface ScenarioRecommendation {
  readonly recommendationId: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly category:
    | 'implementation'
    | 'risk_mitigation'
    | 'optimization'
    | 'monitoring';
  readonly title: string;
  readonly description: string;
  readonly rationale: string;
  readonly expectedBenefit: string;
  readonly implementation: ImplementationPlan;
}

export interface ImplementationPlan {
  readonly steps: ImplementationStep[];
  readonly timeline: number; // days
  readonly resources: ResourceRequirement[];
  readonly riskFactors: string[];
  readonly successMetrics: string[];
}

export interface ImplementationStep {
  readonly stepId: string;
  readonly name: string;
  readonly description: string;
  readonly duration: number; // days
  readonly dependencies: string[];
  readonly deliverables: string[];
}

export interface ResourceRequirement {
  readonly type: 'financial' | 'time' | 'skill' | 'technology' | 'social';
  readonly amount: number;
  readonly unit: string;
  readonly criticality: 'low' | 'medium' | 'high';
}

// Scenario and Change Types
export interface ScenarioConstraint {
  readonly constraintId: string;
  readonly type: 'budget' | 'time' | 'technology' | 'social' | 'regulatory';
  readonly description: string;
  readonly severity: 'soft' | 'hard';
  readonly impact: number;
}

export interface AdoptionCurve {
  readonly curveType: 'linear' | 'exponential' | 's_curve' | 'step_function';
  readonly parameters: CurveParameter[];
  readonly plateauLevel: number;
  readonly timeToTarget: number; // months
}

export interface CurveParameter {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
}

export interface PhaseInPlan {
  readonly phases: Phase[];
  readonly totalDuration: number; // months
  readonly riskMitigation: string[];
}

export interface Phase {
  readonly phaseId: string;
  readonly name: string;
  readonly duration: number; // months
  readonly targetCompletion: number; // percentage
  readonly milestones: Milestone[];
  readonly dependencies: string[];
}

export interface Milestone {
  readonly milestoneId: string;
  readonly name: string;
  readonly targetDate: number;
  readonly success_criteria: string[];
  readonly deliverables: string[];
}

export interface DifficultyAssessment {
  readonly overall: 'very_easy' | 'easy' | 'moderate' | 'hard' | 'very_hard';
  readonly factors: DifficultyFactor[];
  readonly mitigationStrategies: string[];
  readonly supportRequired: string[];
}

export interface DifficultyFactor {
  readonly factor: string;
  readonly impact: 'low' | 'medium' | 'high';
  readonly description: string;
  readonly mitigation?: string;
}

export interface CostAssessment {
  readonly upfrontCost: number;
  readonly ongoingCost: number;
  readonly savings: number;
  readonly paybackPeriod: number; // months
  readonly netPresentValue: number;
  readonly uncertaintyRange: UncertaintyRange;
}

// Results and Analysis Types
export interface CarbonReductionResult {
  readonly totalReduction: number; // kg CO2e
  readonly percentageReduction: number;
  readonly categoryBreakdown: CategoryReduction[];
  readonly timeline: ReductionTimeline[];
  readonly confidence: number;
}

export interface CategoryReduction {
  readonly category: string;
  readonly reduction: number;
  readonly percentage: number;
  readonly difficulty: 'low' | 'medium' | 'high';
}

export interface ReductionTimeline {
  readonly period: string;
  readonly cumulativeReduction: number;
  readonly incrementalReduction: number;
  readonly confidence: number;
}

export interface CostBenefitAnalysis {
  readonly totalCost: number;
  readonly totalBenefit: number;
  readonly netBenefit: number;
  readonly benefitCostRatio: number;
  readonly paybackPeriod: number;
  readonly sensitivity: CostBenefitSensitivity;
}

export interface CostBenefitSensitivity {
  readonly optimistic: CostBenefitOutcome;
  readonly pessimistic: CostBenefitOutcome;
  readonly mostLikely: CostBenefitOutcome;
}

export interface CostBenefitOutcome {
  readonly netBenefit: number;
  readonly paybackPeriod: number;
  readonly riskLevel: 'low' | 'medium' | 'high';
}

export interface LifestyleImpactAnalysis {
  readonly convenienceImpact: ImpactMagnitude;
  readonly satisfactionImpact: ImpactMagnitude;
  readonly socialImpact: ImpactMagnitude;
  readonly healthImpact: ImpactMagnitude;
  readonly timeImpact: ImpactMagnitude;
  readonly overallLifestyleChange: LifestyleChangeAssessment;
}

export interface ImpactMagnitude {
  readonly score: number; // -10 to +10
  readonly confidence: number;
  readonly description: string;
  readonly mitigationStrategies: string[];
}

export interface LifestyleChangeAssessment {
  readonly adaptationDifficulty:
    | 'minimal'
    | 'low'
    | 'moderate'
    | 'high'
    | 'extreme';
  readonly adaptationTime: number; // months
  readonly sustainabilityRisk: 'low' | 'medium' | 'high';
  readonly supportNeeded: string[];
}

export interface TimelineAnalysis {
  readonly phases: TimelinePhase[];
  readonly criticalPath: CriticalPathItem[];
  readonly dependencies: TimelineDependency[];
  readonly risks: TimelineRisk[];
}

export interface TimelinePhase {
  readonly phaseId: string;
  readonly name: string;
  readonly startDate: number;
  readonly endDate: number;
  readonly objectives: string[];
  readonly deliverables: string[];
  readonly successMetrics: string[];
}

export interface CriticalPathItem {
  readonly itemId: string;
  readonly name: string;
  readonly duration: number;
  readonly earlistStart: number;
  readonly latestStart: number;
  readonly slack: number;
}

export interface TimelineDependency {
  readonly dependencyId: string;
  readonly predecessor: string;
  readonly successor: string;
  readonly type:
    | 'finish_to_start'
    | 'start_to_start'
    | 'finish_to_finish'
    | 'start_to_finish';
  readonly lag: number; // days
}

export interface TimelineRisk {
  readonly riskId: string;
  readonly name: string;
  readonly probability: number;
  readonly impact: 'low' | 'medium' | 'high';
  readonly mitigation: string;
  readonly contingency: string;
}

export interface RiskAssessment {
  readonly riskId: string;
  readonly category:
    | 'implementation'
    | 'adoption'
    | 'technical'
    | 'financial'
    | 'social';
  readonly description: string;
  readonly probability: number;
  readonly impact: ImpactMagnitude;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly mitigation: MitigationStrategy;
  readonly contingency: ContingencyPlan;
}

export interface MitigationStrategy {
  readonly strategyId: string;
  readonly description: string;
  readonly effectiveness: number;
  readonly cost: number;
  readonly timeframe: number; // days
}

export interface ContingencyPlan {
  readonly planId: string;
  readonly trigger: string;
  readonly actions: string[];
  readonly resources: ResourceRequirement[];
  readonly timeline: number; // days
}

export interface OpportunityAssessment {
  readonly opportunityId: string;
  readonly category:
    | 'cost_savings'
    | 'carbon_reduction'
    | 'innovation'
    | 'social_benefit';
  readonly description: string;
  readonly potential: ImpactMagnitude;
  readonly feasibility: number;
  readonly requirements: string[];
  readonly timeline: number; // months
}

// Projection and Trajectory Types
export interface EmissionMilestone {
  readonly milestoneId: string;
  readonly name: string;
  readonly targetDate: number;
  readonly targetEmission: number;
  readonly requirements: string[];
  readonly riskFactors: string[];
}

export interface ExternalFactor {
  readonly factorId: string;
  readonly type:
    | 'economic'
    | 'technological'
    | 'regulatory'
    | 'social'
    | 'environmental';
  readonly description: string;
  readonly impact: ImpactTrajectory;
  readonly uncertainty: UncertaintyRange;
  readonly controllability: 'none' | 'low' | 'medium' | 'high';
}

export interface ImpactTrajectory {
  readonly trajectory: TrajectoryPoint[];
  readonly peakImpact: number;
  readonly peakYear: number;
  readonly longTermTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface TrajectoryPoint {
  readonly year: number;
  readonly value: number;
  readonly confidence: number;
}

export interface AdaptationStrategy {
  readonly strategyId: string;
  readonly name: string;
  readonly description: string;
  readonly trigger: AdaptationTrigger;
  readonly actions: AdaptationAction[];
  readonly effectiveness: number;
  readonly cost: number;
}

export interface AdaptationTrigger {
  readonly triggerId: string;
  readonly condition: string;
  readonly threshold: number;
  readonly monitoring: string[];
}

export interface AdaptationAction {
  readonly actionId: string;
  readonly name: string;
  readonly description: string;
  readonly timeline: number; // months
  readonly resources: ResourceRequirement[];
}

export interface CategoryEmission {
  readonly category: string;
  readonly emissions: number;
  readonly percentage: number;
  readonly trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ActiveIntervention {
  readonly interventionId: string;
  readonly name: string;
  readonly impact: number;
  readonly status: 'planned' | 'active' | 'completed';
}

export interface CarbonBudget {
  readonly totalBudget: number; // lifetime CO2e allowance
  readonly remainingBudget: number;
  readonly annualAllowance: number;
  readonly exceedanceRisk: number;
  readonly mitigationRequired: number;
}

export interface OffsetRequirement {
  readonly year: number;
  readonly requiredOffsets: number;
  readonly type: 'voluntary' | 'compliance';
  readonly costEstimate: number;
  readonly sources: OffsetSource[];
}

export interface OffsetSource {
  readonly sourceId: string;
  readonly type:
    | 'forestry'
    | 'renewable_energy'
    | 'direct_air_capture'
    | 'other';
  readonly quantity: number;
  readonly costPerTon: number;
  readonly verification: string;
  readonly permanence: number; // years
}

// Testing and Experimentation Types
export interface TestingFramework {
  readonly frameworkId: string;
  readonly methodology:
    | 'ab_testing'
    | 'multivariate'
    | 'factorial'
    | 'sequential';
  readonly sampleSize: number;
  readonly powerAnalysis: PowerAnalysis;
  readonly statisticalSignificance: number;
  readonly duration: number; // days
}

export interface PowerAnalysis {
  readonly effect_size: number;
  readonly alpha: number;
  readonly beta: number;
  readonly power: number;
  readonly minimumSampleSize: number;
}

export interface LearningInsight {
  readonly insightId: string;
  readonly category: 'behavior' | 'intervention' | 'context' | 'methodology';
  readonly description: string;
  readonly confidence: number;
  readonly applicability: string[];
  readonly implications: string[];
}

export interface OptimizationSuggestion {
  readonly suggestionId: string;
  readonly priority: 'low' | 'medium' | 'high';
  readonly category: 'design' | 'targeting' | 'timing' | 'messaging';
  readonly description: string;
  readonly expectedImprovement: number;
  readonly implementationEffort: 'low' | 'medium' | 'high';
}

export interface CompletedExperiment {
  readonly experimentId: string;
  readonly results: ExperimentResults;
  readonly insights: LearningInsight[];
  readonly recommendations: string[];
  readonly completedAt: number;
}

export interface ExperimentResults {
  readonly primaryMetrics: MetricResult[];
  readonly secondaryMetrics: MetricResult[];
  readonly statisticalSignificance: StatisticalTest[];
  readonly effectSizes: EffectSize[];
  readonly confidenceIntervals: ConfidenceInterval[];
}

export interface MetricResult {
  readonly metricId: string;
  readonly baseline: number;
  readonly treatment: number;
  readonly change: number;
  readonly percentChange: number;
  readonly significance: number;
}

export interface StatisticalTest {
  readonly testType: 'ttest' | 'mann_whitney' | 'chi_square' | 'anova';
  readonly statistic: number;
  readonly pValue: number;
  readonly significant: boolean;
  readonly effectSize: number;
}

export interface EffectSize {
  readonly metric: string;
  readonly cohensD?: number;
  readonly eta_squared?: number;
  readonly cramersV?: number;
  readonly interpretation: 'negligible' | 'small' | 'medium' | 'large';
}

export interface ConfidenceInterval {
  readonly metric: string;
  readonly confidence_level: number;
  readonly lower: number;
  readonly upper: number;
  readonly interpretation: string;
}

// Family and Generational Types
export interface FamilyStructure {
  readonly familyId: string;
  readonly members: FamilyMember[];
  readonly relationships: FamilyRelationship[];
  readonly sharedResources: SharedResource[];
  readonly decisionMaking: DecisionMakingPattern;
}

export interface FamilyMember {
  readonly memberId: string;
  readonly role: 'parent' | 'child' | 'grandparent' | 'other';
  readonly age: number;
  readonly influence: number; // on family carbon decisions
  readonly engagement: number; // with sustainability
  readonly carbonAwareness: number;
}

export interface FamilyRelationship {
  readonly relationshipId: string;
  readonly member1: string;
  readonly member2: string;
  readonly influence_direction:
    | 'bidirectional'
    | 'member1_to_member2'
    | 'member2_to_member1';
  readonly influence_strength: number;
}

export interface SharedResource {
  readonly resourceId: string;
  readonly type: 'vehicle' | 'home_energy' | 'food_budget' | 'travel_budget';
  readonly carbonImpact: number;
  readonly decisionMakers: string[];
  readonly optimizationPotential: number;
}

export interface DecisionMakingPattern {
  readonly patternId: string;
  readonly style: 'consensus' | 'hierarchical' | 'democratic' | 'individual';
  readonly carbonDecisionWeight: number;
  readonly influences: DecisionInfluence[];
}

export interface DecisionInfluence {
  readonly factor:
    | 'cost'
    | 'convenience'
    | 'social_pressure'
    | 'environmental_concern'
    | 'health';
  readonly weight: number;
  readonly variability: number;
}

export interface InheritancePattern {
  readonly patternId: string;
  readonly type: 'behavioral' | 'material' | 'knowledge' | 'values';
  readonly transmission_strength: number;
  readonly persistence: number; // generations
  readonly carbonRelevance: number;
}

export interface EducationalLegacy {
  readonly legacyId: string;
  readonly knowledge_areas: KnowledgeArea[];
  readonly teaching_methods: TeachingMethod[];
  readonly impact_measurement: ImpactMeasurement;
  readonly sustainability: number; // likelihood of persistence
}

export interface KnowledgeArea {
  readonly areaId: string;
  readonly name: string;
  readonly depth: 'basic' | 'intermediate' | 'advanced' | 'expert';
  readonly relevance: number;
  readonly transferability: number;
}

export interface TeachingMethod {
  readonly methodId: string;
  readonly approach: 'modeling' | 'instruction' | 'experience' | 'discussion';
  readonly effectiveness: number;
  readonly age_appropriateness: AgeRange[];
}

export interface AgeRange {
  readonly min_age: number;
  readonly max_age: number;
  readonly effectiveness: number;
}

export interface ImpactMeasurement {
  readonly measurementId: string;
  readonly metrics: EducationalMetric[];
  readonly assessment_frequency: number; // months
  readonly long_term_tracking: boolean;
}

export interface EducationalMetric {
  readonly metricId: string;
  readonly name: string;
  readonly type: 'knowledge' | 'behavior' | 'attitude' | 'skills';
  readonly measurement_method: string;
  readonly baseline: number;
  readonly target: number;
}

export interface CommunityInfluence {
  readonly influenceId: string;
  readonly community_types: CommunityType[];
  readonly influence_mechanisms: InfluenceMechanism[];
  readonly network_effects: NetworkEffect[];
  readonly sustainability_culture: SustainabilityCulture;
}

export interface CommunityType {
  readonly typeId: string;
  readonly name: string;
  readonly size: number;
  readonly engagement_level: number;
  readonly carbon_focus: number;
  readonly influence_reach: number;
}

export interface InfluenceMechanism {
  readonly mechanismId: string;
  readonly type:
    | 'social_proof'
    | 'peer_pressure'
    | 'education'
    | 'incentives'
    | 'competition';
  readonly effectiveness: number;
  readonly scalability: number;
  readonly cost: number;
}

export interface NetworkEffect {
  readonly effectId: string;
  readonly type: 'viral' | 'contagion' | 'cascade' | 'amplification';
  readonly strength: number;
  readonly reach: number;
  readonly time_to_peak: number; // months
}

export interface SustainabilityCulture {
  readonly cultureId: string;
  readonly values: CulturalValue[];
  readonly norms: SocialNorm[];
  readonly practices: CulturalPractice[];
  readonly evolution_rate: number;
}

export interface CulturalValue {
  readonly valueId: string;
  readonly name: string;
  readonly strength: number;
  readonly stability: number;
  readonly carbon_alignment: number;
}

export interface SocialNorm {
  readonly normId: string;
  readonly description: string;
  readonly adherence: number;
  readonly enforcement: number;
  readonly carbon_benefit: number;
}

export interface CulturalPractice {
  readonly practiceId: string;
  readonly name: string;
  readonly adoption_rate: number;
  readonly carbon_impact: number;
  readonly sustainability: number;
}

export interface FutureGenerationProjection {
  readonly projectionId: string;
  readonly generation: number; // 1=children, 2=grandchildren, etc.
  readonly population_estimate: number;
  readonly carbon_behavior_prediction: BehaviorPrediction;
  readonly environmental_context: EnvironmentalContext;
  readonly influence_decay: number;
}

export interface BehaviorPrediction {
  readonly predictionId: string;
  readonly behaviors: PredictedBehavior[];
  readonly confidence: number;
  readonly uncertainty_factors: string[];
}

export interface PredictedBehavior {
  readonly behaviorId: string;
  readonly description: string;
  readonly adoption_probability: number;
  readonly carbon_impact: number;
  readonly influence_source: 'inherited' | 'contextual' | 'innovation';
}

export interface EnvironmentalContext {
  readonly contextId: string;
  readonly climate_conditions: ClimateCondition[];
  readonly technology_landscape: TechnologyLandscape;
  readonly policy_environment: PolicyEnvironment;
  readonly social_conditions: SocialCondition[];
}

export interface ClimateCondition {
  readonly conditionId: string;
  readonly type:
    | 'temperature'
    | 'precipitation'
    | 'extreme_events'
    | 'sea_level';
  readonly projected_change: number;
  readonly uncertainty: number;
  readonly adaptation_needs: string[];
}

export interface TechnologyLandscape {
  readonly landscapeId: string;
  readonly key_technologies: EmergingTechnology[];
  readonly adoption_rates: TechnologyAdoption[];
  readonly disruption_potential: DisruptionPotential[];
}

export interface EmergingTechnology {
  readonly technologyId: string;
  readonly name: string;
  readonly maturity_level:
    | 'research'
    | 'development'
    | 'demonstration'
    | 'deployment';
  readonly carbon_impact: number;
  readonly adoption_timeline: number; // years
}

export interface TechnologyAdoption {
  readonly technologyId: string;
  readonly adoption_rate: number; // per year
  readonly market_penetration: number;
  readonly barriers: string[];
  readonly enablers: string[];
}

export interface DisruptionPotential {
  readonly technologyId: string;
  readonly disruption_magnitude: 'low' | 'medium' | 'high' | 'transformative';
  readonly affected_sectors: string[];
  readonly timeline: number; // years
  readonly probability: number;
}

export interface PolicyEnvironment {
  readonly environmentId: string;
  readonly carbon_policies: CarbonPolicy[];
  readonly regulatory_trends: RegulatoryTrend[];
  readonly incentive_structures: IncentiveStructure[];
}

export interface CarbonPolicy {
  readonly policyId: string;
  readonly type: 'carbon_tax' | 'cap_and_trade' | 'standards' | 'subsidies';
  readonly stringency: number;
  readonly coverage: number; // percentage of economy
  readonly effectiveness: number;
}

export interface RegulatoryTrend {
  readonly trendId: string;
  readonly direction: 'strengthening' | 'weakening' | 'stable';
  readonly pace: 'slow' | 'moderate' | 'rapid';
  readonly uncertainty: number;
}

export interface IncentiveStructure {
  readonly structureId: string;
  readonly type: 'financial' | 'regulatory' | 'social' | 'information';
  readonly strength: number;
  readonly coverage: string[];
  readonly effectiveness: number;
}

export interface SocialCondition {
  readonly conditionId: string;
  readonly type: 'awareness' | 'concern' | 'behavior' | 'institutions';
  readonly current_level: number;
  readonly projected_change: number;
  readonly drivers: string[];
}

// Data Integration Types
export interface IntegrationStatus {
  readonly sourceId: string;
  readonly status: 'connected' | 'disconnected' | 'error' | 'syncing';
  readonly lastSync: number;
  readonly errorMessage?: string;
  readonly dataQuality: number;
}

export interface RealTimeStream {
  readonly streamId: string;
  readonly dataType: string;
  readonly frequency: number; // updates per minute
  readonly latency: number; // milliseconds
  readonly reliability: number;
}

export interface DataQualityMetric {
  readonly metricId: string;
  readonly completeness: number;
  readonly accuracy: number;
  readonly timeliness: number;
  readonly consistency: number;
  readonly overall: number;
}

type PrivacyLevel =
  | 'public'
  | 'community'
  | 'family'
  | 'personal'
  | 'encrypted';

// AI and Prediction Types
export interface TrainingDataSummary {
  readonly totalSamples: number;
  readonly features: number;
  readonly timeRange: { start: number; end: number };
  readonly quality: number;
  readonly diversity: number;
}

export interface ModelPerformance {
  readonly accuracy: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1Score: number;
  readonly mse?: number;
  readonly r2?: number;
}

export interface AccuracyMetric {
  readonly metricId: string;
  readonly period: string;
  readonly predicted: number;
  readonly actual: number;
  readonly error: number;
  readonly absoluteError: number;
}

export interface LearningHistory {
  readonly historyId: string;
  readonly timestamp: number;
  readonly performance: ModelPerformance;
  readonly trainingSize: number;
  readonly changes: string[];
}

export interface PredictedCarbonImpact {
  readonly totalImpact: number;
  readonly categoryBreakdown: CategoryImpact[];
  readonly timeline: ImpactTimeline[];
  readonly uncertainty: UncertaintyRange;
}

export interface CategoryImpact {
  readonly category: string;
  readonly impact: number;
  readonly confidence: number;
  readonly drivers: string[];
}

export interface ImpactTimeline {
  readonly period: string;
  readonly impact: number;
  readonly confidence: number;
}

export interface PredictedAlternative {
  readonly alternativeId: string;
  readonly description: string;
  readonly probability: number;
  readonly carbonImpact: number;
  readonly requirements: string[];
}

// Insights and Analysis Types
export interface ComparativeAnalysis {
  readonly analysisId: string;
  readonly peer_comparisons: PeerComparison[];
  readonly benchmark_comparisons: BenchmarkComparison[];
  readonly best_practice_gaps: BestPracticeGap[];
  readonly improvement_ranking: ImprovementRanking[];
}

export interface PeerComparison {
  readonly comparisonId: string;
  readonly peer_group: string;
  readonly metric: string;
  readonly user_value: number;
  readonly peer_average: number;
  readonly peer_median: number;
  readonly percentile: number;
  readonly interpretation: string;
}

export interface BenchmarkComparison {
  readonly benchmarkId: string;
  readonly benchmark_type: 'industry' | 'regional' | 'global' | 'best_practice';
  readonly metric: string;
  readonly user_value: number;
  readonly benchmark_value: number;
  readonly gap: number;
  readonly gap_significance:
    | 'negligible'
    | 'small'
    | 'moderate'
    | 'large'
    | 'extreme';
}

export interface BestPracticeGap {
  readonly gapId: string;
  readonly practice: string;
  readonly current_state: string;
  readonly best_practice: string;
  readonly gap_size: number;
  readonly improvement_potential: number;
  readonly implementation_difficulty: 'easy' | 'moderate' | 'hard';
}

export interface ImprovementRanking {
  readonly rankingId: string;
  readonly opportunity: string;
  readonly impact: number;
  readonly effort: number;
  readonly cost: number;
  readonly priority_score: number;
  readonly rank: number;
}

export interface OpportunityInsight {
  readonly insightId: string;
  readonly category:
    | 'quick_win'
    | 'major_project'
    | 'long_term'
    | 'experimental';
  readonly description: string;
  readonly potential_impact: ImpactMagnitude;
  readonly implementation: ImplementationPlan;
  readonly risks: string[];
  readonly success_factors: string[];
}

export interface CarbonAlert {
  readonly alertId: string;
  readonly type: 'threshold' | 'trend' | 'anomaly' | 'opportunity';
  readonly severity: 'info' | 'warning' | 'critical';
  readonly message: string;
  readonly triggers: AlertTrigger[];
  readonly recommendations: string[];
  readonly expiresAt?: number;
}

export interface AlertTrigger {
  readonly triggerId: string;
  readonly condition: string;
  readonly threshold: number;
  readonly actual_value: number;
  readonly duration: number; // how long condition has been true
}

export interface CarbonAchievement {
  readonly achievementId: string;
  readonly name: string;
  readonly description: string;
  readonly category:
    | 'reduction'
    | 'efficiency'
    | 'milestone'
    | 'behavior'
    | 'innovation';
  readonly level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  readonly earned_at: number;
  readonly carbon_impact: number;
  readonly social_impact: number;
}

export interface TrendInsight {
  readonly insightId: string;
  readonly metric: string;
  readonly trend_direction: 'improving' | 'stable' | 'worsening';
  readonly trend_strength: 'weak' | 'moderate' | 'strong';
  readonly time_period: number; // months
  readonly statistical_significance: number;
  readonly forecast: TrendForecast;
}

export interface TrendForecast {
  readonly forecastId: string;
  readonly time_horizon: number; // months
  readonly predicted_values: ForecastPoint[];
  readonly confidence_bands: ConfidenceBand[];
  readonly assumptions: string[];
}

export interface ForecastPoint {
  readonly date: number;
  readonly value: number;
  readonly confidence: number;
}

export interface ConfidenceBand {
  readonly date: number;
  readonly lower: number;
  readonly upper: number;
  readonly confidence_level: number;
}

// Utility Types
export interface ParameterValue {
  readonly parameterId: string;
  readonly value: number;
  readonly unit: string;
}

export interface SimulationOutcome {
  readonly outcomeId: string;
  readonly metrics: OutcomeMetric[];
  readonly qualitative_results: string[];
  readonly success_probability: number;
}

export interface OutcomeMetric {
  readonly metricId: string;
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly change_from_baseline: number;
}

export interface BehaviorInfluenceMetric {
  readonly direct_modeling: number;
  readonly teaching_effectiveness: number;
  readonly value_transmission: number;
  readonly behavior_adoption: number;
  readonly persistence: number;
}

export interface EducationalImpactMetric {
  readonly knowledge_transfer: number;
  readonly skill_development: number;
  readonly attitude_change: number;
  readonly behavior_change: number;
  readonly long_term_retention: number;
}

export interface InfrastructureImpact {
  readonly housing_efficiency: number;
  readonly transportation_access: number;
  readonly energy_systems: number;
  readonly waste_systems: number;
  readonly total_impact: number;
}

export interface ValueTransmissionMetric {
  readonly environmental_values: number;
  readonly sustainable_practices: number;
  readonly future_orientation: number;
  readonly social_responsibility: number;
  readonly overall_transmission: number;
}
