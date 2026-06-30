import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
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
} from 'phosphor-react-native';

import type { RootState } from '../../store';
import { updateFootprint } from '../../store/slices/carbonSlice';
import { useClimateNotifications } from '../../hooks/useClimateNotifications';
import { spatialColors, animations } from '../../theme/theme';

const { width: screenWidth } = Dimensions.get('window');

const GlassCard = ({ style, children }: any) => (
  <View
    style={[
      style,
      {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        overflow: 'hidden',
      },
    ]}
  >
    {children}
  </View>
);

const HomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const carbon = useSelector((state: RootState) => state.carbon);
  const footprint = carbon?.footprint || {
    total: 0,
    transportation: 0,
    food: 0,
    energy: 0,
    waste: 0,
  };
  const error = carbon?.error || null;
  const user = useSelector((state: RootState) => state.user);
  const profile = user?.profile || {
    id: '',
    name: '',
    email: '',
    avatar: null,
    bio: null,
  };

  const handleAddActivity = (type: string, amount: number) => {
    dispatch(
      updateFootprint({
        [type]: footprint[type as keyof typeof footprint] + amount,
      }),
    );
  };

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

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <Svg height='100%' width='100%' style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id='bgGrad' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor='#0A0E12' stopOpacity='1' />
            <Stop offset='0.5' stopColor='#12181F' stopOpacity='1' />
            <Stop offset='1' stopColor='#0A0E12' stopOpacity='1' />
          </SvgLinearGradient>
        </Defs>
        <Rect x='0' y='0' width='100%' height='100%' fill='url(#bgGrad)' />
      </Svg>

      {/* Animated Ambient Glow Blobs */}
      <MotiView
        from={{ translateX: -60, translateY: 100, scale: 0.9, opacity: 0.05 }}
        animate={{
          translateX: -30,
          translateY: 130,
          scale: 1.1,
          opacity: 0.08,
        }}
        transition={
          {
            loop: true,
            type: 'timing',
            duration: 8000,
            repeatReverse: true,
          } as any
        }
        style={[styles.ambientBlob, { top: '10%', left: -50, backgroundColor: '#11998E' }]}
      />
      <MotiView
        from={{ translateX: 80, translateY: -50, scale: 1.1, opacity: 0.03 }}
        animate={{
          translateX: 40,
          translateY: -20,
          scale: 0.95,
          opacity: 0.06,
        }}
        transition={
          {
            loop: true,
            type: 'timing',
            duration: 10000,
            repeatReverse: true,
          } as any
        }
        style={[styles.ambientBlob, { top: '35%', right: -80, backgroundColor: statusColors[0] }]}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                Welcome back{profile.name ? `, ${profile.name}` : ''}
              </Text>
            </View>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name.substring(0, 1).toUpperCase() : 'K'}
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

        {/* Gamified Eco-Milestones */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E12',
  },
  ambientBlob: {
    width: 260,
    height: 260,
    borderRadius: 130,
    position: 'absolute',
    filter: 'blur(80px)', // Will fallback to border/shadow glow natively on older OS
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

export default HomeScreen;
