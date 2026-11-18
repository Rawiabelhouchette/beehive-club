"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { fill, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  bookingWindow,
  EVENT_MAX_GUESTS,
  EVENT_MIN_GUESTS,
  EVENT_SPACES,
  EVENT_TYPES,
  EVENT_WINDOW_DAYS,
  TIME_SLOTS,
  validateEventRequest,
  type EventField,
  type EventRequestInput,
  type EventValidationErrors,
} from "@/lib/reservation-rules";
import { whatsappLink } from "@/lib/site";
import { addDays, formatLongDate, formatTime } from "@/lib/time";
import { CheckIcon, WhatsappIcon } from "./icons";

interface Props {
  locale: Locale;
  dict: Dictionary["privateEvents"];
  today: string;
  whatsapp: string;
  /** Date de réouverture si le lieu est fermé pour la saison. */
  reopensOn: string | null;
}

type Status = "idle" | "sending" | "error" | "rate-limited";

const FIELD_ORDER: EventField[] = ["eventType", "space", "date", "time", "guests", "name", "phone", "email", "company", "message"];

export function PrivateEventForm({ locale, dict, today, whatsapp, reopensOn }: Props) {
  const period = bookingWindow(today, EVENT_WINDOW_DAYS, reopensOn);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<EventValidationErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [done, setDone] = useState<EventRequestInput | null>(null);

  const id = (field: string) => `${uid}-${field}`;

  function focusFirstError(found: EventValidationErrors) {
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const checked = validateEventRequest({ ...payload, locale }, new Date(), reopensOn);
    if (!checked.ok) {
      setErrors(checked.errors);
      setStatus("idle");
      focusFirstError(checked.errors);
      return;
    }

    setErrors({});
    setStatus("sending");
    try {
      const response = await fetch("/api/privatisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, locale }),
      });
      const result = (await response.json().catch(() => ({}))) as { errors?: EventValidationErrors };
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
      guests: done.guests,
      date: formatLongDate(done.date, locale),
      eventType: dict.eventTypes[done.event.eventType],
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

  const control = (name: EventField, extraDescription?: string) => ({
    id: id(name),
    name,
    className: "field__control",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby":
      [extraDescription, errors[name] ? id(`${name}-error`) : ""].filter(Boolean).join(" ") || undefined,
  });

  const error = (name: EventField) =>
    errors[name] ? (
      <p className="field__error" id={id(`${name}-error`)}>
        {dict.errors[name]}
      </p>
    ) : null;

  const wrap = (name: EventField) => `field${errors[name] ? " field--invalid" : ""}`;

  return (
    <form ref={formRef} className="form" onSubmit={onSubmit} noValidate>
      {Object.keys(errors).length > 0 ? (
        <p className="form__alert" role="alert">
          {dict.errorsTitle}
        </p>
      ) : null}
      {status === "error" || status === "rate-limited" ? (
        <p className="form__alert" role="alert">
          {status === "error" ? dict.errors.generic : dict.errors.rateLimit}
        </p>
      ) : null}

      <fieldset className={`choice-group${errors.space ? " choice-group--invalid" : ""}`}>
        <legend className="field__label">{dict.space}</legend>
        <div className="choice-group__options">
          {EVENT_SPACES.map((space, index) => (
            <label key={space} className="choice">
              <input
                type="radio"
                name="space"
                value={space}
                defaultChecked={index === 0}
                aria-describedby={errors.space ? id("space-error") : undefined}
              />
              <span>{dict.spaces[space]}</span>
            </label>
          ))}
        </div>
        {error("space")}
      </fieldset>

      <div className="form__row form__row--2">
        <div className={wrap("eventType")}>
          <label className="field__label" htmlFor={id("eventType")}>
            {dict.eventType}
          </label>
          <select {...control("eventType")} defaultValue="birthday">
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {dict.eventTypes[type]}
              </option>
            ))}
          </select>
          {error("eventType")}
        </div>
        <div className={wrap("guests")}>
          <label className="field__label" htmlFor={id("guests")}>
            {dict.guests}
          </label>
          <input
            {...control("guests", id("guests-hint"))}
            type="number"
            inputMode="numeric"
            min={EVENT_MIN_GUESTS}
            max={EVENT_MAX_GUESTS}
            defaultValue={20}
            required
          />
          <p className="field__hint" id={id("guests-hint")}>
            {dict.guestsHint}
          </p>
          {error("guests")}
        </div>
      </div>

      <div className="form__row form__row--2">
        <div className={wrap("date")}>
          <label className="field__label" htmlFor={id("date")}>
            {dict.date}
          </label>
          <input
            {...control("date")}
            type="date"
            required
            min={period.min}
            max={period.max}
            defaultValue={addDays(period.min, 14)}
          />
          {error("date")}
        </div>
        <div className={wrap("time")}>
          <label className="field__label" htmlFor={id("time")}>
            {dict.time}
          </label>
          <select {...control("time")} defaultValue="19:00" required>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatTime(slot, locale)}
              </option>
            ))}
          </select>
          {error("time")}
        </div>
      </div>

      <div className="form__row form__row--2">
        <div className={wrap("name")}>
          <label className="field__label" htmlFor={id("name")}>
            {dict.name}
          </label>
          <input {...control("name")} type="text" autoComplete="name" required maxLength={80} />
          {error("name")}
        </div>
        <div className={wrap("phone")}>
          <label className="field__label" htmlFor={id("phone")}>
            {dict.phone}
          </label>
          <input {...control("phone")} type="tel" autoComplete="tel" inputMode="tel" required placeholder="+216" />
          {error("phone")}
        </div>
      </div>

      <div className="form__row form__row--2">
        <div className={wrap("email")}>
          <label className="field__label" htmlFor={id("email")}>
            {dict.email}
          </label>
          <input {...control("email")} type="email" autoComplete="email" maxLength={120} />
          {error("email")}
        </div>
        <div className={wrap("company")}>
          <label className="field__label" htmlFor={id("company")}>
            {dict.company}
          </label>
          <input {...control("company")} type="text" autoComplete="organization" maxLength={80} />
          {error("company")}
        </div>
      </div>

      <div className={wrap("message")}>
        <label className="field__label" htmlFor={id("message")}>
          {dict.message}
        </label>
        <textarea {...control("message")} maxLength={1000} placeholder={dict.messagePlaceholder} />
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
