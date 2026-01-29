/**
 * Emission Source Card
 * Displays nearby emission source details from Climate TRACE
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Flattened emission source data for UI display
 * This is a simplified version of the GeoJSON EmissionSource from ClimateTraceService
 */
export interface EmissionSourceDisplay {
  id: string | number;
  name: string;
  sector: string;
  subsectors?: string[];
  emissions: number; // tonnes CO2/year
  country: string;
  distance: number; // meters from user
  rank?: number;
  lastUpdated?: string;
  coordinates?: [number, number]; // [lng, lat]
}

interface Props {
  source: EmissionSourceDisplay;
  onPress?: (source: EmissionSourceDisplay) => void;
  compact?: boolean;
}

export const EmissionSourceCard: React.FC<Props> = ({
  source,
  onPress,
  compact = false,
}) => {
  const { theme } = useTheme();

  const getSectorInfo = useCallback((sector: string) => {
    const sectorMap: Record<string, { emoji: string; color: string }> = {
      power: { emoji: '⚡', color: '#F59E0B' },
      'electricity-generation': { emoji: '🔌', color: '#F59E0B' },
      'oil-and-gas-production': { emoji: '🛢️', color: '#6B7280' },
      'oil-and-gas-refining': { emoji: '🏭', color: '#6B7280' },
      'coal-mining': { emoji: '⛏️', color: '#374151' },
      steel: { emoji: '🔩', color: '#64748B' },
      cement: { emoji: '🧱', color: '#9CA3AF' },
      aluminum: { emoji: '🔧', color: '#94A3B8' },
      'pulp-and-paper': { emoji: '📄', color: '#84CC16' },
      chemicals: { emoji: '🧪', color: '#8B5CF6' },
      transportation: { emoji: '🚗', color: '#3B82F6' },
      shipping: { emoji: '🚢', color: '#0EA5E9' },
      aviation: { emoji: '✈️', color: '#6366F1' },
      agriculture: { emoji: '🌾', color: '#22C55E' },
      'forest-land': { emoji: '🌲', color: '#16A34A' },
      waste: { emoji: '🗑️', color: '#78716C' },
    };

    const lowerSector = sector.toLowerCase();
    return sectorMap[lowerSector] || { emoji: '🏭', color: '#6B7280' };
  }, []);

  const sectorInfo = useMemo(
    () => getSectorInfo(source.sector),
    [getSectorInfo, source.sector],
  );

  const formatEmissions = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const getImpactLevel = useCallback(
    (emissions: number) => {
      if (emissions >= 10000000)
        return { level: 'Major', color: theme.colors.error };
      if (emissions >= 1000000) return { level: 'Large', color: '#F97316' };
      if (emissions >= 100000)
        return { level: 'Medium', color: theme.colors.warning };
      return { level: 'Small', color: theme.colors.success };
    },
    [theme.colors.error, theme.colors.warning, theme.colors.success],
  );

  const impactLevel = useMemo(
    () => getImpactLevel(source.emissions),
    [getImpactLevel, source.emissions],
  );

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          { backgroundColor: theme.colors.surface },
        ]}
        onPress={() => onPress?.(source)}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <Text style={styles.compactEmoji}>{sectorInfo.emoji}</Text>
        <View style={styles.compactInfo}>
          <Text
            style={[styles.compactName, { color: theme.colors.text.primary }]}
            numberOfLines={1}
          >
            {source.name}
          </Text>
          <Text
            style={[
              styles.compactDistance,
              { color: theme.colors.text.secondary },
            ]}
          >
            {formatDistance(source.distance)}
          </Text>
        </View>
        <View style={styles.compactEmissions}>
          <Text style={[styles.compactValue, { color: impactLevel.color }]}>
            {formatEmissions(source.emissions)}
          </Text>
          <Text
            style={[styles.compactUnit, { color: theme.colors.text.tertiary }]}
          >
            tCO₂/yr
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={() => onPress?.(source)}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[styles.sectorBadge, { backgroundColor: sectorInfo.color }]}
        >
          <Text style={styles.sectorEmoji}>{sectorInfo.emoji}</Text>
          <Text style={styles.sectorText}>
            {source.sector.replace(/-/g, ' ')}
          </Text>
        </View>
        <View
          style={[styles.distanceBadge, { borderColor: theme.colors.border }]}
        >
          <Text
            style={[
              styles.distanceText,
              { color: theme.colors.text.secondary },
            ]}
          >
            📍 {formatDistance(source.distance)}
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text style={[styles.name, { color: theme.colors.text.primary }]}>
        {source.name}
      </Text>

      {/* Location */}
      <Text style={[styles.location, { color: theme.colors.text.secondary }]}>
        {source.country}
      </Text>

      {/* Emissions Display */}
      <View
        style={[
          styles.emissionsContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.emissionsMain}>
          <Text
            style={[
              styles.emissionsValue,
              { color: theme.colors.text.primary },
            ]}
          >
            {formatEmissions(source.emissions)}
          </Text>
          <Text
            style={[
              styles.emissionsUnit,
              { color: theme.colors.text.secondary },
            ]}
          >
            tonnes CO₂/year
          </Text>
        </View>
        <View
          style={[styles.impactBadge, { backgroundColor: impactLevel.color }]}
        >
          <Text style={styles.impactText}>{impactLevel.level} Source</Text>
        </View>
      </View>

      {/* Subsectors if available */}
      {source.subsectors && source.subsectors.length > 0 && (
        <View style={styles.subsectors}>
          <Text
            style={[
              styles.subsectorsLabel,
              { color: theme.colors.text.secondary },
            ]}
          >
            Activities:
          </Text>
          <View style={styles.subsectorTags}>
            {source.subsectors.slice(0, 3).map((subsector, index) => (
              <View
                key={index}
                style={[
                  styles.subsectorTag,
                  { backgroundColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.subsectorText,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  {subsector.replace(/-/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Context */}
      <View style={styles.contextRow}>
        <View style={styles.contextItem}>
          <Text
            style={[styles.contextLabel, { color: theme.colors.text.tertiary }]}
          >
            Sector Global Rank
          </Text>
          <Text
            style={[styles.contextValue, { color: theme.colors.text.primary }]}
          >
            #{source.rank?.toLocaleString() || 'N/A'}
          </Text>
        </View>
        {source.lastUpdated && (
          <View style={styles.contextItem}>
            <Text
              style={[
                styles.contextLabel,
                { color: theme.colors.text.tertiary },
              ]}
            >
              Last Updated
            </Text>
            <Text
              style={[
                styles.contextValue,
                { color: theme.colors.text.primary },
              ]}
            >
              {new Date(source.lastUpdated).getFullYear()}
            </Text>
          </View>
        )}
      </View>

      {/* Action hint */}
      {onPress && (
        <View style={styles.actionHint}>
          <Text
            style={[styles.actionHintText, { color: theme.colors.primary }]}
          >
            Tap for details →
          </Text>
        </View>
      )}
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
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  compactEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactDistance: {
    fontSize: 12,
    marginTop: 2,
  },
  compactEmissions: {
    alignItems: 'flex-end',
  },
  compactValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  compactUnit: {
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectorEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  sectorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  distanceBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 12,
  },
  emissionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  emissionsMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  emissionsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  emissionsUnit: {
    fontSize: 12,
    marginLeft: 6,
  },
  impactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  subsectors: {
    marginBottom: 12,
  },
  subsectorsLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  subsectorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subsectorTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subsectorText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contextItem: {
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionHint: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  actionHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EmissionSourceCard;
