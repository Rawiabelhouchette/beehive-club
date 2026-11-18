import type { EventItem } from "./types";

/**
 * Soirées de Beehive Club, reprises de ses affiches Instagram (semaine du 16 novembre 2026).
 * Un spectacle chaque soir, avec DJ Alvez aux platines.
 * Le programme est saisi semaine par semaine (ici, ou dans Sanity en production).
 * ⚠️ Les affiches ne donnent pas d'heure : « dès 20 h 30 » correspond à l'ouverture, à confirmer.
 */
const posted: EventItem[] = [
  {
    id: "2026-11-17-firas-zayoud",
    date: "2026-11-17",
    startTime: "20:30",
    title: { fr: "Firas Zayoud", en: "Firas Zayoud" },
    lineup: { fr: "Live performance, DJ Alvez", en: "Live performance, DJ Alvez" },
    description: {
      fr: "« هشك بشك », le show de Beehive, avec Firas Zayoud en live et DJ Alvez aux platines.",
      en: "“هشك بشك”, Beehive's own show, with Firas Zayoud live and DJ Alvez on the decks.",
    },
    genre: "Live",
  },
  {
    id: "2026-11-18-zied-saiid",
    date: "2026-11-18",
    startTime: "20:30",
    title: { fr: "Zied Saiid", en: "Zied Saiid" },
    lineup: { fr: "Live performance, DJ Alvez", en: "Live performance, DJ Alvez" },
    description: {
      fr: "Soirée « فوازير » avec Zied Saiid en live, puis DJ Alvez jusqu'à la fermeture.",
      en: "A “فوازير” night with Zied Saiid live, then DJ Alvez until closing.",
    },
    genre: "Live",
  },
  {
    id: "2026-11-19-vip-1001-nuits",
    date: "2026-11-19",
    startTime: "20:30",
    title: { fr: "VIP 1001 Nuits", en: "VIP 1001 Nights" },
    lineup: { fr: "DJ Alvez", en: "DJ Alvez" },
    description: {
      fr: "La soirée VIP « ألف ليلة وليلة », avec DJ Alvez aux platines.",
      en: "The VIP “ألف ليلة وليلة” night, with DJ Alvez on the decks.",
    },
    genre: "VIP",
  },
  {
    id: "2026-11-20-wathik-fekih",
    date: "2026-11-20",
    startTime: "20:30",
    title: { fr: "Wathik Fekih", en: "Wathik Fekih" },
    lineup: { fr: "Live band, DJ Alvez", en: "Live band, DJ Alvez" },
    description: {
      fr: "Soirée « فوازير » avec Wathik Fekih et son live band, puis DJ Alvez.",
      en: "A “فوازير” night with Wathik Fekih and his live band, then DJ Alvez.",
    },
    genre: "Live band",
  },
  {
    id: "2026-11-21-alianza",
    date: "2026-11-21",
    startTime: "20:30",
    title: { fr: "Alianza", en: "Alianza" },
    lineup: { fr: "Live, DJ Alvez", en: "Live, DJ Alvez" },
    description: {
      fr: "Le groupe Alianza sur la scène de Beehive, puis DJ Alvez jusqu'à la fermeture.",
      en: "The Alianza band on Beehive's stage, then DJ Alvez until closing.",
    },
    genre: "Live",
  },
];

/** La soirée annoncée pour une date, ou null s'il n'y en a pas. */
export function eventOn(date: string): EventItem | null {
  return posted.find((e) => e.date === date) ?? null;
}

/** Les prochaines soirées annoncées, à partir d'aujourd'hui (jamais de soirée passée). */
export function sampleEvents(today: string, count = 7): EventItem[] {
  return posted
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, count);
}

/** Artistes déjà passés sur la scène de Beehive (stories à la une du compte Instagram). */
export const crews = ["Saber Rebai", "Amina Fakhet", "A.L.A", "Mel7em"];
