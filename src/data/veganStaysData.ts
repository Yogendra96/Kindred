/**
 * veganStaysData.ts — 100% Vegan Homestays, Farm Sanctuary Cottages & B&Bs
 *
 * OpenStreetMap-tagged eco-accommodations (diet:vegan=only) where every stay
 * directly funds rescued farm animals, provides a 100% plant-based host kitchen,
 * and guarantees zero animal exploitation (down-free, wool-free, leather-free).
 */

export interface VeganStay {
  id: string;
  name: string;
  type: 'Sanctuary Cottage' | 'Eco-Homestay' | 'Vegan B&B' | 'Permaculture Villa';
  tagline: string;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  emoji: string;
  hostName: string;
  hostAvatar: string;
  hostBio: string;
  animalImpact: string;
  amenities: string[];
  houseRules: string[];
  osmTag: string; // OpenStreetMap query tag
  availableDates: string[];
  description: string;
}

export const VEGAN_STAYS: VeganStay[] = [
  {
    id: 'stay-catskill-cottage',
    name: 'Willow Brook Sanctuary Guest Cabin',
    type: 'Sanctuary Cottage',
    tagline: 'Wake up next to rescued sheep, calves, and goats in the tranquil Hudson Valley',
    city: 'Catskill, NY',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    pricePerNight: 125,
    rating: 5.0,
    reviewsCount: 148,
    emoji: '🏡',
    hostName: 'Sarah & Noah (Sanctuary Founders)',
    hostAvatar: '🐑',
    hostBio:
      'We founded Willow Brook 8 years ago. 100% of cabin revenue goes directly to winter feed, veterinary care, and barn expansion for our 65 rescued residents.',
    animalImpact: 'Each night booked feeds 4 rescued cows and 8 sheep for an entire week.',
    amenities: [
      '100% Plant-Based Kitchen',
      'Meet the Rescued Animals Daily',
      'Organic Herb Garden Access',
      'Down-Free Eucalyptus Duvets',
      'Cruelty-Free Toiletries',
      'Solar Powered & Off-Grid Ready',
    ],
    houseRules: [
      'Strictly zero animal products on premises (food, leather, cosmetics).',
      'Quiet hours after 10 PM to protect resting animals.',
      'Companion animals allowed with advance notice.',
    ],
    osmTag: 'tourism=chalet;diet:vegan=only;animals=sanctuary',
    availableDates: ['Jun 12-16', 'Jun 20-25', 'Jul 1-6', 'Jul 15-20'],
    description:
      'Charming timber cabin nestled on a 40-acre registered farm sanctuary. Features an open-concept kitchen stocked with organic oats, plant milks, and seasonal sanctuary orchard fruits. Sip morning coffee while watching sheep graze outside your bedroom window.',
  },
  {
    id: 'stay-kyoto-zen',
    name: 'Arashiyama Bamboo Vegan Machiya',
    type: 'Eco-Homestay',
    tagline: 'Traditional 120-year-old wooden Kyoto townhouse with private Buddhist tea garden',
    city: 'Kyoto',
    country: 'Japan',
    countryCode: 'JP',
    flag: '🇯🇵',
    pricePerNight: 95,
    rating: 4.9,
    reviewsCount: 215,
    emoji: '🎋',
    hostName: 'Kenji & Mei Tanaka',
    hostAvatar: '🍵',
    hostBio:
      'Practicing Zen Buddhists and plant culinary artists. We teach guests authentic Shojin Ryori cooking and local Kyoto seasonal preservation.',
    animalImpact: 'Supports cruelty-free educational workshops and temple food preservation.',
    amenities: [
      'Shojin Ryori Breakfast Included',
      'Tatami Mats & Natural Indigo Futons',
      'Cedar Soaking Tub (Cruelty-Free Salts)',
      'High-Speed Fiber Internet',
      'Traditional Tea Ceremony Room',
    ],
    houseRules: [
      'No meat, fish broth, or seafood allowed in the kitchen.',
      'Remove outdoor footwear at the genkan entrance.',
    ],
    osmTag: 'tourism=guest_house;diet:vegan=only;heritage=machiya',
    availableDates: ['May 1-5', 'May 18-22', 'Jun 5-10', 'Jun 22-28'],
    description:
      'Immerse yourself in timeless Kyoto elegance. Located 5 minutes from the Sagano Bamboo Grove, this restored machiya features 100% vegan organic Japanese breakfasts, hand-milled ceremonial matcha, and zero animal animal-derived mats or bedding.',
  },
  {
    id: 'stay-tuscany-villa',
    name: 'Podere Melograno Olive Grove Retreat',
    type: 'Permaculture Villa',
    tagline: 'Biodynamic farmstay amid organic olive hills, cypress trees, and rescued burros',
    city: 'San Gimignano, Tuscany',
    country: 'Italy',
    countryCode: 'IT',
    flag: '🇮🇹',
    pricePerNight: 110,
    rating: 4.95,
    reviewsCount: 182,
    emoji: '🫒',
    hostName: 'Matteo & Giulia Rossi',
    hostAvatar: '🌿',
    hostBio:
      'Third-generation Tuscan farmers who converted the ancestral family estate to 100% vegan permaculture and animal sanctuary in 2017.',
    animalImpact: 'Sponsors 7 rescued Tuscan draft horses and 12 miniature donkeys.',
    amenities: [
      'Wood-Fired Sourdough Pizza Oven',
      'Cold-Pressed Extra Virgin Olive Oil on Tap',
      'Saltwater Eco-Pool',
      'Organic Vineyard & Fig Orchards',
      'Electric Vehicle Charger',
    ],
    houseRules: [
      'All food prepared on site must be 100% plant-based.',
      'Composting and recycling sorted at all times.',
    ],
    osmTag: 'tourism=farm_stay;diet:vegan=only;organic=yes',
    availableDates: ['Jul 10-15', 'Jul 24-29', 'Aug 4-9', 'Aug 18-23'],
    description:
      'Sun-drenched stone farmhouse overlooking the medieval towers of San Gimignano. Harvest your own wild rocket, heirloom tomatoes, and figs for sunset dinners paired with certified organic vegan Chianti.',
  },
  {
    id: 'stay-chiangmai-treehouse',
    name: 'Baan Dok Mai Organic Sanctuary Eco-Lodge',
    type: 'Eco-Homestay',
    tagline: 'Open-air teakwood treehouse perched above organic fruit orchards and misty peaks',
    city: 'Chiang Mai',
    country: 'Thailand',
    countryCode: 'TH',
    flag: '🇹🇭',
    pricePerNight: 65,
    rating: 4.9,
    reviewsCount: 320,
    emoji: '🌴',
    hostName: 'Somchai & Anong',
    hostAvatar: '🥭',
    hostBio:
      'Founders of northern Thailand Jay lifestyle collective. We offer guided vegan cooking foraging walks and rescued elephant forest walks (no riding, no hooks).',
    animalImpact: 'Funds ethical hands-off elephant retirement in the Mae Taeng valley.',
    amenities: [
      'Free Coconut & Mango Daily Breakfast',
      'Natural Bamboo & Organic Cotton Linens',
      'Outdoor Jungle Rain Shower',
      'Yoga & Meditation Pavilion',
      'Filtered Spring Mountain Water',
    ],
    houseRules: [
      'Strictly Jay / Vegan on the property.',
      'Please respect local village peacefulness.',
    ],
    osmTag: 'tourism=camp_site;diet:vegan=only;eco=true',
    availableDates: ['Sep 1-7', 'Sep 14-20', 'Oct 2-8', 'Oct 20-26'],
    description:
      'Perched in the tropical canopy of northern Thailand. Enjoy morning bird chorus, fresh rambutan plucked from branches, and zero-waste, single-origin local mountain coffee.',
  },
  {
    id: 'stay-blackforest-bnb',
    name: 'Schwarzwald Green Haven B&B',
    type: 'Vegan B&B',
    tagline: 'Modern alpine chalet beside pine trails with artisan sourdough & homemade nut cheese',
    city: 'Freiburg & Black Forest',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    pricePerNight: 85,
    rating: 4.85,
    reviewsCount: 94,
    emoji: '🌲',
    hostName: 'Lukas & Hannah Weber',
    hostAvatar: '🥨',
    hostBio:
      'Outdoor mountaineers and raw pastry chefs. We created Germany’s greenest eco-lodge with certified zero fossil fuel heating and passive solar design.',
    animalImpact:
      'Zero animal byproducts. Portions of profits support Black Forest wildlife rehab.',
    amenities: [
      'Gourmet Multi-Course Vegan Breakfast',
      'Pine Wood Finnish Sauna (Plant Essential Oils)',
      'Direct Trail Access to Feldberg',
      'E-Bike Charging & Rental',
      'Free Public Transit Pass Included',
    ],
    houseRules: ['Vegan house policy.', 'Ski & hiking gear stored in designated mudroom.'],
    osmTag: 'tourism=hotel;diet:vegan=only;energy_rating=A_plus',
    availableDates: ['Jul 5-10', 'Jul 18-23', 'Aug 8-13', 'Aug 25-30'],
    description:
      'Breathe in crisp pine air at this architect-designed passive house. Wake up to warm seeded sourdough loaves, cultured almond quark, fresh berry compotes, and panoramic valley views.',
  },
];
