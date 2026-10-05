import { getSurf, SURF_REVALIDATE } from "@/lib/surf";
import { spotById } from "@/lib/surf-spots";

/** GET /api/surf?spot=60 — רק אזורים מהרשימה הקבועה */
export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("spot"));
  if (!spotById(id)) return Response.json({ error: "bad spot" }, { status: 400 });
  const s = await getSurf(id);
  if (!s) return Response.json({ error: "unavailable" }, { status: 503 });
  return Response.json(s, { headers: { "Cache-Control": `public, s-maxage=${SURF_REVALIDATE}, stale-while-revalidate=600` } });
}
