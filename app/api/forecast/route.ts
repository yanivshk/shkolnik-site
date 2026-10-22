import { getHourly } from "@/lib/weather";

/** GET /api/forecast?lat=..&lon=.. — טמפרטורה, לחות וסיכוי לגשם לשעה-שעה לשבוע (לגרף מזג האוויר בדף הים) */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lon = Number(u.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: "bad location" }, { status: 400 });
  }
  const hours = await getHourly(lat, lon);
  if (!hours) return Response.json({ error: "unavailable" }, { status: 503 });
  return Response.json(hours, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=1800" } });
}
