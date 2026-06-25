import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import {
  ChartLineUp,
  Target,
  Lightbulb,
  Car,
  ForkKnife,
  ShoppingBag,
  Trash,
  Lightning,
  Leaf,
  Drop,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  CaretLeft,
} from 'phosphor-react-native';
import { spatialColors, typography, animations } from '../../theme/theme';

const { width: SW } = Dimensions.get('window');

const GlassCard = ({ style, children }: any) => (
  <View
    style={[
      style,
      {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        overflow: 'hidden',
      },
    ]}
  >
    {children}
  </View>
);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const WEEKLY_DATA = [
  { day: 'Mon', kg: 12.4 },
  { day: 'Tue', kg: 9.8 },
  { day: 'Wed', kg: 14.2 },
  { day: 'Thu', kg: 7.5 },
  { day: 'Fri', kg: 11.1 },
  { day: 'Sat', kg: 6.3 },
  { day: 'Sun', kg: 8.7 },
];

const CATEGORIES = [
  {
    label: 'Transportation',
    icon: Car,
    kg: 28.4,
    total: 50,
    color: '#FF9A9E', // neon red/pink
  },
  {
    label: 'Food & Diet',
    icon: ForkKnife,
    kg: 21.7,
    total: 50,
    color: '#FECFEF',
  },
  {
    label: 'Home Energy',
    icon: Lightning,
    kg: 15.3,
    total: 50,
    color: '#F6D365',
  },
  {
    label: 'Shopping',
    icon: ShoppingBag,
    kg: 9.8,
    total: 50,
    color: '#A18CD1',
  },
  { label: 'Waste', icon: Trash, kg: 4.2, total: 50, color: '#84FAB0' },
];

const GOALS = [
  {
    label: 'Monthly target',
    current: 75.4,
    target: 60,
    unit: 'kg CO₂',
    icon: Target,
  },
  {
    label: 'Vegetarian days',
    current: 18,
    target: 25,
    unit: 'days',
    icon: Leaf,
  },
  {
    label: 'Water saved',
    current: 120,
    target: 200,
    unit: 'L',
    icon: Drop,
  },
  { label: 'Tree offsets', current: 3, target: 5, unit: 'trees', icon: Leaf },
];

const PREDICTIONS = [
  {
    label: 'By end of month',
    value: '94.7 kg',
    trend: '12% vs last month',
    bad: true,
  },
  {
    label: 'If you skip meat Mon–Wed',
    value: '81.2 kg',
    trend: '6% saving',
    bad: false,
  },
  {
    label: 'Projected annual',
    value: '1,136 kg',
    trend: 'vs 1.2t global avg',
    bad: false,
  },
];

// ─── Mini sparkline chart ─────────────────────────────────────────────────────
const Sparkline = ({ data }: { data: typeof WEEKLY_DATA }) => {
  const chartW = SW - 64;
  const chartH = 120;
  const maxKg = Math.max(...data.map(d => d.kg));
  const barWidth = chartW / data.length - 8;

  return (
    <View style={styles.chartContainer}>
      {data.map((d, i) => {
        const barH = (d.kg / maxKg) * (chartH - 30);
        const isMin = d.kg === Math.min(...data.map(x => x.kg));
        const isMax = d.kg === maxKg;

        return (
          <MotiView
            key={d.day}
            style={[styles.barWrapper, { width: barWidth }]}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ ...animations.spring.bouncy, delay: 300 + i * 50 }}
          >
            <Text style={styles.barValue}>{d.kg}</Text>
            <MotiView
              from={{ height: 0 }}
              animate={{ height: barH }}
              transition={{ ...animations.spring.gentle, delay: 400 + i * 50 }}
              style={[
                styles.bar,
                {
                  backgroundColor: isMin
                    ? '#34C759' // Green for min
                    : isMax
                    ? '#FF3B30' // Red for max
                    : 'rgba(255,255,255,0.2)', // Default glass
                },
              ]}
            />
            <Text style={styles.barDay}>{d.day}</Text>
          </MotiView>
        );
      })}
    </View>
  );
};

// ─── Category bar ─────────────────────────────────────────────────────────────
const CategoryBar = ({ item, index }: { item: (typeof CATEGORIES)[0]; index: number }) => {
  const pct = item.kg / item.total;
  return (
    <MotiView
      style={styles.catRow}
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ ...animations.spring.gentle, delay: 400 + index * 50 }}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <item.icon size={20} color={item.color} weight='duotone' />
      </View>
      <View style={styles.catInfo}>
        <View style={styles.catLabelRow}>
          <Text style={styles.catLabel}>{item.label}</Text>
          <Text style={[styles.catKg, { color: item.color }]}>{item.kg} kg</Text>
        </View>
        <View style={styles.catTrack}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${pct * 100}%` }}
            transition={{
              ...animations.spring.gentle,
              delay: 600 + index * 50,
            }}
            style={[styles.catFill, { backgroundColor: item.color }]}
          />
        </View>
      </View>
    </MotiView>
  );
};

// ─── Goal row ─────────────────────────────────────────────────────────────────
const GoalRow = ({ item, index }: { item: (typeof GOALS)[0]; index: number }) => {
  const pct = Math.min(item.current / item.target, 1);
  const done = pct >= 1;
  return (
    <MotiView
      style={styles.goalRow}
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...animations.spring.gentle, delay: 500 + index * 50 }}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: done ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      >
        <item.icon size={20} color={done ? '#34C759' : '#fff'} weight='duotone' />
      </View>
      <View style={styles.goalInfo}>
        <View style={styles.goalLabelRow}>
          <Text style={styles.goalLabel}>{item.label}</Text>
          <Text style={styles.goalValue}>
            {item.current} / {item.target} {item.unit}
          </Text>
        </View>
        <View style={styles.goalTrack}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${pct * 100}%` }}
            transition={{
              ...animations.spring.gentle,
              delay: 700 + index * 50,
            }}
            style={[
              styles.goalFill,
              {
                backgroundColor: done ? '#34C759' : '#0A84FF',
              },
            ]}
          />
        </View>
      </View>
      {done && <CheckCircle size={20} color='#34C759' weight='fill' style={{ marginLeft: 8 }} />}
    </MotiView>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const PERIODS = ['Week', 'Month', 'Year'];

const AnalyticsDashboardScreen = () => {
  const [period, setPeriod] = useState('Week');
  const navigation = useNavigation();
  const totalKg = WEEKLY_DATA.reduce((s, d) => s + d.kg, 0).toFixed(1);
  const avgKg = (WEEKLY_DATA.reduce((s, d) => s + d.kg, 0) / 7).toFixed(1);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <MotiView
          style={styles.header}
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={animations.spring.gentle}
        >
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <CaretLeft size={24} color={spatialColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Carbon Analytics</Text>
          </View>
          <Text style={styles.subtitle}>Track. Understand. Reduce.</Text>
        </MotiView>

        {/* Period toggle */}
        <MotiView
          style={styles.periodToggle}
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...animations.spring.bouncy, delay: 100 }}
        >
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </MotiView>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <MotiView
            style={{ flex: 1 }}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ ...animations.spring.gentle, delay: 150 }}
          >
            <GlassCard style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#0A84FF' }]}>{totalKg}</Text>
              <Text style={styles.summaryLabel}>kg CO₂ {period.toLowerCase()}</Text>
            </GlassCard>
          </MotiView>
          <MotiView
            style={{ flex: 1 }}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ ...animations.spring.gentle, delay: 200 }}
          >
            <GlassCard style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>{avgKg}</Text>
              <Text style={styles.summaryLabel}>kg avg / day</Text>
            </GlassCard>
          </MotiView>
          <MotiView
            style={{ flex: 1 }}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ ...animations.spring.gentle, delay: 250 }}
          >
            <GlassCard style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#BF5AF2' }]}>-8%</Text>
              <Text style={styles.summaryLabel}>vs last {period.toLowerCase()}</Text>
            </GlassCard>
          </MotiView>
        </View>

        {/* Vegan & Cruelty-Free Impact */}
        <MotiView
          style={{ marginHorizontal: 20, marginBottom: 20 }}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 280 }}
        >
          <GlassCard
            style={[
              styles.summaryCard,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
              },
            ]}
          >
            <View>
              <Text style={[styles.summaryValue, { color: '#38EF7D', fontSize: 28 }]}>1,450</Text>
              <Text style={[styles.summaryLabel, { marginTop: 4 }]}>Cruelty-Free Bonus Points</Text>
            </View>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(56, 239, 125, 0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Leaf size={24} color='#38EF7D' weight='duotone' />
            </View>
          </GlassCard>
        </MotiView>

        {/* Recent Automated Receipts */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 290 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Recent Automated Receipts</Text>
            </View>
            <View style={{ paddingVertical: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: spatialColors.textPrimary,
                      fontWeight: '600',
                      fontSize: 16,
                    }}
                  >
                    Vegan Grocery Mart
                  </Text>
                  <Text
                    style={{
                      color: spatialColors.textSecondary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Parsed via Email AI • Today
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#38EF7D', fontWeight: 'bold' }}>+50 pts</Text>
                  <Text
                    style={{
                      color: spatialColors.textSecondary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Cruelty-Free
                  </Text>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  marginBottom: 16,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text
                    style={{
                      color: spatialColors.textPrimary,
                      fontWeight: '600',
                      fontSize: 16,
                    }}
                  >
                    Uber Ride (Electric)
                  </Text>
                  <Text
                    style={{
                      color: spatialColors.textSecondary,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Parsed via Email AI • Yesterday
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#0A84FF', fontWeight: 'bold' }}>2.1 kg CO₂</Text>
                  <Text style={{ color: '#34C759', fontSize: 12, marginTop: 2 }}>Low Emission</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        {/* Sparkline */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 300 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <ChartLineUp size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Daily Emissions</Text>
            </View>
            <Sparkline data={WEEKLY_DATA} />
          </GlassCard>
        </MotiView>

        {/* Category breakdown */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 400 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
            </View>
            {CATEGORIES.map((c, i) => (
              <CategoryBar key={c.label} item={c} index={i} />
            ))}
          </GlassCard>
        </MotiView>

        {/* Predictions */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 500 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>AI Predictions</Text>
            </View>
            {PREDICTIONS.map((p, i) => (
              <View key={i} style={styles.predCard}>
                <View style={styles.predLeft}>
                  <Text style={styles.predLabel}>{p.label}</Text>
                  <Text style={[styles.predValue, p.bad ? styles.predBad : styles.predGood]}>
                    {p.value}
                  </Text>
                </View>
                <View
                  style={[
                    styles.predBadge,
                    {
                      backgroundColor: p.bad
                        ? 'rgba(255, 59, 48, 0.15)'
                        : 'rgba(52, 199, 89, 0.15)',
                    },
                  ]}
                >
                  {p.bad ? (
                    <ArrowUpRight size={14} color='#FF3B30' weight='bold' />
                  ) : (
                    <ArrowDownRight size={14} color='#34C759' weight='bold' />
                  )}
                  <Text style={[styles.predTrend, p.bad ? styles.predBad : styles.predGood]}>
                    {p.trend}
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </MotiView>

        {/* Personal goals */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 600 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Reduction Goals</Text>
            </View>
            {GOALS.map((g, i) => (
              <GoalRow key={g.label} item={g} index={i} />
            ))}
          </GlassCard>
        </MotiView>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: spatialColors.background },
  content: { paddingBottom: 40, paddingTop: 16 },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title1, color: spatialColors.textPrimary },
  subtitle: {
    ...typography.body,
    color: spatialColors.textSecondary,
    marginTop: 4,
  },

  periodToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: spatialColors.glassBorderDark,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: spatialColors.textSecondary,
  },
  periodTextActive: { color: spatialColors.textPrimary },

  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: spatialColors.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: spatialColors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },

  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: spatialColors.textPrimary,
  },

  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    marginTop: 10,
  },
  barWrapper: { alignItems: 'center', justifyContent: 'flex-end' },
  barValue: {
    fontSize: 10,
    color: spatialColors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barDay: { fontSize: 11, color: spatialColors.textSecondary, marginTop: 8 },

  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: { flex: 1 },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 15,
    color: spatialColors.textPrimary,
    fontWeight: '500',
  },
  catKg: { fontSize: 15, fontWeight: '700' },
  catTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catFill: { height: '100%', borderRadius: 3 },

  predCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  predLeft: { flex: 1 },
  predLabel: {
    fontSize: 13,
    color: spatialColors.textSecondary,
    marginBottom: 4,
  },
  predValue: { fontSize: 20, fontWeight: '800' },
  predBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  predTrend: { fontSize: 12, fontWeight: '600' },
  predGood: { color: '#34C759' },
  predBad: { color: '#FF3B30' },

  goalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  goalInfo: { flex: 1 },
  goalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalLabel: {
    fontSize: 15,
    color: spatialColors.textPrimary,
    fontWeight: '500',
  },
  goalValue: { fontSize: 13, color: spatialColors.textSecondary },
  goalTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalFill: { height: '100%', borderRadius: 3 },
});

export default AnalyticsDashboardScreen;
