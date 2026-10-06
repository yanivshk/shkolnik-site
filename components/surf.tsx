"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_SPOT_ID, SURF_SPOTS, dirFull, dirShort, spotById, surfSiteUrl, waveLabel, type Surf } from "@/lib/surf-spots";

const STORE_KEY = "surf-spot";
const REFRESH_MS = 60 * 60 * 1000; // פעם בשעה

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

/** חץ רוח — מצביע לכיוון שאליו הרוח נושבת */
function WindArrow({ from }: { from: number }) {
  return (
    <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" style={{ transform: `rotate(${from + 180}deg)` }} aria-hidden>
      <path d="M5 0.5 8.5 9 5 7 1.5 9z" fill="currentColor" />
    </svg>
  );
}

const WAVE_ICON = "M2 16c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M7 11c0-3.5 3-6 7-6-2 1.5-3 3.5-2 6";
const I = ({ d, className }: { d: string; className: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

/** גלישה — גל ורוח עכשיו, עם בחירת אזור חוף (כמו במזג האוויר). לחיצה על הכפתור פותחת את 4surfers לאזור שנבחר. */
export function SurfBar({ initial }: { initial: Surf | null }) {
  const [s, setS] = useState<Surf | null>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const spotRef = useRef<number>(initial?.spotId ?? DEFAULT_SPOT_ID);
  const barRef = useRef<HTMLDivElement>(null);
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
    const r = barRef.current?.getBoundingClientRect();
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

  if (!s) return null;

  return (
    <div className="relative mb-3 mt-1.5">
      <div ref={barRef} className="flex flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] max-[399px]:gap-1" aria-busy={busy}>
        <a
          href={surfSiteUrl(s.spotId)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`גלישה ב${s.spot}: גלים ${s.wave.toFixed(1)} מטר, רוח ${Math.round(s.wind)} קשר — תחזית מלאה ב-4surfers`}
          className="glass press inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[14px] font-semibold text-navy max-[399px]:gap-1 max-[399px]:px-1.5"
        >
          <I d={WAVE_ICON} className="h-4 w-4 text-royal" />
          <span className={`h-1.5 w-1.5 rounded-full ${waveTone(s.wave)}`} />
          <span dir="ltr" className="tabular font-bold">{s.wave.toFixed(1)}m</span>
          <span className="font-normal text-muted">{waveLabel(s.wave)}</span>
          <span dir="ltr" className="tabular font-bold">· {Math.round(s.period)}s</span>
          {s.swell != null && (
            <>
              <span className="h-3 w-px bg-line" />
              <span className="text-muted">סוול</span>
              <span dir="ltr" className="tabular inline-flex items-center gap-0.5 font-bold text-royal">
                {s.swellDir != null && <WindArrow from={s.swellDir} />}
                {s.swell.toFixed(2)}m{s.swellPeriod != null && ` · ${s.swellPeriod.toFixed(1)}s`}
              </span>
              {s.swellDir != null && <span className="text-muted">{dirFull(s.swellDir)}</span>}
            </>
          )}
          <span className="h-3 w-px bg-line" />
          <span className="text-muted">רוח</span>
          <span dir="ltr" className="tabular inline-flex items-center gap-0.5 font-bold text-royal"><WindArrow from={s.windDir} />{Math.round(s.wind)}kt</span>
          <span className="text-muted">{dirShort(s.windDir)}{s.gust != null && " · משבים"}</span>
          {s.gust != null && <span dir="ltr" className="tabular font-bold">{Math.round(s.gust)}</span>}
        </a>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`אזור גלישה: ${s.spot}. לחץ לשינוי`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[15px] font-semibold text-white backdrop-blur max-[399px]:px-1.5"
        >
          <I d={WAVE_ICON} className="h-4 w-4 text-gold" />
          {s.spot}
          <I d="m6 9 6 6 6-6" className="h-3 w-3" />
        </button>
      </div>

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
