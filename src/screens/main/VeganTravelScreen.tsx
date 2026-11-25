import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Share,
  Platform,
} from 'react-native';
import {
  MagnifyingGlass,
  X,
  Translate,
  WarningCircle,
  CheckCircle,
  ShareNetwork,
  CaretRight,
  GlobeHemisphereWest,
  ForkKnife,
  ChatText,
  Lightbulb,
  Play,
  VideoCamera,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { SubScreenHeader } from '../../components/common/SubScreenHeader';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import type { CountryVeganGuide } from '../../data/countryVeganData';
import { COUNTRY_VEGAN_GUIDES } from '../../data/countryVeganData';
import { useToast } from '../../contexts/ToastContext';
import HapticFeedbackService from '../../services/HapticFeedbackService';
import { spatialColors, animations } from '../../theme/theme';

const REGIONS = ['All', 'Asia', 'Europe', 'Americas'] as const;
type RegionFilter = (typeof REGIONS)[number];

const DIFFICULTY_COLORS: Record<CountryVeganGuide['difficulty'], string> = {
  Easy: '#38EF7D',
  Moderate: '#F2C94C',
  Challenging: '#FF6B6B',
};

export const VeganTravelScreen = () => {
  const navigation = useNavigation<any>();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('All');
  const [activeCountry, setActiveCountry] = useState<CountryVeganGuide | null>(null);
  const [countryTab, setCountryTab] = useState<'safe' | 'traps' | 'phrases' | 'vlogs'>('safe');
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [selectedVlog, setSelectedVlog] = useState<any>(null);

  // Filtered country list
  const filteredCountries = useMemo(() => {
    return COUNTRY_VEGAN_GUIDES.filter(country => {
      const matchesRegion = selectedRegion === 'All' || country.region === selectedRegion;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesRegion;

      const matchesName = country.name.toLowerCase().includes(query);
      const matchesDish = country.accidentallyVegan.some(
        d => d.name.toLowerCase().includes(query) || d.nativeName.toLowerCase().includes(query),
      );
      const matchesTrap = country.traps.some(
        t => t.name.toLowerCase().includes(query) || t.nativeName.toLowerCase().includes(query),
      );

      return matchesRegion && (matchesName || matchesDish || matchesTrap);
    });
  }, [searchQuery, selectedRegion]);

  const handleSelectCountry = (country: CountryVeganGuide) => {
    HapticFeedbackService.triggerSelection();
    setActiveCountry(country);
    setCountryTab('safe');
  };

  const handleBackToList = () => {
    HapticFeedbackService.triggerSelection();
    setActiveCountry(null);
  };

  const handleOpenFlashcard = () => {
    HapticFeedbackService.triggerSuccess();
    setIsFlashcardOpen(true);
  };

  const handleShareFlashcard = async () => {
    if (!activeCountry) return;
    try {
      HapticFeedbackService.triggerSelection();
      await Share.share({
        title: `Vegan Dining Card — ${activeCountry.name}`,
        message: `🌱 ${activeCountry.name} Vegan Waiter Card:\n\n"${activeCountry.flashcard.nativeScript}"\n\nPhonetic: ${activeCountry.flashcard.phonetic}\n\nTranslation: ${activeCountry.flashcard.translation}\n\n— Generated via Kindred Earth`,
      });
    } catch {
      showToast('Could not open share menu', 'error');
    }
  };

  return (
    <SpaceBackground earthPosition='top-right' enableComets={false}>
      <SubScreenHeader
        title={activeCountry ? activeCountry.name : 'Vegan World Travel'}
        subtitle={
          activeCountry
            ? `${activeCountry.flag} Survival Guide & Dining Card`
            : 'Country survival guides & offline waiter flashcards'
        }
        onBackPress={activeCountry ? handleBackToList : undefined}
      />

      {activeCountry ? (
        // ─── COUNTRY DETAIL VIEW ───────────────────────────────────────────
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailScrollContent}
        >
          {/* Hero Summary Card */}
          <GlassCard style={styles.countryHeroCard}>
            <View style={styles.countryHeroHeader}>
              <Text style={styles.countryFlagLarge}>{activeCountry.flag}</Text>
              <View style={styles.countryHeroMeta}>
                <View style={styles.heroRow}>
                  <Text style={styles.countryTitleLarge}>{activeCountry.name}</Text>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { borderColor: DIFFICULTY_COLORS[activeCountry.difficulty] },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: DIFFICULTY_COLORS[activeCountry.difficulty] },
                      ]}
                    >
                      {activeCountry.difficulty}
                    </Text>
                  </View>
                </View>
                <Text style={styles.countryRegionText}>Region: {activeCountry.region}</Text>
              </View>
            </View>

            <Text style={styles.countrySummaryText}>{activeCountry.summary}</Text>

            {/* Quick Flashcard CTA */}
            <TouchableOpacity
              style={styles.flashcardCtaButton}
              onPress={handleOpenFlashcard}
              activeOpacity={0.8}
            >
              <Translate size={22} color='#0D1117' weight='bold' />
              <View style={styles.flashcardCtaTextWrap}>
                <Text style={styles.flashcardCtaTitle}>Show Dining Card to Waiter</Text>
                <Text style={styles.flashcardCtaSub}>
                  High-contrast card in {activeCountry.name} script
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>

          {/* Sub-Tabs (Safe Dishes, Traps, Phrases) */}
          <View style={styles.subTabBar}>
            <TouchableOpacity
              style={[styles.subTabButton, countryTab === 'safe' && styles.subTabButtonActive]}
              onPress={() => {
                HapticFeedbackService.triggerSelection();
                setCountryTab('safe');
              }}
            >
              <CheckCircle
                size={16}
                color={countryTab === 'safe' ? '#38EF7D' : 'rgba(255,255,255,0.5)'}
                weight={countryTab === 'safe' ? 'fill' : 'regular'}
              />
              <Text style={[styles.subTabText, countryTab === 'safe' && styles.subTabTextActive]}>
                Safe Dishes ({activeCountry.accidentallyVegan.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabButton, countryTab === 'traps' && styles.subTabButtonActive]}
              onPress={() => {
                HapticFeedbackService.triggerSelection();
                setCountryTab('traps');
              }}
            >
              <WarningCircle
                size={16}
                color={countryTab === 'traps' ? '#FF6B6B' : 'rgba(255,255,255,0.5)'}
                weight={countryTab === 'traps' ? 'fill' : 'regular'}
              />
              <Text style={[styles.subTabText, countryTab === 'traps' && styles.subTabTextActive]}>
                Traps ({activeCountry.traps.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabButton, countryTab === 'phrases' && styles.subTabButtonActive]}
              onPress={() => {
                HapticFeedbackService.triggerSelection();
                setCountryTab('phrases');
              }}
              testID='tab-phrases'
            >
              <ChatText
                size={16}
                color={countryTab === 'phrases' ? '#58A6FF' : 'rgba(255,255,255,0.5)'}
                weight={countryTab === 'phrases' ? 'fill' : 'regular'}
              />
              <Text
                style={[styles.subTabText, countryTab === 'phrases' && styles.subTabTextActive]}
              >
                Phrases
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabButton, countryTab === 'vlogs' && styles.subTabButtonActive]}
              onPress={() => {
                HapticFeedbackService.triggerSelection();
                setCountryTab('vlogs');
              }}
              testID='tab-vlogs'
            >
              <VideoCamera
                size={16}
                color={countryTab === 'vlogs' ? '#FF2D55' : 'rgba(255,255,255,0.5)'}
                weight={countryTab === 'vlogs' ? 'fill' : 'regular'}
              />
              <Text style={[styles.subTabText, countryTab === 'vlogs' && styles.subTabTextActive]}>
                Vlogs ({activeCountry.vlogs?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Safe Dishes */}
          {countryTab === 'safe' && (
            <View style={styles.sectionWrap}>
              {activeCountry.accidentallyVegan.map((dish, idx) => (
                <GlassCard key={idx} style={styles.dishCard}>
                  <View style={styles.dishHeader}>
                    <Text style={styles.dishName}>{dish.name}</Text>
                    <Text style={styles.dishNativeName}>{dish.nativeName}</Text>
                  </View>
                  <Text style={styles.dishDesc}>{dish.description}</Text>
                </GlassCard>
              ))}
            </View>
          )}

          {/* Tab 2: Trap Ingredients */}
          {countryTab === 'traps' && (
            <View style={styles.sectionWrap}>
              <View style={styles.warningAlertBox}>
                <WarningCircle size={20} color='#FF6B6B' weight='fill' />
                <Text style={styles.warningAlertText}>
                  Always verify these hidden ingredients even when dishes are labeled vegetarian.
                </Text>
              </View>

              {activeCountry.traps.map((trap, idx) => (
                <GlassCard key={idx} style={[styles.dishCard, styles.trapCardBorder]}>
                  <View style={styles.dishHeader}>
                    <Text style={[styles.dishName, { color: '#FF7B72' }]}>{trap.name}</Text>
                    <Text style={styles.dishNativeName}>{trap.nativeName}</Text>
                  </View>
                  <Text style={styles.trapRiskText}>{trap.risk}</Text>
                </GlassCard>
              ))}
            </View>
          )}

          {/* Tab 3: Phrases & Convenience Hacks */}
          {countryTab === 'phrases' && (
            <View style={styles.sectionWrap}>
              <Text style={styles.groupHeading}>Essential Dining Phrases</Text>
              {activeCountry.staplePhrases.map((phrase, idx) => (
                <GlassCard key={idx} style={styles.phraseCard}>
                  <Text style={styles.phraseMeaning}>{phrase.meaning}</Text>
                  <Text style={styles.phraseNative}>{phrase.native}</Text>
                  <Text style={styles.phrasePhonetic}>"{phrase.phonetic}"</Text>
                </GlassCard>
              ))}

              <Text style={[styles.groupHeading, { marginTop: 24 }]}>
                Convenience & Survival Hacks
              </Text>
              {activeCountry.convenienceHacks.map((hack, idx) => (
                <GlassCard key={idx} style={styles.hackCard}>
                  <Lightbulb size={18} color='#F2C94C' weight='fill' style={styles.hackIcon} />
                  <Text style={styles.hackText}>{hack}</Text>
                </GlassCard>
              ))}
            </View>
          )}

          {/* Tab 4: Food Vlogs & Creator Reels */}
          {countryTab === 'vlogs' && (
            <View style={styles.sectionWrap}>
              <Text style={styles.groupHeading}>Local Street Food Vlogs & Hacks</Text>
              {(activeCountry.vlogs || []).map((vlog, idx) => (
                <TouchableOpacity
                  key={vlog.id || idx}
                  activeOpacity={0.85}
                  onPress={() => setSelectedVlog(vlog)}
                  testID={`vlog-card-${vlog.id}`}
                >
                  <GlassCard style={styles.vlogCard}>
                    <View style={styles.vlogHeader}>
                      <View style={styles.vlogThumbBox}>
                        <Text style={styles.vlogThumbEmoji}>{vlog.thumbnailEmoji || '🎥'}</Text>
                        <View style={styles.vlogDurationBadge}>
                          <Text style={styles.vlogDurationText}>{vlog.duration}</Text>
                        </View>
                      </View>
                      <View style={styles.vlogMainInfo}>
                        <Text style={styles.vlogTitle} numberOfLines={2}>
                          {vlog.title}
                        </Text>
                        <Text style={styles.vlogCreator}>By {vlog.creator}</Text>
                        <Text style={styles.vlogViews}>👁️ {vlog.viewsCount}</Text>
                      </View>
                    </View>
                    <View style={styles.vlogTakeawayBox}>
                      <Text style={styles.vlogTakeawayLabel}>💡 Local Hack:</Text>
                      <Text style={styles.vlogTakeawayText}>{vlog.keyTakeaway}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ─── VEGAN STAYS & SANCTUARY HOMESTAY CTA ───────────────────────── */}
          <TouchableOpacity
            style={styles.veganStaysCta}
            onPress={() => navigation.navigate('VeganStays' as any)}
            activeOpacity={0.85}
            testID='open-vegan-stays-btn'
          >
            <GlassCard style={styles.veganStaysCtaCard}>
              <View style={styles.veganStaysLeft}>
                <Text style={styles.veganStaysEmoji}>🏡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.veganStaysTitle}>
                    Vegan Stays & Homestays in {activeCountry.name}
                  </Text>
                  <Text style={styles.veganStaysSub}>
                    Book 100% plant-based sanctuary cottages & eco-hosts →
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // ─── COUNTRY LIST VIEW ─────────────────────────────────────────────
        <View style={styles.listContainer}>
          {/* Search Bar */}
          <GlassCard style={styles.searchWrap}>
            <MagnifyingGlass size={18} color='rgba(255,255,255,0.4)' weight='bold' />
            <TextInput
              style={styles.searchInput}
              placeholder='Search destination, dish, or trap (e.g. Japan, Dashi)'
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize='none'
              autoCorrect={false}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color='rgba(255,255,255,0.5)' />
              </TouchableOpacity>
            )}
          </GlassCard>

          {/* Region Filter Chips */}
          <View style={styles.regionChipBar}>
            {REGIONS.map(region => (
              <TouchableOpacity
                key={region}
                style={[styles.regionChip, selectedRegion === region && styles.regionChipActive]}
                onPress={() => {
                  HapticFeedbackService.triggerSelection();
                  setSelectedRegion(region);
                }}
              >
                <Text
                  style={[
                    styles.regionChipText,
                    selectedRegion === region && styles.regionChipTextActive,
                  ]}
                >
                  {region}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Country Cards */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.countryListContent}
          >
            {filteredCountries.map(country => (
              <TouchableOpacity
                key={country.id}
                onPress={() => handleSelectCountry(country)}
                activeOpacity={0.7}
              >
                <GlassCard style={styles.countryRowCard}>
                  <Text style={styles.countryRowFlag}>{country.flag}</Text>
                  <View style={styles.countryRowInfo}>
                    <View style={styles.countryRowTop}>
                      <Text style={styles.countryRowName}>{country.name}</Text>
                      <View
                        style={[
                          styles.difficultyPill,
                          { borderColor: DIFFICULTY_COLORS[country.difficulty] },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyPillText,
                            { color: DIFFICULTY_COLORS[country.difficulty] },
                          ]}
                        >
                          {country.difficulty}
                        </Text>
                      </View>
                    </View>
                    <Text numberOfLines={2} style={styles.countryRowSummary}>
                      {country.summary}
                    </Text>
                    <View style={styles.countryRowBottom}>
                      <Text style={styles.dishCountBadge}>
                        🌱 {country.accidentallyVegan.length} Safe Dishes
                      </Text>
                      <Text style={styles.trapCountBadge}>⚠️ {country.traps.length} Traps</Text>
                    </View>
                  </View>
                  <CaretRight size={20} color='rgba(255,255,255,0.3)' weight='bold' />
                </GlassCard>
              </TouchableOpacity>
            ))}

            {filteredCountries.length === 0 && (
              <View style={styles.emptyState}>
                <GlobeHemisphereWest size={48} color='rgba(255,255,255,0.2)' weight='duotone' />
                <Text style={styles.emptyTitle}>No Destinations Found</Text>
                <Text style={styles.emptyDesc}>
                  Try clearing your search query or choosing another region.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ─── FULL-SCREEN WAITER DINING FLASHCARD MODAL ─────────────────────── */}
      <Modal
        visible={isFlashcardOpen}
        animationType='fade'
        transparent={true}
        onRequestClose={() => setIsFlashcardOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalFlag}>{activeCountry?.flag}</Text>
                <View>
                  <Text style={styles.modalTitle}>{activeCountry?.name} Dining Card</Text>
                  <Text style={styles.modalSub}>Hold up screen to show waiter or chef</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsFlashcardOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color='#FFFFFF' />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBodyScroll}
            >
              {/* High Contrast Local Script Card */}
              <View style={styles.highContrastPaper}>
                <Text style={styles.shortStatement}>{activeCountry?.flashcard.shortStatement}</Text>
                <Text style={styles.nativeScriptText}>{activeCountry?.flashcard.nativeScript}</Text>
              </View>

              {/* Phonetics */}
              <View style={styles.phoneticContainer}>
                <Text style={styles.phoneticLabel}>Pronunciation (How to say it):</Text>
                <Text style={styles.phoneticBody}>"{activeCountry?.flashcard.phonetic}"</Text>
              </View>

              {/* English Translation */}
              <View style={styles.translationContainer}>
                <Text style={styles.translationLabel}>English Translation:</Text>
                <Text style={styles.translationBody}>{activeCountry?.flashcard.translation}</Text>
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalShareButton}
                onPress={handleShareFlashcard}
                activeOpacity={0.8}
              >
                <ShareNetwork size={18} color='#FFFFFF' weight='bold' />
                <Text style={styles.modalShareButtonText}>Share Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => setIsFlashcardOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── LOCAL VLOG REEL MODAL ─────────────────────────────────────────── */}
      {selectedVlog && (
        <Modal
          visible={!!selectedVlog}
          animationType='slide'
          transparent={true}
          onRequestClose={() => setSelectedVlog(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.vlogModalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Text style={styles.modalFlag}>{selectedVlog.thumbnailEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {selectedVlog.title}
                    </Text>
                    <Text style={styles.modalSub}>
                      {selectedVlog.creator} • {selectedVlog.duration}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedVlog(null)}
                  style={styles.modalCloseBtn}
                  testID='close-vlog-modal-btn'
                >
                  <X size={20} color='#FFFFFF' />
                </TouchableOpacity>
              </View>

              <View style={styles.vlogModalBody}>
                {/* Simulated open stream player container */}
                <View style={styles.vlogVideoPlaceholder}>
                  <Text style={styles.vlogPlayIcon}>▶️</Text>
                  <Text style={styles.vlogPlayerText}>
                    Streaming via Open Piped / Invidious API
                  </Text>
                  <Text style={styles.vlogPlayerSubText}>
                    {selectedVlog.viewsCount} • 1080p Ad-Free
                  </Text>
                </View>

                <View style={styles.vlogTipCard}>
                  <Text style={styles.vlogTipTitle}>💡 Secret Street Food Hack:</Text>
                  <Text style={styles.vlogTipBody}>{selectedVlog.keyTakeaway}</Text>
                </View>

                <TouchableOpacity
                  style={styles.vlogKarmaBtn}
                  onPress={() => {
                    showToast(
                      '🎉 +15 Kindred Travel Karma earned for learning local dining!',
                      'success',
                    );
                    setSelectedVlog(null);
                  }}
                  testID='complete-vlog-karma-btn'
                >
                  <Text style={styles.vlogKarmaBtnText}>Mark as Watched (+15 Karma)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  regionChipBar: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  regionChipActive: {
    backgroundColor: '#38EF7D',
    borderColor: '#38EF7D',
  },
  regionChipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  regionChipTextActive: {
    color: '#0D1117',
    fontWeight: '700',
  },
  countryListContent: {
    paddingBottom: 40,
    gap: 12,
  },
  countryRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  countryRowFlag: {
    fontSize: 34,
    marginRight: 14,
  },
  countryRowInfo: {
    flex: 1,
    marginRight: 8,
  },
  countryRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  countryRowName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  difficultyPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  difficultyPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  countryRowSummary: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 16,
    marginBottom: 8,
  },
  countryRowBottom: {
    flexDirection: 'row',
    gap: 12,
  },
  dishCountBadge: {
    fontSize: 11,
    color: '#38EF7D',
    fontWeight: '500',
  },
  trapCountBadge: {
    fontSize: 11,
    color: '#FF7B72',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  emptyDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },

  // ─── Detail Styles ───────────────────────────────────────────────────────
  detailScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  countryHeroCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  countryHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countryFlagLarge: {
    fontSize: 44,
    marginRight: 14,
  },
  countryHeroMeta: {
    flex: 1,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryTitleLarge: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countryRegionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  countrySummaryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 19,
    marginBottom: 16,
  },
  flashcardCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38EF7D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 12,
  },
  flashcardCtaTextWrap: {
    flex: 1,
  },
  flashcardCtaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D1117',
  },
  flashcardCtaSub: {
    fontSize: 11,
    color: 'rgba(13, 17, 23, 0.7)',
    fontWeight: '500',
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  subTabButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  subTabText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionWrap: {
    gap: 12,
  },
  dishCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  trapCardBorder: {
    borderColor: 'rgba(255,107,107,0.3)',
  },
  dishHeader: {
    marginBottom: 6,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38EF7D',
  },
  dishNativeName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginTop: 2,
  },
  dishDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderColor: 'rgba(255,107,107,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 4,
  },
  warningAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#FFB4AB',
    lineHeight: 16,
    fontWeight: '500',
  },
  trapRiskText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  groupHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  phraseCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  phraseMeaning: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  phraseNative: {
    fontSize: 17,
    fontWeight: '700',
    color: '#58A6FF',
    marginVertical: 4,
  },
  phrasePhonetic: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  hackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  hackIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  hackText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },

  // ─── Modal Styles ────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCardContainer: {
    backgroundColor: '#161B22',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalFlag: {
    fontSize: 30,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalBodyScroll: {
    padding: 20,
    gap: 16,
  },
  highContrastPaper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  shortStatement: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  nativeScriptText: {
    fontSize: 17,
    color: '#1F2937',
    lineHeight: 26,
    fontWeight: '500',
  },
  phoneticContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
  },
  phoneticLabel: {
    fontSize: 11,
    color: '#58A6FF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  phoneticBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  translationContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
  },
  translationLabel: {
    fontSize: 11,
    color: '#38EF7D',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  translationBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  modalShareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  modalShareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalDoneButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38EF7D',
    borderRadius: 12,
    paddingVertical: 12,
  },
  modalDoneButtonText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '700',
  },

  // Vlog cards
  vlogCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  vlogHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  vlogThumbBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 45, 85, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vlogThumbEmoji: {
    fontSize: 28,
  },
  vlogDurationBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  vlogDurationText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  vlogMainInfo: {
    flex: 1,
  },
  vlogTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  vlogCreator: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  vlogViews: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 2,
  },
  vlogTakeawayBox: {
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#38EF7D',
    borderRadius: 8,
    padding: 8,
  },
  vlogTakeawayLabel: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  vlogTakeawayText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    lineHeight: 15,
  },

  // Vegan Stays CTA
  veganStaysCta: {
    marginTop: 20,
    marginBottom: 24,
  },
  veganStaysCtaCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.35)',
  },
  veganStaysLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  veganStaysEmoji: {
    fontSize: 28,
  },
  veganStaysTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  veganStaysSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 2,
  },

  // Vlog Modal
  vlogModalCard: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  vlogModalBody: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  vlogVideoPlaceholder: {
    height: 180,
    backgroundColor: '#0D1117',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
  },
  vlogPlayIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  vlogPlayerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  vlogPlayerSubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
  },
  vlogTipCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  vlogTipTitle: {
    color: '#38EF7D',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  vlogTipBody: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 18,
  },
  vlogKarmaBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  vlogKarmaBtnText: {
    color: '#0D1117',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default VeganTravelScreen;
