'use client';
import React, { useState } from 'react';
import { computeGoldenHours, findBestOverlap, DEFAULT_MEMBERS, MemberWindow } from '@/lib/overlapse/golden-hours';
import { DateTime } from 'luxon';

export function SchedulePanel() {
  const [query, setQuery] = useState('');
  const [members] = useState<MemberWindow[]>(DEFAULT_MEMBERS.slice(0,4));
  const [date] = useState(DateTime.utc().toISODate()!);

  const segments = computeGoldenHours(members, date, 30);
  const best = findBestOverlap(segments, 0.75).slice(0,2);

  const recent = [
    { city: 'Tokyo', tz: 'UTC+9' },
    { city: 'New York', tz: 'UTC-4' },
    { city: 'Jakarta', tz: 'UTC+7' },
  ].filter(r => !query || r.city.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{fontFamily:'"Fragment Mono", monospace'}} className="space-y-4">
      <div>
        <div className="text-[11px] uppercase tracking-widest text-zinc-300 mb-2">Schedule</div>
        <input
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="⌕ Search across time zones"
          className="w-full bg-black/30 border border-white/10 rounded-full px-3 py-2 text-[11px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-[#00e0ff]/50"
        />
      </div>

      <div>
        <div className="text-[10px] text-zinc-500 mb-2">Recent Searches:</div>
        <div className="space-y-1 text-[11px] text-zinc-300">
          {recent.map(r=>(
            <div key={r.city} className="flex justify-between">
              <span>{r.city}</span><span className="text-zinc-500">- {r.tz}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-3">
        <div className="text-[10px] text-[#ff6a1a] uppercase tracking-wider mb-2">Golden Hours — today UTC</div>
        <div className="space-y-2">
          {best.length ? best.map((b,i)=>(
            <div key={i} className="text-[11px] bg-[#ff6a1a]/[0.07] border border-[#ff6a1a]/20 rounded-lg px-3 py-2">
              <div className="text-[#ff6a1a]">{b.startUTC.toFormat('HH:mm')} – {b.endUTC.toFormat('HH:mm')} UTC</div>
              <div className="text-zinc-400 text-[10px]">{Math.round(b.coverage*100)}% awake • {b.minutes} min</div>
            </div>
          )) : <div className="text-[11px] text-zinc-500">No full overlap – try 75%</div>}
        </div>
        <div className="mt-3 text-[10px] text-zinc-500">
          {members.length} members • {segments.filter(s=>s.coverage===1).length} perfect 30m slots
        </div>
      </div>
    </div>
  );
}
