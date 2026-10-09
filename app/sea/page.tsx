import type { Metadata } from "next";
import { SubPage } from "@/components/subpage";
import { SeaDeck } from "@/components/surf";
import { getSurf, MAX_SURF_DAYS } from "@/lib/surf";
import { DEFAULT_SPOT_ID } from "@/lib/surf-spots";

export const metadata: Metadata = {
  title: "ים, רוח, גלים",
  description: "תחזית ים לחופי ישראל לשבוע קדימה: גובה גל, סוול, מחזור, עוצמת גל, רוח ומשבים, טמפרטורת מים וגאות.",
  alternates: { canonical: "/sea" },
};

export const revalidate = 1800;

export default async function Page() {
  const surf = await getSurf(DEFAULT_SPOT_ID, MAX_SURF_DAYS);
  return (
    <SubPage title="ים, רוח, גלים" subtitle="תחזית שבועית לחופי ישראל — גלים, סוול, רוח וגאות" eyebrow="Sea · Wind · Waves">
      {surf ? <SeaDeck initial={surf} days={MAX_SURF_DAYS} /> : <p className="glass rounded-[var(--radius-card)] p-4 text-muted">נתוני הים אינם זמינים כרגע. נסו שוב בעוד כמה דקות.</p>}
    </SubPage>
  );
}
