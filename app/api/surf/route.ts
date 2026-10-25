import { getSurf, getSurfAt, MAX_SURF_DAYS, SURF_REVALIDATE } from "@/lib/surf";
import { spotById } from "@/lib/surf-spots";

/**
 * GET /api/surf?spot=60&days=7 — חוף מהרשימה הקבועה
 * GET /api/surf?lat=..&lon=..&name=..&days=7 — כל עיר; בלי ים בנקודה הזו → 404 {error:"no-sea"}
 * days: 1 (ברירת מחדל) עד 7
 */
export async function GET(req: Request) {
  const u = new URL(req.url).searchParams;
  const days = Number(u.get("days") ?? 1);
  if (!Number.isInteger(days) || days < 1 || days > MAX_SURF_DAYS) return Response.json({ error: "bad days" }, { status: 400 });

  let s;
  if (u.has("spot")) {
    const id = Number(u.get("spot"));
    if (!spotById(id)) return Response.json({ error: "bad spot" }, { status: 400 });
    s = await getSurf(id, days);
  } else {
    const lat = Number(u.get("lat"));
    const lon = Number(u.get("lon"));
    const name = (u.get("name") ?? "").trim().slice(0, 60);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return Response.json({ error: "bad location" }, { status: 400 });
    }
    s = await getSurfAt({ id: -1, name, lat: Math.round(lat * 1e4) / 1e4, lon: Math.round(lon * 1e4) / 1e4 }, days);
    if (!s) return Response.json({ error: "no-sea" }, { status: 404, headers: { "Cache-Control": `public, s-maxage=${SURF_REVALIDATE}` } });
  }
  if (!s) return Response.json({ error: "unavailable" }, { status: 503 });
  return Response.json(s, { headers: { "Cache-Control": `public, s-maxage=${SURF_REVALIDATE}, stale-while-revalidate=600` } });
}
