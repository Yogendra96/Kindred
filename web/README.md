# Kindred Companion Web Portal (Path B)

A dedicated, high-performance **Next.js 15 App Router** web portal for Kindred. Built to capture
organic search engine traffic, support rich social media sharing cards (OpenGraph), and drive users
into the native mobile application via **Universal Deep Links (`kindred://` &
`https://kindred.earth/*`)**.

---

## 🌟 Key Architecture & Features

1. **Google Jobs Structured Data (`/jobs`):**
   - Automatically generates Schema.org `JobPosting` JSON-LD so cruelty-free careers appear directly
     in Google Jobs search carousels.
2. **Google Shopping Product Data (`/veggregator`):**
   - Emits Schema.org `Product` JSON-LD for plant-based storefront items (vegan Snickers
     alternative, artisanal cashew cheeses, mycelium bags).
3. **OpenStreetMap Stays (`/stays`):**
   - Public directory of 100% plant-based sanctuary cottages, eco-villas, and B&Bs
     (`diet:vegan=only`).
4. **Animal Rescue Sponsorships (`/rescues`):**
   - Transparent sanctuary profile pages with direct meal sponsorship buttons.
5. **Global Travel Guides (`/travel`):**
   - 12 country dining guides, trap ingredient alerts, and local street food vlogs.
6. **Smart App Banners:**
   - Universal links and Apple Smart App Banners directing web visitors to download the native iOS
     and Android apps for background carbon tracking and proximity dating.
7. **Digital Business Cards & Bio Hubs (`/card` & `/u/:username`):**
   - High-fidelity Linktree alternative with Schema.org `Person` JSON-LD.
   - On-screen vector QR code generation (`toqr`).
   - 1-click client-side vCard `.vcf` download for direct addition to Apple Contacts and Google
     Contacts.
   - Live carbon avoidance and animal lives saved counter.
   - Universal link deep-linking to `kindred://card`.
8. **Kindred Beacon & Crossed Paths Radar (`/beacon`):**
   - Public educational landing page on fuzzed proximity algorithms and conscious networking.
   - Anti-stalking privacy transparency: 300m–500m geohashing, Ghost Mode, and zero GPS tracking.
   - Interactive encounter timeline preview and mutual wave protocol explanation.
   - Deep-linking straight into `kindred://crossedpaths`.
9. **Sanctuary Assurance Pool Explorer (`/assurance`):**
   - Public on-chain audit ledger showcasing transparent emergency animal surgery disbursements.
   - Live pool reserves counter ($52.4k USDC reserves, 1,840+ animals protected).
   - Itemized veterinary clinic hospital invoice receipts and cryptographic SHA-256 settlement proof
     hashes.
   - Community underwriting pledge portal with deep-links to `kindred://assurance`.

---

## 🛠️ Development & Deployment

### Local Development

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.

### Production Build

```bash
npm run build
npm run start
```

### Hosting Options

- **Vercel / Cloudflare Pages:** Connect Git repository for instant edge deployment.
- **Firebase App Hosting:** Deploy directly via Firebase CLI:
  ```bash
  firebase apphosting:backends:create --project kindred-app
  ```
