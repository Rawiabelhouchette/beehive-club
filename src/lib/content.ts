import { sampleEvents } from "../content/events";
import { gallery as localGallery } from "../content/gallery";
import { menu as localMenu } from "../content/menu";
import { settings as localSettings } from "../content/settings";
import type { EventItem, GalleryItem, MenuCategory, SiteSettings } from "../content/types";
import { sanityConfig, sanityQuery } from "./sanity";
import { bookingStart } from "./season";
import { todayInTunis } from "./time";

/**
 * Point d'entrée unique du contenu : Sanity si configuré, sinon les fichiers de src/content/.
 * En cas d'erreur Sanity, le site reste en ligne avec le contenu local.
 */

async function fromSanity<T>(label: string, load: () => Promise<T | null>, fallback: () => T): Promise<T> {
  if (!sanityConfig()) return fallback();
  try {
    const result = await load();
    if (result === null || (Array.isArray(result) && result.length === 0)) return fallback();
    return result;
  } catch (error) {
    console.warn(`[contenu] ${label} : Sanity indisponible, contenu local utilisé.`, error);
    return fallback();
  }
}

export function getSettings(): Promise<SiteSettings> {
  return fromSanity(
    "réglages",
    async () => {
      const remote = await sanityQuery<Partial<SiteSettings> | null>(`*[_type == "settings"][0]{
        name, shortName, tagline, address, geo, phone, whatsapp, email, instagram, facebook, priceRange, reopensOn,
        hours[]{day, open, close}, dressCode, entryRules, faq[]{question, answer}
      }`);
      if (!remote) return null;
      // Les champs absents dans Sanity gardent la valeur locale.
      const merged = { ...localSettings };
      for (const [key, value] of Object.entries(remote)) {
        if (value !== null && value !== undefined) (merged as Record<string, unknown>)[key] = value;
      }
      return merged;
    },
    () => localSettings,
  );
}

export function getMenu(): Promise<MenuCategory[]> {
  return fromSanity(
    "carte",
    () =>
      sanityQuery<MenuCategory[]>(`*[_type == "menuCategory"] | order(order asc){
        "id": slug.current, title, note,
        "items": *[_type == "menuItem" && references(^._id)] | order(order asc){
          name, description, "price": coalesce(price, null), "tags": coalesce(tags, [])
        }
      }`),
    () => localMenu,
  );
}

export async function getUpcomingEvents(limit = 8, today: string = todayInTunis()): Promise<EventItem[]> {
  // Fermé pour la saison : le programme d'exemple commence à la réouverture.
  const { reopensOn } = await getSettings();
  const start = bookingStart(reopensOn, today);
  return fromSanity(
    "soirées",
    () =>
      sanityQuery<EventItem[]>(
        `*[_type == "event" && date >= $today] | order(date asc, startTime asc)[0...$limit]{
          "id": _id, date, startTime, title, lineup, description, genre, ticketUrl
        }`,
        { today, limit },
      ),
    () => sampleEvents(start, limit),
  );
}

export function getGallery(): Promise<GalleryItem[]> {
  return fromSanity(
    "galerie",
    () =>
      sanityQuery<GalleryItem[]>(`*[_type == "galleryImage"] | order(order asc){
        "id": _id, hour, caption, alt, "src": image.asset->url
      }`),
    () => localGallery,
  );
}

/** Les plats mis en avant sur la page d'accueil. */
/** Deux rubriques mises en avant sur l'accueil : les tapas et les sushi (sinon les deux premières). */
export function highlights(menu: MenuCategory[], ids: string[] = ["tapas", "pates"], count = 3) {
  return ids
    .map((id) => menu.find((c) => c.id === id))
    .filter((category): category is MenuCategory => Boolean(category))
    .map((category) => ({ category, items: category.items.slice(0, count) }))
    .filter((group) => group.items.length > 0);
}
