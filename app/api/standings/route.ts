import { getStandings } from "@/lib/standings";

export const dynamic = "force-dynamic";

/** GET /api/standings — כל הטבלאות, כולל מצב חי של משחקים שמתקיימים עכשיו */
export async function GET() {
  const data = await getStandings();
  return Response.json(data, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=20" } });
}
