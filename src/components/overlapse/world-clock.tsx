'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, X, Plus, MapPin } from 'lucide-react';
import { DateTime } from 'luxon';
import { getAllCities } from '@/lib/overlapse/zoom-label';
import { useAuth } from '@/lib/supabase/auth';

interface WorldClockProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorldClock({ isOpen, onClose }: WorldClockProps) {
  const { profile, updateProfile } = useAuth();
  const [now, setNow] = useState(DateTime.now());
  const [search, setSearch] = useState('');
  const [showAddCity, setShowAddCity] = useState(false);

  // All available cities (city name + tz)
  const allCities = useMemo(() => getAllCities(), []);

  // Selected zones — from profile (signed in) or localStorage (signed out)
  const [selectedZones, setSelectedZones] = useState<string[]>([
    'UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
  ]);

  // Load from profile or localStorage
  useEffect(() => {
    if (profile?.world_clock_cities && profile.world_clock_cities.length > 0) {
      setSelectedZones(profile.world_clock_cities);
    } else {
      try {
        const saved = localStorage.getItem('overlapse:world-clock-cities');
        if (saved) setSelectedZones(JSON.parse(saved));
      } catch {}
    }
  }, [profile]);

  // Persist to localStorage (always) + profile (if signed in)
  const persistZones = async (zones: string[]) => {
    setSelectedZones(zones);
    try {
      localStorage.setItem('overlapse:world-clock-cities', JSON.stringify(zones));
    } catch {}
    if (profile) {
      await updateProfile({ world_clock_cities: zones });
    }
  };

  // Tick every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setNow(DateTime.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter cities for the "add" search
  const filteredCities = search
    ? allCities
        .filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.tz.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 8)
    : allCities.slice(0, 5);

  const addZone = (tz: string) => {
    if (!selectedZones.includes(tz)) {
      persistZones([...selectedZones, tz]);
    }
    setShowAddCity(false);
    setSearch('');
  };

  const removeZone = (tz: string) => {
    persistZones(selectedZones.filter((z) => z !== tz));
  };

  // Format time for a timezone using Luxon (DST-safe, no API call)
  const formatTime = (tz: string) => {
    try {
      const dt = now.setZone(tz);
      return {
        time: dt.toFormat('HH:mm:ss'),
        date: dt.toFormat('ccc dd LLL'),
        offset: dt.toFormat('ZZZZ'),
        isDST: dt.isInDST,
        hour: dt.hour,
      };
    } catch {
      return { time: '--:--:--', date: '', offset: '', isDST: false, hour: 0 };
    }
  };

  // Day/night icon for each zone
  const getDayNightIcon = (tz: string) => {
    const info = formatTime(tz);
    if (info.hour >= 6 && info.hour < 18) return '☀';
    return '☾';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0a0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff6a1a]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#ff6a1a]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">World Clock</h2>
              <p className="text-[10px] text-zinc-500">
                Updated locally • No API calls • DST-safe via Luxon
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => setShowAddCity(!showAddCity)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ff6a1a]/15 border border-[#ff6a1a]/30 text-[#ff6a1a] text-[11px] uppercase tracking-wider hover:bg-[#ff6a1a]/25 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add timezone
          </button>

          {showAddCity && (
            <div className="mt-3">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city or timezone (e.g. Tokyo, Asia/Kolkata)"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-500 outline-none focus:border-[#00e0ff]/50"
              />
              <div className="mt-2 max-h-[200px] overflow-y-auto space-y-1">
                {filteredCities.map((c) => (
                  <button
                    key={`${c.name}-${c.tz}`}
                    onClick={() => addZone(c.tz)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] text-left transition-colors"
                  >
                    <div>
                      <div className="text-[12px] text-zinc-200">{c.name}</div>
                      <div className="text-[10px] text-zinc-500">{c.country}</div>
                    </div>
                    <div className="text-[10px] text-[#00e0ff]">{c.tz}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 overflow-y-auto max-h-[55vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedZones.map((tz) => {
              const info = formatTime(tz);
              return (
                <div
                  key={tz}
                  className="bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-[#ff6a1a]/30 transition-colors relative group"
                >
                  <button
                    onClick={() => removeZone(tz)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-zinc-800/50 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    aria-label="Remove timezone"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider truncate pr-6">
                      {tz.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[14px]">{getDayNightIcon(tz)}</span>
                  </div>
                  <div className="text-3xl font-mono text-white tabular-nums">{info.time}</div>
                  <div className="flex items-center justify-between mt-2 text-[10px]">
                    <span className="text-zinc-500">{info.date}</span>
                    <span className="text-zinc-400">
                      UTC{info.offset}
                      {info.isDST && <span className="text-yellow-400 ml-1">DST</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedZones.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No timezones selected. Click "Add timezone" above.</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-3 text-[10px] text-zinc-500 text-center">
          Times computed via <span className="text-[#00e0ff]">Intl.DateTimeFormat</span> + Luxon •
          Synced to your browser's IANA timezone database
        </div>
      </div>
    </div>
  );
}

export default WorldClock;
