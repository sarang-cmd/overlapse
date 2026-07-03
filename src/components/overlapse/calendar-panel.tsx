'use client';
import React, { useState } from 'react';
import { DateTime } from 'luxon';

export function CalendarPanel() {
  const [view, setView] = useState<'Today'|'Week'|'Month'|'Year'>('Month');
  const now = DateTime.fromObject({ year: 2026, month: 6, day: 7 }); // sketch date: 7 June 2026
  const start = now.startOf('month').startOf('week');
  const days = Array.from({length: 42}, (_,i)=> start.plus({days:i}));

  const highlights = [8,24]; // circled in sketch

  return (
    <div style={{fontFamily:'"Fragment Mono", monospace'}} className="text-zinc-300">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[13px] text-zinc-200">Calendar – June</div>
        <div className="text-[11px] text-zinc-400">Date: 7<br/>June<br/>2026</div>
      </div>
      <div className="grid grid-cols-7 gap-[6px] text-[11px] text-center">
        {['1','2','3','4','5','6','7'].map((_,i)=>(
          <div key={`h-${i}`} className="text-zinc-500 text-[10px]">{days[i].toFormat('d')}</div>
        ))}
        {/* Real month grid – simplified to match sketch */}
        {Array.from({length: 31}, (_,i)=>i+1).map(d=>{
          const isH = highlights.includes(d);
          const isToday = d===7;
          return (
            <div key={d}
              className={`py-1 rounded-full ${
                isToday ? 'ring-1 ring-[#00e0ff] text-[#00e0ff]' : 
                isH ? 'border border-zinc-500 text-white' : 'text-zinc-400'
              }`}
            >
              {d}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px]">
        <span className="text-zinc-500">Change View:</span>
        {(['Today','Week','Month','Year'] as const).map(v=>(
          <button 
            key={v}
            onClick={()=>setView(v)}
            className={`px-2 py-[3px] border rounded ${view===v ? 'border-[#ff6a1a] text-[#ff6a1a]' : 'border-white/15 text-zinc-400 hover:border-white/30'}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
