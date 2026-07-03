'use client';
import Link from 'next/link';

export default function Settings(){
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-300" style={{fontFamily:'"Fragment Mono", monospace'}}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between mb-6">
          <h1 className="text-xl text-white">Overlapse <span className="text-[#00e0ff]">Settings</span> • PRD</h1>
          <Link href="/dashboard" className="text-[11px] text-[#ff6a1a]">→ Mission Control</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-5 text-[11px]">
          <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015]">
            <div className="text-[#ff6a1a] mb-2">Supabase • free tier</div>
            <ul className="space-y-1 text-zinc-400">
              <li>• 500 MB Postgres • 50k MAU</li>
              <li>• Auth: email/password + Google OAuth</li>
              <li>• Realtime: suggestions table websocket</li>
              <li>• RLS: members read own groups</li>
              <li>• Edge Functions: Deno • ics export • FCM dispatch</li>
              <li>• Auto-pause ~7d inactivity — click Restore</li>
            </ul>
          </div>
          <div className="border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015]">
            <div className="text-[#00e0ff] mb-2">Notifications</div>
            <ul className="space-y-1 text-zinc-400">
              <li>• Firebase Cloud Messaging – free unlimited</li>
              <li>• Resend – 3,000 emails/mo free</li>
              <li>• In-app: Sonner + framer-motion toast</li>
              <li>• DB webhook → Edge Function → send</li>
            </ul>
          </div>
          <div className="md:col-span-2 border border-white/[0.08] rounded-2xl p-4 bg-white/[0.015]">
            <div className="text-white mb-2">Database schema (7 tables)</div>
            <pre className="text-[10px] text-zinc-400 overflow-auto leading-relaxed">{`profiles(id uuid, email text, home_timezone text, is_premium bool, push_token text)
groups(id uuid, name text, is_recurring bool, recurrence_rule text)
group_members(group_id, user_id, timezone, work_start, work_end)
meeting_blocks(id, group_id, start_time, end_time, is_draggable_proposal)
suggestions(id, meeting_block_id, suggested_by, new_start, new_end, reason text)
notifications(id, user_id, type text, payload jsonb)
saved_locations(id, user_id, label, lat, lng, timezone, pin_color)`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
