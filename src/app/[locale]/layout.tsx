import "@fontsource-variable/montserrat";
import "../globals.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BookBar } from "@/components/BookBar";
import { DemoBanner } from "@/components/DemoBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSettings } from "@/lib/content";
import { openGraph, twitterCard } from "@/lib/metadata";
import { demoAuthor, isDemoMode, siteUrl } from "@/lib/site";

type Params = Promise<{ locale: string }>;

export const viewport: Viewport = {
  themeColor: "#0d0a06",
  colorScheme: "dark",
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: dict.meta.title, template: "%s | Beehive Club" },
    description: dict.meta.description,
    applicationName: "Beehive Club",
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: "/fr", en: "/en" },
    },
    openGraph: openGraph(locale, dict.meta.title, dict.meta.description, ""),
    twitter: twitterCard(locale, dict.meta.title, dict.meta.description),
    // En mode démo, le site n'est pas indexé par les moteurs de recherche.
    robots: isDemoMode() ? { index: false, follow: false } : undefined,
  };
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const settings = await getSettings();

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#content">
          {dict.nav.skip}
        </a>
        {isDemoMode() ? <DemoBanner dict={dict.demo} author={demoAuthor()} /> : null}
        <SiteHeader locale={locale} nav={dict.nav} place="Club · Gammarth" />
        <main id="content">{children}</main>
        <SiteFooter locale={locale} dict={dict} settings={settings} />
        <BookBar
          locale={locale}
          label={dict.hero.book}
          whatsapp={settings.whatsapp}
          whatsappLabel={dict.info.whatsapp}
        />
      </body>
    </html>
  );
}
