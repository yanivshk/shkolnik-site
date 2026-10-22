"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_SPOT_ID, SURF_SPOTS, dirFull, dirShort, spotById, waveLabel, wavePower, type Surf, type SurfHour } from "@/lib/surf-spots";

const STORE_KEY = "surf-spot";
const REFRESH_MS = 30 * 60 * 1000; // רענון כל חצי שעה

function readSpot(): number | null {
  try {
    const id = Number(localStorage.getItem(STORE_KEY));
    return spotById(id) ? id : null;
  } catch {
    return null;
  }
}
function saveSpot(id: number) {
  try { localStorage.setItem(STORE_KEY, String(id)); } catch { /* ignore */ }
}

/** צבע לפי גובה גל: שטוח / טוב / גבוה / סוער */
const waveTone = (h: number) => (h < 0.4 ? "bg-white/50" : h < 1.2 ? "bg-up" : h < 2 ? "bg-gold" : "bg-down");

/** צבעי הסדרות (נבדקו מול רקע האריח: ניגודיות, עיוורון צבעים, טווח בהירות) */
const C_WAVE = "#1e96cf";
const C_SWELL = "#c07f00";

/** חץ — מצביע לכיוון שאליו הרוח/הסוול נעים */
function Arrow({ from, className = "h-2.5 w-2.5" }: { from: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className} style={{ transform: `rotate(${from + 180}deg)` }} aria-hidden>
      <path d="M5 0.5 8.5 9 5 7 1.5 9z" fill="currentColor" />
    </svg>
  );
}

const WAVE_ICON = "M2 16c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M7 11c0-3.5 3-6 7-6-2 1.5-3 3.5-2 6";
const I = ({ d, className }: { d: string; className: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

const TZ = "Asia/Jerusalem";
const hourKey = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .format(new Date()).replace(" ", "T").slice(0, 13);
const hh = (t: string) => t.slice(11, 13);
const dayName = (t: string) => new Intl.DateTimeFormat("he-IL", { weekday: "short", timeZone: "UTC" }).format(new Date(`${t.slice(0, 10)}T12:00:00Z`));

/* ---------------- גרף ---------------- */

const VW = 360; // רוחב ה-viewBox
const VH = 70;  // גובה אזור הגלים

/** קו חלק (Catmull-Rom → Bezier) דרך הנקודות */
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] ?? pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] ?? pts[i + 1];
    d += ` C${(x1 + (x2 - x0) / 6).toFixed(1)},${(y1 + (y2 - y0) / 6).toFixed(1)} ${(x2 - (x3 - x1) / 6).toFixed(1)},${(y2 - (y3 - y1) / 6).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

/** שעות הייחוס ביום, עם צבע לכל אחת — הסמן בגרף השבועי נע ביניהן */
export const SLOTS = [
  { hh: "07", label: "בוקר", color: "#fde68a" },
  { hh: "12", label: "צהריים", color: "#ffffff" },
  { hh: "17", label: "ערב", color: "#c4b5fd" },
] as const;
const slotOf = (t: string) => SLOTS.find((x) => x.hh === hh(t));
const C_NOW = "#4ade80"; // הסמן על "עכשיו"

/** הנקודות שהסמן קופץ ביניהן בגרף השבועי: עכשיו + 07:00 / 12:00 / 17:00 בכל יום שעוד לא עבר */
export function snapPoints(hours: SurfHour[], now: number): number[] {
  const pts = hours.map((h, i) => (i > now && slotOf(h.time) ? i : -1)).filter((i) => i >= 0);
  return [now, ...pts];
}

/** "היום" / "מחר" / שם היום */
export function dayLabel(t: string, today: string) {
  const d = t.slice(0, 10);
  if (d === today) return "היום";
  const tm = new Date(`${today}T12:00:00Z`);
  tm.setUTCDate(tm.getUTCDate() + 1);
  return d === tm.toISOString().slice(0, 10) ? "מחר" : dayName(t);
}

/** ציר הזמן המשותף לגרפים בדף הים: כיוון (מימין לשמאל בגרף השבועי), קפיצה לשעות הייחוס, גרירה ומקלדת */
function useTimeAxis(hours: SurfHour[], now: number, sel: number, onSel: (i: number) => void) {
  const n = hours.length;
  const multiDay = n > 36;
  // בגרף השבועי הזמן רץ מימין לשמאל (כמו קריאה בעברית): "היום" בצד ימין
  const rtl = multiDay;
  const fr = (i: number) => (rtl ? 1 - i / (n - 1) : i / (n - 1));
  const x = (i: number) => fr(i) * VW;
  const pct = (i: number) => `${fr(i) * 100}%`;
  const midnights = hours.map((hr, i) => (i > 0 && hh(hr.time) === "00" ? i : -1)).filter((i) => i > 0);
  const snaps = useMemo(() => (multiDay ? snapPoints(hours, now) : null), [hours, now, multiDay]);
  const today = hours[now]?.time.slice(0, 10) ?? "";
  // קטעי הימים בגרף (בלי שאריות מאתמול) — התווית באמצע כל קטע, כך ש"היום" מופיע גם בשעות הערב
  const segments = useMemo(() => {
    const out: { day: string; a: number; b: number; mid: number }[] = [];
    hours.forEach((hr, i) => {
      const d = hr.time.slice(0, 10);
      const last = out[out.length - 1];
      if (last?.day === d) last.b = i; else out.push({ day: d, a: i, b: i, mid: i });
    });
    return out.filter((sg) => sg.day >= today).map((sg) => ({ ...sg, mid: Math.round((sg.a + sg.b) / 2) }));
  }, [hours, today]);
  const ref = useRef<HTMLDivElement>(null);

  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const raw = (rtl ? 1 - f : f) * (n - 1);
    // בגרף השבועי — קפיצה לנקודת הייחוס הקרובה (עכשיו / 07 / 12 / 17)
    const i = snaps ? snaps.reduce((a, b) => (Math.abs(b - raw) < Math.abs(a - raw) ? b : a)) : Math.round(raw);
    onSel(Math.max(0, Math.min(n - 1, i)));
  };
  const step = (dir: 1 | -1) => {
    if (!snaps) return onSel(Math.max(0, Math.min(n - 1, sel + dir)));
    const nxt = dir > 0 ? snaps.find((i) => i > sel) : [...snaps].reverse().find((i) => i < sel);
    if (nxt != null) onSel(nxt);
  };
  const h = hours[sel];
  const slot = slotOf(h.time);
  const cursor = sel === now ? C_NOW : multiDay && slot ? slot.color : "#ffffff";
  const edge = (i: number) => (fr(i) < 0.06 ? "" : fr(i) > 0.94 ? "-translate-x-full" : "-translate-x-1/2");

  /** מאפייני אזור הגרירה (role=slider) */
  const sliderProps = (label: string, valueText: string) => ({
    ref,
    role: "slider" as const,
    tabIndex: 0,
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": n - 1,
    "aria-valuenow": sel,
    "aria-valuetext": `${multiDay ? `${dayLabel(h.time, today)} ` : ""}${hh(h.time)}:00 — ${valueText}`,
    className: "relative cursor-ew-resize touch-pan-y outline-none",
    onPointerDown: (e: React.PointerEvent) => { (e.target as Element).setPointerCapture?.(e.pointerId); pick(e.clientX); },
    onPointerMove: (e: React.PointerEvent) => { if (e.buttons || e.pointerType === "mouse") pick(e.clientX); },
    onKeyDown: (e: React.KeyboardEvent) => {
      // החץ מזיז את הסמן לכיוון שהוא מצביע עליו על המסך
      if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
      else if (e.key === "ArrowRight") step(rtl ? -1 : 1);
      else return;
      e.preventDefault();
    },
  });

  return { n, multiDay, rtl, fr, x, pct, midnights, today, segments, h, cursor, edge, sliderProps };
}

/** נקודות שעות הייחוס (07 / 12 / 17) מתחת לגרף */
function SlotDots({ hours, now, sel, pct }: { hours: SurfHour[]; now: number; sel: number; pct: (i: number) => string }) {
  return (
    <div className="relative mt-1 h-2" aria-hidden>
      {hours.map((hr, i) => {
        const sl = slotOf(hr.time);
        return sl ? (
          <span key={i} className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${i === sel ? "h-2 w-2 ring-2 ring-white/40" : "h-1.5 w-1.5"} ${i < now ? "opacity-30" : ""}`} style={{ left: pct(i), background: sl.color }} />
        ) : null;
      })}
    </div>
  );
}

/** ציר הימים: "היום" / "מחר" / שם היום באמצע כל יום */
function DayAxis({ ax, hours }: { ax: ReturnType<typeof useTimeAxis>; hours: SurfHour[] }) {
  return (
    <div className="relative mt-1 h-3.5 text-[9.5px] text-white/55" aria-hidden>
      {ax.segments.map((sg) => (
        <span key={sg.day} className={`absolute whitespace-nowrap ${ax.edge(sg.mid)} ${sg.day === ax.h.time.slice(0, 10) ? "font-bold text-white" : ""}`} style={{ left: ax.pct(sg.mid) }}>{dayLabel(hours[sg.mid].time, ax.today)}</span>
      ))}
    </div>
  );
}

/** קו "עכשיו" + קו הבחירה בצבע השעה */
function Cursor({ ax, now, sel }: { ax: ReturnType<typeof useTimeAxis>; now: number; sel: number }) {
  return (
    <>
      <span className="pointer-events-none absolute inset-y-0 w-px" style={{ left: ax.pct(now), background: C_NOW, opacity: 0.55 }} />
      <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full transition-[left] duration-75" style={{ left: ax.pct(sel), background: ax.cursor, boxShadow: `0 0 10px ${ax.cursor}` }} />
    </>
  );
}

/** מקרא שעות הייחוס ועכשיו */
function SlotLegend() {
  return (
    <>
      <span className="flex items-center gap-1"><span className="h-2.5 w-0.5 rounded-full" style={{ background: C_NOW }} />עכשיו</span>
      {SLOTS.map((sl) => (
        <span key={sl.hh} className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: sl.color }} />
          <span>{sl.label} <span dir="ltr" className="tabular">{sl.hh}:00</span></span>
        </span>
      ))}
    </>
  );
}

function SeaChart({ hours, now, sel, onSel }: { hours: SurfHour[]; now: number; sel: number; onSel: (i: number) => void }) {
  const ax = useTimeAxis(hours, now, sel, onSel);
  const { n, multiDay, rtl, x, pct, midnights, h, edge } = ax;
  const top = Math.max(1, ...hours.map((hr) => Math.max(hr.wave, hr.swell ?? 0))) * 1.15;
  const y = (v: number) => VH - (v / top) * (VH - 4);
  const wavePts = hours.map((hr, i) => [x(i), y(hr.wave)] as [number, number]);
  const swellPts = hours.filter((hr) => hr.swell != null).length === n ? hours.map((hr, i) => [x(i), y(hr.swell!)] as [number, number]) : null;
  const waveLine = smooth(wavePts);
  const grid = [0.5, 1, 1.5, 2, 2.5, 3].filter((g) => g < top);
  const windMax = Math.max(20, ...hours.map((hr) => hr.gust ?? hr.wind));

  return (
    <div dir="ltr" className="select-none">
      {/* אזור הגרף — גרירה לרוחב בוחרת שעה */}
      <div {...ax.sliderProps("שעה בתחזית", `גל ${h.wave.toFixed(1)} מטר`)}>
        {/* שכבת הגרף בגובה ה-SVG — המיקומים באחוזים מתייחסים אליה */}
        <div className="relative">
        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="block h-[70px] w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="sea-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={C_WAVE} stopOpacity="0.55" />
              <stop offset="1" stopColor={C_WAVE} stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {grid.map((g) => (
            <line key={g} x1="0" x2={VW} y1={y(g)} y2={y(g)} stroke="white" strokeOpacity="0.09" vectorEffect="non-scaling-stroke" />
          ))}
          {/* גבולות בין ימים */}
          {midnights.map((i) => (
            <line key={`d${i}`} x1={x(i)} x2={x(i)} y1="0" y2={VH} stroke="white" strokeOpacity="0.18" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          ))}
          {/* עבר — מעומעם */}
          <rect x={Math.min(x(0), x(now))} y="0" width={Math.abs(x(now) - x(0))} height={VH} fill="#000" fillOpacity="0.14" />
          <path d={`${waveLine} L${x(n - 1)},${VH} L${x(0)},${VH}Z`} fill="url(#sea-fill)" />
          <path d={waveLine} fill="none" stroke={C_WAVE} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          {swellPts && <path d={smooth(swellPts)} fill="none" stroke={C_SWELL} strokeWidth="2" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
          <line x1="0" x2={VW} y1={VH} y2={VH} stroke="white" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* תוויות ציר הגובה — בצד של העתיד הרחוק, כדי לא להסתיר את "עכשיו" */}
        {grid.map((g) => (
          <span key={g} className="pointer-events-none absolute left-0.5 -translate-y-full text-[9px] leading-none text-white/45" style={{ top: `${(y(g) / VH) * 100}%` }}>{g}m</span>
        ))}

        {/* נקודות על הסדרות בשעה הנבחרת */}
        <span className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d2152] transition-[left,top] duration-75" style={{ left: pct(sel), top: `${(y(h.wave) / VH) * 100}%`, background: C_WAVE }} />
        {h.swell != null && (
          <span className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d2152] transition-[left,top] duration-75" style={{ left: pct(sel), top: `${(y(h.swell) / VH) * 100}%`, background: C_SWELL }} />
        )}
        </div>

        {/* קו "עכשיו" + קו הבחירה (בצבע השעה) — לכל גובה הגרף */}
        <Cursor ax={ax} now={now} sel={sel} />

        {/* סימוני שעות הייחוס (07 / 12 / 17) — נקודות צבעוניות מתחת לגרף */}
        {multiDay && <SlotDots hours={hours} now={now} sel={sel} pct={pct} />}

        {/* רצועת רוח — עמודות לפי עוצמה, סימון משבים */}
        <div className="relative mt-1 h-4" aria-hidden>
          {hours.map((hr, i) => (
            <span key={i} className="absolute bottom-0 -translate-x-1/2" style={{ left: pct(i), width: `${(multiDay ? 92 : 70) / n}%` }}>
              {hr.gust != null && !multiDay && <span className="absolute inset-x-0 h-px bg-white/55" style={{ bottom: `${(hr.gust / windMax) * 16}px` }} />}
              <span className={`block rounded-t-[2px] ${i === sel ? "bg-white/90" : "bg-white/35"}`} style={{ height: `${Math.max(2, (hr.wind / windMax) * 16)}px` }} />
            </span>
          ))}
        </div>
      </div>

      {/* ציר הזמן: ביום אחד — שעות; בכמה ימים — "היום" / "מחר" / שם היום באמצע כל יום */}
      <div className="relative mt-1 h-3.5 text-[9.5px] text-white/55" aria-hidden>
        {multiDay
          ? ax.segments.map((sg) => (
              <span key={sg.day} className={`absolute whitespace-nowrap ${edge(sg.mid)} ${sg.day === h.time.slice(0, 10) ? "font-bold text-white" : ""}`} style={{ left: pct(sg.mid) }}>{dayLabel(hours[sg.mid].time, ax.today)}</span>
            ))
          : hours.map((hr, i) =>
              i % 3 === 0 ? (
                <span key={i} className="absolute -translate-x-1/2 tabular" style={{ left: pct(i) }}>{hh(hr.time)}</span>
              ) : null,
            )}
      </div>

      {/* מקרא */}
      {multiDay && (
        <div dir="rtl" className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-[10.5px] text-white/65">
          <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded-full" style={{ background: C_WAVE }} />גובה גל</span>
          <span className="flex items-center gap-1"><span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: C_SWELL }} />סוול</span>
          <span className="flex items-center gap-1"><span className="h-2 w-1 rounded-t-[1px] bg-white/45" />רוח</span>
          <SlotLegend />
        </div>
      )}
    </div>
  );
}

/* ---------------- גרף מזג אוויר (באותה שפה של גרף הים) ---------------- */

const C_TEMP = C_SWELL; // טמפרטורה — הגוון החם של הפלטה
const C_HUM = C_WAVE;   // לחות — הגוון הכחול, בקו מקווקו

/** טמפרטורה, לחות וסיכוי לגשם לאורך השבוע — אותו סמן ואותן שעות ייחוס כמו בגרף הים (הסמנים מסונכרנים) */
function WeatherChart({ hours, now, sel, onSel }: { hours: SurfHour[]; now: number; sel: number; onSel: (i: number) => void }) {
  const ax = useTimeAxis(hours, now, sel, onSel);
  const { multiDay, x, pct, midnights, h } = ax;
  const temps = hours.map((hr) => hr.temp ?? NaN).filter((v) => !Number.isNaN(v));
  if (!temps.length) return null;
  const lo = Math.floor(Math.min(...temps) - 1);
  const hi = Math.ceil(Math.max(...temps) + 1);
  const yT = (v: number) => VH - ((v - lo) / (hi - lo)) * (VH - 6) - 2;
  const yH = (v: number) => VH - (v / 100) * (VH - 6) - 2;
  const tempLine = smooth(hours.map((hr, i) => [x(i), yT(hr.temp ?? lo)] as [number, number]));
  const humLine = hours.every((hr) => hr.humidity != null) ? smooth(hours.map((hr, i) => [x(i), yH(hr.humidity!)] as [number, number])) : null;
  const step = hi - lo > 12 ? 5 : hi - lo > 6 ? 3 : 2;
  const grid = Array.from({ length: 10 }, (_, k) => Math.ceil(lo / step) * step + k * step).filter((g) => g > lo && g < hi);

  return (
    <div dir="ltr" className="select-none">
      <div {...ax.sliderProps("שעה בתחזית מזג האוויר", `${h.temp != null ? `${Math.round(h.temp)} מעלות` : ""}${h.rain != null ? `, ${h.rain}% גשם` : ""}`)}>
        {/* שכבת הגרף בגובה ה-SVG — המיקומים באחוזים מתייחסים אליה */}
        <div className="relative">
        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="block h-[70px] w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="temp-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={C_TEMP} stopOpacity="0.45" />
              <stop offset="1" stopColor={C_TEMP} stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {grid.map((g) => (
            <line key={g} x1="0" x2={VW} y1={yT(g)} y2={yT(g)} stroke="white" strokeOpacity="0.09" vectorEffect="non-scaling-stroke" />
          ))}
          {midnights.map((i) => (
            <line key={`d${i}`} x1={x(i)} x2={x(i)} y1="0" y2={VH} stroke="white" strokeOpacity="0.18" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          ))}
          <rect x={Math.min(x(0), x(now))} y="0" width={Math.abs(x(now) - x(0))} height={VH} fill="#000" fillOpacity="0.14" />
          <path d={`${tempLine} L${x(hours.length - 1)},${VH} L${x(0)},${VH}Z`} fill="url(#temp-fill)" />
          {humLine && <path d={humLine} fill="none" stroke={C_HUM} strokeWidth="1.75" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
          <path d={tempLine} fill="none" stroke={C_TEMP} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          <line x1="0" x2={VW} y1={VH} y2={VH} stroke="white" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />
        </svg>

        {grid.map((g) => (
          <span key={g} className="pointer-events-none absolute left-0.5 -translate-y-full text-[9px] leading-none text-white/45" style={{ top: `${(yT(g) / VH) * 100}%` }}>{g}°</span>
        ))}

        {h.temp != null && (
          <span className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d2152] transition-[left,top] duration-75" style={{ left: pct(sel), top: `${(yT(h.temp) / VH) * 100}%`, background: C_TEMP }} />
        )}
        {h.humidity != null && (
          <span className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d2152] transition-[left,top] duration-75" style={{ left: pct(sel), top: `${(yH(h.humidity) / VH) * 100}%`, background: C_HUM }} />
        )}
        </div>

        <Cursor ax={ax} now={now} sel={sel} />

        {multiDay && <SlotDots hours={hours} now={now} sel={sel} pct={pct} />}

        {/* רצועת גשם — עמודות לפי סיכוי לגשם (0–100%) */}
        <div className="relative mt-1 h-4" aria-hidden>
          {hours.map((hr, i) => (
            <span key={i} className="absolute bottom-0 -translate-x-1/2" style={{ left: pct(i), width: `${(multiDay ? 92 : 70) / hours.length}%` }}>
              <span className={`block rounded-t-[2px] ${i === sel ? "bg-white/90" : "bg-white/35"}`} style={{ height: `${Math.max(1, ((hr.rain ?? 0) / 100) * 16)}px` }} />
            </span>
          ))}
        </div>
      </div>

      {multiDay && <DayAxis ax={ax} hours={hours} />}

      <div dir="rtl" className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-[10.5px] text-white/65">
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded-full" style={{ background: C_TEMP }} />טמפרטורה</span>
        <span className="flex items-center gap-1"><span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: C_HUM }} />לחות</span>
        <span className="flex items-center gap-1"><span className="h-2 w-1 rounded-t-[1px] bg-white/45" />סיכוי לגשם</span>
        {multiDay && <SlotLegend />}
      </div>
    </div>
  );
}

/** אריח מזג האוויר בדף הים — נתוני השעה הנבחרת + הגרף */
function WeatherDeck({ s, now, sel, onSel, label }: { s: Surf; now: number; sel: number; onSel: (i: number) => void; label: string }) {
  const h = s.hours[sel];
  if (h.temp == null) return null;
  return (
    <section aria-label={`מזג האוויר ב${s.spot}`} className="relative mt-4 overflow-hidden rounded-2xl border border-white/15 bg-[#0d2152] p-3 text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-4">
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-[#c07f00] to-transparent" />
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[14px] font-semibold">
          <I d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M17 7l1.4-1.4M8 13a4 4 0 1 1 7.5 2M7 21h10a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.6-1A3.5 3.5 0 0 0 7 21z" className="h-4 w-4 text-gold" />
          מזג אוויר · {s.spot}
        </h2>
        <span className="text-[12px] font-semibold text-white/75">{label}</span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2" aria-live="polite">
        <span dir="ltr" className="tabular text-[34px] font-extrabold leading-none tracking-tight max-[399px]:text-[28px]">{Math.round(h.temp)}<span className="text-[18px] font-bold text-white/70">°</span></span>
        <dl className="grid grid-cols-2 gap-1.5 text-center max-[399px]:gap-1">
          {[
            ["לחות", h.humidity != null ? `${Math.round(h.humidity)}%` : "—"],
            ["סיכוי לגשם", h.rain != null ? `${Math.round(h.rain)}%` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="whitespace-nowrap rounded-lg bg-white/[0.07] px-2.5 py-1 max-[399px]:px-1.5">
              <dt className="text-[10px] text-white/55">{k}</dt>
              <dd dir="ltr" className="tabular text-[13px] font-bold leading-tight max-[399px]:text-[12px]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-3">
        <WeatherChart hours={s.hours} now={now} sel={sel} onSel={onSel} />
      </div>
    </section>
  );
}

/* ---------------- משותף: נתונים + בחירת חוף ---------------- */

/** טוען את תחזית הים לחוף שנבחר (נשמר בדפדפן ומשותף לעמוד הבית ולדף הים), מרענן כל חצי שעה */
function useSurf(initial: Surf | null, days: number) {
  const [s, setS] = useState<Surf | null>(initial);
  const [busy, setBusy] = useState(false);
  const spotRef = useRef<number>(initial?.spotId ?? DEFAULT_SPOT_ID);

  const load = useCallback(async (id: number) => {
    try {
      const r = await fetch(`/api/surf?spot=${id}&days=${days}`);
      if (r.ok) setS(await r.json());
    } catch { /* keep last */ }
  }, [days]);

  useEffect(() => {
    const saved = readSpot();
    if (saved && saved !== spotRef.current) { spotRef.current = saved; load(saved); }
    const id = setInterval(() => load(spotRef.current), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const choose = useCallback(async (id: number) => {
    spotRef.current = id;
    saveSpot(id);
    setBusy(true);
    await load(id);
    setBusy(false);
  }, [load]);

  // השעה הנוכחית מתעדכנת גם בלי רענון נתונים
  const [clock, setClock] = useState(0);
  useEffect(() => { const t = setInterval(() => setClock((c) => c + 1), 60_000); return () => clearInterval(t); }, []);
  const now = useMemo(() => {
    if (!s) return 0;
    const k = hourKey();
    const i = s.hours.findIndex((h) => h.time.startsWith(k));
    return i >= 0 ? i : s.now;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, clock]);

  return { s, busy, choose, now };
}

/** כפתור בחירת חוף + חלונית (portal, כדי שלא תיחתך בתוך האזור הכחול) */
function SpotPicker({ spot, spotId, onChoose, variant }: { spot: string; spotId: number; onChoose: (id: number) => void; variant: "glass" | "dark" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`אזור גלישה: ${spot}. לחץ לשינוי`}
        className={
          variant === "glass"
            ? "inline-flex shrink-0 items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[15px] font-semibold text-white backdrop-blur max-[399px]:px-1.5"
            : "inline-flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[14px] font-semibold text-white"
        }
      >
        <I d={WAVE_ICON} className="h-4 w-4 text-gold" />
        {spot}
        <I d="m6 9 6 6 6-6" className="h-3 w-3" />
      </button>
      {open && pos && createPortal(
        <div
          ref={popRef}
          className="glass-strong fixed z-[70] w-[min(92vw,260px)] !bg-white/95 rounded-2xl p-3 text-ink shadow-xl"
          style={{ top: pos.top, right: pos.right }}
          dir="rtl"
        >
          <p className="mb-2 text-[12px] font-semibold text-muted">בחירת אזור גלישה</p>
          <ul className="grid grid-cols-2 gap-1">
            {SURF_SPOTS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onChoose(p.id); }}
                  aria-pressed={p.id === spotId}
                  className={`w-full rounded-lg px-2 py-2 text-right text-[14px] ${p.id === spotId ? "bg-royal/10 font-bold text-royal" : "hover:bg-royal/[0.06]"}`}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}

const fmtPower = (p: number) => `${p < 10 ? p.toFixed(1) : Math.round(p)} kW/m`;

/* ---------------- עמוד הבית: שתי שורות פשוטות ---------------- */

const CHIP = "glass press inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[14px] font-semibold text-navy max-[399px]:gap-1 max-[399px]:px-1.5";

/** גלישה בעמוד הבית — השעה הנוכחית בלבד: גל, סוול, רוח ועוצמת גל, ובחירת חוף. לחיצה פותחת את דף "ים, רוח, גלים". */
export function SurfBar({ initial }: { initial: Surf | null }) {
  const { s, busy, choose, now } = useSurf(initial, 1);
  if (!s || !s.hours.length) return null;
  const h = s.hours[Math.min(now, s.hours.length - 1)];
  const power = wavePower(h.wave, h.period);

  return (
    <div className="relative mt-1" aria-busy={busy}>
      <div className="flex flex-col items-start gap-[var(--hg,0.25rem)]">
        <div className="flex flex-wrap items-center gap-1.5 max-[399px]:gap-1">
          <a href="/sea" aria-label={`גלישה ב${s.spot}: גלים ${h.wave.toFixed(1)} מטר, מחזור ${Math.round(h.period)} שניות — תחזית מלאה`} className={CHIP}>
            <I d={WAVE_ICON} className="h-4 w-4 text-royal" />
            <span className={`h-1.5 w-1.5 rounded-full ${waveTone(h.wave)}`} />
            <span dir="ltr" className="tabular font-bold">{h.wave.toFixed(1)}m</span>
            <span className="font-normal text-muted">{waveLabel(h.wave)}</span>
            <span className="font-normal text-muted">·</span>
            <span dir="ltr" className="tabular font-bold">{Math.round(h.period)}s</span>
          </a>
          {h.swell != null && (
            <a href="/sea" aria-label={`סוול ב${s.spot}: ${h.swell.toFixed(1)} מטר${h.swellPeriod != null ? `, ${h.swellPeriod.toFixed(1)} שניות` : ""}${h.swellDir != null ? `, ${dirFull(h.swellDir)}` : ""}`} className={CHIP}>
              <span className="text-muted">סוול</span>
              <span dir="ltr" className="tabular inline-flex items-center gap-0.5 font-bold text-royal">
                {h.swellDir != null && <Arrow from={h.swellDir} />}
                {h.swell.toFixed(1)}m{h.swellPeriod != null && ` · ${h.swellPeriod.toFixed(1)}s`}
              </span>
              {h.swellDir != null && <span className="text-muted">{dirShort(h.swellDir)}</span>}
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 max-[399px]:gap-1">
          <a href="/sea" aria-label={`רוח ב${s.spot}: ${Math.round(h.wind)} קשר ${dirShort(h.windDir)}${h.gust != null ? `, משבים ${Math.round(h.gust)}` : ""}`} className={CHIP}>
            <span className="text-muted">רוח</span>
            <span dir="ltr" className="tabular inline-flex items-center gap-0.5 font-bold text-royal"><Arrow from={h.windDir} />{Math.round(h.wind)}kt</span>
            {h.gust != null && <span className="text-muted">משבים <b dir="ltr" className="tabular text-navy">{Math.round(h.gust)}</b></span>}
          </a>
          <a href="/sea" aria-label={`עוצמת גל: ${fmtPower(power)}`} className={CHIP}>
            <span className="text-muted">עוצמה</span>
            <span dir="ltr" className="tabular font-bold">{fmtPower(power)}</span>
          </a>
          <SpotPicker spot={s.spot} spotId={s.spotId} onChoose={choose} variant="glass" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- דף "ים, רוח, גלים": אריח מלא + ציר זמן של כמה ימים ---------------- */

const dayKey = (t: string) => t.slice(0, 10);
const dateShort = (t: string) => `${t.slice(8, 10)}.${t.slice(5, 7)}`;

/** אריח הים המלא: נתוני השעה הנבחרת + גרף רציף לכל הימים, עם גרירה, קפיצה ליום, וטבלת סיכום יומית */
export function SeaDeck({ initial, days = 7 }: { initial: Surf | null; days?: number }) {
  const { s, busy, choose, now } = useSurf(initial, days);
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [s?.spotId]);

  const daysList = useMemo(() => {
    if (!s) return [];
    const out: { key: string; label: string; first: number; noon: number; hours: SurfHour[] }[] = [];
    s.hours.forEach((h, i) => {
      const k = dayKey(h.time);
      let d = out.find((x) => x.key === k);
      if (!d) { d = { key: k, label: "", first: i, noon: -1, hours: [] }; out.push(d); }
      d.hours.push(h);
      if (hh(h.time) === "12") d.noon = i;
    });
    const today = dayKey(s.hours[s.now]?.time ?? "");
    return out
      .filter((d) => d.key >= today) // בלי שאריות מאתמול; "היום" תמיד ראשון, גם בשעות הערב
      .map((d, i, arr) => ({
        ...d,
        label: d.key === today ? "היום" : arr[i - 1]?.key === today ? "מחר" : dayName(d.hours[0].time),
        noon: d.noon >= 0 ? d.noon : d.first,
      }));
  }, [s]);

  if (!s || !s.hours.length) return null;
  const n = s.hours.length;
  const sel = Math.min(picked ?? now, n - 1);
  const h = s.hours[sel];
  const next = s.hours[sel + 1];
  const power = wavePower(h.wave, h.period);
  const isNow = sel === now;
  const selDay = dayKey(h.time);
  const go = (i: number) => setPicked(Math.max(0, Math.min(n - 1, i)));
  const today = dayKey(s.hours[now].time);
  // צעדים בין עכשיו / 07:00 / 12:00 / 17:00 של כל יום
  const snaps = snapPoints(s.hours, now);
  const stepTo = (dir: 1 | -1) => {
    const t = dir > 0 ? snaps.find((i) => i > sel) : [...snaps].reverse().find((i) => i < sel);
    if (t != null) go(t);
  };
  const slot = SLOTS.find((x) => x.hh === hh(h.time));

  return (
    <div aria-busy={busy}>
      <section
        aria-label={`מצב הים ב${s.spot}`}
        className={`relative overflow-hidden rounded-2xl border border-white/15 bg-[#0d2152] p-3 text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] transition-opacity sm:p-4 ${busy ? "opacity-60" : ""}`}
      >
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-[#1e96cf] to-transparent" />

        {/* כותרת: חוף + שעה נבחרת עם צעדים של שעה */}
        <div className="flex items-center justify-between gap-2">
          <SpotPicker spot={s.spot} spotId={s.spotId} onChoose={choose} variant="dark" />
          <div className="flex items-center gap-1">
            {/* הגרף רץ מימין (היום) לשמאל (העתיד): "קודם" מימין, "הבא" משמאל */}
            <button type="button" onClick={() => stepTo(-1)} aria-label="נקודת זמן קודמת" className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80">›</button>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-semibold ${isNow ? "bg-white/10 text-white/80" : "bg-gold text-navy"}`}
              aria-label={isNow ? "מוצגת השעה הנוכחית" : "חזרה לשעה הנוכחית"}
            >
              {isNow ? <span className="live-dot h-1.5 w-1.5 rounded-full bg-up" /> : <span aria-hidden>↺</span>}
              <span>{isNow ? "עכשיו" : `${dayLabel(h.time, today)}${slot ? ` · ${slot.label}` : ""}`}</span>
              <span dir="ltr" className="tabular">{hh(h.time)}:00</span>
            </button>
            <button type="button" onClick={() => stepTo(1)} aria-label="נקודת הזמן הבאה" className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/80">‹</button>
          </div>
        </div>

        {/* נתוני השעה הנבחרת */}
        <div className="mt-2 flex items-end justify-between gap-2" aria-live="polite">
          <div className="flex items-end gap-2">
            <span dir="ltr" className="tabular text-[34px] font-extrabold leading-none tracking-tight max-[399px]:text-[28px]">{h.wave.toFixed(1)}<span className="text-[16px] font-bold text-white/70">m</span></span>
            <span className="mb-0.5 flex flex-col text-[12px] leading-tight">
              <span className="flex items-center gap-1 font-semibold"><span className={`h-2 w-2 rounded-full ${waveTone(h.wave)}`} />{waveLabel(h.wave)}</span>
              <span className="flex items-center gap-1 whitespace-nowrap text-white/60"><span className="h-0.5 w-2.5 rounded-full" style={{ background: C_WAVE }} />גובה גל</span>
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-1.5 text-center max-[399px]:gap-1">
            {[
              ["מחזור", `${h.period.toFixed(1)}s`],
              ["עוצמה", fmtPower(power)],
              ["מים", h.water != null ? `${h.water.toFixed(1)}°` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="whitespace-nowrap rounded-lg bg-white/[0.07] px-1.5 py-1 max-[399px]:px-1">
                <dt className="text-[10px] text-white/55">{k}</dt>
                <dd dir="ltr" className="tabular text-[13px] font-bold leading-tight max-[399px]:text-[12px]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* קפיצה ליום */}
        <div className="mt-3 flex gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="בחירת יום">
          {daysList.map((d) => (
            <button
              key={d.key}
              type="button"
              role="tab"
              aria-selected={d.key === selDay}
              onClick={() => go(d.key === today ? now : d.noon)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${d.key === selDay ? "bg-white text-navy" : "bg-white/10 text-white/75"}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="mt-2">
          <SeaChart hours={s.hours} now={now} sel={sel} onSel={go} />
        </div>

        {/* פירוט: סוול · רוח · גאות */}
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-[11.5px] leading-tight">
          <div className="rounded-lg bg-white/[0.07] px-2 py-1.5">
            <div className="flex items-center gap-1 text-white/55"><span className="h-0.5 w-2.5 rounded-full" style={{ background: C_SWELL }} />סוול</div>
            {h.swell != null ? (
              <>
                <div dir="ltr" className="tabular flex items-center justify-end gap-1 font-bold">
                  {h.swellDir != null && <Arrow from={h.swellDir} />}{h.swell.toFixed(1)}m{h.swellPeriod != null && ` · ${h.swellPeriod.toFixed(0)}s`}
                </div>
                {h.swellDir != null && <div className="text-white/60">{dirFull(h.swellDir)}</div>}
              </>
            ) : <div className="text-white/60">—</div>}
          </div>
          <div className="rounded-lg bg-white/[0.07] px-2 py-1.5">
            <div className="flex items-center gap-1 text-white/55"><span className="h-2 w-1 rounded-t-[1px] bg-white/45" />רוח</div>
            <div dir="ltr" className="tabular flex items-center justify-end gap-1 font-bold"><Arrow from={h.windDir} />{Math.round(h.wind)}kt</div>
            <div className="text-white/60">{dirShort(h.windDir)}{h.gust != null && ` · משבים ${Math.round(h.gust)}`}</div>
          </div>
          <div className="rounded-lg bg-white/[0.07] px-2 py-1.5">
            <div className="text-white/55">גאות ושפל</div>
            {h.tide != null ? (
              <>
                <div dir="ltr" className="tabular text-end font-bold">{h.tide >= 0 ? "+" : ""}{h.tide.toFixed(2)}m</div>
                <div className="text-white/60">{next?.tide == null ? "" : next.tide > h.tide ? "▲ עולה" : "▼ יורד"}</div>
              </>
            ) : <div className="text-white/60">—</div>}
          </div>
        </div>
      </section>

      {/* מזג אוויר — אותו סמן כמו בגרף הים: הזזה באחד מזיזה גם את השני */}
      <WeatherDeck s={s} now={now} sel={sel} onSel={go} label={isNow ? "עכשיו" : `${dayLabel(h.time, today)}${slot ? ` · ${slot.label}` : ""} ${hh(h.time)}:00`} />

      {/* סיכום יומי — לחיצה על יום מזיזה את הקו אליו */}
      <div className="glass mt-4 overflow-hidden rounded-[var(--radius-card)]">
        <h2 className="border-b border-line/70 px-3 py-2.5 text-[15px] font-extrabold">תחזית לפי ימים</h2>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[11px] text-muted">
              <th scope="col" className="py-2 pe-1 ps-3 text-start font-semibold">יום</th>
              <th scope="col" className="px-1 py-2 text-start font-semibold">גלים</th>
              <th scope="col" className="px-1 py-2 text-start font-semibold">סוול</th>
              <th scope="col" className="px-1 py-2 text-start font-semibold">עוצמה</th>
              <th scope="col" className="py-2 pe-3 ps-1 text-start font-semibold">רוח</th>
            </tr>
          </thead>
          <tbody>
            {daysList.map((d) => {
              const waves = d.hours.map((x) => x.wave);
              const lo = Math.min(...waves), hi = Math.max(...waves);
              const peak = d.hours.reduce((a, b) => (b.wave > a.wave ? b : a));
              const swellP = Math.max(...d.hours.map((x) => x.swellPeriod ?? 0));
              const windMax = Math.max(...d.hours.map((x) => x.wind));
              const gustMax = Math.max(...d.hours.map((x) => x.gust ?? 0));
              const active = d.key === selDay;
              return (
                <tr
                  key={d.key}
                  onClick={() => go(d.key === today ? now : d.noon)}
                  className={`cursor-pointer border-t border-line/70 ${active ? "bg-royal/[0.07]" : "hover:bg-royal/[0.04]"}`}
                  aria-selected={active}
                >
                  <td className="whitespace-nowrap py-2 pe-1 ps-3">
                    <span className="font-bold">{d.label}</span>{" "}
                    <span dir="ltr" className="tabular text-[11px] text-muted">{dateShort(d.hours[0].time)}</span>
                  </td>
                  <td className="px-1 py-2">
                    <span className="inline-flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${waveTone(hi)}`} />
                      <span dir="ltr" className="tabular font-bold">{lo.toFixed(1)}–{hi.toFixed(1)}m</span>
                    </span>
                  </td>
                  <td dir="ltr" className="tabular px-1 py-2 text-end">{swellP ? `${swellP.toFixed(0)}s` : "—"}</td>
                  <td dir="ltr" className="tabular px-1 py-2 text-end">{fmtPower(wavePower(peak.wave, peak.period)).replace(" kW/m", "")}</td>
                  <td dir="ltr" className="tabular whitespace-nowrap py-2 pe-3 ps-1 text-end">{Math.round(windMax)}kt{gustMax ? <span className="text-muted"> ({Math.round(gustMax)})</span> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="border-t border-line/70 px-3 py-2 text-[11px] text-muted">
          גלים: טווח הגובה ביום · סוול: המחזור הארוך ביותר · עוצמה: kW למטר חוף בשיא · רוח: מקסימום (משבים). נתונים: Open-Meteo, מתעדכנים כל חצי שעה.
        </p>
      </div>
    </div>
  );
}
