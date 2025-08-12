import CarbonAPIService from './CarbonAPIService';
import { PerformanceMonitoringService } from './PerformanceMonitoringService';

// Types for Sustainability Scoring
export interface SustainabilityMetrics {
  carbonFootprint: {
    total: number; // kg CO2 per year
    breakdown: {
      transport: number;
      energy: number;
      food: number;
      consumption: number;
      waste: number;
    };
    trend: 'improving' | 'stable' | 'worsening';
    percentileRank: number; // 0-100, compared to similar users
  };
  behaviorMetrics: {
    consistency: number; // 0-1, how consistently user tracks
    engagement: number; // 0-1, level of app engagement
    improvement: number; // 0-1, rate of improvement over time
    goalAchievement: number; // 0-1, percentage of goals achieved
  };
  actionMetrics: {
    totalActions: number;
    impactfulActions: number;
    sustainableHabits: number;
    challengesCompleted: number;
    recommendationsFollowed: number;
  };
  socialMetrics: {
    influence: number; // 0-1, influence on others
    community: number; // 0-1, community participation
    sharing: number; // 0-1, sharing frequency
    leadership: number; // 0-1, leadership activities
  };
  knowledgeMetrics: {
    educationCompleted: number;
    quizScores: number[];
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    topicsKnown: string[];
  };
}

export interface SustainabilityScore {
  overall: number; // 0-100
  components: {
    impact: number; // 0-100, environmental impact score
    behavior: number; // 0-100, behavior consistency score
    knowledge: number; // 0-100, sustainability knowledge score
    social: number; // 0-100, social influence score
    progress: number; // 0-100, improvement progress score
  };
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  percentile: number; // 0-100, compared to all users
  insights: {
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
    achievements: string[];
  };
  trends: {
    weekly: number[];
    monthly: number[];
    yearly: number[];
  };
  benchmarks: {
    global: number;
    country: number;
    city: number;
    demographic: number;
  };
  predictions: {
    nextMonth: number;
    nextQuarter: number;
    yearEnd: number;
    confidence: number;
  };
  lastCalculated: Date;
  validUntil: Date;
}

export interface ScoreWeights {
  impact: number;
  behavior: number;
  knowledge: number;
  social: number;
  progress: number;
}

export interface UserContext {
  id: string;
  demographics: {
    age: number;
    location: string;
    income?: 'low' | 'medium' | 'high';
    householdSize: number;
    lifestyle: 'urban' | 'suburban' | 'rural';
  };
  goals: {
    carbonReduction: number;
    timeline: Date;
    priority: 'low' | 'medium' | 'high';
  };
  preferences: {
    focusAreas: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    motivation: 'environmental' | 'financial' | 'social' | 'health';
  };
  history: {
    joinDate: Date;
    totalDays: number;
    activeDays: number;
    streakDays: number;
  };
}

export interface ScoreHistory {
  userId: string;
  scores: {
    date: Date;
    overall: number;
    components: SustainabilityScore['components'];
    events: string[]; // What caused score changes
  }[];
  milestones: {
    date: Date;
    type: 'score_threshold' | 'grade_improvement' | 'percentile_rank';
    description: string;
    score: number;
  }[];
}

export interface GlobalBenchmarks {
  global: {
    average: number;
    median: number;
    percentiles: Record<number, number>;
  };
  byCountry: Record<
    string,
    {
      average: number;
      median: number;
      sampleSize: number;
    }
  >;
  byDemographic: Record<
    string,
    {
      average: number;
      median: number;
      sampleSize: number;
    }
  >;
  lastUpdated: Date;
}

class SustainabilityScoreCalculator {
  private performanceMonitor: PerformanceMonitoringService;
  private carbonAPI: typeof CarbonAPIService;
  private scoreCache: Map<string, SustainabilityScore> = new Map();
  private benchmarks: GlobalBenchmarks | null = null;
  private defaultWeights: ScoreWeights = {
    impact: 0.35,
    behavior: 0.25,
    knowledge: 0.15,
    social: 0.15,
    progress: 0.1,
  };

  constructor() {
    this.performanceMonitor = new PerformanceMonitoringService();
    this.carbonAPI = CarbonAPIService;

    // Initialize benchmarks
    this.loadBenchmarks();

    // Update benchmarks daily
    setInterval(
      () => {
        this.updateBenchmarks();
      },
      24 * 60 * 60 * 1000,
    );
  }

  // Main score calculation
  async calculateSustainabilityScore(
    metrics: SustainabilityMetrics,
    context: UserContext,
    weights?: Partial<ScoreWeights>,
  ): Promise<SustainabilityScore> {
    const trace = this.performanceMonitor.startTrace(
      'calculate-sustainability-score',
    );

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(context.id, metrics);
      const cached = this.scoreCache.get(cacheKey);
      if (cached && cached.validUntil > new Date()) {
        trace.stop();
        return cached;
      }

      const finalWeights = { ...this.defaultWeights, ...weights };

      // Calculate component scores
      const impactScore = await this.calculateImpactScore(metrics, context);
      const behaviorScore = this.calculateBehaviorScore(metrics, context);
      const knowledgeScore = this.calculateKnowledgeScore(metrics, context);
      const socialScore = this.calculateSocialScore(metrics, context);
      const progressScore = this.calculateProgressScore(metrics, context);

      // Calculate weighted overall score
      const overall = Math.round(
        impactScore * finalWeights.impact +
          behaviorScore * finalWeights.behavior +
          knowledgeScore * finalWeights.knowledge +
          socialScore * finalWeights.social +
          progressScore * finalWeights.progress,
      );

      // Calculate grade
      const grade = this.calculateGrade(overall);

      // Calculate percentile
      const percentile = await this.calculatePercentile(overall, context);

      // Generate insights
      const insights = this.generateInsights(metrics, context, {
        impact: impactScore,
        behavior: behaviorScore,
        knowledge: knowledgeScore,
        social: socialScore,
        progress: progressScore,
      });

      // Get trends
      const trends = await this.calculateTrends(context.id);

      // Get benchmarks
      const benchmarks = await this.getBenchmarks(context);

      // Generate predictions
      const predictions = await this.generatePredictions(
        context.id,
        overall,
        trends,
      );

      const score: SustainabilityScore = {
        overall,
        components: {
          impact: impactScore,
          behavior: behaviorScore,
          knowledge: knowledgeScore,
          social: socialScore,
          progress: progressScore,
        },
        grade,
        percentile,
        insights,
        trends,
        benchmarks,
        predictions,
        lastCalculated: new Date(),
        validUntil: new Date(Date.now() + 60 * 60 * 1000), // Valid for 1 hour
      };

      // Cache the result
      this.scoreCache.set(cacheKey, score);

      trace.putAttribute('overall_score', overall);
      trace.putAttribute('grade', grade);
      trace.stop();

      return score;
    } catch (error) {
      trace.stop();
      throw error;
    }
  }

  // Component score calculations
  private async calculateImpactScore(
    metrics: SustainabilityMetrics,
    context: UserContext,
  ): Promise<number> {
    const { carbonFootprint } = metrics;

    // Get baseline for user's demographic
    const baseline = await this.getBaselineFootprint(context.demographics);

    // Calculate relative impact (lower footprint = higher score)
    const relativeImpact = Math.max(
      0,
      (baseline - carbonFootprint.total) / baseline,
    );

    // Base score from relative impact
    let score = Math.min(100, relativeImpact * 100 + 50);

    // Adjust for trend
    switch (carbonFootprint.trend) {
      case 'improving':
        score *= 1.2;
        break;
      case 'stable':
        score *= 1.0;
        break;
      case 'worsening':
        score *= 0.8;
        break;
    }

    // Adjust for percentile rank
    score = score * 0.7 + carbonFootprint.percentileRank * 0.3;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateBehaviorScore(
    metrics: SustainabilityMetrics,
    context: UserContext,
  ): number {
    const { behaviorMetrics, actionMetrics } = metrics;

    // Consistency score (40%)
    const consistencyScore = behaviorMetrics.consistency * 40;

    // Engagement score (30%)
    const engagementScore = behaviorMetrics.engagement * 30;

    // Goal achievement score (20%)
    const goalScore = behaviorMetrics.goalAchievement * 20;

    // Action frequency score (10%)
    const actionFrequency = Math.min(1, actionMetrics.totalActions / 100);
    const actionScore = actionFrequency * 10;

    const totalScore =
      consistencyScore + engagementScore + goalScore + actionScore;

    // Adjust for user history
    const historyMultiplier = Math.min(
      1.2,
      1 + (context.history.activeDays / context.history.totalDays) * 0.2,
    );

    return Math.round(
      Math.max(0, Math.min(100, totalScore * historyMultiplier)),
    );
  }

  private calculateKnowledgeScore(
    metrics: SustainabilityMetrics,
    context: UserContext,
  ): number {
    const { knowledgeMetrics } = metrics;

    // Base score from education completed
    let score = Math.min(50, knowledgeMetrics.educationCompleted * 5);

    // Quiz performance
    if (knowledgeMetrics.quizScores.length > 0) {
      const avgQuizScore =
        knowledgeMetrics.quizScores.reduce((a, b) => a + b, 0) /
        knowledgeMetrics.quizScores.length;
      score += avgQuizScore * 0.3;
    }

    // Expertise level bonus
    const expertiseBonus = {
      beginner: 0,
      intermediate: 10,
      advanced: 20,
      expert: 30,
    };
    score += expertiseBonus[knowledgeMetrics.expertiseLevel];

    // Topics knowledge breadth
    const topicBonus = Math.min(20, knowledgeMetrics.topicsKnown.length * 2);
    score += topicBonus;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateSocialScore(
    metrics: SustainabilityMetrics,
    context: UserContext,
  ): number {
    const { socialMetrics } = metrics;

    // Influence score (30%)
    const influenceScore = socialMetrics.influence * 30;

    // Community participation (25%)
    const communityScore = socialMetrics.community * 25;

    // Sharing activity (25%)
    const sharingScore = socialMetrics.sharing * 25;

    // Leadership activities (20%)
    const leadershipScore = socialMetrics.leadership * 20;

    const totalScore =
      influenceScore + communityScore + sharingScore + leadershipScore;

    return Math.round(Math.max(0, Math.min(100, totalScore)));
  }

  private calculateProgressScore(
    metrics: SustainabilityMetrics,
    context: UserContext,
  ): number {
    const { behaviorMetrics, actionMetrics } = metrics;

    // Improvement rate (40%)
    const improvementScore = behaviorMetrics.improvement * 40;

    // Sustainable habits development (30%)
    const habitsScore = Math.min(30, actionMetrics.sustainableHabits * 3);

    // Challenge completion (20%)
    const challengeScore = Math.min(20, actionMetrics.challengesCompleted * 2);

    // Recommendation follow-through (10%)
    const recommendationScore = Math.min(
      10,
      actionMetrics.recommendationsFollowed,
    );

    const totalScore =
      improvementScore + habitsScore + challengeScore + recommendationScore;

    // Adjust for time since joining (newer users get bonus)
    const daysSinceJoining =
      (Date.now() - context.history.joinDate.getTime()) / (1000 * 60 * 60 * 24);
    const newUserBonus = daysSinceJoining < 30 ? 1.1 : 1.0;

    return Math.round(Math.max(0, Math.min(100, totalScore * newUserBonus)));
  }

  // Grade calculation
  private calculateGrade(score: number): SustainabilityScore['grade'] {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 77) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Percentile calculation
  private async calculatePercentile(
    score: number,
    context: UserContext,
  ): Promise<number> {
    if (!this.benchmarks) {
      await this.loadBenchmarks();
    }

    if (!this.benchmarks) {
      return 50; // Default if no benchmarks available
    }

    // Find percentile in global distribution
    const percentiles = this.benchmarks.global.percentiles;
    const sortedPercentiles = Object.keys(percentiles)
      .map(Number)
      .sort((a, b) => a - b);

    for (const percentile of sortedPercentiles) {
      if (score <= percentiles[percentile]) {
        return percentile;
      }
    }

    return 99; // Top percentile
  }

  // Insights generation
  private generateInsights(
    metrics: SustainabilityMetrics,
    context: UserContext,
    componentScores: SustainabilityScore['components'],
  ): SustainabilityScore['insights'] {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const nextSteps: string[] = [];
    const achievements: string[] = [];

    // Identify strengths (scores > 80)
    for (const [component, score] of Object.entries(componentScores)) {
      if (score > 80) {
        strengths.push(this.getStrengthMessage(component, score));
      } else if (score < 60) {
        improvements.push(this.getImprovementMessage(component, score));
      }
    }

    // Generate next steps based on lowest scores
    const sortedComponents = Object.entries(componentScores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2);

    for (const [component] of sortedComponents) {
      nextSteps.push(this.getNextStepMessage(component, metrics, context));
    }

    // Identify achievements
    if (componentScores.impact > 85) {
      achievements.push('Low Carbon Footprint Champion');
    }
    if (componentScores.behavior > 90) {
      achievements.push('Consistency Master');
    }
    if (componentScores.social > 80) {
      achievements.push('Community Leader');
    }
    if (metrics.actionMetrics.challengesCompleted > 10) {
      achievements.push('Challenge Conqueror');
    }

    return {
      strengths,
      improvements,
      nextSteps,
      achievements,
    };
  }

  private getStrengthMessage(component: string, score: number): string {
    const messages = {
      impact: `Excellent environmental impact with ${score}% efficiency`,
      behavior: `Outstanding consistency in sustainable actions`,
      knowledge: `Strong understanding of sustainability principles`,
      social: `Great community engagement and influence`,
      progress: `Impressive improvement trajectory`,
    };
    return (
      messages[component as keyof typeof messages] ||
      `Strong ${component} performance`
    );
  }

  private getImprovementMessage(component: string, score: number): string {
    const messages = {
      impact: 'Focus on reducing carbon footprint in daily activities',
      behavior: 'Improve consistency in tracking and sustainable actions',
      knowledge: 'Expand sustainability knowledge through education',
      social: 'Increase community participation and sharing',
      progress: 'Set more ambitious goals and track improvements',
    };
    return (
      messages[component as keyof typeof messages] ||
      `Improve ${component} performance`
    );
  }

  private getNextStepMessage(
    component: string,
    metrics: SustainabilityMetrics,
    context: UserContext,
  ): string {
    const steps = {
      impact: 'Try the "Reduce Transport Emissions" challenge',
      behavior: 'Set daily tracking reminders to improve consistency',
      knowledge: 'Complete the "Climate Science Basics" course',
      social: 'Share your achievements and invite friends',
      progress: 'Set a new monthly carbon reduction goal',
    };
    return (
      steps[component as keyof typeof steps] ||
      `Focus on improving ${component}`
    );
  }

  // Trends calculation
  private async calculateTrends(
    userId: string,
  ): Promise<SustainabilityScore['trends']> {
    // This would fetch historical score data
    // For now, returning mock data
    return {
      weekly: [65, 68, 70, 72, 75, 77, 80],
      monthly: [60, 65, 70, 75, 80],
      yearly: [55, 65, 75, 80],
    };
  }

  // Benchmarks
  private async getBenchmarks(
    context: UserContext,
  ): Promise<SustainabilityScore['benchmarks']> {
    if (!this.benchmarks) {
      await this.loadBenchmarks();
    }

    const global = this.benchmarks?.global.average || 65;
    const country =
      this.benchmarks?.byCountry[context.demographics.location]?.average ||
      global;
    const demographic = this.getDemographicBenchmark(context) || global;

    return {
      global,
      country,
      city: country, // Simplified - would need city-level data
      demographic,
    };
  }

  private getDemographicBenchmark(context: UserContext): number {
    const ageGroup = this.getAgeGroup(context.demographics.age);
    const lifestyleKey = `${ageGroup}_${context.demographics.lifestyle}`;
    return this.benchmarks?.byDemographic[lifestyleKey]?.average || 65;
  }

  private getAgeGroup(age: number): string {
    if (age < 25) return 'young';
    if (age < 35) return 'millennial';
    if (age < 50) return 'genx';
    return 'boomer';
  }

  // Predictions
  private async generatePredictions(
    userId: string,
    currentScore: number,
    trends: SustainabilityScore['trends'],
  ): Promise<SustainabilityScore['predictions']> {
    // Simple linear prediction based on recent trends
    const recentTrend = trends.weekly.slice(-4);
    const avgChange =
      recentTrend.length > 1
        ? (recentTrend[recentTrend.length - 1] - recentTrend[0]) /
          (recentTrend.length - 1)
        : 0;

    const nextMonth = Math.max(0, Math.min(100, currentScore + avgChange * 4));
    const nextQuarter = Math.max(
      0,
      Math.min(100, currentScore + avgChange * 12),
    );
    const yearEnd = Math.max(0, Math.min(100, currentScore + avgChange * 52));

    // Confidence based on trend consistency
    const trendVariance = this.calculateVariance(recentTrend);
    const confidence = Math.max(0.3, Math.min(0.95, 1 - trendVariance / 100));

    return {
      nextMonth,
      nextQuarter,
      yearEnd,
      confidence,
    };
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }

  // Benchmarks management
  private async loadBenchmarks(): Promise<void> {
    try {
      // This would load from API or database
      // For now, using mock data
      this.benchmarks = {
        global: {
          average: 65,
          median: 63,
          percentiles: {
            10: 35,
            25: 50,
            50: 63,
            75: 78,
            90: 88,
            95: 92,
            99: 97,
          },
        },
        byCountry: {
          US: { average: 62, median: 60, sampleSize: 10000 },
          UK: { average: 68, median: 66, sampleSize: 5000 },
          DE: { average: 72, median: 70, sampleSize: 8000 },
          JP: { average: 70, median: 68, sampleSize: 6000 },
        },
        byDemographic: {
          young_urban: { average: 68, median: 66, sampleSize: 2000 },
          millennial_suburban: { average: 65, median: 63, sampleSize: 3000 },
          genx_rural: { average: 60, median: 58, sampleSize: 1500 },
        },
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Failed to load benchmarks:', error);
    }
  }

  private async updateBenchmarks(): Promise<void> {
    try {
      // This would fetch updated benchmarks from API
      await this.loadBenchmarks();
      console.log('Benchmarks updated successfully');
    } catch (error) {
      console.error('Failed to update benchmarks:', error);
    }
  }

  // Utility methods
  private async getBaselineFootprint(
    demographics: UserContext['demographics'],
  ): Promise<number> {
    // This would use carbon API to get baseline for demographic
    // For now, using simplified calculation
    const baselineMap = {
      urban: 8000,
      suburban: 12000,
      rural: 15000,
    };

    let baseline = baselineMap[demographics.lifestyle];

    // Adjust for household size
    baseline = baseline * Math.sqrt(demographics.householdSize);

    return baseline;
  }

  private generateCacheKey(
    userId: string,
    metrics: SustainabilityMetrics,
  ): string {
    // Create a hash of key metrics for caching
    const keyData = {
      userId,
      carbonTotal: metrics.carbonFootprint.total,
      totalActions: metrics.actionMetrics.totalActions,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 60)), // Hour precision
    };
    return JSON.stringify(keyData);
  }

  // Score history management
  async saveScoreHistory(
    userId: string,
    score: SustainabilityScore,
  ): Promise<void> {
    // This would save to database
    // Implementation depends on storage solution
  }

  async getScoreHistory(
    userId: string,
    days: number = 30,
  ): Promise<ScoreHistory> {
    // This would fetch from database
    // For now, returning mock data
    return {
      userId,
      scores: [],
      milestones: [],
    };
  }

  // Analytics and reporting
  async generateScoreReport(userId: string): Promise<{
    summary: string;
    recommendations: string[];
    achievements: string[];
    goals: string[];
  }> {
    // Generate comprehensive score report
    return {
      summary: 'Your sustainability score shows consistent improvement',
      recommendations: [
        'Focus on reducing transport emissions',
        'Increase community engagement',
        'Complete sustainability education modules',
      ],
      achievements: [
        'Maintained 7-day tracking streak',
        'Reduced carbon footprint by 15%',
        'Completed 5 sustainability challenges',
      ],
      goals: [
        'Reach 85+ overall score',
        'Achieve A grade rating',
        'Join top 10% percentile',
      ],
    };
  }

  // Gamification integration
  async getScoreBasedRewards(score: SustainabilityScore): Promise<{
    points: number;
    badges: string[];
    unlocks: string[];
  }> {
    const points = Math.round(score.overall * 10);
    const badges: string[] = [];
    const unlocks: string[] = [];

    // Award badges based on score
    if (score.overall >= 90) badges.push('Sustainability Master');
    if (score.overall >= 80) badges.push('Eco Warrior');
    if (score.components.impact >= 85) badges.push('Carbon Crusher');
    if (score.components.social >= 80) badges.push('Community Champion');

    // Unlock features based on score
    if (score.overall >= 70) unlocks.push('Advanced Analytics');
    if (score.overall >= 80) unlocks.push('Mentor Program');
    if (score.overall >= 90) unlocks.push('Expert Challenges');

    return { points, badges, unlocks };
  }
}

export default new SustainabilityScoreCalculator();
