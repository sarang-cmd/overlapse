/**
 * Overlapse News Worker — Cloudflare Worker
 *
 * Fetches RSS feeds from major world news outlets, parses them, dedupes by
 * title+link SHA-1, caches in Cloudflare KV for 10 minutes, serves as JSON.
 *
 * Free tier: 100,000 requests/day, KV 100k reads/day + 1k writes/day.
 * No external API keys required (RSS is free, public, no rate limits).
 *
 * Endpoints:
 *   GET /api/news?source=bbc&limit=20&category=World
 *   GET /api/sources                    — list all configured sources
 *   GET /api/health                     — worker health check
 *
 * Deploy:
 *   1. npm install
 *   2. wrangler login
 *   3. wrangler kv:namespace create NEWS_CACHE   — paste the id into wrangler.toml
 *   4. wrangler deploy
 *   5. Update Overlapse .env.local: NEXT_PUBLIC_NEWS_WORKER_URL=https://overlapse-news.<sub>.workers.dev
 */

import RSSParser from 'rss-parser';

// ============================================================
// News sources — all free RSS feeds, no API key, no auth
// ============================================================

interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: 'World' | 'Business' | 'Tech' | 'Sports' | 'General';
  homepage: string;
}

const SOURCES: NewsSource[] = [
  // World news outlets (your spec list)
  { id: 'cnbc', name: 'CNBC', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', category: 'Business', homepage: 'https://www.cnbc.com' },
  { id: 'nbc', name: 'NBC News', url: 'https://feeds.nbcnews.com/nbcnews/public/news', category: 'World', homepage: 'https://www.nbcnews.com' },
  { id: 'abc', name: 'ABC News', url: 'https://rssfeeds.abcnews.com/abcnews/internationalheadlines', category: 'World', homepage: 'https://abcnews.go.com' },
  { id: 'bbc', name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'World', homepage: 'https://www.bbc.com/news' },
  { id: 'nyt', name: 'New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'World', homepage: 'https://www.nytimes.com' },
  { id: 'toi', name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', category: 'World', homepage: 'https://timesofindia.indiatimes.com' },
  { id: 'sz', name: 'Süddeutsche Zeitung', url: 'https://rss.sueddeutsche.de/rss/Topthemen', category: 'World', homepage: 'https://www.sueddeutsche.de' },
  // Additional reputable sources for richer feed
  { id: 'guardian', name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'World', homepage: 'https://www.theguardian.com' },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'World', homepage: 'https://www.aljazeera.com' },
  { id: 'reuters', name: 'Reuters', url: 'https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best', category: 'World', homepage: 'https://www.reuters.com' },
  { id: 'cnn', name: 'CNN', url: 'http://rss.cnn.com/rss/edition_world.rss', category: 'World', homepage: 'https://www.cnn.com' },
  { id: 'ft', name: 'Financial Times', url: 'https://www.ft.com/rss/home/world', category: 'Business', homepage: 'https://www.ft.com' },
];

// ============================================================
// Types
// ============================================================

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  sourceId: string;
  sourceUrl: string;
  publishedAt: string;
  category: string;
}

// ============================================================
// Helpers
// ============================================================

const parser = new RSSParser({
  timeout: 8000,
  headers: {
    'User-Agent': 'OverlapseNewsBot/1.0 (+https://overlapse.app)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

async function sha1(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function stripHtml(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

async function fetchSource(source: NewsSource): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(source.url);
    if (!feed.items || feed.items.length === 0) return [];

    const articles: NewsArticle[] = [];
    for (const item of feed.items.slice(0, 8)) {
      const title = stripHtml(item.title || '');
      const link = item.link || item.guid || '';
      if (!title || !link) continue;

      const description = stripHtml(item.contentSnippet || item.content || item.summary || '').substring(0, 250);
      const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();
      const id = await sha1(`${source.id}-${title}-${link}`);

      articles.push({
        id,
        title,
        description,
        url: link,
        source: source.name,
        sourceId: source.id,
        sourceUrl: source.homepage,
        publishedAt,
        category: source.category,
      });
    }
    return articles;
  } catch (err) {
    console.error(`Failed to fetch ${source.name} (${source.url}):`, err);
    return [];
  }
}

async function fetchAllNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(SOURCES.map((s) => fetchSource(s)));
  const all: NewsArticle[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  // Dedupe by id
  const seen = new Set<string>();
  const deduped = all.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  // Sort by date (newest first)
  deduped.sort((a, b) => {
    const ta = new Date(a.publishedAt).getTime();
    const tb = new Date(b.publishedAt).getTime();
    return tb - ta;
  });

  return deduped;
}

// ============================================================
// Cloudflare Worker entry
// ============================================================

interface Env {
  NEWS_CACHE: KVNamespace;
  NEWS_API_KEY?: string;
}

const CACHE_TTL = 600; // 10 minutes in seconds
const CACHE_KEY = 'all-news-v1';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers — allow any origin (public API)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          sources: SOURCES.length,
          version: '1.0.0',
        }),
        { headers: corsHeaders }
      );
    }

    // List sources
    if (path === '/api/sources') {
      return new Response(
        JSON.stringify({
          sources: SOURCES.map((s) => ({ id: s.id, name: s.name, category: s.category, homepage: s.homepage })),
        }),
        { headers: corsHeaders }
      );
    }

    // News endpoint
    if (path === '/api/news') {
      let articles: NewsArticle[];

      // Try KV cache first
      try {
        const cached = await env.NEWS_CACHE.get(CACHE_KEY, 'json');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          articles = cached as NewsArticle[];
        } else {
          // Cache miss — fetch fresh
          articles = await fetchAllNews();
          if (articles.length > 0) {
            // Write to KV (fire-and-forget — don't block response)
            ctx.waitUntil(env.NEWS_CACHE.put(CACHE_KEY, JSON.stringify(articles), {
              expirationTtl: CACHE_TTL,
            }));
          }
        }
      } catch (err) {
        // KV not configured or failed — fetch fresh without caching
        console.warn('KV cache miss/error:', err);
        articles = await fetchAllNews();
      }

      // Apply filters
      const sourceFilter = url.searchParams.get('source');
      const categoryFilter = url.searchParams.get('category');
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);

      let filtered = articles;
      if (sourceFilter && sourceFilter !== 'all') {
        filtered = filtered.filter((a) => a.sourceId === sourceFilter);
      }
      if (categoryFilter && categoryFilter !== 'All') {
        filtered = filtered.filter((a) => a.category === categoryFilter);
      }

      return new Response(
        JSON.stringify({
          articles: filtered.slice(0, limit),
          total: filtered.length,
          cached: true,
          fetchedAt: new Date().toISOString(),
          sources: SOURCES.length,
        }),
        { headers: corsHeaders }
      );
    }

    // 404
    return new Response(
      JSON.stringify({ error: 'Not found', path }),
      { status: 404, headers: corsHeaders }
    );
  },
};

// Type-only import for context (Cloudflare Workers runtime)
declare const ctx: { waitUntil(promise: Promise<any>): void };
