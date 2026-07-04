# Supabase Edge Functions

## 1. ical-export

Generates a live iCal (.ics) feed for a group's confirmed meetings.

### Deploy (no wrangler needed — Supabase Dashboard handles it)

1. Go to Supabase Dashboard → Edge Functions → New Function
2. Name: `ical-export`
3. Paste contents of `index.ts`
4. Click **Deploy**

### Test

```bash
curl "https://juzyodblzmnsmsqodqzu.supabase.co/functions/v1/ical-export?group_id=YOUR_GROUP_UUID"
```

Should return:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Overlapse//EN
X-WR-CALNAME:Overlapse - Your Group Name
CALSCALE:GREGORIAN
METHOD:PUBLISH
END:VCALENDAR
```

### Add to external calendar

Use this URL format in Google Calendar / Apple Calendar / Outlook:

```
webcal://juzyodblzmnsmsqodqzu.supabase.co/functions/v1/ical-export?group_id=YOUR_GROUP_UUID
```

The calendar app will auto-refresh every few hours.
