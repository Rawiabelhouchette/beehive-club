import Link from "next/link";
import { EventRows } from "@/components/EventRows";
import { GalleryStrip } from "@/components/GalleryStrip";
import { HiveHero } from "@/components/HiveHero";
import { WhatsappIcon } from "@/components/icons";
import { href } from "@/components/paths";
import { AppLinks, ContactLinks, HoursList, MapEmbed, RulesList } from "@/components/VenueInfo";
import { crews } from "@/content/events";
import { photos } from "@/content/photos";
import { tr, type EventItem, type GalleryItem, type MenuCategory, type SiteSettings } from "@/content/types";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { eventWeekdays, withEventNights } from "@/lib/hours";
import { whatsappLink } from "@/lib/site";
import { isClosedForSeason } from "@/lib/season";
import { formatMonthYear } from "@/lib/time";

export interface HomeViewProps {
  locale: Locale;
  dict: Dictionary;
  settings: SiteSettings;
  events: EventItem[];
  menu: MenuCategory[];
  gallery: GalleryItem[];
  demo: boolean;
  today: number;
  /** Date du jour à Tunis (AAAA-MM-JJ), pour savoir si le lieu est fermé pour la saison. */
  todayDate: string;
}

export function HomeView({ locale, dict, settings, events, gallery, today, todayDate }: HomeViewProps) {
  const h = dict.home;
  const closed = isClosedForSeason(settings.reopensOn, todayDate);
  // Cette semaine, les soirs de spectacle s'ajoutent aux horaires habituels.
  const weekHours = withEventNights(settings.hours, eventWeekdays(events, todayDate));

  return (
    <>
      <HiveHero
        locale={locale}
        dict={dict.hero}
        days={dict.days}
        daysShort={dict.daysShort}
        hours={settings.hours}
        reopensOn={settings.reopensOn}
        instagram={settings.instagram}
        events={events}
        todayDate={todayDate}
      />

      {/* Un artiste en live, chaque soir */}
      <section className="section" aria-labelledby="stage-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="stage-title">{h.stageTitle}</h2>
              <p className="section-head__lead">{h.stageLead}</p>
            </div>
            <Link className="btn btn--ghost" href={href(locale, "events")}>
              {h.eventsLink}
            </Link>
          </div>
          {events.length > 0 ? (
            <EventRows events={events.slice(0, 5)} locale={locale} dict={dict.eventsPage} />
          ) : (
            <p className="muted">{h.eventsEmpty}</p>
          )}
          <div className="artists">
            <h3 className="artists__title">{h.artistsTitle}</h3>
            <ul className="artists__list">
              {crews.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Dîner avant le spectacle */}
      <section className="section section--peel" aria-labelledby="dinner-title">
        <div className="container dinner">
          <div className="dinner__text">
            <h2 id="dinner-title">{h.dinnerTitle}</h2>
            <p className="section-head__lead">{h.dinnerLead}</p>
            <p style={{ marginTop: "1.75rem" }}>
              <Link className="btn btn--ghost" href={href(locale, "menu")}>
                {h.menuLink}
              </Link>
            </p>
          </div>
          <div className="dinner__photos">
            {[photos.risotto, photos.carpaccio].map((photo) => (
              <figure key={photo.src} className="hex-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={tr(photo.alt, locale)}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Dans la ruche */}
      <section className="section" aria-labelledby="gallery-title">
        <div className="container">
          <div className="section-head">
            <h2 id="gallery-title">{h.galleryTitle}</h2>
          </div>
          <GalleryStrip items={gallery} locale={locale} placeholder={h.galleryPlaceholder} />
          <div className="open-air">
            <h3 className="open-air__title">{h.openAirTitle}</h3>
            <p>{h.openAirText}</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="rules-title">
        <div className="container split">
          <div>
            <h2 id="rules-title">{h.rulesTitle}</h2>
            <div className="info-block" style={{ marginTop: "1.75rem" }}>
              <RulesList rules={settings.entryRules} locale={locale} />
            </div>
            <p style={{ marginTop: "1.75rem" }}>
              <Link className="text-link" href={href(locale, "info")}>
                {h.rulesLink}
              </Link>
            </p>
          </div>
          <div className="cta-band wall">
            <h2>{closed ? h.ctaTitleSeason : h.ctaTitle}</h2>
            <p className="cta-band__text">
              {closed && settings.reopensOn
                ? fill(h.ctaTextSeason, { date: formatMonthYear(settings.reopensOn, locale) })
                : h.ctaText}
            </p>
            <div className="cta-band__actions">
              <Link className="btn btn--primary" href={href(locale, "book")}>
                {dict.hero.book}
              </Link>
              {settings.whatsapp ? (
                <a className="btn btn--ghost" href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                  <WhatsappIcon />
                  {h.ctaWhatsapp}
                </a>
              ) : null}
            </div>
            {settings.bookingApp ? (
              <div className="cta-band__app">
                <p>
                  <strong>{fill(h.appTitle, { app: settings.bookingApp.name })}</strong> {h.appText}
                </p>
                <AppLinks app={settings.bookingApp} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section section--raised" aria-labelledby="find-title">
        <div className="container">
          <div className="section-head">
            <h2 id="find-title">{h.findTitle}</h2>
          </div>
          <div className="find">
            <MapEmbed geo={settings.geo} title={dict.info.mapTitle} />
            <div>
              <div className="info-block">
                <h3>{dict.info.hoursTitle}</h3>
                <HoursList
                  hours={weekHours}
                  locale={locale}
                  days={dict.days}
                  closedLabel={dict.info.closed}
                  todayLabel={dict.info.today}
                  today={closed ? undefined : today}
                />
                <p className="note">{dict.info.specialNights}</p>
              </div>
              <div className="info-block">
                <h3>{dict.info.contactTitle}</h3>
                <ContactLinks settings={settings} locale={locale} dict={dict.info} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
