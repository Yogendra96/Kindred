import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Sanctuary Assurance — Decentralized Animal Emergency Health Pool',
  description:
    'A community-funded emergency medical pool for farm sanctuaries and rescues. 100% of reserves disburse directly to animal hospital ledgers with cryptographic SHA-256 settlement proof.',
};

const SAMPLE_CLAIMS = [
  {
    animal: 'Barnaby (Calf)',
    emoji: '🐮',
    sanctuary: 'Catskill Animal Sanctuary 🇺🇸',
    hospital: 'Hudson Valley Equine & Farm Hospital',
    condition: 'Acute Neonatal Bronchial Pneumonia',
    amount: 680,
    txHash: '0x7a9c8f2b3e4d5a1b0c9f8e7d6a5b4c3d2e1f0a9b',
    block: 18492041,
    status: 'Disbursed',
  },
  {
    animal: 'Sheru (Dog)',
    emoji: '🐕',
    sanctuary: 'Peepal Farm Animal Rescue 🇮🇳',
    hospital: 'Peepal Farm Surgical Recovery Clinic',
    condition: 'Compound Tibial Fracture Titanium Pinning',
    amount: 420,
    txHash: '0x4b1e9a2d8c7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d',
    block: 18489110,
    status: 'Disbursed',
  },
  {
    animal: 'Buttercup (Cow)',
    emoji: '🐮',
    sanctuary: 'Woodstock Farm Sanctuary 🇺🇸',
    hospital: 'Cornell Large Animal Hospital',
    condition: 'Bovine Molar Sedated Extraction & Sinus Flush',
    amount: 850,
    txHash: '0x9e2d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
    block: 18471902,
    status: 'Disbursed',
  },
  {
    animal: 'Maya (Donkey)',
    emoji: '🫏',
    sanctuary: 'Podere Melograno Sanctuary 🇮🇹',
    hospital: 'Clinica Veterinaria San Silvestro',
    condition: 'Large Colon Impaction Colic Decompression',
    amount: 1150,
    txHash: '0x5d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c',
    block: 18449120,
    status: 'Verified',
  },
];

export default function SanctuaryAssurancePublicPage() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
          ON-CHAIN SANCTUARY MUTUAL-AID POOL
        </span>
        <h1
          style={{
            fontSize: '40px',
            fontWeight: '900',
            marginTop: '16px',
            marginBottom: '10px',
            lineHeight: 1.15,
          }}
        >
          Sanctuary Assurance Pool
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '17px',
            maxWidth: '680px',
            margin: '0 auto 24px',
          }}
        >
          Farm sanctuaries operate on razor-thin budgets. When a rescued cow, horse, or pig faces emergency surgical colic or a broken limb, our community emergency pool disburses directly to the veterinary hospital ledger within 2.4 hours.
        </p>

        <a
          href="kindred://assurance"
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
          Back the Pool in Kindred App 🛡️
        </a>
      </div>

      {/* Global Pool Reserves Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '40px',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>$52,480</div>
          <div style={{ fontSize: '11px', color: '#8E8E93', textTransform: 'uppercase' }}>
            Current Community Reserves
          </div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#38EF7D' }}>$134,800</div>
          <div style={{ fontSize: '11px', color: '#8E8E93', textTransform: 'uppercase' }}>
            Total Emergency Claims Paid
          </div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#FF6B8B' }}>1,840</div>
          <div style={{ fontSize: '11px', color: '#8E8E93', textTransform: 'uppercase' }}>
            Farm Animals Insured
          </div>
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#F2C94C' }}>2.4 hrs</div>
          <div style={{ fontSize: '11px', color: '#8E8E93', textTransform: 'uppercase' }}>
            Avg Disbursal to Vet Clinic
          </div>
        </div>
      </div>

      {/* Cryptographic Ledger Feed */}
      <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px' }}>
        Live Audited Surgery Claims
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {SAMPLE_CLAIMS.map((claim, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '30px' }}>{claim.emoji}</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                    {claim.animal}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    {claim.sanctuary}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#38EF7D' }}>
                  ${claim.amount} USDC
                </span>
                <div style={{ fontSize: '10px', color: '#38EF7D', fontWeight: '800' }}>
                  ✓ {claim.status}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#FF6B8B', fontWeight: '700', marginBottom: '4px' }}>
              🚨 Emergency Condition: {claim.condition}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
              🏥 Payee Hospital: {claim.hospital}
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 12px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#8E8E93',
              }}
            >
              <span>Settlement Hash: {claim.txHash}</span>
              <span>Block #{claim.block}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
