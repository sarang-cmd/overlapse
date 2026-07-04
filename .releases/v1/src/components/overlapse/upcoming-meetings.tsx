'use client';
import React from 'react';

export function UpcomingMeetings() {
  return (
    <div style={{fontFamily:'"Fragment Mono", monospace'}} className="text-zinc-300">
      <div className="text-[11px] uppercase tracking-widest text-zinc-300 mb-3 border-b border-white/10 pb-2">Upcoming Meetings</div>
      <div className="space-y-4 text-[12px]">
        <div>
          <div className="text-zinc-100">Tomorrow 14:00</div>
          <div className="h-[1px] bg-white/[0.07] my-2 w-3/4" />
          <div className="text-[10px] text-zinc-500">Golden Hours sync • Buenos Aires host</div>
        </div>
        <div>
          <div className="text-zinc-100">Monday, 24th June, 16:00</div>
          <div className="h-[1px] bg-white/[0.07] my-2 w-3/4" />
          <div className="text-[10px] text-zinc-500">RRULE weekly • FCM + Resend notify</div>
        </div>
        <div className="text-[10px] text-zinc-500 pt-2">
          Export: <span className="text-[#00e0ff]">webcal://overlapse/grp_abc.ics</span>
        </div>
      </div>
    </div>
  );
}
