/**
 * Sun position + day/night calculation for globe pins.
 * Uses simplified astronomical formulas — accurate to ~1 degree.
 * No external API calls, fully offline.
 */

export interface SunPosition {
  lat: number;
  lng: number;
}

export interface DayNightResult {
  isDay: boolean;
  sunLatitude: number;
  sunLongitude: number;
  altitude: number; // sun altitude in degrees (-90 to 90)
}

/**
 * Calculate the sun's subsolar point (lat/lng where sun is directly overhead)
 * and whether the given location is currently in daylight.
 *
 * Based on NOAA's simplified solar position algorithm.
 * Reference: https://gml.noaa.gov/grad/solcalc/
 */
export function getDayNight(lat: number, lng: number, date: Date = new Date()): DayNightResult {
  // Day of year (1-366)
  const start = new Date(date.getUTCFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);

  // Fractional year (in radians)
  const fractionalYear = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (date.getUTCHours() - 12) / 24);

  // Solar declination (in radians)
  const declination =
    0.006918 -
    0.399912 * Math.cos(fractionalYear) +
    0.070257 * Math.sin(fractionalYear) -
    0.006758 * Math.cos(2 * fractionalYear) +
    0.000907 * Math.sin(2 * fractionalYear) -
    0.002697 * Math.cos(3 * fractionalYear) +
    0.00148 * Math.sin(3 * fractionalYear);

  // Equation of time (in minutes)
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(fractionalYear) -
      0.032077 * Math.sin(fractionalYear) -
      0.014615 * Math.cos(2 * fractionalYear) -
      0.040849 * Math.sin(2 * fractionalYear));

  // Solar noon (in minutes from UTC midnight, but offset by longitude)
  // Sun's subsolar longitude: where solar noon is occurring right now
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const solarTime = utcMinutes + equationOfTime;
  // Subsolar longitude (degrees): -180 to 180, where sun is directly overhead
  const sunLongitude = ((180 - solarTime / 4) % 360 + 540) % 360 - 180;

  const sunLatitude = (declination * 180) / Math.PI;

  // Calculate sun altitude at the given location
  // Hour angle: difference in longitude from subsolar point
  const hourAngleRad = ((lng - sunLongitude) * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const declRad = declination;

  // Solar altitude angle (in radians)
  const sinAltitude =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hourAngleRad);

  const altitude = (Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * 180) / Math.PI;

  return {
    isDay: altitude > -0.833, // -0.833° accounts for atmospheric refraction at horizon
    sunLatitude,
    sunLongitude,
    altitude,
  };
}

/**
 * Returns a color for a pin based on day/night status at its location.
 * Day = amber #ff6a1a, Night = cyan #00e0ff
 */
export function getPinColor(lat: number, lng: number, date: Date = new Date()): string {
  const { isDay } = getDayNight(lat, lng, date);
  return isDay ? '#ff6a1a' : '#00e0ff';
}

/**
 * Returns true if the given location is in civil twilight (sun between -6° and 0°).
 * Useful for "golden hour" detection.
 */
export function isGoldenHour(lat: number, lng: number, date: Date = new Date()): boolean {
  const { altitude } = getDayNight(lat, lng, date);
  return altitude > -6 && altitude < 6;
}
