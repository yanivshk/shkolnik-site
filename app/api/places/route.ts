import { searchPlaces } from "@/lib/weather";

/** GET /api/places?q=חיפה — חיפוש יישוב לשינוי מיקום מזג האוויר */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return Response.json([]);
  const places = await searchPlaces(q);
  return Response.json(places, { headers: { "Cache-Control": "public, s-maxage=86400" } });
}
