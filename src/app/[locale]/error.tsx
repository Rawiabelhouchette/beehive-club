"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { PageIntro } from "@/components/PageIntro";
import { href } from "@/components/paths";

const texts = {
  fr: {
    title: "Cette page n'a pas pu s'afficher",
    lead: "Un problème est survenu de notre côté. Réessayez dans un instant ; si cela continue, appelez-nous ou écrivez-nous sur WhatsApp.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
  },
  en: {
    title: "This page couldn't load",
    lead: "Something went wrong on our side. Try again in a moment; if it keeps happening, call us or message us on WhatsApp.",
    retry: "Try again",
    home: "Back to home",
  },
};

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname() || "";
  const locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = texts[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageIntro title={t.title} lead={t.lead} />
      <section className="section section--after-intro">
        <div className="container success__actions">
          <button type="button" className="btn btn--primary" onClick={() => reset()}>
            {t.retry}
          </button>
          <Link className="btn btn--ghost" href={href(locale, "home")}>
            {t.home}
          </Link>
        </div>
      </section>
    </>
  );
}
