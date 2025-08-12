import React, { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { EnhancedAnalyticsService } from '../services/EnhancedAnalyticsService';
import { EnhancedPerformanceService } from '../services/EnhancedPerformanceService';
import { EnhancedSecurityService } from '../services/EnhancedSecurityService';
// import { loggingService } from '../services/LoggingService';

// import { Dimensions } from 'react-native';

const COLORS = {
  green: '#4CAF50',
  red: '#F44336',
  orange: '#FF9800',
  blue: '#2196F3',
  gray: '#9E9E9E',
  black: '#000000',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  mediumGray: '#e0e0e0',
  darkGray: '#666666',
  darkText: '#333333',
};

// Global type declarations
declare global {
  var __DEV__: boolean;
}

interface DevToolsProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'performance' | 'analytics' | 'security' | 'logs' | 'settings';

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// const { width, height } = Dimensions.get('window');

/**
 * Enhanced Development Tools Component
 * Provides comprehensive debugging and monitoring interface
 */
export const DevTools: React.FC<DevToolsProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [performanceData, setPerformanceData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [securityData, setSecurityData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const performanceService = EnhancedPerformanceService.getInstance();
  const analyticsService = EnhancedAnalyticsService.getInstance();
  const securityService = EnhancedSecurityService.getInstance();
  // loggingService is already imported as a singleton

  /**
   * Refresh all data
   */
  const refreshData = useCallback(() => {
    try {
      setPerformanceData(performanceService.getPerformanceSummary());
      setAnalyticsData(analyticsService.getAnalyticsSummary());
      setSecurityData(securityService.getSecuritySummary());

      // Mock logs for demonstration
      const mockLogs: LogEntry[] = [
        {
          level: 'info',
          message: 'Application started',
          timestamp: Date.now() - 10000,
        },
        {
          level: 'warn',
          message: 'Slow render detected in HomeScreen',
          timestamp: Date.now() - 5000,
          data: { renderTime: 18.5, component: 'HomeScreen' },
        },
        {
          level: 'error',
          message: 'Network request failed',
          timestamp: Date.now() - 2000,
          data: { url: '/api/users', status: 500 },
        },
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to refresh dev tools data:', error);
    }
  }, [performanceService, analyticsService, securityService]);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    if (!visible) return;

    refreshData();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(refreshData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, autoRefresh, refreshInterval, refreshData]);

  /**
   * Filter logs based on level and search query
   */
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch =
      !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  /**
   * Format bytes to human readable
   */
  const _formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  /**
   * Format duration to human readable
   */
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  /**
   * Clear performance data
   */
  const clearPerformanceData = () => {
    Alert.alert(
      'Clear Performance Data',
      'Are you sure you want to clear all performance data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            performanceService.clearData();
            refreshData();
          },
        },
      ],
    );
  };

  /**
   * Clear analytics data
   */
  const clearAnalyticsData = () => {
    Alert.alert(
      'Clear Analytics Data',
      'Are you sure you want to clear all analytics data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await analyticsService.clearAnalyticsData();
            refreshData();
          },
        },
      ],
    );
  };

  /**
   * Export data
   */
  const exportData = () => {
    const data = {
      performance: performanceService.exportPerformanceData(),
      analytics: analyticsService.exportAnalyticsData(),
      security: securityService.exportSecurityData(),
      timestamp: new Date().toISOString(),
    };

    console.warn('Exported Dev Tools Data:', JSON.stringify(data, null, 2));
    Alert.alert('Data Exported', 'Check console for exported data');
  };

  /**
   * Render tab buttons
   */
  const renderTabButtons = () => {
    const tabs: { key: TabType; label: string }[] = [
      { key: 'performance', label: 'Performance' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'security', label: 'Security' },
      { key: 'logs', label: 'Logs' },
      { key: 'settings', label: 'Settings' },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Render performance tab
   */
  const renderPerformanceTab = () => {
    if (!performanceData) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading performance data...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Monitoring:</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color: performanceData.overview.isMonitoring
                    ? COLORS.green
                    : COLORS.red,
                },
              ]}
            >
              {performanceData.overview.isMonitoring ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Metrics:</Text>
            <Text style={styles.metricValue}>
              {performanceData.overview.totalMetrics}
            </Text>
          </View>
        </View>

        {performanceData.memory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Memory</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Used:</Text>
              <Text style={styles.metricValue}>
                {performanceData.memory.current.used}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Utilization:</Text>
              <Text style={styles.metricValue}>
                {performanceData.memory.current.utilization}
              </Text>
            </View>
          </View>
        )}

        {performanceData.rendering && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rendering</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Renders:</Text>
              <Text style={styles.metricValue}>
                {performanceData.rendering.totalRenders}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Time:</Text>
              <Text style={styles.metricValue}>
                {performanceData.rendering.averageRenderTime}
              </Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Slow Renders:</Text>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      performanceData.rendering.slowRenders > 0
                        ? COLORS.orange
                        : COLORS.green,
                  },
                ]}
              >
                {performanceData.rendering.slowRenders}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={clearPerformanceData}
        >
          <Text style={styles.actionButtonText}>Clear Performance Data</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  /**
   * Render analytics tab
   */
  const renderAnalyticsTab = () => {
    if (!analyticsData) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total:</Text>
            <Text style={styles.metricValue}>
              {analyticsData.sessions.total}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Active:</Text>
            <Text style={styles.metricValue}>
              {analyticsData.sessions.active}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Avg Duration:</Text>
            <Text style={styles.metricValue}>
              {formatDuration(analyticsData.sessions.averageDuration)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Events</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total:</Text>
            <Text style={styles.metricValue}>{analyticsData.events.total}</Text>
          </View>
          {Object.entries(analyticsData.events.byCategory).map(
            ([category, count]) => (
              <View key={category} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{category}:</Text>
                <Text style={styles.metricValue}>{count as number}</Text>
              </View>
            ),
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Users</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total:</Text>
            <Text style={styles.metricValue}>{analyticsData.users.total}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Active:</Text>
            <Text style={styles.metricValue}>{analyticsData.users.active}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={clearAnalyticsData}
        >
          <Text style={styles.actionButtonText}>Clear Analytics Data</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  /**
   * Render security tab
   */
  const renderSecurityTab = () => {
    if (!securityData) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading security data...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Active:</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color: securityData.session.isActive ? COLORS.green : COLORS.red,
                },
              ]}
            >
              {securityData.session.isActive ? 'Yes' : 'No'}
            </Text>
          </View>
          {securityData.session.userId && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>User ID:</Text>
              <Text style={styles.metricValue}>
                {securityData.session.userId}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Events (24h)</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total:</Text>
            <Text style={styles.metricValue}>
              {securityData.events.last24Hours}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Critical:</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    securityData.events.critical > 0 ? COLORS.red : COLORS.green,
                },
              ]}
            >
              {securityData.events.critical}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Failed Logins:</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    securityData.events.failedLogins > 0
                      ? COLORS.orange
                      : COLORS.green,
                },
              ]}
            >
              {securityData.events.failedLogins}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Session Timeout:</Text>
            <Text style={styles.metricValue}>
              {formatDuration(securityData.config.sessionTimeout)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Max Login Attempts:</Text>
            <Text style={styles.metricValue}>
              {securityData.config.maxLoginAttempts}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  /**
   * Render logs tab
   */
  const renderLogsTab = () => {
    const getLevelColor = (level: string) => {
      switch (level) {
        case 'error':
          return COLORS.red;
        case 'warn':
          return COLORS.orange;
        case 'info':
          return COLORS.blue;
        case 'debug':
          return COLORS.gray;
        default:
          return COLORS.black;
      }
    };

    return (
      <View style={styles.tabContent}>
        <View style={styles.logsHeader}>
          <TextInput
            style={styles.searchInput}
            placeholder='Search logs...'
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Level:</Text>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterLevel === 'all' && styles.activeFilter,
              ]}
              onPress={() => setFilterLevel('all')}
            >
              <Text style={styles.filterButtonText}>All</Text>
            </TouchableOpacity>
            {['error', 'warn', 'info', 'debug'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterButton,
                  filterLevel === level && styles.activeFilter,
                ]}
                onPress={() => setFilterLevel(level)}
              >
                <Text style={styles.filterButtonText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView style={styles.logsContainer}>
          {filteredLogs.map((log, index) => (
            <View key={index} style={styles.logEntry}>
              <View style={styles.logHeader}>
                <Text
                  style={[styles.logLevel, { color: getLevelColor(log.level) }]}
                >
                  {log.level.toUpperCase()}
                </Text>
                <Text style={styles.logTimestamp}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <Text style={styles.logData}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  /**
   * Render settings tab
   */
  const renderSettingsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refresh Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Refresh</Text>
            <Switch value={autoRefresh} onValueChange={setAutoRefresh} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Refresh Interval (ms)</Text>
            <TextInput
              style={styles.settingInput}
              value={refreshInterval.toString()}
              onChangeText={text => {
                const value = parseInt(text, 10);
                if (!isNaN(value) && value > 0) {
                  setRefreshInterval(value);
                }
              }}
              keyboardType='numeric'
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={refreshData}>
            <Text style={styles.actionButtonText}>Refresh All Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={exportData}>
            <Text style={styles.actionButtonText}>Export Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  /**
   * Render tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'performance':
        return renderPerformanceTab();
      case 'analytics':
        return renderAnalyticsTab();
      case 'security':
        return renderSecurityTab();
      case 'logs':
        return renderLogsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dev Tools</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {renderTabButtons()}
        {renderTabContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: 8,
    marginTop: 8,
    padding: 12,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeFilter: {
    backgroundColor: COLORS.blue,
  },
  activeTabButton: {
    borderBottomColor: COLORS.blue,
    borderBottomWidth: 2,
  },
  activeTabButtonText: {
    color: COLORS.blue,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: COLORS.lightGray,
    flex: 1,
  },
  filterButton: {
    backgroundColor: COLORS.mediumGray,
    borderRadius: 4,
    marginBottom: 4,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterButtonText: {
    color: COLORS.darkText,
    fontSize: 12,
  },
  filterContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterLabel: {
    color: COLORS.darkGray,
    fontSize: 14,
    marginRight: 8,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.darkGray,
    fontSize: 16,
  },
  logData: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    color: COLORS.darkGray,
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 8,
  },
  logEntry: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
    padding: 12,
  },
  logHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logMessage: {
    color: COLORS.darkText,
    fontSize: 14,
    marginBottom: 4,
  },
  logTimestamp: {
    color: COLORS.darkGray,
    fontSize: 12,
  },
  logsContainer: {
    flex: 1,
  },
  logsHeader: {
    marginBottom: 16,
  },
  metricLabel: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricValue: {
    color: COLORS.darkText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.mediumGray,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    color: COLORS.darkText,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    minWidth: 100,
    padding: 8,
    textAlign: 'center',
  },
  settingLabel: {
    color: COLORS.darkText,
    fontSize: 16,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
  },
  tabButtonText: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  tabContainer: {
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.mediumGray,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default DevTools;
