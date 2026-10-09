import { getSurf, MAX_SURF_DAYS, SURF_REVALIDATE } from "@/lib/surf";
import { spotById } from "@/lib/surf-spots";

/** GET /api/surf?spot=60&days=7 — רק אזורים מהרשימה הקבועה; days: 1 (ברירת מחדל) עד 7 */
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("spot"));
  if (!spotById(id)) return Response.json({ error: "bad spot" }, { status: 400 });
  const days = Number(new URL(req.url).searchParams.get("days") ?? 1);
  if (!Number.isInteger(days) || days < 1 || days > MAX_SURF_DAYS) return Response.json({ error: "bad days" }, { status: 400 });
  const s = await getSurf(id, days);
  if (!s) return Response.json({ error: "unavailable" }, { status: 503 });
  return Response.json(s, { headers: { "Cache-Control": `public, s-maxage=${SURF_REVALIDATE}, stale-while-revalidate=600` } });
}
