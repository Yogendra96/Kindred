import React, { useState } from 'react';
import { notifyChallengeComplete } from '../../hooks/useClimateNotifications';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useToast } from '../../contexts/ToastContext';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { Medal, Users, Lightning, Plus, Play, Heart, ShareNetwork } from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import ProgressBar from '../../components/ui/ProgressBar';
import CategoryChip from '../../components/ui/CategoryChip';

// ─── Mock Data (moved to src/data/socialData.ts) ──────────────────────────────

const LEADERBOARD = [
  {
    id: '1',
    name: 'Priya S.',
    avatar: '🌿',
    points: 4820,
    co2: 187,
    streak: 34,
    you: false,
  },
  {
    id: '2',
    name: 'Luca M.',
    avatar: '⚡',
    points: 4210,
    co2: 163,
    streak: 28,
    you: false,
  },
  {
    id: '3',
    name: 'You',
    avatar: '😊',
    points: 3990,
    co2: 152,
    streak: 21,
    you: true,
  },
  {
    id: '4',
    name: 'Emma R.',
    avatar: '🌊',
    points: 3740,
    co2: 140,
    streak: 19,
    you: false,
  },
  {
    id: '5',
    name: 'James K.',
    avatar: '🌱',
    points: 3510,
    co2: 128,
    streak: 15,
    you: false,
  },
  {
    id: '6',
    name: 'Aisha B.',
    avatar: '☀️',
    points: 3100,
    co2: 115,
    streak: 12,
    you: false,
  },
  {
    id: '7',
    name: 'Carlos D.',
    avatar: '🦋',
    points: 2890,
    co2: 101,
    streak: 9,
    you: false,
  },
  {
    id: '8',
    name: 'Mei L.',
    avatar: '🍃',
    points: 2400,
    co2: 89,
    streak: 7,
    you: false,
  },
];

const CHALLENGES = [
  {
    id: 'c1',
    title: 'Zero-Waste Week',
    emoji: '♻️',
    description: 'Produce no landfill waste for 7 days. Log daily.',
    type: 'Weekly',
    typeColor: '#B242FA',
    participants: 1243,
    daysLeft: 5,
    progress: 0.58,
    reward: '500 pts + 🥈 badge',
    joined: true,
  },
  {
    id: 'c2',
    title: 'Walk or Bike Every Day',
    emoji: '🚴',
    description: 'Use zero-emission transport for all local trips this week.',
    type: 'Weekly',
    typeColor: '#2B86FA',
    participants: 892,
    daysLeft: 3,
    progress: 0.82,
    reward: '300 pts + ⚡ badge',
    joined: true,
  },
  {
    id: 'c3',
    title: 'Meat-Free Monday',
    emoji: '🥦',
    description: 'Go fully plant-based every Monday this month.',
    type: 'Monthly',
    typeColor: '#38EF7D',
    participants: 3410,
    daysLeft: 18,
    progress: 0.33,
    reward: '800 pts + 🌱 badge',
    joined: false,
  },
  {
    id: 'c4',
    title: 'Cold Showers for the Planet',
    emoji: '🚿',
    description: 'Take cold showers for a week to cut hot water energy use.',
    type: 'Daily',
    typeColor: '#2BD7FA',
    participants: 567,
    daysLeft: 1,
    progress: 0.9,
    reward: '200 pts',
    joined: false,
  },
  {
    id: 'c5',
    title: '10,000 Trees Global Sprint',
    emoji: '🌳',
    description: 'Community goal — together offset 10,000 trees this month.',
    type: 'Global',
    typeColor: '#FA7B2B',
    participants: 28400,
    daysLeft: 12,
    progress: 0.71,
    reward: '1200 pts + 🌍 badge',
    joined: false,
  },
];

const GROUPS = [
  {
    id: 'g1',
    name: 'Brooklyn Zero Heroes',
    emoji: '🦸',
    members: 8,
    goal: 'Collectively reduce 500 kg CO₂ this month',
    progress: 312,
    target: 500,
    streak: 14,
    yourContribution: 48,
    nextCheck: 'Tomorrow, 8pm',
    recentActivity: 'Priya logged a zero-waste day 🎉',
  },
  {
    id: 'g2',
    name: 'Vegan Vibes NYC',
    emoji: '🥑',
    members: 5,
    goal: 'All members meat-free for 30 days',
    progress: 22,
    target: 30,
    streak: 22,
    yourContribution: 22,
    nextCheck: 'Sunday check-in',
    recentActivity: 'James completed day 22! 💪',
  },
  {
    id: 'g3',
    name: 'Commuter Cyclists',
    emoji: '🚲',
    members: 12,
    goal: 'Log 500 bike commutes this quarter',
    progress: 287,
    target: 500,
    streak: 8,
    yourContribution: 31,
    nextCheck: 'Friday leaderboard update',
    recentActivity: 'New member Emma joined! 👋',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const MEDAL = ['🥇', '🥈', '🥉'];

const LeaderboardRow = ({ item, index }: { item: (typeof LEADERBOARD)[0]; index: number }) => {
  const isTop3 = index < 3;
  return (
    <View style={[styles.lbRow, item.you && styles.lbRowYou, isTop3 && styles.lbRowTop]}>
      <Text style={styles.lbRank}>{isTop3 ? MEDAL[index] : `#${index + 1}`}</Text>
      <View style={styles.lbAvatarWrapper}>
        <Text style={styles.lbAvatar}>{item.avatar}</Text>
      </View>
      <View style={styles.lbInfo}>
        <Text style={[styles.lbName, item.you && styles.lbNameYou]}>
          {item.name} {item.you && '(You)'}
        </Text>
        <Text style={styles.lbSub}>
          🌱 {item.co2} kg CO₂ · 🔥 {item.streak}-day streak
        </Text>
      </View>
      <Text style={styles.lbPoints}>{item.points.toLocaleString()}</Text>
    </View>
  );
};

const ChallengeCard = ({ item }: { item: (typeof CHALLENGES)[0] }) => {
  const { showToast } = useToast();
  const [joined, setJoined] = useState(item.joined);

  const handleJoin = () => {
    setJoined(true);
    if (item.progress >= 1) {
      notifyChallengeComplete(item.title, item.reward);
    } else {
      showToast(
        `You joined "${item.title}"! 🎉 You'll earn ${item.reward} on completion.`,
        'success',
      );
    }
  };

  return (
    <GlassCard style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeEmojiWrapper}>
          <Text style={styles.challengeEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.flexContainer}>
          <View style={styles.challengeTitleRow}>
            <Text style={styles.challengeTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: item.typeColor + '20',
                  borderColor: item.typeColor,
                },
              ]}
            >
              <Text style={[styles.typeText, { color: item.typeColor }]}>{item.type}</Text>
            </View>
          </View>
          <Text style={styles.challengeDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>

      <ProgressBar progress={item.progress} color={item.typeColor} />

      <View style={styles.challengeMeta}>
        <Text style={styles.metaText}>👥 {item.participants.toLocaleString()} participants</Text>
        <Text style={styles.metaText}>⏰ {item.daysLeft}d left</Text>
        <Text style={styles.metaText}>🎁 {item.reward}</Text>
      </View>

      <TouchableOpacity
        style={[styles.joinBtn, joined && styles.joinBtnJoined]}
        onPress={joined ? undefined : handleJoin}
        activeOpacity={joined ? 1 : 0.8}
      >
        <Text style={[styles.joinBtnText, joined && styles.joinBtnTextJoined]}>
          {joined ? '✓ Participating' : 'Join Challenge'}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
};

const GroupCard = ({ item }: { item: (typeof GROUPS)[0] }) => {
  const { showToast } = useToast();
  const pct = item.progress / item.target;
  return (
    <GlassCard style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupEmojiWrapper}>
          <Text style={styles.groupEmoji}>{item.emoji}</Text>
        </View>
        <View style={styles.flexContainer}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMembers}>
            👥 {item.members} members · 🔥 {item.streak}-day streak
          </Text>
        </View>
        <TouchableOpacity
          style={styles.nudgeBtn}
          onPress={() =>
            showToast(
              "Nudge sent! 👋 Your group has been nudged to log today's activities.",
              'success',
            )
          }
        >
          <Text style={styles.nudgeBtnText}>Nudge</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.groupGoal}>{item.goal}</Text>

      <View style={styles.progressRow}>
        <ProgressBar progress={pct} color='#2B86FA' />
        <Text style={styles.progressLabel}>
          {item.progress} / {item.target}
        </Text>
      </View>

      <View style={styles.groupStats}>
        <View style={styles.groupStat}>
          <Text style={styles.groupStatValue}>{item.yourContribution}</Text>
          <Text style={styles.groupStatLabel}>Your contribution</Text>
        </View>
        <View style={styles.groupStatDivider} />
        <View style={styles.groupStat}>
          <Text style={styles.groupStatValue}>{Math.round(pct * 100)}%</Text>
          <Text style={styles.groupStatLabel}>Group complete</Text>
        </View>
        <View style={styles.groupStatDivider} />
        <View style={styles.groupStat}>
          <Text style={styles.groupStatValue}>{item.nextCheck}</Text>
          <Text style={styles.groupStatLabel}>Next check-in</Text>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.recentActivityText}>💬 {item.recentActivity}</Text>
      </View>
    </GlassCard>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const LeaderboardTab = () => {
  const [scope, setScope] = useState<'friends' | 'global'>('friends');
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor='#FFFFFF'
          colors={['#38EF7D']}
        />
      }
    >
      {/* Scope toggle */}
      <View style={styles.scopeToggle}>
        {(['friends', 'global'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.scopeBtn, scope === s && styles.scopeBtnActive]}
            onPress={() => setScope(s)}
          >
            <Text style={[styles.scopeBtnText, scope === s && styles.scopeBtnTextActive]}>
              {s === 'friends' ? '👥 Friends' : '🌍 Global'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Your rank card */}
      <View style={styles.yourRankCard}>
        <Text style={styles.yourRankLabel}>Your Rank</Text>
        <Text style={styles.yourRankValue}>#3</Text>
        <Text style={styles.yourRankSub}>214 pts behind #2 · Keep going! 💪</Text>
      </View>

      {/* List */}
      <View style={styles.lbList}>
        {LEADERBOARD.map((item, index) => (
          <LeaderboardRow key={item.id} item={item} index={index} />
        ))}
      </View>
    </ScrollView>
  );
};

const ChallengesTab = () => {
  const [filter, setFilter] = useState('All');
  const types = ['All', 'Daily', 'Weekly', 'Monthly', 'Global'];

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const filtered = filter === 'All' ? CHALLENGES : CHALLENGES.filter(c => c.type === filter);

  return (
    <View style={styles.flexContainer}>
      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.pillContent}
      >
        {types.map(t => (
          <CategoryChip
            key={t}
            label={t}
            active={filter === t}
            onPress={() => setFilter(t)}
            activeColor='rgba(56, 239, 125, 0.2)'
            style={[styles.pill, filter === t && styles.pillActive]}
            textStyle={[styles.pillText, filter === t && styles.pillTextActive]}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ChallengeCard item={item} />}
        contentContainerStyle={styles.tabContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#FFFFFF'
            colors={['#38EF7D']}
          />
        }
      />
    </View>
  );
};

const GroupsTab = () => {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      showToast('Please enter a group name', 'warning');
      return;
    }

    showToast(
      `🌿 Group "${groupName}" created! Share the invite link with your friends to get started.`,
      'success',
    );
    setGroupName('');
    setShowCreate(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor='#FFFFFF'
          colors={['#38EF7D']}
        />
      }
    >
      {/* Create group CTA */}
      {!showCreate ? (
        <TouchableOpacity style={styles.createGroupBtn} onPress={() => setShowCreate(true)}>
          <Plus size={20} color='#fff' weight='bold' style={styles.plusIcon} />
          <Text style={styles.createGroupText}>Create Accountability Group</Text>
        </TouchableOpacity>
      ) : (
        <GlassCard style={styles.createGroupForm}>
          <Text style={styles.createGroupLabel}>New Group Name</Text>
          <TextInput
            style={styles.createGroupInput}
            placeholder='e.g. Vegans of Brooklyn'
            placeholderTextColor='rgba(255,255,255,0.4)'
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
          />
          <View style={styles.createGroupActions}>
            <TouchableOpacity style={styles.createGroupCancel} onPress={() => setShowCreate(false)}>
              <Text style={styles.createGroupCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createGroupSubmit} onPress={handleCreate}>
              <Text style={styles.createGroupSubmitText}>Create</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      {/* Groups */}
      {GROUPS.map(group => (
        <GroupCard key={group.id} item={group} />
      ))}
    </ScrollView>
  );
};

// ─── EcoClips Tab ─────────────────────────────────────────────────────────────
import { Dimensions, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import {
  ChatCircle,
  CheckCircle as PhosphorCheck,
  PlusCircle,
  Funnel,
} from 'phosphor-react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ── SDG filter definitions ──
const SDG_FILTERS = [
  { key: 'all', label: 'All', emoji: '🌍', color: '#fff' },
  { key: 'climate', label: 'Climate', emoji: '🌡️', color: '#2B86FA' },
  { key: 'veganism', label: 'Vegan', emoji: '🌱', color: '#38EF7D' },
  { key: 'energy', label: 'Energy', emoji: '⚡', color: '#FF9500' },
  { key: 'sustainability', label: 'Eco Living', emoji: '♻️', color: '#F2C94C' },
  { key: 'minimalism', label: 'Minimalism', emoji: '🎒', color: '#9B59B6' },
  { key: 'ethics', label: 'Ethics', emoji: '⚖️', color: '#E74C3C' },
];

const SDG_TAGS: Record<string, { label: string; color: string }> = {
  veganism: { label: 'SDG 15 · Life on Land', color: '#38EF7D' },
  sustainability: { label: 'SDG 12 · Responsible Consumption', color: '#F2C94C' },
  climate: { label: 'SDG 13 · Climate Action', color: '#2B86FA' },
  minimalism: { label: 'SDG 12 · Responsible Consumption', color: '#9B59B6' },
  energy: { label: 'SDG 7 · Clean Energy', color: '#FF9500' },
  ethics: { label: 'SDG 16 · Peace & Justice', color: '#E74C3C' },
};

// ── Mock comments ──
const MOCK_COMMENTS: Record<
  string,
  { id: string; user: string; text: string; verified: boolean }[]
> = {
  c1: [
    { id: 'cm1', user: '@priya_eco', text: 'This changed my whole week! 🌱', verified: false },
    { id: 'cm2', user: '@UN_SDG', text: 'Supporting SDG 15 — keep going! 🌍', verified: true },
  ],
  c2: [{ id: 'cm3', user: '@luca_m', text: 'One bag challenge accepted 💪', verified: false }],
  c3: [
    {
      id: 'cm4',
      user: '@solaradvocate',
      text: 'Solar pays back in 4 years average!',
      verified: false,
    },
    {
      id: 'cm5',
      user: '@GreenpeaceOrg',
      text: 'Solar adoption is SDG 7 in action ⚡',
      verified: true,
    },
  ],
  c4: [
    { id: 'cm6', user: '@thriftqueen', text: 'Thrift stores changed my life fr', verified: false },
  ],
  c5: [
    {
      id: 'cm7',
      user: '@ClimateTracker',
      text: '1.5°C = the line we cannot cross 🌊',
      verified: true,
    },
    { id: 'cm8', user: '@emma_r', text: 'Shared this with my whole team at work', verified: false },
  ],
};

// ── Impact stats per clip ──
const IMPACT_STATS: Record<string, { inspired: number; actions: string }> = {
  c1: { inspired: 847, actions: 'tried plant-based this week' },
  c2: { inspired: 412, actions: 'decluttered one bag' },
  c3: { inspired: 1203, actions: 'looked into solar panels' },
  c4: { inspired: 631, actions: 'bought secondhand' },
  c5: { inspired: 2910, actions: 'shared this with a friend' },
};

// ── Verified creators ──
const VERIFIED_CREATORS = new Set([
  '@UN_SDG',
  '@GreenpeaceOrg',
  '@ClimateTracker',
  '@solarenergy.daily',
  '@climateaction.now',
]);

type ClipItem = {
  id: string;
  creator: string | null;
  caption: string | null;
  tag: string | null;
  emoji: string | null;
  likes: number;
  isAd: boolean;
};

const BASE_CLIPS: ClipItem[] = [
  {
    id: 'c1',
    creator: '@earthlingco',
    caption: 'A week of plant-based meals 🌱 The impact is real.',
    tag: 'veganism',
    emoji: '🌱',
    likes: 14200,
    isAd: false,
  },
  {
    id: 'c2',
    creator: '@minimalist.life',
    caption: "One bag. That's all I needed for a whole year. Minimalism changed everything.",
    tag: 'minimalism',
    emoji: '🎒',
    likes: 9800,
    isAd: false,
  },
  { id: 'adslot1', creator: null, caption: null, tag: null, emoji: null, likes: 0, isAd: true },
  {
    id: 'c3',
    creator: '@solarenergy.daily',
    caption: 'We installed solar last year. Our bill dropped to zero. ⚡',
    tag: 'energy',
    emoji: '☀️',
    likes: 22000,
    isAd: false,
  },
  {
    id: 'c4',
    creator: '@sustainabilist',
    caption: 'Secondhand first. Always. The fashion industry is the 2nd largest polluter.',
    tag: 'sustainability',
    emoji: '👕',
    likes: 6700,
    isAd: false,
  },
  {
    id: 'c5',
    creator: '@climateaction.now',
    caption: "1.5°C is not just a number. It's the difference between a flood and a home. 🌊",
    tag: 'climate',
    emoji: '🌊',
    likes: 18500,
    isAd: false,
  },
];

const EcoClipsTab = () => {
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [adDonationCents, setAdDonationCents] = useState(0);
  const [adPlayingId, setAdPlayingId] = useState<string | null>(null);

  // SDG filter
  const [activeFilter, setActiveFilter] = useState('all');

  // Comments modal
  const [commentsClipId, setCommentsClipId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [extraComments, setExtraComments] = useState<
    Record<string, { id: string; user: string; text: string; verified: boolean }[]>
  >({});

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTag, setUploadTag] = useState('climate');
  const [userClips, setUserClips] = useState<ClipItem[]>([]);

  // Derived filtered list
  const allClips = [...userClips, ...BASE_CLIPS];
  const filteredClips =
    activeFilter === 'all' ? allClips : allClips.filter(c => c.tag === activeFilter || c.isAd);

  const toggleLike = (id: string) =>
    setLikedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const handlePlayAd = (id: string) => {
    if (adPlayingId) return;
    setAdPlayingId(id);
    setTimeout(() => {
      setAdDonationCents(c => c + 2);
      setAdPlayingId(null);
    }, 5000);
  };

  const handlePostComment = (clipId: string) => {
    if (!newComment.trim()) return;
    const entry = {
      id: `uc_${Date.now()}`,
      user: '@you',
      text: newComment.trim(),
      verified: false,
    };
    setExtraComments(prev => ({ ...prev, [clipId]: [...(prev[clipId] ?? []), entry] }));
    setNewComment('');
  };

  const handleUploadClip = () => {
    if (!uploadCaption.trim()) return;
    const newClip: ClipItem = {
      id: `user_${Date.now()}`,
      creator: '@you',
      caption: uploadCaption.trim(),
      tag: uploadTag,
      emoji: SDG_FILTERS.find(f => f.key === uploadTag)?.emoji ?? '🌍',
      likes: 0,
      isAd: false,
    };
    setUserClips(prev => [newClip, ...prev]);
    setUploadCaption('');
    setShowUpload(false);
  };

  const commentsForClip = (id: string) => [
    ...(MOCK_COMMENTS[id] ?? []),
    ...(extraComments[id] ?? []),
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* ── Donation banner ── */}
      {adDonationCents > 0 && (
        <View style={ecoClipStyles.donationBanner}>
          <Text style={ecoClipStyles.donationBannerText}>
            🌍 ${(adDonationCents / 100).toFixed(2)} donated to SDG causes from your ad views
          </Text>
        </View>
      )}

      {/* ── SDG Filter chips ── */}
      <View style={ecoClipStyles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={ecoClipStyles.filterScroll}
        >
          {SDG_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[
                ecoClipStyles.filterChip,
                activeFilter === f.key && { borderColor: f.color, backgroundColor: `${f.color}18` },
              ]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={ecoClipStyles.filterChipEmoji}>{f.emoji}</Text>
              <Text
                style={[
                  ecoClipStyles.filterChipLabel,
                  activeFilter === f.key && { color: f.color },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Upload button */}
        <TouchableOpacity
          style={ecoClipStyles.uploadBtn}
          onPress={() => setShowUpload(true)}
          activeOpacity={0.8}
        >
          <PlusCircle size={26} color='#38EF7D' weight='fill' />
        </TouchableOpacity>
      </View>

      {/* ── Clips feed ── */}
      <FlatList
        data={filteredClips}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment='start'
        decelerationRate='fast'
        renderItem={({ item }) => {
          // Ad slot
          if (item.isAd) {
            const playing = adPlayingId === item.id;
            return (
              <View style={[ecoClipStyles.clip, ecoClipStyles.adClip]}>
                <Text style={ecoClipStyles.adLabel}>SPONSORED</Text>
                <Text style={ecoClipStyles.adEmoji}>📢</Text>
                <Text style={ecoClipStyles.adTitle}>Watch this ad to donate to SDG Causes</Text>
                <Text style={ecoClipStyles.adSub}>
                  100% of ad revenue goes to UN Sustainable Development Goals
                </Text>
                <TouchableOpacity
                  style={[ecoClipStyles.adPlayBtn, playing && ecoClipStyles.adPlayBtnLoading]}
                  onPress={() => handlePlayAd(item.id)}
                  disabled={playing}
                  activeOpacity={0.8}
                >
                  <Play
                    size={18}
                    color={playing ? 'rgba(255,255,255,0.4)' : '#0A0A0C'}
                    weight='fill'
                  />
                  <Text
                    style={[
                      ecoClipStyles.adPlayBtnText,
                      playing && ecoClipStyles.adPlayBtnTextLoading,
                    ]}
                  >
                    {playing ? 'Ad playing… (+$0.02)' : 'Play Ad to Donate'}
                  </Text>
                </TouchableOpacity>
                <Text style={ecoClipStyles.adVoluntaryNote}>
                  Optional · You can scroll past anytime
                </Text>
              </View>
            );
          }

          const tag = item.tag ? SDG_TAGS[item.tag] : null;
          const liked = likedIds.includes(item.id);
          const impact = item.id in IMPACT_STATS ? IMPACT_STATS[item.id] : null;
          const isVerified = item.creator ? VERIFIED_CREATORS.has(item.creator) : false;
          const commentCount = commentsForClip(item.id).length;

          return (
            <View style={ecoClipStyles.clip}>
              {/* Background emoji */}
              <View style={ecoClipStyles.clipBg}>
                <Text style={ecoClipStyles.clipBgEmoji}>{item.emoji}</Text>
              </View>

              {/* SDG Tag pill */}
              {tag && (
                <View style={[ecoClipStyles.sdgTag, { borderColor: tag.color }]}>
                  <Text style={[ecoClipStyles.sdgTagText, { color: tag.color }]}>{tag.label}</Text>
                </View>
              )}

              {/* Impact overlay — top right */}
              {impact && (
                <View style={ecoClipStyles.impactBadge}>
                  <Text style={ecoClipStyles.impactNumber}>
                    +{impact.inspired.toLocaleString()}
                  </Text>
                  <Text style={ecoClipStyles.impactLabel}>{impact.actions}</Text>
                </View>
              )}

              {/* Bottom overlay: creator + caption */}
              <View style={ecoClipStyles.clipOverlay}>
                {/* Creator row with verified badge */}
                <View style={ecoClipStyles.creatorRow}>
                  <Text style={ecoClipStyles.clipCreator}>{item.creator}</Text>
                  {isVerified && (
                    <View style={ecoClipStyles.verifiedBadge}>
                      <PhosphorCheck size={10} color='#0A0A0C' weight='bold' />
                    </View>
                  )}
                </View>
                <Text style={ecoClipStyles.clipCaption}>{item.caption}</Text>
              </View>

              {/* Action sidebar */}
              <View style={ecoClipStyles.actions}>
                {/* Like */}
                <TouchableOpacity
                  style={ecoClipStyles.actionBtn}
                  onPress={() => toggleLike(item.id)}
                >
                  <Heart
                    size={28}
                    color={liked ? '#FF2D55' : '#fff'}
                    weight={liked ? 'fill' : 'regular'}
                  />
                  <Text style={ecoClipStyles.actionCount}>
                    {((item.likes + (liked ? 1 : 0)) / 1000).toFixed(1)}k
                  </Text>
                </TouchableOpacity>

                {/* Comments */}
                <TouchableOpacity
                  style={ecoClipStyles.actionBtn}
                  onPress={() => setCommentsClipId(item.id)}
                >
                  <ChatCircle size={28} color='#fff' />
                  <Text style={ecoClipStyles.actionCount}>{commentCount}</Text>
                </TouchableOpacity>

                {/* Share */}
                <TouchableOpacity style={ecoClipStyles.actionBtn}>
                  <ShareNetwork size={28} color='#fff' />
                  <Text style={ecoClipStyles.actionCount}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* ── Comments Modal ── */}
      <Modal
        visible={!!commentsClipId}
        animationType='slide'
        transparent
        onRequestClose={() => setCommentsClipId(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={ecoClipStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCommentsClipId(null)}
          />
          <View style={ecoClipStyles.commentsSheet}>
            <View style={ecoClipStyles.sheetHandle} />
            <Text style={ecoClipStyles.sheetTitle}>💬 Comments</Text>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
              {commentsClipId &&
                commentsForClip(commentsClipId).map(c => (
                  <View key={c.id} style={ecoClipStyles.commentRow}>
                    <View style={ecoClipStyles.commentAvatar}>
                      <Text style={ecoClipStyles.commentAvatarText}>{c.user[1].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={ecoClipStyles.commentNameRow}>
                        <Text style={ecoClipStyles.commentUser}>{c.user}</Text>
                        {c.verified && (
                          <View style={ecoClipStyles.verifiedBadge}>
                            <PhosphorCheck size={9} color='#0A0A0C' weight='bold' />
                          </View>
                        )}
                      </View>
                      <Text style={ecoClipStyles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))}
              {commentsClipId && commentsForClip(commentsClipId).length === 0 && (
                <Text style={ecoClipStyles.noComments}>Be the first to comment 🌱</Text>
              )}
            </ScrollView>
            {/* Comment input */}
            <View style={ecoClipStyles.commentInputRow}>
              <TextInput
                style={ecoClipStyles.commentInput}
                placeholder='Add a comment…'
                placeholderTextColor='rgba(255,255,255,0.3)'
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={ecoClipStyles.commentSendBtn}
                onPress={() => commentsClipId && handlePostComment(commentsClipId)}
                activeOpacity={0.8}
              >
                <Text style={ecoClipStyles.commentSendText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Upload Modal ── */}
      <Modal
        visible={showUpload}
        animationType='slide'
        transparent
        onRequestClose={() => setShowUpload(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={ecoClipStyles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowUpload(false)}
          />
          <View style={ecoClipStyles.commentsSheet}>
            <View style={ecoClipStyles.sheetHandle} />
            <Text style={ecoClipStyles.sheetTitle}>🎬 Post an EcoClip</Text>

            <Text style={ecoClipStyles.uploadLabel}>Caption</Text>
            <TextInput
              style={ecoClipStyles.uploadInput}
              placeholder='Share your sustainability story…'
              placeholderTextColor='rgba(255,255,255,0.3)'
              value={uploadCaption}
              onChangeText={setUploadCaption}
              multiline
              maxLength={200}
            />
            <Text style={ecoClipStyles.uploadCharCount}>{uploadCaption.length}/200</Text>

            <Text style={ecoClipStyles.uploadLabel}>SDG Tag</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
            >
              {SDG_FILTERS.filter(f => f.key !== 'all').map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    ecoClipStyles.filterChip,
                    uploadTag === f.key && {
                      borderColor: f.color,
                      backgroundColor: `${f.color}20`,
                    },
                  ]}
                  onPress={() => setUploadTag(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={ecoClipStyles.filterChipEmoji}>{f.emoji}</Text>
                  <Text
                    style={[
                      ecoClipStyles.filterChipLabel,
                      uploadTag === f.key && { color: f.color },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={ecoClipStyles.uploadSubmitBtn}
              onPress={handleUploadClip}
              activeOpacity={0.85}
            >
              <Text style={ecoClipStyles.uploadSubmitText}>Post EcoClip 🌍</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const ecoClipStyles = StyleSheet.create({
  // Filter bar
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterChipEmoji: { fontSize: 13 },
  filterChipLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  uploadBtn: { paddingHorizontal: 12, paddingVertical: 8 },

  // Clips
  clip: { height: SCREEN_HEIGHT - 168, backgroundColor: '#0A0A12', justifyContent: 'flex-end' },
  adClip: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 14 },
  clipBg: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  clipBgEmoji: { fontSize: 160, opacity: 0.08 },

  // SDG Tag
  sdgTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sdgTagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Impact overlay
  impactBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  impactNumber: { fontSize: 16, fontWeight: '800', color: '#38EF7D' },
  impactLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 1,
    maxWidth: 80,
  },

  // Bottom overlay
  clipOverlay: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 60 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  clipCreator: { fontSize: 14, fontWeight: '700', color: '#fff' },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#38EF7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipCaption: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, maxWidth: '80%' },

  // Action sidebar
  actions: { position: 'absolute', right: 14, bottom: 80, gap: 20, alignItems: 'center' },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Ad slot
  adLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  adEmoji: { fontSize: 48 },
  adTitle: { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 26 },
  adSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 18 },
  adPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38EF7D',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 6,
  },
  adPlayBtnLoading: {
    backgroundColor: 'rgba(56,239,125,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56,239,125,0.3)',
  },
  adPlayBtnText: { fontSize: 15, fontWeight: '800', color: '#0A0A0C' },
  adPlayBtnTextLoading: { color: 'rgba(255,255,255,0.5)' },
  adVoluntaryNote: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  // Donation banner
  donationBanner: {
    backgroundColor: 'rgba(56,239,125,0.12)',
    borderBottomWidth: 1,
    borderColor: 'rgba(56,239,125,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  donationBannerText: { fontSize: 12, color: '#38EF7D', fontWeight: '600', textAlign: 'center' },

  // Comments / Upload sheet
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  commentsSheet: {
    backgroundColor: '#13141F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 16 },

  // Comment items
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56,239,125,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { fontSize: 13, fontWeight: '700', color: '#38EF7D' },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  commentUser: { fontSize: 13, fontWeight: '700', color: '#fff' },
  commentText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  noComments: { textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 20 },

  // Comment input
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  commentSendBtn: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  commentSendText: { fontSize: 14, fontWeight: '800', color: '#0A0A0C' },

  // Upload form
  uploadLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  uploadCharCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'right',
    marginBottom: 16,
  },
  uploadSubmitBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadSubmitText: { fontSize: 16, fontWeight: '800', color: '#0A0A0C' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
import RealTimeSocialDashboard from '../../components/RealTimeSocialDashboard';

const TABS = [
  {
    key: 'EcoClips',
    label: 'EcoClips',
    icon: <Play size={20} color='#FF2D55' weight='duotone' />,
  },
  {
    key: 'Live',
    label: 'Live',
    icon: <Lightning size={20} color='#FF6B00' weight='duotone' />,
  },
  {
    key: 'Leaderboard',
    label: 'Leaderboard',
    icon: <Medal size={20} color='#38EF7D' weight='duotone' />,
  },
  {
    key: 'Challenges',
    label: 'Challenges',
    icon: <Lightning size={20} color='#F2C94C' weight='duotone' />,
  },
  {
    key: 'Groups',
    label: 'Groups',
    icon: <Users size={20} color='#2B86FA' weight='duotone' />,
  },
];

const SocialScreen = () => {
  const [activeTab, setActiveTab] = useState('EcoClips');

  return (
    <SpaceBackground earthPosition='top-left' enableComets={true}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Community</Text>
        <Text style={styles.subtitle}>Challenge friends. Save the planet together.</Text>
      </View>

      {/* Tab bar */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={styles.tabItemContent}>
                {tab.icon}
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab content */}
      <View style={styles.flexContainer}>
        {activeTab === 'EcoClips' && <EcoClipsTab />}
        {activeTab === 'Leaderboard' && <LeaderboardTab />}
        {activeTab === 'Challenges' && <ChallengesTab />}
        {activeTab === 'Groups' && <GroupsTab />}
        {activeTab === 'Live' && <RealTimeSocialDashboard />}
      </View>
    </SpaceBackground>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2027' },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Tab bar
  tabBarScroll: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginTop: 10,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  tabLabelActive: { color: '#fff' },

  tabContent: { padding: 16, paddingBottom: 32 },

  // Leaderboard
  scopeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  scopeBtnActive: { backgroundColor: 'rgba(56,239,125,0.2)' },
  scopeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  scopeBtnTextActive: { color: '#38EF7D' },
  yourRankCard: {
    backgroundColor: 'rgba(56,239,125,0.1)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  yourRankLabel: {
    fontSize: 13,
    color: '#38EF7D',
    marginBottom: 4,
    fontWeight: '600',
  },
  yourRankValue: { fontSize: 48, fontWeight: 'bold', color: 'white' },
  yourRankSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  lbList: { gap: 8 },
  lbRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lbRowYou: {
    borderWidth: 1,
    borderColor: '#38EF7D',
    backgroundColor: 'rgba(56,239,125,0.1)',
  },
  lbRowTop: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  lbRank: { fontSize: 20, width: 36, textAlign: 'center', color: '#fff' },
  lbAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  lbAvatar: { fontSize: 20 },
  lbInfo: { flex: 1 },
  lbName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  lbNameYou: { color: '#38EF7D' },
  lbSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  lbPoints: { fontSize: 16, fontWeight: 'bold', color: '#38EF7D' },

  // Challenges
  pillScroll: { height: 46, marginTop: 10, marginBottom: 4 },
  pillContent: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  pillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  challengeCard: {
    padding: 16,
    marginBottom: 14,
  },
  challengeHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  challengeEmojiWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  challengeEmoji: { fontSize: 24 },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  challengeTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  challengeDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeText: { fontSize: 10, fontWeight: '700' },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  joinBtn: {
    backgroundColor: 'rgba(56,239,125,0.1)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinBtnJoined: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'transparent',
  },
  joinBtnText: { color: '#38EF7D', fontWeight: '700', fontSize: 14 },
  joinBtnTextJoined: { color: 'rgba(255,255,255,0.5)' },

  // Groups
  createGroupBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56,239,125,0.1)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createGroupText: { color: '#38EF7D', fontWeight: '700', fontSize: 15 },
  createGroupForm: {
    padding: 16,
    marginBottom: 16,
  },
  createGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  createGroupInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#fff',
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  createGroupActions: { flexDirection: 'row', gap: 10 },
  createGroupCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  createGroupCancelText: { color: '#fff', fontWeight: '600' },
  createGroupSubmit: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#38EF7D',
  },
  createGroupSubmitText: { color: '#0f2027', fontWeight: '700' },
  groupCard: {
    padding: 16,
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  groupEmojiWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: { fontSize: 24 },
  groupName: { fontSize: 17, fontWeight: '700', color: '#fff' },
  groupMembers: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  groupGoal: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  groupStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  groupStat: { flex: 1, alignItems: 'center' },
  groupStatValue: { fontSize: 15, fontWeight: '700', color: '#38EF7D' },
  groupStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    textAlign: 'center',
  },
  groupStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },
  recentActivity: {
    backgroundColor: 'rgba(56,239,125,0.1)',
    borderRadius: 8,
    padding: 10,
  },
  recentActivityText: { fontSize: 13, color: '#38EF7D' },
  nudgeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
  nudgeBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  flexContainer: {
    flex: 1,
  },
  plusIcon: {
    marginRight: 8,
  },
  tabItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default SocialScreen;
