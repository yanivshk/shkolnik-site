import { MaccabiLogo } from "@/components/maccabi";
import { SiteMenu } from "@/components/site-menu";

/** מעטפת לתתי-עמודים: כותרת עם חזרה לבית ותפריט, ופתיח כחול */
export function SubPage({ title, subtitle, eyebrow, children, jsonLd }: {
  title: string; subtitle?: string; eyebrow?: string; children: React.ReactNode; jsonLd?: object;
}) {
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4" style={{ paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}>
        <a href="/" className="flex items-center gap-2 text-[14px] font-bold text-royal">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          לעמוד הבית
        </a>
        <span className="flex items-center gap-2">
          <MaccabiLogo className="h-9 w-9" />
          <SiteMenu />
        </span>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-navy via-royal to-royal-2 px-6 py-8 text-white">
          <div className="maccabi-stripes absolute inset-0" />
          {eyebrow && <p className="relative text-[12px] font-bold uppercase tracking-[0.2em] text-gold">{eyebrow}</p>}
          <h1 className="relative mt-2 text-[32px] font-black leading-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="relative mt-2 text-[15px] text-white/80">{subtitle}</p>}
        </div>
        <div className="mt-6">{children}</div>
      </main>
    </>
  );
}

export type Tool = { name: string; url: string; note: string };

/** רשימת כלים לפי קטגוריות */
export function ToolGroups({ groups }: { groups: { title: string; tools: Tool[] }[] }) {
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="mb-3 text-[22px] font-extrabold text-ink">{g.title}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {g.tools.map((t) => (
              <li key={t.name}>
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="glass press flex h-full flex-col rounded-[var(--radius-card)] p-4">
                  <span className="flex items-center justify-between gap-2">
                    <span dir="auto" className="text-[16px] font-bold text-royal">{t.name}</span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-faint" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M7 17 17 7M8 7h9v9" /></svg>
                  </span>
                  <span className="mt-1 text-[14px] leading-6 text-muted">{t.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
