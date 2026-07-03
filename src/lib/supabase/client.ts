// Supabase client – Overlapse PRD Section 10
// npm i @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'ey-placeholder';

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true }
});

// Realtime suggestions – PRD 7.4
export function subscribeSuggestions(groupId: string, cb: (payload: any)=>void){
  return supabase
    .channel(`suggestions:${groupId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'suggestions',
      filter: `meeting_block_id=in.(select id from meeting_blocks where group_id=eq.${groupId})`
    }, cb)
    .subscribe();
}

// Golden Hours is computed client-side via Luxon – see @/lib/overlapse/golden-hours
