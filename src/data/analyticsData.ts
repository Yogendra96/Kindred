/**
 * analyticsData.ts — Analytics Dashboard data constants
 * Extracted from AnalyticsDashboardScreen.tsx (SRP: data ≠ UI).
 */

export interface DayEmission {
  day: string; // 'Mon', 'Tue', …
  kg: number;
}

export const WEEKLY_DATA: DayEmission[] = [
  { day: 'Mon', kg: 12.4 },
  { day: 'Tue', kg: 9.8 },
  { day: 'Wed', kg: 14.2 },
  { day: 'Thu', kg: 8.1 },
  { day: 'Fri', kg: 11.5 },
  { day: 'Sat', kg: 6.3 },
  { day: 'Sun', kg: 7.9 },
];

export interface CategoryData {
  name: string;
  emoji: string;
  kg: number;
  pct: number; // percentage of total (0–100)
  color: string;
  trend: number; // % change vs last period (negative = improvement)
}

export const CATEGORIES: CategoryData[] = [
  {
    name: 'Transportation',
    emoji: '🚗',
    kg: 28.4,
    pct: 38,
    color: '#1565c0',
    trend: -12,
  },
  { name: 'Food', emoji: '🥗', kg: 21.7, pct: 29, color: '#2e7d32', trend: -5 },
  {
    name: 'Energy',
    emoji: '⚡',
    kg: 15.3,
    pct: 20,
    color: '#f57f17',
    trend: 3,
  },
  {
    name: 'Shopping',
    emoji: '🛍️',
    kg: 9.8,
    pct: 13,
    color: '#6a1b9a',
    trend: -8,
  },
  { name: 'Waste', emoji: '🗑️', kg: 4.2, pct: 6, color: '#00838f', trend: -18 },
];

export interface Goal {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export const GOALS: Goal[] = [
  {
    label: 'Monthly CO₂',
    current: 75.4,
    target: 60,
    unit: 'kg',
    color: '#2e7d32',
  },
  {
    label: 'Transport',
    current: 28.4,
    target: 20,
    unit: 'kg',
    color: '#1565c0',
  },
  {
    label: 'Food Impact',
    current: 21.7,
    target: 18,
    unit: 'kg',
    color: '#388e3c',
  },
];

export interface Prediction {
  emoji: string;
  label: string;
  value: string;
  color: string;
}

export const PREDICTIONS: Prediction[] = [
  {
    emoji: '📈',
    label: 'Month-end projection',
    value: '95.2 kg CO₂',
    color: '#e53935',
  },
  {
    emoji: '🏆',
    label: 'Best category',
    value: 'Waste (−18%)',
    color: '#2e7d32',
  },
  {
    emoji: '⚠️',
    label: 'Watch category',
    value: 'Energy (+3%)',
    color: '#f57f17',
  },
  {
    emoji: '🎯',
    label: 'To hit your goal',
    value: '↓ 2.1 kg/day',
    color: '#1565c0',
  },
];

export const PERIOD_TABS = ['Week', 'Month', 'Year'] as const;
export type Period = (typeof PERIOD_TABS)[number];
