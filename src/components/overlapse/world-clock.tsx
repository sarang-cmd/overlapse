'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Globe, X, Settings } from 'lucide-react';

interface TimeZone {
  id: string;
  name: string;
  offset: string;
  currentTime: string;
  isDST: boolean;
}

const MAJOR_TIMEZONES: TimeZone[] = [
  { id: 'utc', name: 'UTC', offset: '+0', currentTime: '', isDST: false },
  { id: 'america/new_york', name: 'New York (EST/EDT)', offset: '-5/-4', currentTime: '', isDST: true },
  { id: 'america/los_angeles', name: 'Los Angeles (PST/PDT)', offset: '-8/-7', currentTime: '', isDST: true },
  { id: 'america/sao_paulo', name: 'São Paulo (BRT)', offset: '-3', currentTime: '', isDST: false },
  { id: 'europe/london', name: 'London (GMT/BST)', offset: '+0/+1', currentTime: '', isDST: true },
  { id: 'europe/paris', name: 'Paris (CET/CEST)', offset: '+1/+2', currentTime: '', isDST: true },
  { id: 'africa/johannesburg', name: 'Johannesburg (SAST)', offset: '+2', currentTime: '', isDST: false },
  { id: 'asia/dubai', name: 'Dubai (GST)', offset: '+4', currentTime: '', isDST: false },
  { id: 'asia/kolkata', name: 'Mumbai (IST)', offset: '+5:30', currentTime: '', isDST: false },
  { id: 'asia/shanghai', name: 'Shanghai (CST)', offset: '+8', currentTime: '', isDST: false },
  { id: 'asia/tokyo', name: 'Tokyo (JST)', offset: '+9', currentTime: '', isDST: false },
  { id: 'australia/sydney', name: 'Sydney (AEST/AEDT)', offset: '+10/+11', currentTime: '', isDST: true },
];

export function WorldClock({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [timeZones, setTimeZones] = useState<TimeZone[]>(MAJOR_TIMEZONES);
  const [selectedZones, setSelectedZones] = useState<string[]>(['utc', 'america/new_york', 'europe/london', 'asia/tokyo']);

  useEffect(() => {
    const updateTimes = async () => {
      try {
        // Fetch current time for each timezone
        const promises = timeZones.map(async (tz) => {
          try {
            const res = await fetch(`https://worldtimeapi.org/api/timezone/${tz.id}`);
            if (res.ok) {
              const data = await res.json();
              const date = new Date(data.datetime);
              return {
                ...tz,
                currentTime: date.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false 
                }),
                isDST: data.dst,
              };
            }
          } catch (err) {
            console.debug(`Failed to fetch time for ${tz.id}:`, err);
          }
          // Fallback to local calculation
          const now = new Date();
          return { ...tz, currentTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) };
        });
        const results = await Promise.all(promises);
        setTimeZones(results);
      } catch (err) {
        console.debug('World clock update failed:', err);
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timeZones]);

  const toggleZone = (id: string) => {
    setSelectedZones(prev => prev.includes(id) ? prev.filter(z => z !== id) : [...prev, id]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0a0d14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff6a1a]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#ff6a1a]" />
            </div>
            <h2 className="text-lg font-bold text-white">World Clock</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
        
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
            <span className="px-2 py-1 bg-zinc-800 rounded">Click timezones to show/hide</span>
            <span className="text-zinc-600">•</span>
            <span>Data from worldtimeapi.org</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeZones.map(tz => (
              <button
                key={tz.id}
                onClick={() => toggleZone(tz.id)}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all ${
                  selectedZones.includes(tz.id)
                    ? 'bg-[#ff6a1a]/20 text-[#ff6a1a] border border-[#ff6a1a]/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {tz.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeZones
              .filter(tz => selectedZones.includes(tz.id))
              .map(tz => (
                <div
                  key={tz.id}
                  className="bg-white/[0.02] border border-white/10 rounded-xl p-4 hover:border-[#ff6a1a]/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">{tz.name}</span>
                    {tz.isDST && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">DST</span>
                    )}
                  </div>
                  <div className="text-3xl font-mono text-white tabular-nums">{tz.currentTime}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">UTC{tz.offset}</div>
                </div>
              ))}
          </div>
          
          {selectedZones.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select timezones above to display clocks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorldClock;