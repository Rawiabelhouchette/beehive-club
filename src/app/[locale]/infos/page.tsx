import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSettings, getUpcomingEvents } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { nowInTunis } from "@/lib/time";
import { InfoView } from "@/views/PageViews";

// Pages FR et EN générées au build ; toute autre langue renvoie une 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale).info;
  return pageMetadata(locale, "/infos", d.title, d.lead);
}

export default async function InfoPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [settings, events] = await Promise.all([getSettings(), getUpcomingEvents(7)]);
  return (
    <InfoView
      locale={locale}
      dict={getDictionary(locale)}
      settings={settings}
      events={events}
      today={nowInTunis().weekday}
    />
  );
}
