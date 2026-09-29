import { MaccabiLogo, RealBasketball, RealSoccerBall } from "@/components/maccabi";
import { SiteMenu } from "@/components/site-menu";

/*
 * מערכת העיצוב של תתי-העמודים.
 * כל דף חדש באתר משתמש ב-SubPage (מעטפת + פתיח), ב-ToolGroups (רשימות קישורים עם כפתורים)
 * או ב-ProfileArticle (כתבת פרופיל) — כדי שכל הדפים ייראו אחיד.
 */

/* ---------- אייקונים ---------- */

const ICONS: Record<string, string> = {
  chat: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M16 9.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0",
  video: "M3 6h13v12H3zM16 10l5-3v10l-5-3",
  data: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  remote: "M3 4h18v12H3zM8 20h8M12 16v4M9 9l2 2 4-4",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
};

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[name] ?? ICONS.spark} />
    </svg>
  );
}

/* ---------- מעטפת ---------- */

export function SubPage({ title, subtitle, eyebrow, stats, children, jsonLd }: {
  title: string; subtitle?: string; eyebrow?: string; stats?: string[]; children: React.ReactNode; jsonLd?: object;
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
        <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-navy via-royal to-royal-2 px-6 py-9 text-white shadow-[0_24px_60px_-28px_rgba(19,48,110,0.8)]">
          <div className="maccabi-stripes absolute inset-0 -z-10" />
          <div className="absolute -left-20 -top-20 -z-10 h-56 w-56 rounded-full bg-gold/30 blur-3xl" />
          <div className="absolute -bottom-24 right-10 -z-10 h-48 w-48 rounded-full bg-royal-2/60 blur-3xl" />
          {eyebrow && (
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
              <span className="h-0.5 w-6 rounded-full bg-gold" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 text-[34px] font-black leading-tight sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/80">{subtitle}</p>}
          {stats && stats.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {stats.map((s) => (
                <span key={s} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/90 backdrop-blur">{s}</span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-6">{children}</div>
      </main>
    </>
  );
}

/* ---------- רשימות כלים ---------- */

export type Tool = { name: string; url: string; note: string; tag?: string };
export type ToolGroup = { id: string; title: string; icon: string; tools: Tool[] };

const initials = (name: string) => {
  const latin = name.replace(/\(.*?\)/g, "").trim();
  const parts = latin.split(/[\s.]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : latin.slice(0, 2)).toUpperCase();
};

/** קטגוריות עם ניווט מהיר, כותרת עם אייקון, וכרטיס לכל כלי עם כפתור כניסה */
export function ToolGroups({ groups }: { groups: ToolGroup[] }) {
  return (
    <div>
      {groups.length > 1 && (
        <nav aria-label="קטגוריות" className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="glass press inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold text-royal">
              <Icon name={g.icon} className="h-4 w-4" />
              {g.title}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-t`} className="scroll-mt-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-navy to-royal text-gold shadow-[0_10px_24px_-12px_rgba(19,48,110,0.9)]">
                <Icon name={g.icon} />
              </span>
              <h2 id={`${g.id}-t`} className="text-[22px] font-extrabold tracking-tight text-ink">{g.title}</h2>
              <span className="rounded-full bg-gold/30 px-2.5 py-0.5 text-[12px] font-bold text-navy">{g.tools.length}</span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-royal/20" />
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {g.tools.map((t) => (
                <li key={t.name}>
                  <article className="glass neon-edge relative flex h-full flex-col overflow-hidden rounded-[24px] p-5">
                    <span className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full bg-gold/25 blur-2xl" aria-hidden />
                    <div className="relative flex items-start gap-3">
                      <span dir="ltr" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-royal to-navy font-latin text-[15px] font-black tracking-tight text-gold ring-1 ring-gold/40">
                        {initials(t.name)}
                      </span>
                      <div className="min-w-0">
                        <h3 dir="auto" className="text-[17px] font-extrabold leading-tight text-ink">{t.name}</h3>
                        {t.tag && <span className="mt-1 inline-block rounded-full bg-up/10 px-2 py-0.5 text-[11px] font-bold text-up">{t.tag}</span>}
                      </div>
                    </div>
                    <p className="relative mt-3 flex-1 text-[14px] leading-6 text-muted">{t.note}</p>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press group relative mt-4 inline-flex items-center justify-between gap-2 overflow-hidden rounded-2xl bg-gradient-to-l from-gold to-[#ffe27a] px-4 py-3 text-[14px] font-extrabold text-navy shadow-[0_12px_26px_-14px_rgba(185,140,0,0.9)] ring-1 ring-gold-deep/30"
                      aria-label={`כניסה ל-${t.name} (נפתח בלשונית חדשה)`}
                    >
                      <span className="relative">כניסה ל-<span dir="auto">{t.name.replace(/\s*\(.*\)$/, "")}</span></span>
                      <span className="relative grid h-7 w-7 place-items-center rounded-full bg-navy text-gold transition-transform group-hover:-translate-x-1">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                      </span>
                    </a>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ---------- כתבת פרופיל ---------- */

export function ProfileArticle({ name, nameEn, eyebrow, headline, paragraphs }: {
  name: string; nameEn: string; eyebrow: string; headline: string; paragraphs: string[][];
}) {
  return (
    <>
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
        <article>
          <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-navy via-royal to-royal-2 px-6 py-10 text-white">
            <div className="maccabi-stripes absolute inset-0" />
            <RealBasketball id="pa-b" className="absolute -left-6 -top-6 h-24 w-24 opacity-80" />
            <RealSoccerBall id="pa-s" className="absolute left-24 top-6 h-10 w-10 opacity-80" />
            <p className="relative text-[12px] font-bold uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
            <h1 className="relative mt-3 text-[34px] font-black leading-tight sm:text-5xl">
              {name}
              <span className="mt-2 block text-[20px] font-bold text-white/85 sm:text-2xl">{headline}</span>
            </h1>
            <p className="relative mt-3 font-latin text-[13px] text-white/60" dir="ltr">{nameEn}</p>
          </div>

          <div className="glass mt-6 space-y-5 rounded-[var(--radius-card)] p-6 text-[16px] leading-8 text-ink">
            {paragraphs.map((lines, i) => (
              <p key={i}>{lines.join(" ")}</p>
            ))}
          </div>
        </article>

        <div className="mt-8 flex items-center justify-end gap-2 text-[13px] font-black text-royal">
          <RealSoccerBall id="pa-s2" className="h-5 w-5" /> רק מכבי <RealBasketball id="pa-b2" className="h-5 w-5" />
        </div>
      </main>
    </>
  );
}
