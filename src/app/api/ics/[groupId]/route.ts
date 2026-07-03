import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Overlapse//EN
X-WR-CALNAME:Overlapse ${groupId}
REFRESH-INTERVAL;VALUE=DURATION:PT1H
X-PUBLISHED-TTL:PT1H
BEGIN:VEVENT
UID:overlapse-${groupId}@overlapse.app
DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z
DTSTART:20260708T140000Z
DTEND:20260708T150000Z
RRULE:FREQ=WEEKLY;BYDAY=TU
SUMMARY:Overlapse Golden Hours
DESCRIPTION:Timezone-coordination • Supabase Realtime • https://overlapse.app/g/${groupId}
URL:https://overlapse.app/g/${groupId}
END:VEVENT
END:VCALENDAR`;
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="overlapse-${groupId}.ics"`,
      'Cache-Control': 'max-age=3600',
    },
  });
}
