import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/metadata";
import { LegalView } from "@/views/PageViews";

// Pages FR et EN générées au build ; toute autre langue renvoie une 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, "/mentions-legales", getDictionary(locale).legal.title);
}

export default async function LegalPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalView locale={locale} dict={getDictionary(locale)} settings={await getSettings()} />;
}
