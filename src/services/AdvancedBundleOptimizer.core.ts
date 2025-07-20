/**
 * 📦 Advanced Bundle Optimizer - Core Logic Module
 * Following KISS principle: Focused core optimization logic
 * File size target: 200-300 lines max
 */

import { Platform } from 'react-native';

import type {
  BundleAnalysisResult,
  BundleOptimizerConfig,
  DuplicateModule,
  MobileBundleConstraints,
  ModuleAnalysis,
  OptimizationSuggestion,
  PerformanceImpact,
  ReactNativeBundleMetrics,
  UnusedExport,
} from './AdvancedBundleOptimizer.types';

export class BundleOptimizerCore {
  private config: BundleOptimizerConfig;
  private metrics: ReactNativeBundleMetrics;
  private constraints: MobileBundleConstraints;

  constructor(config: BundleOptimizerConfig) {
    this.config = config;
    this.metrics = this.detectReactNativeEnvironment();
    this.constraints = this.getMobileConstraints();
  }

  /**
   * Main bundle analysis entry point
   */
  async analyzeBundleStructure(bundlePath: string): Promise<BundleAnalysisResult> {
    const startTime = performance.now();

    try {
      const modules = await this.analyzeModules(bundlePath);
      const duplicates = this.findDuplicateModules(modules);
      const unusedExports = this.findUnusedExports(modules);
      const suggestions = this.generateOptimizationSuggestions(modules, duplicates, unusedExports);
      const performanceImpact = this.calculatePerformanceImpact(modules);

      const totalSize = modules.reduce((sum, mod) => sum + mod.size, 0);
      const gzippedSize = Math.round(totalSize * 0.3); // Approximate gzip ratio

      const analysisTime = performance.now() - startTime;
      console.log(`Bundle analysis completed in ${analysisTime.toFixed(2)}ms`);

      return {
        totalSize,
        gzippedSize,
        modules,
        duplicates,
        unusedExports,
        optimizationSuggestions: suggestions,
        performanceImpact,
      };
    } catch (error) {
      console.error('Bundle analysis failed:', error);
      throw new Error(`Bundle analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze individual modules in bundle
   */
  private async analyzeModules(_bundlePath: string): Promise<ModuleAnalysis[]> {
    // Simulated module analysis - in real implementation would parse bundle
    const mockModules: ModuleAnalysis[] = [
      {
        path: '@react-native-async-storage/async-storage',
        size: 45000,
        gzippedSize: 12000,
        imports: ['react-native'],
        exports: ['AsyncStorage', 'useAsyncStorage'],
        isThirdParty: true,
        usage: {
          importCount: 8,
          exportUsage: 75,
          isTreeShakeable: true,
          isDynamicallyLoaded: false,
          loadPriority: 'high',
        },
        optimizationPotential: 0.3,
      },
      {
        path: 'src/services/CarbonAPIService',
        size: 32000,
        gzippedSize: 8500,
        imports: ['axios', '@react-native-async-storage/async-storage'],
        exports: ['CarbonAPIService', 'calculateEmissions'],
        isThirdParty: false,
        usage: {
          importCount: 12,
          exportUsage: 90,
          isTreeShakeable: true,
          isDynamicallyLoaded: false,
          loadPriority: 'critical',
        },
        optimizationPotential: 0.1,
      },
      {
        path: 'react-native-chart-kit',
        size: 128000,
        gzippedSize: 35000,
        imports: ['react-native-svg', 'd3-scale'],
        exports: ['LineChart', 'BarChart', 'PieChart'],
        isThirdParty: true,
        usage: {
          importCount: 3,
          exportUsage: 33, // Only using 1 of 3 exports
          isTreeShakeable: false,
          isDynamicallyLoaded: true,
          loadPriority: 'medium',
        },
        optimizationPotential: 0.7,
      },
    ];

    return mockModules;
  }

  /**
   * Find duplicate modules across bundle
   */
  private findDuplicateModules(modules: ModuleAnalysis[]): DuplicateModule[] {
    const duplicates: DuplicateModule[] = [];
    const moduleMap = new Map<string, string[]>();

    // Group by module name (ignoring version differences)
    modules.forEach(module => {
      const baseName = this.getBaseModuleName(module.path);
      if (!moduleMap.has(baseName)) {
        moduleMap.set(baseName, []);
      }
      moduleMap.get(baseName)!.push(module.path);
    });

    // Find actual duplicates
    moduleMap.forEach((instances, moduleName) => {
      if (instances.length > 1) {
        const wastedBytes = instances.slice(1).reduce((sum, path) => {
          const module = modules.find(m => m.path === path);
          return sum + (module?.size || 0);
        }, 0);

        duplicates.push({
          moduleName,
          instances,
          wastedBytes,
          consolidationStrategy: this.getConsolidationStrategy(moduleName, instances),
        });
      }
    });

    return duplicates;
  }

  /**
   * Find unused exports in modules
   */
  private findUnusedExports(modules: ModuleAnalysis[]): UnusedExport[] {
    const unusedExports: UnusedExport[] = [];

    modules.forEach(module => {
      if (module.usage.exportUsage < 100) {
        const unusedPercentage = 100 - module.usage.exportUsage;
        const bytesWasted = Math.round(module.size * (unusedPercentage / 100));

        if (bytesWasted > 1000) {
          // Only report significant waste
          unusedExports.push({
            module: module.path,
            export: 'unused-portions', // Simplified - real implementation would list specific exports
            bytesWasted,
            removalRisk: module.isThirdParty ? 'medium' : 'safe',
          });
        }
      }
    });

    return unusedExports;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(
    modules: ModuleAnalysis[],
    duplicates: DuplicateModule[],
    unusedExports: UnusedExport[],
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Tree shaking suggestions
    unusedExports.forEach(unused => {
      if (unused.bytesWasted > 5000) {
        suggestions.push({
          type: 'tree_shaking',
          description: `Remove unused exports from ${unused.module}`,
          expectedSavings: unused.bytesWasted,
          effort: unused.removalRisk === 'safe' ? 'low' : 'medium',
          implementation: `Use named imports instead of wildcard imports for ${unused.module}`,
        });
      }
    });

    // Code splitting suggestions
    const heavyModules = modules.filter(m => m.size > 50000 && m.usage.loadPriority !== 'critical');
    heavyModules.forEach(module => {
      suggestions.push({
        type: 'lazy_loading',
        description: `Lazy load ${module.path}`,
        expectedSavings: Math.round(module.size * 0.8), // Assume 80% startup savings
        effort: 'medium',
        implementation: `Use React.lazy() or dynamic import() for ${module.path}`,
      });
    });

    // Duplicate removal suggestions
    duplicates.forEach(duplicate => {
      if (duplicate.wastedBytes > 10000) {
        suggestions.push({
          type: 'duplicate_removal',
          description: `Consolidate duplicate ${duplicate.moduleName}`,
          expectedSavings: duplicate.wastedBytes,
          effort: 'high',
          implementation: `Use resolutions in package.json to force single version`,
        });
      }
    });

    // Mobile-specific optimizations
    if (this.constraints.maxSize && this.getTotalBundleSize(modules) > this.constraints.maxSize) {
      suggestions.push({
        type: 'compression',
        description: 'Enable Hermes bytecode compilation',
        expectedSavings: Math.round(this.getTotalBundleSize(modules) * 0.25),
        effort: 'low',
        implementation: 'Set "hermesEnabled": true in react-native.config.js',
      });
    }

    return suggestions.sort((a, b) => b.expectedSavings - a.expectedSavings);
  }

  /**
   * Calculate performance impact of current bundle
   */
  private calculatePerformanceImpact(modules: ModuleAnalysis[]): PerformanceImpact {
    const totalSize = this.getTotalBundleSize(modules);
    const criticalModules = modules.filter(m => m.usage.loadPriority === 'critical');
    const criticalSize = criticalModules.reduce((sum, m) => sum + m.size, 0);

    // Rough estimates for React Native
    const startupTime = Math.round((criticalSize / 1000) * 2); // ~2ms per KB
    const memoryUsage = Math.round((totalSize / (1024 * 1024)) * 1.5); // ~1.5x size in memory
    const networkRequests = modules.filter(m => !m.usage.isDynamicallyLoaded).length;
    const cacheEfficiency = modules.filter(m => m.usage.isTreeShakeable).length / modules.length;

    return {
      startupTime,
      memoryUsage,
      networkRequests,
      cacheEfficiency,
    };
  }

  /**
   * Helper methods
   */
  private detectReactNativeEnvironment(): ReactNativeBundleMetrics {
    return {
      platform: Platform.OS as 'ios' | 'android',
      bundleType: __DEV__ ? 'debug' : 'release',
      hermes: !!(global as any).HermesInternal,
      flipper: __DEV__, // Simplified check
      codegenEnabled: false, // Would need to detect this
      newArchitecture: false, // Would need to detect this
    };
  }

  private getMobileConstraints(): MobileBundleConstraints {
    const isIOS = Platform.OS === 'ios';
    return {
      maxSize: isIOS ? 200 * 1024 * 1024 : 150 * 1024 * 1024, // 200MB iOS, 150MB Android
      memoryLimit: isIOS ? 512 : 256, // MB
      cpuIntensive: !this.metrics.hermes,
      batteryImpact: 'medium',
    };
  }

  private getBaseModuleName(modulePath: string): string {
    return modulePath.split('@')[0].replace(/\/.*$/, '');
  }

  private getConsolidationStrategy(moduleName: string, instances: string[]): any {
    if (instances.length === 2 && instances.some(i => i.includes('@'))) {
      return 'upgrade_version';
    }
    return 'merge_imports';
  }

  private getTotalBundleSize(modules: ModuleAnalysis[]): number {
    return modules.reduce((sum, module) => sum + module.size, 0);
  }
}
