import { getTeslaPhoto, isTrustedImageUrl } from "@/lib/data";

export const revalidate = 3600;

/** "תמונת טסלה" — מפנה ישירות לתמונת הטסלה היומית, כך שהדפדפן מציג רק את התמונה. */
export async function GET() {
  const photo = await getTeslaPhoto();
  if (!photo || !isTrustedImageUrl(photo.src)) return new Response("תמונת הטסלה לא זמינה כרגע", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(null, { status: 307, headers: { Location: photo.src, "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
