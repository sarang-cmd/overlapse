'use client';
import React, { useEffect, useState } from 'react';

type Msg = { id: number; user: string; text: string; unread?: boolean };

const seed: Msg[] = [
  { id:1, user: 'AR', text: 'Can we shift +30m? sunset here', unread: true },
  { id:2, user: 'NY', text: 'Golden hour 14:00–16:00 UTC looks clean', unread: true },
  { id:3, user: 'TYO', text: 'Late night OK once / week', unread: false },
  { id:4, user: 'JKT', text: 'webcal feed synced ✓', unread: false },
];

export function MessagesPanel({ onNew }: { onNew?: (m: Msg)=>void }) {
  const [msgs, setMsgs] = useState(seed);

  // simulate realtime Supabase suggestions
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() > 0.72) {
        const n = { id: Date.now(), user: 'SYS', text: 'New suggestion posted • reason attached', unread: true };
        setMsgs(m => [n, ...m].slice(0,6));
        onNew?.(n);
      }
    }, 7000);
    return () => clearInterval(t);
  }, [onNew]);

  return (
    <div style={{fontFamily:'"Fragment Mono", monospace'}}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-widest text-zinc-300">Messages</div>
        <div className="text-[10px] text-zinc-500">{msgs.filter(m=>m.unread).length} new</div>
      </div>
      <div className="space-y-3">
        {msgs.map((m,i)=>(
          <div key={m.id} className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[10px] text-zinc-300">{m.user}</div>
            <div className="flex-1">
              <div className="h-[2px] w-16 bg-zinc-700 rounded mb-1" style={{opacity: 0.7 - i*0.12}} />
              <div className="text-[11px] text-zinc-400 leading-snug">{m.text}</div>
              <div className="h-[1px] w-full bg-white/[0.04] mt-2" />
            </div>
            {m.unread && <div className="text-[10px] text-[#ff6a1a] mt-1">●</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
