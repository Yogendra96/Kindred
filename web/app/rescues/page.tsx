import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Animal Rescue Sponsorships & Farm Sanctuaries — Kindred',
  description:
    'Direct transparent micro-donations to verified farm animal sanctuaries: Catskill, Woodstock, Peepal Farm, and Dean Farm Trust. Sponsor meals and medicine.',
};

const RESCUES = [
  {
    id: 'shelter-catskill',
    name: 'Catskill Animal Sanctuary',
    location: 'Saugerties, NY, USA 🇺🇸',
    residents: 240,
    emoji: '🐮',
    urgentNeed: 'Emergency winter alfalfa hay and senior cow joint supplements',
    mealCost: 5,
    tagline: 'Rescuing farm animals from cruelty, neglect, and slaughter since 2001.',
  },
  {
    id: 'shelter-peepal',
    name: 'Peepal Farm Animals Recovery',
    location: 'Dharamsala, Himachal Pradesh, India 🇮🇳',
    residents: 180,
    emoji: '🐕',
    urgentNeed: 'Street cow surgical trauma unit & rabies vaccination kits',
    mealCost: 2,
    tagline: 'Treating injured stray animals and advocating for animal-free rural living.',
  },
  {
    id: 'shelter-woodstock',
    name: 'Woodstock Farm Sanctuary',
    location: 'High Falls, NY, USA 🇺🇸',
    residents: 380,
    emoji: '🐑',
    urgentNeed: 'Pasture fencing repairs and avian flu quarantine shelter',
    mealCost: 4,
    tagline: 'Connecting animals with people to advance ethical vegan living.',
  },
  {
    id: 'shelter-dean',
    name: 'Dean Farm Trust Animal Sanctuary',
    location: 'Chepstow, Wales, UK 🇬🇧',
    residents: 190,
    emoji: '🐖',
    urgentNeed: 'Straw bedding bales and rescued ex-commercial pig health checks',
    mealCost: 3,
    tagline: 'Compassionate lifetime sanctuary for rescued ex-farming animals.',
  },
];

export default function RescuesPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{
          background: 'rgba(255, 107, 107, 0.15)',
          color: '#FF6B6B',
          fontSize: '12px',
          fontWeight: '800',
          padding: '4px 12px',
          borderRadius: '12px',
          border: '1px solid #FF6B6B',
        }}>
          100% DIRECT SANCTUARY SPONSORSHIP
        </span>
        <h1 style={{ fontSize: '40px', fontWeight: '900', marginTop: '12px', marginBottom: '8px' }}>
          Animal Rescue Hub
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
          Every dollar directly feeds and provides veterinary care for rescued cows, sheep, pigs, and companions.
        </p>
      </div>

      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255,107,139,0.2) 0%, rgba(56,239,125,0.15) 100%)',
          border: '1px solid rgba(255,107,139,0.35)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '40px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div>
          <span
            style={{
              background: '#FF6B8B',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '8px',
            }}
          >
            NEW FEATURE
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginTop: '8px', marginBottom: '4px' }}>
            🐾 Swipe to Save: Tinder for Rescued Animal Bills
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', maxWidth: '640px', margin: 0 }}>
            Swipe right on your phone to sponsor $3–$15 itemized veterinary and nutrition bills for rescued calves, injured dogs, senior pigs, and donkeys.
          </p>
        </div>
        <a
          href="kindred://rescueswipe"
          style={{
            background: '#FF6B8B',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Open Swipe to Save in App 📱
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {RESCUES.map(rescue => (
          <div
            key={rescue.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{rescue.emoji}</div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '4px' }}>
              📍 {rescue.location}
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', color: '#fff' }}>
              {rescue.name}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: '1.4', marginBottom: '14px', flex: '1' }}>
              {rescue.tagline}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px', borderRadius: '10px', marginBottom: '16px', fontSize: '12px' }}>
              <span style={{ color: '#F2C94C', fontWeight: '700' }}>🚨 Urgent Need: </span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>{rescue.urgentNeed}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Sponsor Meal: </span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#38EF7D' }}>${rescue.mealCost}</span>
              </div>
              <a
                href={`kindred://wallet?shelterId=${rescue.id}`}
                style={{
                  background: '#38EF7D',
                  color: '#0A0F1D',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '12px',
                }}
              >
                Donate Meal →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
