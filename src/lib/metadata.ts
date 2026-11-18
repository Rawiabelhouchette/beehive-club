import type { Metadata } from "next";
import type { Locale } from "../i18n/config";

/** Image d'aperçu affichée quand le lien est partagé (WhatsApp, Facebook, Instagram, X…). */
export function shareImage(locale: Locale, alt: string) {
  return { url: `/og/beehive-${locale}.jpg`, width: 1200, height: 630, alt };
}

/** Bloc Open Graph complet : Next remplace celui du layout dès qu'une page définit le sien. */
export function openGraph(locale: Locale, title: string, description: string, path: string): NonNullable<Metadata["openGraph"]> {
  return {
    type: "website",
    siteName: "Beehive Club",
    locale: locale === "fr" ? "fr_TN" : "en_GB",
    title,
    description,
    url: `/${locale}${path}`,
    images: [shareImage(locale, title)],
  };
}

export function twitterCard(locale: Locale, title: string, description: string): NonNullable<Metadata["twitter"]> {
  return { card: "summary_large_image", title, description, images: [shareImage(locale, title)] };
}

/** Métadonnées d'une page : titre, canonique, versions FR/EN et aperçu de partage. */
export function pageMetadata(locale: Locale, path: string, title: string, description?: string): Metadata {
  const desc = description ?? "";
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { fr: `/fr${path}`, en: `/en${path}` },
    },
    openGraph: openGraph(locale, `${title} | Beehive Club`, desc, path),
    twitter: twitterCard(locale, `${title} | Beehive Club`, desc),
  };
}
