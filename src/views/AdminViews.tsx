import Link from "next/link";
import { PhoneIcon, WhatsappIcon } from "@/components/icons";
import { href } from "@/components/paths";
import { fill, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import type { Reservation, ReservationStatus } from "@/lib/reservations";
import { internationalNumber, telLink, whatsappLink } from "@/lib/site";
import { coversByDate, filterReservations, groupByDate } from "@/lib/admin-stats";
import { formatLongDate, formatTime } from "@/lib/time";
import type { DemoVisit } from "@/lib/visits";

type FormAction = (formData: FormData) => void | Promise<void>;
export type AdminFilter = "all" | ReservationStatus | "events";
export const ADMIN_FILTERS: AdminFilter[] = ["all", "pending", "confirmed", "declined", "events"];

interface AdminViewProps {
  locale: Locale;
  dict: Dictionary;
  reservations: Reservation[];
  filter: AdminFilter;
  storage: "file" | "supabase";
  /** Visites de la démo privée (null : suivi non configuré ou hors démo). */
  visits?: DemoVisit[] | null;
  setStatusAction: FormAction;
  logoutAction: FormAction;
}

/** Nom lisible d'une page du site à partir de son chemin (/fr/carte → La carte). */
function pageName(path: string, dict: Dictionary): string {
  const segment = path.split("/")[2] ?? "";
  const names: Record<string, string> = {
    "": dict.nav.home,
    carte: dict.nav.menu,
    soirees: dict.nav.events,
    infos: dict.nav.info,
    privatisation: dict.nav.private,
    reservation: dict.nav.book,
    "mentions-legales": dict.footer.legal,
  };
  const lang = path.split("/")[1]?.toUpperCase() ?? "";
  return `${names[segment] ?? path}${lang ? ` (${lang})` : ""}`;
}

/** Date et heure de Tunis : « lun. 9 nov., 18:15 ». */
function visitTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    timeZone: "Africa/Tunis",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function VisitsList({ visits, locale, dict }: { visits: DemoVisit[]; locale: Locale; dict: Dictionary }) {
  const v = dict.admin.visits;
  return (
    <div className="visits">
      <h2 className="menu-group__title">{v.title}</h2>
      <p className="muted">{v.lead}</p>
      {visits.length === 0 ? (
        <p className="visits__empty">{v.empty}</p>
      ) : (
        <ol className="visits__list">
          {visits.map((visit, i) => (
            <li key={`${visit.at}-${i}`} className={`visit visit--${visit.kind}`}>
              <span className="visit__when">{visitTime(visit.at, locale)}</span>
              <span className="visit__what">
                <strong>{v.kinds[visit.kind]}</strong> · {pageName(visit.path, dict)}
              </span>
              <span className="visit__who">
                {[visit.device, visit.browser, [visit.city, visit.country].filter(Boolean).join(", ")]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AdminView({ locale, dict, reservations, filter, storage, visits, setStatusAction, logoutAction }: AdminViewProps) {
  const a = dict.admin;
  const occasionLabel = (o: string | null) =>
    o ? (dict.reservation.occasions as Record<string, string>)[o] ?? o : null;
  const pending = reservations.filter((r) => r.status === "pending").length;
  const shown = filterReservations(reservations, filter);
  const covers = coversByDate(reservations);
  const guests = (n: number) => fill(a.guests, { n });

  const statusForm = (reservation: Reservation, status: ReservationStatus, label: string, className: string) => (
    <form action={setStatusAction}>
      <input type="hidden" name="id" value={reservation.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className={`btn btn--small ${className}`}>
        {label}
      </button>
    </form>
  );

  return (
    <section className="section">
      <div className="container">
        <div className="admin-head">
          <div>
            <h1 className="display" style={{ fontSize: "var(--step-3)" }}>
              {a.title}
            </h1>
            <p className="admin-summary">
              {pending === 0 ? a.pendingNone : pending === 1 ? a.pendingOne : fill(a.pendingMany, { n: pending })}
            </p>
          </div>
          <div className="admin-head__actions">
            <a className="btn btn--line btn--small" href="/api/admin/export" download>
              {a.exportCsv}
            </a>
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="btn btn--line btn--small">
                {a.logout}
              </button>
            </form>
          </div>
        </div>

        <nav aria-label={a.title}>
          <ul className="filters">
            {ADMIN_FILTERS.map((f) => (
              <li key={f}>
                <Link
                  href={f === "all" ? href(locale, "admin") : href(locale, "admin", { status: f })}
                  aria-current={f === filter ? "page" : undefined}
                >
                  {a.filters[f]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {shown.length === 0 ? <p className="muted">{a.empty}</p> : null}

        {groupByDate(shown).map(([date, items]) => {
          const day = covers.get(date) ?? { total: 0, confirmed: 0 };
          return (
            <div key={date} className="day-group">
              <div className="day-group__head">
                <h2 className="day-group__title">{formatLongDate(date, locale)}</h2>
                {day.total > 0 ? (
                  <p className="day-group__covers">
                    {day.total === 1 ? a.coversOne : fill(a.coversMany, { n: day.total })}
                    {day.confirmed > 0 ? `, ${fill(a.coversConfirmed, { n: day.confirmed })}` : ""}
                  </p>
                ) : null}
              </div>
              {items.map((r) => {
                // Message WhatsApp rédigé dans la langue choisie par le client.
                const guestDict = getDictionary(r.locale);
                const replyText = r.event
                  ? fill(guestDict.admin.whatsappEventReply, { name: r.name, date: formatLongDate(r.date, r.locale) })
                  : fill(guestDict.admin.whatsappConfirm, {
                      name: r.name,
                      guests:
                        r.guests === 1
                          ? guestDict.reservation.guestsOne
                          : fill(guestDict.reservation.guestsMany, { n: r.guests }),
                      date: formatLongDate(r.date, r.locale),
                      time: formatTime(r.time, r.locale),
                    });
                const details = r.event
                  ? [
                      dict.privateEvents.eventTypes[r.event.eventType],
                      dict.privateEvents.spaces[r.event.space],
                      r.event.company,
                    ]
                  : [occasionLabel(r.occasion)];
                return (
                  <article
                    key={r.id}
                    className={`booking-row booking-row--${r.status}${r.event ? " booking-row--event" : ""}`}
                  >
                    <div className="booking-row__main">
                      <span className="booking-row__time">{formatTime(r.time, locale)}</span>
                      <span className="booking-row__name">{r.name}</span>
                      <span>{guests(r.guests)}</span>
                      {r.event ? <span className="badge badge--event">{a.eventBadge}</span> : null}
                      <span className={`badge badge--${r.status}`}>{a.status[r.status]}</span>
                    </div>
                    <p className="booking-row__details">
                      {[r.phone, r.email, ...details, r.locale.toUpperCase()].filter(Boolean).join("  |  ")}
                      {r.message ? (
                        <>
                          <br />« {r.message} »
                        </>
                      ) : null}
                      <br />
                      {fill(a.received, {
                        date: new Date(r.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
                          timeZone: "Africa/Tunis",
                          dateStyle: "short",
                          timeStyle: "short",
                        }),
                      })}
                    </p>
                    <div className="booking-row__actions">
                      {r.status !== "confirmed" ? statusForm(r, "confirmed", a.confirm, "btn--confirm") : null}
                      {r.status !== "declined" ? statusForm(r, "declined", a.decline, "btn--line") : null}
                      {r.status !== "pending" ? statusForm(r, "pending", a.reopen, "btn--line") : null}
                      <a className="btn btn--line btn--small" href={telLink(r.phone)}>
                        <PhoneIcon />
                        {a.call}
                      </a>
                      <a
                        className="btn btn--line btn--small"
                        href={whatsappLink(internationalNumber(r.phone), replyText)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <WhatsappIcon />
                        {a.whatsapp}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })}

        <p className="storage-note">{storage === "file" ? a.storageFile : a.storageSupabase}</p>

        {visits ? <VisitsList visits={visits} locale={locale} dict={dict} /> : null}
      </div>
    </section>
  );
}

interface LoginProps {
  locale: Locale;
  dict: Dictionary;
  error: boolean;
  configured: boolean;
  loginAction: FormAction;
}

export function AdminLoginView({ locale, dict, error, configured, loginAction }: LoginProps) {
  const a = dict.admin;
  return (
    <section className="section">
      <div className="container">
        <div className="panel login">
          <h1 className="display" style={{ fontSize: "var(--step-3)" }}>
            {a.loginTitle}
          </h1>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            {configured ? a.loginLead : a.notConfigured}
          </p>
          {configured ? (
            <form action={loginAction} className="form" style={{ marginTop: "1.5rem" }}>
              <input type="hidden" name="locale" value={locale} />
              {error ? (
                <p className="form__alert" role="alert">
                  {a.loginError}
                </p>
              ) : null}
              <div className={`field${error ? " field--invalid" : ""}`}>
                <label className="field__label" htmlFor="admin-password">
                  {a.password}
                </label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  className="field__control"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn--primary">
                {a.login}
              </button>
            </form>
          ) : null}
          <p style={{ marginTop: "1.5rem" }}>
            <Link className="text-link" href={href(locale, "home")}>
              {a.backToSite}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
