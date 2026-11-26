import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Kindred Ethical Card — The Tree-Free Digital Business Card & Bio Hub',
  description:
    'A better version of Linktree: 100% zero-waste digital business cards, on-screen QR exchange, live carbon & animal lives saved metrics, and 1-tap vCard phone contacts integration.',
};

const SAMPLE_PROFILES = [
  {
    username: 'alex-rivers',
    name: 'Alex Rivers',
    title: 'Founder & Climate Architect',
    org: 'Kindred Ecosystem Labs',
    emoji: '🌱',
    years: '4.5y',
    co2: '2,480 kg',
    lives: '490',
    sanctuary: 'Catskill Animal Sanctuary 🐮',
  },
  {
    username: 'elena-rostova',
    name: 'Dr. Elena Rostova',
    title: 'Lead Mycologist',
    org: 'MycoStrides Labs',
    emoji: '🍄',
    years: '7.0y',
    co2: '4,200 kg',
    lives: '760',
    sanctuary: 'Dean Farm Trust 🐖',
  },
  {
    username: 'priya-sharma',
    name: 'Priya Sharma',
    title: 'Director of Animal Rescue',
    org: 'Peepal Farm Animals Recovery',
    emoji: '🐕',
    years: '9.5y',
    co2: '5,800 kg',
    lives: '1,400',
    sanctuary: 'Peepal Farm Animal Rescue 🐕',
  },
];

export default function EthicalCardLandingPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Hero */}
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
          TREE-FREE DIGITAL BUSINESS CARD & BIO HUB
        </span>
        <h1
          style={{
            fontSize: '44px',
            fontWeight: '900',
            marginTop: '16px',
            marginBottom: '12px',
            lineHeight: 1.15,
          }}
        >
          The Ethical Linktree Alternative
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '18px',
            maxWidth: '680px',
            margin: '0 auto',
          }}
        >
          Show your on-screen QR code at conferences or coffee shops. Anyone can scan your phone screen to save your contact into Apple & Google Contacts, view your custom bio links, and verify your real climate impact.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '24px' }}>
          <a
            href="kindred://card"
            style={{
              background: '#38EF7D',
              color: '#0A0F1D',
              padding: '12px 28px',
              borderRadius: '24px',
              fontWeight: '800',
              fontSize: '15px',
            }}
          >
            Create My Ethical Card in App 📱
          </a>
          <a
            href="/u/alex-rivers"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '24px',
              fontWeight: '700',
              fontSize: '15px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            View Live Bio Demo →
          </a>
        </div>
      </div>

      {/* Feature Comparison vs Traditional Linktree & Paper */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '56px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌳</div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
            Zero Paper, Zero Waste
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.5 }}>
            Over 90% of traditional business cards are thrown in the trash within one week. Kindred Ethical Cards eliminate dead-tree printing completely.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📇</div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
            1-Tap Phone Contacts (.vcf)
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.5 }}>
            Unlike basic link aggregators, scanning the on-screen QR code allows immediate export of a verified vCard into iOS Contacts or Google Contacts.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🐾</div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
            Verified Impact & Sanctuary Giving
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: 1.5 }}>
            Showcase your verified years plant-based, CO₂ avoided, and animal lives spared. Let connections sponsor a micro-meal for your favorite sanctuary.
          </p>
        </div>
      </div>

      {/* Featured Community Cards Grid */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
          Explore Community Bio Hubs
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {SAMPLE_PROFILES.map(prof => (
            <a
              key={prof.username}
              href={`/u/${prof.username}`}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '24px',
                display: 'block',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '27px',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                  }}
                >
                  {prof.emoji}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                    {prof.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#38EF7D', fontWeight: '600' }}>
                    {prof.title}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    {prof.org}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  marginBottom: '14px',
                }}
              >
                <span>🌱 {prof.years}</span>
                <span>🌍 {prof.co2} avoided</span>
                <span>🐮 {prof.lives} spared</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                <span>Sponsors: {prof.sanctuary}</span>
                <span style={{ color: '#38EF7D', fontWeight: '700' }}>View Bio →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
