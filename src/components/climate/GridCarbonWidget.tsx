/**
 * Grid Carbon Widget
 * Displays real-time grid carbon intensity with optimal charging recommendations
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type {
  GridCarbonIntensity,
  OptimalWindow,
} from '../../services/climate';

interface Props {
  intensity: GridCarbonIntensity | null;
  optimalWindow?: OptimalWindow | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onViewForecast?: () => void;
}

export const GridCarbonWidget: React.FC<Props> = ({
  intensity,
  optimalWindow,
  isLoading = false,
  onRefresh,
  onViewForecast,
}) => {
  const { theme } = useTheme();

  const getIntensityLevel = useCallback(
    (value: number) => {
      if (value < 100)
        return {
          level: 'Very Clean',
          color: theme.colors.success,
          emoji: '🌿',
        };
      if (value < 200) return { level: 'Clean', color: '#84CC16', emoji: '🌱' };
      if (value < 350)
        return { level: 'Moderate', color: theme.colors.warning, emoji: '🌤️' };
      if (value < 500) return { level: 'Dirty', color: '#F97316', emoji: '🏭' };
      return { level: 'Very Dirty', color: theme.colors.error, emoji: '💨' };
    },
    [theme.colors.success, theme.colors.warning, theme.colors.error],
  );

  const intensityInfo = useMemo(() => {
    if (!intensity) return null;
    return getIntensityLevel(intensity.carbonIntensity);
  }, [intensity, getIntensityLevel]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='small' color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.text.secondary }]}
          >
            Checking grid carbon...
          </Text>
        </View>
      </View>
    );
  }

  if (!intensity) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
        onPress={onRefresh}
        activeOpacity={0.7}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚡</Text>
          <Text
            style={[styles.errorText, { color: theme.colors.text.secondary }]}
          >
            Tap to check grid carbon intensity
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          ⚡ Grid Carbon Intensity
        </Text>
        <Text style={[styles.zone, { color: theme.colors.text.secondary }]}>
          {intensity.zoneName}
        </Text>
      </View>

      {/* Main Display */}
      <View style={styles.mainDisplay}>
        <Text style={styles.emoji}>{intensityInfo?.emoji}</Text>
        <View style={styles.valueContainer}>
          <Text
            style={[
              styles.intensityValue,
              { color: theme.colors.text.primary },
            ]}
          >
            {intensity.carbonIntensity}
          </Text>
          <Text
            style={[
              styles.intensityUnit,
              { color: theme.colors.text.secondary },
            ]}
          >
            gCO₂/kWh
          </Text>
        </View>
        <View
          style={[styles.levelBadge, { backgroundColor: intensityInfo?.color }]}
        >
          <Text style={styles.levelText}>{intensityInfo?.level}</Text>
        </View>
      </View>

      {/* Power Mix Bar */}
      <View style={styles.powerMix}>
        <View style={styles.powerMixHeader}>
          <Text
            style={[
              styles.powerMixLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Power Mix
          </Text>
          <Text
            style={[styles.powerMixPercent, { color: theme.colors.success }]}
          >
            {intensity.renewablePercentage.toFixed(0)}% Renewable
          </Text>
        </View>
        <View
          style={[styles.powerMixBar, { backgroundColor: theme.colors.border }]}
        >
          <View
            style={[
              styles.renewableBar,
              {
                width: `${intensity.renewablePercentage}%`,
                backgroundColor: theme.colors.success,
              },
            ]}
          />
          <View
            style={[
              styles.fossilBar,
              {
                width: `${intensity.fossilFuelPercentage}%`,
                backgroundColor: theme.colors.error,
              },
            ]}
          />
        </View>
        <View style={styles.powerMixLegend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.success },
              ]}
            />
            <Text
              style={[
                styles.legendText,
                { color: theme.colors.text.secondary },
              ]}
            >
              Renewable
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.error },
              ]}
            />
            <Text
              style={[
                styles.legendText,
                { color: theme.colors.text.secondary },
              ]}
            >
              Fossil
            </Text>
          </View>
        </View>
      </View>

      {/* Optimal Window Recommendation */}
      {optimalWindow && (
        <View
          style={[
            styles.optimalWindow,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.optimalHeader}>
            <Text style={styles.optimalEmoji}>🕐</Text>
            <Text
              style={[
                styles.optimalTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              Optimal Charging Window
            </Text>
          </View>
          <Text style={[styles.optimalTime, { color: theme.colors.primary }]}>
            {formatTime(optimalWindow.start)} - {formatTime(optimalWindow.end)}
          </Text>
          <Text
            style={[styles.optimalSavings, { color: theme.colors.success }]}
          >
            {optimalWindow.savings.vsNow > 0
              ? `⬇️ ${optimalWindow.savings.vsNow}% less carbon vs now`
              : '✓ Now is a good time!'}
          </Text>
          <Text
            style={[
              styles.optimalRecommendation,
              { color: theme.colors.text.secondary },
            ]}
          >
            {optimalWindow.recommendation}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {onRefresh && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            onPress={onRefresh}
          >
            <Text
              style={[
                styles.actionText,
                { color: theme.colors.text.secondary },
              ]}
            >
              🔄 Refresh
            </Text>
          </TouchableOpacity>
        )}
        {onViewForecast && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            onPress={onViewForecast}
          >
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              📊 View Forecast
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Source & Timestamp */}
      <Text style={[styles.timestamp, { color: theme.colors.text.tertiary }]}>
        {intensity.source === 'fallback'
          ? 'Estimated data'
          : `Via ${intensity.source}`}{' '}
        • {new Date(intensity.timestamp).toLocaleTimeString()}
      </Text>
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  zone: {
    fontSize: 12,
  },
  mainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 36,
  },
  valueContainer: {
    marginLeft: 12,
    flex: 1,
  },
  intensityValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  intensityUnit: {
    fontSize: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  powerMix: {
    marginBottom: 16,
  },
  powerMixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  powerMixLabel: {
    fontSize: 12,
  },
  powerMixPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
  powerMixBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  renewableBar: {
    height: '100%',
  },
  fossilBar: {
    height: '100%',
  },
  powerMixLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
  },
  optimalWindow: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  optimalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optimalEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  optimalTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  optimalTime: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  optimalSavings: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  optimalRecommendation: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    textAlign: 'center',
  },
});

export default GridCarbonWidget;
