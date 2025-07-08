import { EnhancedAnalyticsService } from '../services/EnhancedAnalyticsService';
import { EnhancedPerformanceService } from '../services/EnhancedPerformanceService';
import { EnhancedSecurityService } from '../services/EnhancedSecurityService';
// import { loggingService } from '../services/LoggingService';
import React, { useState, useEffect } from 'react';
import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
// import { Dimensions } from 'react-native';

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
  const [performanceData, setPerformanceData] = useState<Record<string, unknown> | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<string, unknown> | null>(null);
  const [securityData, setSecurityData] = useState<Record<string, unknown> | null>(null);
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
                    ? '#4CAF50'
                    : '#F44336',
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
                        ? '#FF9800'
                        : '#4CAF50',
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
                  color: securityData.session.isActive ? '#4CAF50' : '#F44336',
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
                    securityData.events.critical > 0 ? '#F44336' : '#4CAF50',
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
                      ? '#FF9800'
                      : '#4CAF50',
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
          return '#F44336';
        case 'warn':
          return '#FF9800';
        case 'info':
          return '#2196F3';
        case 'debug':
          return '#9E9E9E';
        default:
          return '#000000';
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2196F3',
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsHeader: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333333',
  },
  logsContainer: {
    flex: 1,
  },
  logEntry: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#666666',
  },
  logMessage: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
  },
  settingInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
    minWidth: 100,
    textAlign: 'center',
  },
});

export default DevTools;
