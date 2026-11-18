"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { eventOn } from "@/content/events";
import { tr, type EventItem, type OpeningHours } from "@/content/types";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { nextOpening, openStatus, withEventNights, type OpenStatus } from "@/lib/hours";
import { clubNight } from "@/lib/night";
import { isClosedForSeason } from "@/lib/season";
import { addDays, dateParts, formatMonthYear, formatTime, nowInTunis, weekdayOf } from "@/lib/time";
import { href } from "./paths";

interface Props {
  locale: Locale;
  dict: Dictionary["hero"];
  days: string[];
  daysShort: string[];
  hours: OpeningHours[];
  reopensOn: string | null;
  instagram: string;
  /** Les prochaines soirées annoncées, à partir d'aujourd'hui (calculées côté serveur). */
  events: EventItem[];
  /** Date du jour côté serveur, pour le premier affichage. */
  todayDate: string;
}

type Status =
  | OpenStatus
  | { state: "season"; reopensOn: string }
  | { state: "opens-on"; day: number; opensAt: string };

interface Night {
  date: string;
  late: boolean;
  status: Status | null;
}

/** La soirée d'une date : celle du programme reçu, sinon celle des affiches. */
function eventFor(date: string, events: EventItem[]): EventItem | null {
  return events.find((e) => e.date === date) ?? eventOn(date);
}

/**
 * Haut de la page d'accueil : le spectacle du soir dans l'hexagone lumineux de l'enseigne,
 * et les soirs de la semaine en alvéoles. Entre minuit et 4 h, c'est encore la soirée de la veille.
 * Sans spectacle ce soir : le prochain. Sans programme annoncé : la semaine passée.
 */
export function HiveHero({ locale, dict, days, daysShort, hours, reopensOn, instagram, events, todayDate }: Props) {
  const [night, setNight] = useState<Night>({ date: todayDate, late: false, status: null });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const current = clubNight(now);
      const tunis = nowInTunis(now);
      const dates = Array.from({ length: 8 }, (_, i) => addDays(tunis.date, i - 1));
      const eventDays = dates.filter((date) => eventFor(date, events)).map(weekdayOf);
      const week = withEventNights(hours, eventDays);
      let status: Status;
      if (reopensOn && isClosedForSeason(reopensOn, tunis.date)) {
        status = { state: "season", reopensOn };
      } else {
        status = openStatus(week, tunis.weekday, tunis.minutes);
        const next = status.state === "closed-today" ? nextOpening(week, tunis.weekday) : null;
        if (next) status = { state: "opens-on", day: next.day, opensAt: next.open };
      }
      setNight({ date: current.date, late: current.late, status });
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [events, hours, reopensOn]);

  const season = night.status?.state === "season";
  // Les 7 prochains soirs, à partir du soir en cours.
  const lastNight = addDays(night.date, 6);
  const week = events.filter((e) => e.date >= night.date && e.date <= lastNight);
  const tonight = eventFor(night.date, events);
  if (tonight && !week.some((e) => e.id === tonight.id)) week.unshift(tonight);
  // Le spectacle mis en avant : celui de ce soir, sinon le prochain.
  const show = tonight ?? week[0] ?? null;
  const isTonight = show !== null && show.date === night.date;
  // Tant que le programme n'est pas annoncé : les soirées des 7 derniers jours.
  const lastWeek =
    week.length > 0
      ? []
      : Array.from({ length: 7 }, (_, i) => eventFor(addDays(night.date, i - 7), events)).filter(
          (e): e is EventItem => e !== null,
        );

  const status = night.status;
  const statusText = !status
    ? null
    : status.state === "season"
      ? fill(dict.closedSeason, { date: formatMonthYear(status.reopensOn, locale) })
      : status.state === "open"
        ? fill(dict.openNow, { time: formatTime(status.closesAt, locale) })
        : status.state === "opens-later"
          ? fill(dict.opensAt, { time: formatTime(status.opensAt, locale) })
          : status.state === "opens-on"
            ? fill(dict.opensOn, { day: days[status.day].toLowerCase(), time: formatTime(status.opensAt, locale) })
            : dict.closedToday;

  const cellDate = show && !season ? show.date : night.date;
  const parts = dateParts(cellDate, locale);

  const comb = (list: EventItem[], past = false) => (
    <ol className={`comb${past ? " comb--past" : ""}`}>
      {list.map((event) => {
        const p = dateParts(event.date, locale);
        const lit = !past && event.date === night.date;
        const body = (
          <>
            <span className="comb__date">
              {daysShort[weekdayOf(event.date)]} {p.day}
            </span>
            <span className="comb__title">{tr(event.title, locale)}</span>
            {lit ? <span className="comb__tag">{night.late ? dict.weekLate : dict.weekToday}</span> : null}
          </>
        );
        return (
          <li key={event.id} className={`comb__cell${lit ? " comb__cell--lit" : ""}`}>
            {past ? (
              <div className="comb__link">{body}</div>
            ) : (
              <Link href={href(locale, "book", { date: event.date })} className="comb__link">
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );

  return (
    <section className="hive" aria-labelledby="hero-title">
      <div className="hive__photo" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/scene.jpg" alt="" width={1400} height={933} fetchPriority="high" decoding="async" />
      </div>

      <div className="container hive__inner">
        <div className="hive__text">
          <p className="hive__status" aria-live="polite">
            {statusText ? (
              <>
                <span
                  className={`status-dot${status?.state === "open" ? "" : " status-dot--closed"}`}
                  aria-hidden="true"
                />
                {statusText}
              </>
            ) : null}
          </p>

          <h1 id="hero-title" className="hive__kicker">
            {show && !season && !isTonight ? dict.nextTitle : night.late ? dict.lateTitle : dict.title}
          </h1>

          {show && !season ? (
            <>
              <p className="hive__show">{tr(show.title, locale)}</p>
              <p className="hive__lineup">
                {tr(show.lineup, locale)
                  .split(", ")
                  .map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                <span>{fill(dict.from, { time: formatTime(show.startTime, locale) })}</span>
              </p>
              <p className="hive__desc">{tr(show.description, locale)}</p>
            </>
          ) : !season ? (
            <p className="hive__desc">
              {dict.emptyText}{" "}
              {instagram ? (
                <a className="text-link" href={instagram} target="_blank" rel="noopener noreferrer">
                  {dict.emptyLink}
                </a>
              ) : null}
            </p>
          ) : null}

          <p className="hive__tagline">{dict.tagline}</p>
          <p className="hive__lead">{dict.lead}</p>

          <div className="hive__actions">
            <Link
              href={href(locale, "book", { date: show && !season ? show.date : night.date })}
              className="btn btn--primary"
            >
              {dict.book}
            </Link>
            <Link href={href(locale, "events")} className="btn btn--ghost">
              {dict.programme}
            </Link>
          </div>
        </div>

        {/* L'hexagone de l'enseigne, allumé, avec la date du spectacle. */}
        <div className="hive__cell" aria-hidden="true">
          <svg className="hive__hex" viewBox="0 0 100 115.47" preserveAspectRatio="none">
            <polygon points="50,2 98,29.7 98,85.8 50,113.5 2,85.8 2,29.7" />
          </svg>
          <span className="hive__weekday">{days[weekdayOf(cellDate)]}</span>
          <span className="hive__day">{parts.day}</span>
          <span className="hive__month">{parts.month}</span>
        </div>
      </div>

      {!season ? (
        <div className="container hive__week">
          {week.length > 0 ? (
            <>
              <h2 className="visually-hidden">{dict.weekTitle}</h2>
              {comb(week)}
            </>
          ) : lastWeek.length > 0 ? (
            <>
              <h2 className="hive__past-title">{dict.lastWeek}</h2>
              {comb(lastWeek, true)}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
