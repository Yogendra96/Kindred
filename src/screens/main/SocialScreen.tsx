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
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useToast } from '../../contexts/ToastContext';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { Medal, Users, Lightning, Plus } from 'phosphor-react-native';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

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

const ProgressBar = ({ progress, color = '#38EF7D' }: { progress: number; color?: string }) => (
  <View style={styles.progressTrack}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: color },
      ]}
    />
  </View>
);

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

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
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
          <TouchableOpacity
            key={t}
            style={[styles.pill, filter === t && styles.pillActive]}
            onPress={() => setFilter(t)}
          >
            <Text style={[styles.pillText, filter === t && styles.pillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ChallengeCard item={item} />}
        contentContainerStyle={styles.tabContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const GroupsTab = () => {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');

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
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
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

// ─── Main Screen ─────────────────────────────────────────────────────────────
import RealTimeSocialDashboard from '../../components/RealTimeSocialDashboard';

const TABS = [
  {
    key: 'Live',
    label: 'Live',
    icon: <Lightning size={20} color='#FF2D55' weight='duotone' />,
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
  const [activeTab, setActiveTab] = useState('Live');

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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Community</Text>
        <Text style={styles.subtitle}>Challenge friends. Save the planet together.</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
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
      </View>

      {/* Tab content */}
      <View style={styles.flexContainer}>
        {activeTab === 'Leaderboard' && <LeaderboardTab />}
        {activeTab === 'Challenges' && <ChallengesTab />}
        {activeTab === 'Groups' && <GroupsTab />}
        {activeTab === 'Live' && <RealTimeSocialDashboard />}
      </View>
    </View>
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginTop: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 3,
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
  pillScroll: { maxHeight: 48 },
  pillContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    backgroundColor: 'rgba(56,239,125,0.2)',
    borderColor: '#38EF7D',
  },
  pillText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  pillTextActive: { color: '#38EF7D', fontWeight: 'bold' },
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
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: { height: '100%', borderRadius: 4 },
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
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
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
