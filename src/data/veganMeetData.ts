/**
 * veganMeetData.ts — Vegan Dating, Friendship & Local Community Meetups
 *
 * Privacy-first data model:
 * - Location is safely fuzzed into generalized distance bands to prevent triangulation/stalking.
 * - Profile data includes ethical lifestyle stance, sanctuary passions, and authentic icebreakers.
 * - Group meetups include category, host verification, and attendee limits.
 */

export interface VeganProfile {
  id: string;
  name: string;
  age: number;
  mode: 'dating' | 'friends' | 'both';
  pronouns: string;
  city: string;
  distanceKm: number;
  distanceDisplay: string;
  avatar: string;
  verified: boolean;
  veganYears: number;
  dietTag: string;
  bio: string;
  interests: string[];
  favoriteSpot: string;
  icebreaker: {
    question: string;
    answer: string;
  };
  karmaScore: number;
}

export interface VeganMeetup {
  id: string;
  title: string;
  category: 'Sanctuary' | 'Food Crawl' | 'Active & Sports' | 'Potluck' | 'Activism';
  date: string;
  time: string;
  locationName: string;
  distanceKm: number;
  hostName: string;
  hostAvatar: string;
  description: string;
  attendeesCount: number;
  maxSpots: number;
  isJoined?: boolean;
}

export interface CommunitySafetyGuideline {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export const COMMUNITY_SAFETY_GUIDELINES: CommunitySafetyGuideline[] = [
  {
    id: 'safe-1',
    icon: '☕',
    title: 'Meet in Public Spaces',
    description:
      'Always arrange initial meetups in busy public locations like vegan cafes, outdoor markets, or community gardens.',
  },
  {
    id: 'safe-2',
    icon: '🛡️',
    title: 'Location Privacy Protection',
    description:
      'Kindred automatically fuzzes your exact coordinates. Never share your private home address or financial info with new contacts.',
  },
  {
    id: 'safe-3',
    icon: '🤝',
    title: 'Ethical Respect & Consent',
    description:
      'Kindred is a cruelty-free safe space. Zero tolerance for harassment, deceptive promotion, hate speech, or non-consensual behavior.',
  },
  {
    id: 'safe-4',
    icon: '🚨',
    title: 'Instant Report & Block',
    description:
      'If anyone makes you feel uncomfortable, use the Report button on their profile. Blocked users are muted and hidden instantly.',
  },
];

export const VEGAN_PROFILES: VeganProfile[] = [
  {
    id: 'profile-1',
    name: 'Maya Lin',
    age: 26,
    mode: 'both',
    pronouns: 'she/her',
    city: 'Brooklyn, NY',
    distanceKm: 1.4,
    distanceDisplay: '~1.4 km away',
    avatar: '👩🏻‍🌾',
    verified: true,
    veganYears: 5,
    dietTag: 'Strictly 100% Vegan',
    bio: 'Rescued dog mama, marathon runner, and weekend sourdough baker. Passionate about farm animal advocacy and finding the best spicy vegan ramen.',
    interests: ['Animal Rights', 'Sanctuary Volunteering', 'Baking', 'Marathons', 'Zero Waste'],
    favoriteSpot: 'Peacefood Cafe Downtown',
    icebreaker: {
      question: 'What is your go-to late night comfort food?',
      answer: 'Homemade crispy tofu pad thai with extra lime and chili crisp 🍜',
    },
    karmaScore: 480,
  },
  {
    id: 'profile-2',
    name: 'Julian Vance',
    age: 29,
    mode: 'dating',
    pronouns: 'he/him',
    city: 'Manhattan, NY',
    distanceKm: 2.8,
    distanceDisplay: '~2.8 km away',
    avatar: '🧑🏽‍🍳',
    verified: true,
    veganYears: 4,
    dietTag: 'Plant-Powered Chef',
    bio: 'Plant-based chef crafting artisan cashew cheeses and mushroom charcuterie. Love vinyl records, indie gigs, and cycling across the bridges.',
    interests: ['Culinary Arts', 'Cycling', 'Indie Music', 'Fermentation', 'Coffee'],
    favoriteSpot: 'Double Zero Pizza',
    icebreaker: {
      question: 'Best cruelty-free life hack?',
      answer:
        'Blended soaked cashews + nutritional yeast + smoked paprika replaces any dairy cheese sauce flawlessly 🧀',
    },
    karmaScore: 520,
  },
  {
    id: 'profile-3',
    name: 'Aisha Sharma',
    age: 27,
    mode: 'friends',
    pronouns: 'she/they',
    city: 'Queens, NY',
    distanceKm: 3.5,
    distanceDisplay: '~3.5 km away',
    avatar: '🧘🏽‍♀️',
    verified: true,
    veganYears: 6,
    dietTag: 'Whole-Food Plant-Based',
    bio: 'Urban gardener and animal rescue foster volunteer. Looking for cruelty-free friends for sanctuary weekend road trips and farmers market hauls.',
    interests: ['Sanctuary', 'Gardening', 'Yoga', 'Potlucks', 'Thrifting'],
    favoriteSpot: 'Riverdel Cheese Shop',
    icebreaker: {
      question: 'Dream weekend getaway?',
      answer:
        'Volunteering with the rescue cows at Catskill Animal Sanctuary followed by a campfire picnic 🐮⛺',
    },
    karmaScore: 610,
  },
  {
    id: 'profile-4',
    name: 'Leo Thorne',
    age: 31,
    mode: 'both',
    pronouns: 'they/them',
    city: 'Hoboken, NJ',
    distanceKm: 4.2,
    distanceDisplay: '~4.2 km away',
    avatar: '🧗🏻‍♂️',
    verified: true,
    veganYears: 7,
    dietTag: 'Ethical Vegan Athlete',
    bio: 'Bouldering enthusiast, wildlife photographer, and ethical footwear designer. Fueled by oats, lentils, and compassion for all living beings.',
    interests: ['Bouldering', 'Photography', 'Wildlife', 'Sustainable Fashion', 'Hiking'],
    favoriteSpot: 'Caravan of Dreams',
    icebreaker: {
      question: 'What convinced you to go vegan?',
      answer:
        'Spending an afternoon at a farm sanctuary and looking into the gentle eyes of a rescued calf. Never looked back 🌱',
    },
    karmaScore: 740,
  },
  {
    id: 'profile-5',
    name: 'Chloe Rivera',
    age: 24,
    mode: 'dating',
    pronouns: 'she/her',
    city: 'Brooklyn, NY',
    distanceKm: 2.1,
    distanceDisplay: '~2.1 km away',
    avatar: '🎨',
    verified: false,
    veganYears: 3,
    dietTag: 'Cruelty-Free Living',
    bio: 'Graphic designer and vegan pastry lover. Searching for someone who gets just as excited about discovering a new vegan bakery popup.',
    interests: ['Baking', 'Art & Design', 'Animals', 'Board Games', 'Concerts'],
    favoriteSpot: 'Clementine Bakery',
    icebreaker: {
      question: 'Favorite sweet treat?',
      answer: 'Warm cinnamon roll with vegan cream cheese frosting from Clementine 🥐✨',
    },
    karmaScore: 310,
  },
];

export const VEGAN_MEETUPS: VeganMeetup[] = [
  {
    id: 'meetup-1',
    title: 'Farm Sanctuary Care & Cuddle Volunteer Day',
    category: 'Sanctuary',
    date: 'Saturday, Nov 29',
    time: '10:00 AM – 3:00 PM',
    locationName: 'Sweet Meadows Animal Sanctuary',
    distanceKm: 5.2,
    hostName: 'Aisha Sharma',
    hostAvatar: '🧘🏽‍♀️',
    description:
      'Join us for a morning of grooming rescued sheep, spreading fresh straw, and feeding apples to rescued pigs, followed by a communal plant-based picnic lunch.',
    attendeesCount: 16,
    maxSpots: 20,
    isJoined: false,
  },
  {
    id: 'meetup-2',
    title: 'Brooklyn Vegan Street Food Night Crawl',
    category: 'Food Crawl',
    date: 'Friday, Dec 5',
    time: '6:30 PM – 9:30 PM',
    locationName: 'Williamsburg North 6th St',
    distanceKm: 1.8,
    hostName: 'Julian Vance',
    hostAvatar: '🧑🏽‍🍳',
    description:
      'We will walk together to 4 top vegan spots: tacos, dumplings, artisan pizza, and dairy-free gelato. All levels of vegans and curious eaters welcome!',
    attendeesCount: 22,
    maxSpots: 25,
    isJoined: true,
  },
  {
    id: 'meetup-3',
    title: 'Prospect Park 5K Morning Run & Smoothie Social',
    category: 'Active & Sports',
    date: 'Sunday, Dec 7',
    time: '9:00 AM – 11:00 AM',
    locationName: 'Prospect Park Grand Army Plaza',
    distanceKm: 2.4,
    hostName: 'Maya Lin',
    hostAvatar: '👩🏻‍🌾',
    description:
      'Casual, all-paces morning 5K loop through the autumn foliage, followed by fresh green smoothies and plant protein snack bars at the local juice bar.',
    attendeesCount: 11,
    maxSpots: 15,
    isJoined: false,
  },
  {
    id: 'meetup-4',
    title: 'Cozy Winter Vegan Potluck & Board Game Night',
    category: 'Potluck',
    date: 'Thursday, Dec 11',
    time: '7:00 PM – 10:00 PM',
    locationName: 'Greenpoint Community Loft',
    distanceKm: 3.1,
    hostName: 'Leo Thorne',
    hostAvatar: '🧗🏻‍♂️',
    description:
      'Bring your favorite vegan dish or snack (labeled with ingredients for allergy safety) and your favorite board game for a relaxed, friendly evening.',
    attendeesCount: 18,
    maxSpots: 20,
    isJoined: false,
  },
];
