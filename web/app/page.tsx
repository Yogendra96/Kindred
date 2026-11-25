import React from 'react';

export default function HomePage() {
  return (
    <div className="home-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span>✨ 100% Plant-Based & Verified Cruelty-Free</span>
        </div>
        <h1 className="hero-title">
          Live Cruelty-Free.<br />
          <span className="hero-gradient">Restore the Earth.</span>
        </h1>
        <p className="hero-subtitle">
          The unified super-app and public discovery portal for conscious living. Find plant-based careers, book sanctuary cottages, taste artisan vegan snacks, sponsor rescued farm animals, and travel without barriers.
        </p>

        <div className="hero-actions">
          <a href="/jobs" className="btn-primary">
            Explore Vegan Jobs →
          </a>
          <a href="/veggregator" className="btn-secondary">
            Visit Veggregator Shop 🛒
          </a>
          <a href="kindred://home" className="btn-app-link">
            Launch Kindred App 📱
          </a>
        </div>

        {/* Live Impact Counters */}
        <div className="impact-counter-strip">
          <div className="counter-card">
            <span className="counter-val">48,250+</span>
            <span className="counter-label">🐮 Animal Lives Spared</span>
          </div>
          <div className="counter-divider" />
          <div className="counter-card">
            <span className="counter-val">215,000 kg</span>
            <span className="counter-label">🌱 CO₂ Emissions Avoided</span>
          </div>
          <div className="counter-divider" />
          <div className="counter-card">
            <span className="counter-val">5 Global</span>
            <span className="counter-label">🐾 Sanctuaries Direct-Funded</span>
          </div>
          <div className="counter-divider" />
          <div className="counter-card">
            <span className="counter-val">12 Countries</span>
            <span className="counter-label">🌍 Vegan Travel Guides</span>
          </div>
        </div>
      </section>

      {/* 5 Core Pillars Grid */}
      <section className="pillars-section">
        <h2 className="section-title">The Kindred Ethical Ecosystem</h2>
        <p className="section-subtitle">
          Everything you need to thrive as an ethical human, accessible via web and our native mobile app.
        </p>

        <div className="pillars-grid">
          {/* Card 1: Careers */}
          <div className="pillar-card">
            <div className="pillar-icon">💼</div>
            <h3>Cruelty-Free Careers</h3>
            <p>
              Verified 100% plant-based employers. Work in food science, sanctuary care, biomaterials, and climate tech without funding animal agriculture.
            </p>
            <div className="pillar-tags">
              <span>Google Jobs Indexed</span>
              <span>Remote / Hybrid</span>
            </div>
            <a href="/jobs" className="pillar-link">Browse Job Board →</a>
          </div>

          {/* Card 2: Veggregator */}
          <div className="pillar-card">
            <div className="pillar-icon">🛒</div>
            <h3>Veggregator Marketplace</h3>
            <p>
              Artisan plant cheeses, ethical peanut candy bars, mycelium mushroom leather, and chef-prepared cloud kitchen bowls delivered zero-emissions.
            </p>
            <div className="pillar-tags">
              <span>Zero Palm Oil</span>
              <span>Independent Makers</span>
            </div>
            <a href="/veggregator" className="pillar-link">Shop Storefronts →</a>
          </div>

          {/* Card 3: Vegan Stays */}
          <div className="pillar-card">
            <div className="pillar-icon">🏡</div>
            <h3>Vegan Stays & Homestays</h3>
            <p>
              Book 100% plant-based sanctuary cottages, eco-villas, and B&Bs tagged with OpenStreetMap <code>diet:vegan=only</code>. 100% of night fees fund rescued animals.
            </p>
            <div className="pillar-tags">
              <span>Sanctuary Cottages</span>
              <span>Down-Free Bedding</span>
            </div>
            <a href="/stays" className="pillar-link">Find Stays →</a>
          </div>

          {/* Card 4: Rescues */}
          <div className="pillar-card">
            <div className="pillar-icon">🐾</div>
            <h3>Animal Rescue Hub</h3>
            <p>
              Sponsor rescued cows, calves, sheep, and dogs at Catskill, Woodstock, Peepal Farm, and Dean Farm Trust. Micro-donate fresh hay and emergency medicine.
            </p>
            <div className="pillar-tags">
              <span>100% Transparency</span>
              <span>Meal Sponsorships</span>
            </div>
            <a href="/rescues" className="pillar-link">Sponsor Animals →</a>
          </div>

          {/* Card 5: Travel */}
          <div className="pillar-card">
            <div className="pillar-icon">🌍</div>
            <h3>Global Travel Guides</h3>
            <p>
              How to be vegan in Japan, Thailand, Italy, Mexico, India, France and more. Unambiguous native dining flashcards to show waiters plus street food vlogs.
            </p>
            <div className="pillar-tags">
              <span>12 Countries</span>
              <span>Hidden Trap Alerts</span>
            </div>
            <a href="/travel" className="pillar-link">Explore Guides →</a>
          </div>
        </div>
      </section>

      {/* App Install CTA */}
      <section className="app-cta-banner">
        <div className="app-cta-content">
          <span className="app-cta-badge">MOBILE SUPER-APP</span>
          <h2>Unlock Background Eco-Tracking & Proximity Dating</h2>
          <p>
            Download the native Kindred mobile app to track your daily walking/cycling carbon offsets, scan groceries with our AI Vision camera, and meet local vegans with safe fuzzed radar.
          </p>
          <div className="app-cta-buttons">
            <a href="kindred://home" className="btn-primary">Open in Mobile App</a>
            <a href="#" className="btn-secondary">Download for iOS</a>
            <a href="#" className="btn-secondary">Download for Android</a>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: homeStyles }} />
    </div>
  );
}

const homeStyles = `
  .home-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;
  }
  .hero-section {
    text-align: center;
    padding: 60px 0 50px;
  }
  .hero-badge {
    display: inline-block;
    background: rgba(56, 239, 125, 0.12);
    border: 1px solid rgba(56, 239, 125, 0.3);
    color: #38EF7D;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 24px;
  }
  .hero-title {
    font-size: 56px;
    font-weight: 900;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 20px;
  }
  .hero-gradient {
    background: linear-gradient(135deg, #38EF7D 0%, #11998E 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    max-width: 720px;
    margin: 0 auto 36px;
    line-height: 1.6;
  }
  .hero-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 50px;
  }
  .btn-primary {
    background: #38EF7D;
    color: #0A0F1D;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 800;
  }
  .btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
  }
  .btn-app-link {
    background: rgba(56, 239, 125, 0.15);
    border: 1px solid #38EF7D;
    color: #38EF7D;
    padding: 14px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 800;
  }
  .impact-counter-strip {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 24px;
    max-width: 980px;
    margin: 0 auto;
    flex-wrap: wrap;
    gap: 16px;
  }
  .counter-card {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .counter-val {
    font-size: 26px;
    font-weight: 900;
    color: #38EF7D;
  }
  .counter-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 4px;
  }
  .counter-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
  }
  .pillars-section {
    padding: 60px 0;
  }
  .section-title {
    font-size: 32px;
    font-weight: 800;
    text-align: center;
    margin-bottom: 8px;
  }
  .section-subtitle {
    text-align: center;
    color: rgba(255, 255, 255, 0.65);
    margin-bottom: 40px;
    font-size: 16px;
  }
  .pillars-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
  }
  .pillar-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 28px;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s, border-color 0.2s;
  }
  .pillar-card:hover {
    transform: translateY(-4px);
    border-color: rgba(56, 239, 125, 0.3);
  }
  .pillar-icon { font-size: 36px; margin-bottom: 14px; }
  .pillar-card h3 { font-size: 19px; font-weight: 700; margin-bottom: 10px; color: #fff; }
  .pillar-card p { font-size: 14px; color: rgba(255, 255, 255, 0.65); line-height: 1.5; margin-bottom: 16px; flex: 1; }
  .pillar-tags { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .pillar-tags span { background: rgba(255, 255, 255, 0.06); font-size: 11px; padding: 4px 8px; border-radius: 6px; color: rgba(255, 255, 255, 0.8); }
  .pillar-link { color: #38EF7D; font-size: 13px; font-weight: 800; }
  .app-cta-banner {
    background: linear-gradient(135deg, rgba(56, 239, 125, 0.15) 0%, rgba(17, 153, 142, 0.1) 100%);
    border: 1px solid rgba(56, 239, 125, 0.3);
    border-radius: 24px;
    padding: 48px;
    text-align: center;
    margin-top: 40px;
  }
  .app-cta-badge {
    background: #38EF7D;
    color: #0A0F1D;
    font-size: 11px;
    font-weight: 900;
    padding: 4px 10px;
    border-radius: 6px;
    display: inline-block;
    margin-bottom: 16px;
  }
  .app-cta-banner h2 { font-size: 32px; font-weight: 800; margin-bottom: 12px; }
  .app-cta-banner p { font-size: 16px; color: rgba(255, 255, 255, 0.7); max-width: 640px; margin: 0 auto 28px; line-height: 1.5; }
  .app-cta-buttons { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }
  @media (max-width: 768px) {
    .hero-title { font-size: 38px; }
    .impact-counter-strip { flex-direction: column; }
    .counter-divider { display: none; }
  }
`;
