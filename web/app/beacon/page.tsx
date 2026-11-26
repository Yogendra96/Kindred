import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Kindred Beacon — Fuzzed Proximity & Crossed Paths Radar',
  description:
    'An anti-stalking proximity radar for conscious humans. Discover who you crossed paths with near plant-based cafes and eco-hubs using 350m geohash fuzzing and mutual consent waves.',
};

const SAFETY_PILLARS = [
  {
    icon: '🛡️',
    title: '350m Geohash Fuzzing',
    desc: 'Exact coordinates are never collected, broadcast, or stored on servers. Proximity is computed within broad neighborhood cells.',
  },
  {
    icon: '👻',
    title: '1-Tap Ghost Mode',
    desc: 'Activate Ghost Mode anytime to instantly disappear from all nearby radars while keeping your own history private.',
  },
  {
    icon: '🏠',
    title: 'Automatic Safe Zones',
    desc: 'Private residences and safe zones are automatically blacklisted from broadcasting beacon signals.',
  },
  {
    icon: '🤝',
    title: 'Mutual Consent Waves',
    desc: 'You can only message someone if both of you explicitly tap "Wave Back". No unwanted cold DMs or harassment.',
  },
];

export default function BeaconLandingPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <span
          style={{
            background: 'rgba(56, 239, 125, 0.15)',
            color: '#38EF7D',
            fontSize: '12px',
            fontWeight: '800',
            padding: '4px 12px',
            borderRadius: '12px',
            border: '1px solid #38EF7D',
          }}
        >
          ANTI-STALKING PROXIMITY RADAR
        </span>
        <h1
          style={{
            fontSize: '42px',
            fontWeight: '900',
            marginTop: '16px',
            marginBottom: '12px',
            lineHeight: 1.15,
          }}
        >
          Cross Paths with Conscious Souls
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '17px',
            maxWidth: '640px',
            margin: '0 auto 24px',
          }}
        >
          Ever wonder if that person sitting across from you at a plant cafe is also vegan or building a climate startup? Kindred Beacon notifies you when you cross paths nearby—with absolute cryptographic privacy.
        </p>

        <a
          href="kindred://crossedpaths"
          style={{
            display: 'inline-block',
            background: '#38EF7D',
            color: '#0A0F1D',
            padding: '12px 28px',
            borderRadius: '24px',
            fontWeight: '800',
            fontSize: '15px',
            textDecoration: 'none',
          }}
        >
          Launch Beacon in Kindred App 📡
        </a>
      </div>

      {/* Safety Matrix */}
      <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>
        Why Beacon is Anti-Stalking by Design
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '56px',
        }}
      >
        {SAFETY_PILLARS.map((pillar, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{pillar.icon}</div>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
              {pillar.title}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: 1.5 }}>
              {pillar.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
