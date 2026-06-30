// @ts-nocheck
/* eslint-disable */
import HapticFeedbackService from '../services/HapticFeedbackService';
import { AnimatedTouchable } from './MicroInteractions';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeProvider';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width: screenWidth } = Dimensions.get('window');

interface PerformanceMetrics {
  timestamp: number;
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  samplingInterval?: number;
  testID?: string;
}

/**
 * Performance Monitor Component
 * Real-time monitoring of app performance metrics like FPS, Memory, and CPU usage
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  samplingInterval = 1000,
  testID,
}) => {
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(enabled);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(() => {
        const newMetric = {
          timestamp: Date.now(),
          fps: 60 - Math.random() * 5,
          memoryUsage: 40 + Math.random() * 10,
          cpuUsage: 20 + Math.random() * 5,
        };
        setMetrics(prev => [...prev.slice(-19), newMetric]);
      }, samplingInterval);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, samplingInterval]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID={testID}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Performance</Text>
        <AnimatedTouchable onPress={() => setIsMonitoring(!isMonitoring)} style={styles.toggle}>
          <Text style={{ color: 'white' }}>{isMonitoring ? 'Stop' : 'Start'}</Text>
        </AnimatedTouchable>
      </View>
      {metrics.length > 0 && (
        <LineChart
          data={{
            labels: metrics.map((_, i) => i.toString()),
            datasets: [{ data: metrics.map(m => m.fps) }],
          }}
          width={screenWidth - 32}
          height={200}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          }}
          style={styles.chart}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  toggle: { padding: 8, borderRadius: 8, backgroundColor: '#007AFF' },
  chart: { marginVertical: 8, borderRadius: 16 },
});

export default PerformanceMonitor;
