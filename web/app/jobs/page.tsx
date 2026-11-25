import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Cruelty-Free Careers & Plant-Based Job Board — Kindred',
  description:
    'Browse verified plant-based jobs in food science, animal sanctuaries, biomaterials, and climate tech. 100% cruelty-free verified employers. Remote, hybrid, and onsite.',
};

const JOBS_DATA = [
  {
    id: 'job-1',
    title: 'Senior Plant Fermentation Scientist',
    company: 'Silk & Oat Labs',
    location: 'Boulder, CO / Remote',
    salary: '$135,000 - $160,000',
    type: 'Full-time · Remote',
    category: 'Food Science & Alt-Protein',
    description: 'Lead novel precision biomass fermentation research to replace commercial whey and casein with clean oat proteins.',
    datePosted: '2026-11-20',
  },
  {
    id: 'job-2',
    title: 'Sanctuary Animal Care Specialist & Herd Lead',
    company: 'Catskill Animal Sanctuary',
    location: 'Saugerties, NY',
    salary: '$58,000 - $68,000',
    type: 'Full-time · On-site',
    category: 'Animal Advocacy & Sanctuaries',
    description: 'Manage daily enrichment, medical protocols, and pasture rotation for over 200 rescued farmed animals.',
    datePosted: '2026-11-22',
  },
  {
    id: 'job-3',
    title: 'Mycelium Biomaterials Process Engineer',
    company: 'BioWeave Materials',
    location: 'London, UK / Hybrid',
    salary: '£65,000 - £80,000',
    type: 'Full-time · Hybrid',
    category: 'Biomaterials & Fashion',
    description: 'Scale vertical indoor cultivation of pure mycelium hides for circular automotive upholstery and luxury leather replacements.',
    datePosted: '2026-11-18',
  },
  {
    id: 'job-4',
    title: 'Lead Plant Campaigner & Policy Strategist',
    company: 'The Humane League',
    location: 'Washington, DC / Remote',
    salary: '$75,000 - $90,000',
    type: 'Full-time · Remote',
    category: 'Animal Advocacy & Sanctuaries',
    description: 'Drive corporate cage-free and plant-rich institutional procurement commitments across multinational hospitality chains.',
    datePosted: '2026-11-24',
  },
];

export default function JobsPage() {
  // Schema.org JobPosting JSON-LD for Google Jobs indexing
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: JOBS_DATA.map((job, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: job.datePosted,
        validThrough: '2027-06-30',
        employmentType: 'FULL_TIME',
        hiringOrganization: {
          '@type': 'Organization',
          name: job.company,
          sameAs: 'https://kindred.earth',
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.location,
          },
        },
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: {
            '@type': 'QuantitativeValue',
            unitText: 'YEAR',
          },
        },
      },
    })),
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          GOOGLE JOBS INDEXED
        </span>
        <h1 style={{ fontSize: '40px', fontWeight: '900', marginTop: '12px', marginBottom: '8px' }}>
          Cruelty-Free Careers
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
          Work with purpose. Verified 100% plant-based and cruelty-free companies where your labor never funds animal exploitation.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {JOBS_DATA.map(job => (
          <div
            key={job.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ flex: '1', minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#38EF7D', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  {job.company}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>•</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{job.location}</span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
                {job.title}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '12px', maxWidth: '640px' }}>
                {job.description}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  💰 {job.salary}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                  📍 {job.type}
                </span>
              </div>
            </div>

            <div>
              <a
                href={`kindred://jobs`}
                style={{
                  background: '#38EF7D',
                  color: '#0A0F1D',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '14px',
                  display: 'inline-block',
                }}
              >
                1-Click Apply →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
