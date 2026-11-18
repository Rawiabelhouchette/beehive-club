import { getDictionary } from "../i18n/dictionaries";
import type { Reservation } from "./reservations";

/**
 * Export CSV des réservations, prêt à ouvrir dans Excel en français :
 * séparateur « ; », fins de ligne Windows, BOM UTF-8 pour les accents.
 */
export function reservationsToCsv(reservations: Reservation[]): string {
  const fr = getDictionary("fr");
  const header = [
    "Date",
    "Heure",
    "Nom",
    "Personnes",
    "Téléphone",
    "E-mail",
    "Statut",
    "Type",
    "Occasion / événement",
    "Formule",
    "Entreprise",
    "Message",
    "Langue",
    "Reçue le",
  ];

  const rows = reservations.map((r) => [
    r.date,
    r.time,
    r.name,
    String(r.guests),
    // « +216 … » serait lu par Excel comme une formule : « 00216 … » est équivalent et reste du texte.
    r.phone.replace(/^\s*\+/, "00"),
    r.email ?? "",
    fr.admin.status[r.status],
    r.kind === "event" ? "Privatisation" : "Table",
    r.event ? fr.privateEvents.eventTypes[r.event.eventType] : r.occasion ? fr.reservation.occasions[r.occasion] : "",
    r.event ? fr.privateEvents.spaces[r.event.space] : "",
    r.event?.company ?? "",
    r.message ?? "",
    r.locale.toUpperCase(),
    new Date(r.createdAt).toLocaleString("fr-FR", { timeZone: "Africa/Tunis" }),
  ]);

  return "﻿" + [header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}

function cell(value: string): string {
  // Empêche Excel d'interpréter une saisie client comme une formule (=, +, -, @).
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
