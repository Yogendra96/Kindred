import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Global Vegan Travel & Dining Flashcards — Kindred',
  description:
    'Travel the world 100% plant-based without language barriers. Native script dining flashcards, hidden trap alerts, and street food vlogs for 12 destinations.',
};

const COUNTRIES = [
  { id: 'japan', name: 'Japan', flag: '🇯🇵', difficulty: 'Challenging', trap: 'Fish broth (Dashi) & Bonito flakes', tip: 'Look for Shojin Ryori temple spots and Shio Onigiri.' },
  { id: 'thailand', name: 'Thailand', flag: '🇹🇭', difficulty: 'Moderate', trap: 'Fish sauce (Nam Pla) & Oyster sauce', tip: 'Spot the red-on-yellow "Jay" (เจ) flag for 100% vegan stalls.' },
  { id: 'italy', name: 'Italy', flag: '🇮🇹', difficulty: 'Easy', trap: 'Fresh egg pasta (uova) & lard (strutto)', tip: 'Pizza Marinara is ancient, authentic, and naturally 100% vegan.' },
  { id: 'mexico', name: 'Mexico', flag: '🇲🇽', difficulty: 'Moderate', trap: 'Pork lard (Manteca) in beans & tamales', tip: 'Grilled nopal cactus and avocado tacos with fresh salsa.' },
  { id: 'india', name: 'India', flag: '🇮🇳', difficulty: 'Easy', trap: 'Clarified butter (Ghee) & cream (Malai)', tip: 'South Indian dosas and idlis are naturally plant fermented.' },
  { id: 'france', name: 'France', flag: '🇫🇷', difficulty: 'Moderate', trap: 'Butter (Beurre) & duck fat in bistro cooking', tip: 'Traditional French baguettes are water, flour, salt & yeast by law.' },
];

export default function TravelPage() {
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
          12 DESTINATIONS WITH NATIVE DINING CARDS
        </span>
        <h1 style={{ fontSize: '40px', fontWeight: '900', marginTop: '12px', marginBottom: '8px' }}>
          Vegan World Travel
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
          Travel confidently without language barriers. High-contrast waiter flashcards and local street food guides.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {COUNTRIES.map(country => (
          <div
            key={country.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '36px' }}>{country.flag}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: country.difficulty === 'Easy' ? '#38EF7D' : country.difficulty === 'Moderate' ? '#F2C94C' : '#FF6B6B',
                color: country.difficulty === 'Easy' ? '#38EF7D' : country.difficulty === 'Moderate' ? '#F2C94C' : '#FF6B6B',
              }}>
                {country.difficulty}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              {country.name}
            </h2>
            <div style={{ background: 'rgba(255,107,107,0.1)', color: '#FF8787', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' }}>
              ⚠️ Trap: {country.trap}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', lineHeight: '1.4', marginBottom: '16px', flex: '1' }}>
              💡 {country.tip}
            </p>
            <a
              href={`kindred://travel`}
              style={{
                background: '#38EF7D',
                color: '#0A0F1D',
                padding: '10px 16px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '12px',
                textAlign: 'center',
              }}
            >
              Show Waiter Flashcard →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
