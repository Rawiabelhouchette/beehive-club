import Link from "next/link";
import type { ReactNode } from "react";
import { EventRows } from "@/components/EventRows";
import { PhoneIcon, WhatsappIcon } from "@/components/icons";
import { MenuGroup } from "@/components/MenuGroup";
import { PageIntro } from "@/components/PageIntro";
import { introPhotos, photos } from "@/content/photos";
import { href } from "@/components/paths";
import { PrivateEventForm } from "@/components/PrivateEventForm";
import { ReservationForm } from "@/components/ReservationForm";
import { AppLinks, ContactLinks, HoursList, MapEmbed, RulesList } from "@/components/VenueInfo";
import { tr, type EventItem, type MenuCategory, type SiteSettings } from "@/content/types";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { eventWeekdays, withEventNights } from "@/lib/hours";
import { isClosedForSeason } from "@/lib/season";
import { telLink, whatsappLink } from "@/lib/site";
import { formatMonthYear, todayInTunis } from "@/lib/time";

interface Base {
  locale: Locale;
  dict: Dictionary;
}

/* --- La carte ----------------------------------------------------------------------- */

export function MenuView({ locale, dict, menu, demo }: Base & { menu: MenuCategory[]; demo: boolean }) {
  const d = dict.menuPage;
  return (
    <>
      <PageIntro title={d.title} lead={d.lead} photo={introPhotos.menu} locale={locale} />
      <section className="section section--peel section--menu">
        <div className="container">
          {menu.length === 0 ? (
            // Carte pas encore reçue : le restaurant en photos, et la place réservée à la carte.
            <div className="menu-soon">
              <div className="menu-soon__text">
                <h2>{d.soonTitle}</h2>
                <p>{d.soonText}</p>
              </div>
              <div className="menu-soon__photos">
                {[photos.risotto, photos.carpaccio].map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.src}
                    src={photo.src}
                    alt={tr(photo.alt, locale)}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            </div>
          ) : null}
          <nav className="menu-jump-bar" aria-label={d.jump} hidden={menu.length === 0}>
            <ul className="menu-jump">
              {menu.map((category) => (
                <li key={category.id}>
                  <a href={`#${category.id}`}>{tr(category.title, locale)}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="menu-sections">
            {menu.map((category) => (
              <MenuGroup key={category.id} category={category} locale={locale} dict={d} headingLevel="h2" />
            ))}
          </div>
          {demo ? <p className="note">{d.demoNote}</p> : null}
        </div>
      </section>
    </>
  );
}

/* --- Soirées --------------------------------------------------------------------------- */

export function EventsView({ locale, dict, events, demo }: Base & { events: EventItem[]; demo: boolean }) {
  const d = dict.eventsPage;
  return (
    <>
      <PageIntro title={d.title} lead={d.lead} photo={introPhotos.events} locale={locale} />
      <section className="section section--after-intro">
        <div className="container">
          <EventRows events={events} locale={locale} dict={d} />
          {demo ? <p className="note">{d.demoNote}</p> : null}
        </div>
      </section>
    </>
  );
}

/* --- Infos pratiques ------------------------------------------------------------------------ */

export function InfoView({ locale, dict, settings, today, events = [] }: Base & { settings: SiteSettings; today: number; events?: EventItem[] }) {
  const d = dict.info;
  const closed = isClosedForSeason(settings.reopensOn, todayInTunis());
  // Cette semaine, les soirs d'événement s'ajoutent aux horaires habituels.
  const weekHours = withEventNights(settings.hours, eventWeekdays(events, todayInTunis()));
  return (
    <>
      <PageIntro title={d.title} lead={d.lead} photo={introPhotos.info} locale={locale} />
      <section className="section section--after-intro">
        <div className="container split">
          <div>
            <div className="info-block">
              <h2 className="menu-group__title">{d.hoursTitle}</h2>
              {closed && settings.reopensOn ? (
                <p className="season-note">
                  {fill(d.seasonHours, { date: formatMonthYear(settings.reopensOn, locale) })}
                </p>
              ) : null}
              <div style={{ marginTop: "1rem" }}>
                <HoursList
                  hours={weekHours}
                  locale={locale}
                  days={dict.days}
                  closedLabel={d.closed}
                  todayLabel={d.today}
                  today={closed ? undefined : today}
                />
              </div>
              <p className="note">{d.specialNights}</p>
            </div>
            <div className="info-block">
              <h2 className="menu-group__title">{d.rulesTitle}</h2>
              <div style={{ marginTop: "1rem" }}>
                <RulesList rules={settings.entryRules} locale={locale} />
              </div>
            </div>
            <div className="info-block">
              <h2 className="menu-group__title">{d.dressTitle}</h2>
              <p style={{ marginTop: "0.75rem" }}>{tr(settings.dressCode, locale)}</p>
            </div>
          </div>
          <div>
            <div className="info-block">
              <h2 className="menu-group__title">{d.accessTitle}</h2>
              <div style={{ marginTop: "1rem" }}>
                <MapEmbed geo={settings.geo} title={d.mapTitle} />
              </div>
            </div>
            <div className="info-block">
              <h2 className="menu-group__title">{d.contactTitle}</h2>
              <div style={{ marginTop: "1rem" }}>
                <ContactLinks settings={settings} locale={locale} dict={d} />
              </div>
            </div>
            {settings.bookingApp ? (
              <div className="info-block">
                <h2 className="menu-group__title">{fill(d.appTitle, { app: settings.bookingApp.name })}</h2>
                <p style={{ marginTop: "0.75rem" }}>{fill(d.appText, { app: settings.bookingApp.name })}</p>
                <AppLinks app={settings.bookingApp} />
              </div>
            ) : null}
            {settings.foodCourtEmail ? (
              <div className="info-block food-court">
                <h2 className="menu-group__title">{d.foodCourtTitle}</h2>
                <p style={{ marginTop: "0.75rem" }}>{d.foodCourtText}</p>
                <p style={{ marginTop: "0.75rem" }}>
                  <a className="text-link" href={`mailto:${settings.foodCourtEmail}`}>
                    {settings.foodCourtEmail}
                  </a>
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <section className="section section--raised" aria-labelledby="faq-title">
        <div className="container">
          <div className="section-head">
            <h2 id="faq-title">{d.faqTitle}</h2>
          </div>
          <div className="faq">
            {settings.faq.map((item) => (
              <details key={item.question.fr} className="faq__item">
                <summary className="faq__question">{tr(item.question, locale)}</summary>
                <p className="faq__answer">{tr(item.answer, locale)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* --- Réservation -------------------------------------------------------------------------------- */

interface ReservationViewProps extends Base {
  settings: SiteSettings;
  today: string;
  initialDate?: string;
}

export function ReservationView({ locale, dict, settings, today, initialDate }: ReservationViewProps) {
  const d = dict.reservation;
  const closed = isClosedForSeason(settings.reopensOn, today);
  return (
    <>
      <PageIntro title={d.title} lead={d.lead} photo={introPhotos.book} locale={locale} />
      <section className="section section--after-intro">
        <div className="container booking">
          <div className="panel">
            {closed && settings.reopensOn ? (
              <p className="season-note season-note--panel">
                {fill(d.seasonNote, { date: formatMonthYear(settings.reopensOn, locale) })}
              </p>
            ) : null}
            <ReservationForm
              locale={locale}
              dict={d}
              today={today}
              initialDate={initialDate}
              whatsapp={settings.whatsapp}
              reopensOn={settings.reopensOn}
            />
          </div>
          <aside className="aside-stack">
            {settings.bookingApp ? (
              <div className="app-card">
                <p className="app-card__text">{fill(d.appNote, { app: settings.bookingApp.name })}</p>
                <AppLinks app={settings.bookingApp} />
              </div>
            ) : null}
            <div>
              <h2 className="menu-group__title">{d.stepsTitle}</h2>
              <ol className="steps" style={{ marginTop: "1.25rem" }}>
                {d.steps.map((step) => (
                  <li key={step.title} className="steps__item">
                    <div>
                      <p className="steps__title">{step.title}</p>
                      <p className="steps__text">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="muted">{d.groupNote}</p>
              <p style={{ marginTop: "0.5rem" }}>
                <Link className="text-link" href={href(locale, "private")}>
                  {d.groupLink}
                </Link>
              </p>
              <ContactButtons settings={settings} whatsappLabel={dict.info.whatsapp} />
            </div>
            <div>
              <h2 className="menu-group__title">{dict.info.rulesTitle}</h2>
              <div style={{ marginTop: "1rem" }}>
                <RulesList rules={settings.entryRules} locale={locale} />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

/* --- Boutons d'appel et WhatsApp ---------------------------------------------------------------------- */

function ContactButtons({ settings, whatsappLabel }: { settings: SiteSettings; whatsappLabel: string }) {
  if (!settings.phone && !settings.whatsapp) return null;
  return (
    <div className="success__actions" style={{ marginTop: "1rem" }}>
      {settings.phone ? (
        <a className="btn btn--ghost btn--small" href={telLink(settings.phone)}>
          <PhoneIcon />
          {settings.phone}
        </a>
      ) : null}
      {settings.whatsapp ? (
        <a
          className="btn btn--ghost btn--small"
          href={whatsappLink(settings.whatsapp)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsappIcon />
          {whatsappLabel}
        </a>
      ) : null}
    </div>
  );
}

/* --- Privatisation ------------------------------------------------------------------------------------- */

export function PrivateEventView({ locale, dict, settings, today }: Base & { settings: SiteSettings; today: string }) {
  const d = dict.privateEvents;
  const closed = isClosedForSeason(settings.reopensOn, today);
  return (
    <>
      <PageIntro title={d.title} lead={d.lead} photo={introPhotos.private} locale={locale} />
      <section className="section section--after-intro">
        <div className="container booking">
          <div className="panel">
            {closed && settings.reopensOn ? (
              <p className="season-note season-note--panel">
                {fill(d.seasonNote, { date: formatMonthYear(settings.reopensOn, locale) })}
              </p>
            ) : null}
            <PrivateEventForm
              locale={locale}
              dict={d}
              today={today}
              whatsapp={settings.whatsapp}
              reopensOn={settings.reopensOn}
            />
          </div>
          <aside className="aside-stack">
            <div>
              <h2 className="menu-group__title">{d.formatsTitle}</h2>
              <ul className="formats" style={{ marginTop: "1.25rem" }}>
                {d.formats.map((format) => (
                  <li key={format.title} className="formats__item">
                    <p className="formats__title">{format.title}</p>
                    <p className="formats__text">{format.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="menu-group__title">{d.stepsTitle}</h2>
              <ol className="steps" style={{ marginTop: "1.25rem" }}>
                {d.steps.map((step) => (
                  <li key={step.title} className="steps__item">
                    <div>
                      <p className="steps__title">{step.title}</p>
                      <p className="steps__text">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="muted">{d.smallGroup}</p>
              <p style={{ marginTop: "0.5rem" }}>
                <Link className="text-link" href={href(locale, "book")}>
                  {d.smallGroupLink}
                </Link>
              </p>
              <ContactButtons settings={settings} whatsappLabel={dict.info.whatsapp} />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

/* --- Mentions légales ------------------------------------------------------------------------------ */

export function LegalView({ locale, dict, settings }: Base & { settings: SiteSettings }) {
  const d = dict.legal;
  const todo = <span className="placeholder-text">[{d.placeholder}]</span>;
  const fr = locale === "fr";
  const rows: [string, ReactNode][] = [
    [fr ? "Raison sociale" : "Company name", todo],
    [fr ? "Adresse" : "Address", tr(settings.address, locale)],
    [fr ? "Matricule fiscal" : "Tax ID", todo],
    [fr ? "Directeur de la publication" : "Publication director", todo],
    [fr ? "Téléphone" : "Phone", settings.phone || todo],
  ];
  return (
    <>
      <PageIntro title={d.title} />
      <section className="section">
        <div className="container prose">
          <div>
            <h2>{d.editorTitle}</h2>
            <p>{settings.name}</p>
            <p>
              {rows.map(([label, value]) => (
                <span key={label} style={{ display: "block" }}>
                  {label}
                  {fr ? " : " : ": "}
                  {value}
                </span>
              ))}
            </p>
          </div>
          <div>
            <h2>{d.hostTitle}</h2>
            <p>{todo}</p>
          </div>
          <div>
            <h2>{d.dataTitle}</h2>
            <p>{d.dataText}</p>
          </div>
          <div>
            <h2>{d.cookiesTitle}</h2>
            <p>{d.cookiesText}</p>
          </div>
          <p>
            <Link className="text-link" href={href(locale, "home")}>
              {dict.notFound.back}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
