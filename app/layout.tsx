import type { Metadata, Viewport } from "next";
import "./globals.css";

const isPublic = process.env.SITE_PUBLIC === "true";

export const metadata: Metadata = {
  title: "Shkolnik · Hub",
  description: "הלוח האישי של יניב שקולניק — שווקים, טסלה, ספורט ו-AI",
  applicationName: "Shkolnik Hub",
  appleWebApp: { capable: true, title: "Shkolnik", statusBarStyle: "black-translucent" },
  robots: isPublic ? undefined : { index: false, follow: false, nocache: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#060a17",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
