/** Fermeture saisonnière : le lieu ferme et rouvre à une date donnée. */

/** Vrai si l'établissement est fermé pour la saison à la date `today` (AAAA-MM-JJ). */
export function isClosedForSeason(reopensOn: string | null | undefined, today: string): boolean {
  return Boolean(reopensOn) && today < (reopensOn as string);
}

/** Premier jour réservable : aujourd'hui, ou le jour de la réouverture si le lieu est fermé. */
export function bookingStart(reopensOn: string | null | undefined, today: string): string {
  return isClosedForSeason(reopensOn, today) ? (reopensOn as string) : today;
}
