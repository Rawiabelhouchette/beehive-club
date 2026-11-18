import { after, NextResponse } from "next/server";
import { clientIp, handleBooking } from "@/lib/booking-handler";
import { getSettings } from "@/lib/content";
import { notifyNewReservation } from "@/lib/notify";
import { bookingRateLimit } from "@/lib/rate-limits";
import { getReservationStore } from "@/lib/reservations";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const { reopensOn } = await getSettings();
  const result = await handleBooking(body, clientIp(request.headers), "table", {
    store: getReservationStore(),
    allow: bookingRateLimit,
    reopensOn,
  });
  // L'e-mail part après la réponse : le client n'attend pas.
  if (result.created) {
    const created = result.created;
    after(() => notifyNewReservation(created, siteUrl()));
  }
  return NextResponse.json(result.body, { status: result.status });
}
