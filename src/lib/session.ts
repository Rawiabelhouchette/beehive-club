/**
 * Session de l'espace réservations : jeton signé HMAC-SHA256 stocké dans un cookie httpOnly.
 * Utilise Web Crypto, disponible à la fois dans le middleware (Edge) et dans Node.
 */
import { safeEqual } from "./basic-auth";

export const SESSION_COOKIE = "bee_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 h : une soirée de service

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(signature));
}

/** Secret de signature : ADMIN_SESSION_SECRET, ou dérivé du mot de passe administrateur. */
export function sessionSecret(env: Record<string, string | undefined> = process.env): string | null {
  if (env.ADMIN_SESSION_SECRET) return env.ADMIN_SESSION_SECRET;
  if (env.ADMIN_PASSWORD) return `bee-admin:${env.ADMIN_PASSWORD}`;
  return null;
}

export async function createSessionToken(
  secret: string,
  now: number = Date.now(),
  ttlSeconds: number = SESSION_TTL_SECONDS,
): Promise<string> {
  const expires = Math.floor(now / 1000) + ttlSeconds;
  const payload = `admin.${expires}`;
  return `${payload}.${await sign(secret, payload)}`;
}

export async function verifySessionToken(
  token: string | null | undefined,
  secret: string,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const expires = Number(parts[1]);
  if (!Number.isFinite(expires) || expires * 1000 <= now) return false;
  const expected = await sign(secret, `${parts[0]}.${parts[1]}`);
  return safeEqual(parts[2], expected);
}
