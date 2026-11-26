import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Kindred — The Ethical, Plant-Based & Planet-Positive Super-App',
  description:
    'Discover cruelty-free jobs, 100% vegan homestays, plant-based marketplace, sanctuary micro-donations, and global travel guides. Sparing animal lives & reducing carbon together.',
  keywords: [
    'vegan jobs',
    'cruelty-free marketplace',
    'vegan airbnb',
    'animal sanctuary donations',
    'how to be vegan in japan',
    'veggregator',
    'ethical shopping',
  ],
  openGraph: {
    title: 'Kindred — The Ethical & Cruelty-Free Super-App',
    description: 'Sparing animal lives, offsetting carbon, and connecting conscious humans worldwide.',
    url: 'https://kindred.earth',
    siteName: 'Kindred',
    images: [
      {
        url: 'https://kindred.earth/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kindred Ethical Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kindred — The Ethical & Cruelty-Free Super-App',
    description: 'Cruelty-Free Careers, Vegan Stays, Sanctuary Rescue Hub, and Veggregator Marketplace.',
    site: '@kindred_earth',
  },
  other: {
    'apple-itunes-app': 'app-id=kindred, app-argument=https://kindred.earth',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        {/* Navigation Bar */}
        <header className="nav-header">
          <div className="nav-container">
            <a href="/" className="nav-logo">
              <span className="logo-icon">🌱</span>
              <span className="logo-text">Kindred</span>
              <span className="logo-badge">PORTAL</span>
            </a>

            <nav className="nav-links">
              <a href="/jobs">💼 Careers</a>
              <a href="/veggregator">🛒 Veggregator</a>
              <a href="/stays">🏡 Vegan Stays</a>
              <a href="/rescues">🐾 Animal Rescues</a>
              <a href="/travel">🌍 Travel Guides</a>
              <a href="/card">📇 Ethical Card</a>
            </nav>

            <a href="kindred://home" className="btn-get-app">
              Open Kindred App
            </a>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-col">
              <div className="footer-logo">
                <span className="logo-icon">🌱</span> Kindred
              </div>
              <p className="footer-desc">
                The world’s first unified cruelty-free & planet-positive ecosystem. Sparing animal lives, empowering independent plant makers, and restoring the Earth.
              </p>
            </div>
            <div className="footer-col">
              <h4>Ecosystem</h4>
              <ul>
                <li><a href="/jobs">Cruelty-Free Job Board</a></li>
                <li><a href="/veggregator">Veggregator Marketplace</a></li>
                <li><a href="/stays">Sanctuary Homestays</a></li>
                <li><a href="/rescues">Sponsor Rescued Animals</a></li>
                <li><a href="/travel">Global Vegan Travel Guides</a></li>
                <li><a href="/card">Tree-Free Ethical Cards</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Mobile Apps</h4>
              <p className="footer-sub">Experience real-time background eco-tracking, AI vision scanner & fuzzed proximity meetups:</p>
              <div className="store-buttons">
                <a href="#" className="store-pill">🍏 iOS App Store</a>
                <a href="#" className="store-pill">🤖 Google Play</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Kindred Earth Inc. All rights reserved. 100% Cruelty-Free & Carbon-Neutral.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

const globalStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0A0F1D;
    color: #F8FAFC;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
  }
  a { color: inherit; text-decoration: none; }
  .nav-header {
    background: rgba(10, 15, 29, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 800;
  }
  .logo-badge {
    background: rgba(56, 239, 125, 0.15);
    color: #38EF7D;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid #38EF7D;
  }
  .nav-links {
    display: flex;
    gap: 24px;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.75);
  }
  .nav-links a:hover { color: #38EF7D; }
  .btn-get-app {
    background: #38EF7D;
    color: #0A0F1D;
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 800;
    transition: transform 0.15s ease;
  }
  .btn-get-app:hover { transform: scale(1.04); }
  .footer {
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: #060913;
    padding: 48px 24px 24px;
    margin-top: 80px;
  }
  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr;
    gap: 40px;
  }
  .footer-logo { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
  .footer-desc { color: rgba(255, 255, 255, 0.6); font-size: 13px; max-width: 320px; }
  .footer-col h4 { font-size: 14px; margin-bottom: 16px; color: #fff; }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: rgba(255, 255, 255, 0.65); }
  .footer-col ul a:hover { color: #38EF7D; }
  .footer-sub { font-size: 13px; color: rgba(255, 255, 255, 0.6); margin-bottom: 14px; }
  .store-buttons { display: flex; gap: 10px; }
  .store-pill { background: rgba(255, 255, 255, 0.08); padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; border: 1px solid rgba(255, 255, 255, 0.12); }
  .footer-bottom { max-width: 1200px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; color: rgba(255, 255, 255, 0.4); font-size: 12px; }
  @media (max-width: 768px) {
    .nav-links { display: none; }
    .footer-container { grid-template-columns: 1fr; }
  }
`;
