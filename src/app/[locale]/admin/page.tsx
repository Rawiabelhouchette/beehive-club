import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { isAdmin } from "@/lib/admin-auth";
import { adminListStart, getReservationStore } from "@/lib/reservations";
import { listVisits } from "@/lib/visits";
import { ADMIN_FILTERS, AdminView, type AdminFilter } from "@/views/AdminViews";
import { logoutAction, setStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réservations",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Le middleware protège déjà la page ; cette vérification couvre les autres cas.
  if (!(await isAdmin())) redirect(`/${locale}/admin/login`);

  const query = await searchParams;
  const status = typeof query.status === "string" ? query.status : "";
  const filter: AdminFilter = ADMIN_FILTERS.includes(status as AdminFilter) ? (status as AdminFilter) : "all";

  const store = getReservationStore();
  const [reservations, visits] = await Promise.all([
    store.list(adminListStart()),
    // Suivi des visites : seulement pour la démo privée.
    process.env.DEMO_PASSWORD ? listVisits() : Promise.resolve(null),
  ]);

  return (
    <AdminView
      locale={locale}
      dict={getDictionary(locale)}
      reservations={reservations}
      filter={filter}
      storage={store.kind}
      visits={visits}
      setStatusAction={setStatusAction}
      logoutAction={logoutAction}
    />
  );
}
