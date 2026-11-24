/**
 * rescueShelterData.ts — Verified Animal Rescues & Wildlife Sanctuaries
 *
 * Micro-donation partner dataset for local animal shelters, street animal
 * clinics, wildlife rehabilitation centers, and farm sanctuaries.
 */

export interface DonationTier {
  id: string;
  points: number;
  costCents: number;
  impactTitle: string;
  impactDescription: string;
}

export interface MealReceipt {
  id: string;
  donorName: string;
  animalName: string;
  timeAgo: string;
  mealsCount: number;
  emoji: string;
  note: string;
}

export interface RescueShelter {
  id: string;
  name: string;
  cause: string;
  category: 'Pets' | 'Wildlife' | 'Marine' | 'Farm Sanctuary';
  location: string;
  distanceKm: number;
  verified: boolean;
  avatar: string;
  description: string;
  mealsFundedTotal: number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  donationTiers: DonationTier[];
  recentReceipts: MealReceipt[];
}

export const RESCUE_SHELTERS: RescueShelter[] = [
  {
    id: 'shelter-1',
    name: 'City Paws Animal Rescue',
    cause: 'Stray Dog & Cat Rehabilitation',
    category: 'Pets',
    location: 'Downtown District',
    distanceKm: 1.8,
    verified: true,
    avatar: '🐕',
    description:
      'Provides emergency medical treatment, daily meals, foster homes, and compassionate adoption for stray and abandoned city animals.',
    mealsFundedTotal: 18450,
    coordinate: { latitude: 40.7328, longitude: -73.9382 },
    donationTiers: [
      {
        id: 'tier-1',
        points: 100,
        costCents: 100,
        impactTitle: '1 Nutritious Rescue Meal',
        impactDescription: 'High-protein wet food bowl for an injured or recovering shelter dog.',
      },
      {
        id: 'tier-2',
        points: 250,
        costCents: 250,
        impactTitle: 'Vaccine & Deworming Dose',
        impactDescription:
          'Essential preventive immunization and parasite treatment for stray pups.',
      },
      {
        id: 'tier-3',
        points: 500,
        costCents: 500,
        impactTitle: 'Warm Bedding & Medical Kit',
        impactDescription: 'Sterile bandage wrap, antiseptic, and cozy orthopaedic kennel fleece.',
      },
    ],
    recentReceipts: [
      {
        id: 'rcpt-1',
        donorName: 'Alex K.',
        animalName: 'Buster',
        timeAgo: '12m ago',
        mealsCount: 2,
        emoji: '🐕',
        note: 'Buster enjoyed a warm nutritious dinner bowl!',
      },
      {
        id: 'rcpt-2',
        donorName: 'Priya S.',
        animalName: 'Luna',
        timeAgo: '45m ago',
        mealsCount: 5,
        emoji: '🐱',
        note: 'Luna received medical deworming and evening kibble.',
      },
      {
        id: 'rcpt-3',
        donorName: 'Marco R.',
        animalName: 'Rocky',
        timeAgo: '2h ago',
        mealsCount: 1,
        emoji: '🐶',
        note: 'Rocky is resting comfortably with warm bedding.',
      },
    ],
  },
  {
    id: 'shelter-2',
    name: 'WildLife Haven Sanctuary',
    cause: 'Native Wildlife Rescue & Rehabilitation',
    category: 'Wildlife',
    location: 'Forest Ridge Corridor',
    distanceKm: 4.6,
    verified: true,
    avatar: '🦊',
    description:
      'Dedicated to rescuing orphaned, injured, or displaced native wildlife (foxes, birds of prey, badgers, and hedgehogs) with wild release programs.',
    mealsFundedTotal: 9230,
    coordinate: { latitude: 40.7452, longitude: -73.9298 },
    donationTiers: [
      {
        id: 'tier-1',
        points: 120,
        costCents: 120,
        impactTitle: '1 Day of Fresh Forage & Berries',
        impactDescription:
          'Organic fruit, seeds, and protein mealworms for orphaned wildlife birds.',
      },
      {
        id: 'tier-2',
        points: 300,
        costCents: 300,
        impactTitle: 'Emergency Wildlife First Aid',
        impactDescription: 'Electrolytes, wing splinting, and thermal recovery heat mat care.',
      },
      {
        id: 'tier-3',
        points: 750,
        costCents: 750,
        impactTitle: 'Wild Habitat Release Prep',
        impactDescription: 'Flight-cage conditioning and pre-release tracking leg ring.',
      },
    ],
    recentReceipts: [
      {
        id: 'rcpt-4',
        donorName: 'Elena V.',
        animalName: 'Barnaby (Barn Owl)',
        timeAgo: '1h ago',
        mealsCount: 3,
        emoji: '🦉',
        note: 'Barnaby completed wing rehab and fed full nutrient meal.',
      },
      {
        id: 'rcpt-5',
        donorName: 'David L.',
        animalName: 'Pip (Baby Badger)',
        timeAgo: '3h ago',
        mealsCount: 2,
        emoji: '🦡',
        note: 'Pip received electrolyte formula and cozy straw nest.',
      },
    ],
  },
  {
    id: 'shelter-3',
    name: 'Ocean Guardian Marine Clinic',
    cause: 'Sea Turtle & Marine Life Rescue',
    category: 'Marine',
    location: 'Harbor Coastal Point',
    distanceKm: 7.2,
    verified: true,
    avatar: '🐢',
    description:
      'Rescues sea turtles suffering from plastic ingestion, boat collisions, and ghost net entanglement. Operates ocean rehabilitation tanks.',
    mealsFundedTotal: 12840,
    coordinate: { latitude: 40.7214, longitude: -73.9541 },
    donationTiers: [
      {
        id: 'tier-1',
        points: 150,
        costCents: 150,
        impactTitle: 'Marine Algae & Seaweed Bundle',
        impactDescription: 'Fresh ocean vegetation meal for an endangered green sea turtle.',
      },
      {
        id: 'tier-2',
        points: 350,
        costCents: 350,
        impactTitle: 'Ghost Net Disentanglement Care',
        impactDescription: 'Surgical wound antiseptic and fin rehabilitation therapy.',
      },
      {
        id: 'tier-3',
        points: 800,
        costCents: 800,
        impactTitle: '1 Month Satellite Tracking Tag',
        impactDescription: 'Monitors healthy released sea turtles across migration corridors.',
      },
    ],
    recentReceipts: [
      {
        id: 'rcpt-6',
        donorName: 'Chloe M.',
        animalName: 'Shelly',
        timeAgo: '30m ago',
        mealsCount: 2,
        emoji: '🐢',
        note: 'Shelly the sea turtle was fed organic kelp & algae!',
      },
    ],
  },
  {
    id: 'shelter-4',
    name: 'Sweet Meadows Farm Sanctuary',
    cause: 'Rescued Farm Animal Forever Home',
    category: 'Farm Sanctuary',
    location: 'Valley Meadows Reserve',
    distanceKm: 11.5,
    verified: true,
    avatar: '🐄',
    description:
      'Provides lifelong pasture freedom, clean medical care, and daily nourishment for cows, pigs, sheep, and chickens rescued from industrial agriculture.',
    mealsFundedTotal: 34100,
    coordinate: { latitude: 40.7589, longitude: -73.9184 },
    donationTiers: [
      {
        id: 'tier-1',
        points: 100,
        costCents: 100,
        impactTitle: 'Bale of Sweet Meadow Hay',
        impactDescription: 'Fresh clover and Timothy hay for rescued calves and sheep.',
      },
      {
        id: 'tier-2',
        points: 250,
        costCents: 250,
        impactTitle: 'Organic Veggie & Apple Feast',
        impactDescription: 'Crisp apples, carrots, and pumpkin treats for belly-rub loving pigs.',
      },
      {
        id: 'tier-3',
        points: 600,
        costCents: 600,
        impactTitle: 'Hoof Trimming & Vet Care Fund',
        impactDescription: 'Gentle specialized podiatry care and mineral salt licks.',
      },
    ],
    recentReceipts: [
      {
        id: 'rcpt-7',
        donorName: 'Jordan T.',
        animalName: 'Penelope (Pig)',
        timeAgo: '15m ago',
        mealsCount: 4,
        emoji: '🐖',
        note: 'Penelope enjoyed crisp apple slices and an afternoon mud bath.',
      },
      {
        id: 'rcpt-8',
        donorName: 'Maya B.',
        animalName: 'Barnaby (Calf)',
        timeAgo: '1h ago',
        mealsCount: 2,
        emoji: '🐄',
        note: 'Barnaby munched on fresh clover hay in the sunny pasture.',
      },
    ],
  },
];
