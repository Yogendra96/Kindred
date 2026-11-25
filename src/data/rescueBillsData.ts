/**
 * rescueBillsData.ts — Micro-Bills for Rescued Farm & Companion Animals
 *
 * Real, itemized veterinary, nutrition, and shelter bills from partner sanctuaries.
 * Users can swipe right in a Tinder/Bumble card stack to sponsor the bill in 1 tap.
 */

export interface BillItem {
  name: string;
  cost: number;
}

export interface AnimalRescueBill {
  id: string;
  animalName: string;
  species: 'Cow' | 'Calf' | 'Sheep' | 'Pig' | 'Dog' | 'Donkey' | 'Goat';
  speciesEmoji: string;
  sanctuaryName: string;
  sanctuaryLocation: string;
  sanctuaryFlag: string;
  billTitle: string;
  billCategory: 'Medical' | 'Nutrition' | 'Shelter & Bedding' | 'Emergency Surgery';
  totalBillAmount: number;
  story: string;
  urgentLevel: 'Immediate' | 'High' | 'Standard';
  daysLeft: number;
  items: BillItem[];
  fundedPercent: number;
  guardianPerk: string;
}

export const RESCUE_BILLS_DATA: AnimalRescueBill[] = [
  {
    id: 'bill-barnaby-calf',
    animalName: 'Barnaby',
    species: 'Calf',
    speciesEmoji: '🐮',
    sanctuaryName: 'Catskill Animal Sanctuary',
    sanctuaryLocation: 'Saugerties, NY, USA',
    sanctuaryFlag: '🇺🇸',
    billTitle: '3-Day Pediatric Formula & Warm Blanket',
    billCategory: 'Nutrition',
    totalBillAmount: 8.5,
    story:
      'Rescued at 4 days old from a dairy auction where male calves are discarded as industrial waste. Barnaby requires warm electrolyte milk replacer 4 times daily to build his immune system.',
    urgentLevel: 'Immediate',
    daysLeft: 2,
    items: [
      { name: 'Electrolyte Calf Formula (3 Days)', cost: 5.5 },
      { name: 'Sterilized Feeding Bottle & Teat', cost: 3.0 },
    ],
    fundedPercent: 20,
    guardianPerk: 'Personal photo update of Barnaby drinking his formula in his fleece coat.',
  },
  {
    id: 'bill-sheru-dog',
    animalName: 'Sheru',
    species: 'Dog',
    speciesEmoji: '🐕',
    sanctuaryName: 'Peepal Farm Animal Rescue',
    sanctuaryLocation: 'Dharamsala, Himachal Pradesh, India',
    sanctuaryFlag: '🇮🇳',
    billTitle: 'Surgical Fracture Splint & Pain Injections',
    billCategory: 'Emergency Surgery',
    totalBillAmount: 14.0,
    story:
      'Hit by a speeding truck on a mountain road, Sheru suffered a broken hind tibia. Our clinic team stabilized the bone and needs support for antibiotic infusions and dressing changes.',
    urgentLevel: 'Immediate',
    daysLeft: 1,
    items: [
      { name: 'X-Ray Diagnostics & Splinting', cost: 7.0 },
      { name: 'Pain Relief & Antibiotic Regimen', cost: 4.5 },
      { name: 'Medicated Wound Dressings', cost: 2.5 },
    ],
    fundedPercent: 45,
    guardianPerk: 'Video call with Sheru and clinic vet during his bandage change.',
  },
  {
    id: 'bill-clover-sheep',
    animalName: 'Clover & Pip',
    species: 'Sheep',
    speciesEmoji: '🐑',
    sanctuaryName: 'Woodstock Farm Sanctuary',
    sanctuaryLocation: 'High Falls, NY, USA',
    sanctuaryFlag: '🇺🇸',
    billTitle: 'Winter Alfalfa Hay Bale & Hoof Trimming',
    billCategory: 'Nutrition',
    totalBillAmount: 11.0,
    story:
      'Clover was saved from a backyard slaughter operation along with her lamb Pip. As freezing temperatures settle in the Hudson Valley, she needs high-protein second-cut alfalfa hay to stay warm.',
    urgentLevel: 'High',
    daysLeft: 4,
    items: [
      { name: 'Organic Second-Cut Alfalfa Hay Bale', cost: 8.0 },
      { name: 'Therapeutic Hoof Trimming & Zinc Dip', cost: 3.0 },
    ],
    fundedPercent: 10,
    guardianPerk: 'Digital Guardian Certificate with Clover and Pip’s ear-tag-free portrait.',
  },
  {
    id: 'bill-ollie-pig',
    animalName: 'Ollie',
    species: 'Pig',
    speciesEmoji: '🐖',
    sanctuaryName: 'Dean Farm Trust',
    sanctuaryLocation: 'Chepstow, Wales, UK',
    sanctuaryFlag: '🇬🇧',
    billTitle: 'Senior Joint Glucosamine & Barley Straw',
    billCategory: 'Medical',
    totalBillAmount: 9.5,
    story:
      'Ollie weighs 650 lbs after being bred for rapid slaughter. Now 7 years old, his joints require daily anti-inflammatory glucosamine treats and fresh deep barley straw to cushion his knees.',
    urgentLevel: 'Standard',
    daysLeft: 6,
    items: [
      { name: 'Senior Pig Joint Supplement (2 Weeks)', cost: 6.0 },
      { name: 'Deep Clean Barley Straw Bedding Bale', cost: 3.5 },
    ],
    fundedPercent: 60,
    guardianPerk: 'Personal belly-rub video of Ollie snoring in his fresh straw bed.',
  },
  {
    id: 'bill-maya-donkey',
    animalName: 'Maya',
    species: 'Donkey',
    speciesEmoji: '🫏',
    sanctuaryName: 'Podere Melograno Sanctuary',
    sanctuaryLocation: 'Tuscany, Italy',
    sanctuaryFlag: '🇮🇹',
    billTitle: 'Equine Dental Float & Vitamin Mash',
    billCategory: 'Medical',
    totalBillAmount: 16.0,
    story:
      'Rescued from illegal tourist carrying on steep cliffs. Maya has worn, sharp molars that made chewing raw hay painful. An equine dentist leveled her teeth and prescribed soft warm bran mash.',
    urgentLevel: 'High',
    daysLeft: 3,
    items: [
      { name: 'Equine Specialized Dental Floating', cost: 11.0 },
      { name: 'Soft Vitamin-Enriched Flaxseed Mash', cost: 5.0 },
    ],
    fundedPercent: 30,
    guardianPerk: 'Tuscan olive wood keepsake stamped with Maya’s hoof emblem.',
  },
  {
    id: 'bill-fern-goat',
    animalName: 'Fern',
    species: 'Goat',
    speciesEmoji: '🐐',
    sanctuaryName: 'Willow Brook Sanctuary',
    sanctuaryLocation: 'Catskill, NY, USA',
    sanctuaryFlag: '🇺🇸',
    billTitle: 'Respiratory Inhaler & Mineral Salt Lick',
    billCategory: 'Medical',
    totalBillAmount: 7.0,
    story:
      'Born with chronic bronchial sensitivity after a cold winter in a crowded livestock trailer. Fern breathes easily thanks to a veterinary chamber inhaler and mineral lick blocks.',
    urgentLevel: 'Standard',
    daysLeft: 5,
    items: [
      { name: 'Salbutamol Bronchodilator Inhaler', cost: 5.0 },
      { name: 'Himalayan Rock Mineral Lick', cost: 2.0 },
    ],
    fundedPercent: 75,
    guardianPerk: 'Sponsor badge displayed on Fern’s pasture paddock shelter.',
  },
];
