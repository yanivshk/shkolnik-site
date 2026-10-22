/**
 * GET /api/radar — רשימת תמונות מכ"ם הגשם (RainViewer): השעתיים האחרונות, כל 10 דקות.
 * נשלף בשרת, כך שהדפדפן לא פונה לשירות חיצוני.
 */
export const revalidate = 300;

type Maps = { radar?: { past?: { time: number; path: string }[]; nowcast?: { time: number; path: string }[] } };

export async function GET() {
  if (process.env.MOCK_DATA === "1") {
    const t = Math.floor(Date.now() / 600_000) * 600;
    return Response.json({ frames: Array.from({ length: 13 }, (_, i) => ({ time: t - (12 - i) * 600, path: `/v2/radar/mockframe${i}`, forecast: false })) });
  }
  try {
    const r = await fetch("https://api.rainviewer.com/public/weather-maps.json", { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return Response.json({ frames: [] }, { status: 503 });
    const d = (await r.json()) as Maps;
    const frames = [
      ...(d.radar?.past ?? []).map((f) => ({ ...f, forecast: false })),
      ...(d.radar?.nowcast ?? []).map((f) => ({ ...f, forecast: true })),
    ];
    return Response.json({ frames }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" } });
  } catch {
    return Response.json({ frames: [] }, { status: 503 });
  }
}
