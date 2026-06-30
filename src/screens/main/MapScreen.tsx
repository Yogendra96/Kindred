import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useToast } from '../../contexts/ToastContext';
import { useGreenRouteTelemetry } from '../../hooks/useGreenRouteTelemetry';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import {
  Leaf,
  Recycle,
  Lightning,
  Tree,
  Tote,
  Compass,
  CheckCircle,
  Trophy,
} from 'phosphor-react-native';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

interface GlassBadgeProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassBadge = ({ style, children }: GlassBadgeProps) => (
  <View style={[styles.glassBadge, style]}>{children}</View>
);

const CATEGORIES = [
  { id: 'All', icon: null, label: 'All' },
  {
    id: '♻️ Recycling',
    icon: <Recycle size={16} color='#38EF7D' weight='duotone' />,
    label: 'Recycling',
  },
  {
    id: '🌱 Organic',
    icon: <Leaf size={16} color='#38EF7D' weight='duotone' />,
    label: 'Organic',
  },
  {
    id: '⚡ EV Charging',
    icon: <Lightning size={16} color='#F2C94C' weight='duotone' />,
    label: 'EV Charging',
  },
  {
    id: '🌳 Green Space',
    icon: <Tree size={16} color='#11998E' weight='duotone' />,
    label: 'Green Space',
  },
  {
    id: '🛍️ Thrift',
    icon: <Tote size={16} color='#F2994A' weight='duotone' />,
    label: 'Thrift',
  },
];

const LOCATIONS = [
  {
    id: '1',
    name: 'GrowNYC Greenmarket',
    category: '🌱 Organic',
    distance: '0.3 km',
    rating: 4.8,
    description: 'Farmers market with 140+ vendors. Organic produce, low food miles.',
    impact: '↓ 2.1 kg CO₂ vs supermarket trip',
    open: true,
    coordinate: { latitude: 40.73061, longitude: -73.935242 },
  },
  {
    id: '2',
    name: 'TerraCycle Drop-Off',
    category: '♻️ Recycling',
    distance: '0.6 km',
    rating: 4.5,
    description: 'Zero-waste drop-off point. Accepts hard-to-recycle plastics, batteries.',
    impact: '↓ 1.4 kg CO₂ per visit',
    open: true,
    coordinate: { latitude: 40.73561, longitude: -73.940242 },
  },
  {
    id: '3',
    name: 'EVgo Charging Hub',
    category: '⚡ EV Charging',
    distance: '0.9 km',
    rating: 4.3,
    description: 'Fast-charge station. 150kW DC. 24/7. 100% renewable energy.',
    impact: '↓ 4.6 kg CO₂ vs gas fill-up',
    open: true,
    coordinate: { latitude: 40.74061, longitude: -73.935242 },
  },
  {
    id: '4',
    name: 'Prospect Park',
    category: '🌳 Green Space',
    distance: '1.1 km',
    rating: 4.9,
    description: '585 acres of trees, meadows, and lake. Natural air filtration.',
    impact: 'Absorbs ~850 t CO₂/year',
    open: true,
    coordinate: { latitude: 40.6602, longitude: -73.969 },
  },
  {
    id: '5',
    name: 'Housing Works Thrift',
    category: '🛍️ Thrift',
    distance: '1.4 km',
    rating: 4.6,
    description: 'Award-winning thrift store. 100% of profits to HIV/AIDS services.',
    impact: '↓ 8+ kg CO₂ per purchase vs new',
    open: true,
    coordinate: { latitude: 40.72061, longitude: -73.955242 },
  },
  {
    id: '6',
    name: 'Brooklyn Bike Share',
    category: '⚡ EV Charging',
    distance: '1.6 km',
    rating: 4.4,
    description: 'Citi Bike dock with 30 bikes. E-bike available. Biggest rack.',
    impact: '↓ 1.2 kg CO₂ vs 5km car trip',
    open: true,
    coordinate: { latitude: 40.6802, longitude: -73.979 },
  },
  {
    id: '7',
    name: 'Recycle-A-Bicycle',
    category: '♻️ Recycling',
    distance: '2.0 km',
    rating: 4.7,
    description: 'Community-based bike shop. Refurbished bikes and parts.',
    impact: '↓ 15 kg CO₂ vs new bike',
    open: false,
    coordinate: { latitude: 40.6852, longitude: -73.985 },
  },
  {
    id: '8',
    name: 'Community Garden 42',
    category: '🌱 Organic',
    distance: '2.2 km',
    rating: 4.9,
    description: 'Local volunteer-run garden with compost drop-off.',
    impact: '↓ 5 kg CO₂ food waste diverted/week',
    open: true,
    coordinate: { latitude: 40.6902, longitude: -73.99 },
  },
];

const IMPACT_STATS = [
  {
    icon: <Recycle size={28} color='#38EF7D' weight='duotone' />,
    value: '12',
    label: 'eco spots near you',
  },
  {
    icon: <Leaf size={28} color='#38EF7D' weight='duotone' />,
    value: '4.2 t',
    label: 'CO₂ avoided nearby/month',
  },
  {
    icon: <Trophy size={28} color='#F2C94C' weight='duotone' />,
    value: '#3',
    label: 'greenest zip in Brooklyn',
  },
];

const LocationCard = ({ item }: { item: (typeof LOCATIONS)[0] }) => {
  const { showToast } = useToast();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        Alert.alert(
          `${item.name}`,
          `${item.description}\n\n📍 ${item.distance} away\n⭐ ${item.rating}/5\n🌱 ${item.impact}`,
          [
            {
              text: 'Directions',
              onPress: () => showToast('Opens in Maps app — coming in next update!', 'info'),
            },
            { text: 'Close', style: 'cancel' },
          ],
        )
      }
    >
      <GlassCard style={styles.locationCard}>
        <View style={styles.locationTop}>
          <View style={styles.locationMeta}>
            <Text style={styles.locationName}>{item.name}</Text>
            <View style={styles.locationTagRow}>
              <GlassBadge style={styles.catChip}>
                <Text style={styles.catChipText}>
                  {CATEGORIES.find(c => c.id === item.category)?.label || 'Eco'}
                </Text>
              </GlassBadge>
              <View style={[styles.openChip, !item.open && styles.closedChip]}>
                <Text style={[styles.openText, !item.open && styles.closedText]}>
                  {item.open ? '● Open' : '○ Closed'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.locationRight}>
            <Text style={styles.locationDistance}>{item.distance}</Text>
            <Text style={styles.locationRating}>⭐ {item.rating}</Text>
          </View>
        </View>
        <Text style={styles.locationDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.impactChip}>
          <Leaf size={14} color='#38EF7D' weight='duotone' />
          <Text style={styles.impactText}>{item.impact}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const MapScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { isTracking, bufferedCount, startGreenRoute, stopGreenRoute } = useGreenRouteTelemetry();

  const filtered =
    selectedCategory === 'All' ? LOCATIONS : LOCATIONS.filter(l => l.category === selectedCategory);

  return (
    <View style={styles.container}>
      <Svg height='100%' width='100%' style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id='bgGrad' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor='#0f2027' stopOpacity='1' />
            <Stop offset='0.5' stopColor='#203a43' stopOpacity='1' />
            <Stop offset='1' stopColor='#2c5364' stopOpacity='1' />
          </SvgLinearGradient>
        </Defs>
        <Rect x='0' y='0' width='100%' height='100%' fill='url(#bgGrad)' />
      </Svg>

      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Local Impact</Text>
        <Text style={styles.subtitle}>Eco-friendly spots near you</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          {IMPACT_STATS.map(s => (
            <GlassCard key={s.label} style={styles.statCard}>
              <View style={styles.statEmojiWrapper}>{s.icon}</View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </GlassCard>
          ))}
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            userInterfaceStyle='dark'
            initialRegion={{
              latitude: 40.73061,
              longitude: -73.935242,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {filtered.map(location => (
              <Marker
                key={location.id}
                coordinate={location.coordinate}
                title={location.name}
                description={location.description}
              >
                <View style={[styles.markerBadge, !location.open && styles.markerBadgeClosed]}>
                  <Text style={styles.markerText}>
                    {location.category.includes('♻️')
                      ? '♻️'
                      : location.category.includes('🌱')
                      ? '🌱'
                      : location.category.includes('⚡')
                      ? '⚡'
                      : location.category.includes('🌳')
                      ? '🌳'
                      : location.category.includes('🛍️')
                      ? '🛍️'
                      : '📍'}
                  </Text>
                </View>
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{location.name}</Text>
                    <Text style={styles.calloutDesc}>{location.description}</Text>
                    <Text style={styles.calloutImpact}>{location.impact}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.id} onPress={() => setSelectedCategory(c.id)}>
              <View
                style={[styles.filterPill, selectedCategory === c.id && styles.filterPillActive]}
              >
                {c.icon && <View style={styles.categoryIconContainer}>{c.icon}</View>}
                <Text
                  style={[styles.filterText, selectedCategory === c.id && styles.filterTextActive]}
                >
                  {c.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>{filtered.length} locations found</Text>
          {filtered.map(item => (
            <LocationCard key={item.id} item={item} />
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, isTracking && styles.fabTracking]}
          onPress={() => (isTracking ? stopGreenRoute() : startGreenRoute('walking'))}
        >
          <View style={styles.fabIconWrapper}>
            {isTracking ? (
              <CheckCircle size={24} color='#fff' weight='fill' />
            ) : (
              <Compass size={24} color='#0f2027' weight='fill' />
            )}
          </View>
          <View>
            <Text style={[styles.fabTitle, isTracking && styles.fabTitleTracking]}>
              {isTracking ? 'End Green Route' : 'Start Green Route'}
            </Text>
            <Text style={[styles.fabSub, isTracking && styles.fabSubTracking]}>
              {isTracking
                ? `Saved ${bufferedCount} eco-points so far`
                : 'Passive emissions tracking'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2027' },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  statEmojiWrapper: { marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 2,
  },

  mapContainer: {
    marginHorizontal: 16,
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  markerBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#38EF7D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerBadgeClosed: {
    borderColor: '#9e9e9e',
    backgroundColor: '#eee',
  },
  markerText: {
    fontSize: 16,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  calloutImpact: {
    fontSize: 11,
    color: '#388e3c',
    fontWeight: '600',
  },

  filterScroll: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(56,239,125,0.2)',
    borderColor: '#38EF7D',
  },
  filterText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  filterTextActive: { color: '#38EF7D', fontWeight: 'bold' },

  listContainer: { padding: 16, paddingBottom: 32 },
  listTitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },

  locationCard: {
    padding: 16,
    marginBottom: 12,
  },
  locationTop: { flexDirection: 'row', marginBottom: 8 },
  locationMeta: { flex: 1 },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  locationTagRow: { flexDirection: 'row', gap: 8 },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catChipText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  openChip: {
    backgroundColor: 'rgba(56,239,125,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  closedChip: { backgroundColor: 'rgba(255,255,255,0.1)' },
  openText: { fontSize: 11, color: '#38EF7D', fontWeight: '700' },
  closedText: { color: 'rgba(255,255,255,0.5)' },
  locationRight: { alignItems: 'flex-end', gap: 4 },
  locationDistance: { fontSize: 13, fontWeight: '700', color: '#38EF7D' },
  locationRating: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  locationDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
    marginBottom: 10,
  },
  impactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  impactText: {
    fontSize: 12,
    color: '#38EF7D',
    fontWeight: '600',
    marginLeft: 6,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: '85%',
  },
  fab: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 12,
  },
  fabTracking: {
    backgroundColor: '#FF416C',
    borderColor: '#FF4b2b',
  },
  fabIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabTitle: {
    color: '#0f2027',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fabSub: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  glassBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryIconContainer: {
    marginRight: 6,
  },
  bottomSpacer: {
    height: 100,
  },
  fabTitleTracking: {
    color: '#fff',
  },
  fabSubTracking: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default MapScreen;
