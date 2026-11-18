import { promises as fs } from "node:fs";
import path from "node:path";
import type { EventDetails, EventSpace, EventType, ReservationInput } from "./reservation-rules";
import { addDays, todayInTunis } from "./time";

export type ReservationStatus = "pending" | "confirmed" | "declined";
export const RESERVATION_STATUSES: ReservationStatus[] = ["pending", "confirmed", "declined"];

/** « table » : réservation classique ; « event » : demande de privatisation. */
export type BookingKind = "table" | "event";

export interface Reservation extends ReservationInput {
  id: string;
  createdAt: string;
  status: ReservationStatus;
  kind: BookingKind;
  event: EventDetails | null;
}

/** Ce qu'on enregistre : une réservation de table, ou une privatisation (avec `event`). */
export type NewBooking = ReservationInput & { event?: EventDetails | null };

export interface ReservationStore {
  kind: "file" | "supabase";
  create(input: NewBooking): Promise<Reservation>;
  /** Réservations à partir de la date donnée (AAAA-MM-JJ), triées par date et heure. */
  list(fromDate: string): Promise<Reservation[]>;
  setStatus(id: string, status: ReservationStatus): Promise<Reservation | null>;
}

/** Les réservations enregistrées avant l'ajout des privatisations n'ont ni `kind` ni `event`. */
const normalize = (r: Partial<Reservation> & ReservationInput & { id: string; createdAt: string; status: ReservationStatus }): Reservation => ({
  ...r,
  event: r.event ?? null,
  kind: r.event ? "event" : "table",
});

const sortByDate = (a: Reservation, b: Reservation) =>
  a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);

/* ------------------------------------------------------------------------ */
/* Stockage fichier : pour la démo en local ou sur un serveur classique.    */
/* ------------------------------------------------------------------------ */

export function createFileStore(filePath: string): ReservationStore {
  let queue: Promise<unknown> = Promise.resolve();
  // Les écritures passent les unes après les autres pour ne pas s'écraser.
  const serialize = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  };

  async function readAll(): Promise<Reservation[]> {
    try {
      return (JSON.parse(await fs.readFile(filePath, "utf8")) as Reservation[]).map(normalize);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async function writeAll(items: Reservation[]) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
    await fs.rename(tmp, filePath);
  }

  return {
    kind: "file",
    create: (input) =>
      serialize(async () => {
        const items = await readAll();
        const reservation = normalize({
          ...input,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          status: "pending",
        });
        items.push(reservation);
        await writeAll(items);
        return reservation;
      }),
    list: async (fromDate) => (await readAll()).filter((r) => r.date >= fromDate).sort(sortByDate),
    setStatus: (id, status) =>
      serialize(async () => {
        const items = await readAll();
        const target = items.find((r) => r.id === id);
        if (!target) return null;
        target.status = status;
        await writeAll(items);
        return target;
      }),
  };
}

/* ------------------------------------------------------------------------ */
/* Stockage Supabase (PostgREST) : recommandé en production.                */
/* ------------------------------------------------------------------------ */

interface Row {
  id: string;
  created_at: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  name: string;
  phone: string;
  email: string | null;
  occasion: string | null;
  message: string | null;
  locale: string;
  status: ReservationStatus;
  kind: BookingKind | null;
  event_type: string | null;
  event_space: string | null;
  company: string | null;
}

const fromRow = (row: Row): Reservation => ({
  id: row.id,
  createdAt: row.created_at,
  date: row.reservation_date,
  time: row.reservation_time,
  guests: row.guests,
  name: row.name,
  phone: row.phone,
  email: row.email,
  occasion: row.occasion as Reservation["occasion"],
  message: row.message,
  locale: row.locale === "en" ? "en" : "fr",
  status: row.status,
  kind: row.kind === "event" ? "event" : "table",
  event:
    row.kind === "event"
      ? {
          eventType: (row.event_type ?? "other") as EventType,
          space: (row.event_space ?? "partial") as EventSpace,
          company: row.company,
        }
      : null,
});

/**
 * Préfixe des tables Supabase (SUPABASE_TABLE_PREFIX, ex. « bee_ ») : permet à plusieurs démos
 * de partager un même projet Supabase gratuit sans mélanger leurs données.
 */
export function tablePrefix(env: Record<string, string | undefined> = process.env): string {
  const prefix = (env.SUPABASE_TABLE_PREFIX ?? "").trim();
  return /^[a-z][a-z0-9_]*$/.test(prefix) ? prefix : "";
}

export function createSupabaseStore(url: string, serviceKey: string, table = "reservations"): ReservationStore {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/${table}`;
  // Clé secrète actuelle (sb_secret_…) : uniquement dans l'en-tête apikey.
  // Ancienne clé service_role (un JWT « eyJ… ») : aussi dans Authorization.
  const headers: Record<string, string> = {
    apikey: serviceKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (serviceKey.startsWith("eyJ")) headers.Authorization = `Bearer ${serviceKey}`;

  async function call(input: string, init: RequestInit): Promise<Row[]> {
    const response = await fetch(input, { ...init, headers, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Supabase a répondu ${response.status} : ${await response.text()}`);
    }
    return (await response.json()) as Row[];
  }

  return {
    kind: "supabase",
    async create(input) {
      const [row] = await call(endpoint, {
        method: "POST",
        body: JSON.stringify({
          reservation_date: input.date,
          reservation_time: input.time,
          guests: input.guests,
          name: input.name,
          phone: input.phone,
          email: input.email,
          occasion: input.occasion,
          message: input.message,
          locale: input.locale,
          kind: input.event ? "event" : "table",
          event_type: input.event?.eventType ?? null,
          event_space: input.event?.space ?? null,
          company: input.event?.company ?? null,
        }),
      });
      return fromRow(row);
    },
    async list(fromDate) {
      const query = `?select=*&reservation_date=gte.${encodeURIComponent(fromDate)}&order=reservation_date.asc,reservation_time.asc`;
      return (await call(endpoint + query, { method: "GET" })).map(fromRow);
    },
    async setStatus(id, status) {
      const rows = await call(`${endpoint}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return rows[0] ? fromRow(rows[0]) : null;
    },
  };
}

/* ------------------------------------------------------------------------ */

let cached: ReservationStore | null = null;

export function getReservationStore(env: Record<string, string | undefined> = process.env): ReservationStore {
  if (cached) return cached;
  cached =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseStore(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, `${tablePrefix(env)}reservations`)
      : createFileStore(env.RESERVATIONS_FILE || path.join(process.cwd(), ".data", "reservations.json"));
  return cached;
}

/** Première date affichée dans l'espace réservations : une semaine en arrière. */
export function adminListStart(now: Date = new Date()): string {
  return addDays(todayInTunis(now), -7);
}
