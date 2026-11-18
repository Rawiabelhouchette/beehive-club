import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { todayInTunis } from "@/lib/time";
import { PrivateEventView } from "@/views/PageViews";

type Params = Promise<{ locale: string }>;

// Rendue à chaque visite : le calendrier part toujours de la date du jour.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale).privateEvents;
  return pageMetadata(locale, "/privatisation", d.title, d.lead);
}

export default async function PrivateEventPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <PrivateEventView
      locale={locale}
      dict={getDictionary(locale)}
      settings={await getSettings()}
      today={todayInTunis()}
    />
  );
}
