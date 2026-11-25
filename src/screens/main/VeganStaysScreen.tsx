import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  MagnifyingGlass,
  X,
  House,
  Heart,
  CheckCircle,
  CalendarCheck,
  ShieldCheck,
  Sparkle,
  Plus,
  Tree,
  MapPin,
  Star,
} from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../contexts/ToastContext';
import type { VeganStay } from '../../data/veganStaysData';
import { VEGAN_STAYS } from '../../data/veganStaysData';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STAY_TYPES = [
  'All',
  'Sanctuary Cottage',
  'Eco-Homestay',
  'Vegan B&B',
  'Permaculture Villa',
] as const;

export const VeganStaysScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [stays, setStays] = useState<VeganStay[]>(VEGAN_STAYS);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected stay for detail modal
  const [selectedStay, setSelectedStay] = useState<VeganStay | null>(null);

  // Booking modal
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [stayToBook, setStayToBook] = useState<VeganStay | null>(null);
  const [selectedDates, setSelectedDates] = useState<string>('');
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [useKindredPoints, setUseKindredPoints] = useState<boolean>(false);

  // Host onboarding modal
  const [isHostModalVisible, setIsHostModalVisible] = useState(false);
  const [hostStayName, setHostStayName] = useState('');
  const [hostLocation, setHostLocation] = useState('');
  const [hostPrice, setHostPrice] = useState('');
  const [hostType, setHostType] = useState<VeganStay['type']>('Sanctuary Cottage');
  const [hostAnimalStory, setHostAnimalStory] = useState('');
  const [hostPledgeAgreed, setHostPledgeAgreed] = useState(false);

  // Filtered stays
  const filteredStays = stays.filter(stay => {
    const matchesType = selectedType === 'All' || stay.type === selectedType;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesType;

    const matchesName = stay.name.toLowerCase().includes(query);
    const matchesLocation =
      stay.city.toLowerCase().includes(query) || stay.country.toLowerCase().includes(query);
    const matchesTagline = stay.tagline.toLowerCase().includes(query);

    return matchesType && (matchesName || matchesLocation || matchesTagline);
  });

  const handleOpenBooking = (stay: VeganStay) => {
    setStayToBook(stay);
    setSelectedDates(stay.availableDates[0] || 'Next Weekend');
    setIsBookingModalVisible(true);
  };

  const handleConfirmReservation = () => {
    if (!stayToBook) return;

    const basePrice = stayToBook.pricePerNight * 3; // 3 nights default
    const discount = useKindredPoints ? 25 : 0;
    const finalTotal = Math.max(0, basePrice - discount);

    setIsBookingModalVisible(false);
    setSelectedStay(null);

    Alert.alert(
      '🎉 Vegan Homestay Reserved!',
      `You are booked at ${stayToBook.name} (${selectedDates}).\n\nGuests: ${guestsCount}\nTotal: $${finalTotal} (3 Nights)\n${
        useKindredPoints ? 'Applied 500 Kindred Karma points (-$25)\n' : ''
      }\n🐾 Impact: ${stayToBook.animalImpact}\n\nHost ${stayToBook.hostName} has been notified with your arrival details!`,
      [
        {
          text: 'Wonderful!',
          onPress: () => showToast('Reservation confirmed! Sanctuary notified.', 'success'),
        },
      ],
    );
  };

  const handleCreateHostListing = () => {
    if (!hostStayName.trim() || !hostLocation.trim() || !hostPrice.trim()) {
      showToast('Please provide stay title, location, and price per night.', 'error');
      return;
    }
    if (!hostPledgeAgreed) {
      showToast('Please check the 100% Cruelty-Free & Plant-Based stay pledge.', 'error');
      return;
    }

    const priceNum = parseFloat(hostPrice) || 85;
    const newStay: VeganStay = {
      id: `stay-${Date.now()}`,
      name: hostStayName.trim(),
      type: hostType,
      tagline: `Community verified ${hostType} in ${hostLocation.trim()}`,
      city: hostLocation.trim(),
      country: 'Community Hub',
      countryCode: 'GLOBE',
      flag: '🌱',
      pricePerNight: priceNum,
      rating: 5.0,
      reviewsCount: 1,
      emoji: '🏡',
      hostName: 'Kindred Ethical Host',
      hostAvatar: '🌿',
      hostBio:
        'Passionate vegan host sharing sanctuary living with respectful conscious travelers.',
      animalImpact:
        hostAnimalStory.trim() ||
        'Directly sponsors local rescued animals and organic plant gardening.',
      amenities: [
        '100% Plant-Based Kitchen',
        'Cruelty-Free Down-Free Bedding',
        'Organic Herb Garden',
        'Eco-Composting',
      ],
      houseRules: [
        'Strictly zero animal products on premises.',
        'Respect quiet hours and local flora/fauna.',
      ],
      osmTag: 'tourism=guest_house;diet:vegan=only;verified=community',
      availableDates: ['Upcoming Dates Available'],
      description: hostAnimalStory.trim() || 'A peaceful 100% vegan haven for ethical travelers.',
    };

    setStays(prev => [newStay, ...prev]);
    setIsHostModalVisible(false);

    // Reset form
    setHostStayName('');
    setHostLocation('');
    setHostPrice('');
    setHostAnimalStory('');
    setHostPledgeAgreed(false);

    showToast(`Your vegan stay "${newStay.name}" is now listed!`, 'success');
  };

  return (
    <SpaceBackground earthPosition='bottom-right' enableComets={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel='Go back'
            testID='vegan-stays-back-btn'
          >
            <ArrowLeft size={22} color='#fff' />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Vegan Stays</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={14} color='#38EF7D' weight='bold' />
                <Text style={styles.verifiedBadgeText}>OSM diet:vegan=only</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              Sanctuary cottages, eco-homestays & 100% plant kitchens
            </Text>
          </View>

          {/* List a stay button */}
          <TouchableOpacity
            style={styles.hostHeaderBtn}
            onPress={() => setIsHostModalVisible(true)}
            testID='open-host-modal-btn'
            accessibilityLabel='List a vegan homestay'
          >
            <Plus size={18} color='#000' weight='bold' />
            <Text style={styles.hostHeaderBtnText}>Host</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <GlassCard style={styles.searchCard}>
          <MagnifyingGlass size={18} color='rgba(255,255,255,0.5)' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search Catskill, Kyoto, Tuscany, Sanctuary...'
            placeholderTextColor='rgba(255,255,255,0.4)'
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID='vegan-stays-search-input'
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color='rgba(255,255,255,0.5)' />
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Type Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeScroll}
          contentContainerStyle={styles.typeContent}
        >
          {STAY_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
              onPress={() => setSelectedType(type)}
              testID={`stay-type-filter-${type}`}
            >
              <Text
                style={[styles.typeChipText, selectedType === type && styles.typeChipTextActive]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.staysList}>
          {filteredStays.map(stay => (
            <GlassCard key={stay.id} style={styles.stayCard}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedStay(stay)}
                testID={`stay-card-${stay.id}`}
              >
                <View style={styles.stayCardHeader}>
                  <View style={styles.stayEmojiBox}>
                    <Text style={styles.stayEmoji}>{stay.emoji}</Text>
                  </View>
                  <View style={styles.stayTypePill}>
                    <Tree size={12} color='#38EF7D' weight='fill' />
                    <Text style={styles.stayTypeText}>{stay.type}</Text>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <Text style={styles.flagText}>{stay.flag}</Text>
                  <Text style={styles.locationText}>
                    {stay.city}, {stay.country}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color='#FBBF24' weight='fill' />
                    <Text style={styles.ratingText}>
                      {stay.rating.toFixed(1)} ({stay.reviewsCount})
                    </Text>
                  </View>
                </View>

                <Text style={styles.stayTitle}>{stay.name}</Text>
                <Text style={styles.stayTagline} numberOfLines={2}>
                  {stay.tagline}
                </Text>

                {/* Animal Impact Badge */}
                <View style={styles.impactBadge}>
                  <Heart size={14} color='#FF6B6B' weight='fill' />
                  <Text style={styles.impactBadgeText} numberOfLines={2}>
                    {stay.animalImpact}
                  </Text>
                </View>

                {/* Footer with Price & CTA */}
                <View style={styles.stayCardFooter}>
                  <View>
                    <Text style={styles.priceText}>
                      ${stay.pricePerNight}
                      <Text style={styles.priceSubText}> / night</Text>
                    </Text>
                    <Text style={styles.osmTagText}>
                      ✓ {stay.osmTag.split(';')[1] || 'diet:vegan=only'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.reserveBtn}
                    onPress={() => handleOpenBooking(stay)}
                    testID={`book-btn-${stay.id}`}
                  >
                    <Text style={styles.reserveBtnText}>Reserve Stay</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </GlassCard>
          ))}

          {filteredStays.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🏡</Text>
              <Text style={styles.emptyTitle}>No Vegan Stays Found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or filter by a different stay category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Stay Details Modal */}
      {selectedStay && (
        <Modal
          visible={!!selectedStay}
          transparent
          animationType='slide'
          onRequestClose={() => setSelectedStay(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalEmojiBox}>
                  <Text style={styles.modalEmoji}>{selectedStay.emoji}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedStay(null)}>
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalType}>
                {selectedStay.type} • {selectedStay.flag} {selectedStay.city}
              </Text>
              <Text style={styles.modalTitle}>{selectedStay.name}</Text>
              <Text style={styles.modalTagline}>{selectedStay.tagline}</Text>

              {/* Host story */}
              <View style={styles.hostCard}>
                <Text style={styles.hostAvatar}>{selectedStay.hostAvatar}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostName}>Hosted by {selectedStay.hostName}</Text>
                  <Text style={styles.hostBio}>{selectedStay.hostBio}</Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>🐾 Animal & Sanctuary Impact</Text>
              <View style={styles.impactCard}>
                <Text style={styles.impactText}>{selectedStay.animalImpact}</Text>
              </View>

              <Text style={styles.modalSectionLabel}>100% Vegan Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {selectedStay.amenities.map(a => (
                  <View key={a} style={styles.amenityChip}>
                    <CheckCircle size={14} color='#38EF7D' weight='fill' />
                    <Text style={styles.amenityChipText}>{a}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.modalSectionLabel}>House Policy</Text>
              <View style={styles.rulesWrap}>
                {selectedStay.houseRules.map(r => (
                  <Text key={r} style={styles.ruleText}>
                    • {r}
                  </Text>
                ))}
              </View>

              <View style={styles.modalFooterActions}>
                <View>
                  <Text style={styles.modalPrice}>
                    ${selectedStay.pricePerNight}
                    <Text style={styles.priceSubText}> / night</Text>
                  </Text>
                  <Text style={styles.modalDates}>
                    Dates: {selectedStay.availableDates.join(', ')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalBookBtn}
                  onPress={() => handleOpenBooking(selectedStay)}
                  testID='modal-reserve-btn'
                >
                  <CalendarCheck size={18} color='#000' weight='bold' />
                  <Text style={styles.modalBookBtnText}>Book Dates</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      )}

      {/* Reservation Checkout Modal */}
      {isBookingModalVisible && stayToBook && (
        <Modal
          visible={isBookingModalVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setIsBookingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.bookingModalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingModalTitle}>Confirm Sanctuary Reservation</Text>
                  <Text style={styles.bookingModalSub}>{stayToBook.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setIsBookingModalVisible(false)}
                >
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSectionLabel}>Select Stay Dates</Text>
              <View style={styles.datesRow}>
                {stayToBook.availableDates.map(dates => (
                  <TouchableOpacity
                    key={dates}
                    style={[styles.dateChip, selectedDates === dates && styles.dateChipActive]}
                    onPress={() => setSelectedDates(dates)}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        selectedDates === dates && styles.dateChipTextActive,
                      ]}
                    >
                      {dates}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionLabel}>Guests</Text>
              <View style={styles.guestsCounterRow}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                >
                  <Text style={styles.counterBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.guestsCountText}>{guestsCount} Guests</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setGuestsCount(Math.min(6, guestsCount + 1))}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Karma Points Discount */}
              <TouchableOpacity
                style={styles.karmaDiscountRow}
                onPress={() => setUseKindredPoints(!useKindredPoints)}
                activeOpacity={0.8}
                testID='karma-discount-toggle'
              >
                <View style={[styles.checkbox, useKindredPoints && styles.checkboxActive]}>
                  {useKindredPoints && <CheckCircle size={18} color='#000' weight='fill' />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.karmaDiscountTitle}>Use 500 Kindred Karma (-$25.00)</Text>
                  <Text style={styles.karmaDiscountSub}>
                    Reward earned from walking & plant-based dining
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Price Breakdown */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    3 Nights (${stayToBook.pricePerNight}/night)
                  </Text>
                  <Text style={styles.breakdownVal}>${stayToBook.pricePerNight * 3}</Text>
                </View>
                {useKindredPoints && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: '#38EF7D' }]}>
                      Karma Discount
                    </Text>
                    <Text style={[styles.breakdownVal, { color: '#38EF7D' }]}>-$25</Text>
                  </View>
                )}
                <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalVal}>
                    ${Math.max(0, stayToBook.pricePerNight * 3 - (useKindredPoints ? 25 : 0))}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.confirmBookingBtn}
                onPress={handleConfirmReservation}
                testID='confirm-reservation-btn'
              >
                <Text style={styles.confirmBookingBtnText}>Confirm & Book Stay</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </Modal>
      )}

      {/* Host Onboarding Modal */}
      {isHostModalVisible && (
        <Modal
          visible={isHostModalVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setIsHostModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.hostModalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingModalTitle}>List Your Vegan Stay</Text>
                  <Text style={styles.bookingModalSub}>
                    Welcome ethical conscious travelers into your home or sanctuary
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setIsHostModalVisible(false)}
                >
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }}>
                <Text style={styles.formLabel}>Stay Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g. Farm Sanctuary Woodland Cabin'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={hostStayName}
                  onChangeText={setHostStayName}
                  testID='host-stay-name-input'
                />

                <Text style={styles.formLabel}>Location (City, Country) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g. Asheville, NC, USA'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={hostLocation}
                  onChangeText={setHostLocation}
                  testID='host-location-input'
                />

                <Text style={styles.formLabel}>Price Per Night (USD $) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g. 95'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  keyboardType='numeric'
                  value={hostPrice}
                  onChangeText={setHostPrice}
                  testID='host-price-input'
                />

                <Text style={styles.formLabel}>Animal Sanctuary / Host Story</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder='Describe your plant kitchen, rescued animals, and eco-amenities...'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  multiline
                  numberOfLines={4}
                  value={hostAnimalStory}
                  onChangeText={setHostAnimalStory}
                />

                <TouchableOpacity
                  style={styles.pledgeRow}
                  onPress={() => setHostPledgeAgreed(!hostPledgeAgreed)}
                  activeOpacity={0.8}
                  testID='host-pledge-toggle'
                >
                  <View style={[styles.checkbox, hostPledgeAgreed && styles.checkboxActive]}>
                    {hostPledgeAgreed && <CheckCircle size={18} color='#000' weight='fill' />}
                  </View>
                  <Text style={styles.pledgeText}>
                    I pledge that this stay is 100% cruelty-free, with a plant-based kitchen and
                    down-free bedding.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitHostBtn}
                  onPress={handleCreateHostListing}
                  testID='submit-host-listing-btn'
                >
                  <Text style={styles.submitHostBtnText}>Publish Verified Vegan Stay</Text>
                </TouchableOpacity>
              </ScrollView>
            </GlassCard>
          </View>
        </Modal>
      )}
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  verifiedBadgeText: {
    color: '#38EF7D',
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  hostHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38EF7D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  hostHeaderBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
  },

  typeScroll: {
    marginBottom: 8,
  },
  typeContent: {
    gap: 8,
    paddingRight: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeChipActive: {
    backgroundColor: '#38EF7D',
    borderColor: '#38EF7D',
  },
  typeChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  staysList: {
    gap: 14,
  },
  stayCard: {
    padding: 16,
    borderRadius: 18,
  },
  stayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stayEmojiBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayEmoji: {
    fontSize: 26,
  },
  stayTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  stayTypeText: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  flagText: {
    fontSize: 14,
  },
  locationText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stayTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  stayTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    padding: 8,
    gap: 8,
    marginBottom: 12,
  },
  impactBadgeText: {
    color: '#FF8787',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  stayCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  priceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  priceSubText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  osmTagText: {
    color: '#38EF7D',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  reserveBtn: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reserveBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },

  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 28,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalType: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 12,
  },
  hostCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  hostAvatar: {
    fontSize: 26,
  },
  hostName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  hostBio: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  modalSectionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  impactCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  impactText: {
    color: '#FF8787',
    fontSize: 12,
    fontWeight: '600',
  },
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  amenityChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  rulesWrap: {
    gap: 4,
    marginBottom: 14,
  },
  ruleText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    lineHeight: 16,
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  modalPrice: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  modalDates: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  modalBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38EF7D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  modalBookBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },

  // Booking Modal
  bookingModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  bookingModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  bookingModalSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dateChipActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.2)',
    borderColor: '#38EF7D',
  },
  dateChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  dateChipTextActive: {
    color: '#38EF7D',
    fontWeight: '700',
  },
  guestsCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  guestsCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  karmaDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#38EF7D',
    borderColor: '#38EF7D',
  },
  karmaDiscountTitle: {
    color: '#38EF7D',
    fontSize: 13,
    fontWeight: '700',
  },
  karmaDiscountSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  breakdownCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  breakdownVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  totalVal: {
    color: '#38EF7D',
    fontSize: 18,
    fontWeight: '800',
  },
  confirmBookingBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBookingBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },

  // Host modal
  hostModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  formLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
  },
  formTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pledgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  pledgeText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    lineHeight: 15,
  },
  submitHostBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitHostBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default VeganStaysScreen;
