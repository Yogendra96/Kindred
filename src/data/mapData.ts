/**
 * mapData.ts — Local Impact Map data constants
 * Extracted from MapScreen.tsx (SRP: data ≠ UI).
 */

export interface EcoLocation {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  description: string;
  distance: string;
  rating: number;
  open: boolean;
  impact: string;
  lat: number;
  lng: number;
}

export const LOCATIONS: EcoLocation[] = [
  {
    id: '1',
    name: 'GrowNYC Greenmarket',
    category: 'Organic Market',
    categoryIcon: '🌱',
    description:
      'Fresh, local, organic produce direct from 50+ regional farms. Zero plastic, bulk bins.',
    distance: '0.3 km',
    rating: 4.8,
    open: true,
    impact: '↓ 2.1 kg CO₂ vs supermarket',
    lat: 40.7282,
    lng: -73.9942,
  },
  {
    id: '2',
    name: 'TerraCycle Drop-Off',
    category: 'Recycling',
    categoryIcon: '♻️',
    description:
      'Hard-to-recycle items: electronics, batteries, packaging, clothing.',
    distance: '0.6 km',
    rating: 4.5,
    open: true,
    impact: '↓ 1.4 kg CO₂ per visit',
    lat: 40.7306,
    lng: -73.9866,
  },
  {
    id: '3',
    name: 'EVgo Charging Hub',
    category: 'EV Charging',
    categoryIcon: '⚡',
    description:
      '8 fast chargers (150 kW). Solar canopy, 100% renewable electricity.',
    distance: '0.9 km',
    rating: 4.3,
    open: true,
    impact: '↓ 4.6 kg CO₂ vs gas',
    lat: 40.7215,
    lng: -74.0012,
  },
  {
    id: '4',
    name: 'Thrift & Thread Store',
    category: 'Thrift Shop',
    categoryIcon: '👕',
    description:
      'Community thrift — all proceeds support local environmental education programmes.',
    distance: '1.1 km',
    rating: 4.7,
    open: true,
    impact: '↓ 6.4 kg CO₂ per item vs new',
    lat: 40.7251,
    lng: -73.998,
  },
  {
    id: '5',
    name: 'Prospect Park Trails',
    category: 'Green Space',
    categoryIcon: '🌳',
    description:
      'Urban forest with 39 km of trails. 10,000 trees absorbing 50 tonnes CO₂/year.',
    distance: '2.2 km',
    rating: 4.9,
    open: true,
    impact: '🌱 50 t CO₂ absorption/year',
    lat: 40.6602,
    lng: -73.969,
  },
  {
    id: '6',
    name: 'Repair Café Brooklyn',
    category: 'Repair',
    categoryIcon: '🔧',
    description:
      'Free volunteer-run repairs: electronics, clothing, furniture, bikes. No waste.',
    distance: '2.8 km',
    rating: 4.6,
    open: false,
    impact: '↓ 8 kg CO₂ per item repaired',
    lat: 40.6892,
    lng: -73.9944,
  },
  {
    id: '7',
    name: 'Solar Community Garden',
    category: 'Solar',
    categoryIcon: '☀️',
    description:
      'Community solar plot — join the waiting list to offset your home electricity.',
    distance: '3.1 km',
    rating: 4.4,
    open: true,
    impact: '↓ 3 kg CO₂/day when subscribed',
    lat: 40.6928,
    lng: -73.9903,
  },
];

export const ECO_CATEGORIES = [
  'All',
  'Organic Market',
  'Recycling',
  'EV Charging',
  'Thrift Shop',
  'Green Space',
  'Repair',
  'Solar',
] as const;

export type EcoCategory = (typeof ECO_CATEGORIES)[number];
