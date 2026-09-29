import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OWNER_FULL_NAME, OWNER_FULL_NAME_EN, SEARCH_SNIPPET, SITE_URL } from "@/lib/config";

const isPublic = process.env.SITE_PUBLIC === "true";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // תוצאת החיפוש בגוגל: השם בכותרת, והמשפט "מה זה הפועל?" בתיאור
  title: { default: OWNER_FULL_NAME, template: `%s | ${OWNER_FULL_NAME}` },
  description: SEARCH_SNIPPET,
  keywords: [OWNER_FULL_NAME, OWNER_FULL_NAME_EN, "שקולניק", "Shkolnik", "יניב שקולניק מדען", "חקר גידול חסה"],
  authors: [{ name: OWNER_FULL_NAME, url: SITE_URL }],
  creator: OWNER_FULL_NAME,
  applicationName: "Shkolnik Hub",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: SITE_URL,
    siteName: OWNER_FULL_NAME,
    title: OWNER_FULL_NAME,
    description: SEARCH_SNIPPET,
  },
  appleWebApp: { capable: true, title: "Shkolnik", statusBarStyle: "default" },
  robots: isPublic ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
  formatDetection: { telephone: false },
};

/** נתונים מובנים (schema.org) שמשייכים את השם לאתר */
const personJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: OWNER_FULL_NAME,
      alternateName: [OWNER_FULL_NAME_EN, "Yaniv Shkolnik"],
      url: SITE_URL,
      jobTitle: "מדען, חוקר גידולי חסה בשטח",
      knowsAbout: ["גידול חסה", "חקלאות שדה", "גידול עגבניות"],
      mainEntityOfPage: SITE_URL,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: OWNER_FULL_NAME,
      inLanguage: "he-IL",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#f4f7fc",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-dvh">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
