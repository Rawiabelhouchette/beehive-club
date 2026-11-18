import { tr, type SiteSettings } from "@/content/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { weekOrder } from "@/lib/hours";
import { telLink, whatsappLink } from "@/lib/site";
import { formatTime } from "@/lib/time";
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsappIcon } from "./icons";

export function RulesList({ rules, locale }: { rules: SiteSettings["entryRules"]; locale: Locale }) {
  return (
    <ul className="rules">
      {rules.map((rule) => (
        <li key={rule.fr} className="rules__item">
          <span>{tr(rule, locale)}</span>
        </li>
      ))}
    </ul>
  );
}

interface HoursProps {
  hours: SiteSettings["hours"];
  locale: Locale;
  days: string[];
  closedLabel: string;
  todayLabel?: string;
  /** Jour courant à Tunis (0 = dimanche), pour le mettre en avant. */
  today?: number;
}

export function HoursList({ hours, locale, days, closedLabel, todayLabel, today }: HoursProps) {
  return (
    <dl className="hours">
      {weekOrder(hours).map((h) => (
        <div key={h.day} className={`hours__row${h.day === today ? " hours__row--today" : ""}`}>
          <dt>
            {days[h.day]}
            {h.day === today && todayLabel ? <span className="hours__today">({todayLabel})</span> : null}
          </dt>
          <dd>
            {h.open && h.close ? `${formatTime(h.open, locale)} – ${formatTime(h.close, locale)}` : closedLabel}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface ContactProps {
  settings: SiteSettings;
  locale: Locale;
  dict: Dictionary["info"];
}

export function ContactLinks({ settings, locale, dict }: ContactProps) {
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${settings.geo.lat},${settings.geo.lng}`;
  return (
    <ul className="contact-list">
      <li>
        <a href={directions} target="_blank" rel="noopener noreferrer">
          <PinIcon />
          {tr(settings.address, locale)}
        </a>
      </li>
      {settings.phone ? (
        <li>
          <a href={telLink(settings.phone)}>
            <PhoneIcon />
            {settings.phone}
          </a>
        </li>
      ) : null}
      {settings.whatsapp ? (
        <li>
          <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
            <WhatsappIcon />
            {dict.whatsapp}
          </a>
        </li>
      ) : null}
      {settings.instagram ? (
        <li>
          <a href={settings.instagram} target="_blank" rel="noopener noreferrer">
            <InstagramIcon />
            {dict.instagram}
          </a>
        </li>
      ) : null}
      {settings.facebook ? (
        <li>
          <a href={settings.facebook} target="_blank" rel="noopener noreferrer">
            <FacebookIcon />
            {dict.facebook}
          </a>
        </li>
      ) : null}
      {settings.email ? (
        <li>
          <a href={`mailto:${settings.email}`}>
            <MailIcon />
            {settings.email}
          </a>
        </li>
      ) : null}
    </ul>
  );
}

export function MapEmbed({ geo, title }: { geo: SiteSettings["geo"]; title: string }) {
  const src = `https://maps.google.com/maps?q=${geo.lat},${geo.lng}&z=15&output=embed`;
  return (
    <div className="map">
      <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
    </div>
  );
}

/** Liens vers l'application de réservation du lieu (Joy App), sur l'App Store et Google Play. */
export function AppLinks({ app }: { app: NonNullable<SiteSettings["bookingApp"]> }) {
  return (
    <p className="app-links">
      {app.web ? (
        <a className="btn btn--ghost btn--small" href={app.web} target="_blank" rel="noopener noreferrer">
          {app.name}
        </a>
      ) : null}
      {app.ios ? (
        <a className="btn btn--ghost btn--small" href={app.ios} target="_blank" rel="noopener noreferrer">
          App Store
        </a>
      ) : null}
      {app.android ? (
        <a className="btn btn--ghost btn--small" href={app.android} target="_blank" rel="noopener noreferrer">
          Google Play
        </a>
      ) : null}
    </p>
  );
}
