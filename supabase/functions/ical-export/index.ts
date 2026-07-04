// Supabase Edge Function: ical-export
// Deploy from Supabase Dashboard → Edge Functions → New Function → paste this → Deploy
//
// Returns an iCal (.ics) feed for a group's confirmed meeting_blocks.
// URL pattern: https://<project>.functions.supabase.co/ical-export?group_id=<uuid>
//
// Add to external calendar as: webcal://<project>.functions.supabase.co/ical-export?group_id=<uuid>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function escapeICal(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const groupId = url.searchParams.get('group_id');

  if (!groupId) {
    return new Response(JSON.stringify({ error: 'Missing group_id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch group + confirmed meetings
  const { data: group, error: groupErr } = await supabase
    .from('groups')
    .select('id, name, recurrence_rule, is_recurring')
    .eq('id', groupId)
    .single();

  if (groupErr || !group) {
    return new Response(JSON.stringify({ error: 'Group not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: meetings, error: meetingsErr } = await supabase
    .from('meeting_blocks')
    .select('id, title, start_time, end_time, is_confirmed')
    .eq('group_id', groupId)
    .eq('is_confirmed', true)
    .order('start_time', { ascending: true });

  if (meetingsErr) {
    return new Response(JSON.stringify({ error: meetingsErr.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build iCal
  const now = toICalDate(new Date());
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Overlapse//EN',
    `X-WR-CALNAME:Overlapse - ${escapeICal(group.name)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const m of meetings || []) {
    const start = toICalDate(new Date(m.start_time));
    const end = toICalDate(new Date(m.end_time));
    ical.push(
      'BEGIN:VEVENT',
      `UID:${m.id}@overlapse`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeICal(m.title || group.name + ' sync')}`,
      `DESCRIPTION:${escapeICal('Coordination by Overlapse')}`,
      'STATUS:CONFIRMED',
    );

    // Add RRULE if group is recurring
    if (group.is_recurring && group.recurrence_rule) {
      // Convert RRULE string like "FREQ=WEEKLY;BYDAY=MO" to iCal format
      ical.push(`RRULE:${group.recurrence_rule}`);
    }

    ical.push('END:VEVENT');
  }

  ical.push('END:VCALENDAR');

  return new Response(ical.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="overlapse-${groupId}.ics"`,
      'Cache-Control': 'public, max-age=300', // 5 min cache
    },
  });
});
