import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Share,
  TextInput,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  Users,
  Calendar,
  ShieldCheck,
  Flag,
  ShareNetwork,
  Sparkle,
  X,
  ChatCircleDots,
  MapPin,
  CheckCircle,
  Eye,
  EyeSlash,
} from 'phosphor-react-native';
import { useToast } from '../../contexts/ToastContext';
import type { VeganProfile, VeganMeetup } from '../../data/veganMeetData';
import {
  VEGAN_PROFILES,
  VEGAN_MEETUPS,
  COMMUNITY_SAFETY_GUIDELINES,
} from '../../data/veganMeetData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'VeganMeet'>;

const FILTER_TAGS = ['All', 'Sanctuary', 'Cooking', 'Active', 'Baking', 'Zero Waste'] as const;

export default function VeganMeetScreen({ navigation }: Props) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'dating' | 'friends' | 'meetups'>('dating');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGhostMode, setIsGhostMode] = useState(false);

  // Profiles state (allows blocking / passing)
  const [profiles, setProfiles] = useState<VeganProfile[]>(VEGAN_PROFILES);
  const [blockedProfileIds, setBlockedProfileIds] = useState<string[]>([]);

  // Meetups state (allows dynamic RSVP)
  const [meetups, setMeetups] = useState<VeganMeetup[]>(VEGAN_MEETUPS);

  // Modals
  const [safetyModalVisible, setSafetyModalVisible] = useState(false);
  const [reportingProfile, setReportingProfile] = useState<VeganProfile | null>(null);
  const [selectedReportReason, setSelectedReportReason] = useState<string>('Harassment');
  const [matchModalProfile, setMatchModalProfile] = useState<VeganProfile | null>(null);

  // Filtered profiles
  const visibleProfiles = useMemo(() => {
    return profiles.filter(p => {
      if (blockedProfileIds.includes(p.id)) return false;

      // Mode filter
      if (activeTab === 'dating' && p.mode === 'friends') return false;
      if (activeTab === 'friends' && p.mode === 'dating') return false;

      // Tag filter
      if (selectedTag !== 'All') {
        const matchesTag = p.interests.some(i =>
          i.toLowerCase().includes(selectedTag.toLowerCase()),
        );
        if (!matchesTag) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBio = p.bio.toLowerCase().includes(q);
        const matchesCity = p.city.toLowerCase().includes(q);
        const matchesInterests = p.interests.some(i => i.toLowerCase().includes(q));
        if (!matchesName && !matchesBio && !matchesCity && !matchesInterests) return false;
      }

      return true;
    });
  }, [profiles, blockedProfileIds, activeTab, selectedTag, searchQuery]);

  // Actions
  const handleLikeProfile = (profile: VeganProfile) => {
    // 50% chance of an immediate mutual match simulation for delightful feedback
    if (profile.id === 'profile-1' || profile.id === 'profile-2') {
      setMatchModalProfile(profile);
    } else {
      showToast(`💖 Sent a connection wave to ${profile.name}!`, 'success');
    }
  };

  const handlePassProfile = (profileId: string) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    showToast('Profile passed.', 'info');
  };

  const handleSayHi = (profile: VeganProfile) => {
    Alert.prompt
      ? Alert.prompt(
          `Message ${profile.name}`,
          `Send a kind vegan icebreaker:`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send',
              onPress: text => {
                showToast(`💬 Message sent to ${profile.name}!`, 'success');
              },
            },
          ],
          'plain-text',
          `Hi ${profile.name}! Loved your icebreaker on ${profile.icebreaker.question}`,
        )
      : Alert.alert(
          `Message ${profile.name}`,
          `Send a greeting inspired by their favorite spot: "${profile.favoriteSpot}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send Icebreaker',
              onPress: () => showToast(`💬 Icebreaker sent to ${profile.name}!`, 'success'),
            },
          ],
        );
  };

  const handleConfirmReport = () => {
    if (!reportingProfile) return;
    const profileId = reportingProfile.id;
    const profileName = reportingProfile.name;

    setBlockedProfileIds(prev => [...prev, profileId]);
    setReportingProfile(null);
    showToast(`🛡️ ${profileName} has been reported and blocked.`, 'success');
  };

  const handleToggleRsvp = (meetupId: string) => {
    let toastMessage = '';
    let toastType: 'success' | 'info' = 'info';

    setMeetups(prev =>
      prev.map(m => {
        if (m.id === meetupId) {
          const wasJoined = m.isJoined;
          const nextJoined = !wasJoined;
          const nextCount = nextJoined ? m.attendeesCount + 1 : m.attendeesCount - 1;

          toastMessage = nextJoined ? `🎉 You're attending ${m.title}!` : `Left ${m.title}.`;
          toastType = nextJoined ? 'success' : 'info';

          return {
            ...m,
            isJoined: nextJoined,
            attendeesCount: Math.min(m.maxSpots, Math.max(0, nextCount)),
          };
        }
        return m;
      }),
    );

    if (toastMessage) {
      showToast(toastMessage, toastType);
    }
  };

  const handleShareMeetup = async (meetup: VeganMeetup) => {
    try {
      await Share.share({
        message: `Join me at "${meetup.title}" on ${meetup.date} at ${meetup.locationName}! 🐾 RSVP on @KindredApp: https://kindred.earth/meetup/${meetup.id}`,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          testID='back-btn'
        >
          <ArrowLeft size={24} color='#fff' />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Vegan Connect</Text>
          <Text style={styles.headerSubtitle}>Cruelty-Free Dating & Community</Text>
        </View>
        <TouchableOpacity
          onPress={() => setSafetyModalVisible(true)}
          style={styles.safetyBtn}
          testID='safety-shield-btn'
        >
          <ShieldCheck size={24} color='#38EF7D' weight='fill' />
        </TouchableOpacity>
      </View>

      {/* Mode Segmented Controls */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'dating' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('dating')}
        >
          <Heart
            size={16}
            color={activeTab === 'dating' ? '#000' : '#8E8E93'}
            weight={activeTab === 'dating' ? 'fill' : 'regular'}
          />
          <Text style={[styles.segmentText, activeTab === 'dating' && styles.segmentTextActive]}>
            Dating
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'friends' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Users
            size={16}
            color={activeTab === 'friends' ? '#000' : '#8E8E93'}
            weight={activeTab === 'friends' ? 'fill' : 'regular'}
          />
          <Text style={[styles.segmentText, activeTab === 'friends' && styles.segmentTextActive]}>
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'meetups' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('meetups')}
        >
          <Calendar
            size={16}
            color={activeTab === 'meetups' ? '#000' : '#8E8E93'}
            weight={activeTab === 'meetups' ? 'fill' : 'regular'}
          />
          <Text style={[styles.segmentText, activeTab === 'meetups' && styles.segmentTextActive]}>
            Meetups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Radar & Privacy Status Bar */}
        <View style={styles.radarBar}>
          <View style={styles.radarLeft}>
            <View style={[styles.pulseDot, isGhostMode && styles.pulseDotOff]} />
            <Text style={styles.radarText}>
              {isGhostMode
                ? 'Ghost Mode Active (Hidden from Radar)'
                : 'Proximity Radar Active (~5 km)'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.ghostToggle}
            onPress={() => {
              setIsGhostMode(prev => !prev);
              showToast(
                isGhostMode
                  ? 'You are visible on community radar.'
                  : 'Ghost mode enabled. You are hidden.',
                'info',
              );
            }}
          >
            {isGhostMode ? (
              <EyeSlash size={16} color='#8E8E93' />
            ) : (
              <Eye size={16} color='#38EF7D' />
            )}
            <Text style={styles.ghostText}>{isGhostMode ? 'Unhide' : 'Incognito'}</Text>
          </TouchableOpacity>
        </View>

        {/* Content based on tab */}
        {activeTab !== 'meetups' ? (
          <View>
            {/* Filter Tags */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsScroll}
              contentContainerStyle={styles.tagsContent}
            >
              {FILTER_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagText, selectedTag === tag && styles.tagTextActive]}>
                    {tag === 'All' ? '🌱 All Passions' : tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Profiles Feed */}
            {visibleProfiles.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🍃</Text>
                <Text style={styles.emptyTitle}>No More Profiles Nearby</Text>
                <Text style={styles.emptySub}>
                  Try switching tags or expanding your community search radius.
                </Text>
                <TouchableOpacity
                  style={styles.resetFiltersBtn}
                  onPress={() => {
                    setSelectedTag('All');
                    setProfiles(VEGAN_PROFILES);
                    setBlockedProfileIds([]);
                  }}
                >
                  <Text style={styles.resetFiltersBtnText}>Reset Profiles</Text>
                </TouchableOpacity>
              </View>
            ) : (
              visibleProfiles.map(profile => (
                <View key={profile.id} style={styles.profileCard}>
                  {/* Top Bar with Avatar, Name, Proximity */}
                  <View style={styles.profileHeader}>
                    <View style={styles.profileAvatarBox}>
                      <Text style={styles.profileAvatarEmoji}>{profile.avatar}</Text>
                      {profile.verified && (
                        <View style={styles.verifiedCheckBadge}>
                          <ShieldCheck size={14} color='#38EF7D' weight='fill' />
                        </View>
                      )}
                    </View>

                    <View style={styles.profileMeta}>
                      <View style={styles.nameRow}>
                        <Text style={styles.profileName}>
                          {profile.name}, {profile.age}
                        </Text>
                        <Text style={styles.pronounsText}>({profile.pronouns})</Text>
                      </View>
                      <View style={styles.proximityRow}>
                        <MapPin size={13} color='#38EF7D' weight='fill' />
                        <Text style={styles.distanceText}>
                          {profile.distanceDisplay} · {profile.city}
                        </Text>
                      </View>
                    </View>

                    {/* Report / Safety button */}
                    <TouchableOpacity
                      style={styles.reportIconBtn}
                      onPress={() => setReportingProfile(profile)}
                      testID={`report-${profile.id}`}
                    >
                      <Flag size={16} color='rgba(255,255,255,0.4)' />
                    </TouchableOpacity>
                  </View>

                  {/* Vegan Credential Pill */}
                  <View style={styles.dietTagContainer}>
                    <Text style={styles.dietTagText}>
                      🌱 {profile.veganYears} yrs Vegan · {profile.dietTag}
                    </Text>
                  </View>

                  {/* Bio */}
                  <Text style={styles.profileBio}>{profile.bio}</Text>

                  {/* Icebreaker Prompt Box */}
                  <View style={styles.icebreakerCard}>
                    <Text style={styles.icebreakerQ}>💬 {profile.icebreaker.question}</Text>
                    <Text style={styles.icebreakerA}>"{profile.icebreaker.answer}"</Text>
                  </View>

                  {/* Interest Chips */}
                  <View style={styles.interestsRow}>
                    {profile.interests.map(interest => (
                      <View key={interest} style={styles.interestPill}>
                        <Text style={styles.interestPillText}>{interest}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Favorite Vegan Spot */}
                  <View style={styles.favoriteSpotRow}>
                    <Text style={styles.favoriteSpotLabel}>Favorite Spot:</Text>
                    <Text style={styles.favoriteSpotValue}>📍 {profile.favoriteSpot}</Text>
                  </View>

                  {/* Action Buttons: Pass, Say Hi, Like */}
                  <View style={styles.profileActions}>
                    <TouchableOpacity
                      style={styles.passBtn}
                      onPress={() => handlePassProfile(profile.id)}
                      testID={`pass-${profile.id}`}
                    >
                      <X size={20} color='#FF416C' weight='bold' />
                      <Text style={styles.passBtnText}>Pass</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.sayHiBtn}
                      onPress={() => handleSayHi(profile)}
                      testID={`sayhi-${profile.id}`}
                    >
                      <ChatCircleDots size={20} color='#fff' weight='bold' />
                      <Text style={styles.sayHiBtnText}>Say Hi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.likeBtn}
                      onPress={() => handleLikeProfile(profile)}
                      testID={`like-${profile.id}`}
                    >
                      <Heart size={20} color='#000' weight='fill' />
                      <Text style={styles.likeBtnText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View>
            {/* Meetups Feed */}
            <Text style={styles.sectionHeaderTitle}>Local Vegan Community Meetups</Text>
            <Text style={styles.sectionHeaderSub}>
              Sanctuary visits, group runs, food crawls & cruelty-free potlucks.
            </Text>

            {meetups.map(meetup => {
              const spotsLeft = meetup.maxSpots - meetup.attendeesCount;

              return (
                <View key={meetup.id} style={styles.meetupCard}>
                  {/* Category & Status Row */}
                  <View style={styles.meetupTopRow}>
                    <View style={styles.meetupCatBadge}>
                      <Text style={styles.meetupCatText}>{meetup.category}</Text>
                    </View>
                    <Text style={styles.spotsLeftText}>
                      {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                    </Text>
                  </View>

                  {/* Meetup Title */}
                  <Text style={styles.meetupTitle}>{meetup.title}</Text>
                  <Text style={styles.meetupDesc}>{meetup.description}</Text>

                  {/* Date, Time & Venue */}
                  <View style={styles.meetupInfoBox}>
                    <View style={styles.meetupInfoRow}>
                      <Calendar size={14} color='#38EF7D' weight='fill' />
                      <Text style={styles.meetupInfoText}>
                        {meetup.date} · {meetup.time}
                      </Text>
                    </View>
                    <View style={styles.meetupInfoRow}>
                      <MapPin size={14} color='#38EF7D' weight='fill' />
                      <Text style={styles.meetupInfoText}>
                        {meetup.locationName} ({meetup.distanceKm} km away)
                      </Text>
                    </View>
                  </View>

                  {/* Host Row & Attendees */}
                  <View style={styles.meetupHostRow}>
                    <Text style={styles.meetupHostEmoji}>{meetup.hostAvatar}</Text>
                    <Text style={styles.meetupHostText}>Hosted by {meetup.hostName}</Text>
                    <Text style={styles.attendeesCounter}>
                      👥 {meetup.attendeesCount}/{meetup.maxSpots} Attending
                    </Text>
                  </View>

                  {/* Actions: RSVP + Share */}
                  <View style={styles.meetupActions}>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, meetup.isJoined && styles.rsvpBtnJoined]}
                      onPress={() => handleToggleRsvp(meetup.id)}
                      testID={`rsvp-${meetup.id}`}
                    >
                      <CheckCircle
                        size={18}
                        color={meetup.isJoined ? '#38EF7D' : '#000'}
                        weight={meetup.isJoined ? 'fill' : 'bold'}
                      />
                      <Text
                        style={[styles.rsvpBtnText, meetup.isJoined && styles.rsvpBtnTextJoined]}
                      >
                        {meetup.isJoined ? 'Attending ✓' : 'Join Meetup'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.shareMeetupBtn}
                      onPress={() => handleShareMeetup(meetup)}
                    >
                      <ShareNetwork size={18} color='#fff' weight='bold' />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Safety Guidelines Modal */}
      <Modal
        visible={safetyModalVisible}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setSafetyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSafetyModalVisible(false)}
            >
              <X size={20} color='#fff' />
            </TouchableOpacity>

            <View style={styles.shieldIconBig}>
              <ShieldCheck size={36} color='#38EF7D' weight='fill' />
            </View>
            <Text style={styles.modalTitle}>Community Safety Shield</Text>
            <Text style={styles.modalSub}>Kindred Rules for Respectful Connection</Text>

            <View style={styles.safetyList}>
              {COMMUNITY_SAFETY_GUIDELINES.map(g => (
                <View key={g.id} style={styles.safetyItem}>
                  <Text style={styles.safetyEmoji}>{g.icon}</Text>
                  <View style={styles.safetyContent}>
                    <Text style={styles.safetyItemTitle}>{g.title}</Text>
                    <Text style={styles.safetyItemDesc}>{g.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setSafetyModalVisible(false)}
            >
              <Text style={styles.modalPrimaryBtnText}>I Understand & Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Report & Block Modal */}
      {reportingProfile && (
        <Modal
          visible={true}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setReportingProfile(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setReportingProfile(null)}
              >
                <X size={20} color='#fff' />
              </TouchableOpacity>

              <View style={[styles.shieldIconBig, { backgroundColor: 'rgba(255, 65, 108, 0.15)' }]}>
                <Flag size={32} color='#FF416C' weight='fill' />
              </View>

              <Text style={styles.modalTitle}>Report & Block</Text>
              <Text style={styles.modalSub}>
                Help keep Kindred a safe and respectful community.
              </Text>

              <Text style={styles.reportReasonPrompt}>
                Reason for reporting {reportingProfile.name}:
              </Text>

              {[
                'Harassment or inappropriate message',
                'Fake profile or impersonation',
                'Commercial spam / Non-vegan promotion',
                'Safety concern',
              ].map(reason => {
                const isSelected = selectedReportReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonChip, isSelected && styles.reasonChipActive]}
                    onPress={() => setSelectedReportReason(reason)}
                  >
                    <Text
                      style={[styles.reasonChipText, isSelected && styles.reasonChipTextActive]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity style={styles.confirmBlockBtn} onPress={handleConfirmReport}>
                <Text style={styles.confirmBlockBtnText}>Report & Block Instantly</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Mutual Match Celebration Modal */}
      {matchModalProfile && (
        <Modal
          visible={true}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setMatchModalProfile(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setMatchModalProfile(null)}
              >
                <X size={20} color='#fff' />
              </TouchableOpacity>

              <View style={styles.matchAvatarsRow}>
                <View style={styles.matchAvatar}>
                  <Text style={{ fontSize: 36 }}>🌱</Text>
                </View>
                <View style={styles.matchHeartBadge}>
                  <Heart size={20} color='#FF416C' weight='fill' />
                </View>
                <View style={styles.matchAvatar}>
                  <Text style={{ fontSize: 36 }}>{matchModalProfile.avatar}</Text>
                </View>
              </View>

              <Text style={styles.modalTitle}>It's a Vegan Connection! 💚</Text>
              <Text style={styles.modalSub}>
                You and {matchModalProfile.name} share a passion for cruelty-free living!
              </Text>

              <View style={styles.matchPromptBox}>
                <Text style={styles.matchPromptText}>
                  Icebreaker: Ask {matchModalProfile.name} about "{matchModalProfile.favoriteSpot}"!
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setMatchModalProfile(null);
                  handleSayHi(matchModalProfile);
                }}
              >
                <ChatCircleDots size={18} color='#000' weight='bold' />
                <Text style={styles.modalPrimaryBtnText}>Send Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.keepBrowsingBtn}
                onPress={() => setMatchModalProfile(null)}
              >
                <Text style={styles.keepBrowsingBtnText}>Keep Exploring</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0E12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 6, marginLeft: -6 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 },
  safetyBtn: { padding: 6, marginRight: -6 },

  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  segmentBtnActive: { backgroundColor: '#fff' },
  segmentText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: '#000', fontWeight: '700' },

  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },

  radarBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#161B22',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.2)',
  },
  radarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38EF7D',
  },
  pulseDotOff: { backgroundColor: '#8E8E93' },
  radarText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  ghostToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ghostText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },

  tagsScroll: { marginBottom: 16 },
  tagsContent: { gap: 8 },
  tagChip: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagChipActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderColor: '#38EF7D',
  },
  tagText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  tagTextActive: { color: '#38EF7D', fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  resetFiltersBtn: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetFiltersBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },

  profileCard: {
    backgroundColor: '#161B22',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  profileAvatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileAvatarEmoji: { fontSize: 28 },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0A0E12',
    borderRadius: 8,
    padding: 2,
  },
  profileMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  pronounsText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  proximityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  distanceText: { color: '#38EF7D', fontSize: 12, fontWeight: '600' },
  reportIconBtn: { padding: 6 },

  dietTagContainer: {
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  dietTagText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },

  profileBio: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  icebreakerCard: {
    backgroundColor: '#21262D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  icebreakerQ: { color: '#FF9500', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  icebreakerA: { color: '#fff', fontSize: 12, fontStyle: 'italic', lineHeight: 16 },

  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  interestPill: {
    backgroundColor: '#21262D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  interestPillText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500' },

  favoriteSpotRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  favoriteSpotLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  favoriteSpotValue: { color: '#fff', fontSize: 11, fontWeight: '600' },

  profileActions: { flexDirection: 'row', gap: 8 },
  passBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 65, 108, 0.15)',
    paddingVertical: 10,
    borderRadius: 14,
  },
  passBtnText: { color: '#FF416C', fontSize: 13, fontWeight: '700' },
  sayHiBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#21262D',
    paddingVertical: 10,
    borderRadius: 14,
  },
  sayHiBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  likeBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38EF7D',
    paddingVertical: 10,
    borderRadius: 14,
  },
  likeBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },

  /* Meetup Card Styles */
  sectionHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  sectionHeaderSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 },

  meetupCard: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  meetupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetupCatBadge: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  meetupCatText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },
  spotsLeftText: { color: '#FF9500', fontSize: 11, fontWeight: '700' },
  meetupTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  meetupDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },

  meetupInfoBox: {
    backgroundColor: '#21262D',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 6,
  },
  meetupInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meetupInfoText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },

  meetupHostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  meetupHostEmoji: { fontSize: 18, marginRight: 6 },
  meetupHostText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, flex: 1 },
  attendeesCounter: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },

  meetupActions: { flexDirection: 'row', gap: 8 },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38EF7D',
    paddingVertical: 10,
    borderRadius: 12,
  },
  rsvpBtnJoined: { backgroundColor: '#21262D', borderWidth: 1, borderColor: '#38EF7D' },
  rsvpBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
  rsvpBtnTextJoined: { color: '#38EF7D' },
  shareMeetupBtn: {
    backgroundColor: '#21262D',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161B22',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseBtn: { alignSelf: 'flex-end', padding: 4 },
  shieldIconBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  modalSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16, textAlign: 'center' },

  safetyList: { width: '100%', gap: 12, marginBottom: 18 },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#21262D',
    padding: 10,
    borderRadius: 12,
    gap: 10,
  },
  safetyEmoji: { fontSize: 20, marginTop: 2 },
  safetyContent: { flex: 1 },
  safetyItemTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  safetyItemDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 15 },

  modalPrimaryBtn: {
    backgroundColor: '#38EF7D',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },

  reportReasonPrompt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  reasonChip: {
    width: '100%',
    backgroundColor: '#21262D',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonChipActive: { borderColor: '#FF416C', backgroundColor: 'rgba(255, 65, 108, 0.15)' },
  reasonChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  reasonChipTextActive: { color: '#fff', fontWeight: '700' },
  confirmBlockBtn: {
    backgroundColor: '#FF416C',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBlockBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  matchAvatarsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 14 },
  matchAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38EF7D',
  },
  matchHeartBadge: {
    backgroundColor: '#0A0E12',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF416C',
  },
  matchPromptBox: {
    backgroundColor: '#21262D',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    width: '100%',
  },
  matchPromptText: { color: '#FF9500', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  keepBrowsingBtn: { marginTop: 10, paddingVertical: 8 },
  keepBrowsingBtnText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
});
