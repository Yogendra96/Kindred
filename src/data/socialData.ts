/**
 * socialData.ts — Social screen data constants
 * Extracted from SocialScreen.tsx to keep UI and data separate (OCP/SRP).
 */

export const LEADERBOARD = [
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
] as const;

export type LeaderboardEntry = (typeof LEADERBOARD)[number];

export const CHALLENGES = [
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
] as const;

export type Challenge = (typeof CHALLENGES)[number];

export const GROUPS = [
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
    name: 'Green Brooklyn Cyclists',
    emoji: '🚴',
    members: 5,
    goal: 'Log 500 km of zero-emission travel together',
    progress: 287,
    target: 500,
    streak: 7,
    yourContribution: 43,
    nextCheck: 'Friday, 6pm',
    recentActivity: 'Luca biked 18 km today 🚴',
  },
] as const;

export type Group = (typeof GROUPS)[number];

export const CHALLENGE_FILTER_TABS = [
  'All',
  'Daily',
  'Weekly',
  'Monthly',
  'Global',
] as const;
export type ChallengeFilter = (typeof CHALLENGE_FILTER_TABS)[number];

export const LEADERBOARD_SCOPES = ['Friends', 'City', 'Global'] as const;
export type LeaderboardScope = (typeof LEADERBOARD_SCOPES)[number];
