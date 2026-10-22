/**
 * GET /api/radar/tile?p=/v2/radar/<id>&z=7&x=..&y=.. — אריח מכ"ם גשם (RainViewer), דרך השרת שלנו.
 * תמונה של רגע מסוים לא משתנה, ולכן נשמרת בקאש יום שלם.
 */
const PATH = /^\/v2\/radar\/[0-9a-z]{6,40}$/i;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = u.searchParams.get("p") ?? "";
  const z = Number(u.searchParams.get("z"));
  const x = Number(u.searchParams.get("x"));
  const y = Number(u.searchParams.get("y"));
  const ok = (n: number) => Number.isInteger(n) && n >= 0 && n < 2 ** z;
  if (!PATH.test(p) || !(z >= 3 && z <= 7) || !ok(x) || !ok(y)) return new Response("bad request", { status: 400 });

  if (process.env.MOCK_DATA === "1") return mockTile(p, z, x, y);
  try {
    const r = await fetch(`https://tilecache.rainviewer.com${p}/256/${z}/${x}/${y}/2/1_1.png`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return new Response(null, { status: 502 });
    return new Response(await r.arrayBuffer(), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable" } });
  } catch {
    return new Response(null, { status: 502 });
  }
}

/** נתוני דמה: כתם גשם שזז מהים מזרחה (SVG) */
function mockTile(p: string, z: number, x: number, y: number) {
  const i = Number(p.match(/mockframe(\d+)/)?.[1] ?? 0);
  // מרכז הכתם בפיקסלים של זום 7: מתחיל מערבית לחוף ונע מזרחה
  const cx = 19440 + i * 10 - x * 256 * 2 ** (7 - z), cy = 13280 - i * 3 - y * 256 * 2 ** (7 - z);
  const s = 2 ** (z - 7);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><radialGradient id="g"><stop offset="0" stop-color="#1e3cff" stop-opacity="0.9"/><stop offset="0.35" stop-color="#2f7cf6" stop-opacity="0.75"/><stop offset="1" stop-color="#7fd3ff" stop-opacity="0"/></radialGradient></defs><ellipse cx="${cx * s}" cy="${cy * s}" rx="${70 * s}" ry="${42 * s}" fill="url(#g)"/></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
}
