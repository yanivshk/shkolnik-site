import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/** עמוד הבית הוא העמוד הראשי לחיפוש "יניב שקולניק" — הכתבה לא נכללת כדי שלא תתחרה בו */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "monthly") =>
    ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    page("/sea", 0.6, "daily"),
    page("/tomer-shkolnik", 0.8),
    page("/guy-shkolnik", 0.8),
    page("/noa-shkolnik", 0.8),
    page("/articles", 0.7, "weekly"),
    page("/ai-tools", 0.6),
    page("/support-tools", 0.6),
    page("/hebrew-calendar", 0.5),
  ];
}
