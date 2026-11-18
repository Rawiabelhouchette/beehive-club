import { tr, type SiteSettings } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { weekOrder } from "@/lib/hours";

const schemaDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Données structurées schema.org pour Google (fiche établissement, horaires, réservation). */
export function VenueJsonLd({ settings, locale, url }: { settings: SiteSettings; locale: Locale; url: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NightClub",
    name: settings.name,
    description: tr(settings.tagline, locale),
    url: `${url}/${locale}`,
    telephone: settings.phone || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Hôtel Acquaviva",
      addressLocality: "Gammarth",
      addressRegion: "Tunis",
      addressCountry: "TN",
    },
    geo: { "@type": "GeoCoordinates", latitude: settings.geo.lat, longitude: settings.geo.lng },
    openingHoursSpecification: weekOrder(settings.hours)
      .filter((h) => h.open && h.close)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${schemaDays[h.day]}`,
        opens: h.open,
        closes: h.close,
      })),
    priceRange: settings.priceRange || undefined,
    acceptsReservations: true,
    hasMenu: `${url}/${locale}/carte`,
    sameAs: [settings.instagram, settings.facebook].filter(Boolean).length ? [settings.instagram, settings.facebook].filter(Boolean) : undefined,
  };
  return (
    <script
      type="application/ld+json"
      // Le contenu est généré par le serveur à partir de données contrôlées.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
