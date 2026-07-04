# Overlapse News Worker

Free Cloudflare Worker that fetches RSS feeds from major world news outlets, caches them in Cloudflare KV, and serves them as JSON.

## Sources

- CNBC, NBC, ABC, BBC, New York Times, Times of India, Süddeutsche Zeitung
- Plus: The Guardian, Al Jazeera, Reuters, CNN, Financial Times

All RSS feeds are free, public, no API key, no rate limit.

## Deploy (5 minutes)

### 1. Install dependencies

```bash
cd news-worker
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

Browser opens → sign in with sar.brawlstars@gmail.com → click Allow.

### 3. Create KV namespace

```bash
npx wrangler kv:namespace create NEWS_CACHE
```

This outputs something like:
```
[[kv_namespaces]]
binding = "NEWS_CACHE"
id = "abc123def456..."
```

### 4. Update wrangler.toml

Open `wrangler.toml` and replace `REPLACE_WITH_YOUR_KV_ID` with the `id` from step 3.

### 5. Deploy

```bash
npm run deploy
```

You'll see output like:
```
Published overlapse-news (1.23 sec)
  https://overlapse-news.<your-subdomain>.workers.dev
```

### 6. Test it

Visit in your browser:
```
https://overlapse-news.<your-subdomain>.workers.dev/api/news?limit=5
https://overlapse-news.<your-subdomain>.workers.dev/api/health
https://overlapse-news.<your-subdomain>.workers.dev/api/sources
```

### 7. Wire to Overlapse

Add to your Overlapse `.env.local`:
```
NEXT_PUBLIC_NEWS_WORKER_URL=https://overlapse-news.<your-subdomain>.workers.dev
```

Restart `npm run dev` and the Latest News panel will use the Worker instead of the allorigins proxy.

## API

### `GET /api/news`

Query params:
- `source` — filter by source ID (e.g. `bbc`, `nyt`, `toi`). Default: all.
- `category` — filter by category (`World`, `Business`, etc.). Default: all.
- `limit` — max articles (default 20).

Response:
```json
{
  "articles": [
    {
      "id": "sha1-hash",
      "title": "...",
      "description": "...",
      "url": "https://...",
      "source": "BBC News",
      "sourceId": "bbc",
      "sourceUrl": "https://www.bbc.com/news",
      "publishedAt": "2024-01-01T12:00:00Z",
      "category": "World"
    }
  ],
  "total": 50,
  "cached": true,
  "fetchedAt": "2024-01-01T12:00:00Z",
  "sources": 12
}
```

### `GET /api/sources`

Returns the list of configured sources.

### `GET /api/health`

Returns worker status and timestamp.

## Cost

- **Cloudflare Workers**: 100,000 requests/day free
- **KV**: 100,000 reads/day + 1,000 writes/day free
- **RSS feeds**: free, no rate limits

For a personal-scale app: $0/month, comfortably under all free tier limits.

## Troubleshooting

- **404 on /api/news**: worker URL wrong. Check `wrangler.toml` matches your account.
- **Empty articles**: RSS feed may have changed. Check `/api/sources` then visit the source URL in a browser to verify.
- **KV write errors**: ensure you ran `wrangler kv:namespace create NEWS_CACHE` and pasted the ID into `wrangler.toml`.
- **CORS errors in browser**: worker adds `Access-Control-Allow-Origin: *` — should work from any origin.
