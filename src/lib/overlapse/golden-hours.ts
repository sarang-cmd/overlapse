// Overlapse Golden Hours overlap engine – Luxon-based
// Core algorithm per PRD Section 7.3
import { DateTime, Interval } from 'luxon';

export interface MemberWindow {
  id: string;
  name: string;
  timezone: string;
  workStart: string; // "09:00"
  workEnd: string;   // "17:00"
  color?: string;
  lat?: number;
  lng?: number;
}

export interface OverlapSegment {
  startUTC: DateTime;
  endUTC: DateTime;
  minutes: number;
  coverage: number; // 0-1 how many members awake
}

export function computeGoldenHours(
  members: MemberWindow[],
  dateISO: string = DateTime.utc().toISODate()!,
  stepMinutes = 30
): OverlapSegment[] {
  // Build per-member awake intervals in UTC for the given date
  const memberIntervals = members.map(m => {
    const localStart = DateTime.fromISO(`${dateISO}T${m.workStart}`, { zone: m.timezone });
    const localEnd = DateTime.fromISO(`${dateISO}T${m.workEnd}`, { zone: m.timezone });
    // handle overnight shifts
    const endFixed = localEnd <= localStart ? localEnd.plus({ days: 1 }) : localEnd;
    return Interval.fromDateTimes(localStart.toUTC(), endFixed.toUTC());
  });

  // sweep through UTC day in steps
  const dayStart = DateTime.fromISO(dateISO, { zone: 'utc' }).startOf('day');
  const segments: OverlapSegment[] = [];

  for (let i = 0; i < 24 * 60; i += stepMinutes) {
    const segStart = dayStart.plus({ minutes: i });
    const segEnd = segStart.plus({ minutes: stepMinutes });
    const segInterval = Interval.fromDateTimes(segStart, segEnd);

    let awakeCount = 0;
    memberIntervals.forEach(iv => {
      if (iv.overlaps(segInterval) || iv.contains(segStart) || iv.contains(segEnd.minus({ minutes: 1 }))) {
        awakeCount++;
      }
    });
    const coverage = members.length ? awakeCount / members.length : 0;
    if (coverage > 0) {
      segments.push({
        startUTC: segStart,
        endUTC: segEnd,
        minutes: stepMinutes,
        coverage,
      });
    }
  }
  return segments;
}

export function findBestOverlap(segments: OverlapSegment[], minCoverage = 1): OverlapSegment[] {
  // Return contiguous blocks where coverage >= minCoverage
  const good = segments.filter(s => s.coverage >= minCoverage);
  // merge contiguous
  const merged: OverlapSegment[] = [];
  good.forEach(s => {
    const last = merged[merged.length - 1];
    if (last && last.endUTC.equals(s.startUTC) && Math.abs(last.coverage - s.coverage) < 0.001) {
      last.endUTC = s.endUTC;
      last.minutes += s.minutes;
    } else {
      merged.push({ ...s });
    }
  });
  return merged.sort((a,b) => b.coverage - a.coverage || b.minutes - a.minutes);
}

export const DEFAULT_MEMBERS: MemberWindow[] = [
  { id: 'ba', name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', workStart: '09:00', workEnd: '18:00', color: '#ff6a1a', lat: -34.6118, lng: -58.3960 },
  { id: 'ny', name: 'New York', timezone: 'America/New_York', workStart: '09:00', workEnd: '17:30', color: '#00e0ff', lat: 40.7128, lng: -74.006 },
  { id: 'tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', workStart: '10:00', workEnd: '19:00', color: '#7cffb0', lat: 35.6762, lng: 139.6503 },
  { id: 'jkt', name: 'Jakarta', timezone: 'Asia/Jakarta', workStart: '08:30', workEnd: '17:00', color: '#ffd166', lat: -6.2088, lng: 106.8456 },
  { id: 'ber', name: 'Dresden', timezone: 'Europe/Berlin', workStart: '09:00', workEnd: '18:00', color: '#c084fc', lat: 51.0504, lng: 13.7373 },
];
