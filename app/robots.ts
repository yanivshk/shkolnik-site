import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isPublic = process.env.SITE_PUBLIC === "true";
  return isPublic
    ? { rules: { userAgent: "*", allow: "/" } }
    : { rules: { userAgent: "*", disallow: "/" } };
}
