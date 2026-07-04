'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatestNews } from '@/components/overlapse/latest-news';
import { MessagesPanel } from '@/components/overlapse/messages';
import { SchedulePanel } from '@/components/overlapse/schedule';
import { CalendarPanel } from '@/components/overlapse/calendar-panel';
import { UpcomingMeetings } from '@/components/overlapse/upcoming-meetings';
import { ProfileMenu } from '@/components/overlapse/profile-menu';
import { WorldClock } from '@/components/overlapse/world-clock';
import Toaster, { ToasterRef } from '@/components/ui/toast';
import { User, Clock } from 'lucide-react';

const WorldGlobe = dynamic(() => import('@/components/overlapse/WorldGlobe').then(m=>m.default), { ssr: false, loading: () => <div className="h-[520px] rounded-[28px] bg-[#0b0c10] border border-white/10 flex items-center justify-center text-zinc-500 text-xs" style={{fontFamily:'"Fragment Mono",monospace'}}>loading Globe.gl…</div> });

export default function DashboardPage() {
  const toasterRef = useRef<ToasterRef>(null);
  const [focusLabel, setFocusLabel] = useState('World');
  const [autoRotate, setAutoRotate] = useState(false);
  const [showWorldClock, setShowWorldClock] = useState(false);

  const pins = [
    { id: '1', lat: -34.6118, lng: -58.396, label: 'Buenos Aires', color: '#ff6a1a', size: 1, timezone: 'America/Argentina/Buenos_Aires' },
    { id: '2', lat: -31.42, lng: -64.18, label: 'Córdoba', color: '#00e0ff', size: 0.8, timezone: 'America/Argentina/Cordoba' },
    { id: '3', lat: 40.7128, lng: -74.006, label: 'New York', color: '#7cffb0', size: 0.8, timezone: 'America/New_York' },
    { id: '4', lat: 35.6762, lng: 139.65, label: 'Tokyo', color: '#ffd166', size: 0.8, timezone: 'Asia/Tokyo' },
    { id: '5', lat: 51.0504, lng: 13.7373, label: 'Dresden', color: '#c084fc', size: 0.8, timezone: 'Europe/Berlin' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-200" style={{fontFamily:'"Fragment Mono", monospace'}}>
      <Toaster ref={toasterRef} />
      {/* Top bar */}
      <header className="border-b border-white/[0.07] bg-[#0a0a0f]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-[1540px] mx-auto px-5 md:px-8 h-[64px] flex items-center gap-6">
          <div className="text-[20px] tracking-tight font-bold">
            <span className="text-white">Over</span><span className="text-[#ff6a1a]">lapse</span>
          </div>
          <nav className="hidden md:flex items-center gap-5 text-[11px] text-zinc-400">
            <a href="/dashboard" className="text-[#00e0ff]">Mission</a>
            <a href="/groups" className="hover:text-white">Groups</a>
            <a href="/meetings" className="hover:text-white">Meetings</a>
            <a href="/settings" className="hover:text-white">Settings</a>
            <a href="/" className="hover:text-white">Landing</a>
          </nav>
          <div className="flex-1" />
          <button
            onClick={() => setShowWorldClock(true)}
            className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-[#00e0ff]/60 transition-colors"
            aria-label="Open world clock"
            title="World clock"
          >
            <Clock className="w-4 h-4 text-zinc-400" />
          </button>
          <ProfileMenu />
        </div>
      </header>

      {/* 3-column HUD */}
      <main className="max-w-[1540px] mx-auto px-5 md:px-8 py-6 grid grid-cols-12 gap-5">
        {/* Left – Latest News */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-2 bg-white/[0.015] border border-white/[0.07] rounded-2xl p-4 min-h-[560px]">
          <LatestNews />
        </aside>

        {/* Center – Globe */}
        <section className="col-span-12 lg:col-span-6 xl:col-span-7">
          <WorldGlobe
            pins={pins}
            height={520}
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            onLocationChange={(label) => {
              setFocusLabel(label);
            }}
            onPinClick={(p)=>{
              setFocusLabel(p.label);
              toasterRef.current?.show({
                title: `Focused: ${p.label}`,
                message: `${p.lat.toFixed(2)}, ${p.lng.toFixed(2)} • Globe.gl`,
                variant: 'default',
                duration: 2200
              });
            }}
          />

          {/* Golden Hours strip under globe */}
          <div className="mt-4 grid md:grid-cols-3 gap-3 text-[11px]">
            {[
              {k:'OVERLAP', v:'4.5h / day', c:'#ff6a1a'},
              {k:'NEXT SYNC', v:'Tue 14:00 UTC', c:'#00e0ff'},
              {k:'MEMBERS', v:'5 zones • RLS on', c:'#7cffb0'},
            ].map(s=>(
              <div key={s.k} className="border border-white/[0.07] rounded-xl bg-white/[0.02] px-3 py-2">
                <div className="text-[9px] text-zinc-500 tracking-widest">{s.k}</div>
                <div style={{color:s.c}} className="text-[12px] mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right – Messages + Schedule */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-3 space-y-5">
          <div className="bg-white/[0.015] border border-white/[0.07] rounded-2xl p-4">
            <MessagesPanel onNew={(m)=>{
              toasterRef.current?.show({
                title: 'New suggestion',
                message: m.text,
                variant: 'success',
                actions: { label: 'Open', onClick: ()=>{}, variant: 'outline' }
              });
            }} />
          </div>
          <div className="bg-white/[0.015] border border-white/[0.07] rounded-2xl p-4">
            <SchedulePanel />
          </div>
        </aside>

        {/* Bottom strip – Calendar + Upcoming */}
        <section className="col-span-12 grid lg:grid-cols-12 gap-5 mt-2">
          <div className="lg:col-span-8 bg-white/[0.015] border border-white/[0.07] rounded-2xl p-4">
            <CalendarPanel />
          </div>
          <div className="lg:col-span-4 bg-white/[0.015] border border-white/[0.07] rounded-2xl p-4">
            <UpcomingMeetings />
          </div>
        </section>

        {/* Feature grid – new features */}
        <section className="col-span-12 mt-6 border-t border-white/10 pt-8">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Overlapse v1 — shipped modules</div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
            {[
              ['Golden Hours Engine','Luxon UTC intersect • DST safe','border-[#ff6a1a]/25'],
              ['Globe.gl Hero','Three.js night-lights • OpenSky arcs','border-[#00e0ff]/25'],
              ['Realtime Suggestions','Supabase Realtime • reason field','border-[#7cffb0]/25'],
              ['Draggable Blocks','@dnd-kit/core • manual input fallback','border-white/15'],
              ['RRULE Recurring','rrule npm • next occurrence compute','border-white/15'],
              ['webcal Export','Edge Function .ics • auto-refresh','border-white/15'],
              ['FCM Push','Firebase Cloud Messaging • free unlimited','border-white/15'],
              ['Resend Email','3k/mo free • DB webhook trigger','border-white/15'],
              ['shadcn UI Kit','CinematicHero • Toast • Button','border-[#ff6a1a]/25'],
              ['World Clock','Multiple timezones • worldtimeapi.org','border-[#7cffb0]/25'],
              ['RLS Policies','profiles/groups/members/suggestions','border-[#00e0ff]/25'],
              ['Saved Locations','saved_locations pins table','border-white/15'],
              ['90d Auto-Delete','is_premium = true bypass','border-white/15'],
            ].map(([t,d,b])=>(
              <div key={t as string} className={`rounded-xl bg-white/[0.02] p-3 border ${b}`}>
                <div className="text-zinc-100">{t}</div>
                <div className="text-zinc-500 text-[10px] mt-1">{d}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-6 text-[10px]">
            <a href="/" className="px-3 py-2 rounded-full border border-[#ff6a1a]/40 text-[#ff6a1a] hover:bg-[#ff6a1a]/10">← Landing (CinematicHero)</a>
            <button onClick={()=>toasterRef.current?.show({title:'Meeting Scheduled', message:'Your meeting is scheduled for July 4, 2025, at 3:42 PM IST.', variant:'success', highlightTitle:true, actions:{label:'Undo', onClick:()=>{}}})} className="px-3 py-2 rounded-full border border-[#00e0ff]/40 text-[#00e0ff] hover:bg-[#00e0ff]/10">Test meeting toast</button>
            <span className="px-3 py-2 rounded-full border border-white/10 text-zinc-400">Supabase free • 500MB • 50k MAU</span>
            <span className="px-3 py-2 rounded-full border border-white/10 text-zinc-400">OpenSky 4k req/day</span>
          </div>
        </section>
      </main>

      <WorldClock isOpen={showWorldClock} onClose={() => setShowWorldClock(false)} />

      <footer className="border-t border-white/10 mt-10 py-8 text-center text-[10px] text-zinc-500" style={{fontFamily:'"Fragment Mono", monospace'}}>
        Overlapse — timezone mission control • #0a0a0f • #ff6a1a • #00e0ff • Fragment Mono • Supabase • Globe.gl • Esri
      </footer>
    </div>
  );
}
