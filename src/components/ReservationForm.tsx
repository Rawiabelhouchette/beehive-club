"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  BOOKING_WINDOW_DAYS,
  bookingWindow,
  MAX_GUESTS,
  OCCASIONS,
  TIME_SLOTS,
  validateReservation,
  type ReservationField,
  type ReservationInput,
  type ValidationErrors,
} from "@/lib/reservation-rules";
import { whatsappLink } from "@/lib/site";
import { formatLongDate, formatTime } from "@/lib/time";
import { CheckIcon, WhatsappIcon } from "./icons";

interface Props {
  locale: Locale;
  dict: Dictionary["reservation"];
  today: string;
  initialDate?: string;
  whatsapp: string;
  /** Date de réouverture si le lieu est fermé pour la saison. */
  reopensOn: string | null;
}

type Status = "idle" | "sending" | "error" | "rate-limited";

export function ReservationForm({ locale, dict, today, initialDate, whatsapp, reopensOn }: Props) {
  const period = bookingWindow(today, BOOKING_WINDOW_DAYS, reopensOn);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState<ReservationInput | null>(null);

  const id = (field: string) => `${uid}-${field}`;
  const guestsLabel = (n: number) => (n === 1 ? dict.guestsOne : fill(dict.guestsMany, { n }));

  function focusFirstError(found: ValidationErrors) {
    const order: ReservationField[] = ["date", "time", "guests", "name", "phone", "email", "occasion", "message"];
    const first = order.find((field) => found[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const checked = validateReservation({ ...payload, locale }, new Date(), reopensOn);
    if (!checked.ok) {
      setErrors(checked.errors);
      setStatus("idle");
      focusFirstError(checked.errors);
      return;
    }

    setErrors({});
    setStatus("sending");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, locale }),
      });
      const result = (await response.json().catch(() => ({}))) as { errors?: ValidationErrors };
      if (response.status === 429) return setStatus("rate-limited");
      if (response.status === 400 && result.errors) {
        setErrors(result.errors);
        setStatus("idle");
        return focusFirstError(result.errors);
      }
      if (!response.ok) return setStatus("error");
      setDone(checked.data);
      setStatus("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setStatus("error");
    }
  }

  if (done) {
    const values = {
      name: done.name,
      guests: guestsLabel(done.guests),
      date: formatLongDate(done.date, locale),
      time: formatTime(done.time, locale),
    };
    return (
      <div className="success" role="status">
        <span className="success__icon" aria-hidden="true">
          <CheckIcon />
        </span>
        <h2>{dict.successTitle}</h2>
        <p>{fill(dict.successText, values)}</p>
        <div className="success__actions">
          {whatsapp ? (
            <a
              className="btn btn--primary"
              href={whatsappLink(whatsapp, fill(dict.whatsappMessage, values))}
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsappIcon />
              {dict.successWhatsapp}
            </a>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={() => setDone(null)}>
            {dict.successAgain}
          </button>
        </div>
      </div>
    );
  }

  const field = (name: ReservationField) => ({
    id: id(name),
    name,
    className: "field__control",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? id(`${name}-error`) : undefined,
  });

  const error = (name: ReservationField) =>
    errors[name] ? (
      <p className="field__error" id={id(`${name}-error`)}>
        {dict.errors[name]}
      </p>
    ) : null;

  const wrap = (name: ReservationField) => `field${errors[name] ? " field--invalid" : ""}`;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate>
      {hasErrors ? (
        <p className="form__alert" role="alert">
          {dict.errorsTitle}
        </p>
      ) : null}
      {status === "error" || status === "rate-limited" ? (
        <p className="form__alert" role="alert">
          {status === "error" ? dict.errors.generic : dict.errors.rateLimit}
        </p>
      ) : null}

      <div className="form__row form__row--3">
        <div className={wrap("date")}>
          <label className="field__label" htmlFor={id("date")}>
            {dict.date}
          </label>
          <input
            {...field("date")}
            type="date"
            required
            min={period.min}
            max={period.max}
            defaultValue={initialDate && initialDate >= period.min && initialDate <= period.max ? initialDate : period.min}
          />
          {error("date")}
        </div>
        <div className={wrap("time")}>
          <label className="field__label" htmlFor={id("time")}>
            {dict.time}
          </label>
          <select {...field("time")} required defaultValue="20:00">
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatTime(slot, locale)}
              </option>
            ))}
          </select>
          {error("time")}
        </div>
        <div className={wrap("guests")}>
          <label className="field__label" htmlFor={id("guests")}>
            {dict.guests}
          </label>
          <select {...field("guests")} required defaultValue="2">
            {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {guestsLabel(n)}
              </option>
            ))}
          </select>
          {error("guests")}
        </div>
      </div>

      <div className="form__row form__row--2">
        <div className={wrap("name")}>
          <label className="field__label" htmlFor={id("name")}>
            {dict.name}
          </label>
          <input {...field("name")} type="text" autoComplete="name" required maxLength={80} />
          {error("name")}
        </div>
        <div className={wrap("phone")}>
          <label className="field__label" htmlFor={id("phone")}>
            {dict.phone}
          </label>
          <input
            {...field("phone")}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            placeholder="+216"
            aria-describedby={[id("phone-hint"), errors.phone ? id("phone-error") : ""].join(" ").trim()}
          />
          <p className="field__hint" id={id("phone-hint")}>
            {dict.phoneHint}
          </p>
          {error("phone")}
        </div>
      </div>

      <div className="form__row form__row--2">
        <div className={wrap("email")}>
          <label className="field__label" htmlFor={id("email")}>
            {dict.email}
          </label>
          <input {...field("email")} type="email" autoComplete="email" maxLength={120} />
          {error("email")}
        </div>
        <div className={wrap("occasion")}>
          <label className="field__label" htmlFor={id("occasion")}>
            {dict.occasion}
          </label>
          <select {...field("occasion")} defaultValue="">
            {OCCASIONS.map((occasion) => (
              <option key={occasion} value={occasion}>
                {dict.occasions[occasion]}
              </option>
            ))}
          </select>
          {error("occasion")}
        </div>
      </div>

      <div className={wrap("message")}>
        <label className="field__label" htmlFor={id("message")}>
          {dict.message}
        </label>
        <textarea {...field("message")} maxLength={500} placeholder={dict.messagePlaceholder} />
        {error("message")}
      </div>

      {/* Champ piège pour les robots : invisible pour les visiteurs. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form__footer">
        <button type="submit" className="btn btn--primary" disabled={status === "sending"}>
          {status === "sending" ? dict.submitting : dict.submit}
        </button>
        <p className="form__consent">{dict.consent}</p>
      </div>
    </form>
  );
}
