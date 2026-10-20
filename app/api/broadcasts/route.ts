import { BROADCAST_REVALIDATE, addDays, getBroadcasts, getChampions, isValidDate, israelToday } from "@/lib/broadcasts";

/** GET /api/broadcasts?from=YYYY-MM-DD[&kind=ucl] — משחקי הקבוצות שלנו (או ליגת האלופות) בטלוויזיה, שבוע מהתאריך */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const from = params.get("from") ?? israelToday();
  const today = israelToday();
  if (!isValidDate(from) || from < addDays(today, -60) || from > addDays(today, 120)) {
    return Response.json({ error: "bad date" }, { status: 400 });
  }
  const data = params.get("kind") === "ucl" ? await getChampions(from) : await getBroadcasts(from);
  return Response.json(data, { headers: { "Cache-Control": `public, s-maxage=${BROADCAST_REVALIDATE}, stale-while-revalidate=600` } });
}
