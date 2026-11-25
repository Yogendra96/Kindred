import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Veggregator Marketplace — 100% Plant-Based Food, Snacks & Living',
  description:
    'Shop verified artisan vegan products: peanut caramel nougat bars, aged cashew truffle camembert, mycelium leather, and chef-made cloud bowls.',
};

const PRODUCTS = [
  {
    id: 'snickers-bar',
    name: 'Crunchy Peanut Caramel & Nougat Bar',
    brand: 'Naked Cocoa Co.',
    price: 3.5,
    emoji: '🥜',
    rating: 4.9,
    reviews: 382,
    tagline: 'The iconic Snickers candy bar reimagined with roasted peanuts & oat caramel. Zero dairy.',
    impact: 'Saves 1.2 cow-days of milk demand',
  },
  {
    id: 'fig-almond-bar',
    name: 'Wild Fig & Activated Almond Superfood Bar',
    brand: 'Naked Cocoa Co.',
    price: 3.2,
    emoji: '🫐',
    rating: 4.8,
    reviews: 219,
    tagline: 'Cold-pressed raw dry fruits and sprouted nuts with zero refined sugar.',
    impact: '100% plant-sprouted, 0 animal inputs',
  },
  {
    id: 'truffle-camembert',
    name: 'Cave-Aged Black Truffle Cashew Camembert',
    brand: 'Flora Botanical Ferments',
    price: 11.5,
    emoji: '🧀',
    rating: 5.0,
    reviews: 541,
    tagline: 'Artisanal bloom rind plant cheese that melts with deep authentic umami terroir.',
    impact: 'Replaces 4.5L cow milk & calf separation',
  },
  {
    id: 'mushroom-bag',
    name: 'Mycelium Root Leather Everyday Crossbody',
    brand: 'EarthWeave Atelier',
    price: 88.0,
    emoji: '👜',
    rating: 4.9,
    reviews: 164,
    tagline: 'Architectural silhouette bag grown from mushroom roots. Zero bovine hide or plastic PVC.',
    impact: 'Eliminates cattle hide demand and toxic tanneries',
  },
];

export default function VeggregatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: PRODUCTS.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        description: item.tagline,
        brand: {
          '@type': 'Brand',
          name: item.brand,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: item.price,
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: item.rating,
          reviewCount: item.reviews,
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
          100% PLANT-BASED MARKETPLACE
        </span>
        <h1 style={{ fontSize: '40px', fontWeight: '900', marginTop: '12px', marginBottom: '8px' }}>
          Veggregator Storefronts
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
          Verified ethical makers, cruelty-free snack bars, cultured plant cheeses, and circular biomaterials.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        {PRODUCTS.map(p => (
          <div
            key={p.id}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{p.emoji}</div>
            <span style={{ color: '#38EF7D', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
              {p.brand}
            </span>
            <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '4px 0 8px', color: '#fff' }}>
              {p.name}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: '1.4', marginBottom: '12px', flex: '1' }}>
              {p.tagline}
            </p>
            <div style={{ background: 'rgba(255,107,107,0.1)', color: '#FF8787', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', marginBottom: '14px' }}>
              🐾 {p.impact}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>${p.price.toFixed(2)}</span>
              <a
                href={`kindred://veggregator`}
                style={{
                  background: '#38EF7D',
                  color: '#0A0F1D',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '12px',
                }}
              >
                Order in App →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
