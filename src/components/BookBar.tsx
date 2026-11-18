"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { whatsappLink } from "@/lib/site";
import { WhatsappIcon } from "./icons";
import { href } from "./paths";

interface Props {
  locale: Locale;
  label: string;
  whatsapp: string;
  whatsappLabel: string;
}

/**
 * Barre fixe en bas de l'écran sur mobile : réserver ou écrire sur WhatsApp.
 * Sur l'accueil, elle apparaît une fois le hero (et son bouton « Réserver ») dépassé.
 */
export function BookBar({ locale, label, whatsapp, whatsappLabel }: Props) {
  const pathname = usePathname() || "";
  const hidden = pathname.includes("/reservation") || pathname.includes("/admin");
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const visible = !hidden && (!isHome || pastHero);

  useEffect(() => {
    document.body.classList.toggle("has-book-bar", !hidden);
    return () => document.body.classList.remove("has-book-bar");
  }, [hidden]);

  if (hidden) return null;
  return (
    <div className={`book-bar${visible ? "" : " book-bar--hidden"}`} aria-hidden={visible ? undefined : true}>
      <Link href={href(locale, "book")} className="btn btn--primary" tabIndex={visible ? undefined : -1}>
        {label}
      </Link>
      {whatsapp ? (
        <a
          className="icon-btn"
          href={whatsappLink(whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={whatsappLabel}
          tabIndex={visible ? undefined : -1}
        >
          <WhatsappIcon />
        </a>
      ) : null}
    </div>
  );
}
