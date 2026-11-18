import { validateEventRequest, validateReservation } from "./reservation-rules";
import type { Reservation, ReservationStore } from "./reservations";

export interface HandlerResult {
  status: number;
  body: Record<string, unknown>;
  /** La demande enregistrée (pour envoyer l'e-mail à l'équipe). */
  created?: Reservation;
}

interface Deps {
  store: ReservationStore;
  allow: (key: string) => boolean;
  now?: Date;
  /** Date de réouverture si le lieu est fermé pour la saison. */
  reopensOn?: string | null;
}

/** Adresse IP du visiteur (derrière Netlify, Vercel ou un proxy). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}

/**
 * Traitement commun des demandes de table et de privatisation :
 * champ piège anti-robot, limite de fréquence, validation, enregistrement.
 */
export async function handleBooking(
  body: unknown,
  ip: string,
  kind: "table" | "event",
  { store, allow, now = new Date(), reopensOn = null }: Deps,
): Promise<HandlerResult> {
  // Champ piège rempli : c'est un robot. On répond « OK » sans rien enregistrer.
  const trap = (body as { website?: unknown } | null)?.website;
  if (typeof trap === "string" && trap.trim() !== "") {
    return { status: 201, body: { ok: true } };
  }

  if (!allow(ip)) return { status: 429, body: { ok: false, error: "rate-limit" } };

  const result =
    kind === "event" ? validateEventRequest(body, now, reopensOn) : validateReservation(body, now, reopensOn);
  if (!result.ok) return { status: 400, body: { ok: false, errors: result.errors } };

  try {
    const created = await store.create(result.data);
    return { status: 201, body: { ok: true, id: created.id }, created };
  } catch (error) {
    console.error("[réservation] enregistrement impossible :", error);
    return { status: 500, body: { ok: false, error: "server" } };
  }
}
