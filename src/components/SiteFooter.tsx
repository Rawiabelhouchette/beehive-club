import Link from "next/link";
import { tr, type SiteSettings } from "@/content/types";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { weekOrder } from "@/lib/hours";
import { isClosedForSeason } from "@/lib/season";
import { formatMonthYear, formatTime, todayInTunis } from "@/lib/time";
import { href } from "./paths";
import { ContactLinks } from "./VenueInfo";
import { BrandMark } from "./icons";

interface Props {
  locale: Locale;
  dict: Dictionary;
  settings: SiteSettings;
}

/** Regroupe les jours consécutifs aux mêmes horaires : « Lundi – Samedi 18 h – 2 h ». */
function groupedHours(settings: SiteSettings, locale: Locale, days: string[], closed: string) {
  const rows = weekOrder(settings.hours);
  const groups: { from: number; to: number; label: string }[] = [];
  for (const row of rows) {
    const label = row.open && row.close ? `${formatTime(row.open, locale)} – ${formatTime(row.close, locale)}` : closed;
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.to = row.day;
    else groups.push({ from: row.day, to: row.day, label });
  }
  return groups.map((g) => ({
    days: g.from === g.to ? days[g.from] : `${days[g.from]} – ${days[g.to]}`,
    label: g.label,
  }));
}

export function SiteFooter({ locale, dict, settings }: Props) {
  const year = new Date().getFullYear();
  const closed = isClosedForSeason(settings.reopensOn, todayInTunis());
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div>
            <Link href={href(locale, "home")} className="brand" aria-label={settings.name}>
              <BrandMark className="brand__mark" />
              <span className="brand__name" aria-hidden="true">Beehive</span>
            </Link>
            <p className="site-footer__tagline">{tr(settings.tagline, locale)}</p>
          </div>
          <div>
            <h2 className="site-footer__title">{dict.footer.hours}</h2>
            {closed && settings.reopensOn ? (
              <p className="footer-season">
                {fill(dict.footer.seasonClosed, { date: formatMonthYear(settings.reopensOn, locale) })}
              </p>
            ) : null}
            <ul className="footer-hours">
              {groupedHours(settings, locale, dict.days, dict.info.closed).map((g) => (
                <li key={g.days}>
                  {g.days}
                  {locale === "fr" ? " : " : ": "}
                  {g.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="site-footer__title">{dict.footer.contact}</h2>
            <ContactLinks settings={settings} locale={locale} dict={dict.info} />
          </div>
        </div>
        <div className="site-footer__bottom">
          <p>{fill(dict.footer.rights, { year })}</p>
          <ul className="site-footer__links">
            <li>
              <Link href={href(locale, "private")}>{dict.nav.private}</Link>
            </li>
            <li>
              <Link href={href(locale, "legal")}>{dict.footer.legal}</Link>
            </li>
            <li>
              <Link href={href(locale, "admin")} prefetch={false}>
                {dict.footer.team}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
