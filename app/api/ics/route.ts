import { israelTime } from "@/lib/tz";

/**
 * אירוע יומן (.ics) למשחק מלוח השידורים — באייפון נפתח ישר "הוסף ליומן".
 * הפרמטרים מגיעים מהשורה בטבלה; אין מצב בשרת. כולל תזכורת 30 דקות לפני.
 */
const clip = (s: string | null, n: number) => (s ?? "").replace(/[\r\n]+/g, " ").slice(0, n);
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const date = p.get("d") ?? "";
  const time = p.get("t") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return new Response("bad request", { status: 400 });
  const title = clip(p.get("title"), 120) || "משחק";
  const where = clip(p.get("ch"), 80);
  const league = clip(p.get("lg"), 80);
  const minutes = p.get("s") === "basketball" ? 135 : 120;

  const start = israelTime(date, time);
  const end = new Date(start.getTime() + minutes * 60_000);
  // מזהה יציב לאותו משחק — הוספה חוזרת מעדכנת את האירוע במקום לשכפל
  const hash = [...title].reduce((h, c) => (h * 31 + c.codePointAt(0)!) >>> 0, 7).toString(36);
  const uid = `${stamp(start)}-${hash}@shkolnik.co.il`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shkolnik Family//Broadcasts//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(title)}`,
    where && `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc([league, where && `שידור: ${where}`].filter(Boolean).join(" · "))}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(title)}`,
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="game-${date}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
