import { getWeather, WEATHER_REVALIDATE } from "@/lib/weather";

/** GET /api/weather?lat=..&lon=..&name=.. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lon = Number(u.searchParams.get("lon"));
  const name = (u.searchParams.get("name") ?? "").slice(0, 60);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: "bad location" }, { status: 400 });
  }
  const w = await getWeather(lat, lon, name);
  if (!w) return Response.json({ error: "unavailable" }, { status: 503 });
  return Response.json(w, { headers: { "Cache-Control": `public, s-maxage=${WEATHER_REVALIDATE}, stale-while-revalidate=600` } });
}
