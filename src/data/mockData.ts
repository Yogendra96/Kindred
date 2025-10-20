/**
 * Mock Data for Demo Mode
 * Provides realistic data to showcase all app features without authentication
 */

// User Profile Mock Data
export const mockUserProfile = {
  id: 'demo-user-001',
  name: 'Alex Green',
  email: 'demo@kindred.app',
  avatar: 'https://i.pravatar.cc/150?img=12',
  joinedDate: '2024-01-15',
  location: 'San Francisco, CA',
  bio: 'Passionate about sustainability and reducing my carbon footprint 🌱',
  preferences: {
    units: 'metric' as const,
    theme: 'light' as const,
    notifications: true,
    language: 'en',
  },
  stats: {
    totalReduction: 245.5,
    streakDays: 42,
    rank: 'Gold',
    level: 15,
    points: 12450,
  },
};

// Carbon Footprint Mock Data
export const mockCarbonFootprint = {
  total: 12.5,
  transportation: 4.2,
  food: 3.1,
  energy: 3.8,
  waste: 1.4,
  target: 8.0,
  percentageChange: -15.2,
  lastUpdated: new Date().toISOString(),
};

// Activity History Mock Data
export const mockActivityHistory = [
  {
    id: 'act-001',
    type: 'transportation',
    category: 'Public Transit',
    description: 'Bus commute to work',
    distance: 12.5,
    emissions: 1.2,
    saved: 3.8,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    icon: '🚌',
  },
  {
    id: 'act-002',
    type: 'food',
    category: 'Plant-Based',
    description: 'Vegan lunch',
    emissions: 0.8,
    saved: 2.4,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    icon: '🥗',
  },
  {
    id: 'act-003',
    type: 'energy',
    category: 'Solar Power',
    description: 'Used solar panels',
    emissions: 0.5,
    saved: 4.2,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    icon: '☀️',
  },
  {
    id: 'act-004',
    type: 'waste',
    category: 'Recycling',
    description: 'Recycled 5kg materials',
    emissions: 0.3,
    saved: 1.5,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    icon: '♻️',
  },
  {
    id: 'act-005',
    type: 'transportation',
    category: 'Cycling',
    description: 'Bike ride - 8km',
    distance: 8,
    emissions: 0.0,
    saved: 2.6,
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    icon: '🚴',
  },
];

// Weekly Carbon Data for Charts
export const mockWeeklyData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [8.5, 7.2, 9.1, 6.8, 7.5, 10.2, 6.3],
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    },
  ],
  legend: ['Daily Carbon Footprint (kg CO₂)'],
};

// Monthly Carbon Data
export const mockMonthlyData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [245, 220, 198, 185, 172, 165],
      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    },
  ],
};

// Category Breakdown for Pie Chart
export const mockCategoryBreakdown = [
  { name: 'Transport', emissions: 4.2, color: '#FF6384', percentage: 33.6 },
  { name: 'Food', emissions: 3.1, color: '#36A2EB', percentage: 24.8 },
  { name: 'Energy', emissions: 3.8, color: '#FFCE56', percentage: 30.4 },
  { name: 'Waste', emissions: 1.4, color: '#4BC0C0', percentage: 11.2 },
];

// Achievements Mock Data
export const mockAchievements = [
  {
    id: 'ach-001',
    title: '🌟 First Steps',
    description: 'Track your first activity',
    unlocked: true,
    unlockedDate: '2024-01-15',
    progress: 100,
    rarity: 'common' as const,
    points: 50,
  },
  {
    id: 'ach-002',
    title: '🔥 Week Warrior',
    description: 'Log activities for 7 days straight',
    unlocked: true,
    unlockedDate: '2024-01-22',
    progress: 100,
    rarity: 'uncommon' as const,
    points: 150,
  },
  {
    id: 'ach-003',
    title: '🌍 Carbon Reducer',
    description: 'Reduce emissions by 100kg',
    unlocked: true,
    unlockedDate: '2024-02-10',
    progress: 100,
    rarity: 'rare' as const,
    points: 300,
  },
  {
    id: 'ach-004',
    title: '🚴 Bike Champion',
    description: 'Cycle 100km',
    unlocked: false,
    progress: 67,
    rarity: 'rare' as const,
    points: 300,
  },
  {
    id: 'ach-005',
    title: '👑 Eco Legend',
    description: 'Maintain streak for 100 days',
    unlocked: false,
    progress: 42,
    rarity: 'legendary' as const,
    points: 1000,
  },
];

// Leaderboard Mock Data
export const mockLeaderboard = [
  {
    rank: 1,
    name: 'Emma Thompson',
    avatar: 'https://i.pravatar.cc/150?img=5',
    emissions: 145.2,
    reduction: 35.8,
    points: 15230,
    badge: '👑',
  },
  {
    rank: 2,
    name: 'Michael Chen',
    avatar: 'https://i.pravatar.cc/150?img=7',
    emissions: 152.8,
    reduction: 32.5,
    points: 14850,
    badge: '🥈',
  },
  {
    rank: 3,
    name: 'Alex Green',
    avatar: 'https://i.pravatar.cc/150?img=12',
    emissions: 158.3,
    reduction: 28.2,
    points: 12450,
    badge: '🥉',
    isCurrentUser: true,
  },
  {
    rank: 4,
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?img=9',
    emissions: 165.4,
    reduction: 25.1,
    points: 11200,
  },
  {
    rank: 5,
    name: 'David Kim',
    avatar: 'https://i.pravatar.cc/150?img=13',
    emissions: 172.9,
    reduction: 22.3,
    points: 10800,
  },
];

// Recommendations Mock Data
export const mockRecommendations = [
  {
    id: 'rec-001',
    title: 'Switch to LED Bulbs',
    description: 'Replace your remaining incandescent bulbs with energy-efficient LEDs',
    category: 'energy',
    impact: 'high',
    potentialSaving: 45.2,
    difficulty: 'easy',
    timeframe: '1 week',
    icon: '💡',
    estimatedCost: '$25',
  },
  {
    id: 'rec-002',
    title: 'Meatless Mondays',
    description: 'Try plant-based meals one day per week',
    category: 'food',
    impact: 'medium',
    potentialSaving: 28.5,
    difficulty: 'easy',
    timeframe: 'ongoing',
    icon: '🥗',
    estimatedCost: '$0',
  },
  {
    id: 'rec-003',
    title: 'Bike to Work',
    description: 'Use bicycle for short commutes (< 5km)',
    category: 'transportation',
    impact: 'high',
    potentialSaving: 65.8,
    difficulty: 'medium',
    timeframe: 'ongoing',
    icon: '🚴',
    estimatedCost: '$0',
  },
  {
    id: 'rec-004',
    title: 'Composting',
    description: 'Start composting your organic waste',
    category: 'waste',
    impact: 'medium',
    potentialSaving: 18.2,
    difficulty: 'medium',
    timeframe: '2 weeks',
    icon: '🌱',
    estimatedCost: '$40',
  },
];

// Insights Mock Data
export const mockInsights = [
  {
    id: 'ins-001',
    type: 'achievement',
    title: '🎉 Great Progress!',
    message: "You've reduced your carbon footprint by 15% this month!",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
  },
  {
    id: 'ins-002',
    type: 'tip',
    title: '💡 Energy Tip',
    message: 'Your energy usage peaks at 7 PM. Consider using appliances during off-peak hours.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
  },
  {
    id: 'ins-003',
    type: 'milestone',
    title: '🏆 Milestone Reached',
    message: '42-day streak! Keep up the amazing work!',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
  },
  {
    id: 'ins-004',
    type: 'comparison',
    title: '📊 Benchmarking',
    message: 'Your footprint is 28% lower than the average in your area!',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
  },
];

// Challenges Mock Data
export const mockChallenges = [
  {
    id: 'chal-001',
    title: 'Zero Car Week',
    description: 'Avoid using your car for one week',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    participants: 1243,
    reward: 500,
    progress: 42,
    status: 'active' as const,
    icon: '🚶',
  },
  {
    id: 'chal-002',
    title: 'Plant-Based Week',
    description: 'Eat only plant-based meals for 7 days',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    participants: 856,
    reward: 400,
    progress: 28,
    status: 'active' as const,
    icon: '🌱',
  },
  {
    id: 'chal-003',
    title: 'Zero Waste Month',
    description: 'Minimize waste to less than 1kg per week',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    participants: 2341,
    reward: 1000,
    progress: 15,
    status: 'active' as const,
    icon: '♻️',
  },
];

// Community Posts Mock Data
export const mockCommunityPosts = [
  {
    id: 'post-001',
    author: {
      name: 'Emma Thompson',
      avatar: 'https://i.pravatar.cc/150?img=5',
      level: 18,
    },
    content: 'Just completed my first car-free week! Biking everywhere has been amazing 🚴‍♀️',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 124,
    comments: 23,
    shares: 8,
    tags: ['transportation', 'cycling'],
  },
  {
    id: 'post-002',
    author: {
      name: 'Michael Chen',
      avatar: 'https://i.pravatar.cc/150?img=7',
      level: 16,
    },
    content: 'My rooftop solar panels just got installed! Feeling great about this investment 🌞',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    likes: 89,
    comments: 15,
    shares: 12,
    tags: ['energy', 'solar'],
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400',
  },
  {
    id: 'post-003',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=9',
      level: 14,
    },
    content: 'Started composting! Here are my tips for beginners... 🌱',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: 156,
    comments: 34,
    shares: 28,
    tags: ['waste', 'composting'],
  },
];

// Map Locations Mock Data (eco-friendly places nearby)
export const mockMapLocations = [
  {
    id: 'loc-001',
    name: 'Green Market',
    type: 'market',
    description: 'Organic farmer\'s market',
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    distance: 0.8,
    rating: 4.8,
    icon: '🛒',
  },
  {
    id: 'loc-002',
    name: 'Bike Share Station',
    type: 'transport',
    description: 'Public bike rental',
    coordinates: { latitude: 37.7759, longitude: -122.4184 },
    distance: 0.5,
    rating: 4.6,
    icon: '🚲',
  },
  {
    id: 'loc-003',
    name: 'Recycling Center',
    type: 'recycling',
    description: 'Full-service recycling facility',
    coordinates: { latitude: 37.7739, longitude: -122.4214 },
    distance: 1.2,
    rating: 4.5,
    icon: '♻️',
  },
  {
    id: 'loc-004',
    name: 'Solar Panel Installer',
    type: 'service',
    description: 'Residential solar installation',
    coordinates: { latitude: 37.7769, longitude: -122.4174 },
    distance: 1.5,
    rating: 4.9,
    icon: '☀️',
  },
  {
    id: 'loc-005',
    name: 'Vegan Cafe',
    type: 'food',
    description: 'Plant-based restaurant',
    coordinates: { latitude: 37.7729, longitude: -122.4224 },
    distance: 0.9,
    rating: 4.7,
    icon: '🥗',
  },
];

// Eco Tips Mock Data
export const mockEcoTips = [
  {
    id: 'tip-001',
    title: 'Unplug Electronics',
    description: 'Devices in standby mode still consume power. Unplug when not in use.',
    category: 'energy',
    impact: 'Save up to 10% on electricity',
    icon: '🔌',
  },
  {
    id: 'tip-002',
    title: 'Cold Water Washing',
    description: 'Washing clothes in cold water saves energy and is gentler on fabrics.',
    category: 'energy',
    impact: 'Reduce washing emissions by 90%',
    icon: '🧺',
  },
  {
    id: 'tip-003',
    title: 'Reusable Bags',
    description: 'Always carry reusable shopping bags to avoid plastic.',
    category: 'waste',
    impact: 'Prevent 500+ bags per year',
    icon: '👜',
  },
  {
    id: 'tip-004',
    title: 'Seasonal Produce',
    description: 'Buy seasonal, local produce to reduce transportation emissions.',
    category: 'food',
    impact: 'Lower food carbon by 30%',
    icon: '🍎',
  },
  {
    id: 'tip-005',
    title: 'Smart Thermostat',
    description: 'Adjust temperature by 2°C to significantly reduce energy use.',
    category: 'energy',
    impact: 'Save 10-15% on heating/cooling',
    icon: '🌡️',
  },
];

// Carbon Offset Projects Mock Data
export const mockOffsetProjects = [
  {
    id: 'proj-001',
    name: 'Amazon Rainforest Protection',
    description: 'Preserve 10,000 acres of rainforest',
    location: 'Brazil',
    costPerTon: 12,
    verified: true,
    rating: 4.9,
    totalOffset: 50000,
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400',
  },
  {
    id: 'proj-002',
    name: 'Wind Energy Farm',
    description: 'Support renewable wind energy generation',
    location: 'Texas, USA',
    costPerTon: 15,
    verified: true,
    rating: 4.7,
    totalOffset: 75000,
    image: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=400',
  },
  {
    id: 'proj-003',
    name: 'Ocean Plastic Cleanup',
    description: 'Remove plastic waste from oceans',
    location: 'Pacific Ocean',
    costPerTon: 20,
    verified: true,
    rating: 4.8,
    totalOffset: 30000,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
  },
];

// Notification Mock Data
export const mockNotifications = [
  {
    id: 'notif-001',
    type: 'achievement',
    title: 'New Achievement Unlocked! 🏆',
    message: 'You earned "Week Warrior" for your 7-day streak',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-002',
    type: 'challenge',
    title: 'Challenge Update 📊',
    message: 'You\'re 42% through the Zero Car Week challenge!',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-003',
    type: 'social',
    title: 'Emma Thompson liked your post ❤️',
    message: 'Your composting tips post got 23 new comments',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'notif-004',
    type: 'tip',
    title: 'Daily Eco Tip 💡',
    message: 'Did you know? Using cold water for laundry saves 90% of energy',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

// Export all mock data as a single object for easy access
export const mockData = {
  user: mockUserProfile,
  footprint: mockCarbonFootprint,
  activities: mockActivityHistory,
  weeklyData: mockWeeklyData,
  monthlyData: mockMonthlyData,
  categoryBreakdown: mockCategoryBreakdown,
  achievements: mockAchievements,
  leaderboard: mockLeaderboard,
  recommendations: mockRecommendations,
  insights: mockInsights,
  challenges: mockChallenges,
  communityPosts: mockCommunityPosts,
  mapLocations: mockMapLocations,
  ecoTips: mockEcoTips,
  offsetProjects: mockOffsetProjects,
  notifications: mockNotifications,
};

export default mockData;
