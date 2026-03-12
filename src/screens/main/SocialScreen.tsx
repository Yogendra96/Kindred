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
// import ProgressBar from '../../components/ui/ProgressBar';
import { useToast } from '../../contexts/ToastContext';

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
    typeColor: '#7b1fa2',
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
    typeColor: '#1565c0',
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
    typeColor: '#2e7d32',
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
    typeColor: '#00838f',
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
    typeColor: '#e65100',
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

const LeaderboardRow = ({
  item,
  index,
}: {
  item: (typeof LEADERBOARD)[0];
  index: number;
}) => {
  const isTop3 = index < 3;
  return (
    <View
      style={[
        styles.lbRow,
        item.you && styles.lbRowYou,
        isTop3 && styles.lbRowTop,
      ]}
    >
      <Text style={styles.lbRank}>
        {isTop3 ? MEDAL[index] : `#${index + 1}`}
      </Text>
      <Text style={styles.lbAvatar}>{item.avatar}</Text>
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

const ProgressBar = ({
  progress,
  color = '#2e7d32',
}: {
  progress: number;
  color?: string;
}) => (
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
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeEmoji}>{item.emoji}</Text>
        <View style={{ flex: 1 }}>
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
              <Text style={[styles.typeText, { color: item.typeColor }]}>
                {item.type}
              </Text>
            </View>
          </View>
          <Text style={styles.challengeDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>

      <ProgressBar progress={item.progress} color={item.typeColor} />

      <View style={styles.challengeMeta}>
        <Text style={styles.metaText}>
          👥 {item.participants.toLocaleString()} participants
        </Text>
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
    </View>
  );
};

const GroupCard = ({ item }: { item: (typeof GROUPS)[0] }) => {
  const { showToast } = useToast();
  const pct = item.progress / item.target;
  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupEmoji}>{item.emoji}</Text>
        <View style={{ flex: 1 }}>
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
        <ProgressBar progress={pct} color='#1565c0' />
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
    </View>
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
            <Text
              style={[
                styles.scopeBtnText,
                scope === s && styles.scopeBtnTextActive,
              ]}
            >
              {s === 'friends' ? '👥 Friends' : '🌍 Global'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Your rank card */}
      <View style={styles.yourRankCard}>
        <Text style={styles.yourRankLabel}>Your Rank</Text>
        <Text style={styles.yourRankValue}>#3</Text>
        <Text style={styles.yourRankSub}>
          214 pts behind #2 · Keep going! 💪
        </Text>
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

  const filtered =
    filter === 'All' ? CHALLENGES : CHALLENGES.filter(c => c.type === filter);

  return (
    <View style={{ flex: 1 }}>
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
            <Text
              style={[styles.pillText, filter === t && styles.pillTextActive]}
            >
              {t}
            </Text>
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
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Create group CTA */}
      {!showCreate ? (
        <TouchableOpacity
          style={styles.createGroupBtn}
          onPress={() => setShowCreate(true)}
        >
          <Text style={styles.createGroupText}>
            + Create Accountability Group
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.createGroupForm}>
          <Text style={styles.createGroupLabel}>New Group Name</Text>
          <TextInput
            style={styles.createGroupInput}
            placeholder='e.g. Vegans of Brooklyn'
            placeholderTextColor='#aaa'
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
          />
          <View style={styles.createGroupActions}>
            <TouchableOpacity
              style={styles.createGroupCancel}
              onPress={() => setShowCreate(false)}
            >
              <Text style={styles.createGroupCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createGroupSubmit}
              onPress={handleCreate}
            >
              <Text style={styles.createGroupSubmitText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Groups */}
      {GROUPS.map(group => (
        <GroupCard key={group.id} item={group} />
      ))}
    </ScrollView>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const TABS = [
  { key: 'Leaderboard', label: '🏆 Leaderboard' },
  { key: 'Challenges', label: '⚡ Challenges' },
  { key: 'Groups', label: '🤝 Groups' },
];

const SocialScreen = () => {
  const [activeTab, setActiveTab] = useState('Leaderboard');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Community</Text>
        <Text style={styles.subtitle}>
          Challenge friends. Save the planet together.
        </Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Leaderboard' && <LeaderboardTab />}
        {activeTab === 'Challenges' && <ChallengesTab />}
        {activeTab === 'Groups' && <GroupsTab />}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1b5e20',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1b5e20',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 3,
  },
  tabItemActive: { backgroundColor: 'white' },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
  },
  tabLabelActive: { color: '#1b5e20' },

  tabContent: { padding: 16, paddingBottom: 32 },

  // Leaderboard
  scopeToggle: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  scopeBtnActive: { backgroundColor: '#2e7d32' },
  scopeBtnText: { fontSize: 14, fontWeight: '600', color: '#555' },
  scopeBtnTextActive: { color: 'white' },
  yourRankCard: {
    backgroundColor: '#2e7d32',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  yourRankLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  yourRankValue: { fontSize: 48, fontWeight: 'bold', color: 'white' },
  yourRankSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  lbList: { gap: 8 },
  lbRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lbRowYou: {
    borderWidth: 2,
    borderColor: '#2e7d32',
    backgroundColor: '#f1f8f1',
  },
  lbRowTop: { backgroundColor: '#fffde7' },
  lbRank: { fontSize: 20, width: 36, textAlign: 'center' },
  lbAvatar: { fontSize: 28, marginHorizontal: 10 },
  lbInfo: { flex: 1 },
  lbName: { fontSize: 15, fontWeight: '700', color: '#222' },
  lbNameYou: { color: '#2e7d32' },
  lbSub: { fontSize: 12, color: '#888', marginTop: 2 },
  lbPoints: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },

  // Challenges
  pillScroll: { maxHeight: 48, backgroundColor: 'white' },
  pillContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  pillActive: { backgroundColor: '#2e7d32' },
  pillText: { fontSize: 13, color: '#555', fontWeight: '500' },
  pillTextActive: { color: 'white' },
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  challengeHeader: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  challengeEmoji: { fontSize: 36, alignSelf: 'flex-start' },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  challengeTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#222' },
  challengeDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeText: { fontSize: 10, fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: '#eee',
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
  metaText: { fontSize: 11, color: '#888' },
  joinBtn: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinBtnJoined: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  joinBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  joinBtnTextJoined: { color: '#2e7d32' },

  // Groups
  createGroupBtn: {
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  createGroupText: { color: 'white', fontWeight: '700', fontSize: 15 },
  createGroupForm: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  createGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  createGroupInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#222',
    marginBottom: 12,
  },
  createGroupActions: { flexDirection: 'row', gap: 10 },
  createGroupCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  createGroupCancelText: { color: '#555', fontWeight: '600' },
  createGroupSubmit: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#2e7d32',
  },
  createGroupSubmitText: { color: 'white', fontWeight: '700' },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  groupEmoji: { fontSize: 32 },
  groupName: { fontSize: 17, fontWeight: '700', color: '#222' },
  groupMembers: { fontSize: 12, color: '#888', marginTop: 2 },
  groupGoal: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  progressLabel: { fontSize: 12, color: '#888', whiteSpace: 'nowrap' } as any,
  groupStats: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  groupStat: { flex: 1, alignItems: 'center' },
  groupStatValue: { fontSize: 15, fontWeight: '700', color: '#1565c0' },
  groupStatLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    textAlign: 'center',
  },
  groupStatDivider: { width: 1, backgroundColor: '#e0e0e0', marginVertical: 4 },
  recentActivity: { backgroundColor: '#e8f5e9', borderRadius: 8, padding: 10 },
  recentActivityText: { fontSize: 13, color: '#2e7d32' },
  nudgeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
  },
  nudgeBtnText: { fontSize: 13, fontWeight: '600', color: '#1565c0' },
});

export default SocialScreen;
