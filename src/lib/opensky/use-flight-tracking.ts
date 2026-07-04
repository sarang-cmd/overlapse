'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { FlightAircraft } from '@/components/overlapse/WorldGlobe';

// ============================================================
// Flight tracking overlay — uses OpenSky Network's free API
// ============================================================
// Strategy: client polls OpenSky's anonymous endpoint every 15s
// with bounding box of current globe viewport.
//
// Anonymous tier: 400 req/day. For higher volume, deploy the
// server-side OpenSky proxy (see news-worker pattern + lib/opensky/client.ts).
//
// For now: anonymous tier is fine for personal use. If rate-limited,
// the overlay shows a "data stale" indicator and pauses polling.

interface FlightOverlayProps {
  enabled: boolean;
  onAircraftUpdate: (aircraft: FlightAircraft[]) => void;
  /** Function that returns the current viewport bounds as {lamin, lamax, lomin, lomax} */
  getBounds: () => { lamin: number; lamax: number; lomin: number; lomax: number } | null;
  /** Polling interval in ms (default 15000) */
  intervalMs?: number;
}

interface OpenSkyState {
  icao24: string;
  callsign: string;
  origin_country: string;
  lat: number;
  lng: number;
  altitude: number;
  velocity: number;
  heading: number;
  on_ground: boolean;
}

export function useFlightTracking({
  enabled,
  getBounds,
  intervalMs = 15000,
}: Omit<FlightOverlayProps, 'onAircraftUpdate'>) {
  const [aircraft, setAircraft] = useState<FlightAircraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAircraft = useCallback(async () => {
    if (!enabled) return;

    const bounds = getBounds();
    if (!bounds) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Use the anonymous endpoint (no auth). For registered tier, deploy a Worker proxy.
      const url = `https://opensky-network.org/api/states/all?lamin=${bounds.lamin}&lamax=${bounds.lamax}&lomin=${bounds.lomin}&lomax=${bounds.lomax}`;

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (res.status === 429) {
        setError('OpenSky rate limit reached. Pausing for 60s.');
        setIsStale(true);
        return;
      }

      if (!res.ok) {
        throw new Error(`OpenSky ${res.status}`);
      }

      const data = await res.json();
      const states: any[] = data.states || [];

      const mapped: FlightAircraft[] = states
        .filter((s) => s[5] != null && s[6] != null) // must have lat/lng
        .map((s) => ({
          icao24: s[0] || '',
          callsign: (s[1] || '').trim(),
          origin_country: s[2] || '',
          lng: s[5],
          lat: s[6],
          altitude: s[13] ?? s[7] ?? 0, // geo_altitude or baro_altitude, in meters
          velocity: s[9] ?? 0, // m/s
          heading: s[10] ?? 0, // true_track in degrees
        }));

      setAircraft(mapped);
      setError(null);
      setIsStale(false);
      setLastFetch(Date.now());
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('OpenSky fetch failed:', err);
      setError(err.message || 'Failed to fetch flight data');
      setIsStale(true);
    }
  }, [enabled, getBounds]);

  useEffect(() => {
    if (!enabled) {
      setAircraft([]);
      return;
    }

    fetchAircraft();
    const interval = setInterval(fetchAircraft, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, fetchAircraft, intervalMs]);

  // Mark stale if last fetch was > 45s ago
  useEffect(() => {
    if (!lastFetch) return;
    const checkStale = setInterval(() => {
      if (Date.now() - (lastFetch || 0) > 45000) {
        setIsStale(true);
      }
    }, 10000);
    return () => clearInterval(checkStale);
  }, [lastFetch]);

  return { aircraft, error, isStale, lastFetch, refetch: fetchAircraft };
}

// ============================================================
// Helper: convert globe.gl pointOfView to bounding box
// ============================================================
export function povToBounds(lat: number, lng: number, altitude: number) {
  // altitude is in Earth radii (1 = surface, 2.5 = default view)
  // Convert to approximate km: (altitude - 1) * 6371
  const altitudeKm = Math.max(50, (altitude - 1) * 6371);

  // Field of view: at altitude 2.5 (default), you see ~hemisphere (~5000 km radius)
  // At altitude 1.1, you see ~city (~100 km radius)
  // Rough approximation: visible radius = altitudeKm * 0.5
  const radiusKm = Math.min(5000, altitudeKm * 0.6);

  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));

  return {
    lamin: Math.max(-90, lat - latDelta),
    lamax: Math.min(90, lat + latDelta),
    lomin: ((lng - lngDelta + 540) % 360) - 180,
    lomax: ((lng + lngDelta + 540) % 360) - 180,
  };
}
