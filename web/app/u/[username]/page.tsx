import type { Metadata } from 'next';
import React from 'react';
import { toQR } from 'toqr';

interface PageProps {
  params: Promise<{ username: string }>;
}

interface BioProfile {
  username: string;
  name: string;
  pronouns: string;
  title: string;
  organization: string;
  bio: string;
  avatarEmoji: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  impact: {
    yearsPlantBased: number;
    co2AvoidedKg: number;
    animalLivesProtected: number;
  };
  sanctuary: {
    name: string;
    emoji: string;
    location: string;
    tagline: string;
  };
  links: Array<{
    title: string;
    url: string;
    category: string;
  }>;
}

const PROFILES: Record<string, BioProfile> = {
  'alex-rivers': {
    username: 'alex-rivers',
    name: 'Alex Rivers',
    pronouns: 'they/them',
    title: 'Founder & Climate Architect',
    organization: 'Kindred Ecosystem Labs',
    bio: 'Building circular biomaterials and ethical decentralized consumer tech. Advocate for zero-slaughter economies.',
    avatarEmoji: '🌱',
    location: 'San Francisco, CA & Remote',
    email: 'alex@kindred.earth',
    phone: '+1 (415) 890-3421',
    website: 'https://kindred.earth/u/alex-rivers',
    impact: {
      yearsPlantBased: 4.5,
      co2AvoidedKg: 2480,
      animalLivesProtected: 490,
    },
    sanctuary: {
      name: 'Catskill Animal Sanctuary',
      emoji: '🐮',
      location: 'Saugerties, NY, USA',
      tagline: 'Pediatric calf milk replacer & pasture shelter recovery.',
    },
    links: [
      {
        title: '🌱 Precision Fermented Mozzarella (Ethical Launchpad)',
        url: 'https://kindred.earth/launchpad',
        category: 'Project',
      },
      {
        title: '💼 Connect on LinkedIn',
        url: 'https://linkedin.com/in/alex-rivers-kindred',
        category: 'Professional',
      },
      {
        title: '💻 Open Source Climate Models (GitHub)',
        url: 'https://github.com/kindred-earth',
        category: 'Portfolio',
      },
      {
        title: '✍️ Post-Slaughter Economy (Substack)',
        url: 'https://alexrivers.substack.com',
        category: 'Writing',
      },
    ],
  },
  'elena-rostova': {
    username: 'elena-rostova',
    name: 'Dr. Elena Rostova',
    pronouns: 'she/her',
    title: 'Lead Mycologist & Biomaterial Scientist',
    organization: 'MycoStrides Labs',
    bio: 'Pioneering pure mycelium leather alternatives to replace animal hides in luxury fashion.',
    avatarEmoji: '🍄',
    location: 'Berlin, Germany',
    email: 'elena@mycostrides.de',
    phone: '+49 30 901820',
    website: 'https://mycostrides.de',
    impact: {
      yearsPlantBased: 7.0,
      co2AvoidedKg: 4200,
      animalLivesProtected: 760,
    },
    sanctuary: {
      name: 'Dean Farm Trust Animal Sanctuary',
      emoji: '🐖',
      location: 'Chepstow, Wales, UK',
      tagline: 'Lifetime sanctuary for rescued pigs, sheep, and equines.',
    },
    links: [
      {
        title: '🍄 Mycelium Tensile Strengths (Research Paper)',
        url: 'https://nature.com/articles/mycelium-bio-textiles',
        category: 'Research',
      },
      {
        title: '💼 LinkedIn Profile',
        url: 'https://linkedin.com/in/elena-rostova',
        category: 'Professional',
      },
    ],
  },
  'priya-sharma': {
    username: 'priya-sharma',
    name: 'Priya Sharma',
    pronouns: 'she/her',
    title: 'Director of Animal Rescue & Rural Health',
    organization: 'Peepal Farm Animals Recovery',
    bio: 'Rescuing injured stray cows, street dogs, and mules in the Indian Himalayas. Practicing ahimsa organic farming.',
    avatarEmoji: '🐕',
    location: 'Dharamsala, Himachal Pradesh, India',
    email: 'priya@peepalfarm.org',
    phone: '+91 98160 12345',
    website: 'https://peepalfarm.org',
    impact: {
      yearsPlantBased: 9.5,
      co2AvoidedKg: 5800,
      animalLivesProtected: 1400,
    },
    sanctuary: {
      name: 'Peepal Farm Animal Rescue',
      emoji: '🐕',
      location: 'Dharamsala, India',
      tagline: 'Emergency trauma surgery and street cow recovery.',
    },
    links: [
      {
        title: '📺 Watch Rescue & Clinic Vlogs (YouTube)',
        url: 'https://youtube.com/@peepalfarm',
        category: 'Video',
      },
      {
        title: '🤝 Volunteer in the Himalayas',
        url: 'https://peepalfarm.org/volunteer',
        category: 'Volunteer',
      },
    ],
  },
};

function getProfile(username: string): BioProfile {
  const normalized = username.toLowerCase();
  if (PROFILES[normalized]) {
    return PROFILES[normalized];
  }

  // Graceful fallback for any username
  const cleanName = username
    .split(/[-_]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');

  return {
    username: normalized,
    name: cleanName || 'Kindred Member',
    pronouns: 'they/them',
    title: 'Ethical Community Member',
    organization: 'Kindred Ecosystem',
    bio: 'Conscious living, plant-forward advocate, and planet protector.',
    avatarEmoji: '🌱',
    location: 'Global',
    email: `${normalized}@kindred.earth`,
    phone: '+1 (555) 019-2831',
    website: `https://kindred.earth/u/${normalized}`,
    impact: {
      yearsPlantBased: 2.0,
      co2AvoidedKg: 1200,
      animalLivesProtected: 210,
    },
    sanctuary: {
      name: 'Catskill Animal Sanctuary',
      emoji: '🐮',
      location: 'Saugerties, NY, USA',
      tagline: 'Rescuing farm animals from slaughter since 2001.',
    },
    links: [
      {
        title: '🌍 Join Kindred Earth',
        url: 'https://kindred.earth',
        category: 'Platform',
      },
    ],
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = getProfile(username);

  return {
    title: `${profile.name} (@${profile.username}) — Kindred Ethical Card`,
    description: `${profile.title} at ${profile.organization}. ${profile.bio} · ${profile.impact.yearsPlantBased} yrs plant-based · ${profile.impact.co2AvoidedKg} kg CO₂ saved.`,
    openGraph: {
      title: `${profile.name} — Kindred Digital Business Card`,
      description: `${profile.title} at ${profile.organization} · Tree-free bio hub`,
      url: `https://kindred.earth/u/${profile.username}`,
      siteName: 'Kindred',
    },
  };
}

function generateSvgQrPath(text: string): { size: number; path: string } {
  try {
    const raw = toQR(text);
    const size = Math.round(Math.sqrt(raw.length));
    let path = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (raw[y * size + x]) {
          path += `M${x},${y}h1v1h-1z `;
        }
      }
    }
    return { size, path };
  } catch {
    return { size: 21, path: '' };
  }
}

export default async function UserBioPage({ params }: PageProps) {
  const { username } = await params;
  const profile = getProfile(username);
  const profileUrl = `https://kindred.earth/u/${profile.username}`;
  const { size: qrSize, path: qrPath } = generateSvgQrPath(profileUrl);

  // vCard text
  const vcardText = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name}`,
    `TITLE:${profile.title}`,
    `ORG:${profile.organization}`,
    `EMAIL;TYPE=INTERNET,WORK:${profile.email}`,
    `TEL;TYPE=CELL:${profile.phone}`,
    `URL:${profile.website}`,
    `NOTE:Kindred Ethical Card · ${profile.bio} · ${profileUrl}`,
    'END:VCARD',
  ].join('\r\n');

  const vcardDataUri = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcardText)}`;

  // Schema.org Person JSON-LD
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    worksFor: {
      '@type': 'Organization',
      name: profile.organization,
    },
    email: profile.email,
    telephone: profile.phone,
    url: profileUrl,
    description: profile.bio,
    sameAs: profile.links.map(l => l.url),
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* App Banner Header */}
      <div
        style={{
          background: 'rgba(56, 239, 125, 0.12)',
          border: '1px solid rgba(56, 239, 125, 0.3)',
          borderRadius: '16px',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>
          📱 Viewing Kindred Ethical Card
        </span>
        <a
          href={`kindred://card?username=${profile.username}`}
          style={{
            background: '#38EF7D',
            color: '#0A0F1D',
            fontSize: '12px',
            fontWeight: '800',
            padding: '6px 14px',
            borderRadius: '10px',
          }}
        >
          Open in App
        </a>
      </div>

      {/* Profile Card Hero */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '28px',
          padding: '32px 24px',
          textAlign: 'center',
          marginBottom: '24px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '42px',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            margin: '0 auto 16px',
          }}
        >
          {profile.avatarEmoji}
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
          {profile.name} <span style={{ color: '#38EF7D', fontSize: '20px' }}>✓</span>
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginBottom: '6px' }}>
          ({profile.pronouns}) · 📍 {profile.location}
        </p>
        <p style={{ color: '#38EF7D', fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>
          {profile.title}
        </p>
        <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px', marginBottom: '16px' }}>
          {profile.organization}
        </p>

        <p
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '14px',
            lineHeight: 1.5,
            maxWidth: '480px',
            margin: '0 auto 24px',
          }}
        >
          {profile.bio}
        </p>

        {/* Verified Impact Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff' }}>
              {profile.impact.yearsPlantBased} yrs
            </div>
            <div style={{ fontSize: '10px', color: '#8E8E93', textTransform: 'uppercase' }}>
              🌱 Plant-Based
            </div>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#38EF7D' }}>
              {profile.impact.co2AvoidedKg.toLocaleString()} kg
            </div>
            <div style={{ fontSize: '10px', color: '#8E8E93', textTransform: 'uppercase' }}>
              🌍 CO₂ Avoided
            </div>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#FF6B8B' }}>
              {profile.impact.animalLivesProtected}
            </div>
            <div style={{ fontSize: '10px', color: '#8E8E93', textTransform: 'uppercase' }}>
              🐮 Lives Spared
            </div>
          </div>
        </div>

        {/* Save to Phone Contacts Button */}
        <a
          href={vcardDataUri}
          download={`${profile.username}.vcf`}
          style={{
            display: 'block',
            background: '#38EF7D',
            color: '#0A0F1D',
            padding: '14px 20px',
            borderRadius: '16px',
            fontWeight: '800',
            fontSize: '15px',
            textDecoration: 'none',
            marginBottom: '14px',
          }}
        >
          📇 Save to Phone Contacts (.vcf)
        </a>

        {/* On-Screen QR Code for Desktop Visitors */}
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            display: 'inline-block',
            margin: '12px auto 8px',
          }}
        >
          <svg
            width="160"
            height="160"
            viewBox={`-2 -2 ${qrSize + 4} ${qrSize + 4}`}
            style={{ display: 'block' }}
          >
            <rect x="-2" y="-2" width={qrSize + 4} height={qrSize + 4} fill="#fff" />
            <path d={qrPath} fill="#0A0F1D" fillRule="evenodd" />
          </svg>
        </div>
        <div style={{ fontSize: '11px', color: '#8E8E93' }}>
          Scan to open on your phone & exchange contact
        </div>
      </div>

      {/* Endorsed Sanctuary Banner */}
      <div
        style={{
          background: 'rgba(255, 107, 139, 0.1)',
          border: '1px solid rgba(255, 107, 139, 0.25)',
          borderRadius: '20px',
          padding: '18px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>{profile.sanctuary.emoji}</span>
          <div>
            <div style={{ fontSize: '10px', color: '#FF6B8B', fontWeight: '800' }}>
              ENDORSED SANCTUARY
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>
              {profile.sanctuary.name}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              {profile.sanctuary.tagline}
            </div>
          </div>
        </div>
        <a
          href="kindred://wallet?tab=donate"
          style={{
            background: '#FF6B8B',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          Sponsor $3 →
        </a>
      </div>

      {/* Featured Bio Links (Linktree Style) */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#8E8E93', marginBottom: '12px', textTransform: 'uppercase' }}>
          Featured Links
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {profile.links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '700',
                transition: 'background 0.15s ease',
              }}
            >
              <span>{link.title}</span>
              <span style={{ color: '#38EF7D', fontSize: '12px' }}>↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* Tree-Free Footer Note */}
      <div
        style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '12px',
        }}
      >
        🌳 Kindred Ethical Card · Zero Paper, Zero Waste ·{' '}
        <a href="/card" style={{ color: '#38EF7D' }}>
          Create yours free
        </a>
      </div>
    </div>
  );
}
