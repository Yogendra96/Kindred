import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Vegan Stays & Sanctuary Homestays — Kindred',
  description:
    'Book 100% plant-based homestays, farm sanctuary cottages, and eco-villas tagged with OpenStreetMap diet:vegan=only. Every night booked directly sponsors rescued animals.',
};

const STAYS = [
  {
    id: 'catskill-cottage',
    name: 'Willow Brook Sanctuary Guest Cabin',
    location: 'Catskill, NY, USA 🇺🇸',
    price: 125,
    emoji: '🏡',
    impact: 'Each night booked feeds 4 rescued cows and 8 sheep for a full week',
    osmTag: 'tourism=chalet;diet:vegan=only',
    tagline: 'Wake up next to rescued sheep and calves in the tranquil Hudson Valley.',
  },
  {
    id: 'kyoto-zen',
    name: 'Arashiyama Bamboo Vegan Machiya',
    location: 'Kyoto, Japan 🇯🇵',
    price: 95,
    emoji: '🎋',
    impact: 'Includes traditional Shojin Ryori organic Buddhist breakfast',
    osmTag: 'tourism=guest_house;diet:vegan=only',
    tagline: 'Traditional 120-year-old wooden Kyoto townhouse with private Zen moss garden.',
  },
  {
    id: 'tuscany-villa',
    name: 'Podere Melograno Olive Grove Retreat',
    location: 'San Gimignano, Italy 🇮🇹',
    price: 110,
    emoji: '🫒',
    impact: 'Sponsors 7 rescued Tuscan draft horses and 12 miniature donkeys',
    osmTag: 'tourism=farm_stay;diet:vegan=only',
    tagline: 'Biodynamic farmstay amid organic olive hills, cypress trees, and wood-fired sourdough.',
  },
  {
    id: 'chiangmai-treehouse',
    name: 'Baan Dok Mai Organic Sanctuary Eco-Lodge',
    location: 'Chiang Mai, Thailand 🇹🇭',
    price: 65,
    emoji: '🌴',
    impact: 'Funds hands-off elephant retirement in the Mae Taeng valley',
    osmTag: 'tourism=camp_site;diet:vegan=only',
    tagline: 'Open-air teakwood treehouse perched above organic fruit orchards.',
  },
];

export default function StaysPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{
          background: 'rgba(56, 239, 125, 0.15)',
          color: '#38EF7D',
          fontSize: '12px',
          fontWeight: '800',
          padding: '4px 12px',
          borderRadius: '12px',
          border: '1px solid #38EF7D',
        }}>
          OPENSTREETMAP DIET:VEGAN=ONLY
        </span>
        <h1 style={{ fontSize: '40px', fontWeight: '900', marginTop: '12px', marginBottom: '8px' }}>
          Vegan Stays & Homestays
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
          100% plant kitchens, down-free bedding, and direct financial sponsorship for farm animal sanctuaries.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {STAYS.map(stay => (
          <div
            key={stay.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{stay.emoji}</div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px' }}>
              📍 {stay.location}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              {stay.name}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: '1.4', marginBottom: '14px', flex: '1' }}>
              {stay.tagline}
            </p>
            <div style={{ background: 'rgba(255,107,107,0.1)', color: '#FF8787', padding: '8px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', marginBottom: '14px' }}>
              🐾 {stay.impact}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>${stay.price}</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}> / night</span>
              </div>
              <a
                href={`kindred://stays`}
                style={{
                  background: '#38EF7D',
                  color: '#0A0F1D',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '12px',
                }}
              >
                Book in App →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
