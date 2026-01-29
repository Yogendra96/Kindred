/**
 * Air Quality Badge Component
 * Compact AQI display with health recommendations
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
import type { AirQualityData } from '../../services/climate';

interface Props {
  data: AirQualityData | null;
  isLoading?: boolean;
  compact?: boolean;
  onPress?: () => void;
}

export const AirQualityBadge: React.FC<Props> = ({
  data,
  isLoading = false,
  compact = false,
  onPress,
}) => {
  const { theme } = useTheme();

  const getAQILevel = useCallback((aqi: number) => {
    if (aqi <= 50) {
      return {
        level: 'Good',
        color: '#22C55E',
        emoji: '😊',
        advice: 'Air quality is satisfactory. Enjoy outdoor activities!',
        shortAdvice: 'Great for outdoors',
      };
    }
    if (aqi <= 100) {
      return {
        level: 'Moderate',
        color: '#EAB308',
        emoji: '🙂',
        advice:
          'Acceptable. Unusually sensitive people should reduce outdoor exertion.',
        shortAdvice: 'OK for most people',
      };
    }
    if (aqi <= 150) {
      return {
        level: 'Unhealthy for Sensitive',
        color: '#F97316',
        emoji: '😐',
        advice:
          'Sensitive groups may experience health effects. Limit prolonged outdoor exertion.',
        shortAdvice: 'Limit outdoor time',
      };
    }
    if (aqi <= 200) {
      return {
        level: 'Unhealthy',
        color: '#EF4444',
        emoji: '😷',
        advice:
          'Everyone may experience health effects. Avoid prolonged outdoor exertion.',
        shortAdvice: 'Avoid outdoors',
      };
    }
    if (aqi <= 300) {
      return {
        level: 'Very Unhealthy',
        color: '#8B5CF6',
        emoji: '🤢',
        advice: 'Health alert! Everyone should avoid all outdoor exertion.',
        shortAdvice: 'Stay indoors',
      };
    }
    return {
      level: 'Hazardous',
      color: '#7C2D12',
      emoji: '☠️',
      advice: 'Health emergency! Everyone should avoid all outdoor activity.',
      shortAdvice: 'Emergency level',
    };
  }, []);

  const aqiInfo = useMemo(() => {
    if (!data) return null;
    return getAQILevel(data.aqi.value);
  }, [data, getAQILevel]);

  const getDominantPollutant = (pollutant: string) => {
    const pollutantMap: Record<string, { name: string; emoji: string }> = {
      pm25: { name: 'PM2.5', emoji: '🌫️' },
      pm10: { name: 'PM10', emoji: '💨' },
      o3: { name: 'Ozone', emoji: '☀️' },
      no2: { name: 'NO₂', emoji: '🚗' },
      so2: { name: 'SO₂', emoji: '🏭' },
      co: { name: 'CO', emoji: '💨' },
    };
    return (
      pollutantMap[pollutant.toLowerCase()] || { name: pollutant, emoji: '🌡️' }
    );
  };

  // Helper to get PM2.5 value from measurements
  const getPM25Value = (): number | null => {
    const pm25 = data?.measurements?.find(m => m.parameter === 'pm25');
    return pm25 ? pm25.value : null;
  };

  if (isLoading) {
    return (
      <View
        style={[styles.badgeLoading, { backgroundColor: theme.colors.surface }]}
      >
        <ActivityIndicator size='small' color={theme.colors.primary} />
      </View>
    );
  }

  if (!data || !aqiInfo) {
    return (
      <TouchableOpacity
        style={[styles.badgeEmpty, { backgroundColor: theme.colors.surface }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.emptyEmoji}>🌬️</Text>
        <Text
          style={[styles.emptyText, { color: theme.colors.text.secondary }]}
        >
          Check air quality
        </Text>
      </TouchableOpacity>
    );
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.badgeCompact, { backgroundColor: aqiInfo.color }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.compactEmoji}>{aqiInfo.emoji}</Text>
        <View style={styles.compactContent}>
          <Text style={styles.compactAQI}>{data.aqi.value}</Text>
          <Text style={styles.compactLabel}>AQI</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const pollutantInfo = getDominantPollutant(data.aqi.dominantPollutant);
  const pm25Value = getPM25Value();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          🌬️ Air Quality Index
        </Text>
        <Text style={[styles.location, { color: theme.colors.text.secondary }]}>
          {data.location.name || 'Current Location'}
        </Text>
      </View>

      {/* Main AQI Display */}
      <View style={styles.mainDisplay}>
        <View style={[styles.aqiCircle, { backgroundColor: aqiInfo.color }]}>
          <Text style={styles.aqiEmoji}>{aqiInfo.emoji}</Text>
          <Text style={styles.aqiValue}>{data.aqi.value}</Text>
          <Text style={styles.aqiLabel}>AQI</Text>
        </View>
        <View style={styles.aqiDetails}>
          <Text style={[styles.levelText, { color: aqiInfo.color }]}>
            {aqiInfo.level}
          </Text>
          <Text
            style={[styles.adviceText, { color: theme.colors.text.secondary }]}
          >
            {aqiInfo.advice}
          </Text>
        </View>
      </View>

      {/* Pollutants Bar */}
      <View style={styles.pollutants}>
        <View
          style={[
            styles.pollutantRow,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.pollutantMain}>
            <Text style={styles.pollutantEmoji}>{pollutantInfo.emoji}</Text>
            <View>
              <Text
                style={[
                  styles.pollutantLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Main Pollutant
              </Text>
              <Text
                style={[
                  styles.pollutantName,
                  { color: theme.colors.text.primary },
                ]}
              >
                {pollutantInfo.name}
              </Text>
            </View>
          </View>
          {pm25Value !== null && (
            <View style={styles.pollutantValue}>
              <Text
                style={[styles.pmValue, { color: theme.colors.text.primary }]}
              >
                {pm25Value.toFixed(1)}
              </Text>
              <Text
                style={[styles.pmUnit, { color: theme.colors.text.tertiary }]}
              >
                μg/m³
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Carbon Impact Note */}
      {data.aqi.value > 100 && (
        <View
          style={[
            styles.impactNote,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text style={styles.impactEmoji}>💡</Text>
          <Text
            style={[styles.impactText, { color: theme.colors.text.secondary }]}
          >
            Poor air quality often correlates with high local emissions.
            Consider reducing car usage and supporting clean energy.
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.timestamp, { color: theme.colors.text.tertiary }]}>
          Updated: {new Date(data.timestamp).toLocaleTimeString()}
        </Text>
        <Text style={[styles.source, { color: theme.colors.text.tertiary }]}>
          {data.source}
        </Text>
      </View>
    </TouchableOpacity>
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
  badgeLoading: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmpty: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 20,
  },
  emptyText: {
    fontSize: 8,
    textAlign: 'center',
  },
  badgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  compactEmoji: {
    fontSize: 18,
  },
  compactContent: {
    alignItems: 'center',
  },
  compactAQI: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  compactLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
  },
  mainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aqiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aqiEmoji: {
    fontSize: 20,
  },
  aqiValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  aqiLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  aqiDetails: {
    flex: 1,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pollutants: {
    marginBottom: 12,
  },
  pollutantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  pollutantMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollutantEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  pollutantLabel: {
    fontSize: 11,
  },
  pollutantName: {
    fontSize: 15,
    fontWeight: '600',
  },
  pollutantValue: {
    alignItems: 'flex-end',
  },
  pmValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  pmUnit: {
    fontSize: 10,
  },
  impactNote: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  impactEmoji: {
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  impactText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 10,
  },
  source: {
    fontSize: 10,
  },
});

export default AirQualityBadge;
