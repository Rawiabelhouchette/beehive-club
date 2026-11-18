import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionSecret, verifySessionToken } from "./session";

/** Vrai si la requête porte une session admin valide. */
export async function isAdmin(): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, secret);
}

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);
