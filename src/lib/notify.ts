import { getDictionary } from "../i18n/dictionaries";
import type { Reservation } from "./reservations";

/** Contenu de l'e-mail envoyé à l'équipe (en français) pour une nouvelle demande. */
export function notificationEmail(reservation: Reservation, siteUrl: string): { subject: string; text: string } {
  const fr = getDictionary("fr");
  const isEvent = reservation.kind === "event" && reservation.event;
  const adminUrl = `${siteUrl.replace(/\/$/, "")}/fr/admin${isEvent ? "?status=events" : ""}`;

  const lines = [
    isEvent ? "Nouvelle demande de privatisation" : "Nouvelle demande de réservation",
    "",
    `Nom : ${reservation.name}`,
    `Date : ${reservation.date} à ${reservation.time}`,
    `${isEvent ? "Invités" : "Personnes"} : ${reservation.guests}`,
    `Téléphone : ${reservation.phone}`,
    reservation.email ? `E-mail : ${reservation.email}` : null,
    isEvent ? `Événement : ${fr.privateEvents.eventTypes[reservation.event!.eventType]}` : null,
    isEvent ? `Formule : ${fr.privateEvents.spaces[reservation.event!.space]}` : null,
    isEvent && reservation.event!.company ? `Entreprise : ${reservation.event!.company}` : null,
    reservation.occasion ? `Occasion : ${fr.reservation.occasions[reservation.occasion]}` : null,
    reservation.message ? `Message : ${reservation.message}` : null,
    "",
    `${isEvent ? "Voir la demande" : "Confirmer ou refuser"} : ${adminUrl}`,
  ].filter((line): line is string => line !== null);

  const subject = isEvent
    ? `Privatisation : ${reservation.guests} invités le ${reservation.date}`
    : `Réservation : ${reservation.guests} pers. le ${reservation.date} à ${reservation.time}`;

  return { subject, text: lines.join("\n") };
}

/**
 * Prévient l'équipe par e-mail (Resend) à chaque nouvelle demande.
 * Sans RESEND_API_KEY ni NOTIFY_EMAIL, ne fait rien. N'empêche jamais la réservation.
 */
export async function notifyNewReservation(
  reservation: Reservation,
  siteUrl: string,
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  const { subject, text } = notificationEmail(reservation, siteUrl);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || "Beehive Club <onboarding@resend.dev>",
        to: env.NOTIFY_EMAIL.split(",").map((e) => e.trim()),
        subject,
        text,
      }),
    });
    if (!response.ok) console.error("[réservation] e-mail non envoyé :", response.status, await response.text());
  } catch (error) {
    console.error("[réservation] e-mail non envoyé :", error);
  }
}
