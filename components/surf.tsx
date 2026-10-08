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
const VH = 84;  // גובה אזור הגלים

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

function SeaChart({ hours, now, sel, onSel }: { hours: SurfHour[]; now: number; sel: number; onSel: (i: number) => void }) {
  const n = hours.length;
  const top = Math.max(1, ...hours.map((h) => Math.max(h.wave, h.swell ?? 0))) * 1.15;
  const x = (i: number) => (i / (n - 1)) * VW;
  const y = (v: number) => VH - (v / top) * (VH - 4);
  const wavePts = hours.map((h, i) => [x(i), y(h.wave)] as [number, number]);
  const swellPts = hours.filter((h) => h.swell != null).length === n ? hours.map((h, i) => [x(i), y(h.swell!)] as [number, number]) : null;
  const waveLine = smooth(wavePts);
  const grid = [0.5, 1, 1.5, 2, 2.5, 3].filter((g) => g < top);
  const windMax = Math.max(20, ...hours.map((h) => h.gust ?? h.wind));
  const pct = (i: number) => `${(i / (n - 1)) * 100}%`;
  const ref = useRef<HTMLDivElement>(null);

  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onSel(Math.max(0, Math.min(n - 1, Math.round(((clientX - r.left) / r.width) * (n - 1)))));
  };
  const h = hours[sel];

  return (
    <div dir="ltr" className="select-none">
      {/* אזור הגרף — גרירה לרוחב בוחרת שעה */}
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="שעה בתחזית"
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={sel}
        aria-valuetext={`${hh(h.time)}:00 — גל ${h.wave.toFixed(1)} מטר`}
        className="relative cursor-ew-resize touch-pan-y outline-none"
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); pick(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === "mouse") pick(e.clientX); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") onSel(Math.max(0, sel - 1));
          else if (e.key === "ArrowRight") onSel(Math.min(n - 1, sel + 1));
          else return;
          e.preventDefault();
        }}
      >
        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="block h-[84px] w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="sea-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={C_WAVE} stopOpacity="0.55" />
              <stop offset="1" stopColor={C_WAVE} stopOpacity="0.04" />
            </linearGradient>
          </defs>
          {grid.map((g) => (
            <line key={g} x1="0" x2={VW} y1={y(g)} y2={y(g)} stroke="white" strokeOpacity="0.09" vectorEffect="non-scaling-stroke" />
          ))}
          {/* עבר — מעומעם */}
          <rect x="0" y="0" width={x(now)} height={VH} fill="#000" fillOpacity="0.14" />
          <path d={`${waveLine} L${VW},${VH} L0,${VH}Z`} fill="url(#sea-fill)" />
          <path d={waveLine} fill="none" stroke={C_WAVE} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          {swellPts && <path d={smooth(swellPts)} fill="none" stroke={C_SWELL} strokeWidth="2" strokeDasharray="5 3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
          <line x1="0" x2={VW} y1={VH} y2={VH} stroke="white" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* תוויות ציר הגובה */}
        {grid.map((g) => (
          <span key={g} className="pointer-events-none absolute left-0.5 -translate-y-full text-[9px] leading-none text-white/45" style={{ top: `${(y(g) / VH) * 100}%` }}>{g}m</span>
        ))}

        {/* קו "עכשיו" */}
        <span className="pointer-events-none absolute inset-y-0 w-px bg-white/35" style={{ left: pct(now) }} />
        {/* קו הבחירה + נקודות על הסדרות */}
        <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)] transition-[left] duration-75" style={{ left: pct(sel) }} />
        <span className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d2152] transition-[left,top] duration-75" style={{ left: pct(sel), top: `${(y(h.wave) / VH) * 100}%`, background: C_WAVE }} />
        {h.swell != null && (
          <span className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d2152] transition-[left,top] duration-75" style={{ left: pct(sel), top: `${(y(h.swell) / VH) * 100}%`, background: C_SWELL }} />
        )}

        {/* רצועת רוח — עמודות לפי עוצמה, סימון משבים */}
        <div className="relative mt-1 h-[22px]" aria-hidden>
          {hours.map((hr, i) => (
            <span key={i} className="absolute bottom-0 -translate-x-1/2" style={{ left: pct(i), width: `${70 / n}%` }}>
              {hr.gust != null && <span className="absolute inset-x-0 h-px bg-white/55" style={{ bottom: `${(hr.gust / windMax) * 22}px` }} />}
              <span className={`block rounded-t-[2px] ${i === sel ? "bg-white/90" : "bg-white/35"}`} style={{ height: `${Math.max(2, (hr.wind / windMax) * 22)}px` }} />
            </span>
          ))}
        </div>
      </div>

      {/* ציר הזמן */}
      <div className="relative mt-1 h-3.5 text-[9.5px] text-white/55" aria-hidden>
        {hours.map((hr, i) =>
          i % 3 === 0 ? (
            <span key={i} className="absolute -translate-x-1/2 tabular" style={{ left: pct(i) }}>{hh(hr.time)}</span>
          ) : null,
        )}
      </div>
    </div>
  );
}

/** אריח הים: כותרת + נתוני השעה הנבחרת + גרף אחד עם גרירה בין שעות היום */
export function SurfBar({ initial }: { initial: Surf | null }) {
  const [s, setS] = useState<Surf | null>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const spotRef = useRef<number>(initial?.spotId ?? DEFAULT_SPOT_ID);
  const barRef = useRef<HTMLElement>(null);
  const spotBtnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  async function load(id: number) {
    try {
      const r = await fetch(`/api/surf?spot=${id}`);
      if (r.ok) setS(await r.json());
    } catch { /* keep last */ }
  }

  useEffect(() => {
    const saved = readSpot();
    if (saved && saved !== spotRef.current) { spotRef.current = saved; load(saved); }
    const id = setInterval(() => load(spotRef.current), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  async function choose(id: number) {
    spotRef.current = id;
    saveSpot(id);
    setOpen(false);
    setBusy(true);
    await load(id);
    setBusy(false);
  }

  // החלונית מוצגת מחוץ לאזור הכחול (portal), כדי שלא תיחתך
  const place = useCallback(() => {
    const r = spotBtnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !barRef.current?.contains(t)) setOpen(false);
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
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => setPicked(null), [s?.spotId]);

  if (!s || !s.hours.length) return null;
  const sel = Math.min(picked ?? now, s.hours.length - 1);
  const h = s.hours[sel];
  const next = s.hours[sel + 1];
  const power = wavePower(h.wave, h.period);
  const isNow = sel === now;

  return (
    <div className="relative mb-3 mt-1.5">
      <section
        ref={barRef}
        aria-busy={busy}
        aria-label={`מצב הים ב${s.spot}`}
        className={`relative overflow-hidden rounded-2xl border border-white/15 bg-[#0d2152]/90 p-3 text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur transition-opacity ${busy ? "opacity-60" : ""}`}
      >
        {/* קו זוהר עליון */}
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-[#1e96cf] to-transparent" />

        {/* כותרת: חוף + שעה */}
        <div className="flex items-center justify-between gap-2">
          <button
            ref={spotBtnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`אזור גלישה: ${s.spot}. לחץ לשינוי`}
            className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[14px] font-semibold"
          >
            <I d={WAVE_ICON} className="h-4 w-4 text-gold" />
            {s.spot}
            <I d="m6 9 6 6 6-6" className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-semibold ${isNow ? "bg-white/10 text-white/80" : "bg-gold text-navy"}`}
            aria-label={isNow ? "מוצגת השעה הנוכחית" : "חזרה לשעה הנוכחית"}
          >
            {isNow ? <span className="live-dot h-1.5 w-1.5 rounded-full bg-up" /> : <span aria-hidden>↺</span>}
            <span>{isNow ? "עכשיו" : dayName(h.time)}</span>
            <span dir="ltr" className="tabular">{hh(h.time)}:00</span>
          </button>
        </div>

        {/* נתוני השעה הנבחרת */}
        <div className="mt-2 flex items-end justify-between gap-2" aria-live="polite">
          <div className="flex items-end gap-2">
            <span dir="ltr" className="tabular text-[34px] font-extrabold leading-none tracking-tight">{h.wave.toFixed(1)}<span className="text-[16px] font-bold text-white/70">m</span></span>
            <span className="mb-0.5 flex flex-col text-[12px] leading-tight">
              <span className="flex items-center gap-1 font-semibold"><span className={`h-2 w-2 rounded-full ${waveTone(h.wave)}`} />{waveLabel(h.wave)}</span>
              <span className="text-white/60">גובה גל</span>
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-1.5 text-center">
            {[
              ["מחזור", `${h.period.toFixed(1)}s`],
              ["עוצמה", `${power < 10 ? power.toFixed(1) : Math.round(power)} kW/m`],
              ["מים", h.water != null ? `${h.water.toFixed(1)}°` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white/[0.07] px-1.5 py-1">
                <dt className="text-[10px] text-white/55">{k}</dt>
                <dd dir="ltr" className="tabular text-[13px] font-bold leading-tight">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* מקרא */}
        <div className="mt-2 flex items-center gap-3 text-[10.5px] text-white/70" aria-hidden>
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-3 rounded-full" style={{ background: C_WAVE }} />גל</span>
          <span className="inline-flex items-center gap-1"><span className="h-0.5 w-3 rounded-full" style={{ background: `repeating-linear-gradient(90deg, ${C_SWELL} 0 4px, transparent 4px 6px)` }} />סוול</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-1 rounded-t-[1px] bg-white/45" />רוח</span>
          <span className="inline-flex items-center gap-1"><span className="h-px w-2 bg-white/60" />משבים</span>
          <span className="ms-auto text-white/45">גררו לשינוי שעה</span>
        </div>

        <div className="mt-1">
          <SeaChart hours={s.hours} now={now} sel={sel} onSel={setPicked} />
        </div>

        {/* פירוט: סוול, רוח, גאות */}
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
            <div className="text-white/55">רוח</div>
            <div dir="ltr" className="tabular flex items-center justify-end gap-1 font-bold"><Arrow from={h.windDir} />{Math.round(h.wind)}kt</div>
            <div className="text-white/60">{dirShort(h.windDir)}{h.gust != null && ` · משבים ${Math.round(h.gust)}`}</div>
          </div>
          <div className="rounded-lg bg-white/[0.07] px-2 py-1.5">
            <div className="text-white/55">גאות ושפל</div>
            {h.tide != null ? (
              <>
                <div dir="ltr" className="tabular font-bold text-end">{h.tide >= 0 ? "+" : ""}{h.tide.toFixed(2)}m</div>
                <div className="text-white/60">{next?.tide == null ? "" : next.tide > h.tide ? "▲ עולה" : "▼ יורד"}</div>
              </>
            ) : <div className="text-white/60">—</div>}
          </div>
        </div>
      </section>

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
                  onClick={() => choose(p.id)}
                  aria-pressed={p.id === s.spotId}
                  className={`w-full rounded-lg px-2 py-2 text-right text-[14px] ${p.id === s.spotId ? "bg-royal/10 font-bold text-royal" : "hover:bg-royal/[0.06]"}`}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
