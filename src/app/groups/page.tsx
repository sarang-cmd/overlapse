'use client';
import { DEFAULT_MEMBERS, computeGoldenHours, findBestOverlap } from '@/lib/overlapse/golden-hours';
import { DraggableMeeting } from '@/components/overlapse/draggable-meeting';
import { DateTime } from 'luxon';
import Link from 'next/link';

export default function GroupsPage(){
  const members = DEFAULT_MEMBERS;
  const segs = computeGoldenHours(members, DateTime.utc().toISODate()!);
  const best = findBestOverlap(segs, 0.8);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-200" style={{fontFamily:'"Fragment Mono", monospace'}}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl text-white">Overlapse <span className="text-[#ff6a1a]">Groups</span></h1>
          <div className="flex gap-3 text-[11px]">
            <Link href="/" className="text-zinc-400 hover:text-white">Landing</Link>
            <Link href="/dashboard" className="text-[#00e0ff]">Dashboard →</Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <DraggableMeeting />
            <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015]">
              <div className="text-[10px] text-[#ff6a1a] uppercase tracking-wider mb-3">group_members • RLS enforced</div>
              <table className="w-full text-[11px]">
                <thead className="text-zinc-500">
                  <tr><td className="py-1">Member</td><td>Timezone</td><td>Work</td><td>Lat/Lng</td></tr>
                </thead>
                <tbody>
                  {members.map(m=>(
                    <tr key={m.id} className="border-t border-white/[0.05]">
                      <td className="py-2" style={{color:m.color}}>{m.name}</td>
                      <td className="text-zinc-300">{m.timezone}</td>
                      <td className="text-zinc-400">{m.workStart}–{m.workEnd}</td>
                      <td className="text-zinc-500">{m.lat?.toFixed(1)},{m.lng?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4">
            <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015]">
              <div className="text-[10px] text-[#00e0ff] uppercase tracking-wider mb-2">Golden Hours today</div>
              {best.slice(0,4).map((b,i)=>(
                <div key={i} className="text-[11px] py-1.5 border-b border-white/[0.05] last:border-0">
                  <div className="text-white">{b.startUTC.toFormat('HH:mm')}–{b.endUTC.toFormat('HH:mm')} UTC</div>
                  <div className="text-zinc-500">{Math.round(b.coverage*100)}% • {b.minutes}m</div>
                </div>
              ))}
            </div>
            <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015] text-[10px] text-zinc-400">
              <div className="text-zinc-200 mb-2">meeting_blocks</div>
              id uuid • group_id • start_time timestamptz<br/>
              end_time • is_draggable_proposal bool<br/><br/>
              <div className="text-zinc-200 mb-1">suggestions</div>
              meeting_block_id → new_start/new_end<br/>
              reason text • realtime via Supabase
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
