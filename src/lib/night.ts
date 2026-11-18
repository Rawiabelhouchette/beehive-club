import { addDays, nowInTunis, weekdayOf } from "./time";

/** Heure à laquelle la nuit du club se termine : avant 4 h, on est encore dans la soirée de la veille. */
export const NIGHT_ENDS_AT = 4 * 60;

export interface ClubNight {
  /** Date de la soirée en cours ou à venir (AAAA-MM-JJ, heure de Tunis). */
  date: string;
  weekday: number;
  /** Vrai entre minuit et 4 h : la soirée de la veille continue. */
  late: boolean;
}

/** La soirée qui compte maintenant : celle de ce soir, ou celle d'hier tant qu'il n'est pas 4 h. */
export function clubNight(now: Date = new Date()): ClubNight {
  const tunis = nowInTunis(now);
  const late = tunis.minutes < NIGHT_ENDS_AT;
  const date = late ? addDays(tunis.date, -1) : tunis.date;
  return { date, weekday: weekdayOf(date), late };
}
