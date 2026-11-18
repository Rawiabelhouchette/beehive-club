import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { sampleEvents } from "../src/content/events";
import { settings } from "../src/content/settings";
import { fill, preferredLocale } from "../src/i18n/config";
import { checkBasicAuth } from "../src/lib/basic-auth";
import { commonOpeningTime, openStatus } from "../src/lib/hours";
import { TIME_SLOTS, validateReservation } from "../src/lib/reservation-rules";
import { createFileStore } from "../src/lib/reservations";
import { createRateLimiter } from "../src/lib/rate-limit";
import { createSessionToken, verifySessionToken } from "../src/lib/session";
import { skyPhase, sunTimes } from "../src/lib/sun";
import { addDays, formatTime, hhmmInTunis, todayInTunis, weekdayOf } from "../src/lib/time";

const NOW = new Date("2026-10-31T15:00:00Z"); // 16 h à Tunis

test("coucher du soleil à Gammarth fin octobre ≈ 17 h 20", () => {
  const times = sunTimes("2026-10-31", settings.geo.lat, settings.geo.lng);
  assert.ok(times);
  const sunset = hhmmInTunis(times.sunset);
  const sunrise = hhmmInTunis(times.sunrise);
  assert.match(sunset, /^17:(1\d|2\d)$/, `coucher calculé : ${sunset}`);
  assert.match(sunrise, /^06:(4\d|5\d)$/, `lever calculé : ${sunrise}`);
});

test("coucher du soleil en été ≈ 19 h 30", () => {
  const times = sunTimes("2026-06-21", settings.geo.lat, settings.geo.lng)!;
  assert.match(hhmmInTunis(times.sunset), /^19:[2-4]\d$/);
});

test("phases du ciel", () => {
  const times = sunTimes("2026-10-31", settings.geo.lat, settings.geo.lng)!;
  const at = (offsetMin: number) => new Date(times.sunset.getTime() + offsetMin * 60_000);
  assert.equal(skyPhase(at(-180), times), "day");
  assert.equal(skyPhase(at(-30), times), "golden");
  assert.equal(skyPhase(at(20), times), "dusk");
  assert.equal(skyPhase(at(150), times), "night");
  assert.equal(skyPhase(new Date(times.sunrise.getTime() - 60_000), times), "night");
});

test("dates et heures à Tunis", () => {
  assert.equal(todayInTunis(new Date("2026-10-31T23:30:00Z")), "2026-11-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(weekdayOf("2026-10-31"), 6);
  assert.equal(formatTime("18:00", "fr"), "18 h");
  assert.equal(formatTime("17:05", "fr"), "17 h 05");
  assert.equal(formatTime("18:00", "en"), "6 pm");
  assert.equal(formatTime("00:30", "en"), "12:30 am");
});

test("ouvert / fermé, y compris après minuit", () => {
  // Horaires de test : 18 h – 2 h, et 1 h le dimanche.
  const h = [1, 2, 3, 4, 5, 6].map((day) => ({ day, open: "18:00", close: "02:00" })).concat({ day: 0, open: "18:00", close: "01:00" });
  assert.deepEqual(openStatus(h, 6, 16 * 60), { state: "opens-later", opensAt: "18:00" });
  assert.deepEqual(openStatus(h, 6, 21 * 60), { state: "open", closesAt: "02:00" });
  // Dimanche 1 h du matin : encore ouvert depuis samedi soir.
  assert.deepEqual(openStatus(h, 0, 60), { state: "open", closesAt: "02:00" });
  // Lundi 1 h 30 : dimanche ferme à 1 h → fermé, réouvre à 18 h.
  assert.deepEqual(openStatus(h, 1, 90), { state: "opens-later", opensAt: "18:00" });
  assert.equal(commonOpeningTime(h), "18:00");
});

test("soirées annoncées : jamais dans le passé, triées", () => {
  const events = sampleEvents("2026-11-19", 6);
  assert.equal(events[0].date, "2026-11-19"); // jeudi, VIP 1001 Nuits
  assert.ok(events.every((e) => e.date >= "2026-11-19"));
  for (let i = 1; i < events.length; i++) assert.ok(events[i].date > events[i - 1].date);
  assert.equal(sampleEvents("2026-11-22").length, 0, "rien d'inventé après la dernière affiche");
});

test("validation des réservations", () => {
  const valid = {
    date: "2026-11-06",
    time: "21:00",
    guests: "4",
    name: "  Sarra   Ben Ali ",
    phone: "+216 98 765 432",
    email: "",
    occasion: "birthday",
    message: "",
    locale: "fr",
  };
  const ok = validateReservation(valid, NOW);
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.data.name, "Sarra Ben Ali");
    assert.equal(ok.data.guests, 4);
    assert.equal(ok.data.email, null);
  }

  const bad = validateReservation(
    { ...valid, date: "2026-10-30", time: "16:30", guests: 40, name: "S", phone: "123", email: "nope", occasion: "x" },
    NOW,
  );
  assert.ok(!bad.ok);
  if (!bad.ok) {
    assert.deepEqual(Object.keys(bad.errors).sort(), ["date", "email", "guests", "name", "occasion", "phone", "time"]);
  }
  assert.equal(TIME_SLOTS[0], "20:30");
  assert.equal(TIME_SLOTS[TIME_SLOTS.length - 1], "23:30");
});

test("stockage fichier : création, liste, changement de statut", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "bee-"));
  const file = path.join(dir, "reservations.json");
  const store = createFileStore(file);
  const parsed = validateReservation(
    { date: "2026-11-07", time: "21:30", guests: 2, name: "Yassine", phone: "22 333 444", occasion: "", locale: "en" },
    NOW,
  );
  assert.ok(parsed.ok);
  if (!parsed.ok) return;

  // Créations simultanées : aucune ne doit se perdre.
  const created = await Promise.all([store.create(parsed.data), store.create({ ...parsed.data, time: "21:00" })]);
  const list = await store.list("2026-11-01");
  assert.equal(list.length, 2);
  assert.equal(list[0].time, "21:00");
  assert.equal(list[0].status, "pending");

  const updated = await store.setStatus(created[0].id, "confirmed");
  assert.equal(updated?.status, "confirmed");
  const onDisk = JSON.parse(await readFile(file, "utf8"));
  assert.equal(onDisk.find((r: { id: string }) => r.id === created[0].id).status, "confirmed");
  assert.equal(await store.setStatus("inconnu", "declined"), null);
});

test("session admin signée", async () => {
  const token = await createSessionToken("secret", Date.now(), 60);
  assert.ok(await verifySessionToken(token, "secret"));
  assert.ok(!(await verifySessionToken(token, "autre-secret")));
  assert.ok(!(await verifySessionToken(token, "secret", Date.now() + 61_000)));
  assert.ok(!(await verifySessionToken(token.replace(/.$/, "x"), "secret")));
  assert.ok(!(await verifySessionToken("n'importe quoi", "secret")));
});

test("authentification basique de la démo", () => {
  const header = `Basic ${btoa("tangerine:sunset")}`;
  assert.ok(checkBasicAuth(header, "tangerine", "sunset"));
  assert.ok(!checkBasicAuth(header, "tangerine", "sunrise"));
  assert.ok(!checkBasicAuth("Basic !!!", "tangerine", "sunset"));
  assert.ok(!checkBasicAuth(null, "tangerine", "sunset"));
});

test("langue préférée et gabarits", () => {
  assert.equal(preferredLocale("en-US,en;q=0.9,fr;q=0.8"), "en");
  assert.equal(preferredLocale("ar-TN,ar;q=0.9,fr;q=0.8,en;q=0.7"), "fr");
  assert.equal(preferredLocale(null), "fr");
  assert.equal(fill("Merci {name}, {n} pers.", { name: "Ines", n: 3 }), "Merci Ines, 3 pers.");
});

test("limite de requêtes", () => {
  const allow = createRateLimiter(2, 1000);
  assert.ok(allow("ip", 0));
  assert.ok(allow("ip", 10));
  assert.ok(!allow("ip", 20));
  assert.ok(allow("ip", 1500));
});

test("numéros WhatsApp au format international", async () => {
  const { internationalNumber } = await import("../src/lib/site");
  assert.equal(internationalNumber("98 765 432"), "21698765432");
  assert.equal(internationalNumber("+216 22 333 444"), "21622333444");
  assert.equal(internationalNumber("00216 22 333 444"), "21622333444");
  assert.equal(internationalNumber("+44 7700 900123"), "447700900123");
});

/* --- Privatisation, admin, export ------------------------------------------------------------ */

const eventRequest = {
  date: "2026-12-12",
  time: "22:00",
  guests: "40",
  name: "Société Atlas",
  phone: "+216 71 000 111",
  email: "events@atlas.tn",
  eventType: "corporate",
  space: "full",
  company: "Atlas SA",
  message: "Afterwork de fin d'année",
  locale: "fr",
};

test("privatisation : validation", async () => {
  const { validateEventRequest } = await import("../src/lib/reservation-rules");
  const ok = validateEventRequest(eventRequest, NOW);
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.data.guests, 40);
    assert.deepEqual(ok.data.event, { eventType: "corporate", space: "full", company: "Atlas SA" });
  }
  const bad = validateEventRequest({ ...eventRequest, guests: 8, eventType: "rave", space: "", company: "x".repeat(81) }, NOW);
  assert.ok(!bad.ok);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["company", "eventType", "guests", "space"]);
  // Une table de 12 reste une réservation classique ; au-delà, c'est une privatisation.
  assert.ok(!validateReservation({ ...eventRequest, guests: 13, occasion: "" }, NOW).ok);
});

test("traitement commun des demandes : robot, limite, validation, enregistrement", async () => {
  const { handleBooking } = await import("../src/lib/booking-handler");
  const dir = await mkdtemp(path.join(tmpdir(), "bee-"));
  const store = createFileStore(path.join(dir, "r.json"));
  // 2 demandes par minute ; la demande du robot est écartée avant et ne compte pas.
  const allow = createRateLimiter(2, 60_000);
  const deps = { store, allow, now: NOW };

  assert.equal((await handleBooking({ website: "spam" }, "1.1.1.1", "table", deps)).status, 201);
  assert.equal((await store.list("2000-01-01")).length, 0, "le robot n'est pas enregistré");

  const invalid = await handleBooking({ name: "x" }, "1.1.1.1", "table", deps);
  assert.equal(invalid.status, 400);

  const event = await handleBooking(eventRequest, "1.1.1.1", "event", deps);
  assert.equal(event.status, 201);
  assert.equal(event.created?.kind, "event");

  assert.equal((await handleBooking(eventRequest, "1.1.1.1", "event", deps)).status, 429, "3e demande comptée : bloquée");
  assert.equal((await handleBooking(eventRequest, "2.2.2.2", "event", deps)).status, 201, "autre appareil accepté");
});

test("stockage : anciennes réservations sans type lues comme des tables", async () => {
  const { writeFile } = await import("node:fs/promises");
  const dir = await mkdtemp(path.join(tmpdir(), "bee-"));
  const file = path.join(dir, "r.json");
  await writeFile(file, JSON.stringify([{ id: "a", createdAt: "2026-10-31T10:00:00Z", status: "pending", date: "2026-11-02", time: "20:00", guests: 2, name: "Ancien", phone: "22333444", email: null, occasion: null, message: null, locale: "fr" }]));
  const [old] = await createFileStore(file).list("2026-11-01");
  assert.equal(old.kind, "table");
  assert.equal(old.event, null);
});

test("admin : couverts par soir et filtres", async () => {
  const { coversByDate, filterReservations } = await import("../src/lib/admin-stats");
  const base = { createdAt: "", time: "20:00", phone: "", email: null, occasion: null, message: null, locale: "fr" as const, event: null };
  const items = [
    { ...base, id: "1", date: "2026-11-06", guests: 4, status: "confirmed" as const, kind: "table" as const, name: "A" },
    { ...base, id: "2", date: "2026-11-06", guests: 2, status: "pending" as const, kind: "table" as const, name: "B" },
    { ...base, id: "3", date: "2026-11-06", guests: 6, status: "declined" as const, kind: "table" as const, name: "C" },
    { ...base, id: "4", date: "2026-11-07", guests: 30, status: "pending" as const, kind: "event" as const, name: "D", event: { eventType: "birthday" as const, space: "partial" as const, company: null } },
  ];
  assert.deepEqual(coversByDate(items).get("2026-11-06"), { total: 6, confirmed: 4 });
  assert.deepEqual(filterReservations(items, "events").map((r) => r.id), ["4"]);
  assert.deepEqual(filterReservations(items, "pending").map((r) => r.id), ["2", "4"]);
});

test("export CSV lisible par Excel et protégé contre les formules", async () => {
  const { reservationsToCsv } = await import("../src/lib/csv");
  const csv = reservationsToCsv([
    { id: "1", createdAt: "2026-10-31T18:00:00Z", status: "confirmed", kind: "event", date: "2026-12-12", time: "19:00", guests: 40, name: "=HYPERLINK(\"x\")", phone: "+216 71 000 111", email: null, occasion: null, message: "Ligne 1; avec \"guillemets\"", locale: "fr", event: { eventType: "corporate", space: "full", company: "Atlas" } },
  ]);
  assert.ok(csv.startsWith("﻿Date;Heure;Nom"), "BOM + en-têtes");
  assert.ok(csv.includes("\r\n"), "fins de ligne Windows");
  assert.ok(csv.includes("'=HYPERLINK"), "formule neutralisée");
  assert.ok(csv.includes(";00216 71 000 111;"), "téléphone gardé en texte");
  assert.ok(csv.includes('"Ligne 1; avec ""guillemets"""'), "guillemets et ; échappés");
  assert.ok(csv.includes("Privatisation;Événement d'entreprise ou afterwork;Tout le club;Atlas"));
});

test("e-mail à l'équipe pour une privatisation", async () => {
  const { notificationEmail } = await import("../src/lib/notify");
  const mail = notificationEmail(
    { id: "1", createdAt: "", status: "pending", kind: "event", date: "2026-12-12", time: "19:00", guests: 40, name: "Atlas", phone: "+216 71 000 111", email: null, occasion: null, message: null, locale: "fr", event: { eventType: "corporate", space: "full", company: "Atlas SA" } },
    "https://bee.example/",
  );
  assert.equal(mail.subject, "Privatisation : 40 invités le 2026-12-12");
  assert.match(mail.text, /Formule : Tout le club/);
  assert.match(mail.text, /https:\/\/bee\.example\/fr\/admin\?status=events/);
});

test("Supabase : clé secrète dans apikey uniquement, ancienne clé JWT aussi dans Authorization", async () => {
  const { createSupabaseStore } = await import("../src/lib/reservations");
  const calls: { url: string; headers: Record<string, string>; body?: string }[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string>, body: init.body as string });
    const row = { id: "x", created_at: "2026-10-31T10:00:00Z", reservation_date: "2026-11-06", reservation_time: "20:00", guests: 40, name: "Atlas", phone: "22333444", email: null, occasion: null, message: null, locale: "fr", status: "pending", kind: "event", event_type: "corporate", event_space: "full", company: "Atlas SA" };
    return new Response(JSON.stringify([row]), { status: 201 });
  }) as typeof fetch;
  try {
    const input = { date: "2026-11-06", time: "20:00", guests: 40, name: "Atlas", phone: "22333444", email: null, occasion: null, message: null, locale: "fr" as const, event: { eventType: "corporate" as const, space: "full" as const, company: "Atlas SA" } };
    const created = await createSupabaseStore("https://abc.supabase.co/", "sb_secret_123").create(input);
    assert.equal(calls[0].url, "https://abc.supabase.co/rest/v1/reservations");
    assert.equal(calls[0].headers.apikey, "sb_secret_123");
    assert.equal(calls[0].headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(calls[0].body!).kind, "event");
    assert.equal(created.kind, "event");
    assert.equal(created.event?.space, "full");

    await createSupabaseStore("https://abc.supabase.co", "eyJlegacy").list("2026-11-01");
    assert.equal(calls[1].headers.Authorization, "Bearer eyJlegacy");
    assert.match(calls[1].url, /reservation_date=gte\.2026-11-01/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("fermé pour la saison : statut, période de réservation, refus avant la réouverture", async () => {
  const { isClosedForSeason, bookingStart } = await import("../src/lib/season");
  const { bookingWindow, validateEventRequest } = await import("../src/lib/reservation-rules");
  const { handleBooking } = await import("../src/lib/booking-handler");
  const { formatMonthYear } = await import("../src/lib/time");
  const reopensOn = "2027-06-01";

  assert.equal(isClosedForSeason(reopensOn, "2026-11-01"), true);
  assert.equal(isClosedForSeason(reopensOn, "2027-06-01"), false, "ouvert le jour de la réouverture");
  assert.equal(isClosedForSeason(null, "2026-11-01"), false, "pas de date : ouvert");
  assert.equal(bookingStart(reopensOn, "2026-11-01"), reopensOn);
  assert.equal(bookingStart(reopensOn, "2027-07-10"), "2027-07-10");
  assert.deepEqual(bookingWindow("2026-11-01", 90, reopensOn), { min: "2027-06-01", max: "2027-08-30" });
  assert.deepEqual(bookingWindow("2026-11-01", 90, null), { min: "2026-11-01", max: "2027-01-30" });

  assert.equal(formatMonthYear(reopensOn, "fr"), "juin 2027");
  assert.equal(formatMonthYear(reopensOn, "en"), "June 2027");

  const table = {
    time: "21:00",
    guests: "4",
    name: "Sarra Ben Ali",
    phone: "+216 98 765 432",
    email: "",
    occasion: "",
    message: "",
    locale: "fr",
  };
  const early = validateReservation({ ...table, date: "2026-11-06" }, NOW, reopensOn);
  assert.ok(!early.ok, "pas de table pendant la fermeture");
  if (!early.ok) assert.deepEqual(Object.keys(early.errors), ["date"]);
  assert.ok(validateReservation({ ...table, date: "2027-06-12" }, NOW, reopensOn).ok, "table dès la réouverture");
  assert.ok(!validateReservation({ ...table, date: "2027-06-12" }, NOW).ok, "sans fermeture : trop loin (90 jours)");

  assert.ok(!validateEventRequest({ ...eventRequest, date: "2027-01-15" }, NOW, reopensOn).ok);
  assert.ok(validateEventRequest({ ...eventRequest, date: "2027-07-03" }, NOW, reopensOn).ok);

  const dir = await mkdtemp(path.join(tmpdir(), "bee-"));
  const store = createFileStore(path.join(dir, "r.json"));
  const deps = { store, allow: createRateLimiter(10, 60_000), now: NOW, reopensOn };
  assert.equal((await handleBooking({ ...table, date: "2026-11-20" }, "3.3.3.3", "table", deps)).status, 400);
  assert.equal((await handleBooking({ ...table, date: "2027-06-05" }, "3.3.3.3", "table", deps)).status, 201);
});

test("démo privée : lien avec code et page d'accès", async () => {
  const { demoAccessToken, demoGatePage, DEMO_PARAM } = await import("../src/lib/demo-access");
  const a = await demoAccessToken("12345678");
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, await demoAccessToken("12345678"), "même code, même cookie");
  assert.notEqual(a, await demoAccessToken("autre-code"));
  assert.ok(!a.includes("12345678"), "le cookie ne contient pas le code");

  const fr = demoGatePage({ english: false, error: false });
  assert.ok(fr.includes(`name="${DEMO_PARAM}"`) && fr.includes("Code d'accès") && !fr.includes('role="alert"'));
  const en = demoGatePage({ english: true, error: true });
  assert.ok(en.includes('lang="en"') && en.includes("Access code") && en.includes('role="alert"'));
});

test("Beehive : tous les soirs de 20 h 30 à 4 h", () => {
  assert.deepEqual(openStatus(settings.hours, 2, 15 * 60), { state: "opens-later", opensAt: "20:30" });
  assert.deepEqual(openStatus(settings.hours, 5, 23 * 60), { state: "open", closesAt: "04:00" });
  // Samedi 2 h du matin : la soirée du vendredi continue.
  assert.deepEqual(openStatus(settings.hours, 6, 120), { state: "open", closesAt: "04:00" });
  assert.equal(commonOpeningTime(settings.hours), "20:30");
});

test("Beehive : la soirée en cours, y compris après minuit", async () => {
  const { clubNight } = await import("../src/lib/night");
  // Vendredi 20 novembre 2026, 23 h à Tunis : soirée du vendredi.
  assert.deepEqual(clubNight(new Date("2026-11-20T22:00:00Z")), { date: "2026-11-20", weekday: 5, late: false });
  // Samedi 21 novembre, 2 h à Tunis : c'est encore la soirée du vendredi.
  assert.deepEqual(clubNight(new Date("2026-11-21T01:00:00Z")), { date: "2026-11-20", weekday: 5, late: true });
});

test("Beehive : le programme reprend les affiches de la semaine", async () => {
  const { eventOn } = await import("../src/content/events");
  const week = sampleEvents("2026-11-17", 7);
  assert.deepEqual(week.map((e) => e.title.fr), ["Firas Zayoud", "Zied Saiid", "VIP 1001 Nuits", "Wathik Fekih", "Alianza"]);
  assert.ok(week.every((e) => e.lineup.fr.includes("DJ Alvez")), "DJ Alvez chaque soir");
  assert.equal(eventOn("2026-11-20")?.lineup.fr, "Live band, DJ Alvez");
  assert.equal(eventOn("2026-11-22"), null, "dimanche : pas de soirée annoncée");
  assert.equal(new Set(week.map((e) => e.id)).size, 5);
});

test("Beehive : pas de carte inventée, tables Supabase partagées avec un préfixe", async () => {
  const { menu } = await import("../src/content/menu");
  assert.equal(menu.length, 0, "la carte attend celle de l'établissement");
  const { tablePrefix } = await import("../src/lib/reservations");
  assert.equal(tablePrefix({ SUPABASE_TABLE_PREFIX: "bee_" }), "bee_");
  assert.equal(tablePrefix({ SUPABASE_TABLE_PREFIX: " bee_ " }), "bee_");
  assert.equal(tablePrefix({ SUPABASE_TABLE_PREFIX: "drop table;" }), "");
  assert.equal(tablePrefix({}), "");
});

test("adresse du site : tolère les erreurs de saisie dans Netlify", async () => {
  const { siteUrl } = await import("../src/lib/site");
  const before = process.env.NEXT_PUBLIC_SITE_URL;
  const check = (value: string | undefined, expected: string) => {
    if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = value;
    assert.equal(siteUrl(), expected, JSON.stringify(value));
  };
  check("https://beehive-club-demo.netlify.app", "https://beehive-club-demo.netlify.app");
  check("https://beehive-club-demo.netlify.app/", "https://beehive-club-demo.netlify.app");
  check("beehive-club-demo.netlify.app", "https://beehive-club-demo.netlify.app");
  check(' "https://beehive-club-demo.netlify.app" ', "https://beehive-club-demo.netlify.app");
  check("https://beehive-club-demo.netlify.app/fr", "https://beehive-club-demo.netlify.app");
  check("pas une adresse !", "http://localhost:3000");
  check(undefined, "http://localhost:3000");
  if (before === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = before;
});

test("visites de la démo : appareil, navigateur, aperçus de lien", async () => {
  const { browserOf, describeVisit, deviceOf, geoOf, isPreviewBot } = await import("../src/lib/visits");
  const iphoneInsta =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 357.0.0.25.101";
  const windowsChrome =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
  const iphoneSafari =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
  assert.equal(deviceOf(iphoneInsta), "téléphone");
  assert.equal(browserOf(iphoneInsta), "Instagram");
  assert.equal(deviceOf(windowsChrome), "ordinateur");
  assert.equal(browserOf(windowsChrome), "Chrome");
  assert.equal(browserOf(iphoneSafari), "Safari");
  assert.ok(isPreviewBot("WhatsApp/2.24.1 A"));
  assert.ok(isPreviewBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"));
  assert.ok(!isPreviewBot(iphoneInsta));

  const geo = btoa(JSON.stringify({ city: "Tunis", country: { code: "TN", name: "Tunisia" } }));
  const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null });
  assert.deepEqual(geoOf(headers({ "x-nf-geo": geo })), { city: "Tunis", country: "Tunisia" });
  assert.deepEqual(geoOf(headers({ "x-country": "TN" })), { city: "", country: "TN" });

  const now = new Date("2026-11-09T17:15:00Z");
  const link = describeVisit({ path: "/fr", userAgent: iphoneInsta, headers: headers({ "x-nf-geo": geo }), viaLink: true, now });
  assert.deepEqual(link, {
    at: "2026-11-09T17:15:00.000Z",
    path: "/fr",
    kind: "lien",
    device: "téléphone",
    browser: "Instagram",
    city: "Tunis",
    country: "Tunisia",
  });
  assert.equal(describeVisit({ path: "/fr/carte", userAgent: windowsChrome, headers: headers({}), viaLink: false })?.kind, "page");
  assert.equal(describeVisit({ path: "/fr", userAgent: "WhatsApp/2.24.1 A", headers: headers({}), viaLink: true })?.kind, "apercu");
  // Ni les préchargements de Next.js, ni l'espace équipe.
  assert.equal(describeVisit({ path: "/fr/carte", userAgent: windowsChrome, headers: headers({ "next-router-prefetch": "1" }), viaLink: false }), null);
  assert.equal(describeVisit({ path: "/fr/admin", userAgent: windowsChrome, headers: headers({}), viaLink: false }), null);
});
