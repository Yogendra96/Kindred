import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useToast } from '../../contexts/ToastContext';

// ─── Mock Locations ───────────────────────────────────────────────────────────

const CATEGORIES = [
  'All',
  '♻️ Recycling',
  '🌱 Organic',
  '⚡ EV Charging',
  '🌳 Green Space',
  '🛍️ Thrift',
];

const LOCATIONS = [
  {
    id: '1',
    name: 'GrowNYC Greenmarket',
    category: '🌱 Organic',
    distance: '0.3 km',
    rating: 4.8,
    description:
      'Farmers market with 140+ vendors. Organic produce, low food miles.',
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
    description:
      'Zero-waste drop-off point. Accepts hard-to-recycle plastics, batteries.',
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
    description:
      '585 acres of trees, meadows, and lake. Natural air filtration.',
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
    description:
      'Award-winning thrift store. 100% of profits to HIV/AIDS services.',
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
    description:
      'Citi Bike dock with 30 bikes. E-bike available. Biggest rack.',
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
    description: 'Non-profit workshop. Bring your broken bike, they fix it.',
    impact: 'Saves ~15 kg steel per bike',
    open: false,
    coordinate: { latitude: 40.6902, longitude: -73.959 },
  },
  {
    id: '8',
    name: 'Brooklyn Grange Farm',
    category: '🌱 Organic',
    distance: '2.4 km',
    rating: 4.9,
    description: 'Rooftop organic farm. 100,000 lbs of produce annually.',
    impact: '↓ 30% vs conventional food miles',
    open: true,
    coordinate: { latitude: 40.6972, longitude: -73.971 },
  },
];

const IMPACT_STATS = [
  { emoji: '♻️', value: '12', label: 'eco spots near you' },
  { emoji: '🌿', value: '4.2 t', label: 'CO₂ avoided nearby/month' },
  { emoji: '🏆', value: '#3', label: 'greenest zip in Brooklyn' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const LocationCard = ({ item }: { item: (typeof LOCATIONS)[0] }) => {
  const { showToast } = useToast();
  return (
    <TouchableOpacity
      style={styles.locationCard}
      activeOpacity={0.85}
      onPress={() =>
        Alert.alert(
          `${item.name}`,
          `${item.description}\n\n📍 ${item.distance} away\n⭐ ${item.rating}/5\n🌱 ${item.impact}`,
          [
            {
              text: 'Directions',
              onPress: () =>
                showToast('Opens in Maps app — coming in next update!', 'info'),
            },
            { text: 'Close', style: 'cancel' },
          ],
        )
      }
    >
      <View style={styles.locationTop}>
        <View style={styles.locationMeta}>
          <Text style={styles.locationName}>{item.name}</Text>
          <View style={styles.locationTagRow}>
            <View style={styles.catChip}>
              <Text style={styles.catChipText}>{item.category}</Text>
            </View>
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
        <Text style={styles.impactText}>🌱 {item.impact}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const MapScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered =
    selectedCategory === 'All'
      ? LOCATIONS
      : LOCATIONS.filter(l => l.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Local Impact</Text>
        <Text style={styles.subtitle}>Eco-friendly spots near you</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Impact stats */}
        <View style={styles.statsRow}>
          {IMPACT_STATS.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
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
                <View
                  style={[
                    styles.markerBadge,
                    !location.open && styles.markerBadgeClosed,
                  ]}
                >
                  <Text style={styles.markerText}>
                    {location.category.split(' ')[0]}
                  </Text>
                </View>
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{location.name}</Text>
                    <Text style={styles.calloutDesc}>
                      {location.description}
                    </Text>
                    <Text style={styles.calloutImpact}>{location.impact}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.filterPill,
                selectedCategory === c && styles.filterPillActive,
              ]}
              onPress={() => setSelectedCategory(c)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === c && styles.filterTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Location list */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>
            {filtered.length} locations found
          </Text>
          {filtered.map(item => (
            <LocationCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1b5e20',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  statsRow: { flexDirection: 'row', margin: 16, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1b5e20' },
  statLabel: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2 },

  mapContainer: {
    marginHorizontal: 16,
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  markerBadge: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#4caf50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerBadgeClosed: {
    borderColor: '#9e9e9e',
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterPillActive: { backgroundColor: '#1b5e20', borderColor: '#1b5e20' },
  filterText: { fontSize: 12, color: '#555', fontWeight: '500' },
  filterTextActive: { color: 'white' },

  listContainer: { padding: 16, paddingBottom: 32 },
  listTitle: { fontSize: 14, color: '#888', marginBottom: 12 },

  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  locationTop: { flexDirection: 'row', marginBottom: 8 },
  locationMeta: { flex: 1 },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  locationTagRow: { flexDirection: 'row', gap: 8 },
  catChip: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catChipText: { fontSize: 11, color: '#2e7d32', fontWeight: '600' },
  openChip: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  closedChip: { backgroundColor: '#fafafa' },
  openText: { fontSize: 11, color: '#4caf50', fontWeight: '700' },
  closedText: { color: '#aaa' },
  locationRight: { alignItems: 'flex-end', gap: 4 },
  locationDistance: { fontSize: 13, fontWeight: '700', color: '#1b5e20' },
  locationRating: { fontSize: 12, color: '#888' },
  locationDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  impactChip: {
    backgroundColor: '#f1f8e9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  impactText: { fontSize: 12, color: '#388e3c', fontWeight: '600' },
});

export default MapScreen;
