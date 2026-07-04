# Overlapse — Setup Walkthrough

This guide walks you through every account, key, and setup step to run Overlapse locally and deploy it. **Estimated time: 30–45 minutes.**

---

## Phase 0 — Prerequisites

You need:
- Node.js 20+ ([download](https://nodejs.org/))
- A code editor (VS Code recommended)
- A terminal
- A GitHub account (for source control)

---

## Phase 1 — Get API Keys

All services below have free tiers. None require a credit card except where noted (and we avoid those).

### 1.1 Supabase (database + auth + realtime) — ✅ Already done

You already have:
- Project URL: `https://juzyodblzmnsmsqodqzu.supabase.co`
- Anon key: starts with `sb_publishable_...`

**Still TODO:**
1. Go to Supabase → SQL Editor
2. Open `supabase/migrations/0001_initial.sql` (we'll create this in Phase 5)
3. Paste + Run — this creates all 7 tables + RLS policies
4. Go to Supabase → Authentication → Providers
5. Enable **Email** and **Google**
6. For Google: paste your OAuth Client ID + Secret (see 1.3 below)

### 1.2 OpenSky Network (flight tracking) — ✅ Already done

You already have:
- Client ID: `sar.brawlstars@gmail.com-api-client`
- Client Secret: `LkIFdufGmWMlEEjYH27UY0bDqp7lr9Xd`

Free tier: 4,000 requests/day, 30-day rolling auth token.

### 1.3 Google OAuth (for "Sign in with Google") — ✅ Client ID provided

You provided Client ID `879920610131-0hk6jqpvusg15mdmaekfu29018itugsk.apps.googleusercontent.com`.

**You still need to:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Click your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add: `https://juzyodblzmnsmsqodqzu.supabase.co/auth/v1/callback`
4. Copy the **Client Secret** (looks like `GOCSPX-XXXXX...`)
5. Go to Supabase → Authentication → Providers → Google
6. Paste both Client ID and Client Secret there
7. Save

### 1.4 Firebase (push notifications + analytics) — ✅ Already done

You provided config for project `overlapse-functions`.

**Still TODO:**
1. Go to Firebase Console → `overlapse-functions` → Project Settings → Cloud Messaging
2. Under "Web Push certificates", click **Generate key pair** (if not already done)
3. Copy the public key and private key into `.env.local`:
   - `NEXT_PUBLIC_FCM_VAPID_PUBLIC_KEY`
   - `FCM_VAPID_PRIVATE_KEY`

You already provided these — ✅ done.

### 1.5 Cloudflare (News Worker hosting) — ✅ Account exists

Account: `sar.brawlstars@gmail.com`

**Still TODO (before Phase 4):**
1. Install Cloudflare Wrangler CLI: `npm install -g wrangler`
2. Run `wrangler login` — opens browser, sign in with your Cloudflare account
3. Authorize — that's it. The CLI caches your credentials.

You can do this later — only needed before Phase 4 (News Worker deploy).

### 1.6 NewsAPI.org (dev fallback only) — ✅ Already done

Key: `c74a478fd2bf48bb9ee729c525443286`

Used only as a dev fallback when the Cloudflare Worker is not deployed. Production uses the Worker with RSS feeds (no key needed).

### 1.7 Resend (email — DEFERRED TO v2)

You provided key `re_cr2UgRAd_...`. Won't be used in v1.

### 1.8 Esri ArcGIS (map tiles) — ✅ No setup needed

Esri World Imagery is a free public tile service. No key, no account, no credit card. We use it as the primary satellite layer (replacing Mapbox).

---

## Phase 2 — Local Development Setup

### 2.1 Install dependencies

```bash
cd /path/to/overlapse
npm install
```

This installs ~500 MB of node_modules. Should take 1–2 minutes.

### 2.2 Verify env vars

```bash
# .env.local should exist with real values (not placeholders)
cat .env.local | grep -v "^#"
```

You should see real Supabase URL, anon key, OpenSky secrets, Firebase config, FCM VAPID keys — no `YOUR-...` placeholders.

### 2.3 Run dev server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see:
- Landing page (`/`) with the CinematicHero scroll animation
- Dashboard (`/dashboard`) with the 3-column HUD
- Globe (globe.gl + NASA Black Marble texture) rendering in the center column

If anything fails, check the terminal output — most errors are missing env vars or failed `npm install`.

### 2.4 Run production build (optional — verifies static export works)

```bash
npm run build
```

This produces `out/` directory with static HTML/CSS/JS — that's what gets deployed to Firebase Hosting.

---

## Phase 3 — Database Setup

### 3.1 Run the schema migration

1. Open `supabase/migrations/0001_initial.sql` (we'll create this in Phase 5)
2. Copy the entire contents
3. Go to Supabase → SQL Editor → New Query
4. Paste → Run
5. You should see "Success. No rows returned."

### 3.2 Verify tables exist

Go to Supabase → Table Editor. You should see 7 tables:
- `profiles`
- `groups`
- `group_members`
- `meeting_blocks`
- `suggestions`
- `notifications`
- `saved_locations`

### 3.3 Test RLS

1. Go to Supabase → Authentication → Users → Add user (create a test user)
2. Go to Table Editor → `profiles` → try to insert a row with that user's ID
3. Should work — you're authenticated
4. Try inserting a row with a different user's ID — should be blocked by RLS

---

## Phase 4 — Cloudflare Worker Deploy (do this when we reach Phase 4)

### 4.1 Login to Cloudflare (one-time)

```bash
npm install -g wrangler
wrangler login
```

Browser opens → sign in with `sar.brawlstars@gmail.com` → click Allow.

### 4.2 Deploy the Worker

```bash
cd news-worker
npm install
wrangler deploy
```

The Worker URL looks like: `https://overlapse-news.<your-subdomain>.workers.dev`

### 4.3 Update .env.local

Add the Worker URL:
```bash
NEXT_PUBLIC_NEWS_WORKER_URL=https://overlapse-news.YOUR-SUBDOMAIN.workers.dev
```

### 4.4 Verify

Visit the Worker URL in your browser:
```
https://overlapse-news.YOUR-SUBDOMAIN.workers.dev/api/news?source=bbc&limit=5
```

You should see JSON with 5 BBC articles.

---

## Phase 5 — Firebase Hosting Deploy (final step)

### 5.1 Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

Sign in with the Google account that owns `overlapse-dev` Firebase project.

### 5.2 Build

```bash
npm run build
```

Produces `out/` directory.

### 5.3 Deploy

```bash
firebase deploy --only hosting
```

Your app is now live at `https://overlapse-dev.web.app`.

### 5.4 Update OAuth redirect URIs

After deploy, add your production URL to:
1. Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs:
   `https://overlapse-dev.web.app/auth/callback`
2. Supabase → Authentication → URL Configuration → Site URL:
   `https://overlapse-dev.web.app`
3. Supabase → Authentication → URL Configuration → Redirect URLs:
   `https://overlapse-dev.web.app/auth/callback`

---

## Troubleshooting

### "Mapbox token not configured"
You're seeing this because `MapboxGlobe.tsx` still expects a Mapbox token. We fix this in Phase 2 by replacing it with `WorldGlobe.tsx` (uses Esri, no token).

### "Supabase connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the **anon** key (not the service_role key — never expose that)
- Check your project isn't paused (Supabase free tier auto-pauses after 7 days inactivity — click Restore)

### "OpenSky 401 Unauthorized"
- OpenSky's OAuth2 token expires after ~30 days
- The token refresh logic should handle this automatically (we'll build in Phase 5)
- If it persists, log into OpenSky and verify your client credentials

### "Cloudflare Worker deploy failed"
- Make sure you ran `wrangler login` and authorized
- Check your Cloudflare account doesn't have any unpaid invoices
- Try `wrangler whoami` to confirm you're logged in

### "Build fails with type errors"
- Run `npm install` again (deps may have changed)
- Check the terminal output for the specific file + line
- Most type errors are missing imports or wrong prop types — easy fixes

---

## Quick Reference — All Env Vars

| Variable | Where it goes | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | ✅ |
| `NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID` | Browser | ✅ |
| `OPENSKY_CLIENT_ID` | Server only | ❌ |
| `OPENSKY_CLIENT_SECRET` | Server only | ❌ |
| `OPENSKY_TOKEN_URL` | Server only | ❌ |
| `OPENSKY_API_URL` | Server only | ❌ |
| `NEWS_API_KEY` | Worker only | ❌ |
| `NEXT_PUBLIC_NEWS_WORKER_URL` | Browser | ✅ |
| `NEXT_PUBLIC_FIREBASE_*` (7 vars) | Browser | ✅ |
| `NEXT_PUBLIC_FCM_VAPID_PUBLIC_KEY` | Browser | ✅ |
| `FCM_VAPID_PRIVATE_KEY` | Server only | ❌ |
| `RESEND_API_KEY` | Server only | ❌ (v2) |
| `NEXT_PUBLIC_ESRI_*` (3 vars) | Browser | ✅ |
| `NEXT_PUBLIC_APP_URL` | Browser | ✅ |

---

*This document is a living guide. Update it as the project evolves.*
