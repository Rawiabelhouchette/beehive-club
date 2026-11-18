import type { Reservation, ReservationStatus } from "./reservations";

export type ReservationFilter = "all" | ReservationStatus | "events";

export function filterReservations(items: Reservation[], filter: ReservationFilter): Reservation[] {
  if (filter === "all") return items;
  if (filter === "events") return items.filter((r) => r.kind === "event");
  return items.filter((r) => r.status === filter);
}

/** Regroupe par date en gardant l'ordre de la liste (déjà triée par date et heure). */
export function groupByDate(items: Reservation[]): [string, Reservation[]][] {
  const groups = new Map<string, Reservation[]>();
  for (const item of items) groups.set(item.date, [...(groups.get(item.date) ?? []), item]);
  return [...groups.entries()];
}

/** Couverts attendus par soir : demandes en attente et confirmées (les refusées ne comptent pas). */
export function coversByDate(items: Reservation[]): Map<string, { total: number; confirmed: number }> {
  const result = new Map<string, { total: number; confirmed: number }>();
  for (const r of items) {
    if (r.status === "declined") continue;
    const day = result.get(r.date) ?? { total: 0, confirmed: 0 };
    day.total += r.guests;
    if (r.status === "confirmed") day.confirmed += r.guests;
    result.set(r.date, day);
  }
  return result;
}
