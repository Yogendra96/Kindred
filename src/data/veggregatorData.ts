/**
 * Kindred Veggregator & Ethical Marketplace Data
 * Verified 100% Plant-Based & Cruelty-Free Products, Artisan Brands & Storefronts
 */

export interface VeggregatorProduct {
  id: string;
  name: string;
  tagline: string;
  brandId: string;
  brandName: string;
  category:
    | 'Snacks & Confectionery'
    | 'Pantry & Cheese'
    | 'Apparel & Living'
    | 'Cloud Kitchen & Meals'
    | 'Wellness & Care';
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  emoji: string;
  badges: string[];
  impactMetric: {
    animalsSpared: string;
    co2SavedKg: number;
    waterSavedLiters: number;
  };
  ingredientsSummary: string;
  description: string;
  inStock: boolean;
  deliveryTime: string; // e.g. "Instant 30-min Cloud Delivery" or "2-3 Days Carbon-Neutral"
}

export interface VeggregatorBrand {
  id: string;
  name: string;
  tagline: string;
  founder: string;
  location: string;
  ethicsScore: number; // 0-100
  certifications: string[];
  bio: string;
  joinedYear: number;
  avatarEmoji: string;
  totalOrdersFulfilled: number;
  impactScoreSummary: string;
}

export const VEGGREGATOR_BRANDS: VeggregatorBrand[] = [
  {
    id: 'b-nakedcocoa',
    name: 'Naked Cocoa & Confections',
    tagline: 'Artisanal snack bars replacing dairy with pure nut butter & whole fruits',
    founder: 'Siddharth & Maya Mehta',
    location: 'Boulder, CO & Bengaluru',
    ethicsScore: 99,
    certifications: ['100% Vegan Certified', 'Fair Trade Cocoa', 'Zero Palm Oil'],
    bio: 'Crafting nostalgic candy bar alternatives without any animal exploitation. We use roasted peanuts, single-origin cacao, and organic medjool dates.',
    joinedYear: 2024,
    avatarEmoji: '🍫',
    totalOrdersFulfilled: 14200,
    impactScoreSummary: 'Over 28,000 dairy-cow hours spared from industrial lactation cycles.',
  },
  {
    id: 'b-floraferments',
    name: 'Flora Botanical Ferments',
    tagline: 'Traditional cave-aged cultured plant cheeses and probiotic butters',
    founder: 'Camille Dubois',
    location: 'Annecy, France & Burlington, VT',
    ethicsScore: 98,
    certifications: ['Certified Vegan', 'Organic Non-GMO', 'Glass Packaging Only'],
    bio: 'Combining old-world French cheese-making secrets with organic cashew creams, penicillium roqueforti, and mountain herb rinds.',
    joinedYear: 2023,
    avatarEmoji: '🧀',
    totalOrdersFulfilled: 21500,
    impactScoreSummary: 'Eliminated 52 tonnes of dairy methane emissions.',
  },
  {
    id: 'b-earthweave',
    name: 'EarthWeave Atelier',
    tagline: 'Circular fashion using mycelium mushroom leather & hemp fibers',
    founder: 'Elena Rostova',
    location: 'Milan & London',
    ethicsScore: 100,
    certifications: ['PETA-Approved Vegan', 'Cradle to Cradle Gold', 'B-Corp Verified'],
    bio: 'Eliminating bovine leather and fossil-fuel synthetic PU. We grow sustainable mycelium root hides that age with timeless elegance.',
    joinedYear: 2024,
    avatarEmoji: '🍄',
    totalOrdersFulfilled: 8900,
    impactScoreSummary: 'Zero animal hides used. 92% less water than bovine leather.',
  },
  {
    id: 'b-cloudroots',
    name: 'Roots & Steam Cloud Kitchen',
    tagline: 'Zero-emission electric-delivered hot gourmet comfort bowls & meals',
    founder: 'Chef Tariq Al-Mansoor',
    location: 'San Francisco, CA',
    ethicsScore: 97,
    certifications: ['Green Restaurant 4-Star', '100% Plant-Based', 'Zero Single-Use Plastic'],
    bio: 'Direct to your door in 30 minutes via e-cargo bike. Gourmet whole-food bowls with house-made seitan, smoky tempeh, and tahini drizzle.',
    joinedYear: 2025,
    avatarEmoji: '🍲',
    totalOrdersFulfilled: 34100,
    impactScoreSummary: '100% compostable mycelium packaging, 0 grams animal byproduct.',
  },
];

export const VEGGREGATOR_PRODUCTS: VeggregatorProduct[] = [
  {
    id: 'vp-snickers-bar',
    name: 'Crunchy Peanut Caramel & Nougat Bar',
    tagline: 'The legendary vegan Snickers bar reimagined with roasted peanuts & oat caramel',
    brandId: 'b-nakedcocoa',
    brandName: 'Naked Cocoa & Confections',
    category: 'Snacks & Confectionery',
    price: 3.5,
    originalPrice: 4.5,
    rating: 4.9,
    reviewCount: 382,
    emoji: '🥜',
    badges: ['Vegan Snickers Alternative', 'No Dairy / No Palm Oil', 'Fair Trade'],
    impactMetric: {
      animalsSpared: 'Saves 1.2 cow-days of milk demand',
      co2SavedKg: 0.85,
      waterSavedLiters: 140,
    },
    ingredientsSummary:
      'Organic Peanuts, Single-Origin 60% Cocoa, Date Caramel, Whipped Oat Nougat, Sea Salt.',
    description:
      'Everything you love about classic peanut candy bars, zero animal cruelty. Crunchy roasted Valencia peanuts layered over velvety date caramel and cloud-soft whipped oat nougat, enrobed in dark chocolate.',
    inStock: true,
    deliveryTime: '2-3 Days Carbon-Neutral',
  },
  {
    id: 'vp-fig-almond-bar',
    name: 'Wild Fig & Activated Almond Superfood Bar',
    tagline: 'Cold-pressed sun-ripened dry fruits and sprouted nuts with zero refined sugar',
    brandId: 'b-nakedcocoa',
    brandName: 'Naked Cocoa & Confections',
    category: 'Snacks & Confectionery',
    price: 3.2,
    originalPrice: 4.0,
    rating: 4.8,
    reviewCount: 219,
    emoji: '🫐',
    badges: ['Raw & Cold-Pressed', 'Sprouted Nuts', 'Gluten-Free'],
    impactMetric: {
      animalsSpared: '100% plant-sprouted, 0 animal inputs',
      co2SavedKg: 0.6,
      waterSavedLiters: 95,
    },
    ingredientsSummary:
      'Black Mission Figs, Activated Almonds, Medjool Dates, Chia Seeds, Ceylon Cinnamon.',
    description:
      'Chewy, naturally sweet, nutrient-dense dry fruit bar. Infused with organic wild figs and slow-activated almonds for sustained clean energy on hikes and busy workdays.',
    inStock: true,
    deliveryTime: '2-3 Days Carbon-Neutral',
  },
  {
    id: 'vp-truffle-camembert',
    name: 'Cave-Aged Black Truffle Cashew Camembert',
    tagline: 'Artisanal bloom rind plant cheese that melts and develops real umami depth',
    brandId: 'b-floraferments',
    brandName: 'Flora Botanical Ferments',
    category: 'Pantry & Cheese',
    price: 11.5,
    originalPrice: 13.0,
    rating: 5.0,
    reviewCount: 541,
    emoji: '🧀',
    badges: ['Award-Winning', 'Cultured & Aged 21 Days', 'Probiotic'],
    impactMetric: {
      animalsSpared: 'Replaces 4.5L cow milk & calf separation',
      co2SavedKg: 3.2,
      waterSavedLiters: 820,
    },
    ingredientsSummary:
      'Organic Cashews, Filtered Spring Water, Black Truffle Oil, Sea Salt, Plant Bacterial Cultures.',
    description:
      'Gourmet cultured cashew cheese wheels dusted with authentic penicillium camemberti. Creamy, spreadable center with delicate earthiness and authentic French terroir notes.',
    inStock: true,
    deliveryTime: 'Chilled Eco-Express (1-2 Days)',
  },
  {
    id: 'vp-cloud-kitchen-bowl',
    name: 'Smoky Maple Tempeh & Avocado Harvest Bowl',
    tagline: 'Chef-prepared hot grain bowl delivered warm in compostable mycelium clam',
    brandId: 'b-cloudroots',
    brandName: 'Roots & Steam Cloud Kitchen',
    category: 'Cloud Kitchen & Meals',
    price: 13.9,
    rating: 4.9,
    reviewCount: 890,
    emoji: '🥗',
    badges: ['Instant Cloud Kitchen', 'Warm Delivery', '32g Clean Protein'],
    impactMetric: {
      animalsSpared: 'Replaces commercial poultry meal',
      co2SavedKg: 4.1,
      waterSavedLiters: 1150,
    },
    ingredientsSummary:
      'Sprouted Quinoa, Organic Maple-Glazed Tempeh, Massaged Curly Kale, Haas Avocado, Green Goddess Tahini.',
    description:
      'Freshly prepared within 15 minutes of ordering. High-protein nourishing warm bowl delivered straight from our certified zero-emission kitchen hubs.',
    inStock: true,
    deliveryTime: '⚡ 25-35 Mins (E-Bike Delivery)',
  },
  {
    id: 'vp-mushroom-bag',
    name: 'Mycelium Root Leather Everyday Crossbody',
    tagline: 'Architectural silhouette bag grown from mushroom roots. Zero plastic PVC.',
    brandId: 'b-earthweave',
    brandName: 'EarthWeave Atelier',
    category: 'Apparel & Living',
    price: 88.0,
    originalPrice: 110.0,
    rating: 4.9,
    reviewCount: 164,
    emoji: '👜',
    badges: ['Mycelium Pure Hide', 'Water Resistant', 'Lifetime Repair Guarantee'],
    impactMetric: {
      animalsSpared: 'Spares cattle farming & chromium tanning',
      co2SavedKg: 18.5,
      waterSavedLiters: 4500,
    },
    ingredientsSummary:
      '100% Grown Fine-Mycelium Root Mat, Organic Hemp Canvas Lining, Recycled Brass Hardware.',
    description:
      'Soft to the touch, waterproof, and develops an exquisite patina over time. Grown in circular indoor vertical farms with zero land clearing or animal slaughter.',
    inStock: true,
    deliveryTime: '3-4 Days Carbon-Neutral',
  },
  {
    id: 'vp-mineral-balm',
    name: 'Coral-Safe Zinc Sun Butter & Lip Balm Tin',
    tagline: 'Broad-spectrum mineral SPF 40 in zero-waste refillable screw tin',
    brandId: 'b-earthweave',
    brandName: 'EarthWeave Atelier',
    category: 'Wellness & Care',
    price: 9.5,
    rating: 4.7,
    reviewCount: 112,
    emoji: '🧴',
    badges: ['Reef Safe', 'Zero Beeswax', 'Candelilla Wax Base'],
    impactMetric: {
      animalsSpared: 'Cruelty-free leaping bunny, no bee products',
      co2SavedKg: 0.4,
      waterSavedLiters: 60,
    },
    ingredientsSummary:
      'Non-Nano Zinc Oxide 22%, Wild Candelilla Wax, Fair-Trade Shea Butter, Jojoba Seed Oil.',
    description:
      'Formulated with plant-derived waxes instead of beeswax. Protects your skin while keeping marine habitats, coral reefs, and pollinator colonies completely untouched.',
    inStock: true,
    deliveryTime: '2-3 Days Carbon-Neutral',
  },
];
