import { BROADCAST_REVALIDATE, addDays, getBroadcasts, isValidDate, israelToday } from "@/lib/broadcasts";

/** GET /api/broadcasts?from=YYYY-MM-DD — משחקי הקבוצות שלנו בטלוויזיה, שבוע מהתאריך */
export async function GET(req: Request) {
  const from = new URL(req.url).searchParams.get("from") ?? israelToday();
  const today = israelToday();
  if (!isValidDate(from) || from < addDays(today, -60) || from > addDays(today, 120)) {
    return Response.json({ error: "bad date" }, { status: 400 });
  }
  const data = await getBroadcasts(from);
  return Response.json(data, { headers: { "Cache-Control": `public, s-maxage=${BROADCAST_REVALIDATE}, stale-while-revalidate=600` } });
}
