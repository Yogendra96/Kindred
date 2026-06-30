import { subDays, startOfDay, parseISO, format, isValid } from 'date-fns';

export interface CarbonFootprint {
  total: number;
  transportation: number;
  food: number;
  energy: number;
  waste: number;
}

export interface HistoryEntry {
  date: string;
  footprint: CarbonFootprint;
  pendingSync?: boolean;
}

export interface PredictionResult {
  projectedTotal: number;
  percentageChange: number;
  trendDirection: 'up' | 'down' | 'stable';
  isFavorable: boolean;
}

export interface BehavioralInsight {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  icon: 'Car' | 'ForkKnife' | 'Lightning' | 'Leaf' | 'Trash' | 'Target';
  color: string;
}

/**
 * Helper to parse a date string safely
 */
export const parseEntryDate = (dateStr: string): Date => {
  try {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date(dateStr));
  } catch {
    return startOfDay(new Date());
  }
};

/**
 * Filter history entries by a date range
 */
export const filterHistoryByDays = (history: HistoryEntry[], days: number): HistoryEntry[] => {
  const cutoff = startOfDay(subDays(new Date(), days));
  return history.filter(entry => {
    const date = parseEntryDate(entry.date);
    return date >= cutoff;
  });
};

/**
 * Group history entries by day (in case there are duplicates or missing days)
 * Returns a map of YYYY-MM-DD to HistoryEntry
 */
export const getCleanHistoryMap = (history: HistoryEntry[]): Map<string, HistoryEntry> => {
  const map = new Map<string, HistoryEntry>();
  history.forEach(entry => {
    // Keep the latest entry for a specific date
    map.set(entry.date, entry);
  });
  return map;
};

/**
 * Projects the end-of-period total using linear regression on history.
 * P = 7 for Week, 30 for Month, 365 for Year.
 */
export const projectEndOfPeriod = (
  history: HistoryEntry[],
  period: 'Week' | 'Month' | 'Year',
  currentFootprint: CarbonFootprint,
): PredictionResult => {
  let periodDays = 7;
  if (period === 'Month') periodDays = 30;
  if (period === 'Year') periodDays = 365;

  // Filter history for the current period
  const currentPeriodHistory = [...filterHistoryByDays(history, periodDays)].reverse(); // Oldest first

  // Previous period history for comparison
  const prevPeriodCutoff = periodDays * 2;
  const allHistorySorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const prevPeriodHistory = allHistorySorted.filter(entry => {
    const date = parseEntryDate(entry.date);
    const minDate = startOfDay(subDays(new Date(), prevPeriodCutoff));
    const maxDate = startOfDay(subDays(new Date(), periodDays));
    return date >= minDate && date < maxDate;
  });

  const currentSum = currentPeriodHistory.reduce((sum, e) => sum + e.footprint.total, 0);
  const prevSum =
    prevPeriodHistory.reduce((sum, e) => sum + e.footprint.total, 0) ||
    currentFootprint.total * periodDays * 0.95;

  // If we don't have enough history, return a simple static baseline
  if (currentPeriodHistory.length < 2) {
    const estTotal = currentFootprint.total * periodDays;
    const diff = prevSum > 0 ? ((estTotal - prevSum) / prevSum) * 100 : 0;
    return {
      projectedTotal: Number(estTotal.toFixed(1)),
      percentageChange: Number(Math.abs(diff).toFixed(1)),
      trendDirection: diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable',
      isFavorable: diff <= 0,
    };
  }

  // Linear regression: y = mx + c
  // x = day index (0 to N-1), y = carbon total
  const n = currentPeriodHistory.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += currentPeriodHistory[i].footprint.total;
    sumXY += i * currentPeriodHistory[i].footprint.total;
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  let m = 0;
  let c = sumY / n; // fallback to average

  if (denominator !== 0) {
    m = (n * sumXY - sumX * sumY) / denominator;
    c = (sumY - m * sumX) / n;
  }

  // Project remaining days
  let projectedSum = currentSum;
  // If we have less than periodDays, predict for the rest
  if (n < periodDays) {
    for (let i = n; i < periodDays; i++) {
      const predictedVal = Math.max(0, m * i + c); // No negative emissions
      projectedSum += predictedVal;
    }
  }

  const diffPct = prevSum > 0 ? ((projectedSum - prevSum) / prevSum) * 100 : 0;

  return {
    projectedTotal: Number(projectedSum.toFixed(1)),
    percentageChange: Number(Math.abs(diffPct).toFixed(1)),
    trendDirection: diffPct > 2 ? 'up' : diffPct < -2 ? 'down' : 'stable',
    isFavorable: diffPct <= 0,
  };
};

/**
 * Detects behavioral patterns in carbon history
 */
export const detectPatterns = (history: HistoryEntry[]): BehavioralInsight[] => {
  const insights: BehavioralInsight[] = [];

  if (history.length < 3) {
    return [
      {
        id: 'need_more_data',
        title: 'Awaiting Carbon Data',
        description:
          'Start logging your daily transport, food, energy, and waste to discover personalized patterns.',
        recommendation: 'Log your activities on the Home screen to build your profile.',
        icon: 'Target',
        color: '#84FAB0',
      },
    ];
  }

  // Pattern 1: Weekday vs Weekend commuting
  const weekdayTotals: number[] = [];
  const weekendTotals: number[] = [];
  const weekdayTransports: number[] = [];
  const weekendTransports: number[] = [];

  history.forEach(entry => {
    const date = parseEntryDate(entry.date);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      weekendTotals.push(entry.footprint.total);
      weekendTransports.push(entry.footprint.transportation);
    } else {
      weekdayTotals.push(entry.footprint.total);
      weekdayTransports.push(entry.footprint.transportation);
    }
  });

  const getAvg = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

  const avgWeekdayTotal = getAvg(weekdayTotals);
  const avgWeekendTotal = getAvg(weekendTotals);
  const avgWeekdayTransport = getAvg(weekdayTransports);
  const avgWeekendTransport = getAvg(weekendTransports);

  if (avgWeekdayTotal > avgWeekendTotal * 1.15) {
    const pct = Math.round(((avgWeekdayTotal - avgWeekendTotal) / avgWeekendTotal) * 100);
    insights.push({
      id: 'weekday_spike',
      title: 'Commuter Spike Detected',
      description: `Your weekday emissions are ${pct}% higher than your weekend average, largely driven by travel.`,
      recommendation:
        avgWeekdayTransport > avgWeekendTransport
          ? 'Consider walking, cycling, or public transport for your weekday commute.'
          : 'Review your weekday routines for potential energy savings.',
      icon: 'Car',
      color: '#FF9A9E',
    });
  }

  // Pattern 2: Food footprint trend (comparing last 7 days vs previous 7 days)
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  const last7 = sorted.slice(0, 7);
  const prev7 = sorted.slice(7, 14);

  if (last7.length >= 3 && prev7.length >= 3) {
    const avgFoodLast7 = getAvg(last7.map(e => e.footprint.food));
    const avgFoodPrev7 = getAvg(prev7.map(e => e.footprint.food));

    if (avgFoodLast7 < avgFoodPrev7 * 0.9) {
      const reduction = Math.round(((avgFoodPrev7 - avgFoodLast7) / avgFoodPrev7) * 100);
      insights.push({
        id: 'green_diet',
        title: 'Green Diet Progress! 🎉',
        description: `Your food carbon footprint improved by ${reduction}% compared to last week.`,
        recommendation: 'Excellent choice! Keeping up plant-based meals makes a huge impact.',
        icon: 'ForkKnife',
        color: '#FECFEF',
      });
    }
  }

  // Pattern 3: Specific day spike (e.g. Sunday energy usage)
  const dayEnergyMap = new Map<number, number[]>();
  history.forEach(entry => {
    const date = parseEntryDate(entry.date);
    const day = date.getDay();
    if (!dayEnergyMap.has(day)) {
      dayEnergyMap.set(day, []);
    }
    dayEnergyMap.get(day)!.push(entry.footprint.energy);
  });

  let maxDay = -1;
  let maxDayAvg = 0;
  let overallEnergySum = 0;
  let overallEnergyCount = 0;

  dayEnergyMap.forEach((values, day) => {
    const avg = getAvg(values);
    overallEnergySum += values.reduce((s, x) => s + x, 0);
    overallEnergyCount += values.length;
    if (avg > maxDayAvg) {
      maxDayAvg = avg;
      maxDay = day;
    }
  });

  const overallAvgEnergy = overallEnergyCount ? overallEnergySum / overallEnergyCount : 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (maxDay !== -1 && maxDayAvg > overallAvgEnergy * 1.3 && overallAvgEnergy > 1) {
    insights.push({
      id: 'day_energy_spike',
      title: `${dayNames[maxDay]} Energy Spike`,
      description: `Your home energy footprint is significantly higher on ${dayNames[maxDay]}s compared to other days.`,
      recommendation:
        'Set smart thermostats, lower AC, and avoid running heavy laundry machines simultaneously.',
      icon: 'Lightning',
      color: '#F6D365',
    });
  }

  // If no specific patterns detected, add a positive general card
  if (insights.length === 0) {
    insights.push({
      id: 'steady_carbon',
      title: 'Stable Eco Footprint',
      description: 'Your carbon emissions are balanced and steady across all categories.',
      recommendation: 'Try choosing one category to reduce by 10% next week.',
      icon: 'Leaf',
      color: '#84FAB0',
    });
  }

  return insights;
};

/**
 * Gets best (lowest) and worst (highest) emission days
 */
export const getBestWorstDay = (
  history: HistoryEntry[],
): {
  bestDay: { date: string; value: number } | null;
  worstDay: { date: string; value: number } | null;
} => {
  if (history.length === 0) {
    return { bestDay: null, worstDay: null };
  }

  let best = history[0];
  let worst = history[0];

  history.forEach(entry => {
    if (entry.footprint.total < best.footprint.total) {
      best = entry;
    }
    if (entry.footprint.total > worst.footprint.total) {
      worst = entry;
    }
  });

  return {
    bestDay: {
      date: format(parseEntryDate(best.date), 'MMM dd, yyyy'),
      value: Number(best.footprint.total.toFixed(1)),
    },
    worstDay: {
      date: format(parseEntryDate(worst.date), 'MMM dd, yyyy'),
      value: Number(worst.footprint.total.toFixed(1)),
    },
  };
};

/**
 * Gets % change of a category's average in the selected period compared to previous period
 */
export const getCategoryTrend = (
  history: HistoryEntry[],
  category: keyof CarbonFootprint,
  periodDays: number,
): number => {
  const currentPeriod = filterHistoryByDays(history, periodDays);
  const prevPeriodCutoff = periodDays * 2;
  const prevPeriod = history.filter(entry => {
    const date = parseEntryDate(entry.date);
    const minDate = startOfDay(subDays(new Date(), prevPeriodCutoff));
    const maxDate = startOfDay(subDays(new Date(), periodDays));
    return date >= minDate && date < maxDate;
  });

  const getCategoryAvg = (entries: HistoryEntry[]) => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((s, e) => s + (e.footprint[category] || 0), 0);
    return sum / entries.length;
  };

  const currentAvg = getCategoryAvg(currentPeriod);
  const prevAvg = getCategoryAvg(prevPeriod);

  if (prevAvg === 0) return 0;
  return Number((((currentAvg - prevAvg) / prevAvg) * 100).toFixed(1));
};
