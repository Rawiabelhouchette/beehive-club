import type { OpeningHours } from "../content/types";
import { addDays, toMinutes, weekdayOf } from "./time";

export type OpenStatus =
  | { state: "open"; closesAt: string }
  | { state: "opens-later"; opensAt: string }
  | { state: "closed-today" };

/**
 * Ouvert maintenant ? Gère les fermetures après minuit
 * (ex. lundi 18:00 → 02:00 : ouvert mardi à 1 h du matin).
 */
export function openStatus(hours: OpeningHours[], weekday: number, minutes: number): OpenStatus {
  const byDay = (day: number) => hours.find((h) => h.day === day);

  const yesterday = byDay((weekday + 6) % 7);
  if (yesterday?.open && yesterday.close) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close < open && minutes < close) return { state: "open", closesAt: yesterday.close };
  }

  const today = byDay(weekday);
  if (!today?.open || !today.close) return { state: "closed-today" };
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  const closesAfterMidnight = close <= open;

  if (minutes < open) return { state: "opens-later", opensAt: today.open };
  if (closesAfterMidnight || minutes < close) return { state: "open", closesAt: today.close };
  return { state: "closed-today" };
}

/** Heure d'ouverture commune à tous les jours ouverts, sinon null. */
export function commonOpeningTime(hours: OpeningHours[]): string | null {
  const opens = hours.filter((h) => h.open).map((h) => h.open as string);
  if (opens.length === 0) return null;
  return opens.every((o) => o === opens[0]) ? opens[0] : null;
}

/** Ordre d'affichage lundi → dimanche. */
export function weekOrder(hours: OpeningHours[]): OpeningHours[] {
  return [1, 2, 3, 4, 5, 6, 0].map(
    (day) => hours.find((h) => h.day === day) ?? { day, open: null, close: null },
  );
}

/**
 * Les horaires de la semaine, avec les soirs d'événement en plus :
 * un jour habituellement fermé ouvre quand une soirée y est annoncée (ex. un jeudi « Follow flō »).
 */
export function withEventNights(
  hours: OpeningHours[],
  eventWeekdays: number[],
  open = commonOpeningTime(hours) ?? "17:00",
  close = hours.find((h) => h.close)?.close ?? "02:00",
): OpeningHours[] {
  return weekOrder(hours).map((h) =>
    !h.open && eventWeekdays.includes(h.day) ? { day: h.day, open, close } : h,
  );
}

/** Prochaine ouverture après aujourd'hui : jour de la semaine et heure, ou null si tout est fermé. */
export function nextOpening(hours: OpeningHours[], weekday: number): { day: number; open: string } | null {
  for (let offset = 1; offset <= 7; offset++) {
    const day = (weekday + offset) % 7;
    const h = hours.find((x) => x.day === day);
    if (h?.open && h.close) return { day, open: h.open };
  }
  return null;
}

/** Jours de la semaine qui ont une soirée annoncée dans les 7 prochains jours (à partir de `today`). */
export function eventWeekdays(events: { date: string }[], today: string): number[] {
  const end = addDays(today, 6);
  return [...new Set(events.filter((e) => e.date >= today && e.date <= end).map((e) => weekdayOf(e.date)))];
}
