import { getDailyPhoto } from "@/lib/data";

export const revalidate = 3600;

/** "לתמונה היומית" — מפנה ישירות לקובץ התמונה, כך שהדפדפן מציג רק את התמונה. */
export async function GET() {
  const photo = await getDailyPhoto();
  if (!photo) return new Response("התמונה היומית לא זמינה כרגע", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(null, { status: 307, headers: { Location: photo.src, "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
