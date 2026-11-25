/**
 * ethicalLaunchpadData.ts — Ethical Product Hunt & Plant Innovation Launchpad
 *
 * Community upvoting and seed micro-backing for emerging plant-based food tech,
 * biomaterials, cruelty-free alternatives, and indie ethical innovators.
 */

export interface LaunchMilestone {
  title: string;
  completed: boolean;
}

export interface BackerPerk {
  id: string;
  amount: number;
  title: string;
  description: string;
  estimatedDelivery: string;
  backersClaimed: number;
}

export interface EthicalProject {
  id: string;
  name: string;
  tagline: string;
  category:
    | 'Alt-Protein & Dairy'
    | 'Biomaterials'
    | 'Zero-Waste Snacks'
    | 'Animal Tech'
    | 'Circular Fashion';
  founder: string;
  location: string;
  avatarEmoji: string;
  upvotesCount: number;
  userUpvoted: boolean;
  fundsRaised: number;
  fundingGoal: number;
  backersCount: number;
  daysLeft: number;
  animalImpactTarget: string;
  story: string;
  milestones: LaunchMilestone[];
  perks: BackerPerk[];
}

export const ETHICAL_PROJECTS: EthicalProject[] = [
  {
    id: 'proj-biomelt-cheese',
    name: 'BioMelt: Precision Fermented Stretch Mozzarella',
    tagline:
      'Authentic melting pizza cheese produced via plant microbial fermentation without dairy cows',
    category: 'Alt-Protein & Dairy',
    founder: 'Dr. Aris Thorne (Former Dairy Biochemist)',
    location: 'San Francisco, CA & Zurich',
    avatarEmoji: '🍕',
    upvotesCount: 428,
    userUpvoted: false,
    fundsRaised: 48500,
    fundingGoal: 60000,
    backersCount: 620,
    daysLeft: 14,
    animalImpactTarget: 'Saves 2,500 dairy cows annually from factory farm lactation cycles.',
    story:
      'We bio-engineered non-animal plant microbes to express genuine plant casein. The result is artisan mozzarella that stretches, bubbles, and browns identically to traditional buffalo mozzarella—with 97% lower greenhouse emissions and zero animal exploitation.',
    milestones: [
      { title: 'Pilot scale bioreactor fermentation achieved', completed: true },
      { title: 'Consumer blind taste tests in 3 artisan pizzerias', completed: true },
      { title: 'Food safety self-GRAS determination filing', completed: false },
      { title: 'Commercial batch production rollout', completed: false },
    ],
    perks: [
      {
        id: 'perk-bm-1',
        amount: 25,
        title: 'Kindred Founder Taster Trio',
        description:
          'First production run 3-pack (Mozzarella Ball, Smoked Provolone, Shreds) shipped fresh in mycelium insulation.',
        estimatedDelivery: 'Oct 2026',
        backersClaimed: 240,
      },
      {
        id: 'perk-bm-2',
        amount: 75,
        title: 'Master Pizza Kit & Recipe Vault',
        description:
          '6-pack of BioMelt, bespoke sourdough starter, and digital masterclass with award-winning plant pizzaiolos.',
        estimatedDelivery: 'Oct 2026',
        backersClaimed: 110,
      },
    ],
  },
  {
    id: 'proj-myco-sneakers',
    name: 'MycoStrides: Pure Mushroom Root Everyday Sneakers',
    tagline:
      'Ultra-durable, waterproof lifestyle runners grown from pure mycelium. Zero leather or plastics.',
    category: 'Biomaterials',
    founder: 'Elena Rostova & Kai Nakamura',
    location: 'London & Milan',
    avatarEmoji: '👟',
    upvotesCount: 389,
    userUpvoted: false,
    fundsRaised: 82000,
    fundingGoal: 75000,
    backersCount: 540,
    daysLeft: 8,
    animalImpactTarget: 'Eliminates cattle hide demand and toxic chromium tanneries.',
    story:
      'Synthetic PU pleather creates microplastics, while bovine leather destroys the Amazon rainforest. MycoStrides are grown vertically indoors on agricultural sawdust in just 14 days, creating a breathable, water-resistant upper that naturally decomposes at end of life.',
    milestones: [
      { title: 'Tensile and water-abrasion durability testing passed', completed: true },
      { title: 'Ergonomic natural algae foam midsole mold finalized', completed: true },
      { title: 'Initial tooling for full sizes EU 36-47', completed: true },
      { title: 'Global carbon-neutral fulfillment dispatch', completed: false },
    ],
    perks: [
      {
        id: 'perk-ms-1',
        amount: 110,
        title: 'Early Bird MycoStrides Pair',
        description:
          'One pair of MycoStrides in your choice of Forest Green, Cloud White, or Obsidian Black.',
        estimatedDelivery: 'Nov 2026',
        backersClaimed: 320,
      },
    ],
  },
  {
    id: 'proj-peanut-nougat',
    name: 'Nirvana Bars: Organic Fair-Trade Vegan Candy Bars',
    tagline:
      'The nostalgic roasted peanut & date caramel nougat bar scaled for global grocery shelves',
    category: 'Zero-Waste Snacks',
    founder: 'Siddharth Mehta',
    location: 'Boulder, CO',
    avatarEmoji: '🥜',
    upvotesCount: 295,
    userUpvoted: false,
    fundsRaised: 18400,
    fundingGoal: 20000,
    backersCount: 310,
    daysLeft: 18,
    animalImpactTarget:
      '100% plant confectionery replacing palm oil and commercial cow milk powder.',
    story:
      'We spent two years perfecting a plant-based version of the iconic Snickers bar. Valencia peanuts, whipped oat nougat, coconut sugar caramel, and 60% single-origin dark chocolate. Zero refined sugar, zero dairy, and wrapped in 100% backyard-compostable cellulose.',
    milestones: [
      { title: 'Custom automated candy enrober line acquired', completed: true },
      { title: 'Shelf-stability microbial validation (12 months)', completed: true },
      { title: 'Distribution agreements with 40 independent ethical grocers', completed: false },
    ],
    perks: [
      {
        id: 'perk-nb-1',
        amount: 20,
        title: 'Nirvana 12-Bar Sampler Crate',
        description:
          '12 individually wrapped peanut nougat bars + exclusive Kindred limited edition stickers.',
        estimatedDelivery: 'Sep 2026',
        backersClaimed: 180,
      },
    ],
  },
  {
    id: 'proj-sanctuary-cam',
    name: 'SanctuaryVision: AI Health Scanner for Rescued Farm Animals',
    tagline:
      'Open-source thermal camera app detecting early joint pain and fever in rescued cows and sheep',
    category: 'Animal Tech',
    founder: 'Catskill Sanctuary Tech Collective',
    location: 'Woodstock, NY',
    avatarEmoji: '🐑',
    upvotesCount: 341,
    userUpvoted: false,
    fundsRaised: 31200,
    fundingGoal: 35000,
    backersCount: 425,
    daysLeft: 22,
    animalImpactTarget: 'Prevents suffering for over 15,000 rescued sanctuary animals globally.',
    story:
      'Sanctuaries operate on thin non-profit budgets. Veterinary diagnostics can be cost-prohibitive. SanctuaryVision provides an open-source mobile computer vision model that monitors animal gait and herd wellness non-invasively using commodity smartphone cameras.',
    milestones: [
      { title: 'Annotated dataset of 45,000 thermal cow and goat images', completed: true },
      { title: 'Mobile edge inference model running on iOS/Android', completed: true },
      { title: 'Multi-sanctuary beta testing in 12 global refuges', completed: false },
    ],
    perks: [
      {
        id: 'perk-sv-1',
        amount: 50,
        title: 'Sponsor a Sanctuary Scanner Kit',
        description:
          'Funds one complete mobile diagnostic deployment for an underfunded animal rescue in India or South America.',
        estimatedDelivery: 'Immediate',
        backersClaimed: 95,
      },
    ],
  },
];
