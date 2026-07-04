'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  category: string;
}

const NEWS_SOURCES = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'World' },
  { name: 'CNN World', url: 'http://rss.cnn.com/rss/edition_world.rss', category: 'World' },
  { name: 'Reuters World', url: 'https://www.reuters.com/world/rss', category: 'World' },
  { name: 'NY Times World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'World' },
  { name: 'CNBC World', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', category: 'Business' },
  { name: 'Financial Times', url: 'https://www.ft.com/rss/home/world', category: 'Business' },
  { name: 'ABC News', url: 'https://abcnews.go.com/abcnews/internationalheadlines', category: 'World' },
  { name: 'NBC News', url: 'https://feeds.nbcnews.com/nbcnews/public/world', category: 'World' },
  { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', category: 'World' },
  { name: 'Süddeutsche Zeitung', url: 'https://rss.sueddeutsche.de/rss/Topthemen', category: 'World' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'World' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'World' },
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export function LatestNews({ maxItems = 10 }: { maxItems?: number }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(NEWS_SOURCES.map(s => s.category)))];

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allArticles: NewsArticle[] = [];
      
      // Fetch from multiple sources in parallel
      const fetchPromises = NEWS_SOURCES.map(async (source) => {
        try {
          const response = await fetch(`${CORS_PROXY}${encodeURIComponent(source.url)}`, {
            headers: { 'Accept': 'application/xml, text/xml, */*' },
            signal: AbortSignal.timeout(10000),
          });
          
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          
          const items = xmlDoc.querySelectorAll('item, entry');
          
          items.forEach((item, index) => {
            if (index >= 5) return; // Limit per source
            
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const description = item.querySelector('description')?.textContent?.trim() || 
                              item.querySelector('summary')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || 
                        item.querySelector('link')?.getAttribute('href')?.trim() || '';
            const pubDate = item.querySelector('pubDate')?.textContent?.trim() || 
                          item.querySelector('published')?.textContent?.trim() || 
                          item.querySelector('updated')?.textContent?.trim() || '';
            
            if (title && link) {
              allArticles.push({
                id: `${source.name}-${index}-${Date.now()}`,
                title,
                description: description.replace(/<[^>]*>/g, '').substring(0, 200),
                url: link,
                source: source.name,
                sourceUrl: source.url,
                publishedAt: pubDate,
                category: source.category,
              });
            }
          });
        } catch (err) {
          console.debug(`Failed to fetch ${source.name}:`, err);
        }
      });
      
      await Promise.all(fetchPromises);
      
      // Sort by date (newest first)
      allArticles.sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime();
        const dateB = new Date(b.publishedAt).getTime();
        return dateB - dateA;
      });
      
      setArticles(allArticles.slice(0, maxItems * 2)); // Keep more for filtering
    } catch (err) {
      setError('Failed to load news. Please try again.');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(interval);
  }, [maxItems]);

  const filteredArticles = selectedCategory === 'All' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const toggleSource = (sourceName: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceName)) next.delete(sourceName);
      else next.add(sourceName);
      return next;
    });
  };

  if (loading && articles.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff6a1a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#ff6a1a]/20 flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-[#ff6a1a]" />
          </div>
          <h3 className="text-sm font-bold text-white">World News</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded-lg focus:border-[#ff6a1a] focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-600 disabled:opacity-50 transition-colors"
            aria-label="Refresh news"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No articles found for this category
          </div>
        ) : (
          filteredArticles.map((article, index) => {
            const isExpanded = expandedSources.has(article.source);
            return (
              <article
                key={article.id}
                className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden hover:border-[#ff6a1a]/30 transition-colors"
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {article.category}
                        </span>
                        <span className="text-[10px] text-zinc-500">{formatDate(article.publishedAt)}</span>
                      </div>
                      <h4 className="text-sm font-medium text-white line-clamp-2 mb-1">
                        {article.title}
                      </h4>
                      {article.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">
                          {article.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-medium">{article.source}</span>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-[#00e0ff] hover:text-[#00e0ff]/70 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Read
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className="text-[10px] text-zinc-500">
          Showing {filteredArticles.length} of {articles.length} articles •{' '}
          <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" className="text-[#00e0ff] hover:underline">
            Powered by RSS feeds
          </a>
        </p>
      </div>
    </div>
  );
}

export default LatestNews;
