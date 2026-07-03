'use client';
import React from 'react';

const items = [
  { t: 'Golden Hours v1.3', d: 'Luxon DST-safe overlap engine shipped. RRULE recurring supported.', time: '2h ago' },
  { t: 'Buenos Aires pin live', d: 'Globe.gl night-lights + OpenSky arcs overlay, 10s poll.', time: '5h ago' },
  { t: 'Suggestions → Realtime', d: 'Supabase Realtime channel on suggestions table, with reason field.', time: 'Yesterday' },
];

export function LatestNews() {
  return (
    <div className="h-full flex flex-col" style={{fontFamily:'"Fragment Mono", monospace'}}>
      <div className="text-[11px] uppercase tracking-widest text-zinc-400 mb-3 border-b border-white/10 pb-2">Latest News</div>
      <div className="space-y-4 flex-1 overflow-auto pr-1">
        {items.map((n,i)=>(
          <div key={i} className="border-b border-white/[0.06] pb-4">
            <div className="text-[11px] text-[#00e0ff]">{n.time}</div>
            <div className="text-[13px] text-zinc-100 mt-1">{n.t}</div>
            <div className="mt-2 h-[72px] rounded-md bg-white/[0.03] border border-white/[0.06]" />
            <div className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{n.d}</div>
          </div>
        ))}
      </div>
      <button className="text-[#ff6a1a] text-xs mt-3 text-left">↓ More</button>
    </div>
  );
}
