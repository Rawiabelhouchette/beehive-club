/**
 * Lever et coucher du soleil (algorithme de l'Almanac for Computers, précision ~1–2 min).
 * Utilisé pour caler le ciel de la page d'accueil sur l'heure réelle à Gammarth.
 */

const RAD = Math.PI / 180;
const ZENITH = 90.833; // réfraction atmosphérique + rayon du disque solaire

function normalize(value: number, max: number): number {
  return ((value % max) + max) % max;
}

function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 0);
  return Math.floor((Date.UTC(year, month - 1, day) - start) / 86_400_000);
}

/** Heure UTC (en heures décimales) du lever ou du coucher, ou null s'il n'a pas lieu. */
function eventHourUtc(doy: number, lat: number, lng: number, rising: boolean): number | null {
  const lngHour = lng / 15;
  const t = doy + ((rising ? 6 : 18) - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  const L = normalize(M + 1.916 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 282.634, 360);

  let RA = normalize(Math.atan(0.91764 * Math.tan(L * RAD)) / RAD, 360);
  RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
  RA /= 15;

  const sinDec = 0.39782 * Math.sin(L * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos(ZENITH * RAD) - sinDec * Math.sin(lat * RAD)) / (cosDec * Math.cos(lat * RAD));
  if (cosH > 1 || cosH < -1) return null;

  const H = (rising ? 360 - Math.acos(cosH) / RAD : Math.acos(cosH) / RAD) / 15;
  const T = H + RA - 0.06571 * t - 6.622;
  return normalize(T - lngHour, 24);
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

/** Lever/coucher pour une date civile AAAA-MM-JJ et des coordonnées. */
export function sunTimes(isoDate: string, lat: number, lng: number): SunTimes | null {
  const [y, m, d] = isoDate.split("-").map(Number);
  const doy = dayOfYear(y, m, d);
  const rise = eventHourUtc(doy, lat, lng, true);
  const set = eventHourUtc(doy, lat, lng, false);
  if (rise === null || set === null) return null;
  const base = Date.UTC(y, m - 1, d);
  return {
    sunrise: new Date(base + rise * 3_600_000),
    sunset: new Date(base + set * 3_600_000),
  };
}

export type SkyPhase = "day" | "golden" | "dusk" | "night";

/** Phase du ciel à un instant donné, relative au lever et au coucher du jour. */
export function skyPhase(now: Date, times: SunTimes): SkyPhase {
  const minutes = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60_000;
  const toSunset = minutes(times.sunset, now);
  const sinceSunrise = minutes(now, times.sunrise);
  if (sinceSunrise < 0) return "night";
  if (sinceSunrise < 40) return "golden";
  if (toSunset > 80) return "day";
  if (toSunset > 0) return "golden";
  if (toSunset > -70) return "dusk";
  return "night";
}
