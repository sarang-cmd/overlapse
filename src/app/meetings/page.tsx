'use client';
import React, { useState } from 'react';
import { RRule } from 'rrule';
import { DateTime } from 'luxon';
import Link from 'next/link';

export default function MeetingsPage(){
  const [ruleStr] = useState('FREQ=WEEKLY;BYDAY=MO;BYHOUR=14;BYMINUTE=0');
  const rule = RRule.fromString(ruleStr);
  const next5 = rule.all((_,i)=> i<5);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-200" style={{fontFamily:'"Fragment Mono", monospace'}}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl">Meetings <span className="text-[#00e0ff]">RRULE</span></h1>
          <div className="text-[11px] flex gap-4">
            <Link href="/dashboard" className="text-zinc-400 hover:text-white">Dashboard</Link>
            <Link href="/groups" className="text-zinc-400 hover:text-white">Groups</Link>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015]">
            <div className="text-[10px] text-[#ff6a1a] uppercase tracking-wider mb-2">Recurrence Rule</div>
            <code className="text-[11px] text-[#00e0ff]">{ruleStr}</code>
            <div className="mt-4 space-y-2 text-[11px]">
              {next5.map((d,i)=>{
                const dt = DateTime.fromJSDate(d, {zone:'utc'});
                return <div key={i} className="flex justify-between border-b border-white/[0.05] py-1">
                  <span>{dt.toFormat('EEE dd LLL yyyy HH:mm')} UTC</span>
                  <span className="text-zinc-500">{dt.setZone('America/Argentina/Buenos_Aires').toFormat('HH:mm')} BA • {dt.setZone('Asia/Tokyo').toFormat('HH:mm')} TYO</span>
                </div>
              })}
            </div>
          </div>
          <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015] text-[11px] leading-relaxed text-zinc-300">
            <div className="text-[#ff6a1a] mb-2">Edge Function • /api/ics/[groupId]</div>
            <pre className="text-[10px] text-zinc-400 overflow-auto">{`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Overlapse//EN
X-WR-CALNAME:Overlapse Golden Hours
BEGIN:VEVENT
UID:golden-${Date.now()}@overlapse
DTSTART:20260708T140000Z
DTEND:20260708T150000Z
RRULE:FREQ=WEEKLY
SUMMARY:Overlapse Sync
DESCRIPTION:Draggable proposal • Supabase Realtime
END:VEVENT
END:VCALENDAR`}</pre>
            <div className="mt-3 text-[10px] text-zinc-500">webcal://overlapse.app/api/ics/grp_… • auto-refresh</div>
          </div>
        </div>
      </div>
    </div>
  )
}
