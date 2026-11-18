"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { BrandMark, CloseIcon, MenuIcon } from "./icons";
import { href, navPages, switchLocalePath, type PageKey } from "./paths";

interface Props {
  locale: Locale;
  nav: Dictionary["nav"];
  place: string;
}

const labels: Partial<Record<PageKey, keyof Dictionary["nav"]>> = {
  home: "home",
  menu: "menu",
  events: "events",
  private: "private",
  info: "info",
};

const labelFor = (nav: Dictionary["nav"], page: PageKey) => nav[labels[page] ?? "home"];

export function SiteHeader({ locale, nav, place }: Props) {
  const pathname = usePathname() || `/${locale}`;
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const otherLocale: Locale = locale === "fr" ? "en" : "fr";

  // Sur l'accueil, l'en-tête est transparent au-dessus du ciel, puis devient rouge quand on descend.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const current = (page: PageKey) => (pathname.startsWith(href(locale, page)) ? "page" : undefined);

  return (
    <header className={`site-header${isHome && !scrolled ? " site-header--overlay" : ""}`}>
      <div className="container site-header__inner">
        <Link href={href(locale, "home")} className="brand" aria-label={`Beehive Club, ${nav.home}`}>
          <BrandMark className="brand__mark" />
          <span aria-hidden="true">
            <span className="brand__name">Beehive</span>
            <span className="brand__place">{place}</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label={locale === "fr" ? "Navigation principale" : "Main navigation"}>
          <ul className="site-nav__list">
            {navPages.map((page) => (
              <li key={page}>
                <Link href={href(locale, page)} className="site-nav__link" aria-current={current(page)}>
                  {labelFor(nav, page)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          <Link
            href={switchLocalePath(pathname, otherLocale)}
            className="lang-switch"
            hrefLang={otherLocale}
            lang={otherLocale}
            aria-label={nav.switchLang}
          >
            {nav.switchLangShort}
          </Link>
          <Link href={href(locale, "book")} className="btn btn--primary btn--small">
            {nav.book}
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={nav.openMenu}
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Le menu mobile est rendu à la racine de la page pour passer au-dessus de tout. */}
      {open ? createPortal(
        <div className="mobile-nav" id="mobile-nav" role="dialog" aria-modal="true" aria-label={nav.openMenu}>
          <div className="mobile-nav__top">
            <Link href={href(locale, "home")} className="brand" aria-label={`Beehive Club, ${nav.home}`} onClick={() => setOpen(false)}>
              <BrandMark className="brand__mark" />
              <span className="brand__name" aria-hidden="true">Beehive</span>
            </Link>
            <button
              type="button"
              className="menu-toggle"
              aria-label={nav.closeMenu}
              onClick={() => setOpen(false)}
              autoFocus
            >
              <CloseIcon />
            </button>
          </div>
          <ul className="mobile-nav__list">
            {(["home", ...navPages] as PageKey[]).map((page) => (
              <li key={page}>
                <Link
                  href={href(locale, page)}
                  className="mobile-nav__link"
                  aria-current={page === "home" ? (isHome ? "page" : undefined) : current(page)}
                  onClick={() => setOpen(false)}
                >
                  {labelFor(nav, page)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mobile-nav__footer">
            <Link href={href(locale, "book")} className="btn btn--primary" onClick={() => setOpen(false)}>
              {nav.book}
            </Link>
            <Link
              href={switchLocalePath(pathname, otherLocale)}
              className="btn btn--ghost"
              hrefLang={otherLocale}
              lang={otherLocale}
            >
              {nav.switchLang}
            </Link>
          </div>
        </div>,
        document.body,
      ) : null}
    </header>
  );
}
