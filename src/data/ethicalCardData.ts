/**
 * ethicalCardData.ts — Digital Business Card & Bio Hub Data Model
 *
 * Tree-free, 100% digital business card and Linktree alternative.
 * Combines contact information, standard vCard export, verified climate
 * and animal protection badges, and endorsed sanctuary micro-donations.
 */

export type CardTheme = 'midnight-emerald' | 'solar-flora' | 'deep-forest' | 'cosmic-violet';

export interface EthicalLink {
  id: string;
  title: string;
  url: string;
  icon: 'linkedin' | 'github' | 'website' | 'instagram' | 'substack' | 'launchpad' | 'podcast';
  category: 'Professional' | 'Social' | 'Cause' | 'Portfolio';
}

export interface EthicalCardProfile {
  id: string;
  username: string;
  name: string;
  pronouns: string;
  title: string;
  organization: string;
  bio: string;
  avatarEmoji: string;
  avatarUrl?: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  theme: CardTheme;
  impact: {
    yearsPlantBased: number;
    co2AvoidedKg: number;
    animalLivesProtected: number;
    karmaScore: number;
  };
  endorsedSanctuary: {
    id: string;
    name: string;
    emoji: string;
    location: string;
    tagline: string;
  };
  links: EthicalLink[];
  tags: string[];
}

export function generateVCard(profile: EthicalCardProfile): string {
  const nameParts = profile.name.trim().split(' ');
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : profile.name;

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name}`,
    `N:${lastName};${firstName};;;`,
    `TITLE:${profile.title}`,
    `ORG:${profile.organization}`,
    `EMAIL;TYPE=INTERNET,WORK:${profile.email}`,
    `TEL;TYPE=CELL:${profile.phone}`,
    `URL:${profile.website || `https://kindred.earth/u/${profile.username}`}`,
    `NOTE:Kindred Ethical Card · ${profile.bio} · Endorsed: ${profile.endorsedSanctuary.name} · View Bio: https://kindred.earth/u/${profile.username}`,
    'END:VCARD',
  ].join('\r\n');
}

export const MY_ETHICAL_CARD: EthicalCardProfile = {
  id: 'card-alex-rivers',
  username: 'alex-rivers',
  name: 'Alex Rivers',
  pronouns: 'they/them',
  title: 'Founder & Climate Architect',
  organization: 'Kindred Ecosystem Labs',
  bio: 'Building circular biomaterials and ethical decentralized consumer tech. Advocate for zero-slaughter economies.',
  avatarEmoji: '🌱',
  location: 'San Francisco, CA & Remote',
  email: 'alex@kindred.earth',
  phone: '+1 (415) 890-3421',
  website: 'https://kindred.earth/u/alex-rivers',
  theme: 'midnight-emerald',
  impact: {
    yearsPlantBased: 4.5,
    co2AvoidedKg: 2480,
    animalLivesProtected: 490,
    karmaScore: 1850,
  },
  endorsedSanctuary: {
    id: 'shelter-catskill',
    name: 'Catskill Animal Sanctuary',
    emoji: '🐮',
    location: 'Saugerties, NY, USA',
    tagline: 'Direct sponsorship of pediatric calf milk and veterinary recovery.',
  },
  links: [
    {
      id: 'link-launchpad',
      title: 'Our Next-Gen Fermentation Stretch Mozzarella',
      url: 'https://kindred.earth/launchpad',
      icon: 'launchpad',
      category: 'Portfolio',
    },
    {
      id: 'link-linkedin',
      title: 'Connect on LinkedIn',
      url: 'https://linkedin.com/in/alex-rivers-kindred',
      icon: 'linkedin',
      category: 'Professional',
    },
    {
      id: 'link-github',
      title: 'Open Source Climate Models (GitHub)',
      url: 'https://github.com/kindred-earth',
      icon: 'github',
      category: 'Professional',
    },
    {
      id: 'link-substack',
      title: 'Post-Slaughter Economy (Newsletter)',
      url: 'https://alexrivers.substack.com',
      icon: 'substack',
      category: 'Social',
    },
  ],
  tags: ['Alt-Protein', 'Circular Tech', 'Zero Waste', 'Sanctuary Guardian'],
};

export const SAVED_ETHICAL_CONTACTS: EthicalCardProfile[] = [
  {
    id: 'card-elena-rostova',
    username: 'elena-rostova',
    name: 'Dr. Elena Rostova',
    pronouns: 'she/her',
    title: 'Lead Mycologist & Biomaterial Scientist',
    organization: 'MycoStrides Labs',
    bio: 'Pioneering pure mycelium leather alternatives to replace animal hides in luxury fashion.',
    avatarEmoji: '🍄',
    location: 'Berlin, Germany',
    email: 'elena@mycostrides.de',
    phone: '+49 30 901820',
    website: 'https://mycostrides.de',
    theme: 'deep-forest',
    impact: {
      yearsPlantBased: 7.0,
      co2AvoidedKg: 4200,
      animalLivesProtected: 760,
      karmaScore: 2420,
    },
    endorsedSanctuary: {
      id: 'shelter-dean',
      name: 'Dean Farm Trust',
      emoji: '🐖',
      location: 'Chepstow, Wales, UK',
      tagline: 'Straw bedding and senior pig joint care.',
    },
    links: [
      {
        id: 'link-elena-papers',
        title: 'Peer-Reviewed Mycelium Tensile Research',
        url: 'https://nature.com/articles/mycelium-bio-textiles',
        icon: 'website',
        category: 'Portfolio',
      },
      {
        id: 'link-elena-linkedin',
        title: 'LinkedIn Network',
        url: 'https://linkedin.com/in/elena-rostova',
        icon: 'linkedin',
        category: 'Professional',
      },
    ],
    tags: ['Biomaterials', 'Mycology', 'Circular Design'],
  },
  {
    id: 'card-priya-sharma',
    username: 'priya-sharma',
    name: 'Priya Sharma',
    pronouns: 'she/her',
    title: 'Director of Animal Rescue & Rural Health',
    organization: 'Peepal Farm Animals Recovery',
    bio: 'Rescuing injured stray cows, street dogs, and mules in the Indian Himalayas. Practicing ahimsa organic farming.',
    avatarEmoji: '🐕',
    location: 'Dharamsala, Himachal Pradesh, India',
    email: 'priya@peepalfarm.org',
    phone: '+91 98160 12345',
    website: 'https://peepalfarm.org',
    theme: 'solar-flora',
    impact: {
      yearsPlantBased: 9.5,
      co2AvoidedKg: 5800,
      animalLivesProtected: 1400,
      karmaScore: 3890,
    },
    endorsedSanctuary: {
      id: 'shelter-peepal',
      name: 'Peepal Farm Animal Rescue',
      emoji: '🐕',
      location: 'Dharamsala, India',
      tagline: 'Emergency trauma surgery and street cow recovery.',
    },
    links: [
      {
        id: 'link-priya-vlog',
        title: 'Watch Daily Rescue & Clinic Vlogs',
        url: 'https://youtube.com/@peepalfarm',
        icon: 'podcast',
        category: 'Social',
      },
      {
        id: 'link-priya-volunteer',
        title: 'Volunteer in the Himalayas',
        url: 'https://peepalfarm.org/volunteer',
        icon: 'website',
        category: 'Cause',
      },
    ],
    tags: ['Animal Rescue', 'Ahimsa Farming', 'Veterinary Care'],
  },
  {
    id: 'card-marcus-vance',
    username: 'marcus-vance',
    name: 'Chef Marcus Vance',
    pronouns: 'he/him',
    title: 'Executive Chef & Fermentation Innovator',
    organization: 'Botanica Gastro-Atelier',
    bio: 'Reinventing classic French charcuterie and aged alpine cheeses with oat koji and fungal fermentations.',
    avatarEmoji: '🧑‍🍳',
    location: 'Lyon, France',
    email: 'marcus@botanicagastro.fr',
    phone: '+33 4 72 10 30 20',
    website: 'https://botanicagastro.fr',
    theme: 'solar-flora',
    impact: {
      yearsPlantBased: 5.2,
      co2AvoidedKg: 3100,
      animalLivesProtected: 620,
      karmaScore: 1980,
    },
    endorsedSanctuary: {
      id: 'shelter-woodstock',
      name: 'Woodstock Farm Sanctuary',
      emoji: '🐑',
      location: 'High Falls, NY, USA',
      tagline: 'Winter alfalfa hay and rescued sheep rehabilitation.',
    },
    links: [
      {
        id: 'link-marcus-recipes',
        title: 'Chef Marcus Koji Cheese Blueprint',
        url: 'https://botanicagastro.fr/recipes',
        icon: 'website',
        category: 'Portfolio',
      },
      {
        id: 'link-marcus-insta',
        title: 'Culinary Reel Feed',
        url: 'https://instagram.com/chef_marcus_vance',
        icon: 'instagram',
        category: 'Social',
      },
    ],
    tags: ['Culinary Arts', 'Koji Fermentation', 'Vegan Michelin'],
  },
  {
    id: 'card-jordan-lee',
    username: 'jordan-lee',
    name: 'Jordan Lee',
    pronouns: 'they/them',
    title: 'Zero-Waste Industrial Packaging Designer',
    organization: 'TerraPack Solutions',
    bio: 'Designing compostable seaweed-based film packaging to eradicate petroleum plastic from plant food delivery.',
    avatarEmoji: '🌊',
    location: 'Seattle, WA, USA',
    email: 'jordan@terrapack.eco',
    phone: '+1 (206) 555-0199',
    website: 'https://terrapack.eco',
    theme: 'cosmic-violet',
    impact: {
      yearsPlantBased: 3.8,
      co2AvoidedKg: 1950,
      animalLivesProtected: 340,
      karmaScore: 1420,
    },
    endorsedSanctuary: {
      id: 'shelter-catskill',
      name: 'Catskill Animal Sanctuary',
      emoji: '🐮',
      location: 'Saugerties, NY, USA',
      tagline: 'Compassionate lifetime care for dairy survivors.',
    },
    links: [
      {
        id: 'link-jordan-portfolio',
        title: 'Seaweed Thermoform Case Studies',
        url: 'https://terrapack.eco/cases',
        icon: 'website',
        category: 'Portfolio',
      },
      {
        id: 'link-jordan-github',
        title: 'Open Source LCA Calculator',
        url: 'https://github.com/terrapack/lca-tools',
        icon: 'github',
        category: 'Professional',
      },
    ],
    tags: ['Seaweed Biomaterials', 'Zero Waste', 'LCA Analytics'],
  },
];
