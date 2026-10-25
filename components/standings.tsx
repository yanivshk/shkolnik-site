"use client";

import { useEffect, useState } from "react";
import type { Row, Table } from "@/lib/standings";
import { RealBasketball, RealSoccerBall } from "@/components/maccabi";

/**
 * טבלאות ספורט — מתעדכנות בכל כניסה, ובזמן משחקים מתרעננות כל 30 שניות ("טבלה חיה").
 * מכבי תל אביב מודגשת בצהוב-כחול.
 */

const isMaccabi = (name: string) => /^מכבי (תל אביב|ת"א)/.test(name);
const hm = (iso: string) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

function LiveDot() {
  return <span className="live-dot inline-block h-2 w-2 shrink-0 rounded-full bg-down" aria-hidden />;
}

function TeamCell({ r }: { r: Row }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={r.logo} alt="" width={24} height={24} loading="lazy" className="h-6 w-6 min-w-6 max-w-none object-contain" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[13.5px] leading-tight ${isMaccabi(r.name) ? "font-extrabold text-navy" : "font-semibold text-ink"}`}>{r.name}</span>
          {r.live && <LiveDot />}
        </div>
        {r.live ? (
          // תוצאה חיה: התוצאה של הקבוצה בשורה קודם, הדקה, והיריבה
          <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11.5px]">
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-down px-1.5 py-px font-extrabold text-white">
              <span dir="ltr" className="tabular">{r.live.my}–{r.live.their}</span>
              {r.live.clock && <span dir="ltr" className="tabular font-bold opacity-90">{r.live.clock}</span>}
            </span>
            <span className="truncate font-semibold text-muted">מול {r.live.opponent}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LeagueTable({ t }: { t: Table }) {
  const football = t.kind === "football";
  const head = football
    ? ["מש׳", "נ׳", "ת׳", "ה׳", "שערים", "הפרש", "נק׳"]
    : t.kind === "winner"
      ? ["מש׳", "נ׳", "ה׳", "סלים", "הפרש", "נק׳"]
      : ["מש׳", "נ׳", "ה׳", "%", "סלים", "הפרש"];
  const destColor = (n?: number) => t.destinations.find((d) => d.num === n)?.color;

  return (
    <section id={t.key} aria-labelledby={`${t.key}-t`} className="overflow-hidden rounded-[var(--radius-card)] border border-royal/10 bg-white shadow-[0_14px_40px_-24px_rgba(19,48,110,.45)]">
      {/* כותרת בצבעי מכבי */}
      <div className="relative flex items-center gap-2 bg-gradient-to-l from-navy via-royal to-royal-2 px-3 py-2.5 text-white">
        <div className="maccabi-stripes pointer-events-none absolute inset-0 opacity-40" />
        {t.sport === "soccer" ? <RealSoccerBall id={`st-${t.key}`} className="relative h-6 w-6" /> : <RealBasketball id={`st-${t.key}`} className="relative h-6 w-6" />}
        <h2 id={`${t.key}-t`} className="relative text-[18px] font-extrabold">{t.title}</h2>
        {t.live && (
          <span className="relative ms-auto inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[12px] font-extrabold text-down">
            <LiveDot />טבלה חיה
          </span>
        )}
      </div>

      {!t.ok ? (
        <p className="px-4 py-6 text-center text-[13px] text-muted">הטבלה לא זמינה כרגע</p>
      ) : (
        <table className="w-full table-fixed text-[13px]">
          <colgroup>
            <col className="w-6" />
            <col />
            {head.map((h) => <col key={h} className={h === "שערים" ? "w-[44px]" : h === "סלים" ? "w-[60px]" : h === "%" ? "w-8" : h === "הפרש" ? "w-[34px]" : h === "נק׳" ? "w-[30px]" : "w-[25px]"} />)}
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-royal/[0.04] text-[11px] font-bold text-muted">
              <th scope="col" className="py-2 text-center">#</th>
              <th scope="col" className="py-2 text-start">קבוצה</th>
              {head.map((h) => <th key={h} scope="col" className={`py-2 text-center ${h === "נק׳" ? "text-navy" : ""}`}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r) => {
              const diff = r.gf - r.ga;
              const mac = isMaccabi(r.name);
              const cells = football
                ? [r.played, r.won, r.drawn, r.lost, `${r.gf}:${r.ga}`, diff, r.points]
                : t.kind === "winner"
                  ? [r.played, r.won, r.lost, `${r.gf}:${r.ga}`, diff, r.points]
                  : [r.played, r.won, r.lost, r.pct ? Math.round(parseFloat(r.pct) * 100) : "—", `${r.gf}:${r.ga}`, diff];
              return (
                <tr
                  key={r.id}
                  className={`border-b border-line/70 last:border-0 ${mac ? "bg-gold-soft/70" : r.live ? "bg-down/[0.04]" : ""}`}
                  style={{ boxShadow: destColor(r.dest) ? `inset -3px 0 0 ${destColor(r.dest)}` : undefined }}
                >
                  <td className="py-2 text-center text-[13px] font-bold text-muted">{r.pos}</td>
                  <td className="py-2 pe-1"><TeamCell r={r} /></td>
                  {cells.map((c, i) => {
                    const isPts = head[i] === "נק׳";
                    const isDiff = head[i] === "הפרש";
                    return (
                      <td key={i} dir="ltr" className={`tabular py-2 text-center ${isPts ? "text-[14.5px] font-extrabold text-navy" : isDiff ? `font-semibold ${Number(c) > 0 ? "text-up" : Number(c) < 0 ? "text-down" : "text-muted"}` : "text-ink"} ${head[i] === "שערים" || head[i] === "סלים" ? "text-[12px]" : ""}`}>
                        {isDiff && Number(c) > 0 ? `+${c}` : c}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {t.ok && (t.destinations.length > 0 || t.notes.length > 0) && (
        <div className="space-y-1 border-t border-line px-3 py-2 text-[11.5px] text-muted">
          {t.destinations.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {t.destinations.map((d) => (
                <span key={d.num} className="inline-flex items-center gap-1"><span className="h-3 w-[3px] rounded-full" style={{ background: d.color }} />{d.name}</span>
              ))}
            </div>
          )}
          {t.notes.map((n) => <p key={n}>⚠️ {n}</p>)}
        </div>
      )}
    </section>
  );
}

/** שמות קצרים לסרגל התחתון */
const SHORT: Record<string, string> = { "ligat-haal": "ליגת העל", winner: "ווינר סל", euroleague: "יורוליג", leumit: "לאומית", youth: "נוער" };
const ICON = {
  soccer: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5l3.2 2.3-1.2 3.7h-4l-1.2-3.7zM12 3v4.5M15.2 9.8l4.8-1.3M14 13.5l2.8 4.2M10 13.5l-2.8 4.2M8.8 9.8 4 8.5",
  basketball: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3v18M5.6 5.6c3.4 3.4 3.4 9.4 0 12.8M18.4 5.6c-3.4 3.4-3.4 9.4 0 12.8",
};

/**
 * סרגל קבוע בתחתית המסך — באותה שפה של הסרגל בעמוד הבית: הטבלה שעל המסך מסומנת בצהוב,
 * ונקודה אדומה מסמנת טבלה עם משחק חי.
 */
/** גלילה לטבלה כך שהכותרת שלה תופיע מיד מתחת לשורת הכותרת הקבועה של הדף */
function goTo(key: string) {
  const el = document.getElementById(key);
  if (!el) return;
  // המיקום של שורת הכותרת כשהיא כבר "נדבקה" למעלה (גם אם עכשיו אנחנו בראש הדף ועוד לא נדבקה)
  const bar = document.getElementById("page-title-bar");
  const offset = bar ? (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight + 8 : 8;
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset), behavior: "smooth" });
}

function TablesNav({ tables }: { tables: Table[] }) {
  const [active, setActive] = useState(tables[0]?.key ?? "");
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.45;
      let id = tables[0]?.key ?? "";
      for (const t of tables) {
        const el = document.getElementById(t.key);
        if (el && el.getBoundingClientRect().top <= mid) id = t.key;
      }
      setActive(id);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [tables]);

  return (
    <div className="fixed inset-x-3 z-50 mx-auto max-w-md" style={{ bottom: "calc(10px + var(--safe-bottom))" }}>
      <nav
        aria-label="ניווט בין הטבלאות"
        className="glass-strong isolate w-full rounded-[26px] border-2 border-gold/80 !bg-white/95 px-1.5 py-1.5 shadow-[0_22px_50px_-14px_rgba(19,48,110,0.55),0_0_0_4px_rgba(255,210,63,0.18)]"
      >
        <ul className="flex items-stretch justify-between gap-0.5">
          {tables.map((t) => {
            const on = active === t.key;
            return (
              <li key={t.key} className="flex-1">
                <a
                  href={`#${t.key}`}
                  onClick={(e) => { e.preventDefault(); goTo(t.key); }}
                  aria-current={on ? "true" : undefined}
                  className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[12px] transition-colors ${on ? "font-extrabold text-navy" : "font-semibold text-royal"}`}
                >
                  {on && <span className="absolute inset-0 -z-10 rounded-2xl bg-gold/80 shadow-[inset_0_0_0_1px_rgba(255,210,63,1)]" />}
                  <span className="relative">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={ICON[t.sport]} />
                    </svg>
                    {t.live && <span className="live-dot absolute -end-1 -top-0.5 h-2 w-2 rounded-full bg-down ring-2 ring-white" aria-label="משחק חי" />}
                  </span>
                  <span className="whitespace-nowrap">{SHORT[t.key] ?? t.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function StandingsBoard({ initial }: { initial: { tables: Table[]; at: string } }) {
  const [data, setData] = useState(initial);
  const anyLive = data.tables.some((t) => t.live);

  // רענון: כל 30 שניות כשיש משחק חי, אחרת כל 5 דקות; וגם בחזרה ללשונית
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/standings", { cache: "no-store" });
        if (r.ok && alive) setData(await r.json());
      } catch { /* keep last */ }
    };
    const id = setInterval(load, anyLive ? 30_000 : 300_000);
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [anyLive]);

  return (
    <div>
      <TablesNav tables={data.tables} />

      <p className="mb-3 flex items-center gap-1.5 text-[12px] text-muted">
        {anyLive ? <><LiveDot /><b className="text-down">יש משחקים עכשיו</b> · הטבלאות מתעדכנות חי כל 30 שניות</> : "מתעדכן בכל כניסה לדף"}
        <span>· עודכן <span dir="ltr" className="tabular">{hm(data.at)}</span></span>
      </p>

      <div className="flex flex-col gap-5">
        {data.tables.map((t) => <LeagueTable key={t.key} t={t} />)}
      </div>

      <p className="mb-16 mt-4 text-[11.5px] text-muted">מקור הנתונים: 365Scores (הוצלב מול ערוץ הספורט וה-API הרשמי של היורוליג).</p>
    </div>
  );
}
