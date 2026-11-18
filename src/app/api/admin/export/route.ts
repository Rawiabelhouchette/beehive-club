import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { reservationsToCsv } from "@/lib/csv";
import { adminListStart, getReservationStore } from "@/lib/reservations";
import { todayInTunis } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Export CSV des réservations (à partir d'il y a 7 jours), réservé à l'équipe connectée. */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const reservations = await getReservationStore().list(adminListStart());
  return new NextResponse(reservationsToCsv(reservations), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-beehive-${todayInTunis()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
