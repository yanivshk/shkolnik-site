import { calendar } from "@/lib/ics";

/**
 * אירוע יומן (.ics) למשחק בודד מלוח השידורים — באייפון נפתח ישר "הוסף ליומן".
 * הפרמטרים מגיעים מהשורה בטבלה; אין מצב בשרת. כולל תזכורת 30 דקות לפני.
 */
const clip = (s: string | null, n: number) => (s ?? "").replace(/[\r\n]+/g, " ").slice(0, n);

export function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const date = p.get("d") ?? "";
  const time = p.get("t") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return new Response("bad request", { status: 400 });
  const title = clip(p.get("title"), 120) || "משחק";
  const ics = calendar([{ date, time, title, where: clip(p.get("ch"), 80), league: clip(p.get("lg"), 80), sport: p.get("s") ?? "", key: `${date}-${title}` }]);
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="game-${date}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
