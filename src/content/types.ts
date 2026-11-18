import type { Locale } from "../i18n/config";

/** Texte disponible en français et en anglais. */
export interface Localized {
  fr: string;
  en: string;
}

export function tr(value: Localized | undefined | null, locale: Locale): string {
  if (!value) return "";
  return value[locale] || value.fr || "";
}

export interface OpeningHours {
  /** 0 = dimanche … 6 = samedi */
  day: number;
  /** « 18:00 » ; null = fermé ce jour-là */
  open: string | null;
  /** « 02:00 » (après minuit = le lendemain) */
  close: string | null;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  tagline: Localized;
  address: Localized;
  geo: { lat: number; lng: number };
  /** Format international lisible, ex. « +216 22 222 222 ». Vide = masqué. */
  phone: string;
  /** Numéro WhatsApp sans « + » ni espaces, ex. « 21622222222 ». Vide = masqué. */
  whatsapp: string;
  email: string;
  /** Lien complet vers le profil Instagram. Vide = masqué. */
  instagram: string;
  /** Lien complet vers la page Facebook. Vide = masqué. */
  facebook: string;
  /** Fourchette de prix affichée à Google, ex. « 30–90 DT ». Vide = non renseignée. */
  priceRange: string;
  /** Fermé pour la saison jusqu'à cette date (AAAA-MM-JJ). null = ouvert. */
  reopensOn: string | null;
  hours: OpeningHours[];
  dressCode: Localized;
  entryRules: Localized[];
  faq: { question: Localized; answer: Localized }[];
  /** Application de réservation déjà utilisée par le lieu (ex. Joy App). Absente = masquée. */
  bookingApp?: { name: string; ios?: string; android?: string; web?: string };
  /** Adresse où les restaurateurs envoient leur candidature pour la food court. Absente = masquée. */
  foodCourtEmail?: string;
}

export type MenuTag = "signature" | "sans-alcool" | "veggie" | "a-partager";

export interface MenuItem {
  name: Localized;
  description: Localized;
  /** Prix en dinars ; null = non affiché */
  price: number | null;
  tags: MenuTag[];
}

export interface MenuCategory {
  id: string;
  title: Localized;
  note?: Localized;
  items: MenuItem[];
}

export interface EventItem {
  id: string;
  /** AAAA-MM-JJ */
  date: string;
  /** « 19:00 » */
  startTime: string;
  title: Localized;
  lineup: Localized;
  description: Localized;
  genre: string;
  /** Billetterie en ligne (Teskerti…) : le bouton « Billets » remplace « Réserver une table ». */
  ticketUrl?: string;
}

export interface GalleryItem {
  id: string;
  /** Heure illustrée, ex. « 18:00 » : sert aussi à colorer la tuile tant qu'il n'y a pas de photo. */
  hour: string;
  caption: Localized;
  /** URL de la photo (Sanity ou /public/images/…). Vide = tuile dégradée. */
  src?: string;
  alt?: Localized;
  /** Cadrage de la photo dans la tuile (CSS object-position), ex. « center 70% ». */
  position?: string;
}
