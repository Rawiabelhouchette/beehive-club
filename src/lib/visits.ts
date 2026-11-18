/**
 * Suivi des visites de la démo privée : pour savoir si le lien envoyé a été ouvert,
 * quand, et quelles pages ont été regardées.
 *
 * - Actif seulement en démo (DEMO_PASSWORD défini) et avec Supabase (table demo_visits).
 * - Aucune adresse IP n'est enregistrée : date, page, type d'appareil, navigateur, ville.
 * - Vos propres visites ne comptent pas : connectée à l'espace équipe, ou après avoir
 *   ouvert une fois le lien avec « &moi=1 » sur chacun de vos appareils.
 * Le code doit tourner dans le middleware (Edge) : uniquement fetch, pas de fichiers.
 */

export type VisitKind = "lien" | "page" | "apercu";

export interface DemoVisit {
  at: string;
  path: string;
  kind: VisitKind;
  device: string;
  browser: string;
  city: string;
  country: string;
}

/** Cookie posé par le lien « &moi=1 » : les visites de cet appareil ne sont pas comptées. */
export const OWNER_COOKIE = "bee_owner";
export const OWNER_PARAM = "moi";

/** Robots qui lisent la page pour fabriquer un aperçu de lien (WhatsApp, Instagram, Facebook…). */
const PREVIEW_BOTS =
  /facebookexternalhit|facebookcatalog|meta-externalagent|WhatsApp|Twitterbot|Slackbot|TelegramBot|Discordbot|LinkedInBot|SkypeUriPreview|Applebot|Googlebot|Google-InspectionTool|bingbot|Pinterest|redditbot|Embedly|vkShare|HeadlessChrome|\bbot\b|crawler|spider/i;

export function isPreviewBot(userAgent: string): boolean {
  return PREVIEW_BOTS.test(userAgent);
}

export function deviceOf(userAgent: string): string {
  if (/iPad|Tablet/i.test(userAgent)) return "tablette";
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return "téléphone";
  return "ordinateur";
}

export function browserOf(userAgent: string): string {
  if (/Instagram/i.test(userAgent)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) return "Facebook";
  if (/WhatsApp/i.test(userAgent)) return "WhatsApp";
  if (/\bGSA\//.test(userAgent)) return "Google";
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/OPR\/|Opera/.test(userAgent)) return "Opera";
  if (/Firefox|FxiOS/.test(userAgent)) return "Firefox";
  if (/CriOS|Chrome\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "autre";
}

/** Ville et pays fournis par Netlify (en-tête x-nf-geo, en base64), sinon le code pays seul. */
export function geoOf(headers: { get(name: string): string | null }): { city: string; country: string } {
  const raw = headers.get("x-nf-geo");
  if (raw) {
    try {
      const geo = JSON.parse(decodeBase64(raw)) as { city?: string; country?: { code?: string; name?: string } };
      return { city: geo.city ?? "", country: geo.country?.name ?? geo.country?.code ?? "" };
    } catch {
      // En-tête illisible : on se rabat sur le code pays.
    }
  }
  return { city: "", country: headers.get("x-country") ?? "" };
}

function decodeBase64(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Visite à enregistrer pour une requête de page, ou null s'il ne faut rien compter. */
export function describeVisit(input: {
  path: string;
  userAgent: string;
  headers: { get(name: string): string | null };
  viaLink: boolean;
  now?: Date;
}): DemoVisit | null {
  const { headers } = input;
  // Préchargements de Next.js (liens visibles à l'écran) : pas des pages vues.
  if (headers.get("next-router-prefetch") || headers.get("purpose") === "prefetch") return null;
  if (/\/admin(\/|$)/.test(input.path)) return null;
  const bot = isPreviewBot(input.userAgent);
  const { city, country } = geoOf(headers);
  return {
    at: (input.now ?? new Date()).toISOString(),
    path: input.path,
    kind: bot ? "apercu" : input.viaLink ? "lien" : "page",
    device: bot ? "" : deviceOf(input.userAgent),
    browser: bot ? botName(input.userAgent) : browserOf(input.userAgent),
    city,
    country,
  };
}

function botName(userAgent: string): string {
  if (/WhatsApp/i.test(userAgent)) return "WhatsApp";
  if (/facebookexternalhit|facebookcatalog|meta-externalagent/i.test(userAgent)) return "Instagram ou Facebook";
  if (/TelegramBot/i.test(userAgent)) return "Telegram";
  if (/Slackbot/i.test(userAgent)) return "Slack";
  if (/LinkedInBot/i.test(userAgent)) return "LinkedIn";
  if (/Googlebot|Google-InspectionTool/i.test(userAgent)) return "Google";
  if (/Applebot/i.test(userAgent)) return "Apple";
  return "robot";
}

/** Variables d'environnement (process.env), comme pour le stockage des réservations. */
type SupabaseEnv = Record<string, string | undefined>;

function supabase(env: SupabaseEnv) {
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (key.startsWith("eyJ")) headers.Authorization = `Bearer ${key}`;
  // Même préfixe de tables que les réservations (SUPABASE_TABLE_PREFIX).
  const raw = (env.SUPABASE_TABLE_PREFIX ?? "").trim();
  const prefix = /^[a-z][a-z0-9_]*$/.test(raw) ? raw : "";
  return { url: `${url}/rest/v1/${prefix}demo_visits`, headers };
}

/** Enregistre une visite ; ne bloque jamais la page plus de 1,5 s et n'échoue jamais. */
export async function recordVisit(visit: DemoVisit, env: SupabaseEnv = process.env): Promise<void> {
  const db = supabase(env);
  if (!db) return;
  try {
    await fetch(db.url, {
      method: "POST",
      headers: { ...db.headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        created_at: visit.at,
        path: visit.path,
        kind: visit.kind,
        device: visit.device,
        browser: visit.browser,
        city: visit.city,
        country: visit.country,
      }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Suivi au mieux : une visite non enregistrée ne doit jamais gêner le visiteur.
  }
}

/** Dernières visites, de la plus récente à la plus ancienne (liste vide si non configuré). */
export async function listVisits(limit = 80, env: SupabaseEnv = process.env): Promise<DemoVisit[] | null> {
  const db = supabase(env);
  if (!db) return null;
  try {
    const response = await fetch(
      `${db.url}?select=created_at,path,kind,device,browser,city,country&order=created_at.desc&limit=${limit}`,
      { headers: db.headers, cache: "no-store", signal: AbortSignal.timeout(4000) },
    );
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<Record<string, string | null>>;
    return rows.map((r) => ({
      at: r.created_at ?? "",
      path: r.path ?? "",
      kind: (r.kind as VisitKind) ?? "page",
      device: r.device ?? "",
      browser: r.browser ?? "",
      city: r.city ?? "",
      country: r.country ?? "",
    }));
  } catch {
    return null;
  }
}
