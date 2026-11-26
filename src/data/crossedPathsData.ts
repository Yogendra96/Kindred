/**
 * crossedPathsData.ts — Kindred Beacon & Crossed Paths Radar
 *
 * Real-world proximity encounters connecting plant-forward advocates,
 * activists, and ethical founders who crossed paths nearby with strict
 * anti-stalking protections (300m-500m geohash fuzzing & ghost mode).
 */

export interface CrossedPathEncounter {
  id: string;
  userId: string;
  name: string;
  pronouns: string;
  title: string;
  organization: string;
  avatarEmoji: string;
  fuzzedLocation: string;
  distanceFuzzed: string;
  timeAgo: string;
  timesCrossedThisWeek: number;
  mutualInterests: string[];
  endorsedSanctuary: string;
  hasWaved: boolean;
  mutualWave: boolean;
  waveMessage?: string;
  ethicalCardUsername: string;
}

export interface BeaconPrivacySettings {
  isBeaconActive: boolean;
  isGhostMode: boolean;
  fuzzRadiusMeters: number;
  safeZonesEnabled: boolean;
  allowWaves: boolean;
}

export const DEFAULT_BEACON_SETTINGS: BeaconPrivacySettings = {
  isBeaconActive: true,
  isGhostMode: false,
  fuzzRadiusMeters: 350,
  safeZonesEnabled: true,
  allowWaves: true,
};

export const CROSSED_PATHS_ENCOUNTERS: CrossedPathEncounter[] = [
  {
    id: 'enc-maya-chen',
    userId: 'user-maya-chen',
    name: 'Maya Chen',
    pronouns: 'she/her',
    title: 'Biomaterials Architect',
    organization: 'MycoStrides Labs',
    avatarEmoji: '🍄',
    fuzzedLocation: 'Near Mission District & Valencia',
    distanceFuzzed: '~280m away',
    timeAgo: '15 mins ago',
    timesCrossedThisWeek: 4,
    mutualInterests: ['Zero Waste', 'Mycelium Textiles', 'Catskill Sanctuary'],
    endorsedSanctuary: 'Catskill Animal Sanctuary 🐮',
    hasWaved: false,
    mutualWave: false,
    ethicalCardUsername: 'maya-chen',
  },
  {
    id: 'enc-liam-oconnor',
    userId: 'user-liam-oconnor',
    name: 'Liam O’Connor',
    pronouns: 'he/him',
    title: 'Sanctuary Farm Volunteer & Chef',
    organization: 'Green Sprout Kitchen',
    avatarEmoji: '🌱',
    fuzzedLocation: 'Near Hayes Valley Eco-Market',
    distanceFuzzed: '~420m away',
    timeAgo: '1 hr ago',
    timesCrossedThisWeek: 2,
    mutualInterests: ['Koji Fermentation', 'Dairy-Free Cheeses', 'Woodstock Sanctuary'],
    endorsedSanctuary: 'Woodstock Farm Sanctuary 🐑',
    hasWaved: true,
    mutualWave: true,
    waveMessage: 'Hey! Loved seeing your fermentation post on Ethical Launchpad! 👋',
    ethicalCardUsername: 'liam-oconnor',
  },
  {
    id: 'enc-amara-patel',
    userId: 'user-amara-patel',
    name: 'Dr. Amara Patel',
    pronouns: 'she/her',
    title: 'Veterinary Surgeon & Ahimsa Advocate',
    organization: 'Peepal Farm Veterinary Alliance',
    avatarEmoji: '🐕',
    fuzzedLocation: 'Near Botanical Conservatory',
    distanceFuzzed: '~350m away',
    timeAgo: '3 hrs ago',
    timesCrossedThisWeek: 1,
    mutualInterests: ['Street Animal Rescue', 'Ahimsa Care', 'Peepal Farm'],
    endorsedSanctuary: 'Peepal Farm Animals Recovery 🐕',
    hasWaved: false,
    mutualWave: false,
    ethicalCardUsername: 'amara-patel',
  },
  {
    id: 'enc-kai-tanaka',
    userId: 'user-kai-tanaka',
    name: 'Kai Tanaka',
    pronouns: 'they/them',
    title: 'Solar Mobility & Cargo Bike Founder',
    organization: 'Velove Green Couriers',
    avatarEmoji: '🚲',
    fuzzedLocation: 'Near Embarcadero Greenway',
    distanceFuzzed: '~500m away',
    timeAgo: '5 hrs ago',
    timesCrossedThisWeek: 3,
    mutualInterests: ['Urban Cycling', 'Micro-Mobility', 'Clean Air Cities'],
    endorsedSanctuary: 'Dean Farm Trust 🐖',
    hasWaved: false,
    mutualWave: false,
    ethicalCardUsername: 'kai-tanaka',
  },
  {
    id: 'enc-sophie-dubois',
    userId: 'user-sophie-dubois',
    name: 'Sophie Dubois',
    pronouns: 'she/her',
    title: 'Cruelty-Free Fashion Buyer',
    organization: 'Atelier Sans Cuir',
    avatarEmoji: '👜',
    fuzzedLocation: 'Near Financial District Eco Hub',
    distanceFuzzed: '~400m away',
    timeAgo: 'Yesterday',
    timesCrossedThisWeek: 2,
    mutualInterests: ['Apple Leather', 'Zero Slaughter', 'Fashion Revolution'],
    endorsedSanctuary: 'Catskill Animal Sanctuary 🐮',
    hasWaved: false,
    mutualWave: false,
    ethicalCardUsername: 'sophie-dubois',
  },
];

export const BEACON_SAFETY_RULES = [
  {
    title: '300m–500m Geohash Fuzzing',
    desc: 'Exact coordinates are NEVER broadcast or stored. Location is calculated in broad neighborhood cells.',
  },
  {
    title: '1-Tap Ghost Mode',
    desc: 'Toggle Ghost Mode on whenever you want to be completely invisible in crossed-paths timelines.',
  },
  {
    title: 'Automatic Safe Zones',
    desc: 'Your home and private locations are automatically blacklisted from beacon broadcasts.',
  },
  {
    title: 'Zero-Pressure Wave Protocol',
    desc: 'You can only message someone if BOTH members tap "Wave Back" (mutual consent required).',
  },
];
