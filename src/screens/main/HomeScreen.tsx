import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';
import { useCarbon, useSDG } from '../../hooks/useFirebaseData';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../contexts/ToastContext';
import Svg, {
  LinearGradient as SvgLinearGradient,
  Defs,
  Stop,
  Rect,
  Circle,
  Path,
} from 'react-native-svg';
import { MotiView } from 'moti';
import {
  Leaf,
  Car,
  ForkKnife,
  Lightbulb,
  Trash,
  Camera,
  ShieldCheck,
  Cpu,
  ChartBar,
  GraduationCap,
  Tree,
  ArrowUpRight,
  Sparkle,
  Trophy,
  Lightning,
  Drop,
  Wind,
  Buildings,
} from 'phosphor-react-native';
import { TouchableOpacity, Alert } from 'react-native';

import { useClimateNotifications } from '../../hooks/useClimateNotifications';
import { spatialColors, animations } from '../../theme/theme';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';

// ─── SDG Badge definitions ────────────────────────────────────────────────────
const SDG_BADGES = [
  {
    key: 'sdg7',
    number: '07',
    label: 'Clean Energy',
    emoji: '⚡',
    color: '#FF9500',
    detail:
      'SDG 7: Ensure access to affordable, reliable, sustainable and modern energy for all. Every kWh you save or generate from clean sources counts.',
  },
  {
    key: 'sdg11',
    number: '11',
    label: 'Sustainable Cities',
    emoji: '🏙️',
    color: '#FF6B35',
    detail:
      'SDG 11: Make cities inclusive, safe, resilient and sustainable. Choosing public transit, cycling, or walking directly contributes to this goal.',
  },
  {
    key: 'sdg12',
    number: '12',
    label: 'Responsible Consumption',
    emoji: '♻️',
    color: '#F2C94C',
    detail:
      'SDG 12: Ensure sustainable consumption and production patterns. Thrift shopping, recycling, and reducing food waste all move the needle here.',
  },
  {
    key: 'sdg13',
    number: '13',
    label: 'Climate Action',
    emoji: '🌡️',
    color: '#2B86FA',
    detail:
      'SDG 13: Take urgent action to combat climate change and its impacts. Every kg CO₂ you avoid logging directly contributes to this goal.',
  },
  {
    key: 'sdg15',
    number: '15',
    label: 'Life on Land',
    emoji: '🌱',
    color: '#38EF7D',
    detail:
      'SDG 15: Protect, restore and promote sustainable use of terrestrial ecosystems. Vegan meals and plant-based choices protect biodiversity.',
  },
];

const { width: screenWidth } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  const carbon = useCarbon();
  const sdg = useSDG();

  // ── Rewarded ad hook & consent ──────────────────────────────────────
  const { isLoaded, isWatched, show, adError } = useRewardedAd();
  const { preferences } = useAppStore();
  const { showToast } = useToast();
  const [adRequested, setAdRequested] = useState(false);

  // Extract needed data from hooks
  const totalCarbon = carbon.currentFootprint?.total ?? 0;
  const currentTotalScore = sdg.esg?.total ?? 0;

  const currentLevel = Math.floor(totalCarbon / 100) + 1;
  const currentXP = totalCarbon % 100;

  let user: any = null;
  try {
    user = auth().currentUser;
  } catch {
    // Firebase not initialized in local dev without credentials
  }
  const profileName = user?.displayName || 'Eco Explorer';
  const esg = (sdg as any)?.esg ?? {
    total: 0,
    grade: 'C',
    breakdown: { environmental: 0, social: 0, governance: 0 },
  };
  const sdgProgress = (sdg as any)?.progress ?? {};
  const footprint = (carbon as any)?.footprint || {
    total: 0,
    transportation: 0,
    food: 0,
    energy: 0,
    waste: 0,
  };
  const error = (carbon as any)?.error || null;

  const handleAddActivity = (type: string, amount: number) => {
    if (!preferences.consentAccepted) {
      return;
    }

    Alert.alert(
      'Activity Logged! 🌱',
      'Want to multiply your impact? Watch a short ad to donate $0.50!',
      [
        { text: 'Maybe Later', style: 'cancel' },
        {
          text: 'Watch & Donate',
          style: 'default',
          onPress: () => {
            if (isLoaded) {
              setAdRequested(true);
              show();
            } else {
              showToast('Ad not ready yet — try again in a moment.', 'warning');
            }
          },
        },
      ],
    );
  };

  // ── Ad completion → claim reward via Cloud Function ────────────────
  useEffect(() => {
    if (!isWatched || !adRequested) return;

    setAdRequested(false);

    const claimReward = async () => {
      try {
        const callable = functions().httpsCallable('onAdRewardVerified');
        const result = await callable();
        const data = result.data as { success: boolean; amountCents: number };
        if (data.success) {
          const dollars = (data.amountCents / 100).toFixed(2);
          showToast(`Ad complete! $${dollars} donated to climate action! 🌍`, 'success');
        }
      } catch (err: any) {
        const msg = err?.message || 'Failed to claim ad reward.';
        showToast(msg, 'error');
      }
    };

    claimReward();
  }, [isWatched, adRequested, showToast]);

  useClimateNotifications({ lat: 40.7128, lng: -74.006 });

  const getCarbonStatusColor = () => {
    if (footprint.total < 10) return ['#38EF7D', '#11998E']; // Good (Green)
    if (footprint.total < 20) return ['#F2C94C', '#F2994A']; // Medium (Yellow)
    return ['#FF416C', '#FF4B2B']; // High (Red)
  };

  const statusColors = getCarbonStatusColor();

  // Progress gauge calculations
  const targetTotal = 15; // daily limit target
  const percentage = Math.min(footprint.total / targetTotal, 1.0);
  const radius = 68;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1.0 - percentage);

  // Weekly Trend Chart Data
  const weeklyData = [6.2, 8.4, 7.1, 5.5, 9.2, 4.8, footprint.total];
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...weeklyData, 10);
  const chartWidth = screenWidth - 80;
  const chartHeight = 80;

  const points = weeklyData.map((val, index) => {
    const x = (index / 6) * chartWidth;
    const y = chartHeight - 8 - (val / maxVal) * (chartHeight - 16);
    return { x, y };
  });

  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x} ${points[i].y}`;
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${
    points[0].x
  } ${chartHeight} Z`;

  // Get current logged count estimates (based on category values)
  const getLogCount = (type: string, increment: number) => {
    const totalVal = footprint[type as keyof typeof footprint] || 0;
    return Math.round(totalVal / increment);
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <SpaceBackground earthPosition='top-right' enableComets={true} cometStyle='tapered'>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#FFFFFF'
            colors={['#38EF7D']}
          />
        }
      >
        {/* Header Section */}
        <MotiView
          from={{ opacity: 0, translateY: -15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={animations.spring.gentle}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>
                Welcome back{profileName ? `, ${profileName}` : ''}
              </Text>
            </View>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profileName ? profileName.substring(0, 1).toUpperCase() : 'K'}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Circular Progress Gauge */}
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...animations.spring.bouncy, delay: 100 }}
          style={styles.gaugeContainer}
        >
          <GlassCard style={styles.gaugeCard}>
            <View style={styles.gaugeInner}>
              <View style={styles.ringWrapper}>
                <Svg width={160} height={160} viewBox='0 0 160 160'>
                  <Defs>
                    <SvgLinearGradient id='gaugeColors' x1='0' y1='0' x2='1' y2='1'>
                      <Stop offset='0' stopColor={statusColors[0]} />
                      <Stop offset='1' stopColor={statusColors[1]} />
                    </SvgLinearGradient>
                  </Defs>
                  {/* Background Circle */}
                  <Circle
                    cx={80}
                    cy={80}
                    r={radius}
                    stroke='rgba(255, 255, 255, 0.04)'
                    strokeWidth={strokeWidth}
                    fill='transparent'
                  />
                  {/* Progress Circle */}
                  <Circle
                    cx={80}
                    cy={80}
                    r={radius}
                    stroke='url(#gaugeColors)'
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap='round'
                    fill='transparent'
                    transform='rotate(-90 80 80)'
                  />
                </Svg>

                {/* Center Content */}
                <View style={styles.gaugeTextContainer}>
                  <Text style={styles.totalValText}>{footprint.total.toFixed(1)}</Text>
                  <Text style={styles.totalUnitText}>kg CO₂</Text>
                </View>
              </View>

              <View style={styles.gaugeLabelContainer}>
                <Text style={styles.gaugeTitle}>Daily Footprint</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[0] + '20' }]}>
                  <Leaf
                    size={12}
                    color={statusColors[0]}
                    weight='fill'
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.statusText, { color: statusColors[0] }]}>
                    {footprint.total < 10
                      ? 'On Track'
                      : footprint.total < 20
                        ? 'Moderate'
                        : 'High Alert'}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        {/* ── ESG Rating Card ───────────────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 130 }}
        >
          <GlassCard style={homeStyles.esgCard}>
            <View style={homeStyles.esgHeader}>
              <View>
                <Text style={homeStyles.esgLabel}>Your ESG Rating</Text>
                <Text style={homeStyles.esgSub}>Environmental · Social · Governance</Text>
              </View>
              <View style={homeStyles.esgGradeBubble}>
                <Text style={homeStyles.esgGradeText}>{(esg as any)?.grade}</Text>
              </View>
            </View>

            {/* E / S / G bars */}
            {(
              [
                {
                  key: 'E',
                  label: 'Environmental',
                  value: (esg as any)?.breakdown?.environmental ?? 0,
                  color: '#38EF7D',
                },
                {
                  key: 'S',
                  label: 'Social',
                  value: (esg as any)?.breakdown?.social ?? 0,
                  color: '#2B86FA',
                },
                {
                  key: 'G',
                  label: 'Governance',
                  value: (esg as any)?.breakdown?.governance ?? 0,
                  color: '#F2C94C',
                },
              ] as const
            ).map(bar => (
              <View key={bar.key} style={homeStyles.esgBarRow}>
                <Text style={homeStyles.esgBarKey}>{bar.key}</Text>
                <View style={homeStyles.esgBarTrack}>
                  <View
                    style={[
                      homeStyles.esgBarFill,
                      { width: `${bar.value}%`, backgroundColor: bar.color },
                    ]}
                  />
                </View>
                <Text style={homeStyles.esgBarPct}>{bar.value}</Text>
              </View>
            ))}

            <Text style={homeStyles.esgHint}>Log eco-actions to raise your score 🌍</Text>
          </GlassCard>
        </MotiView>

        {/* ── SDG Impact Badges ─────────────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 160 }}
        >
          <View style={homeStyles.sdgSection}>
            <Text style={homeStyles.sdgSectionTitle}>🌐 Your SDG Impact</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={homeStyles.sdgScroll}
            >
              {SDG_BADGES.map(badge => {
                const contrib = sdgProgress[badge.key as keyof typeof sdgProgress];
                const actions = contrib?.actionsCount ?? 0;
                const kg = contrib?.co2SavedKg ?? 0;
                return (
                  <TouchableOpacity
                    key={badge.key}
                    style={[homeStyles.sdgBadge, { borderColor: badge.color }]}
                    activeOpacity={0.75}
                    onPress={() =>
                      Alert.alert(
                        `SDG ${badge.number} — ${badge.label}`,
                        `${badge.detail}\n\nYour contribution:\n• ${actions} action${actions !== 1 ? 's' : ''} logged\n• ${kg.toFixed(2)} kg CO₂ saved`,
                        [{ text: 'Keep Going 🌱', style: 'default' }],
                      )
                    }
                  >
                    <Text style={homeStyles.sdgBadgeEmoji}>{badge.emoji}</Text>
                    <View style={[homeStyles.sdgBadgeNumBubble, { backgroundColor: badge.color }]}>
                      <Text style={homeStyles.sdgBadgeNum}>{badge.number}</Text>
                    </View>
                    <Text
                      style={[homeStyles.sdgBadgeLabel, { color: badge.color }]}
                      numberOfLines={2}
                    >
                      {badge.label}
                    </Text>
                    <Text style={homeStyles.sdgBadgeCount}>
                      {actions} action{actions !== 1 ? 's' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 150 }}
        >
          <GlassCard style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <View style={styles.milestoneTitleContainer}>
                <Sparkle size={18} color='#FFD700' weight='fill' />
                <Text style={styles.milestoneTitle}>Active Milestone</Text>
              </View>
              <Text style={styles.milestoneTarget}>Goal: &lt; 10 kg</Text>
            </View>
            <Text style={styles.milestoneDesc}>
              Keep daily carbon under 10 kg to earn a seedling certificate!
            </Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.max(0, Math.min(100, (footprint.total / 10) * 100))}%`,
                      backgroundColor: footprint.total > 10 ? '#FF416C' : '#38EF7D',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(Math.min(100, (footprint.total / 10) * 100))}% Used
              </Text>
            </View>
          </GlassCard>
        </MotiView>

        {/* Log Activity Action Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log Activity</Text>
          <View style={styles.actionGrid}>
            {[
              {
                icon: Car,
                label: 'Drive',
                value: 2.5,
                type: 'transportation',
                color: '#FF9A9E',
              },
              {
                icon: ForkKnife,
                label: 'Meat Meal',
                value: 1.2,
                type: 'food',
                color: '#FECFEF',
              },
              {
                icon: Lightbulb,
                label: 'Energy',
                value: 3.1,
                type: 'energy',
                color: '#A18CD1',
              },
              {
                icon: Trash,
                label: 'Waste',
                value: 0.8,
                type: 'waste',
                color: '#84FAB0',
              },
            ].map((item, index) => {
              const logsToday = getLogCount(item.type, item.value);
              return (
                <MotiView
                  key={item.label}
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    ...animations.spring.bouncy,
                    delay: 200 + index * 50,
                  }}
                  style={styles.gridCardWrapper}
                >
                  <Pressable onPress={() => handleAddActivity(item.type, item.value)}>
                    {({ pressed }) => (
                      <MotiView
                        animate={{ scale: pressed ? 0.95 : 1 }}
                        transition={animations.timing.quick}
                      >
                        <GlassCard style={styles.actionButton}>
                          <View
                            style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}
                          >
                            <item.icon size={20} color={item.color} weight='duotone' />
                          </View>
                          <Text style={styles.actionLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                          <Text style={styles.actionValue}>+{item.value} kg</Text>

                          <View
                            style={[
                              styles.badgeContainer,
                              {
                                backgroundColor:
                                  logsToday > 0 ? item.color + '25' : 'rgba(255,255,255,0.05)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                {
                                  color: logsToday > 0 ? item.color : 'rgba(255,255,255,0.4)',
                                },
                              ]}
                            >
                              {logsToday > 0 ? `${logsToday}x log` : 'Tap to log'}
                            </Text>
                          </View>
                        </GlassCard>
                      </MotiView>
                    )}
                  </Pressable>
                </MotiView>
              );
            })}
          </View>
        </View>

        {/* Weekly Trend Chart */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 350 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Weekly Trend</Text>
          <GlassCard style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartPeriod}>Last 7 Days</Text>
                <Text style={styles.chartAvg}>
                  Avg: {(weeklyData.reduce((a, b) => a + b, 0) / 7).toFixed(1)} kg CO₂
                </Text>
              </View>
              <ChartBar size={20} color='rgba(255,255,255,0.5)' />
            </View>

            <View style={styles.svgWrapper}>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <SvgLinearGradient id='chartGrad' x1='0' y1='0' x2='0' y2='1'>
                    <Stop offset='0' stopColor={statusColors[0]} stopOpacity='0.25' />
                    <Stop offset='1' stopColor={statusColors[0]} stopOpacity='0.00' />
                  </SvgLinearGradient>
                </Defs>

                {/* Area under the line */}
                <Path d={areaPath} fill='url(#chartGrad)' />

                {/* Trend line */}
                <Path d={linePath} fill='none' stroke={statusColors[0]} strokeWidth={3} />

                {/* Data points */}
                {points.map((pt, i) => (
                  <Circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill='#fff'
                    stroke={statusColors[0]}
                    strokeWidth={2.5}
                  />
                ))}
              </Svg>
            </View>

            {/* Days Label Row */}
            <View style={styles.daysRow}>
              {daysOfWeek.map((day, i) => (
                <Text
                  key={day}
                  style={[
                    styles.dayLabel,
                    i === 6 && { color: statusColors[0], fontWeight: '700' },
                  ]}
                >
                  {day}
                </Text>
              ))}
            </View>
          </GlassCard>
        </MotiView>

        {/* Masterpiece Features */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Masterpiece Features</Text>
          <View style={styles.featureList}>
            {[
              { icon: Cpu, label: 'Carbon Twin', route: 'CarbonTwin' },
              {
                icon: Camera,
                label: 'AI Vision Scanner',
                route: 'VisionCamera',
              },
              {
                icon: ShieldCheck,
                label: 'Community Verify',
                route: 'Verification',
              },
              {
                icon: ChartBar,
                label: 'Advanced Analytics',
                route: 'Analytics',
              },
              {
                icon: GraduationCap,
                label: 'Climate Academy',
                route: 'LearningCenter',
              },
              { icon: Tree, label: 'Carbon Offsetting', route: 'Offset' },
            ].map((feat, index) => (
              <Pressable key={feat.label} onPress={() => navigation.navigate(feat.route)}>
                {({ pressed }) => (
                  <MotiView
                    animate={{ scale: pressed ? 0.98 : 1 }}
                    transition={animations.timing.quick}
                  >
                    <GlassCard style={styles.featureRow}>
                      <View style={styles.featureIconWrap}>
                        <feat.icon size={20} color='#fff' weight='duotone' />
                      </View>
                      <Text style={styles.featureRowText}>{feat.label}</Text>
                      <ArrowUpRight
                        size={16}
                        color='rgba(255,255,255,0.3)'
                        style={styles.arrowIcon}
                      />
                    </GlassCard>
                  </MotiView>
                )}
              </Pressable>
            ))}
          </View>
        </MotiView>

        {error && (
          <GlassCard style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </GlassCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E12',
  },
  earthBackground: {
    position: 'absolute',
    top: 70,
    right: -80,
    width: 260,
    height: 260,
    opacity: 0.22,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  gaugeContainer: {
    marginBottom: 20,
  },
  gaugeCard: {
    borderRadius: 24,
  },
  gaugeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 24,
  },
  ringWrapper: {
    position: 'relative',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalValText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  totalUnitText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginTop: -2,
  },
  gaugeLabelContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  gaugeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  milestoneCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  milestoneTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  milestoneDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 16,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    minWidth: 45,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCardWrapper: {
    width: '48%',
  },
  actionButton: {
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  actionValue: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    width: '100%',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chartCard: {
    borderRadius: 20,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartPeriod: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  chartAvg: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 10,
  },
  dayLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
});

const homeStyles = StyleSheet.create({
  // ESG Card
  esgCard: { padding: 20, marginBottom: 16 },
  esgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  esgLabel: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  esgSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  esgGradeBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56,239,125,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56,239,125,0.3)',
  },
  esgGradeText: { fontSize: 18, fontWeight: '800', color: '#38EF7D' },
  esgBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  esgBarKey: { width: 14, fontSize: 14, fontWeight: '800', color: '#fff' },
  esgBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  esgBarFill: { height: '100%', borderRadius: 4 },
  esgBarPct: { width: 30, fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  esgHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // SDG Badges
  sdgSection: { marginBottom: 24, marginTop: 8 },
  sdgSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 16,
  },
  sdgScroll: { paddingHorizontal: 16, gap: 12 },
  sdgBadge: {
    width: 120,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sdgBadgeEmoji: { fontSize: 32, marginBottom: 4 },
  sdgBadgeNumBubble: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  sdgBadgeNum: { fontSize: 11, fontWeight: '800', color: '#0A0A0C' },
  sdgBadgeLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  sdgBadgeCount: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
});

export default HomeScreen;
