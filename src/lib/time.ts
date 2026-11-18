import type { Locale } from "../i18n/config";

export const TIME_ZONE = "Africa/Tunis";

/** Date du jour à Tunis au format AAAA-MM-JJ. */
export function todayInTunis(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Heure actuelle à Tunis en minutes depuis minuit, et jour de la semaine (0 = dimanche). */
export function nowInTunis(now: Date = new Date()): { minutes: number; weekday: number; date: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    weekday: weekdays.indexOf(get("weekday")),
    date: todayInTunis(now),
  };
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Jour de la semaine d'une date AAAA-MM-JJ (0 = dimanche). */
export function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** « 18 h », « 17 h 24 » en français ; « 6 pm », « 5:24 pm » en anglais. */
export function formatTime(hhmm: string, locale: Locale): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (locale === "fr") {
    return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
  }
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function utcDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** « vendredi 7 novembre » / « Friday, November 7 ». */
export function formatLongDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(utcDate(isoDate));
}

/** « juin 2027 » / « June 2027 ». */
export function formatMonthYear(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(utcDate(isoDate));
}

/** Morceaux de date pour les listes de soirées : jour de la semaine, numéro, mois. */
export function dateParts(isoDate: string, locale: Locale): { weekday: string; day: string; month: string } {
  const tag = locale === "fr" ? "fr-FR" : "en-GB";
  const date = utcDate(isoDate);
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(tag, { timeZone: "UTC", ...options }).format(date).replace(".", "");
  return { weekday: fmt({ weekday: "short" }), day: fmt({ day: "numeric" }), month: fmt({ month: "short" }) };
}

/** Formate un instant (Date) en heure locale de Tunis, ex. « 17:24 ». */
export function hhmmInTunis(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
