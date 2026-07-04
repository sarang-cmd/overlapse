/**
 * OpenSky Network API client with OAuth2 client credentials flow.
 *
 * OpenSky's new auth (since 2024) uses OAuth2:
 *   1. POST to token endpoint with client_id + client_secret → get access_token
 *   2. GET /api/states/all with Authorization: Bearer <token>
 *
 * Token expires in ~30 days. We cache in memory and refresh on 401.
 *
 * Note: This module runs SERVER-SIDE only (in a Cloudflare Worker or Supabase
 * Edge Function). The client_secret must NEVER be exposed to the browser.
 *
 * For local dev, the Next.js app calls our Worker which calls OpenSky.
 * For production, the same Worker handles caching + rate-limiting.
 */

const TOKEN_URL = process.env.OPENSKY_TOKEN_URL || 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const API_URL = process.env.OPENSKY_API_URL || 'https://opensky-network.org/api';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

let cachedToken: CachedToken | null = null;

interface OpenSkyConfig {
  clientId: string;
  clientSecret: string;
}

function getConfig(): OpenSkyConfig {
  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET must be set');
  }
  return { clientId, clientSecret };
}

/**
 * Fetch a new OAuth2 access token using client_credentials grant.
 */
async function fetchToken(): Promise<string> {
  const { clientId, clientSecret } = getConfig();

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenSky token fetch failed: ${res.status} ${text}`);
  }

  const data = await res.json() as {
    access_token: string;
    expires_in: number;
    token_type: string;
  };

  // Cache token — subtract 60s buffer for safety
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

/**
 * Get a valid access token, refreshing if needed.
 */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }
  return fetchToken();
}

export interface AircraftState {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export interface OpenSkyResponse {
  time: number;
  states: AircraftState[] | null;
}

/**
 * Fetch all aircraft within a bounding box.
 * Free tier: 4,000 requests/day with OAuth2 (registered client).
 */
export async function getAircraftInBounds(
  lamin: number,
  lamax: number,
  lomin: number,
  lomax: number
): Promise<AircraftState[]> {
  const token = await getToken();

  const url = new URL(`${API_URL}/states/all`);
  url.searchParams.set('lamin', String(lamin));
  url.searchParams.set('lamax', String(lamax));
  url.searchParams.set('lomin', String(lomin));
  url.searchParams.set('lomax', String(lomax));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (res.status === 401) {
    // Token expired — force refresh and retry once
    cachedToken = null;
    return getAircraftInBounds(lamin, lamax, lomin, lomax);
  }

  if (res.status === 429) {
    throw new Error('OpenSky rate limit exceeded (4,000 req/day). Try again later.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenSky API error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as OpenSkyResponse;
  if (!data.states) return [];

  // OpenSky returns arrays, not objects — transform
  return data.states.map((s: any) => ({
    icao24: s[0] || '',
    callsign: (s[1] || '').trim(),
    origin_country: s[2] || '',
    time_position: s[3],
    last_contact: s[4],
    longitude: s[5],
    latitude: s[6],
    baro_altitude: s[7],
    on_ground: s[8],
    velocity: s[9],
    true_track: s[10],
    vertical_rate: s[11],
    sensors: s[12],
    geo_altitude: s[13],
    squawk: s[14],
    spi: s[15],
    position_source: s[16],
  }));
}

/**
 * Convenience: fetch aircraft around a center point.
 * radiusKm: approx radius to bound box (1 degree lat ≈ 111 km)
 */
export async function getAircraftNear(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 500
): Promise<AircraftState[]> {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
  return getAircraftInBounds(
    centerLat - latDelta,
    centerLat + latDelta,
    centerLng - lngDelta,
    centerLng + lngDelta
  );
}
