"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, type Broadcast, type BroadcastDay } from "@/lib/broadcasts";
import { RealBasketball, RealSoccerBall } from "@/components/maccabi";

const I = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const PREV = "M9 6l6 6-6 6"; // ב-RTL "הקודם" מצביע ימינה
const NEXT = "M15 6l-6 6 6 6";

const dayFmt = new Intl.DateTimeFormat("he-IL", { weekday: "short", timeZone: "UTC" });
/** "ה׳ 02.10" */
function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return { day: dayFmt.format(new Date(`${iso}T12:00:00Z`)).replace("יום ", ""), date: `${d}.${m}` };
}

/** קישור לקובץ יומן (.ics) של המשחק — באייפון נפתח "הוסף ליומן" */
function icsHref(b: Broadcast) {
  const icon = b.sport === "soccer" ? "⚽ " : b.sport === "basketball" ? "🏀 " : "";
  const q = new URLSearchParams({ d: b.date, t: b.time, title: `${icon}${b.team} – ${b.opponent}${b.home ? " (בית)" : ""}`, ch: b.channels.join(", "), lg: b.league, s: b.sport ?? "" });
  return `/api/ics?${q}`;
}

function Row({ b, i }: { b: Broadcast; i: number }) {
  const { day, date } = shortDate(b.date);
  return (
    <tr className="border-t border-line/70 align-middle">
      <td className="whitespace-nowrap py-2.5 pe-1 ps-2 sm:pe-2 sm:ps-3 max-[399px]:ps-1.5 max-[359px]:ps-1">
        <span className="mb-0.5 inline-block rounded-md bg-gold/70 px-1.5 text-[12px] font-extrabold leading-5 text-navy">{day}</span>
        <span dir="ltr" className="tabular block font-semibold">{date}</span>
      </td>
      {/* לחיצה על השעה מוסיפה את המשחק ליומן. אייקון היומן יושב בגובה תג היום — כדי שהשעה תהיה באותו קו גובה של התאריך */}
      <td dir="ltr" className="tabular whitespace-nowrap px-1 py-2.5 text-end font-bold text-navy sm:px-1.5 max-[399px]:px-0.5">
        <a href={icsHref(b)} aria-label={`הוספה ליומן: ${b.team} נגד ${b.opponent}, ${b.time}`} title="הוספה ליומן" className="block">
          <span className="mb-0.5 flex h-5 items-center justify-end text-royal/70" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M12 13v5M9.5 15.5h5" /></svg>
          </span>
          <span className="block">{b.time}</span>
        </a>
      </td>
      <td className="px-1 py-2.5 sm:px-1.5 max-[399px]:px-0.5">
        <span className="sr-only">{b.sport === "soccer" ? "כדורגל" : b.sport === "basketball" ? "כדורסל" : "ענף לא ידוע"}</span>
        {b.sport === "soccer" ? (
          <RealSoccerBall id={`bc-s${i}`} className="h-6 w-6 max-[399px]:h-5 max-[399px]:w-5" />
        ) : b.sport === "basketball" ? (
          <RealBasketball id={`bc-b${i}`} className="h-6 w-6 max-[399px]:h-5 max-[399px]:w-5" />
        ) : (
          // ענף לא ודאי — מסך טלוויזיה ניטרלי במקום ניחוש
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-muted max-[399px]:h-5 max-[399px]:w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="6" width="18" height="12" rx="2" /><path d="m9 3 3 3 3-3" /></svg>
        )}
      </td>
      <td className="px-1 py-2.5 sm:px-1.5 max-[399px]:px-0.5">
        {b.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logo} alt={b.team} title={b.team} width={28} height={28} className="h-7 w-7 min-w-7 max-w-none object-contain max-[399px]:h-6 max-[399px]:w-6 max-[399px]:min-w-6" loading="lazy" />
        ) : (
          <span className="block h-7 w-7 max-[399px]:h-6 max-[399px]:w-6" aria-hidden />
        )}
      </td>
      <td className="px-1 py-2.5 sm:px-1.5 max-[399px]:px-0.5">
        <span className="block text-[11px] text-muted">{b.team} נגד</span>
        <span className="font-bold">{b.opponent}</span>
      </td>
      <td className="px-1 py-2.5 sm:px-1.5 max-[399px]:px-0.5">
        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 max-[399px]:px-1.5 max-[359px]:px-1 text-[11px] font-bold ${b.home ? "bg-gold/60 text-navy" : "bg-navy/[0.07] text-muted"}`}>{b.home ? "בית" : "חוץ"}</span>
      </td>
      <td className="py-2.5 pe-3 ps-1 sm:pe-1.5 sm:ps-1.5 max-[399px]:pe-2 max-[359px]:pe-1">
        <span className="flex flex-wrap gap-1">
          {b.channels.map((c) => (
            <span key={c} className="rounded-full bg-royal/[0.08] px-2 py-0.5 max-[399px]:px-1.5 text-center text-[11px] font-semibold leading-tight text-royal sm:whitespace-nowrap">{c}</span>
          ))}
        </span>
        {/* בנייד הליגה מתחת לערוץ, כדי שהטבלה תיכנס ברוחב המסך */}
        <span className="mt-1 block text-[11px] text-muted sm:hidden">{b.league}</span>
      </td>
      <td className="hidden py-2.5 pe-3 ps-1.5 text-[12px] text-muted sm:table-cell">{b.league}</td>
    </tr>
  );
}

export function BroadcastTable({ initial, today }: { initial: BroadcastDay | null; today: string }) {
  const [from, setFrom] = useState(initial?.from ?? today);
  const [data, setData] = useState<BroadcastDay | null>(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const req = useRef(0);

  // רענון אוטומטי של השרת מביא initial חדש — מעדכנים רק אם המשתמש לא בחר תאריך אחר
  useEffect(() => {
    if (initial && initial.from === from && !busy) setData(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  async function load(date: string) {
    if (!date) return;
    setFrom(date);
    const id = ++req.current;
    setBusy(true);
    setFailed(false);
    try {
      const r = await fetch(`/api/broadcasts?from=${date}`);
      if (id !== req.current) return;
      if (r.ok) setData(await r.json());
      else setFailed(true);
    } catch {
      if (id === req.current) setFailed(true);
    } finally {
      if (id === req.current) setBusy(false);
    }
  }

  const items = data?.from === from ? data.items : [];
  const to = addDays(from, (data?.days ?? 7) - 1);

  return (
    <div className="glass mb-6 overflow-hidden rounded-[var(--radius-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-3 py-3">
        <div>
          <h3 className="text-[19.5px] font-extrabold">שידורי ספורט</h3>
          <p className="text-[11px] text-muted">
            <span dir="ltr" className="tabular">{shortDate(from).date}</span>–<span dir="ltr" className="tabular">{shortDate(to).date}</span> · ערוץ הספורט וספורט 1
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => load(addDays(from, -1))} className="glass press grid h-9 w-9 place-items-center rounded-full text-royal" aria-label="יום קודם"><I d={PREV} /></button>
          <input
            type="date"
            value={from}
            onChange={(e) => load(e.target.value)}
            aria-label="בחירת תאריך"
            className="glass h-9 rounded-full px-3 text-[13px] font-semibold text-ink"
          />
          <button type="button" onClick={() => load(addDays(from, 1))} className="glass press grid h-9 w-9 place-items-center rounded-full text-royal" aria-label="יום הבא"><I d={NEXT} /></button>
          {from !== today && (
            <button type="button" onClick={() => load(today)} className="press h-9 rounded-full bg-gold/70 px-3 text-[12px] font-bold text-navy">היום</button>
          )}
        </div>
      </div>

      <div className={`overflow-x-auto transition-opacity ${busy ? "opacity-50" : ""}`} aria-busy={busy}>
        {items.length ? (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-start text-[11px] font-semibold text-muted">
                <th scope="col" className="py-2 pe-1 ps-2 text-start font-semibold sm:pe-2 sm:ps-3 max-[399px]:ps-1.5 max-[359px]:ps-1">תאריך</th>
                <th scope="col" className="px-1.5 py-2 text-start font-semibold max-[399px]:px-0.5">שעה</th>
                <th scope="col" className="px-1.5 py-2 text-start font-semibold max-[399px]:px-0.5"><span className="sr-only">ענף</span></th>
                <th scope="col" className="px-1 py-2 text-start font-semibold sm:px-1.5 max-[399px]:px-0.5"><span className="sr-only">קבוצה</span></th>
                <th scope="col" className="px-1 py-2 text-start font-semibold sm:px-1.5 max-[399px]:px-0.5">יריבה</th>
                <th scope="col" className="px-1 py-2 text-start font-semibold sm:px-1.5 max-[399px]:px-0.5">בית/חוץ</th>
                <th scope="col" className="py-2 pe-3 ps-1.5 text-start font-semibold sm:pe-1.5 max-[399px]:pe-2 max-[359px]:pe-1">ערוץ<span className="sm:hidden"> · ליגה</span></th>
                <th scope="col" className="hidden py-2 pe-3 ps-1.5 text-start font-semibold sm:table-cell">ליגה</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b, i) => <Row key={b.id} b={b} i={i} />)}
            </tbody>
          </table>
        ) : (
          <p className="px-4 py-6 text-center text-[13px] text-muted">
            {busy ? "טוען…" : failed ? "לוח השידורים לא זמין כרגע" : "אין שידורים של הקבוצות שלנו בתאריכים האלה. הערוצים מפרסמים לוח כשבוע מראש."}
          </p>
        )}
      </div>
    </div>
  );
}
