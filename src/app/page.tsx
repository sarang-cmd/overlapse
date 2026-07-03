'use client';

import { CinematicHero } from '@/components/ui/cinematic-hero';
import Toaster, { ToasterRef } from '@/components/ui/toast';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

type Variant = 'default' | 'success' | 'error' | 'warning';
type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export default function Home() {
  const toasterRef = useRef<ToasterRef>(null);

  const showToast = (variant: Variant, position: Position = 'bottom-right') => {
    toasterRef.current?.show({
      title: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Notification`,
      message: variant === 'success'
        ? 'Golden Hour overlap found: 04:00–06:00 UTC'
        : variant === 'error'
        ? 'Failed to sync calendar. Check Supabase RLS.'
        : variant === 'warning'
        ? 'Conflicting proposal from Buenos Aires member.'
        : 'New suggestion posted to #overlapse-argentina',
      variant,
      position,
      duration: 3500,
    });
  };

  const simulateApiCall = async () => {
    toasterRef.current?.show({
      title: 'Scheduling…',
      message: 'Computing Golden Hours across 4 timezones…',
      variant: 'default',
      position: 'bottom-right',
    });

    await new Promise((resolve) => setTimeout(resolve, 1800));

    toasterRef.current?.show({
      title: 'Meeting Scheduled',
      message: 'Overlapse group synced for Tue, 8 July, 14:00 UTC — Buenos Aires 11:00, Tokyo 23:00, NYC 10:00.',
      variant: 'success',
      position: 'bottom-right',
      highlightTitle: true,
      actions: {
        label: 'Undo',
        onClick: () => console.log('Undoing meeting schedule'),
        variant: 'outline',
      },
    });
  };

  return (
    <div className="bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Inject Fragment Mono */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fragment+Mono:ital@0;1&display=swap');
        html, body { background: #0a0a0f; }
        body { font-family: 'Fragment Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }
      `}</style>

      <Toaster ref={toasterRef} />

      {/* Hero - cinematic scroll */}
      <CinematicHero
        brandName="Overlapse"
        tagline1="Coordinate the world,"
        tagline2="one timezone at a time."
        cardHeading="Golden Hours, redefined."
        cardDescription={<><span className="text-white font-semibold">Overlapse</span> is a free, personal-scale, cross-platform timezone-coordination tool — mission-control HUD, live 3D Globe.gl, real-time Supabase suggestions, and webcal sync. Built shadcn + Tailwind + TypeScript.</>}
        metricValue={12}
        metricLabel="Zones Synced"
        ctaHeading="Launch mission control."
        ctaDescription="Find when everyone is actually awake. Drag, propose, sync — free forever, Supabase free-tier."
      />

      {/* Post-hero integration lab */}
      <section className="relative z-30 bg-[#0a0a0f] border-t border-[#ff6a1a]/20">
        <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-3 gap-10" style={{fontFamily: '"Fragment Mono", monospace'}}>
          {/* Left: Latest News - from sketch */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-[#00e0ff] text-sm uppercase tracking-widest">Latest News</h3>
            <div className="space-y-5 text-sm text-zinc-300">
              <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
                <div className="text-[11px] text-zinc-500">OVERLAPSE // SYS</div>
                <div className="mt-1 text-zinc-200">Golden Hours engine migrated to Luxon — DST safe.</div>
              </div>
              <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
                <div className="text-[11px] text-zinc-500">GLOBE.GL</div>
                <div className="mt-1 text-zinc-200">OpenSky flight overlay live @ 10s poll, 4k req/day free.</div>
              </div>
              <div className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
                <div className="text-[11px] text-zinc-500">NOTIFY</div>
                <div className="mt-1 text-zinc-200">FCM + Resend wired to Supabase suggestions webhook.</div>
              </div>
              <button className="text-[#ff6a1a] text-xs">↓ More</button>
            </div>
          </div>

          {/* Center: Toast lab */}
          <div className="lg:col-span-1">
            <h3 className="text-[#ff6a1a] text-sm uppercase tracking-widest mb-4">Messages / Toast System</h3>
            <div className="border border-white/[0.08] rounded-2xl p-5 bg-[#0f1117]">
              <p className="text-xs text-zinc-400 mb-4">Sonner + Framer Motion • shadcn/ui • /components/ui/toast.tsx</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {(['default','success','error','warning'] as Variant[]).map(v => (
                  <Button key={v} variant="outline" size="sm"
                    onClick={()=>showToast(v)}
                    className="text-[11px] border-white/15 hover:border-[#ff6a1a]/60 hover:text-[#ff6a1a] bg-transparent"
                  >
                    {v}
                  </Button>
                ))}
              </div>
              <Button onClick={simulateApiCall} className="w-full bg-[#ff6a1a] text-black hover:bg-[#ff7f3a] font-mono text-xs">
                Schedule Meeting → toast flow
              </Button>
              <div className="mt-4 text-[10px] text-zinc-500 space-y-1 font-mono">
                <div>• toasterRef.current?.show(&#123;...&#125;)</div>
                <div>• variants: default | success | error | warning</div>
                <div>• positions: 6 corners</div>
                <div>• actions: Undo built-in</div>
              </div>
            </div>
          </div>

          {/* Right: Schedule */}
          <div className="lg:col-span-1 space-y-5">
            <h3 className="text-[#00e0ff] text-sm uppercase tracking-widest">Schedule</h3>
            <input
              placeholder="⌕ Search across time zones"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-500 outline-none focus:border-[#00e0ff]/50"
            />
            <div className="text-xs text-zinc-400 space-y-2">
              <div className="text-zinc-500">Recent Searches:</div>
              <div>Tokyo – UTC+9</div>
              <div>New York – UTC-4</div>
              <div>Jakarta – UTC+7</div>
              <div>Buenos Aires – UTC-3</div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="text-[#ff6a1a] text-xs uppercase tracking-wider mb-2">Upcoming Meetings</div>
              <div className="text-xs text-zinc-300 space-y-2">
                <div>Tomorrow 14:00 — Golden Hours sync</div>
                <div>Monday, 24th June, 16:00 — RRULE weekly</div>
                <div className="text-zinc-500">Calendar – June 2026 • Date: 7 June 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer PRD summary */}
        <div className="border-t border-white/10 py-12 px-6 max-w-6xl mx-auto text-[11px] leading-relaxed text-zinc-400 font-mono">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-[#ff6a1a] mb2">STACK</div>
              React + TS + Tailwind + shadcn/ui • Vercel<br/>
              Supabase (Postgres, Auth, Realtime, RLS)<br/>
              Globe.gl • Luxon • OpenSky • FCM • Resend
            </div>
            <div>
              <div className="text-[#00e0ff] mb-2">GOLDEN HOURS</div>
              groups → group_members(timezone, work_start, work_end)<br/>
              meeting_blocks (draggable) → suggestions(reason, new_start)<br/>
              RRULE recurrence • webcal .ics export
            </div>
            <div>
              <div className="text-white mb-2">INTEGRATED COMPONENTS</div>
              /components/ui/cinematic-hero.tsx – GSAP ScrollTrigger<br/>
              /components/ui/toast.tsx – Sonner + framer-motion<br/>
              /components/ui/button.tsx – Radix Slot + CVA
            </div>
          </div>
          <div className="mt-8 text-center text-zinc-500">
            Overlapse — free, personal-scale, cross-platform timezone-coordination • Supabase free-tier • #0a0a0f • #ff6a1a • #00e0ff • Fragment Mono
          </div>
        </div>
      </section>
    </div>
  );
}
