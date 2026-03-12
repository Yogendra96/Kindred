/**
 * Modern APM Integration Example
 * Demonstrates how to integrate the Modern APM service with React Native components
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  useModernAPM,
  useComponentPerformance,
  useInteractionTracking,
  useNavigationPerformance,
} from '../hooks/useModernAPM';
import { EnhancedPerformanceMetric } from '../types/performance';

// Example: Screen component with comprehensive APM integration
const CarbonTrackingScreen: React.FC = () => {
  // Initialize APM for this screen
  const {
    startScreenRender,
    endScreenRender,
    recordCoreVital,
    recordMetric,
    trackMemory,
    sessionSummary,
    realTimeMetrics,
    activeAlerts,
    isInitialized,
    error,
  } = useModernAPM({
    screenName: 'CarbonTrackingScreen',
    autoTrackRender: true,
    trackInteractions: true,
    trackMemory: true,
    userId: 'user_123',
  });

  // Track component performance
  const { trackUpdate } = useComponentPerformance('CarbonTrackingScreen', {
    trackMemory: true,
    trackRender: true,
  });

  // Track user interactions
  const { trackInteraction } = useInteractionTracking('CarbonTrackingScreen');

  // Track navigation performance
  const { trackNavigation } = useNavigationPerformance();

  // Component state
  const [carbonData, setCarbonData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calculationResults, setCalculationResults] = useState<any>(null);

  // Simulate data loading with performance tracking
  useEffect(() => {
    if (!isInitialized) return;

    const loadCarbonData = async () => {
      const loadStartTime = performance.now();

      try {
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock carbon data
        const mockData = [
          { id: 1, type: 'transport', value: 2.5, date: '2024-01-15' },
          { id: 2, type: 'energy', value: 1.8, date: '2024-01-15' },
          { id: 3, type: 'food', value: 3.2, date: '2024-01-15' },
        ];

        setCarbonData(mockData);

        const loadTime = performance.now() - loadStartTime;

        // Record data loading performance
        recordMetric({
          name: 'carbon_data_load',
          value: loadTime,
          unit: 'ms',
          severity: loadTime > 1000 ? 'medium' : 'low',
          context: {
            dataCount: mockData.length,
            loadTime,
            screenName: 'CarbonTrackingScreen',
          },
        });

        // Record as Core Web Vital (LCP - largest content loaded)
        recordCoreVital('LCP', loadTime, {
          contentType: 'carbon_data',
          itemCount: mockData.length,
        });
      } catch (error) {
        recordMetric({
          name: 'carbon_data_load_error',
          value: performance.now() - loadStartTime,
          unit: 'ms',
          severity: 'high',
          context: {
            error: error instanceof Error ? error.message : 'Unknown error',
            screenName: 'CarbonTrackingScreen',
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCarbonData();
  }, [isInitialized, recordMetric, recordCoreVital]);

  // Handle carbon calculation with interaction tracking
  const handleCarbonCalculation = async () => {
    if (!isInitialized) return;

    const interaction = trackInteraction('carbon_calculation', 'touch', {
      carbonDataCount: carbonData.length,
    });

    const calculationStartTime = performance.now();

    try {
      // Simulate carbon calculation
      await new Promise(resolve => setTimeout(resolve, 500));

      const totalCarbon = carbonData.reduce((sum, item) => sum + item.value, 0);
      const calculationTime = performance.now() - calculationStartTime;

      setCalculationResults({
        total: totalCarbon,
        calculationTime,
        breakdown: carbonData,
      });

      // Record calculation performance
      recordMetric({
        name: 'carbon_calculation',
        value: calculationTime,
        unit: 'ms',
        severity: calculationTime > 200 ? 'medium' : 'low',
        context: {
          totalCarbon,
          dataPoints: carbonData.length,
          calculationTime,
        },
      });

      // Complete interaction tracking
      interaction.end('success');

      Alert.alert(
        'Calculation Complete',
        `Total Carbon Footprint: ${totalCarbon.toFixed(2)} kg CO₂\
Calculation Time: ${calculationTime.toFixed(0)}ms`,
      );
    } catch (error) {
      const calculationTime = performance.now() - calculationStartTime;

      recordMetric({
        name: 'carbon_calculation_error',
        value: calculationTime,
        unit: 'ms',
        severity: 'high',
        context: {
          error: error instanceof Error ? error.message : 'Unknown error',
          dataPoints: carbonData.length,
        },
      });

      interaction.end('error');

      Alert.alert('Calculation Error', 'Failed to calculate carbon footprint');
    }
  };

  // Handle navigation to details screen
  const navigateToDetails = () => {
    if (!isInitialized) return;

    const navigation = trackNavigation('CarbonTrackingScreen', 'CarbonDetailsScreen', 'push');

    // Simulate navigation
    setTimeout(() => {
      navigation.complete({
        carbonTotal: calculationResults?.total || 0,
        dataCount: carbonData.length,
      });
    }, 300);

    Alert.alert('Navigation', 'Would navigate to Carbon Details Screen');
  };

  // Handle memory check
  const checkMemoryUsage = async () => {
    if (!isInitialized) return;

    try {
      const memoryMetrics = await trackMemory();

      Alert.alert(
        'Memory Usage',
        `Used: ${(memoryMetrics.usedMemory / 1024 / 1024).toFixed(1)}MB\
` +
          `Available: ${(memoryMetrics.availableMemory / 1024 / 1024).toFixed(1)}MB\
` +
          `Pressure: ${memoryMetrics.memoryPressure}\
` +
          `JS Heap: ${(memoryMetrics.jsHeapSize / 1024 / 1024).toFixed(1)}MB`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check memory usage');
    }
  };

  // Track component updates
  useEffect(() => {
    if (isInitialized) {
      trackUpdate({
        carbonDataLoaded: carbonData.length > 0,
        hasCalculationResults: !!calculationResults,
        isLoading,
      });
    }
  }, [carbonData, calculationResults, isLoading, isInitialized, trackUpdate]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>APM Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* APM Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>APM Status</Text>
        <Text style={styles.statusText}>Initialized: {isInitialized ? '✅' : '❌'}</Text>
        {sessionSummary && (
          <View>
            <Text style={styles.statusText}>Session ID: {sessionSummary.sessionId.slice(-8)}</Text>
            <Text style={styles.statusText}>
              Performance Score: {sessionSummary.performanceScore}/100
            </Text>
            <Text style={styles.statusText}>Metrics: {sessionSummary.metricsCollected}</Text>
            <Text style={styles.statusText}>Alerts: {sessionSummary.alertsTriggered}</Text>
          </View>
        )}
      </View>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>🚨 Active Performance Alerts</Text>
          {activeAlerts.map(alert => (
            <View key={alert.id} style={styles.alertItem}>
              <Text style={styles.alertText}>
                {alert.metricType}: {alert.value} &gt; {alert.threshold}
              </Text>
              <Text style={styles.alertSeverity}>Severity: {alert.severity}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Carbon Data Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Carbon Footprint Data</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color='#007AFF' />
            <Text style={styles.loadingText}>Loading carbon data...</Text>
          </View>
        ) : (
          <View>
            {carbonData.map(item => (
              <View key={item.id} style={styles.dataItem}>
                <Text style={styles.dataType}>{item.type}</Text>
                <Text style={styles.dataValue}>{item.value} kg CO₂</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.calculateButton}
              onPress={handleCarbonCalculation}
              disabled={carbonData.length === 0}
            >
              <Text style={styles.buttonText}>Calculate Total Footprint</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Calculation Results */}
      {calculationResults && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calculation Results</Text>
          <Text style={styles.resultText}>Total: {calculationResults.total.toFixed(2)} kg CO₂</Text>
          <Text style={styles.timeText}>
            Calculated in {calculationResults.calculationTime.toFixed(0)}ms
          </Text>

          <TouchableOpacity style={styles.detailsButton} onPress={navigateToDetails}>
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Performance Tools */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Performance Tools</Text>

        <TouchableOpacity style={styles.toolButton} onPress={checkMemoryUsage}>
          <Text style={styles.buttonText}>Check Memory Usage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => {
            // Simulate layout shift
            recordCoreVital('CLS', 0.15, {
              shiftType: 'manual_test',
              timestamp: Date.now(),
            });
            Alert.alert('Layout Shift Recorded', 'CLS value: 0.15');
          }}
        >
          <Text style={styles.buttonText}>Simulate Layout Shift</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={() => {
            // Record custom metric
            recordMetric({
              name: 'custom_user_action',
              value: performance.now(),
              unit: 'timestamp',
              severity: 'low',
              context: {
                action: 'manual_metric_test',
                userInitiated: true,
              },
            });
            Alert.alert('Custom Metric Recorded', 'Check APM dashboard for details');
          }}
        >
          <Text style={styles.buttonText}>Record Custom Metric</Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Metrics */}
      {realTimeMetrics && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Real-time Metrics</Text>
          <Text style={styles.metricsText}>Core Vitals: {realTimeMetrics.coreVitals.length}</Text>
          <Text style={styles.metricsText}>
            Recent Metrics: {realTimeMetrics.recentMetrics.length}
          </Text>
          <Text style={styles.metricsText}>
            Memory Trend: {realTimeMetrics.memoryTrend.length} samples
          </Text>
          <Text style={styles.metricsText}>
            Network Trend: {realTimeMetrics.networkTrend.length} requests
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1565c0',
    marginBottom: 4,
  },
  alertsCard: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  alertItem: {
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#c62828',
  },
  alertSeverity: {
    fontSize: 12,
    color: '#b71c1c',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dataType: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  dataValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  detailsButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  toolButton: {
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  metricsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    padding: 20,
  },
});

export default CarbonTrackingScreen;

// Example: HOC for automatic APM integration
export const withAPMTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  options: {
    trackRender?: boolean;
    trackMemory?: boolean;
    trackInteractions?: boolean;
  } = {},
) => {
  const WithAPMComponent: React.FC<P> = props => {
    const { trackRender = true, trackMemory = true, trackInteractions = true } = options;

    const { recordMetric, isInitialized } = useModernAPM({
      autoTrackRender: trackRender,
      trackMemory,
      trackInteractions,
    });

    const { trackUpdate } = useComponentPerformance(componentName, {
      trackMemory,
      trackRender,
    });

    // Track component render on prop changes
    useEffect(() => {
      if (isInitialized) {
        trackUpdate({ propsChanged: true });
      }
    }, [props, isInitialized, trackUpdate]);

    return <WrappedComponent {...props} />;
  };

  WithAPMComponent.displayName = `withAPM(${componentName})`;

  return WithAPMComponent;
};

// Example usage of HOC:
// const TrackedCarbonComponent = withAPMTracking(CarbonTrackingScreen, 'CarbonTrackingScreen');
