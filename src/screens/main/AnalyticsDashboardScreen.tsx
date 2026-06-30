import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { MotiView } from 'moti';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import {
  ChartLineUp,
  Target,
  Lightbulb,
  Car,
  ForkKnife,
  Trash,
  Lightning,
  Leaf,
  ArrowUpRight,
  ArrowDownRight,
  CaretLeft,
  CheckCircle,
} from 'phosphor-react-native';
import { spatialColors, typography, animations } from '../../theme/theme';
import type { RootState } from '../../store';
import { CarbonHeatmap } from '../../components/insights/CarbonHeatmap';
import {
  projectEndOfPeriod,
  detectPatterns,
  getBestWorstDay,
  getCategoryTrend,
  filterHistoryByDays,
} from '../../utils/insightsEngine';

const { width: SW } = Dimensions.get('window');

const GlassCard = ({ style, children }: any) => (
  <View
    style={[
      style,
      {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        overflow: 'hidden',
        borderRadius: 16,
      },
    ]}
  >
    {children}
  </View>
);

// ─── Mini sparkline chart ─────────────────────────────────────────────────────
const Sparkline = ({ history, periodDays }: { history: any[]; periodDays: number }) => {
  const chartW = SW - 72;
  const chartH = 80;

  // Take the last N days and sort oldest first
  const data = useMemo(() => {
    const entries = [...filterHistoryByDays(history, periodDays)].reverse();
    if (entries.length === 0) {
      // Return a flat baseline if no history
      return Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        kg: 0,
      }));
    }
    return entries.map(e => {
      const dateObj = new Date(e.date);
      const dayName = isNaN(dateObj.getTime())
        ? ''
        : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      return {
        day: dayName || e.date.substring(5),
        kg: Number(e.footprint.total.toFixed(1)),
      };
    });
  }, [history, periodDays]);

  const maxKg = Math.max(...data.map(d => d.kg), 5);
  const minKg = Math.min(...data.map(d => d.kg), 0);
  const barWidth = Math.max(8, chartW / data.length - 4);

  return (
    <View style={styles.chartContainer}>
      {data.map((d, i) => {
        const barH = maxKg > 0 ? ((d.kg - minKg) / (maxKg - minKg)) * (chartH - 20) : 4;
        const isMin = d.kg === Math.min(...data.map(x => x.kg)) && d.kg > 0;
        const isMax = d.kg === maxKg && d.kg > 0;

        return (
          <MotiView
            key={`${d.day}-${i}`}
            style={[styles.barWrapper, { width: barWidth }]}
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ ...animations.spring.gentle, delay: 100 + i * 20 }}
          >
            {data.length <= 15 && <Text style={styles.barValue}>{d.kg.toFixed(0)}</Text>}
            <MotiView
              from={{ height: 0 }}
              animate={{ height: Math.max(4, barH) }}
              transition={{ ...animations.spring.gentle, delay: 200 + i * 20 }}
              style={[
                styles.bar,
                {
                  backgroundColor: isMin
                    ? '#38EF7D' // Green for min
                    : isMax
                    ? '#FF3B30' // Red for max
                    : 'rgba(255, 255, 255, 0.2)', // Default glass
                },
              ]}
            />
            {data.length <= 15 && <Text style={styles.barDay}>{d.day}</Text>}
          </MotiView>
        );
      })}
    </View>
  );
};

// ─── Custom SVG Donut Chart ───────────────────────────────────────────────────
interface DonutCategory {
  label: string;
  value: number;
  color: string;
}

const CategoryDonut = ({ categories }: { categories: DonutCategory[] }) => {
  const total = categories.reduce((sum, c) => sum + c.value, 0);
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;
  const segments = categories.map(cat => {
    const percent = total > 0 ? cat.value / total : 0;
    const strokeDashoffset = circumference - percent * circumference;
    const rotation = accumulatedPercent * 360 - 90;
    accumulatedPercent += percent;
    return { ...cat, strokeDashoffset, rotation };
  });

  return (
    <View style={styles.donutContainer}>
      <Svg width='140' height='140' viewBox='0 0 140 140'>
        {total === 0 ? (
          <Circle
            cx='70'
            cy='70'
            r={radius}
            stroke='rgba(255, 255, 255, 0.05)'
            strokeWidth={strokeWidth}
            fill='transparent'
          />
        ) : (
          segments.map((seg, i) => (
            <Circle
              key={i}
              cx='70'
              cy='70'
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill='transparent'
              strokeDasharray={circumference}
              strokeDashoffset={seg.strokeDashoffset}
              originX='70'
              originY='70'
              rotation={seg.rotation}
            />
          ))
        )}
        <SvgText x='70' y='68' textAnchor='middle' fill='#fff' fontSize='18' fontWeight='800'>
          {total.toFixed(0)}
        </SvgText>
        <SvgText
          x='70'
          y='84'
          textAnchor='middle'
          fill='rgba(255, 255, 255, 0.5)'
          fontSize='10'
          fontWeight='600'
        >
          kg CO₂
        </SvgText>
      </Svg>

      <View style={styles.donutLegend}>
        {categories.map((c, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendColorDot, { backgroundColor: c.color }]} />
            <Text style={styles.legendLabel}>
              {c.label} ({total > 0 ? ((c.value / total) * 100).toFixed(0) : '0'}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Category breakdown row ──────────────────────────────────────────────────
const CategoryBarRow = ({ label, icon: Icon, value, trend, color }: any) => {
  return (
    <View style={styles.catRow}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={20} color={color} weight='duotone' />
      </View>
      <View style={styles.catInfo}>
        <View style={styles.catLabelRow}>
          <Text style={styles.catLabel}>{label}</Text>
          <View style={styles.catValueRow}>
            <Text style={[styles.catKg, { color }]}>{value.toFixed(1)} kg</Text>
            {trend !== 0 && (
              <View style={styles.catTrendBadge}>
                {trend > 0 ? (
                  <ArrowUpRight size={10} color='#FF3B30' />
                ) : (
                  <ArrowDownRight size={10} color='#34C759' />
                )}
                <Text style={[styles.catTrendText, { color: trend > 0 ? '#FF3B30' : '#34C759' }]}>
                  {Math.abs(trend).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.catTrack}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${Math.min(100, (value / 50) * 100)}%` }}
            transition={animations.spring.gentle}
            style={[styles.catFill, { backgroundColor: color }]}
          />
        </View>
      </View>
    </View>
  );
};

// ─── Goal row ─────────────────────────────────────────────────────────────────
const GoalRow = ({ label, current, target, unit, icon: Icon, done }: any) => {
  const pct = Math.min(current / target, 1);
  const isGoalDone = current >= target;

  return (
    <View style={styles.goalRow}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isGoalDone ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      >
        <Icon size={20} color={isGoalDone ? '#34C759' : '#fff'} weight='duotone' />
      </View>
      <View style={styles.goalInfo}>
        <View style={styles.goalLabelRow}>
          <Text style={styles.goalLabel}>{label}</Text>
          <Text style={styles.goalValue}>
            {current.toFixed(1)} / {target} {unit}
          </Text>
        </View>
        <View style={styles.goalTrack}>
          <MotiView
            from={{ width: '0%' }}
            animate={{ width: `${pct * 100}%` }}
            transition={animations.spring.gentle}
            style={[
              styles.goalFill,
              {
                backgroundColor: isGoalDone ? '#34C759' : '#0A84FF',
              },
            ]}
          />
        </View>
      </View>
      {isGoalDone && (
        <CheckCircle size={20} color='#34C759' weight='fill' style={{ marginLeft: 8 }} />
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const PERIODS = ['Week', 'Month', 'Year'];

const AnalyticsDashboardScreen = () => {
  const [period, setPeriod] = useState<'Week' | 'Month' | 'Year'>('Week');
  const navigation = useNavigation();

  // Get data from Redux Store
  const carbonData = useSelector((state: RootState) => state.carbon);
  const history = carbonData?.history || [];
  const footprint = carbonData?.footprint || {
    total: 0,
    transportation: 0,
    food: 0,
    energy: 0,
    waste: 0,
  };
  const goals = carbonData?.goals || { target: 0, deadline: '' };

  const periodDays = useMemo(() => {
    if (period === 'Week') return 7;
    if (period === 'Month') return 30;
    return 365;
  }, [period]);

  // Filter history entries for selected period
  const periodHistory = useMemo(() => {
    return filterHistoryByDays(history, periodDays);
  }, [history, periodDays]);

  // Aggregate values
  const aggregates = useMemo(() => {
    if (periodHistory.length === 0) {
      // Fallback: estimate from current daily footprint
      return {
        total: footprint.total * periodDays,
        transportation: footprint.transportation * periodDays,
        food: footprint.food * periodDays,
        energy: footprint.energy * periodDays,
        waste: footprint.waste * periodDays,
        avg: footprint.total,
      };
    }

    const totals = periodHistory.reduce(
      (acc, entry) => {
        acc.total += entry.footprint.total;
        acc.transportation += entry.footprint.transportation;
        acc.food += entry.footprint.food;
        acc.energy += entry.footprint.energy;
        acc.waste += entry.footprint.waste;
        return acc;
      },
      { total: 0, transportation: 0, food: 0, energy: 0, waste: 0 },
    );

    return {
      ...totals,
      avg: totals.total / periodHistory.length,
    };
  }, [periodHistory, footprint, periodDays]);

  // Trend and projections
  const prediction = useMemo(() => {
    return projectEndOfPeriod(history, period, footprint);
  }, [history, period, footprint]);

  const bestWorst = useMemo(() => {
    return getBestWorstDay(periodHistory);
  }, [periodHistory]);

  const patterns = useMemo(() => {
    return detectPatterns(history);
  }, [history]);

  // Category trends
  const catTrends = useMemo(() => {
    return {
      transportation: getCategoryTrend(history, 'transportation', periodDays),
      food: getCategoryTrend(history, 'food', periodDays),
      energy: getCategoryTrend(history, 'energy', periodDays),
      waste: getCategoryTrend(history, 'waste', periodDays),
    };
  }, [history, periodDays]);

  const categoriesData: DonutCategory[] = useMemo(() => {
    return [
      {
        label: 'Transport',
        value: aggregates.transportation,
        color: '#FF9A9E',
      },
      { label: 'Food', value: aggregates.food, color: '#FECFEF' },
      { label: 'Energy', value: aggregates.energy, color: '#F6D365' },
      { label: 'Waste', value: aggregates.waste, color: '#84FAB0' },
    ];
  }, [aggregates]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              onPress={() => setPeriod(p as any)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </MotiView>

        {/* Summary card */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 150 }}
          style={styles.cardMargin}
        >
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>TOTAL EMISSIONS</Text>
                <Text style={styles.summaryValue}>{aggregates.total.toFixed(1)} kg CO₂</Text>
              </View>
              <View
                style={[
                  styles.trendBadge,
                  {
                    backgroundColor: prediction.isFavorable
                      ? 'rgba(52, 199, 89, 0.15)'
                      : 'rgba(255, 59, 48, 0.15)',
                  },
                ]}
              >
                {prediction.trendDirection === 'up' ? (
                  <ArrowUpRight size={14} color='#FF3B30' weight='bold' />
                ) : (
                  <ArrowDownRight size={14} color='#34C759' weight='bold' />
                )}
                <Text
                  style={[
                    styles.trendText,
                    prediction.isFavorable ? styles.trendGood : styles.trendBad,
                  ]}
                >
                  {prediction.percentageChange.toFixed(0)}%
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryGrid}>
              <View style={styles.summaryGridCol}>
                <Text style={styles.gridLabel}>Daily Average</Text>
                <Text style={styles.gridVal}>{aggregates.avg.toFixed(1)} kg</Text>
              </View>
              {bestWorst.bestDay && (
                <View style={styles.summaryGridCol}>
                  <Text style={styles.gridLabel}>Best Day</Text>
                  <Text style={[styles.gridVal, { color: '#38EF7D' }]}>
                    {bestWorst.bestDay.value} kg
                  </Text>
                  <Text style={styles.gridSubText}>{bestWorst.bestDay.date}</Text>
                </View>
              )}
              {bestWorst.worstDay && (
                <View style={styles.summaryGridCol}>
                  <Text style={styles.gridLabel}>Worst Day</Text>
                  <Text style={[styles.gridVal, { color: '#FF3B30' }]}>
                    {bestWorst.worstDay.value} kg
                  </Text>
                  <Text style={styles.gridSubText}>{bestWorst.worstDay.date}</Text>
                </View>
              )}
            </View>
          </GlassCard>
        </MotiView>

        {/* Sparkline Chart */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 200 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <ChartLineUp size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Emission Timeline</Text>
            </View>
            <Sparkline history={history} periodDays={periodDays} />
          </GlassCard>
        </MotiView>

        {/* Activity Heatmap */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 250 }}
        >
          <GlassCard style={styles.section}>
            <CarbonHeatmap history={history} />
          </GlassCard>
        </MotiView>

        {/* Category Breakdown */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 300 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
            </View>

            <CategoryDonut categories={categoriesData} />

            <View style={styles.barsContainer}>
              <CategoryBarRow
                label='Transportation'
                icon={Car}
                value={aggregates.transportation}
                trend={catTrends.transportation}
                color='#FF9A9E'
              />
              <CategoryBarRow
                label='Food & Diet'
                icon={ForkKnife}
                value={aggregates.food}
                trend={catTrends.food}
                color='#FECFEF'
              />
              <CategoryBarRow
                label='Home Energy'
                icon={Lightning}
                value={aggregates.energy}
                trend={catTrends.energy}
                color='#F6D365'
              />
              <CategoryBarRow
                label='Waste'
                icon={Trash}
                value={aggregates.waste}
                trend={catTrends.waste}
                color='#84FAB0'
              />
            </View>
          </GlassCard>
        </MotiView>

        {/* Predictive Forecast */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 350 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>AI Forecast & Scenarios</Text>
            </View>

            <View style={styles.forecastCard}>
              <View style={styles.forecastRow}>
                <View style={styles.forecastTextCol}>
                  <Text style={styles.forecastLabel}>On current pace (end of period)</Text>
                  <Text
                    style={[
                      styles.forecastValue,
                      prediction.isFavorable ? styles.trendGood : styles.trendBad,
                    ]}
                  >
                    {prediction.projectedTotal} kg
                  </Text>
                </View>
                <View
                  style={[
                    styles.forecastBadge,
                    {
                      backgroundColor: prediction.isFavorable
                        ? 'rgba(52, 199, 89, 0.15)'
                        : 'rgba(255, 59, 48, 0.15)',
                    },
                  ]}
                >
                  <Text style={prediction.isFavorable ? styles.trendGood : styles.trendBad}>
                    {prediction.trendDirection === 'up' ? '▲' : '▼'}{' '}
                    {prediction.percentageChange.toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={styles.forecastDivider} />

              <View style={styles.forecastRow}>
                <View style={styles.forecastTextCol}>
                  <Text style={styles.forecastLabel}>If you skip meat 3x / week</Text>
                  <Text style={[styles.forecastValue, { color: '#FECFEF' }]}>
                    {(prediction.projectedTotal * 0.9).toFixed(1)} kg
                  </Text>
                </View>
                <Text style={styles.savingBadge}>-10% saving</Text>
              </View>

              <View style={styles.forecastDivider} />

              <View style={styles.forecastRow}>
                <View style={styles.forecastTextCol}>
                  <Text style={styles.forecastLabel}>Projected Annual Footprint</Text>
                  <Text style={[styles.forecastValue, { color: '#0A84FF' }]}>
                    {(aggregates.avg * 365).toFixed(0)} kg
                  </Text>
                </View>
                <Text style={styles.avgBadge}>vs 1.2t avg</Text>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        {/* Behavioral Pattern Insights */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 400 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Lightbulb size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Behavioral Patterns</Text>
            </View>

            {patterns.map((item, index) => {
              // Map dynamic strings to Phosphor icon component
              const IconComp =
                item.icon === 'Car'
                  ? Car
                  : item.icon === 'ForkKnife'
                  ? ForkKnife
                  : item.icon === 'Lightning'
                  ? Lightning
                  : item.icon === 'Leaf'
                  ? Leaf
                  : item.icon === 'Trash'
                  ? Trash
                  : Target;

              return (
                <View key={item.id} style={styles.patternCard}>
                  <View
                    style={[styles.patternIconContainer, { backgroundColor: item.color + '20' }]}
                  >
                    <IconComp size={22} color={item.color} weight='duotone' />
                  </View>
                  <View style={styles.patternContent}>
                    <Text style={styles.patternTitle}>{item.title}</Text>
                    <Text style={styles.patternDesc}>{item.description}</Text>
                    <Text style={[styles.patternTip, { color: item.color }]}>
                      💡 {item.recommendation}
                    </Text>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        </MotiView>

        {/* Comparative Analytics */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 450 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Community Comparison</Text>
            </View>

            <View style={styles.compareContainer}>
              <View style={styles.compareItem}>
                <View style={styles.compareLabels}>
                  <Text style={styles.compareName}>Your Daily Avg</Text>
                  <Text style={styles.compareVal}>{aggregates.avg.toFixed(1)} kg</Text>
                </View>
                <View style={styles.compareTrack}>
                  <MotiView
                    from={{ width: '0%' }}
                    animate={{
                      width: `${Math.min(100, (aggregates.avg / 15) * 100)}%`,
                    }}
                    transition={animations.spring.gentle}
                    style={[
                      styles.compareFill,
                      {
                        backgroundColor: aggregates.avg <= 8.2 ? '#38EF7D' : '#FF3B30',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.compareItem}>
                <View style={styles.compareLabels}>
                  <Text style={styles.compareName}>City Average</Text>
                  <Text style={styles.compareVal}>8.2 kg</Text>
                </View>
                <View style={styles.compareTrack}>
                  <View
                    style={[
                      styles.compareFill,
                      {
                        width: '55%',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.compareItem}>
                <View style={styles.compareLabels}>
                  <Text style={styles.compareName}>App Community Average</Text>
                  <Text style={styles.compareVal}>6.8 kg</Text>
                </View>
                <View style={styles.compareTrack}>
                  <View
                    style={[
                      styles.compareFill,
                      {
                        width: '45%',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        {/* Reduction Goals */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 500 }}
        >
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Target size={24} color={spatialColors.textPrimary} weight='duotone' />
              <Text style={styles.sectionTitle}>Reduction Goals</Text>
            </View>

            <GoalRow
              label='Period Limit Target'
              current={aggregates.total}
              target={goals.target > 0 ? goals.target * (periodDays / 30) : 100 * (periodDays / 30)}
              unit='kg CO₂'
              icon={Target}
            />

            <GoalRow
              label='Vegetarian Days'
              current={periodHistory.filter(e => e.footprint.food <= 2.0).length}
              target={periodDays === 7 ? 4 : periodDays === 30 ? 18 : 200}
              unit='days'
              icon={Leaf}
            />
          </GlassCard>
        </MotiView>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: spatialColors.background,
  },
  content: {
    paddingBottom: 40,
    paddingTop: 16,
  },
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title1,
    color: spatialColors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: spatialColors.textSecondary,
    marginTop: 4,
  },

  periodToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  periodBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: spatialColors.textSecondary,
  },
  periodTextActive: {
    color: spatialColors.textPrimary,
  },

  cardMargin: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
    padding: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: spatialColors.textSecondary,
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trendGood: {
    color: '#34C759',
  },
  trendBad: {
    color: '#FF3B30',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryGridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: spatialColors.textSecondary,
    fontWeight: '500',
  },
  gridVal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  gridSubText: {
    fontSize: 9,
    color: spatialColors.textSecondary,
    marginTop: 2,
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
    height: 120,
    marginTop: 10,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 9,
    color: spatialColors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barDay: {
    fontSize: 10,
    color: spatialColors.textSecondary,
    marginTop: 6,
  },

  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  donutLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: spatialColors.textSecondary,
    fontWeight: '500',
  },

  barsContainer: {
    marginTop: 20,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
  },
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
  catValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catKg: {
    fontSize: 15,
    fontWeight: '700',
  },
  catTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catTrendText: {
    fontSize: 10,
    fontWeight: '700',
  },
  catTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    borderRadius: 3,
  },

  forecastCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forecastTextCol: {
    flex: 1,
  },
  forecastLabel: {
    fontSize: 12,
    color: spatialColors.textSecondary,
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  forecastBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingBadge: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '700',
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  avgBadge: {
    fontSize: 11,
    color: '#0A84FF',
    fontWeight: '700',
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  forecastDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 12,
  },

  patternCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  patternIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  patternContent: {
    flex: 1,
  },
  patternTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  patternDesc: {
    fontSize: 12,
    color: spatialColors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  patternTip: {
    fontSize: 12,
    fontWeight: '600',
  },

  compareContainer: {
    gap: 16,
  },
  compareItem: {
    gap: 6,
  },
  compareLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compareName: {
    fontSize: 13,
    color: spatialColors.textSecondary,
    fontWeight: '500',
  },
  compareVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  compareTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  compareFill: {
    height: '100%',
    borderRadius: 4,
  },

  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
  },
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
  goalValue: {
    fontSize: 13,
    color: spatialColors.textSecondary,
  },
  goalTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default AnalyticsDashboardScreen;
