/** GET /api/team-logo?id=..&v=.. — סמל קבוצה (365Scores), דרך השרת שלנו ועם קאש ארוך */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = Number(u.searchParams.get("id"));
  const v = Number(u.searchParams.get("v") ?? 1);
  if (!Number.isInteger(id) || id <= 0 || id > 1e8 || !Number.isInteger(v) || v < 0 || v > 1000) return new Response("bad request", { status: 400 });
  try {
    const r = await fetch(`https://imagecache.365scores.com/image/upload/f_png,w_64,h_64,c_limit,q_auto:eco,dpr_2,d_Competitors:default1.png/v${v}/Competitors/${id}`, {
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return new Response(null, { status: 502 });
    return new Response(await r.arrayBuffer(), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800, s-maxage=604800" } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
