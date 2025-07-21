/**
 * 🔍 Logging Dashboard Component
 * Real-time log viewer with advanced search capabilities for development and debugging
 */

import React, { useEffect, useState } from 'react';

import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import {
  advancedLoggingService,
  type LogAnalytics,
  type LogEntry,
  type LogLevel,
  type LogQuery,
} from '../services/AdvancedLoggingService';

interface LoggingDashboardProps {
  visible: boolean;
  onClose: () => void;
}

const LoggingDashboard: React.FC<LoggingDashboardProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analytics, setAnalytics] = useState<LogAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'search'>('logs');

  const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

  useEffect(() => {
    if (visible) {
      refreshData();

      // Auto-refresh every 2 seconds while visible
      const interval = setInterval(refreshData, 2000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  const refreshData = () => {
    const query: LogQuery = {
      query: searchQuery || undefined,
      levels: selectedLevels.length > 0 ? selectedLevels : undefined,
      categories: selectedCategory ? [selectedCategory] : undefined,
      limit: 100,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    };

    const searchResults = advancedLoggingService.search(query);
    setLogs(searchResults);

    const analyticsData = advancedLoggingService.getAnalytics();
    setAnalytics(analyticsData);
  };

  useEffect(() => {
    if (visible) {
      refreshData();
    }
  }, [searchQuery, selectedLevels, selectedCategory, visible]);

  const toggleLevel = (level: LogLevel) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level],
    );
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'trace':
        return '#8E8E93';
      case 'debug':
        return '#007AFF';
      case 'info':
        return '#34C759';
      case 'warn':
        return '#FF9500';
      case 'error':
        return '#FF3B30';
      case 'fatal':
        return '#D70015';
      default:
        return '#8E8E93';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <TouchableOpacity
      style={[styles.logItem, { borderLeftColor: getLevelColor(item.level) }]}
      onPress={() => setSelectedLog(item)}
    >
      <View style={styles.logHeader}>
        <Text style={[styles.logLevel, { color: getLevelColor(item.level) }]}>
          {item.level.toUpperCase()}
        </Text>
        <Text style={styles.logTime}>{formatTimestamp(item.timestamp)}</Text>
        {item.metadata.category && (
          <View
            style={[styles.categoryBadge, { backgroundColor: `${getLevelColor(item.level)}20` }]}
          >
            <Text style={[styles.categoryText, { color: getLevelColor(item.level) }]}>
              {item.metadata.category}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.logMessage} numberOfLines={2}>
        {item.message}
      </Text>

      {item.metadata.component && (
        <Text style={styles.logComponent}>
          {item.metadata.screen || item.metadata.component}
          {item.metadata.action && ` • ${item.metadata.action}`}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderLogDetails = () => {
    if (!selectedLog) return null;

    return (
      <Modal
        visible={!!selectedLog}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setSelectedLog(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Details</Text>
            <TouchableOpacity onPress={() => setSelectedLog(null)} style={styles.closeButton}>
              <Icon name='close' size={24} color='#007AFF' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Basic Info</Text>
              <Text style={styles.detailText}>Level: {selectedLog.level}</Text>
              <Text style={styles.detailText}>
                Time: {new Date(selectedLog.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.detailText}>Platform: {selectedLog.platform}</Text>
              <Text style={styles.detailText}>Environment: {selectedLog.environment}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Message</Text>
              <Text style={styles.detailMessage}>{selectedLog.message}</Text>
            </View>

            {selectedLog.error && (
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Error Details</Text>
                <Text style={styles.detailText}>Name: {selectedLog.error.name}</Text>
                <Text style={styles.detailText}>Message: {selectedLog.error.message}</Text>
                {selectedLog.error.stack && (
                  <ScrollView style={styles.stackTrace}>
                    <Text style={styles.stackText}>{selectedLog.error.stack}</Text>
                  </ScrollView>
                )}
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailTitle}>Metadata</Text>
              <ScrollView style={styles.metadataContainer}>
                <Text style={styles.metadataText}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </Text>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <ScrollView style={styles.analyticsContainer}>
        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsTitle}>Overview</Text>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.totalLogs}</Text>
              <Text style={styles.statLabel}>Total Logs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>
                {(analytics.performanceMetrics.errorRate * 100).toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Error Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsTitle}>Logs by Level</Text>
          {levels.map(level => {
            const count = analytics.logsByLevel[level] || 0;
            const percentage = analytics.totalLogs > 0 ? (count / analytics.totalLogs) * 100 : 0;

            return (
              <View key={level} style={styles.levelRow}>
                <Text style={[styles.levelName, { color: getLevelColor(level) }]}>
                  {level.toUpperCase()}
                </Text>
                <View style={styles.levelBar}>
                  <View
                    style={[
                      styles.levelBarFill,
                      {
                        backgroundColor: getLevelColor(level),
                        width: `${percentage}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.levelCount}>{count}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.analyticsSection}>
          <Text style={styles.analyticsTitle}>Categories</Text>
          {Object.entries(analytics.logsByCategory).map(([category, count]) => (
            <View key={category} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.categoryCount}>{count}</Text>
            </View>
          ))}
        </View>

        {analytics.topErrors.length > 0 && (
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsTitle}>Top Errors</Text>
            {analytics.topErrors.map((error, index) => (
              <View key={index} style={styles.errorRow}>
                <Text style={styles.errorMessage} numberOfLines={2}>
                  {error.message}
                </Text>
                <Text style={styles.errorCount}>×{error.count}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder='Search logs...'
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode='while-editing'
      />

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Levels</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {levels.map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelFilter,
                  {
                    backgroundColor: selectedLevels.includes(level)
                      ? getLevelColor(level)
                      : '#F2F2F7',
                  },
                ]}
                onPress={() => toggleLevel(level)}
              >
                <Text
                  style={[
                    styles.levelFilterText,
                    { color: selectedLevels.includes(level) ? '#FFFFFF' : getLevelColor(level) },
                  ]}
                >
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Category</Text>
        <TextInput
          style={styles.categoryInput}
          placeholder='Filter by category...'
          value={selectedCategory}
          onChangeText={setSelectedCategory}
          clearButtonMode='while-editing'
        />
      </View>
    </View>
  );

  const exportLogs = async () => {
    try {
      const logsJson = await advancedLoggingService.exportLogs('json');
      // In a real app, you'd use a sharing library or save to files
      console.log('Logs exported:', logsJson.length, 'characters');
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  return (
    <Modal visible={visible} animationType='slide' presentationStyle='fullScreen'>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Logging Dashboard</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={exportLogs} style={styles.exportButton}>
              <Icon name='download-outline' size={20} color='#007AFF' />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name='close' size={24} color='#007AFF' />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar}>
          {[
            { key: 'logs', label: 'Logs', icon: 'list-outline' },
            { key: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
            { key: 'search', label: 'Search', icon: 'search-outline' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? '#007AFF' : '#8E8E93'}
              />
              <Text
                style={[styles.tabLabel, { color: activeTab === tab.key ? '#007AFF' : '#8E8E93' }]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.content}>
          {activeTab === 'logs' && (
            <FlatList
              data={logs}
              renderItem={renderLogItem}
              keyExtractor={item => item.id}
              refreshing={false}
              onRefresh={refreshData}
              style={styles.logsList}
            />
          )}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'search' && (
            <>
              {renderSearch()}
              <FlatList
                data={logs}
                renderItem={renderLogItem}
                keyExtractor={item => item.id}
                style={styles.searchResults}
              />
            </>
          )}
        </View>

        {renderLogDetails()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  logsList: {
    flex: 1,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  logMessage: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  logComponent: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 4,
  },
  detailMessage: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  stackTrace: {
    maxHeight: 200,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  stackText: {
    fontSize: 12,
    fontFamily: 'Menlo',
    color: '#3C3C43',
  },
  metadataContainer: {
    maxHeight: 200,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    padding: 8,
  },
  metadataText: {
    fontSize: 12,
    fontFamily: 'Menlo',
    color: '#3C3C43',
  },
  analyticsContainer: {
    padding: 16,
  },
  analyticsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  levelName: {
    fontSize: 12,
    fontWeight: '600',
    width: 60,
  },
  levelBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  levelBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  levelCount: {
    fontSize: 12,
    color: '#3C3C43',
    width: 40,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  categoryName: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  categoryCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  errorMessage: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
    marginRight: 8,
  },
  errorCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  searchResults: {
    flex: 1,
  },
});

export default LoggingDashboard;
