import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const isPublic = process.env.SITE_PUBLIC === "true";
  return isPublic
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL }
    : { rules: { userAgent: "*", disallow: "/" } };
}
