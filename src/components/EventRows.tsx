import Link from "next/link";
import { tr, type EventItem } from "@/content/types";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { dateParts, formatLongDate, formatTime } from "@/lib/time";
import { href } from "./paths";

interface Props {
  events: EventItem[];
  locale: Locale;
  dict: Dictionary["eventsPage"];
  /** Version courte (accueil) : sans description. */
  compact?: boolean;
}

export function EventRows({ events, locale, dict, compact = false }: Props) {
  if (events.length === 0) return <p className="muted">{dict.empty}</p>;

  return (
    <ol className="events">
      {events.map((event) => {
        const parts = dateParts(event.date, locale);
        return (
          <li key={event.id} className="event">
            <time className="event__date" dateTime={`${event.date}T${event.startTime}`}>
              <span className="event__weekday">{parts.weekday}</span>
              <span className="event__day">{parts.day}</span>
              <span className="event__month">{parts.month}</span>
              <span className="visually-hidden">{formatLongDate(event.date, locale)}</span>
            </time>
            <div>
              <h3 className="event__title">{tr(event.title, locale)}</h3>
              <p className="event__lineup">{tr(event.lineup, locale)}</p>
              {compact ? null : <p className="event__description">{tr(event.description, locale)}</p>}
            </div>
            <div className="event__meta">
              <span className="genre">{event.genre}</span>
              <span className="event__time">{fill(dict.from, { time: formatTime(event.startTime, locale) })}</span>
              {event.ticketUrl ? (
                <a className="text-link" href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                  {dict.tickets}
                  <span className="visually-hidden"> {dict.newTab}</span>
                </a>
              ) : compact ? null : (
                <Link className="text-link" href={href(locale, "book", { date: event.date })}>
                  {dict.book}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
