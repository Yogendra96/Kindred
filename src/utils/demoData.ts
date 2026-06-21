export const MOCK_ACHIEVEMENTS = [
  {
    id: 'first_step',
    badgeId: 'first_step',
    unlockedDate: new Date().toISOString(),
    isCompleted: true,
    progress: { current: 1, target: 1, percentage: 100 },
    badge: {
      name: 'First Step',
      description: 'Log your first carbon-saving activity',
      icon: '🌱',
      category: 'milestone',
      rarity: 'common',
    },
  },
  {
    id: 'carbon_saver',
    badgeId: 'carbon_saver',
    unlockedDate: new Date().toISOString(),
    isCompleted: true,
    progress: { current: 12, target: 10, percentage: 100 },
    badge: {
      name: 'Carbon Saver',
      description: 'Save 10kg of CO₂ emissions',
      icon: '🌍',
      category: 'carbon',
      rarity: 'common',
    },
  },
  {
    id: 'streak_master',
    badgeId: 'streak_master',
    unlockedDate: null,
    isCompleted: false,
    progress: { current: 5, target: 7, percentage: 71 },
    badge: {
      name: 'Streak Master',
      description: 'Maintain a 7-day activity streak',
      icon: '🔥',
      category: 'streak',
      rarity: 'uncommon',
    },
  },
];

export const MOCK_USER_STATS = {
  totalCarbonSaved: 142.5,
  streakDays: 5,
  activitiesLogged: 24,
  challengesCompleted: 3,
  badgesEarned: 8,
  friendsCount: 12,
  rank: 154,
  level: 8,
  experience: 2450,
};

export const MOCK_SOCIAL_FEED = [
  {
    id: 'act1',
    displayName: 'Sarah Green',
    type: 'carbon_saved',
    description: 'Saved 4.2kg by cycling to work',
    timestamp: new Date().toISOString(),
    likes: 12,
    comments: 3,
  },
  {
    id: 'act2',
    displayName: 'Mike Eco',
    type: 'badge_earned',
    description: 'Earned the "Renewable Scout" badge',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    likes: 24,
    comments: 1,
  },
];
