import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { AdminLoginView } from "@/views/AdminViews";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Espace équipe",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await isAdmin()) redirect(`/${locale}/admin`);
  const query = await searchParams;

  return (
    <AdminLoginView
      locale={locale}
      dict={getDictionary(locale)}
      error={query.error === "1"}
      configured={adminConfigured()}
      loginAction={loginAction}
    />
  );
}
