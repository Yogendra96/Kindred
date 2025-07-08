import { PerformanceMonitoringService } from './PerformanceMonitoringService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Bundle analysis types
export interface BundleAnalysis {
  id: string;
  timestamp: number;
  platform: 'ios' | 'android' | 'web';
  buildType: 'debug' | 'release';
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  modules: ModuleAnalysis[];
  assets: AssetAnalysis[];
  dependencies: DependencyAnalysis[];
  chunks: ChunkAnalysis[];
  treemap: TreemapData;
  metrics: BundleMetrics;
  recommendations: BundleRecommendation[];
  comparison?: BundleComparison;
}

export interface ModuleAnalysis {
  id: string;
  name: string;
  path: string;
  size: number;
  compressedSize: number;
  type: 'source' | 'node_modules' | 'asset' | 'generated';
  category: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
  isEntry: boolean;
  isAsync: boolean;
  chunkId?: string;
  duplicates: DuplicateInfo[];
  unusedExports: string[];
  sideEffects: boolean;
}

export interface AssetAnalysis {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'font' | 'video' | 'audio' | 'document' | 'other';
  size: number;
  compressedSize: number;
  format: string;
  dimensions?: {
    width: number;
    height: number;
  };
  quality?: number;
  optimization: AssetOptimization;
  usage: AssetUsage[];
}

export interface AssetOptimization {
  canOptimize: boolean;
  potentialSavings: number;
  recommendations: string[];
  optimizedFormats: string[];
  compressionLevel: number;
}

export interface AssetUsage {
  module: string;
  component: string;
  frequency: number;
  critical: boolean;
}

export interface DependencyAnalysis {
  name: string;
  version: string;
  size: number;
  compressedSize: number;
  type: 'production' | 'development' | 'peer' | 'optional';
  category: 'ui' | 'utility' | 'data' | 'testing' | 'build' | 'other';
  usage: DependencyUsage;
  alternatives: DependencyAlternative[];
  security: SecurityInfo;
  license: string;
  treeshakeable: boolean;
  sideEffects: boolean;
}

export interface DependencyUsage {
  importCount: number;
  usedExports: string[];
  unusedExports: string[];
  utilizationRate: number;
  criticalPath: boolean;
}

export interface DependencyAlternative {
  name: string;
  version: string;
  size: number;
  features: string[];
  pros: string[];
  cons: string[];
  migrationEffort: 'low' | 'medium' | 'high';
}

export interface SecurityInfo {
  vulnerabilities: Vulnerability[];
  lastAudit: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface Vulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  patchedVersions: string[];
  references: string[];
}

export interface ChunkAnalysis {
  id: string;
  name: string;
  size: number;
  compressedSize: number;
  type: 'entry' | 'vendor' | 'async' | 'runtime';
  modules: string[];
  dependencies: string[];
  loadPriority: 'high' | 'medium' | 'low';
  cacheability: number;
}

export interface TreemapData {
  name: string;
  size: number;
  children?: TreemapData[];
  color?: string;
  category?: string;
}

export interface BundleMetrics {
  loadTime: {
    estimated: number;
    slow3G: number;
    fast3G: number;
    wifi: number;
  };
  parseTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  cacheHitRatio: number;
  duplicateCode: {
    size: number;
    percentage: number;
    instances: DuplicateInstance[];
  };
  unusedCode: {
    size: number;
    percentage: number;
    files: string[];
  };
  compressionEfficiency: number;
  treeshakingEffectiveness: number;
}

export interface DuplicateInstance {
  code: string;
  files: string[];
  size: number;
  occurrences: number;
}

export interface DuplicateInfo {
  originalModule: string;
  duplicatedIn: string[];
  size: number;
  reason: string;
}

export interface BundleRecommendation {
  id: string;
  type: 'size' | 'performance' | 'security' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: {
    sizeReduction: number;
    performanceGain: number;
    effort: 'low' | 'medium' | 'high';
  };
  implementation: {
    steps: string[];
    codeChanges: CodeChange[];
    configChanges: ConfigChange[];
  };
  risks: string[];
  alternatives: string[];
}

export interface CodeChange {
  file: string;
  type: 'add' | 'remove' | 'modify';
  description: string;
  before?: string;
  after?: string;
}

export interface ConfigChange {
  file: string;
  property: string;
  value: any;
  description: string;
}

export interface BundleComparison {
  baseline: {
    id: string;
    timestamp: number;
    size: number;
  };
  current: {
    id: string;
    timestamp: number;
    size: number;
  };
  changes: {
    sizeChange: number;
    sizeChangePercentage: number;
    addedModules: string[];
    removedModules: string[];
    modifiedModules: ModuleChange[];
    addedDependencies: string[];
    removedDependencies: string[];
    updatedDependencies: DependencyUpdate[];
  };
}

export interface ModuleChange {
  module: string;
  oldSize: number;
  newSize: number;
  sizeChange: number;
  reason: string;
}

export interface DependencyUpdate {
  name: string;
  oldVersion: string;
  newVersion: string;
  sizeChange: number;
  breaking: boolean;
}

// Optimization types
export interface OptimizationConfig {
  target: {
    maxSize: number;
    maxLoadTime: number;
    compressionLevel: number;
  };
  strategies: {
    treeshaking: boolean;
    codeSplitting: boolean;
    assetOptimization: boolean;
    dependencyOptimization: boolean;
    duplicateRemoval: boolean;
  };
  platforms: ('ios' | 'android' | 'web')[];
  environments: ('development' | 'production')[];
}

export interface OptimizationResult {
  id: string;
  timestamp: number;
  config: OptimizationConfig;
  before: BundleMetrics;
  after: BundleMetrics;
  improvements: {
    sizeReduction: number;
    loadTimeImprovement: number;
    performanceScore: number;
  };
  appliedOptimizations: AppliedOptimization[];
  warnings: string[];
  errors: string[];
}

export interface AppliedOptimization {
  type: string;
  description: string;
  impact: number;
  files: string[];
}

class BundleAnalysisService {
  private performanceMonitor: PerformanceMonitoringService;
  private analyses: Map<string, BundleAnalysis> = new Map();
  private optimizations: Map<string, OptimizationResult> = new Map();
  private isAnalyzing: boolean = false;
  private config: OptimizationConfig;

  constructor() {
    this.performanceMonitor = new PerformanceMonitoringService();
    this.config = this.getDefaultConfig();
  }

  // Bundle analysis
  async analyzeBundleSize(
    buildPath?: string,
    options?: {
      includeSourceMaps?: boolean;
      analyzeAssets?: boolean;
      checkDuplicates?: boolean;
      generateTreemap?: boolean;
    },
  ): Promise<BundleAnalysis> {
    if (this.isAnalyzing) {
      throw new Error('Bundle analysis already in progress');
    }

    this.isAnalyzing = true;

    try {
      const analysisId = `analysis-${Date.now()}`;
      const startTime = Date.now();

      // Simulate bundle analysis (in real implementation, this would analyze actual bundle)
      const analysis = await this.performBundleAnalysis(
        analysisId,
        buildPath,
        options,
      );

      // Cache the analysis
      this.analyses.set(analysisId, analysis);
      await this.cacheAnalysis(analysis);

      // Track analytics
      await this.trackAnalysisEvent('bundle_analyzed', {
        analysis_id: analysisId,
        duration: Date.now() - startTime,
        total_size: analysis.totalSize,
        module_count: analysis.modules.length,
        dependency_count: analysis.dependencies.length,
      });

      return analysis;
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async performBundleAnalysis(
    analysisId: string,
    _buildPath?: string,
    _options?: any,
  ): Promise<BundleAnalysis> {
    // Mock analysis data (in real implementation, this would parse actual bundle)
    const modules = this.generateMockModules();
    const assets = this.generateMockAssets();
    const dependencies = this.generateMockDependencies();
    const chunks = this.generateMockChunks();

    const totalSize =
      modules.reduce((sum, m) => sum + m.size, 0) +
      assets.reduce((sum, a) => sum + a.size, 0);
    const compressedSize = Math.floor(totalSize * 0.7); // Assume 30% compression

    const metrics = this.calculateBundleMetrics(modules, assets, dependencies);
    const treemap = this.generateTreemapData(modules, dependencies);
    const recommendations = this.generateRecommendations(
      modules,
      assets,
      dependencies,
      metrics,
    );

    return {
      id: analysisId,
      timestamp: Date.now(),
      platform: Platform.OS as 'ios' | 'android',
      buildType: __DEV__ ? 'debug' : 'release',
      totalSize,
      compressedSize,
      compressionRatio: compressedSize / totalSize,
      modules,
      assets,
      dependencies,
      chunks,
      treemap,
      metrics,
      recommendations,
    };
  }

  // Module analysis
  private generateMockModules(): ModuleAnalysis[] {
    const modules: ModuleAnalysis[] = [];

    // Core app modules
    modules.push({
      id: 'app-main',
      name: 'App.tsx',
      path: 'src/App.tsx',
      size: 15000,
      compressedSize: 8000,
      type: 'source',
      category: 'application',
      imports: ['react', 'react-native'],
      exports: ['default'],
      dependencies: ['react', 'react-native'],
      isEntry: true,
      isAsync: false,
      duplicates: [],
      unusedExports: [],
      sideEffects: false,
    });

    // React Native modules
    modules.push({
      id: 'react-native',
      name: 'react-native',
      path: 'node_modules/react-native',
      size: 2500000,
      compressedSize: 1200000,
      type: 'node_modules',
      category: 'framework',
      imports: [],
      exports: ['View', 'Text', 'StyleSheet', 'Platform'],
      dependencies: [],
      isEntry: false,
      isAsync: false,
      duplicates: [],
      unusedExports: ['Animated', 'Easing'],
      sideEffects: true,
    });

    // Third-party libraries
    modules.push({
      id: 'lodash',
      name: 'lodash',
      path: 'node_modules/lodash',
      size: 500000,
      compressedSize: 200000,
      type: 'node_modules',
      category: 'utility',
      imports: [],
      exports: ['map', 'filter', 'reduce', 'debounce'],
      dependencies: [],
      isEntry: false,
      isAsync: false,
      duplicates: [],
      unusedExports: ['chunk', 'compact', 'concat'],
      sideEffects: false,
    });

    return modules;
  }

  private generateMockAssets(): AssetAnalysis[] {
    return [
      {
        id: 'app-icon',
        name: 'app-icon.png',
        path: 'assets/images/app-icon.png',
        type: 'image',
        size: 50000,
        compressedSize: 35000,
        format: 'PNG',
        dimensions: { width: 1024, height: 1024 },
        quality: 90,
        optimization: {
          canOptimize: true,
          potentialSavings: 15000,
          recommendations: ['Convert to WebP', 'Reduce quality to 80%'],
          optimizedFormats: ['WebP', 'AVIF'],
          compressionLevel: 7,
        },
        usage: [
          {
            module: 'App.tsx',
            component: 'AppIcon',
            frequency: 1,
            critical: true,
          },
        ],
      },
      {
        id: 'background-image',
        name: 'background.jpg',
        path: 'assets/images/background.jpg',
        type: 'image',
        size: 200000,
        compressedSize: 150000,
        format: 'JPEG',
        dimensions: { width: 1920, height: 1080 },
        quality: 85,
        optimization: {
          canOptimize: true,
          potentialSavings: 50000,
          recommendations: ['Resize for mobile', 'Use progressive JPEG'],
          optimizedFormats: ['WebP', 'AVIF'],
          compressionLevel: 8,
        },
        usage: [
          {
            module: 'HomeScreen.tsx',
            component: 'BackgroundImage',
            frequency: 1,
            critical: false,
          },
        ],
      },
    ];
  }

  private generateMockDependencies(): DependencyAnalysis[] {
    return [
      {
        name: 'react',
        version: '18.2.0',
        size: 300000,
        compressedSize: 120000,
        type: 'production',
        category: 'ui',
        usage: {
          importCount: 25,
          usedExports: ['useState', 'useEffect', 'useContext'],
          unusedExports: ['useMemo', 'useCallback'],
          utilizationRate: 0.6,
          criticalPath: true,
        },
        alternatives: [],
        security: {
          vulnerabilities: [],
          lastAudit: Date.now() - 7 * 24 * 60 * 60 * 1000,
          riskLevel: 'low',
        },
        license: 'MIT',
        treeshakeable: true,
        sideEffects: false,
      },
      {
        name: 'lodash',
        version: '4.17.21',
        size: 500000,
        compressedSize: 200000,
        type: 'production',
        category: 'utility',
        usage: {
          importCount: 5,
          usedExports: ['map', 'filter'],
          unusedExports: ['reduce', 'debounce', 'throttle'],
          utilizationRate: 0.1,
          criticalPath: false,
        },
        alternatives: [
          {
            name: 'ramda',
            version: '0.29.0',
            size: 200000,
            features: ['Functional programming', 'Immutability'],
            pros: ['Smaller size', 'Better tree-shaking'],
            cons: ['Different API', 'Learning curve'],
            migrationEffort: 'medium',
          },
          {
            name: 'native-methods',
            version: 'built-in',
            size: 0,
            features: ['Native Array methods'],
            pros: ['No bundle size', 'Native performance'],
            cons: ['Limited functionality'],
            migrationEffort: 'low',
          },
        ],
        security: {
          vulnerabilities: [],
          lastAudit: Date.now() - 30 * 24 * 60 * 60 * 1000,
          riskLevel: 'low',
        },
        license: 'MIT',
        treeshakeable: false,
        sideEffects: false,
      },
    ];
  }

  private generateMockChunks(): ChunkAnalysis[] {
    return [
      {
        id: 'main',
        name: 'main.bundle.js',
        size: 800000,
        compressedSize: 400000,
        type: 'entry',
        modules: ['App.tsx', 'HomeScreen.tsx'],
        dependencies: ['react', 'react-native'],
        loadPriority: 'high',
        cacheability: 0.3,
      },
      {
        id: 'vendor',
        name: 'vendor.bundle.js',
        size: 1200000,
        compressedSize: 600000,
        type: 'vendor',
        modules: ['react', 'react-native', 'lodash'],
        dependencies: [],
        loadPriority: 'high',
        cacheability: 0.9,
      },
    ];
  }

  // Metrics calculation
  private calculateBundleMetrics(
    modules: ModuleAnalysis[],
    assets: AssetAnalysis[],
    _dependencies: DependencyAnalysis[],
  ): BundleMetrics {
    const totalSize =
      modules.reduce((sum, m) => sum + m.size, 0) +
      assets.reduce((sum, a) => sum + a.size, 0);

    // Estimate load times based on size and network conditions
    const loadTime = {
      estimated: totalSize / 50000, // 50KB/s baseline
      slow3G: totalSize / 25000, // 25KB/s
      fast3G: totalSize / 100000, // 100KB/s
      wifi: totalSize / 500000, // 500KB/s
    };

    // Calculate duplicate code
    const duplicates = this.findDuplicateCode(modules);
    const duplicateSize = duplicates.reduce((sum, d) => sum + d.size, 0);

    // Calculate unused code
    const unusedSize = modules.reduce(
      (sum, m) => sum + m.unusedExports.length * 1000,
      0,
    );

    return {
      loadTime,
      parseTime: totalSize / 1000000, // Rough estimate
      firstContentfulPaint: loadTime.estimated + 0.5,
      timeToInteractive: loadTime.estimated + 1.0,
      cacheHitRatio: 0.7,
      duplicateCode: {
        size: duplicateSize,
        percentage: (duplicateSize / totalSize) * 100,
        instances: duplicates,
      },
      unusedCode: {
        size: unusedSize,
        percentage: (unusedSize / totalSize) * 100,
        files: modules.filter(m => m.unusedExports.length > 0).map(m => m.name),
      },
      compressionEfficiency: 0.7,
      treeshakingEffectiveness: 0.8,
    };
  }

  private findDuplicateCode(_modules: ModuleAnalysis[]): DuplicateInstance[] {
    // Mock duplicate detection
    return [
      {
        code: 'utility function',
        files: ['utils/helpers.ts', 'components/Button.tsx'],
        size: 5000,
        occurrences: 2,
      },
    ];
  }

  // Treemap generation
  private generateTreemapData(
    modules: ModuleAnalysis[],
    _dependencies: DependencyAnalysis[],
  ): TreemapData {
    const categories = new Map<string, ModuleAnalysis[]>();

    modules.forEach(module => {
      const category = module.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(module);
    });

    const children: TreemapData[] = [];

    categories.forEach((categoryModules, category) => {
      const categorySize = categoryModules.reduce((sum, m) => sum + m.size, 0);

      children.push({
        name: category,
        size: categorySize,
        category,
        color: this.getCategoryColor(category),
        children: categoryModules.map(module => ({
          name: module.name,
          size: module.size,
          category: module.category,
        })),
      });
    });

    return {
      name: 'Bundle',
      size: modules.reduce((sum, m) => sum + m.size, 0),
      children,
    };
  }

  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      application: '#10B981',
      framework: '#3B82F6',
      utility: '#F59E0B',
      ui: '#8B5CF6',
      data: '#EF4444',
      other: '#6B7280',
    };
    return colors[category] || colors.other;
  }

  // Recommendations generation
  private generateRecommendations(
    modules: ModuleAnalysis[],
    assets: AssetAnalysis[],
    dependencies: DependencyAnalysis[],
    metrics: BundleMetrics,
  ): BundleRecommendation[] {
    const recommendations: BundleRecommendation[] = [];

    // Large dependency recommendations
    const largeDependencies = dependencies
      .filter(d => d.size > 100000 && d.usage.utilizationRate < 0.5)
      .sort((a, b) => b.size - a.size);

    largeDependencies.forEach(dep => {
      recommendations.push({
        id: `large-dep-${dep.name}`,
        type: 'size',
        priority: 'high',
        title: `Optimize ${dep.name} usage`,
        description: `${dep.name} is ${(dep.size / 1000).toFixed(
          1,
        )}KB but only ${(dep.usage.utilizationRate * 100).toFixed(
          1,
        )}% utilized`,
        impact: {
          sizeReduction: dep.size * (1 - dep.usage.utilizationRate),
          performanceGain: 15,
          effort: 'medium',
        },
        implementation: {
          steps: [
            'Analyze unused exports',
            'Import only needed functions',
            'Consider tree-shaking',
            'Evaluate alternatives',
          ],
          codeChanges: [
            {
              file: 'src/utils/index.ts',
              type: 'modify',
              description: 'Use specific imports instead of default import',
              before: `import _ from 'lodash';`,
              after: `import { map, filter } from 'lodash';`,
            },
          ],
          configChanges: [],
        },
        risks: ['Potential breaking changes', 'Need to update imports'],
        alternatives: dep.alternatives.map(alt => alt.name),
      });
    });

    // Asset optimization recommendations
    const optimizableAssets = assets.filter(a => a.optimization.canOptimize);

    if (optimizableAssets.length > 0) {
      const totalSavings = optimizableAssets.reduce(
        (sum, a) => sum + a.optimization.potentialSavings,
        0,
      );

      recommendations.push({
        id: 'asset-optimization',
        type: 'size',
        priority: 'medium',
        title: 'Optimize images and assets',
        description: `${
          optimizableAssets.length
        } assets can be optimized to save ${(totalSavings / 1000).toFixed(
          1,
        )}KB`,
        impact: {
          sizeReduction: totalSavings,
          performanceGain: 10,
          effort: 'low',
        },
        implementation: {
          steps: [
            'Convert images to WebP format',
            'Compress images',
            'Resize images for mobile',
            'Use progressive JPEG',
          ],
          codeChanges: [],
          configChanges: [
            {
              file: 'metro.config.js',
              property: 'resolver.assetExts',
              value: ['webp', 'png', 'jpg'],
              description: 'Add WebP support',
            },
          ],
        },
        risks: ['Browser compatibility'],
        alternatives: ['AVIF format', 'SVG for icons'],
      });
    }

    // Duplicate code recommendations
    if (metrics.duplicateCode.percentage > 5) {
      recommendations.push({
        id: 'duplicate-code',
        type: 'size',
        priority: 'medium',
        title: 'Remove duplicate code',
        description: `${metrics.duplicateCode.percentage.toFixed(
          1,
        )}% of bundle is duplicate code`,
        impact: {
          sizeReduction: metrics.duplicateCode.size,
          performanceGain: 8,
          effort: 'medium',
        },
        implementation: {
          steps: [
            'Extract common utilities',
            'Create shared components',
            'Use module federation',
            'Implement code splitting',
          ],
          codeChanges: [
            {
              file: 'src/utils/shared.ts',
              type: 'add',
              description: 'Create shared utility functions',
            },
          ],
          configChanges: [],
        },
        risks: ['Refactoring complexity'],
        alternatives: ['Module federation', 'Micro-frontends'],
      });
    }

    return recommendations;
  }

  // Bundle optimization
  async optimizeBundle(
    config?: Partial<OptimizationConfig>,
  ): Promise<OptimizationResult> {
    const optimizationConfig = { ...this.config, ...config };
    const optimizationId = `optimization-${Date.now()}`;

    // Get current analysis for baseline
    const currentAnalysis = await this.analyzeBundleSize();
    const beforeMetrics = currentAnalysis.metrics;

    // Apply optimizations
    const appliedOptimizations = await this.applyOptimizations(
      optimizationConfig,
    );

    // Analyze optimized bundle
    const optimizedAnalysis = await this.analyzeBundleSize();
    const afterMetrics = optimizedAnalysis.metrics;

    const result: OptimizationResult = {
      id: optimizationId,
      timestamp: Date.now(),
      config: optimizationConfig,
      before: beforeMetrics,
      after: afterMetrics,
      improvements: {
        sizeReduction: currentAnalysis.totalSize - optimizedAnalysis.totalSize,
        loadTimeImprovement:
          beforeMetrics.loadTime.estimated - afterMetrics.loadTime.estimated,
        performanceScore: this.calculatePerformanceScore(afterMetrics),
      },
      appliedOptimizations,
      warnings: [],
      errors: [],
    };

    this.optimizations.set(optimizationId, result);
    await this.cacheOptimization(result);

    return result;
  }

  private async applyOptimizations(
    config: OptimizationConfig,
  ): Promise<AppliedOptimization[]> {
    const applied: AppliedOptimization[] = [];

    if (config.strategies.treeshaking) {
      applied.push({
        type: 'treeshaking',
        description: 'Removed unused exports and dead code',
        impact: 15,
        files: ['webpack.config.js', 'metro.config.js'],
      });
    }

    if (config.strategies.codeSplitting) {
      applied.push({
        type: 'code-splitting',
        description: 'Split code into smaller chunks',
        impact: 20,
        files: ['src/App.tsx', 'src/navigation/index.tsx'],
      });
    }

    if (config.strategies.assetOptimization) {
      applied.push({
        type: 'asset-optimization',
        description: 'Compressed and optimized images',
        impact: 25,
        files: ['assets/images/*'],
      });
    }

    return applied;
  }

  private calculatePerformanceScore(metrics: BundleMetrics): number {
    // Calculate a performance score based on various metrics
    const sizeScore = Math.max(
      0,
      100 - (metrics.loadTime.estimated / 10) * 100,
    );
    const duplicateScore = Math.max(
      0,
      100 - metrics.duplicateCode.percentage * 2,
    );
    const unusedScore = Math.max(0, 100 - metrics.unusedCode.percentage * 3);
    const compressionScore = metrics.compressionEfficiency * 100;

    return (sizeScore + duplicateScore + unusedScore + compressionScore) / 4;
  }

  // Comparison and tracking
  async compareBundles(
    baselineId: string,
    currentId?: string,
  ): Promise<BundleComparison> {
    const baseline = this.analyses.get(baselineId);
    if (!baseline) {
      throw new Error('Baseline analysis not found');
    }

    const current = currentId
      ? this.analyses.get(currentId)
      : await this.analyzeBundleSize();

    if (!current) {
      throw new Error('Current analysis not found');
    }

    const comparison: BundleComparison = {
      baseline: {
        id: baseline.id,
        timestamp: baseline.timestamp,
        size: baseline.totalSize,
      },
      current: {
        id: current.id,
        timestamp: current.timestamp,
        size: current.totalSize,
      },
      changes: {
        sizeChange: current.totalSize - baseline.totalSize,
        sizeChangePercentage:
          ((current.totalSize - baseline.totalSize) / baseline.totalSize) * 100,
        addedModules: this.findAddedModules(baseline.modules, current.modules),
        removedModules: this.findRemovedModules(
          baseline.modules,
          current.modules,
        ),
        modifiedModules: this.findModifiedModules(
          baseline.modules,
          current.modules,
        ),
        addedDependencies: this.findAddedDependencies(
          baseline.dependencies,
          current.dependencies,
        ),
        removedDependencies: this.findRemovedDependencies(
          baseline.dependencies,
          current.dependencies,
        ),
        updatedDependencies: this.findUpdatedDependencies(
          baseline.dependencies,
          current.dependencies,
        ),
      },
    };

    return comparison;
  }

  private findAddedModules(
    baseline: ModuleAnalysis[],
    current: ModuleAnalysis[],
  ): string[] {
    const baselineNames = new Set(baseline.map(m => m.name));
    return current.filter(m => !baselineNames.has(m.name)).map(m => m.name);
  }

  private findRemovedModules(
    baseline: ModuleAnalysis[],
    current: ModuleAnalysis[],
  ): string[] {
    const currentNames = new Set(current.map(m => m.name));
    return baseline.filter(m => !currentNames.has(m.name)).map(m => m.name);
  }

  private findModifiedModules(
    baseline: ModuleAnalysis[],
    current: ModuleAnalysis[],
  ): ModuleChange[] {
    const changes: ModuleChange[] = [];
    const baselineMap = new Map(baseline.map(m => [m.name, m]));

    current.forEach(currentModule => {
      const baselineModule = baselineMap.get(currentModule.name);
      if (baselineModule && baselineModule.size !== currentModule.size) {
        changes.push({
          module: currentModule.name,
          oldSize: baselineModule.size,
          newSize: currentModule.size,
          sizeChange: currentModule.size - baselineModule.size,
          reason: 'Code changes',
        });
      }
    });

    return changes;
  }

  private findAddedDependencies(
    baseline: DependencyAnalysis[],
    current: DependencyAnalysis[],
  ): string[] {
    const baselineNames = new Set(baseline.map(d => d.name));
    return current.filter(d => !baselineNames.has(d.name)).map(d => d.name);
  }

  private findRemovedDependencies(
    baseline: DependencyAnalysis[],
    current: DependencyAnalysis[],
  ): string[] {
    const currentNames = new Set(current.map(d => d.name));
    return baseline.filter(d => !currentNames.has(d.name)).map(d => d.name);
  }

  private findUpdatedDependencies(
    baseline: DependencyAnalysis[],
    current: DependencyAnalysis[],
  ): DependencyUpdate[] {
    const updates: DependencyUpdate[] = [];
    const baselineMap = new Map(baseline.map(d => [d.name, d]));

    current.forEach(currentDep => {
      const baselineDep = baselineMap.get(currentDep.name);
      if (baselineDep && baselineDep.version !== currentDep.version) {
        updates.push({
          name: currentDep.name,
          oldVersion: baselineDep.version,
          newVersion: currentDep.version,
          sizeChange: currentDep.size - baselineDep.size,
          breaking: this.isBreakingChange(
            baselineDep.version,
            currentDep.version,
          ),
        });
      }
    });

    return updates;
  }

  private isBreakingChange(oldVersion: string, newVersion: string): boolean {
    const oldMajor = parseInt(oldVersion.split('.')[0]);
    const newMajor = parseInt(newVersion.split('.')[0]);
    return newMajor > oldMajor;
  }

  // Configuration
  private getDefaultConfig(): OptimizationConfig {
    return {
      target: {
        maxSize: 5000000, // 5MB
        maxLoadTime: 3000, // 3 seconds
        compressionLevel: 9,
      },
      strategies: {
        treeshaking: true,
        codeSplitting: true,
        assetOptimization: true,
        dependencyOptimization: true,
        duplicateRemoval: true,
      },
      platforms: ['ios', 'android'],
      environments: ['production'],
    };
  }

  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  // Data access
  getAnalysis(analysisId: string): BundleAnalysis | null {
    return this.analyses.get(analysisId) || null;
  }

  getOptimization(optimizationId: string): OptimizationResult | null {
    return this.optimizations.get(optimizationId) || null;
  }

  getAllAnalyses(): BundleAnalysis[] {
    return Array.from(this.analyses.values());
  }

  getAllOptimizations(): OptimizationResult[] {
    return Array.from(this.optimizations.values());
  }

  // Storage
  private async cacheAnalysis(analysis: BundleAnalysis): Promise<void> {
    try {
      const analyses = await this.getCachedAnalyses();
      analyses.push(analysis);

      // Keep only last 10 analyses
      const recentAnalyses = analyses.slice(-10);

      await AsyncStorage.setItem(
        'bundle_analyses',
        JSON.stringify(recentAnalyses),
      );
    } catch (error) {
      console.error('Failed to cache bundle analysis:', error);
    }
  }

  private async cacheOptimization(
    optimization: OptimizationResult,
  ): Promise<void> {
    try {
      const optimizations = await this.getCachedOptimizations();
      optimizations.push(optimization);

      // Keep only last 10 optimizations
      const recentOptimizations = optimizations.slice(-10);

      await AsyncStorage.setItem(
        'bundle_optimizations',
        JSON.stringify(recentOptimizations),
      );
    } catch (error) {
      console.error('Failed to cache optimization result:', error);
    }
  }

  private async getCachedAnalyses(): Promise<BundleAnalysis[]> {
    try {
      const data = await AsyncStorage.getItem('bundle_analyses');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cached analyses:', error);
      return [];
    }
  }

  private async getCachedOptimizations(): Promise<OptimizationResult[]> {
    try {
      const data = await AsyncStorage.getItem('bundle_optimizations');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cached optimizations:', error);
      return [];
    }
  }

  // Analytics
  private async trackAnalysisEvent(
    eventName: string,
    properties: Record<string, any>,
  ): Promise<void> {
    try {
      // This would integrate with your analytics service
      console.log(`Bundle Analysis Event: ${eventName}`, properties);
    } catch (error) {
      console.error('Failed to track analysis event:', error);
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.analyses.clear();
    this.optimizations.clear();
    this.isAnalyzing = false;
  }

  // Debug info
  getDebugInfo(): {
    isAnalyzing: boolean;
    analysisCount: number;
    optimizationCount: number;
    config: OptimizationConfig;
  } {
    return {
      isAnalyzing: this.isAnalyzing,
      analysisCount: this.analyses.size,
      optimizationCount: this.optimizations.size,
      config: this.config,
    };
  }
}

export default new BundleAnalysisService();
