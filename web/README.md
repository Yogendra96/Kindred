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
