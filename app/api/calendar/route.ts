import { addDays, getBroadcasts, israelToday } from "@/lib/broadcasts";
import { calendar, eventFromBroadcast } from "@/lib/ics";

/**
 * מנוי יומן אוטומטי לכל המשחקים שבלוח השידורים (webcal).
 * נרשמים פעם אחת באייפון — והיומן מושך מכאן משחקים חדשים, שינויי שעה וערוץ, בלי שום פעולה נוספת.
 * כולל שבוע אחורה (שמשחקים שהיו לא ייעלמו מהיומן) ושבוע קדימה.
 */
export const revalidate = 1800;

export async function GET() {
  const today = israelToday();
  const day = await getBroadcasts(addDays(today, -7), 15);
  const ics = calendar(day.items.map(eventFromBroadcast), "משחקים · Shkolnik");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="shkolnik-games.ics"',
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
