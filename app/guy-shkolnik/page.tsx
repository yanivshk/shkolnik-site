import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { SubPage } from "@/components/subpage";

const NAME = "גיא שקולניק";
const NAME_EN = "Guy Shkolnik";
const DESCRIPTION = `${NAME} (${NAME_EN}) — הדף של ${NAME} באתר משפחת שקולניק.`;

export const metadata: Metadata = {
  title: { absolute: `${NAME} | ${NAME_EN}` },
  description: DESCRIPTION,
  alternates: { canonical: "/guy-shkolnik" },
  openGraph: { type: "profile", title: `${NAME} | ${NAME_EN}`, description: DESCRIPTION, url: `${SITE_URL}/guy-shkolnik`, locale: "he_IL" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/guy-shkolnik#person`,
  name: NAME,
  alternateName: NAME_EN,
  familyName: "שקולניק",
  url: `${SITE_URL}/guy-shkolnik`,
};

export default function Page() {
  return (
    <SubPage title={NAME} subtitle={NAME_EN} eyebrow="משפחת שקולניק" jsonLd={jsonLd}>
      <div className="glass rounded-[var(--radius-card)] p-6 text-[16px] leading-8 text-ink">
        {/* TODO: תוכן אישי יתווסף כאן */}
        <p>ברוכים הבאים לדף של {NAME} ({NAME_EN}). הדף בהכנה ותוכן נוסף יעלה בקרוב.</p>
      </div>
    </SubPage>
  );
}
