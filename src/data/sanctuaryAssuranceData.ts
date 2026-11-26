/**
 * sanctuaryAssuranceData.ts — Decentralized Mutual-Aid Emergency Health Pool
 *
 * Transparent community-backed insurance pool for farm sanctuaries & animal rescues.
 * 100% of community reserves disburse directly to verified veterinary hospitals
 * with immutable cryptographic proof hashes (SHA-256) and zero platform cuts.
 */

export interface AssuranceClaimItem {
  item: string;
  cost: number;
}

export interface AssuranceClaim {
  id: string;
  sanctuaryId: string;
  sanctuaryName: string;
  sanctuaryLocation: string;
  sanctuaryFlag: string;
  animalName: string;
  species: string;
  speciesEmoji: string;
  emergencyCondition: string;
  vetHospital: string;
  totalAmount: number;
  status: 'Disbursed' | 'Verified' | 'Under Review';
  disbursedDate: string;
  txHash: string;
  blockNumber: number;
  itemizedReceipt: AssuranceClaimItem[];
  verifiedBy: string;
  story: string;
}

export interface PoolStats {
  totalReservesUsdc: number;
  totalClaimsPaidUsdc: number;
  protectedAnimalsCount: number;
  participatingSanctuaries: number;
  averageDisbursalHours: number;
}

export interface PoolPledgeTier {
  id: string;
  amount: number;
  title: string;
  karmaReward: number;
  badge: string;
  coverageImpact: string;
}

export const SANCTUARY_POOL_STATS: PoolStats = {
  totalReservesUsdc: 52480,
  totalClaimsPaidUsdc: 134800,
  protectedAnimalsCount: 1840,
  participatingSanctuaries: 42,
  averageDisbursalHours: 2.4,
};

export const POOL_PLEDGE_TIERS: PoolPledgeTier[] = [
  {
    id: 'tier-guardian-micro',
    amount: 5,
    title: 'Emergency Syringe & Antibiotics',
    karmaReward: 50,
    badge: '🐾 First Aid Underwriter',
    coverageImpact: 'Covers emergency pain relief injections and sterile dressings.',
  },
  {
    id: 'tier-guardian-standard',
    amount: 25,
    title: 'Diagnostic X-Ray & Blood Panel',
    karmaReward: 180,
    badge: '🛡️ Sanctuary Shield Backer',
    coverageImpact: 'Covers trauma radiology and overnight clinic oxygen ward stays.',
  },
  {
    id: 'tier-guardian-angel',
    amount: 100,
    title: 'Surgical Fracture & ICU Pool',
    karmaReward: 650,
    badge: '⭐ Guardian Angel Underwriter',
    coverageImpact:
      'Covers complex orthopedic surgeries, titanium pins, and veterinary anaesthesia.',
  },
];

export const ASSURANCE_CLAIMS_DATA: AssuranceClaim[] = [
  {
    id: 'claim-084-barnaby',
    sanctuaryId: 'shelter-catskill',
    sanctuaryName: 'Catskill Animal Sanctuary',
    sanctuaryLocation: 'Saugerties, NY, USA',
    sanctuaryFlag: '🇺🇸',
    animalName: 'Barnaby',
    species: 'Calf',
    speciesEmoji: '🐮',
    emergencyCondition: 'Acute Neonatal Bronchial Pneumonia',
    vetHospital: 'Hudson Valley Equine & Farm Veterinary Hospital',
    totalAmount: 680,
    status: 'Disbursed',
    disbursedDate: 'Yesterday',
    txHash: '0x7a9c8f2b3e4d5a1b0c9f8e7d6a5b4c3d2e1f0a9b',
    blockNumber: 18492041,
    verifiedBy: 'Dr. Sarah Higgins, DVM (Sanctuary Alliance Board)',
    story:
      'Rescued newborn dairy calf Barnaby developed severe respiratory distress following sub-zero temperatures. Admitted to the 24/7 ICU for chamber nebulization, systemic antibiotic infusions, and heated electrolyte therapy.',
    itemizedReceipt: [
      { item: 'ICU Heated Chamber Stay (48 Hours)', cost: 280 },
      { item: 'Ultrasonic Bronchodilator Nebulizer', cost: 160 },
      { item: 'Ceftiofur Antibiotic Regimen & IV Lines', cost: 140 },
      { item: 'Arterial Blood Gas Diagnostics', cost: 100 },
    ],
  },
  {
    id: 'claim-083-sheru',
    sanctuaryId: 'shelter-peepal',
    sanctuaryName: 'Peepal Farm Animal Rescue',
    sanctuaryLocation: 'Dharamsala, Himachal Pradesh, India',
    sanctuaryFlag: '🇮🇳',
    animalName: 'Sheru',
    species: 'Dog',
    speciesEmoji: '🐕',
    emergencyCondition: 'Compound Tibial Fracture After Hit-and-Run',
    vetHospital: 'Peepal Farm Surgical Recovery Ward',
    totalAmount: 420,
    status: 'Disbursed',
    disbursedDate: '3 days ago',
    txHash: '0x4b1e9a2d8c7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d',
    blockNumber: 18489110,
    verifiedBy: 'Dr. Robin Singh, DVM (Chief Surgeon)',
    story:
      'Found unconscious on a mountain highway with multiple open bone fragments. Surgical orthopedic team inserted external titanium fixation pins to realign the tibia and avoid amputation.',
    itemizedReceipt: [
      { item: 'Emergency Surgical Debridement', cost: 150 },
      { item: 'Titanium Fixator Plate & Screws', cost: 170 },
      { item: 'Post-Op Analgesia & Dressing Changes', cost: 100 },
    ],
  },
  {
    id: 'claim-082-buttercup',
    sanctuaryId: 'shelter-woodstock',
    sanctuaryName: 'Woodstock Farm Sanctuary',
    sanctuaryLocation: 'High Falls, NY, USA',
    sanctuaryFlag: '🇺🇸',
    animalName: 'Buttercup',
    species: 'Cow',
    speciesEmoji: '🐮',
    emergencyCondition: 'Infected Mandibular Molar & Sinus Abscess',
    vetHospital: 'Cornell Large Animal Hospital',
    totalAmount: 850,
    status: 'Disbursed',
    disbursedDate: '1 week ago',
    txHash: '0x9e2d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
    blockNumber: 18471902,
    verifiedBy: 'Dr. Matthew Miller, DVM (Cornell Large Animal)',
    story:
      'Senior cow Buttercup lost 60 lbs due to an infected root canal that prevented chewing alfalfa hay. Cornell dental surgeons safely performed standing sedation tooth extraction and flushed the sinus cavity.',
    itemizedReceipt: [
      { item: 'Standing Sedation & Oral Nerve Block', cost: 320 },
      { item: 'Bovine Molar Surgical Extraction', cost: 330 },
      { item: 'Antimicrobial Sinus Trephination Flush', cost: 200 },
    ],
  },
  {
    id: 'claim-081-winston',
    sanctuaryId: 'shelter-dean',
    sanctuaryName: 'Dean Farm Trust',
    sanctuaryLocation: 'Chepstow, Wales, UK',
    sanctuaryFlag: '🇬🇧',
    animalName: 'Winston',
    species: 'Pig',
    speciesEmoji: '🐖',
    emergencyCondition: 'Senior Osteoarthritis Stifle Joint Effusion',
    vetHospital: 'Severn Valley Equine & Farm Clinic',
    totalAmount: 340,
    status: 'Disbursed',
    disbursedDate: '2 weeks ago',
    txHash: '0x1f8a7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f',
    blockNumber: 18458921,
    verifiedBy: 'Dr. Gethin Davies, MRCVS',
    story:
      'Winston is an 8-year-old rescued Yorkshire pig. His weight caused severe knee fluid buildup making standing painful. Vet clinic performed needle arthrocentesis and injected high-viscosity hyaluronic acid.',
    itemizedReceipt: [
      { item: 'Bilateral Joint Arthrocentesis Drain', cost: 160 },
      { item: 'Intra-articular Hyaluronic Acid', cost: 120 },
      { item: 'Meloxicam Oral Anti-Inflammatory', cost: 60 },
    ],
  },
  {
    id: 'claim-080-maya',
    sanctuaryId: 'shelter-podere',
    sanctuaryName: 'Podere Melograno Sanctuary',
    sanctuaryLocation: 'Tuscany, Italy',
    sanctuaryFlag: '🇮🇹',
    animalName: 'Maya',
    species: 'Donkey',
    speciesEmoji: '🫏',
    emergencyCondition: 'Large Colon Impaction Colic',
    vetHospital: 'Clinica Veterinaria San Silvestro',
    totalAmount: 1150,
    status: 'Verified',
    disbursedDate: 'Awaiting Final Review',
    txHash: '0x5d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c',
    blockNumber: 18449120,
    verifiedBy: 'Dr. Marco Rossi, DVM (Pisa Equine Medicine)',
    story:
      'Rescued pack donkey Maya suffered painful intestinal blockage. Hospitalized for 72 hours on nasogastric electrolyte flushes, analgesics, and rectal ultrasound monitoring to avoid emergency laparotomy.',
    itemizedReceipt: [
      { item: 'Nasogastric Tube Intubation & Electrolytes', cost: 420 },
      { item: 'Continuous IV Fluid Therapy (72 Hours)', cost: 450 },
      { item: 'Equine Abdominal Ultrasound & Analgesia', cost: 280 },
    ],
  },
];
