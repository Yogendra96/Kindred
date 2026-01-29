/**
 * Global Context Card
 * Displays user's carbon footprint in global context
 * Shows comparisons with country average, world average, and Paris targets
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { UserGlobalContext } from '../../services/climate';

interface Props {
  context: UserGlobalContext;
  onLearnMore?: () => void;
  compact?: boolean;
}

export const GlobalContextCard: React.FC<Props> = ({
  context,
  onLearnMore,
  compact = false,
}) => {
  const { theme } = useTheme();

  const progressBarWidth = useMemo(() => {
    // Calculate width based on user footprint vs world average (capped at 200%)
    const ratio = Math.min(context.userFootprint / context.worldAverage, 2);
    return ratio * 50; // 50% = world average
  }, [context.userFootprint, context.worldAverage]);

  const getStatusColor = () => {
    if (context.vsWorldAverage.isBelowAverage) return theme.colors.success;
    if (context.userFootprint <= context.countryAverage * 1.2)
      return theme.colors.warning;
    return theme.colors.error;
  };

  const getFootprintEmoji = () => {
    if (context.userFootprint <= 2) return '🌱';
    if (context.userFootprint <= 4) return '🌿';
    if (context.userFootprint <= 6) return '🌲';
    if (context.userFootprint <= 10) return '🏭';
    return '💨';
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { backgroundColor: theme.colors.surface },
        ]}
        onPress={onLearnMore}
        activeOpacity={0.7}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.emoji}>{getFootprintEmoji()}</Text>
          <View style={styles.compactInfo}>
            <Text
              style={[
                styles.compactTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              {context.userFootprint.toFixed(1)}t CO₂/yr
            </Text>
            <Text style={[styles.compactSubtitle, { color: getStatusColor() }]}>
              {context.vsWorldAverage.isBelowAverage
                ? `${Math.abs(context.vsWorldAverage.percentDifference).toFixed(
                    0,
                  )}% below world avg`
                : `${context.vsWorldAverage.percentDifference.toFixed(
                    0,
                  )}% above world avg`}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          🌍 Your Global Context
        </Text>
        {onLearnMore && (
          <TouchableOpacity onPress={onLearnMore}>
            <Text style={[styles.learnMore, { color: theme.colors.primary }]}>
              Learn More
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Footprint Display */}
      <View style={styles.mainDisplay}>
        <Text style={styles.emoji}>{getFootprintEmoji()}</Text>
        <View style={styles.footprintInfo}>
          <Text
            style={[
              styles.footprintValue,
              { color: theme.colors.text.primary },
            ]}
          >
            {context.userFootprint.toFixed(1)}
          </Text>
          <Text
            style={[
              styles.footprintUnit,
              { color: theme.colors.text.secondary },
            ]}
          >
            tonnes CO₂/year
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: theme.colors.border },
          ]}
        >
          {/* Paris Target Marker */}
          <View
            style={[
              styles.targetMarker,
              {
                left: `${(2.5 / context.worldAverage) * 50}%`,
                backgroundColor: theme.colors.success,
              },
            ]}
          />
          {/* World Average Marker */}
          <View
            style={[
              styles.targetMarker,
              styles.worldAverageMarker,
              { backgroundColor: theme.colors.warning },
            ]}
          />
          {/* User Position */}
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressBarWidth, 100)}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text
            style={[
              styles.progressLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Paris 2.5t
          </Text>
          <Text
            style={[
              styles.progressLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            World Avg {context.worldAverage.toFixed(1)}t
          </Text>
        </View>
      </View>

      {/* Comparisons */}
      <View style={styles.comparisons}>
        {/* vs Country */}
        <View style={styles.comparisonItem}>
          <Text
            style={[
              styles.comparisonLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            vs {context.countryName}
          </Text>
          <Text
            style={[
              styles.comparisonValue,
              {
                color: context.vsCountryAverage.isBelowAverage
                  ? theme.colors.success
                  : theme.colors.error,
              },
            ]}
          >
            {context.vsCountryAverage.isBelowAverage ? '↓' : '↑'}{' '}
            {Math.abs(context.vsCountryAverage.percentDifference).toFixed(0)}%
          </Text>
        </View>

        {/* vs World */}
        <View style={styles.comparisonItem}>
          <Text
            style={[
              styles.comparisonLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            vs World
          </Text>
          <Text
            style={[
              styles.comparisonValue,
              {
                color: context.vsWorldAverage.isBelowAverage
                  ? theme.colors.success
                  : theme.colors.error,
              },
            ]}
          >
            {context.vsWorldAverage.isBelowAverage ? '↓' : '↑'}{' '}
            {Math.abs(context.vsWorldAverage.percentDifference).toFixed(0)}%
          </Text>
        </View>

        {/* Percentile */}
        <View style={styles.comparisonItem}>
          <Text
            style={[
              styles.comparisonLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Global Rank
          </Text>
          <Text
            style={[
              styles.comparisonValue,
              { color: theme.colors.text.primary },
            ]}
          >
            Top {100 - context.globalPercentile}%
          </Text>
        </View>
      </View>

      {/* Historical Context */}
      <View
        style={[
          styles.historicalContext,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          style={[
            styles.historicalText,
            { color: theme.colors.text.secondary },
          ]}
        >
          📜 {context.historicalEquivalent.description}
        </Text>
      </View>

      {/* Insights */}
      {context.insights.length > 0 && (
        <View style={styles.insights}>
          {context.insights.slice(0, 2).map((insight, index) => (
            <Text
              key={index}
              style={[
                styles.insightText,
                { color: theme.colors.text.secondary },
              ]}
            >
              💡 {insight}
            </Text>
          ))}
        </View>
      )}

      {/* Paris Gap */}
      {context.parisGap > 0 && (
        <View style={[styles.parisGap, { borderColor: theme.colors.warning }]}>
          <Text style={[styles.parisGapText, { color: theme.colors.warning }]}>
            🌡️ Reduce {context.parisGap.toFixed(1)}t more to be Paris-aligned
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactContainer: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  learnMore: {
    fontSize: 14,
    fontWeight: '500',
  },
  mainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 40,
  },
  footprintInfo: {
    marginLeft: 16,
  },
  footprintValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  footprintUnit: {
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetMarker: {
    position: 'absolute',
    width: 3,
    height: 16,
    top: -4,
    borderRadius: 2,
  },
  worldAverageMarker: {
    left: '50%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 10,
  },
  comparisons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 12,
  },
  comparisonItem: {
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  historicalContext: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  historicalText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  insights: {
    marginBottom: 12,
  },
  insightText: {
    fontSize: 12,
    marginBottom: 4,
  },
  parisGap: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  parisGapText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default GlobalContextCard;
