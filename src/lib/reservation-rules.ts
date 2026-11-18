import { isLocale, type Locale } from "../i18n/config";
import { bookingStart } from "./season";
import { addDays, todayInTunis } from "./time";

/* --- Réservation de table ------------------------------------------------- */

export const MAX_GUESTS = 12;
export const BOOKING_WINDOW_DAYS = 90;
export const OCCASIONS = ["", "birthday", "afterwork", "date", "other"] as const;
export type Occasion = (typeof OCCASIONS)[number];

/* --- Privatisation -------------------------------------------------------- */

export const EVENT_MIN_GUESTS = MAX_GUESTS + 1;
export const EVENT_MAX_GUESTS = 300;
export const EVENT_WINDOW_DAYS = 365;
export const EVENT_TYPES = ["birthday", "corporate", "engagement", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_SPACES = ["partial", "full"] as const;
export type EventSpace = (typeof EVENT_SPACES)[number];

/** Créneaux d'arrivée proposés : toutes les 30 min de 20:30 (ouverture) à 23:30. */
export const TIME_SLOTS: string[] = Array.from({ length: 7 }, (_, i) => {
  const minutes = 20 * 60 + 30 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export interface ReservationInput {
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
  email: string | null;
  occasion: Occasion | null;
  message: string | null;
  locale: Locale;
}

export interface EventDetails {
  eventType: EventType;
  space: EventSpace;
  company: string | null;
}

export interface EventRequestInput extends ReservationInput {
  event: EventDetails;
}

export type ReservationField = "date" | "time" | "guests" | "name" | "phone" | "email" | "occasion" | "message";
export type EventField = Exclude<ReservationField, "occasion"> | "eventType" | "space" | "company";
export type ValidationErrors = Partial<Record<ReservationField, string>>;
export type EventValidationErrors = Partial<Record<EventField, string>>;

export type ValidationResult =
  | { ok: true; data: ReservationInput }
  | { ok: false; errors: ValidationErrors };

export type EventValidationResult =
  | { ok: true; data: EventRequestInput }
  | { ok: false; errors: EventValidationErrors };

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

interface CommonLimits {
  minGuests: number;
  maxGuests: number;
  windowDays: number;
  maxMessage: number;
  /** Date de réouverture si le lieu est fermé pour la saison. */
  reopensOn?: string | null;
}

/** Période réservable : du premier jour possible à `windowDays` jours plus tard. */
export function bookingWindow(today: string, windowDays: number, reopensOn?: string | null) {
  const start = bookingStart(reopensOn, today);
  return { min: start, max: addDays(start, windowDays) };
}

/** Champs communs aux deux formulaires (date, heure, invités, contact, message). */
function validateCommon(input: Record<string, unknown>, now: Date, limits: CommonLimits) {
  const errors: Partial<Record<ReservationField, string>> = {};

  const date = str(input.date);
  const period = bookingWindow(todayInTunis(now), limits.windowDays, limits.reopensOn);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < period.min || date > period.max) {
    errors.date = "date";
  }

  const time = str(input.time);
  if (!TIME_SLOTS.includes(time)) errors.time = "time";

  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < limits.minGuests || guests > limits.maxGuests) errors.guests = "guests";

  const name = str(input.name).replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) errors.name = "name";

  const phone = str(input.phone);
  const digits = phone.replace(/\D/g, "");
  if (!/^[+\d\s().-]{8,24}$/.test(phone) || digits.length < 8 || digits.length > 15) errors.phone = "phone";

  const email = str(input.email);
  if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) errors.email = "email";

  const message = str(input.message);
  if (message.length > limits.maxMessage) errors.message = "message";

  const locale = str(input.locale);

  return {
    errors,
    values: {
      date,
      time,
      guests,
      name,
      phone,
      email: email || null,
      message: message || null,
      locale: (isLocale(locale) ? locale : "fr") as Locale,
    },
  };
}

const asObject = (raw: unknown) => (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

/** Valide une demande de réservation de table (côté serveur ET côté client). */
export function validateReservation(
  raw: unknown,
  now: Date = new Date(),
  reopensOn?: string | null,
): ValidationResult {
  const input = asObject(raw);
  const { errors, values } = validateCommon(input, now, {
    minGuests: 1,
    maxGuests: MAX_GUESTS,
    windowDays: BOOKING_WINDOW_DAYS,
    maxMessage: 500,
    reopensOn,
  });

  const occasion = str(input.occasion);
  const allErrors: ValidationErrors = { ...errors };
  if (!(OCCASIONS as readonly string[]).includes(occasion)) allErrors.occasion = "occasion";

  if (Object.keys(allErrors).length > 0) return { ok: false, errors: allErrors };
  return { ok: true, data: { ...values, occasion: (occasion || null) as Occasion | null } };
}

/** Valide une demande de privatisation (groupes de 13 personnes et plus). */
export function validateEventRequest(
  raw: unknown,
  now: Date = new Date(),
  reopensOn?: string | null,
): EventValidationResult {
  const input = asObject(raw);
  const { errors, values } = validateCommon(input, now, {
    minGuests: EVENT_MIN_GUESTS,
    maxGuests: EVENT_MAX_GUESTS,
    windowDays: EVENT_WINDOW_DAYS,
    maxMessage: 1000,
    reopensOn,
  });

  const allErrors: EventValidationErrors = { ...errors };
  const eventType = str(input.eventType);
  if (!(EVENT_TYPES as readonly string[]).includes(eventType)) allErrors.eventType = "eventType";
  const space = str(input.space);
  if (!(EVENT_SPACES as readonly string[]).includes(space)) allErrors.space = "space";
  const company = str(input.company);
  if (company.length > 80) allErrors.company = "company";

  if (Object.keys(allErrors).length > 0) return { ok: false, errors: allErrors };
  return {
    ok: true,
    data: {
      ...values,
      occasion: null,
      event: { eventType: eventType as EventType, space: space as EventSpace, company: company || null },
    },
  };
}
