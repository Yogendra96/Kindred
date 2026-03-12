import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { mockData } from '../../data/mockData';
import { useToast } from '../../contexts/ToastContext';

// ─── Thrift Store Mock Data ──────────────────────────────────────────────────

const CATEGORIES = [
  'All',
  'Clothing',
  'Electronics',
  'Furniture',
  'Books',
  'Toys',
  'Other',
];

const THRIFT_ITEMS = [
  {
    id: 't1',
    title: "Vintage Levi's Denim Jacket",
    category: 'Clothing',
    price: 28,
    originalPrice: 120,
    condition: 'Good',
    seller: 'Emma R.',
    location: 'Brooklyn, NY',
    co2Saved: 8.2,
    emoji: '🧥',
    description:
      "Classic 90s Levi's trucker jacket. Size M. Minor fading — adds to the charm!",
  },
  {
    id: 't2',
    title: 'Sony Bluetooth Headphones WH-1000XM3',
    category: 'Electronics',
    price: 85,
    originalPrice: 350,
    condition: 'Like New',
    seller: 'James K.',
    location: 'Austin, TX',
    co2Saved: 24.5,
    emoji: '🎧',
    description:
      'Barely used. Comes with original carry case, cables, and box.',
  },
  {
    id: 't3',
    title: 'Mid-Century Wooden Bookshelf',
    category: 'Furniture',
    price: 60,
    originalPrice: 280,
    condition: 'Good',
    seller: 'Priya S.',
    location: 'Seattle, WA',
    co2Saved: 45.0,
    emoji: '📚',
    description:
      '3-shelf solid wood bookcase. Small scratch on bottom shelf. Pet-free home.',
  },
  {
    id: 't4',
    title: 'Patagonia Fleece Pullover',
    category: 'Clothing',
    price: 40,
    originalPrice: 149,
    condition: 'Excellent',
    seller: 'Luca M.',
    location: 'Portland, OR',
    co2Saved: 10.1,
    emoji: '🧶',
    description:
      'Worn twice. Size L. Classic snap-T in navy. Patagonia brand carries a lifetime warranty.',
  },
  {
    id: 't5',
    title: 'Kindle Paperwhite (10th Gen)',
    category: 'Electronics',
    price: 50,
    originalPrice: 130,
    condition: 'Good',
    seller: 'Aisha B.',
    location: 'Chicago, IL',
    co2Saved: 12.3,
    emoji: '📖',
    description:
      'Works perfectly. Small scratch on back. 8GB, waterproof. Charger included.',
  },
  {
    id: 't6',
    title: 'LEGO Star Wars Millennium Falcon',
    category: 'Toys',
    price: 95,
    originalPrice: 200,
    condition: 'Good',
    seller: 'Carlos D.',
    location: 'Miami, FL',
    co2Saved: 6.8,
    emoji: '🚀',
    description:
      'Complete set with all pieces and instructions. Missing one minifigure.',
  },
  {
    id: 't7',
    title: 'Sapiens by Yuval Noah Harari',
    category: 'Books',
    price: 5,
    originalPrice: 20,
    condition: 'Like New',
    seller: 'Mei L.',
    location: 'San Francisco, CA',
    co2Saved: 1.2,
    emoji: '📗',
    description: 'Hardcover. Read once. No highlights or notes.',
  },
  {
    id: 't8',
    title: 'Bamboo Yoga Mat',
    category: 'Other',
    price: 22,
    originalPrice: 65,
    condition: 'Good',
    seller: 'Nina W.',
    location: 'Denver, CO',
    co2Saved: 5.4,
    emoji: '🧘',
    description:
      'Eco-friendly bamboo fibre mat. Non-slip. Includes carry strap. Used ~10 times.',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const ConditionBadge = ({ condition }: { condition: string }) => {
  const color =
    condition === 'Like New'
      ? '#2e7d32'
      : condition === 'Excellent'
      ? '#1565c0'
      : '#f57c00';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + '20', borderColor: color },
      ]}
    >
      <Text style={[styles.badgeText, { color }]}>{condition}</Text>
    </View>
  );
};

const ThriftItemCard = ({
  item,
  onPress,
}: {
  item: (typeof THRIFT_ITEMS)[0];
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.thriftCard}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.thriftEmojiBox}>
      <Text style={styles.thriftEmoji}>{item.emoji}</Text>
    </View>
    <View style={styles.thriftInfo}>
      <Text style={styles.thriftTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <View style={styles.thriftRow}>
        <ConditionBadge condition={item.condition} />
        <Text style={styles.thriftLocation}>📍 {item.location}</Text>
      </View>
      <View style={styles.thriftFooter}>
        <View>
          <Text style={styles.thriftPrice}>${item.price}</Text>
          <Text style={styles.thriftOriginal}>${item.originalPrice} new</Text>
        </View>
        <View style={styles.co2Tag}>
          <Text style={styles.co2Text}>🌱 {item.co2Saved} kg CO₂ saved</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Thrift Store Tab ─────────────────────────────────────────────────────────

const ThriftStoreTab = () => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = THRIFT_ITEMS.filter(item => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCO2 = filtered
    .reduce((sum, item) => sum + item.co2Saved, 0)
    .toFixed(1);

  const handleItemPress = (item: (typeof THRIFT_ITEMS)[0]) => {
    Alert.alert(
      `${item.emoji} ${item.title}`,
      `${item.description}\n\n📦 Condition: ${item.condition}\n👤 Seller: ${item.seller}\n📍 ${item.location}\n💰 $${item.price} (was $${item.originalPrice})\n🌱 ${item.co2Saved} kg CO₂ saved vs buying new`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Message Seller',
          onPress: () =>
            showToast('In-app messaging is coming in the next update!', 'info'),
        },
        {
          text: 'Buy — $' + item.price,
          onPress: () =>
            showToast(
              `🎉 Purchased! You saved $${
                item.originalPrice - item.price
              } and ${item.co2Saved} kg of CO₂!`,
              'success',
            ),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Stats banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filtered.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCO2} kg</Text>
          <Text style={styles.statLabel}>CO₂ if all purchased</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            -
            {Math.round(
              filtered.reduce((s, i) => s + (i.originalPrice - i.price), 0),
            )}
            $
          </Text>
          <Text style={styles.statLabel}>Total savings</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder='Search thrift listings...'
          placeholderTextColor='#aaa'
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              selectedCategory === cat && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ThriftItemCard item={item} onPress={() => handleItemPress(item)} />
        )}
        contentContainerStyle={styles.thriftList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyText}>No items match your search.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* List item CTA */}
      <TouchableOpacity
        style={styles.listItemButton}
        onPress={() =>
          showToast(
            "Item listing is coming soon! You'll be able to sell your pre-loved items and earn Kindred points.",
            'info',
          )
        }
      >
        <Text style={styles.listItemText}>+ List a Pre-Loved Item</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Carbon Offset Tab ───────────────────────────────────────────────────────

const CarbonOffsetTab = () => {
  const { showToast } = useToast();
  const projects = mockData.offsetProjects;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {projects.map(project => (
        <View key={project.id} style={styles.card}>
          <View style={styles.offsetEmojiBox}>
            <Text style={styles.offsetEmoji}>🌲</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.projectTitle}>{project.name}</Text>
            <Text style={styles.projectLocation}>📍 {project.location}</Text>
            <Text style={styles.projectDescription}>{project.description}</Text>
            <View style={styles.footer}>
              <Text style={styles.price}>
                ${project.costPerTon}
                <Text style={styles.priceSub}>/ton</Text>
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  showToast(
                    `You've offset carbon via ${project.name}. Great choice! 🌍`,
                    'success',
                  )
                }
              >
                <Text style={styles.buttonText}>Offset Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const TABS = ['♻️ Thrift Store', '🌍 Carbon Offsets'];

const MarketplaceScreen = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🛍️ Kindred Market</Text>
        <Text style={styles.subtitle}>Thrift sustainably. Offset boldly.</Text>
      </View>

      {/* Top tab switcher */}
      <View style={styles.tabSwitcher}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === index && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(index)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === index && styles.tabButtonTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 0 ? <ThriftStoreTab /> : <CarbonOffsetTab />}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    padding: 20,
    paddingTop: 48,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },

  // Tab switcher
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1b5e20',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: { backgroundColor: 'white' },
  tabButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 13,
  },
  tabButtonTextActive: { color: '#2e7d32' },

  // Stats banner
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  statLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#eee', marginVertical: 4 },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  clearSearch: { fontSize: 16, color: '#aaa', paddingHorizontal: 4 },

  // Category pills
  categoryScroll: { maxHeight: 50, marginTop: 10 },
  categoryContent: { paddingHorizontal: 16, alignItems: 'center' },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryPillActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  categoryText: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoryTextActive: { color: 'white' },

  // Thrift item card
  thriftList: { padding: 16, paddingBottom: 80 },
  thriftCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  thriftEmojiBox: {
    width: 80,
    backgroundColor: '#f1f8e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thriftEmoji: { fontSize: 36 },
  thriftInfo: { flex: 1, padding: 12 },
  thriftTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  thriftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  thriftLocation: { fontSize: 11, color: '#888', flex: 1 },
  thriftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  thriftPrice: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  thriftOriginal: {
    fontSize: 11,
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
  co2Tag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  co2Text: { fontSize: 11, color: '#388e3c', fontWeight: '600' },

  // Condition badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 16 },

  // List item CTA
  listItemButton: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  listItemText: { color: 'white', fontWeight: '700', fontSize: 16 },

  // Carbon offset tab
  content: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  offsetEmojiBox: {
    width: 72,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offsetEmoji: { fontSize: 32 },
  cardContent: { flex: 1, padding: 14 },
  projectTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  projectLocation: { fontSize: 13, color: '#666', marginBottom: 6 },
  projectDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  priceSub: { fontSize: 13, fontWeight: '400', color: '#888' },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 14 },
});

export default MarketplaceScreen;
