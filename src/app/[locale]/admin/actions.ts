"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";
import { isAdmin } from "@/lib/admin-auth";
import { safeEqual } from "@/lib/basic-auth";
import { getReservationStore, RESERVATION_STATUSES, type ReservationStatus } from "@/lib/reservations";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_SECONDS, sessionSecret } from "@/lib/session";
import { siteUrl } from "@/lib/site";

function localeOf(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return isLocale(value) ? value : "fr";
}

export async function loginAction(formData: FormData) {
  const locale = localeOf(formData);
  const expected = process.env.ADMIN_PASSWORD;
  const secret = sessionSecret();
  const password = String(formData.get("password") ?? "");

  if (!expected || !secret || !safeEqual(password, expected)) {
    // Petite pause pour ralentir les essais en série.
    await new Promise((resolve) => setTimeout(resolve, 700));
    redirect(`/${locale}/admin/login?error=1`);
  }

  const token = await createSessionToken(secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: siteUrl().startsWith("https://"),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect(`/${locale}/admin`);
}

export async function logoutAction(formData: FormData) {
  const locale = localeOf(formData);
  (await cookies()).delete(SESSION_COOKIE);
  redirect(`/${locale}/admin/login`);
}

export async function setStatusAction(formData: FormData) {
  const locale = localeOf(formData);
  if (!(await isAdmin())) redirect(`/${locale}/admin/login`);

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ReservationStatus;
  if (!id || !RESERVATION_STATUSES.includes(status)) return;

  await getReservationStore().setStatus(id, status);
  revalidatePath(`/${locale}/admin`);
}
