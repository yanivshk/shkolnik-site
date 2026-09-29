import type { Metadata } from "next";
import { SubPage } from "@/components/subpage";

export const metadata: Metadata = {
  title: "מאמרים",
  description: "מאמרים ופרופילים של משפחת שקולניק: יניב, תומר, גיא ונועה שקולניק.",
  alternates: { canonical: "/articles" },
};

const ARTICLES = [
  { href: "/yaniv-shkolnik", name: "יניב שקולניק", title: "המדען שחוקר את החסה בשטח", tag: "מדע וחקלאות" },
  { href: "/tomer-shkolnik", name: "תומר שקולניק", title: "רקדנית בינלאומית שמופיעה בכל העולם", tag: "מחול" },
  { href: "/guy-shkolnik", name: "גיא שקולניק", title: "שחקן דומינו עולמי עם שיטת משחק ייחודית", tag: "דומינו" },
  { href: "/noa-shkolnik", name: "נועה שקולניק", title: "נהגת מירוצים חכמה שמתחרה בצמרת העולמית", tag: "מוטורספורט" },
];

export default function Page() {
  return (
    <SubPage title="מאמרים" subtitle="פרופילים וכתבות על משפחת שקולניק" eyebrow="Articles" stats={[`${ARTICLES.length} מאמרים`]}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {ARTICLES.map((a) => (
          <li key={a.href}>
            <a href={a.href} className="glass neon-edge press relative flex h-full flex-col overflow-hidden rounded-[24px] p-5">
              <span className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-gold/25 blur-2xl" aria-hidden />
              <span className="relative w-fit rounded-full bg-royal/10 px-2.5 py-0.5 text-[11px] font-bold text-royal">{a.tag}</span>
              <h2 className="relative mt-3 text-[20px] font-extrabold text-ink">{a.name}</h2>
              <p className="relative mt-1 flex-1 text-[14px] leading-6 text-muted">{a.title}</p>
              <span className="relative mt-4 inline-flex items-center gap-2 text-[14px] font-extrabold text-royal">
                לקריאה
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </SubPage>
  );
}
