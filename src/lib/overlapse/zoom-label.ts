/**
 * Zoom-aware location label resolver.
 * Given a globe camera position (lat, lng, altitude in km), returns
 * a human-readable label like "Tokyo, Japan" or "World" or "Atlantic Ocean".
 *
 * Uses bundled cities.json — no external API calls.
 */

import citiesData from '@/lib/data/cities.json';

export interface CameraPosition {
  lat: number;
  lng: number;
  altitude: number; // km above globe surface (globe.gl convention)
}

export interface LocationLabel {
  primary: string;   // e.g. "Tokyo"
  secondary?: string; // e.g. "Japan"
  full: string;      // e.g. "Tokyo, Japan"
  zoom: string;      // e.g. "City", "Country", "Region", "Continent", "World"
}

interface CityEntry {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
  population: number;
}

const CITIES: CityEntry[] = citiesData.cities as CityEntry[];

// Continent detection by lat/lng bounding boxes
interface Continent {
  name: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

const CONTINENTS: Continent[] = [
  { name: 'North America', latMin: 14, latMax: 84, lngMin: -170, lngMax: -50 },
  { name: 'South America', latMin: -57, latMax: 14, lngMin: -82, lngMax: -34 },
  { name: 'Europe', latMin: 35, latMax: 72, lngMin: -10, lngMax: 60 },
  { name: 'Africa', latMin: -35, latMax: 38, lngMin: -18, lngMax: 52 },
  { name: 'Asia', latMin: 0, latMax: 78, lngMin: 25, lngMax: 180 },
  { name: 'Oceania', latMin: -50, latMax: 0, lngMin: 110, lngMax: 180 },
  { name: 'Antarctica', latMin: -90, latMax: -60, lngMin: -180, lngMax: 180 },
];

// Approximate country detection by nearest city
function findNearestCity(lat: number, lng: number, maxDistanceKm: number): CityEntry | null {
  let nearest: CityEntry | null = null;
  let minDist = Infinity;

  for (const city of CITIES) {
    const dist = haversine(lat, lng, city.lat, city.lng);
    if (dist < minDist && dist < maxDistanceKm) {
      minDist = dist;
      nearest = city;
    }
  }

  return nearest;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function detectContinent(lat: number, lng: number): string | null {
  for (const c of CONTINENTS) {
    if (lat >= c.latMin && lat <= c.latMax && lng >= c.lngMin && lng <= c.lngMax) {
      return c.name;
    }
  }
  return null;
}

/**
 * Determine the zoom level label from globe altitude.
 * globe.gl altitude is in Earth radii (1 = surface, 2.5 = default view).
 * Convert to km: altitude_km = (altitude - 1) * 6371
 */
export function resolveZoomLabel(camera: CameraPosition): LocationLabel {
  const altitudeKm = (camera.altitude - 1) * 6371; // approximate

  // World view (very high altitude)
  if (altitudeKm > 8000) {
    return { primary: 'The World', full: 'The World', zoom: 'World' };
  }

  // Continent level
  if (altitudeKm > 3000) {
    const continent = detectContinent(camera.lat, camera.lng);
    return {
      primary: continent ?? 'Unknown Region',
      full: continent ?? 'Unknown Region',
      zoom: 'Continent',
    };
  }

  // Country level — find nearest big city within 1500 km
  if (altitudeKm > 800) {
    const city = findNearestCity(camera.lat, camera.lng, 1500);
    if (city) {
      return {
        primary: city.country,
        secondary: city.name,
        full: `${city.country} (near ${city.name})`,
        zoom: 'Country',
      };
    }
    const continent = detectContinent(camera.lat, camera.lng);
    return {
      primary: continent ?? 'Open Ocean',
      full: continent ?? 'Open Ocean',
      zoom: 'Region',
    };
  }

  // Region level — find nearest city within 500 km
  if (altitudeKm > 200) {
    const city = findNearestCity(camera.lat, camera.lng, 500);
    if (city) {
      return {
        primary: city.name,
        secondary: city.country,
        full: `${city.name}, ${city.country}`,
        zoom: 'Region',
      };
    }
    return { primary: 'Open Area', full: 'Open Area', zoom: 'Region' };
  }

  // City level — find nearest city within 100 km
  if (altitudeKm > 30) {
    const city = findNearestCity(camera.lat, camera.lng, 100);
    if (city) {
      return {
        primary: city.name,
        secondary: city.country,
        full: `${city.name}, ${city.country}`,
        zoom: 'City',
      };
    }
    return { primary: 'Local Area', full: 'Local Area', zoom: 'City' };
  }

  // Street level
  const city = findNearestCity(camera.lat, camera.lng, 30);
  if (city) {
    return {
      primary: city.name,
      secondary: city.country,
      full: `${city.name}, ${city.country}`,
      zoom: 'Street',
    };
  }
  return { primary: 'Street View', full: 'Street View', zoom: 'Street' };
}

/**
 * Search cities by name (for the "Search The World" pill).
 * Returns matching cities, sorted by population (largest first).
 */
export function searchCities(query: string, limit: number = 10): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
  )
    .sort((a, b) => b.population - a.population)
    .slice(0, limit);
}

/**
 * Get all cities (for the world clock city picker).
 */
export function getAllCities(): CityEntry[] {
  return CITIES;
}
