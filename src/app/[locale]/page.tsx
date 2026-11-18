import { notFound } from "next/navigation";
import { VenueJsonLd } from "@/components/JsonLd";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getGallery, getMenu, getSettings, getUpcomingEvents } from "@/lib/content";
import { isDemoMode, siteUrl } from "@/lib/site";
import { nowInTunis, todayInTunis } from "@/lib/time";
import { HomeView } from "@/views/HomeView";

// Pages FR et EN générées au build ; toute autre langue renvoie une 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Régénérée toutes les heures : les prochaines soirées restent à jour.
export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [settings, events, menu, gallery] = await Promise.all([
    getSettings(),
    getUpcomingEvents(7),
    getMenu(),
    getGallery(),
  ]);

  return (
    <>
      <VenueJsonLd settings={settings} locale={locale} url={siteUrl()} />
      <HomeView
        locale={locale}
        dict={getDictionary(locale)}
        settings={settings}
        events={events}
        menu={menu}
        gallery={gallery}
        demo={isDemoMode()}
        today={nowInTunis().weekday}
        todayDate={todayInTunis()}
      />
    </>
  );
}
