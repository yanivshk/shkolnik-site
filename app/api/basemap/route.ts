/**
 * GET /api/basemap?l=base|ref&z=..&x=..&y=.. — אריח מפה כהה (Esri World Dark Gray) למכ"ם הגשם, דרך השרת שלנו.
 * base = רקע, ref = שמות ערים וגבולות (מעל שכבת הגשם).
 */
const LAYER: Record<string, string> = {
  base: "Canvas/World_Dark_Gray_Base",
  ref: "Canvas/World_Dark_Gray_Reference",
};

export async function GET(req: Request) {
  const u = new URL(req.url);
  const l = LAYER[u.searchParams.get("l") ?? ""];
  const z = Number(u.searchParams.get("z"));
  const x = Number(u.searchParams.get("x"));
  const y = Number(u.searchParams.get("y"));
  const ok = (n: number) => Number.isInteger(n) && n >= 0 && n < 2 ** z;
  if (!l || !(z >= 3 && z <= 9) || !ok(x) || !ok(y)) return new Response("bad request", { status: 400 });
  try {
    const r = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/${l}/MapServer/tile/${z}/${y}/${x}`, { next: { revalidate: 604800 }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return new Response(null, { status: 502 });
    return new Response(await r.arrayBuffer(), {
      headers: { "Content-Type": r.headers.get("content-type") ?? "image/png", "Cache-Control": "public, max-age=604800, s-maxage=604800" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
