import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '../../contexts/ToastContext';
import HapticFeedbackService from '../../services/HapticFeedbackService';
import type { RootState } from '../../store';
import { updateEcosystem } from '../../store';
import type { Badge, Achievement, UserAchievementStats } from '../../services/AchievementSystem';
import achievementSystem from '../../services/AchievementSystem';
import Svg, {
  LinearGradient as SvgLinearGradient,
  Defs,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import {
  Trophy,
  Tree,
  Drop,
  Plant,
  ShoppingCart,
  Users,
  Lock,
  CheckCircle,
  Coins,
} from 'phosphor-react-native';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

// Store item interface
interface StoreItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: 'theme' | 'voucher' | 'certificate';
  details?: string;
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'theme_emerald',
    title: 'Emerald Forest Theme',
    description: 'Unlock a beautiful dark-green theme across the application.',
    cost: 500,
    icon: '🎨',
    category: 'theme',
    details: 'Equip this premium green glassmorphic theme.',
  },
  {
    id: 'voucher_coffee',
    title: 'Free Eco-Coffee',
    description: 'Get a free organic coffee at any participating local café.',
    cost: 300,
    icon: '☕',
    category: 'voucher',
    details: 'Redeem code: KINDRED-ECO-COFFEE-2026',
  },
  {
    id: 'voucher_fashion',
    title: '$10 Sustainable Fashion',
    description: '$10 discount voucher for verified eco-friendly apparel stores.',
    cost: 400,
    icon: '👕',
    category: 'voucher',
    details: 'Redeem code: SUSTAIN-STYLE-10',
  },
  {
    id: 'cert_tree',
    title: 'Plant a Real Tree',
    description: 'We will fund planting one native tree through our certified partners.',
    cost: 1000,
    icon: '🌳',
    category: 'certificate',
    details: 'Verification code: TREE-PLANT-KND-9823',
  },
  {
    id: 'buddy_hat',
    title: 'Buddy Sunhat',
    description: 'A cute little virtual sunhat for your Eco-Buddy pet.',
    cost: 200,
    icon: '👒',
    category: 'theme',
    details: 'Equipped to Eco-Buddy.',
  },
];

// Tournament interface
interface Tournament {
  id: string;
  title: string;
  description: string;
  icon: string;
  daysLeft: number;
  joined: boolean;
  participants: number;
  userRank: number;
  totalPool: string;
  standings: { rank: number; name: string; score: number; you?: boolean }[];
}

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    title: 'Kindred Global Cup',
    description:
      'The ultimate monthly tournament. Save the most CO₂ to win real-world offset credits.',
    icon: '🏆',
    daysLeft: 4,
    joined: false,
    participants: 1259,
    userRank: 42,
    totalPool: '5,000 kg CO₂ offsets',
    standings: [
      { rank: 1, name: 'Priya S.', score: 482 },
      { rank: 2, name: 'Luca M.', score: 421 },
      { rank: 3, name: 'Emma R.', score: 374 },
      { rank: 42, name: 'You', score: 152, you: true },
    ],
  },
  {
    id: 't2',
    title: 'Clean Commuter Battle',
    description: 'Weekly transit efficiency challenge. Walk, bike, or use electric transit.',
    icon: '🚴',
    daysLeft: 2,
    joined: false,
    participants: 412,
    userRank: 18,
    totalPool: '1,500 points',
    standings: [
      { rank: 1, name: 'Alex K.', score: 95 },
      { rank: 2, name: 'Sora Y.', score: 88 },
      { rank: 3, name: 'Mei L.', score: 82 },
      { rank: 18, name: 'You', score: 32, you: true },
    ],
  },
];

const AchievementsScreen = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const ecosystem = useSelector(
    (state: RootState) =>
      state.carbon?.ecosystem ?? {
        health: 0.5,
        treeCount: 0,
        biodiversity: 0.3,
        waterClarity: 0.5,
        airQuality: 0.5,
        lastUpdated: '',
      },
  );

  // Tabs
  const [activeTab, setActiveTab] = useState<'badges' | 'buddy' | 'store' | 'tournaments'>(
    'badges',
  );

  // Gamification Data State
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserAchievementStats | null>(null);

  // Custom spent/joined points tracking state
  const [purchasedRewardIds, setPurchasedRewardIds] = useState<string[]>([]);
  const [joinedTournamentIds, setJoinedTournamentIds] = useState<string[]>([]);
  const [ecoBuddyPointsSpent, setEcoBuddyPointsSpent] = useState<number>(0);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const growthScale = useRef(new Animated.Value(ecosystem.health)).current;

  // Sync growth animation when ecosystem health changes
  useEffect(() => {
    Animated.spring(growthScale, {
      toValue: Math.max(0.3, ecosystem.health),
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [ecosystem.health, growthScale]);

  // Load baseline statistics and storage state
  const loadData = async () => {
    try {
      const allBadges = achievementSystem.getAllBadges();
      setBadges(allBadges);

      const achievements = achievementSystem.getUserAchievements();
      setUserAchievements(achievements);

      const stats = achievementSystem.getUserStats();
      setUserStats(stats);

      // Load purchased rewards
      const savedPurchased = await AsyncStorage.getItem('purchased_reward_ids');
      if (savedPurchased) {
        setPurchasedRewardIds(JSON.parse(savedPurchased));
      }

      // Load joined tournaments
      const savedTournaments = await AsyncStorage.getItem('joined_tournament_ids');
      if (savedTournaments) {
        setJoinedTournamentIds(JSON.parse(savedTournaments));
      }

      // Load points spent on buddy interactions
      const savedBuddyPoints = await AsyncStorage.getItem('eco_buddy_points_spent');
      if (savedBuddyPoints) {
        setEcoBuddyPointsSpent(parseInt(savedBuddyPoints, 10));
      }
    } catch (e) {
      console.warn('Error loading gamification storage data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Point Math: Default baseline starting points to 1500 for demonstration purposes
  const totalEarnedPoints = Math.max(userStats?.totalPoints ?? 0, 1500);
  const rewardsCostSpent = STORE_ITEMS.reduce((sum, item) => {
    if (purchasedRewardIds.includes(item.id)) {
      return sum + item.cost;
    }
    return sum;
  }, 0);
  const totalSpentPoints = rewardsCostSpent + ecoBuddyPointsSpent;
  const pointsBalance = Math.max(0, totalEarnedPoints - totalSpentPoints);

  // Water Eco-Buddy handler
  const handleWaterBuddy = async () => {
    if (pointsBalance < 50) {
      HapticFeedbackService.triggerError();
      showToast('Insufficient points balance! Earn more badges first.', 'warning');
      return;
    }

    HapticFeedbackService.triggerSuccess();
    const newHealth = Math.min(1.0, ecosystem.health + 0.1);
    dispatch(updateEcosystem({ health: newHealth }));

    const newSpent = ecoBuddyPointsSpent + 50;
    setEcoBuddyPointsSpent(newSpent);
    await AsyncStorage.setItem('eco_buddy_points_spent', newSpent.toString());

    // Trigger local scale bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    showToast('💧 Watered Eco-Buddy! Health improved by 10%.', 'success');
  };

  // Plant Seedling handler
  const handlePlantSeedling = async () => {
    if (pointsBalance < 150) {
      HapticFeedbackService.triggerError();
      showToast('Insufficient points balance!', 'warning');
      return;
    }

    HapticFeedbackService.triggerSuccess();
    const newHealth = Math.min(1.0, ecosystem.health + 0.15);
    const newTreeCount = ecosystem.treeCount + 1;
    dispatch(updateEcosystem({ health: newHealth, treeCount: newTreeCount }));

    const newSpent = ecoBuddyPointsSpent + 150;
    setEcoBuddyPointsSpent(newSpent);
    await AsyncStorage.setItem('eco_buddy_points_spent', newSpent.toString());

    showToast('🌳 Seedling planted! Tree count increased.', 'success');
  };

  // Nurture Biodiversity handler
  const handleNurtureBiodiversity = async () => {
    if (pointsBalance < 100) {
      HapticFeedbackService.triggerError();
      showToast('Insufficient points balance!', 'warning');
      return;
    }

    HapticFeedbackService.triggerSuccess();
    const newBiodiversity = Math.min(1.0, ecosystem.biodiversity + 0.12);
    dispatch(updateEcosystem({ biodiversity: newBiodiversity }));

    const newSpent = ecoBuddyPointsSpent + 100;
    setEcoBuddyPointsSpent(newSpent);
    await AsyncStorage.setItem('eco_buddy_points_spent', newSpent.toString());

    showToast('🐝 Nurtured biodiversity in your local region!', 'success');
  };

  // Redeem reward store item handler
  const handleRedeemReward = async (item: StoreItem) => {
    if (purchasedRewardIds.includes(item.id)) {
      HapticFeedbackService.triggerSelection();
      Alert.alert(item.title, `You already redeemed this item.\n\nDetails: ${item.details}`);
      return;
    }

    if (pointsBalance < item.cost) {
      HapticFeedbackService.triggerError();
      showToast(`Need ${item.cost} points to redeem this item.`, 'warning');
      return;
    }

    Alert.alert('Confirm Redemption', `Redeem "${item.title}" for ${item.cost} points?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Redeem',
        onPress: async () => {
          HapticFeedbackService.triggerSuccess();
          const updatedPurchases = [...purchasedRewardIds, item.id];
          setPurchasedRewardIds(updatedPurchases);
          await AsyncStorage.setItem('purchased_reward_ids', JSON.stringify(updatedPurchases));
          showToast(`🎉 Redeemed ${item.title}!`, 'success');
        },
      },
    ]);
  };

  // Join Tournament handler
  const handleJoinTournament = async (tId: string) => {
    if (joinedTournamentIds.includes(tId)) {
      showToast('You are already registered for this tournament!', 'info');
      return;
    }

    HapticFeedbackService.triggerSuccess();
    const updatedTournaments = [...joinedTournamentIds, tId];
    setJoinedTournamentIds(updatedTournaments);
    await AsyncStorage.setItem('joined_tournament_ids', JSON.stringify(updatedTournaments));
    showToast('🏁 Registered successfully! Standings are active.', 'success');
  };

  // RENDER SECTIONS
  const renderBadgesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Your Badge Collection</Text>
      <View style={styles.list}>
        {badges.map(badge => {
          const ach = userAchievements.find(ua => ua.badgeId === badge.id);
          const isCompleted = ach?.isCompleted ?? false;
          const currentProgress = ach?.progress?.current ?? 0;
          const targetProgress = ach?.progress?.target ?? badge.requirements.value;
          const progressPercent = Math.min(
            100,
            Math.round((currentProgress / targetProgress) * 100),
          );

          return (
            <GlassCard key={badge.id} style={[styles.card, !isCompleted && styles.cardLocked]}>
              <View style={[styles.iconWrapper, !isCompleted && styles.iconWrapperLocked]}>
                {isCompleted ? (
                  <Text style={styles.icon}>{badge.icon}</Text>
                ) : (
                  <Lock size={24} color='rgba(255,255,255,0.4)' />
                )}
              </View>
              <View style={styles.info}>
                <View style={styles.badgeHeader}>
                  <Text style={[styles.name, !isCompleted && styles.nameLocked]}>{badge.name}</Text>
                  <Text style={[styles.rarityLabel, { color: getRarityColor(badge.rarity) }]}>
                    {badge.rarity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.desc}>{badge.description}</Text>

                {isCompleted ? (
                  <View style={styles.rewardCompletedRow}>
                    <CheckCircle size={16} color='#38EF7D' weight='fill' />
                    <Text style={styles.pointsEarnedText}>
                      Completed (+{badge.rewards.points} pts)
                    </Text>
                  </View>
                ) : (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTextRow}>
                      <Text style={styles.progressText}>
                        {currentProgress} / {targetProgress}
                      </Text>
                      <Text style={styles.progressText}>{progressPercent}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                  </View>
                )}
              </View>
            </GlassCard>
          );
        })}
      </View>
    </View>
  );

  const renderBuddyTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Eco-Buddy & Habitat</Text>

      <GlassCard style={styles.buddyDisplayCard}>
        <Animated.View style={[styles.buddyPetContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={{ transform: [{ scale: growthScale }] }}>
            {/* Custom Premium SVG Render of Eco-buddy */}
            <Svg height='160' width='160' viewBox='0 0 100 100'>
              <Defs>
                <SvgLinearGradient id='potGrad' x1='0' y1='0' x2='1' y2='0'>
                  <Stop offset='0' stopColor='#a044ff' />
                  <Stop offset='1' stopColor='#6a11cb' />
                </SvgLinearGradient>
                <SvgLinearGradient id='leafGrad' x1='0' y1='0' x2='0' y2='1'>
                  <Stop offset='0' stopColor='#11998e' />
                  <Stop offset='1' stopColor='#38ef7d' />
                </SvgLinearGradient>
              </Defs>
              {/* Soil / Ground */}
              <Path d='M 10 85 Q 50 78 90 85 Q 50 92 10 85' fill='#4E3629' />
              {/* Pot */}
              <Path d='M 35 65 L 65 65 L 60 85 L 40 85 Z' fill='url(#potGrad)' />
              <Rect x='32' y='61' width='36' height='4' rx='2' fill='#c882ff' />
              {/* Plant Stem */}
              <Path d='M 50 62 Q 50 45 46 25 Q 50 35 52 62' fill='#38ef7d' />
              {/* Main Sprout Spire */}
              <Circle cx='45' cy='23' r='4' fill='#38ef7d' />
              {/* Leaves */}
              <Path d='M 47 45 Q 25 35 48 43 Z' fill='url(#leafGrad)' />
              <Path d='M 51 32 Q 72 25 51 30 Z' fill='url(#leafGrad)' />
              <Path d='M 48 53 Q 32 50 49 51 Z' fill='url(#leafGrad)' />
            </Svg>
          </Animated.View>

          <Text style={styles.buddyLevelText}>Level {userLevel(ecosystem.health)} Sproutling</Text>
          <Text style={styles.buddyStatusSub}>Water and nurture to help your habitat expand.</Text>
        </Animated.View>

        <View style={styles.statsMetricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{Math.round(ecosystem.health * 100)}%</Text>
            <Text style={styles.metricLabel}>Buddy Health</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{ecosystem.treeCount}</Text>
            <Text style={styles.metricLabel}>Trees Planted</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{Math.round(ecosystem.biodiversity * 100)}%</Text>
            <Text style={styles.metricLabel}>Biodiversity</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>Nurture Eco-Buddy</Text>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleWaterBuddy}>
          <Drop size={26} color='#56CCF2' weight='fill' />
          <Text style={styles.actionBtnTitle}>Water Buddy</Text>
          <Text style={styles.actionBtnCost}>50 pts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handlePlantSeedling}>
          <Tree size={26} color='#38EF7D' weight='fill' />
          <Text style={styles.actionBtnTitle}>Plant Tree</Text>
          <Text style={styles.actionBtnCost}>150 pts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleNurtureBiodiversity}>
          <Plant size={26} color='#F2C94C' weight='fill' />
          <Text style={styles.actionBtnTitle}>Biodiversity</Text>
          <Text style={styles.actionBtnCost}>100 pts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStoreTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.storeHeaderRow}>
        <Text style={styles.sectionTitle}>Rewards Marketplace</Text>
        <GlassCard style={styles.balancePill}>
          <Coins size={18} color='#FFD700' weight='fill' />
          <Text style={styles.balanceText}>{pointsBalance} pts</Text>
        </GlassCard>
      </View>
      <Text style={styles.storeSubtitle}>
        Redeem achievements points for dynamic upgrades & prizes
      </Text>

      <View style={styles.storeList}>
        {STORE_ITEMS.map(item => {
          const isRedeemed = purchasedRewardIds.includes(item.id);
          return (
            <GlassCard key={item.id} style={styles.storeItemCard}>
              <View style={styles.storeItemIconBox}>
                <Text style={styles.storeItemEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.storeItemInfo}>
                <Text style={styles.storeItemTitle}>{item.title}</Text>
                <Text style={styles.storeItemDesc}>{item.description}</Text>
                <Text style={styles.storeItemCost}>{item.cost} points</Text>
              </View>
              <TouchableOpacity
                style={[styles.storeItemButton, isRedeemed && styles.storeItemButtonRedeemed]}
                onPress={() => handleRedeemReward(item)}
              >
                <Text style={styles.storeItemButtonText}>{isRedeemed ? 'Redeemed' : 'Claim'}</Text>
              </TouchableOpacity>
            </GlassCard>
          );
        })}
      </View>
    </View>
  );

  const renderTournamentsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Climate Tournaments</Text>
      <Text style={styles.storeSubtitle}>
        Participate in active leagues and win physical rewards.
      </Text>

      {INITIAL_TOURNAMENTS.map(t => {
        const isJoined = joinedTournamentIds.includes(t.id);
        return (
          <GlassCard key={t.id} style={styles.tournamentCard}>
            <View style={styles.tournamentHeader}>
              <Text style={styles.tournamentIcon}>{t.icon}</Text>
              <View style={styles.tournamentMeta}>
                <Text style={styles.tournamentTitle}>{t.title}</Text>
                <Text style={styles.tournamentDaysLeft}>⏳ {t.daysLeft} days left</Text>
              </View>
              <TouchableOpacity
                style={[styles.joinButton, isJoined && styles.joinButtonJoined]}
                onPress={() => handleJoinTournament(t.id)}
              >
                <Text style={styles.joinButtonText}>{isJoined ? 'Registered' : 'Join'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.tournamentDesc}>{t.description}</Text>

            <View style={styles.tournamentPoolRow}>
              <Text style={styles.poolLabel}>Reward Pool:</Text>
              <Text style={styles.poolValue}>{t.totalPool}</Text>
            </View>

            <Text style={styles.standingsHeader}>Standings Preview</Text>
            {t.standings.map(row => (
              <View key={row.rank} style={[styles.standingRow, row.you && styles.standingRowYou]}>
                <Text style={styles.standingRank}>#{row.rank}</Text>
                <Text style={styles.standingName}>{row.name}</Text>
                <Text style={styles.standingScore}>{row.score} pts</Text>
              </View>
            ))}
          </GlassCard>
        );
      })}
    </View>
  );

  // Helper functions
  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return '#9CA3AF';
      case 'uncommon':
        return '#10B981';
      case 'rare':
        return '#3B82F6';
      case 'epic':
        return '#8B5CF6';
      case 'legendary':
        return '#F59E0B';
      default:
        return '#9CA3AF';
    }
  };

  const userLevel = (health: number) => {
    if (health < 0.4) return 1;
    if (health < 0.7) return 2;
    if (health < 0.9) return 3;
    return 4;
  };

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
        <View style={styles.headerTitleRow}>
          <Trophy size={36} color='#FFD700' weight='duotone' />
          <Text style={styles.title}>Gamification Center</Text>
        </View>
        <Text style={styles.subtitle}>Unlock achievements and nurture your eco buddy</Text>
      </View>

      {/* Frosted Tab Bar */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'badges' && styles.tabButtonActive]}
            onPress={() => setActiveTab('badges')}
          >
            <Trophy size={16} color={activeTab === 'badges' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <Text
              style={[styles.tabButtonText, activeTab === 'badges' && styles.tabButtonTextActive]}
            >
              Badges
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'buddy' && styles.tabButtonActive]}
            onPress={() => setActiveTab('buddy')}
          >
            <Plant size={16} color={activeTab === 'buddy' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <Text
              style={[styles.tabButtonText, activeTab === 'buddy' && styles.tabButtonTextActive]}
            >
              Eco-Buddy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'store' && styles.tabButtonActive]}
            onPress={() => setActiveTab('store')}
          >
            <ShoppingCart
              size={16}
              color={activeTab === 'store' ? '#fff' : 'rgba(255,255,255,0.6)'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'store' && styles.tabButtonTextActive]}
            >
              Store
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tournaments' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tournaments')}
          >
            <Users
              size={16}
              color={activeTab === 'tournaments' ? '#fff' : 'rgba(255,255,255,0.6)'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'tournaments' && styles.tabButtonTextActive,
              ]}
            >
              Leagues
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {activeTab === 'badges' && renderBadgesTab()}
        {activeTab === 'buddy' && renderBuddyTab()}
        {activeTab === 'store' && renderStoreTab()}
        {activeTab === 'tournaments' && renderTournamentsTab()}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2027' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  scrollView: { flex: 1 },
  bottomSpacer: { height: 120 },

  // Tab Bar
  tabContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabScroll: {
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  tabButtonActive: {
    backgroundColor: '#38EF7D',
    borderColor: '#38ef7d',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  tabButtonTextActive: {
    color: '#fff',
  },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },

  tabContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 12,
  },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardLocked: {
    opacity: 0.6,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(56,239,125,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconWrapperLocked: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  icon: { fontSize: 26 },
  info: { flex: 1 },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  nameLocked: { color: 'rgba(255,255,255,0.6)' },
  rarityLabel: { fontSize: 10, fontWeight: '800' },
  desc: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },

  rewardCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsEarnedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38EF7D',
  },

  // Progress bar
  progressContainer: {
    marginTop: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38EF7D',
    borderRadius: 3,
  },

  // Eco-Buddy
  buddyDisplayCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  buddyPetContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buddyLevelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  buddyStatusSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  statsMetricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 16,
    width: '100%',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38EF7D',
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },

  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionBtnCost: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F2C94C',
  },

  // Store
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  storeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
    marginTop: -8,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.3)',
    borderWidth: 1,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  storeList: {
    gap: 12,
  },
  storeItemCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  storeItemIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeItemEmoji: {
    fontSize: 24,
  },
  storeItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  storeItemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  storeItemDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  storeItemCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F2C94C',
  },
  storeItemButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(56,239,125,0.15)',
    borderColor: '#38EF7D',
    borderWidth: 1,
    borderRadius: 8,
  },
  storeItemButtonRedeemed: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  storeItemButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38EF7D',
  },

  // Tournaments
  tournamentCard: {
    padding: 16,
    marginBottom: 16,
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tournamentIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tournamentMeta: {
    flex: 1,
  },
  tournamentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  tournamentDaysLeft: {
    fontSize: 12,
    color: '#FF416C',
    fontWeight: '600',
  },
  joinButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#38EF7D',
    borderRadius: 8,
  },
  joinButtonJoined: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f2027',
  },
  tournamentDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    marginBottom: 12,
  },
  tournamentPoolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  poolLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  poolValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F2C94C',
  },
  standingsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  standingRowYou: {
    backgroundColor: 'rgba(56,239,125,0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  standingRank: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    width: 32,
    fontWeight: '600',
  },
  standingName: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
  },
  standingScore: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default AchievementsScreen;
