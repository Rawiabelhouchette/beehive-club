import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { todayInTunis } from "@/lib/time";
import { ReservationView } from "@/views/PageViews";

type Params = Promise<{ locale: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Rendue à chaque visite : date du jour à jour et préremplissage ?date=AAAA-MM-JJ.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDictionary(locale).reservation;
  return pageMetadata(locale, "/reservation", d.title, d.lead);
}

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  // Lien « Réserver pour ce soir-là » depuis la page Soirées : ?date=AAAA-MM-JJ
  const initialDate =
    typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : undefined;

  return (
    <ReservationView
      locale={locale}
      dict={getDictionary(locale)}
      settings={await getSettings()}
      today={todayInTunis()}
      initialDate={initialDate}
    />
  );
}
