import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
// Data layer — local consts below shadow these; they are available for future use
// import { WEEKLY_DATA, CATEGORIES, GOALS, PREDICTIONS } from '../../data/analyticsData';
import _ProgressBar from '../../components/ui/ProgressBar';
import _SectionHeader from '../../components/ui/SectionHeader';
import _StatCard from '../../components/ui/StatCard';

const { width: SW } = Dimensions.get('window');

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
    emoji: '🚗',
    kg: 28.4,
    total: 50,
    color: '#e53935',
  },
  { label: 'Food & Diet', emoji: '🍽️', kg: 21.7, total: 50, color: '#fb8c00' },
  { label: 'Home Energy', emoji: '⚡', kg: 15.3, total: 50, color: '#fdd835' },
  { label: 'Shopping', emoji: '🛍️', kg: 9.8, total: 50, color: '#8e24aa' },
  { label: 'Waste', emoji: '♻️', kg: 4.2, total: 50, color: '#43a047' },
];

const GOALS = [
  {
    label: 'Monthly target',
    current: 75.4,
    target: 60,
    unit: 'kg CO₂',
    emoji: '🎯',
  },
  {
    label: 'Vegetarian days',
    current: 18,
    target: 25,
    unit: 'days',
    emoji: '🥦',
  },
  {
    label: 'Public transport',
    current: 12,
    target: 20,
    unit: 'trips',
    emoji: '🚌',
  },
  { label: 'Tree offsets', current: 3, target: 5, unit: 'trees', emoji: '🌳' },
];

const PREDICTIONS = [
  {
    label: 'By end of month',
    value: '94.7 kg',
    trend: '▲ 12% vs last month',
    bad: true,
  },
  {
    label: 'If you skip meat Mon–Wed',
    value: '81.2 kg',
    trend: '▼ 6% saving',
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
  const chartH = 96;
  const maxKg = Math.max(...data.map(d => d.kg));
  const barWidth = chartW / data.length - 8;

  return (
    <View style={styles.chartContainer}>
      {data.map((d, _i) => {
        const barH = (d.kg / maxKg) * (chartH - 20);
        return (
          <View key={d.day} style={[styles.barWrapper, { width: barWidth }]}>
            <Text style={styles.barValue}>{d.kg}</Text>
            <View
              style={[
                styles.bar,
                {
                  height: barH,
                  backgroundColor:
                    d.kg === Math.min(...data.map(x => x.kg))
                      ? '#4caf50'
                      : d.kg === maxKg
                      ? '#e53935'
                      : '#1565c0',
                },
              ]}
            />
            <Text style={styles.barDay}>{d.day}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Category bar ─────────────────────────────────────────────────────────────
const CategoryBar = ({ item }: { item: (typeof CATEGORIES)[0] }) => {
  const pct = item.kg / item.total;
  return (
    <View style={styles.catRow}>
      <Text style={styles.catEmoji}>{item.emoji}</Text>
      <View style={styles.catInfo}>
        <View style={styles.catLabelRow}>
          <Text style={styles.catLabel}>{item.label}</Text>
          <Text style={[styles.catKg, { color: item.color }]}>
            {item.kg} kg
          </Text>
        </View>
        <View style={styles.catTrack}>
          <View
            style={[
              styles.catFill,
              { width: `${pct * 100}%`, backgroundColor: item.color },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

// ─── Goal row ─────────────────────────────────────────────────────────────────
const GoalRow = ({ item }: { item: (typeof GOALS)[0] }) => {
  const pct = Math.min(item.current / item.target, 1);
  const done = pct >= 1;
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalEmoji}>{item.emoji}</Text>
      <View style={styles.goalInfo}>
        <View style={styles.goalLabelRow}>
          <Text style={styles.goalLabel}>{item.label}</Text>
          <Text style={styles.goalValue}>
            {item.current} / {item.target} {item.unit}
          </Text>
        </View>
        <View style={styles.goalTrack}>
          <View
            style={[
              styles.goalFill,
              {
                width: `${pct * 100}%`,
                backgroundColor: done ? '#4caf50' : '#1565c0',
              },
            ]}
          />
        </View>
      </View>
      {done && <Text style={styles.goalDone}>✓</Text>}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const PERIODS = ['Week', 'Month', 'Year'];

const AnalyticsDashboardScreen = () => {
  const [period, setPeriod] = useState('Week');
  const totalKg = WEEKLY_DATA.reduce((s, d) => s + d.kg, 0).toFixed(1);
  const avgKg = (WEEKLY_DATA.reduce((s, d) => s + d.kg, 0) / 7).toFixed(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Carbon Analytics</Text>
        <Text style={styles.subtitle}>Track. Understand. Reduce.</Text>
      </View>

      {/* Period toggle */}
      <View style={styles.periodToggle}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text
              style={[
                styles.periodText,
                period === p && styles.periodTextActive,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#1565c0' }]}>
          <Text style={styles.summaryValue}>{totalKg}</Text>
          <Text style={styles.summaryLabel}>kg CO₂ {period.toLowerCase()}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#2e7d32' }]}>
          <Text style={styles.summaryValue}>{avgKg}</Text>
          <Text style={styles.summaryLabel}>kg avg / day</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#6a1b9a' }]}>
          <Text style={styles.summaryValue}>-8%</Text>
          <Text style={styles.summaryLabel}>
            vs last {period.toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Sparkline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Daily Emissions (kg CO₂)</Text>
        <Sparkline data={WEEKLY_DATA} />
      </View>

      {/* Category breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Category Breakdown</Text>
        {CATEGORIES.map(c => (
          <CategoryBar key={c.label} item={c} />
        ))}
      </View>

      {/* Predictions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 AI Predictions</Text>
        {PREDICTIONS.map((p, i) => (
          <View key={i} style={styles.predCard}>
            <Text style={styles.predLabel}>{p.label}</Text>
            <Text style={[styles.predValue, p.bad && styles.predBad]}>
              {p.value}
            </Text>
            <Text
              style={[
                styles.predTrend,
                p.bad ? styles.predBad : styles.predGood,
              ]}
            >
              {p.trend}
            </Text>
          </View>
        ))}
      </View>

      {/* Personal goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Personal Reduction Goals</Text>
        {GOALS.map(g => (
          <GoalRow key={g.label} item={g} />
        ))}
      </View>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 40 },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1565c0',
    alignItems: 'center',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  periodToggle: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: { backgroundColor: '#1565c0' },
  periodText: { fontSize: 14, fontWeight: '600', color: '#555' },
  periodTextActive: { color: 'white' },

  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 4,
  },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '900', color: 'white' },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },

  section: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },

  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  barWrapper: { alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontSize: 9, color: '#888', marginBottom: 2 },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barDay: { fontSize: 10, color: '#888', marginTop: 4 },

  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  catEmoji: { fontSize: 22, width: 32 },
  catInfo: { flex: 1 },
  catLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  catKg: { fontSize: 14, fontWeight: '700' },
  catTrack: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  catFill: { height: '100%', borderRadius: 4 },

  predCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  predLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  predValue: { fontSize: 20, fontWeight: '800', color: '#222' },
  predTrend: { fontSize: 12, marginTop: 2 },
  predGood: { color: '#4caf50' },
  predBad: { color: '#e53935' },

  goalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  goalEmoji: { fontSize: 22, width: 32 },
  goalInfo: { flex: 1 },
  goalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  goalValue: { fontSize: 12, color: '#888' },
  goalTrack: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: { height: '100%', borderRadius: 4 },
  goalDone: { fontSize: 18, color: '#4caf50', marginLeft: 8 },
});

export default AnalyticsDashboardScreen;
