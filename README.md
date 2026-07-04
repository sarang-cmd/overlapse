# Overlapse

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-V2-green?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Overlapse** is a free, personal-scale, cross-platform timezone-coordination and meeting-scheduling tool for distributed groups. Mission-control HUD aesthetic with a live 3D globe, real-time messaging, Golden Hours overlap engine, live flight tracking, and calendar sync.

## What's shipped (v1)

### Core features
- **3D interactive globe** (globe.gl + Three.js) with free Esri World Imagery tiles — Google-Earth-quality progressive zoom, no Mapbox token needed
- **Real 3D extruded pin markers** colored by live day/night status at each location (NOAA solar position algorithm)
- **Zoom-aware location label** ("Zoomed in on: Tokyo, Japan") via reverse-geocoding against bundled cities dataset (~500 cities)
- **Auto-rotate toggle** on the dashboard
- **7 free map layers**: ⭐ NASA Black Marble, ⭐ Esri Satellite, NASA Blue Marble, OpenStreetMap, OpenTopoMap, Esri Streets, Esri Topographic
- **Live flight tracking** (OpenSky Network) — aircraft rendered as SVG icons or 3D models, colored by altitude, polled every 15s
- **"Search The World" pill** — search any city, fly the globe to it
- **World Clock** — multiple timezones, computed locally via `Intl.DateTimeFormat` + Luxon (zero API calls, DST-safe)
- **Supabase Auth** — email/password + Google OAuth + magic link
- **Profile menu** with sign-in/sign-up/settings/sign-out
- **Real settings page** with 5 tabs (Profile, World Clock, Map & Globe, Notifications, Account)
- **Firebase Cloud Messaging** (FCM) push notifications
- **Cloudflare News Worker** — RSS aggregator fetching from CNBC, NBC, ABC, BBC, NYT, Times of India, Süddeutsche Zeitung, Guardian, Al Jazeera, Reuters, CNN, FT
- **Supabase Edge Function** for iCal export (deployable from web UI, no wrangler)
- **Golden Hours overlap engine** — Luxon-based, DST-safe, computes optimal meeting times across timezones
- **Draggable meeting blocks** (@dnd-kit) with manual input fallback
- **RRULE recurring meeting support**
- **Real-time suggestions** via Supabase Realtime (postgres_changes)
- **Cinematic GSAP landing hero** + **Sonner/Framer Motion toast system**

### Tech stack
| Layer | Service/Library | Free tier |
|---|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn/ui | Open source |
| Globe | globe.gl + Three.js + Esri World Imagery | Free, no API key |
| Database + Auth + Realtime | Supabase | 500 MB DB, 50k MAU |
| Flight data | OpenSky Network | 400 req/day anon, 4k/day registered |
| Push notifications | Firebase Cloud Messaging | Unlimited |
| News | Cloudflare Worker + RSS | 100k req/day |
| Calendar export | Supabase Edge Function | Included |
| Hosting | Firebase Hosting (static export) | Free |

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your real keys (see SETUP.md for the full walkthrough)
```

### 3. Run the database migration
1. Open Supabase → SQL Editor → New Query
2. Paste contents of `supabase/migrations/0001_initial.sql`
3. Run — creates 7 tables + RLS policies + triggers + realtime

### 4. Run the dev server
```bash
npm run dev
```
Open http://localhost:3000

### 5. (Optional) Deploy Cloudflare News Worker
See `news-worker/README.md` — 5 minute deploy.

### 6. (Optional) Deploy iCal Edge Function
See `supabase/functions/README.md` — deploy from Supabase Dashboard web UI.

## Documentation

- [`SETUP.md`](./SETUP.md) — Full setup walkthrough (accounts, keys, deploy)
- [`.env.example`](./.env.example) — Every env var documented
- [`news-worker/README.md`](./news-worker/README.md) — Cloudflare Worker deploy guide
- [`supabase/functions/README.md`](./supabase/functions/README.md) — Supabase Edge Function deploy guide

## Architecture

```
src/
├── app/
│   ├── layout.tsx              # Root layout, wraps app in AuthProvider
│   ├── page.tsx                # Landing (cinematic GSAP hero)
│   ├── dashboard/page.tsx      # Mission control HUD (3-column grid)
│   ├── groups/page.tsx         # Group management + Golden Hours demo
│   ├── meetings/page.tsx       # RRULE demo + iCal preview
│   ├── settings/page.tsx       # Real settings (5 tabs)
│   └── auth/
│       ├── sign-in/page.tsx
│       ├── sign-up/page.tsx
│       └── callback/page.tsx   # OAuth redirect handler
├── components/
│   ├── overlapse/
│   │   ├── WorldGlobe.tsx              # NEW: globe.gl + Esri + 3D pins + layers
│   │   ├── profile-menu.tsx            # NEW: Radix dropdown w/ auth
│   │   ├── world-clock.tsx             # REWRITE: Intl-based, no API
│   │   ├── push-notification-manager.tsx # NEW: FCM permission flow
│   │   ├── latest-news.tsx             # UPDATED: Worker-first, RSS fallback
│   │   ├── messages.tsx                # Realtime suggestion panel
│   │   ├── schedule.tsx                # Golden Hours UI
│   │   ├── calendar-panel.tsx
│   │   ├── upcoming-meetings.tsx
│   │   ├── draggable-meeting.tsx
│   │   ├── globe.tsx                   # Legacy (not used in dashboard)
│   │   └── MapboxGlobe.tsx             # Legacy (deprecated, kept for reference)
│   └── ui/
│       ├── cinematic-hero.tsx          # GSAP scroll hero
│       ├── cinematic-landing-hero.tsx
│       ├── toast.tsx                   # Sonner + Framer Motion
│       └── button.tsx                  # shadcn Button
└── lib/
    ├── supabase/
    │   ├── client.ts                   # Supabase client + Realtime helper
    │   └── auth.tsx                    # AuthProvider + useAuth + useUser
    ├── opensky/
    │   ├── client.ts                   # OAuth2 client (server-side)
    │   └── use-flight-tracking.ts      # Client hook (anon endpoint)
    ├── firebase/
    │   └── messaging.ts                # FCM token + onMessage
    ├── overlapse/
    │   ├── golden-hours.ts             # Luxon overlap engine
    │   ├── sun-position.ts             # NEW: NOAA solar position
    │   └── zoom-label.ts               # NEW: reverse-geocode zoom label
    ├── data/
    │   └── cities.json                 # NEW: ~500 world cities
    └── utils.ts                        # cn() helper

news-worker/                            # NEW: Cloudflare Worker
├── src/index.ts                        # RSS aggregator + KV cache
├── wrangler.toml                       # Deploy config
├── package.json
├── tsconfig.json
└── README.md

supabase/
├── migrations/
│   └── 0001_initial.sql                # NEW: schema + RLS + triggers
└── functions/
    └── ical-export/index.ts            # NEW: iCal Edge Function
```

## Cost

**$0/month** for personal-scale usage. All services are on free tiers:
- Supabase: 500 MB DB, 50k MAU, unlimited API, 2 Edge Functions
- Cloudflare Workers: 100k req/day, KV 100k reads + 1k writes/day
- OpenSky: 4,000 req/day (registered tier)
- Firebase Hosting + FCM: unlimited
- Esri World Imagery: free public tile service

## License

MIT
