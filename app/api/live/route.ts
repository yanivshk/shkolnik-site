import { NextResponse } from "next/server";
import { addDays, getBroadcasts, israelToday } from "@/lib/broadcasts";
import { getLive } from "@/lib/live";

export const dynamic = "force-dynamic";

/** מצב חי של המשחקים שבשידור עכשיו (אתמול+היום — למשחק שעובר את חצות) */
export async function GET() {
  const today = israelToday();
  const day = await getBroadcasts(addDays(today, -1), 2);
  const live = await getLive(day.items);
  return NextResponse.json({ live, items: day.items.filter((b) => live.some((l) => l.id === b.id)) }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } });
}
