import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Broadcast,
  HandWaving,
  ShieldCheck,
  EyeSlash,
  Eye,
  MapPin,
  Clock,
  Sparkle,
  ChatCircleDots,
  X,
  Buildings,
  CheckCircle,
  QrCode,
  Info,
} from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../contexts/ToastContext';
import type { CrossedPathEncounter } from '../../data/crossedPathsData';
import {
  CROSSED_PATHS_ENCOUNTERS,
  BEACON_SAFETY_RULES,
  DEFAULT_BEACON_SETTINGS,
} from '../../data/crossedPathsData';
import type { AppStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type FilterTab = 'all' | 'mutual' | 'frequent';

export const CrossedPathsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [settings, setSettings] = useState(DEFAULT_BEACON_SETTINGS);
  const [encounters, setEncounters] = useState<CrossedPathEncounter[]>(CROSSED_PATHS_ENCOUNTERS);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [hiddenEncounterIds, setHiddenEncounterIds] = useState<string[]>([]);

  // Modals
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [chatModalEncounter, setChatModalEncounter] = useState<CrossedPathEncounter | null>(null);

  // Filtered Encounters
  const visibleEncounters = useMemo(() => {
    return encounters.filter(enc => {
      if (hiddenEncounterIds.includes(enc.id)) return false;
      if (activeFilter === 'mutual') return enc.mutualWave;
      if (activeFilter === 'frequent') return enc.timesCrossedThisWeek >= 3;
      return true;
    });
  }, [encounters, hiddenEncounterIds, activeFilter]);

  const toggleGhostMode = () => {
    const nextState = !settings.isGhostMode;
    setSettings(prev => ({ ...prev, isGhostMode: nextState }));
    if (nextState) {
      showToast('👻 Ghost Mode Activated: You are invisible to nearby radars.', 'info');
    } else {
      showToast('🌱 Beacon Live: Broadcasting 350m fuzzed proximity.', 'success');
    }
  };

  const handleSendWave = (encounter: CrossedPathEncounter) => {
    if (encounter.hasWaved) {
      // Open mutual chat / wave message modal
      setChatModalEncounter(encounter);
      return;
    }

    setEncounters(prev =>
      prev.map(e =>
        e.id === encounter.id
          ? {
              ...e,
              hasWaved: true,
              mutualWave: true,
              waveMessage: 'Mutual Wave! You both said hello! 👋',
            }
          : e,
      ),
    );

    showToast(`👋 Kindred Wave sent to ${encounter.name}! +15 Karma for connecting.`, 'success');
  };

  const handleHideEncounter = (id: string, name: string) => {
    setHiddenEncounterIds(prev => [...prev, id]);
    showToast(`Hidden encounter with ${name}.`, 'info');
  };

  return (
    <View style={styles.container}>
      <SpaceBackground>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel='Go back'
          >
            <ArrowLeft size={22} color='#fff' />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <View style={styles.titleRow}>
              <Broadcast size={20} color='#38EF7D' weight='bold' />
              <Text style={styles.headerTitle}>Kindred Beacon</Text>
            </View>
            <Text style={styles.headerSubtitle}>Crossed paths & fuzzed proximity radar</Text>
          </View>
          <TouchableOpacity
            testID='toggle-ghost-mode-btn'
            style={[styles.ghostToggleBtn, settings.isGhostMode && styles.ghostToggleBtnActive]}
            onPress={toggleGhostMode}
          >
            {settings.isGhostMode ? (
              <EyeSlash size={16} color='#FF6B8B' weight='bold' />
            ) : (
              <Eye size={16} color='#38EF7D' weight='bold' />
            )}
            <Text
              style={[styles.ghostToggleText, settings.isGhostMode && styles.ghostToggleTextActive]}
            >
              {settings.isGhostMode ? 'Ghost: ON' : 'Radar: ON'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ghost Mode Alert Banner */}
        {settings.isGhostMode && (
          <View style={styles.ghostBanner}>
            <EyeSlash size={18} color='#FF6B8B' weight='bold' />
            <View style={styles.ghostBannerTextWrap}>
              <Text style={styles.ghostBannerTitle}>Ghost Mode Active</Text>
              <Text style={styles.ghostBannerSub}>
                Your device is not broadcasting. Tap toggle above to reappear.
              </Text>
            </View>
          </View>
        )}

        {/* Anti-Stalking Privacy Bar */}
        <TouchableOpacity
          testID='open-beacon-safety-btn'
          style={styles.safetyInfoBar}
          onPress={() => setSafetyModalVisible(true)}
        >
          <ShieldCheck size={16} color='#38EF7D' weight='fill' />
          <Text style={styles.safetyInfoText}>
            Anti-Stalking Shield: 350m geohash fuzzing · Zero continuous GPS
          </Text>
          <Info size={14} color='#8E8E93' />
        </TouchableOpacity>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            testID='filter-tab-all'
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}
            >
              All Crossed Paths ({visibleEncounters.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='filter-tab-mutual'
            style={[styles.filterChip, activeFilter === 'mutual' && styles.filterChipActive]}
            onPress={() => setActiveFilter('mutual')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'mutual' && styles.filterChipTextActive,
              ]}
            >
              Mutual Waves 👋
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='filter-tab-frequent'
            style={[styles.filterChip, activeFilter === 'frequent' && styles.filterChipActive]}
            onPress={() => setActiveFilter('frequent')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'frequent' && styles.filterChipTextActive,
              ]}
            >
              Frequent (3x+)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Encounters Timeline List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollListContent}
        >
          {visibleEncounters.map(encounter => (
            <GlassCard key={encounter.id} style={styles.encounterCard}>
              {/* Top Row: Avatar, Name, Time, Hide */}
              <View style={styles.encounterTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{encounter.avatarEmoji}</Text>
                </View>

                <View style={styles.encounterHeaderInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.encounterName}>{encounter.name}</Text>
                    <Text style={styles.pronounsText}>({encounter.pronouns})</Text>
                  </View>
                  <Text style={styles.encounterTitle}>{encounter.title}</Text>
                  <Text style={styles.encounterOrg}>{encounter.organization}</Text>
                </View>

                <TouchableOpacity
                  testID={`hide-encounter-${encounter.id}`}
                  style={styles.hideBtn}
                  onPress={() => handleHideEncounter(encounter.id, encounter.name)}
                >
                  <X size={16} color='#8E8E93' />
                </TouchableOpacity>
              </View>

              {/* Fuzzed Proximity & Frequency Badge */}
              <View style={styles.proximityBox}>
                <View style={styles.proximityRow}>
                  <MapPin size={13} color='#38EF7D' weight='fill' />
                  <Text style={styles.proximityLocation}>{encounter.fuzzedLocation}</Text>
                  <Text style={styles.proximityDot}>·</Text>
                  <Text style={styles.proximityDistance}>{encounter.distanceFuzzed}</Text>
                </View>
                <View style={styles.timeCrossedRow}>
                  <Clock size={12} color='#8E8E93' />
                  <Text style={styles.timeAgoText}>{encounter.timeAgo}</Text>
                  <Text style={styles.frequencyBadge}>
                    Crossed paths {encounter.timesCrossedThisWeek}x this week
                  </Text>
                </View>
              </View>

              {/* Mutual Tags */}
              <View style={styles.tagsRow}>
                {encounter.mutualInterests.map((interest, idx) => (
                  <View key={idx} style={styles.tagPill}>
                    <Text style={styles.tagPillText}>🌱 {interest}</Text>
                  </View>
                ))}
              </View>

              {/* Endorsed Sanctuary */}
              <View style={styles.sanctuaryPill}>
                <Text style={styles.sanctuaryPillText}>
                  Supports: {encounter.endorsedSanctuary}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  testID={`wave-btn-${encounter.id}`}
                  style={[
                    styles.waveBtn,
                    encounter.mutualWave
                      ? styles.waveBtnMutual
                      : encounter.hasWaved
                        ? styles.waveBtnSent
                        : null,
                  ]}
                  onPress={() => handleSendWave(encounter)}
                >
                  {encounter.mutualWave ? (
                    <ChatCircleDots size={16} color='#000' weight='bold' />
                  ) : (
                    <HandWaving
                      size={16}
                      color={encounter.hasWaved ? '#38EF7D' : '#000'}
                      weight='bold'
                    />
                  )}
                  <Text
                    style={[
                      styles.waveBtnText,
                      encounter.mutualWave
                        ? styles.waveBtnTextMutual
                        : encounter.hasWaved
                          ? styles.waveBtnTextSent
                          : null,
                    ]}
                  >
                    {encounter.mutualWave
                      ? 'Mutual Wave! Chat'
                      : encounter.hasWaved
                        ? 'Waved 👋'
                        : 'Send Kindred Wave 👋'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID={`card-btn-${encounter.id}`}
                  style={styles.cardProfileBtn}
                  onPress={() =>
                    navigation.navigate('EthicalCard', {
                      username: encounter.ethicalCardUsername,
                    })
                  }
                >
                  <QrCode size={16} color='#fff' />
                  <Text style={styles.cardProfileBtnText}>View Card</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}

          {visibleEncounters.length === 0 && (
            <View style={styles.emptyContainer}>
              <Broadcast size={48} color='#666' />
              <Text style={styles.emptyTitle}>No Crossed Paths Found</Text>
              <Text style={styles.emptySub}>
                Take a stroll near plant-based cafes, sanctuaries, or climate hubs to discover
                conscious neighbors nearby!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Safety Guidelines Modal */}
        <Modal
          visible={safetyModalVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setSafetyModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <ShieldCheck size={22} color='#38EF7D' weight='fill' />
                  <Text style={styles.modalTitle}>Anti-Stalking Privacy Shield</Text>
                </View>
                <TouchableOpacity
                  testID='close-safety-modal-btn'
                  onPress={() => setSafetyModalVisible(false)}
                >
                  <X size={20} color='#8E8E93' />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
                {BEACON_SAFETY_RULES.map((rule, idx) => (
                  <View key={idx} style={styles.safetyRuleItem}>
                    <CheckCircle size={16} color='#38EF7D' weight='fill' />
                    <View style={styles.safetyRuleContent}>
                      <Text style={styles.safetyRuleTitle}>{rule.title}</Text>
                      <Text style={styles.safetyRuleDesc}>{rule.desc}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSafetyModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>I Understand My Privacy is Protected</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Mutual Wave Chat Modal */}
        <Modal
          visible={!!chatModalEncounter}
          transparent
          animationType='fade'
          onRequestClose={() => setChatModalEncounter(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.chatModalCard}>
              <View style={styles.chatModalEmoji}>
                <Text style={{ fontSize: 36 }}>{chatModalEncounter?.avatarEmoji || '👋'}</Text>
              </View>
              <Text style={styles.chatModalTitle}>
                Mutual Wave with {chatModalEncounter?.name}!
              </Text>
              <Text style={styles.chatModalSub}>
                You both waved at each other! Icebreaker prompt:
              </Text>

              <View style={styles.icebreakerBox}>
                <Sparkle size={16} color='#38EF7D' weight='fill' />
                <Text style={styles.icebreakerText}>
                  "What’s your favorite plant-based dish near {chatModalEncounter?.fuzzedLocation}?"
                </Text>
              </View>

              <View style={styles.chatModalBtnRow}>
                <TouchableOpacity
                  style={styles.chatModalPrimaryBtn}
                  onPress={() => {
                    showToast(`Opened connection with ${chatModalEncounter?.name}!`, 'success');
                    setChatModalEncounter(null);
                  }}
                >
                  <ChatCircleDots size={16} color='#000' weight='bold' />
                  <Text style={styles.chatModalPrimaryBtnText}>Start Conscious Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='close-chat-modal-btn'
                  style={styles.chatModalSecondaryBtn}
                  onPress={() => setChatModalEncounter(null)}
                >
                  <Text style={styles.chatModalSecondaryBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </SpaceBackground>
    </View>
  );
};

export default CrossedPathsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  ghostToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.3)',
  },
  ghostToggleBtnActive: {
    backgroundColor: 'rgba(255, 107, 139, 0.15)',
    borderColor: 'rgba(255, 107, 139, 0.3)',
  },
  ghostToggleText: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
  },
  ghostToggleTextActive: {
    color: '#FF6B8B',
  },
  ghostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 139, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 139, 0.3)',
  },
  ghostBannerTextWrap: {
    flex: 1,
  },
  ghostBannerTitle: {
    color: '#FF6B8B',
    fontSize: 12,
    fontWeight: '800',
  },
  ghostBannerSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 1,
  },
  safetyInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  safetyInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#8E8E93',
    marginHorizontal: 8,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.18)',
    borderColor: '#38EF7D',
  },
  filterChipText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  encounterCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
  },
  encounterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  encounterHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  encounterName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  pronounsText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  encounterTitle: {
    fontSize: 13,
    color: '#38EF7D',
    fontWeight: '600',
    marginTop: 1,
  },
  encounterOrg: {
    fontSize: 11,
    color: '#8E8E93',
  },
  hideBtn: {
    padding: 6,
  },
  proximityBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  proximityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  proximityLocation: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  proximityDot: {
    color: '#666',
    fontSize: 11,
  },
  proximityDistance: {
    fontSize: 11,
    color: '#38EF7D',
    fontWeight: '600',
  },
  timeCrossedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeAgoText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  frequencyBadge: {
    fontSize: 10,
    color: '#FF6B8B',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 107, 139, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagPillText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  sanctuaryPill: {
    marginBottom: 12,
  },
  sanctuaryPillText: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38EF7D',
    paddingVertical: 10,
    borderRadius: 12,
  },
  waveBtnSent: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderWidth: 1,
    borderColor: '#38EF7D',
  },
  waveBtnMutual: {
    backgroundColor: '#38EF7D',
  },
  waveBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  waveBtnTextSent: {
    color: '#38EF7D',
  },
  waveBtnTextMutual: {
    color: '#000',
  },
  cardProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  cardProfileBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  modalBody: {
    marginBottom: 16,
  },
  safetyRuleItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  safetyRuleContent: {
    flex: 1,
  },
  safetyRuleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  safetyRuleDesc: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  modalCloseBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  chatModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  chatModalEmoji: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  chatModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  chatModalSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 14,
  },
  icebreakerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  icebreakerText: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  chatModalBtnRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  chatModalPrimaryBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
  },
  chatModalPrimaryBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  chatModalSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  chatModalSecondaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
