"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_PLACE, type Place, type Weather } from "@/lib/weather";

const STORE_KEY = "weather-place";
const REFRESH_MS = 10 * 60 * 1000; // כל 10 דקות

function readPlace(): Place | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Place) : null;
  } catch {
    return null;
  }
}
function savePlace(p: Place) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

/* ---- אייקונים ---- */
const I = ({ d, className = "h-4 w-4" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const SUN = "M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z";
const MOON = "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z";
const CLOUD = "M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z";
const PARTLY = "M8 3v1.5M3.5 8H5M4.8 4.8l1 1M11.2 4.8l-1 1M10.5 9.5a3 3 0 1 0-4.6 2.3M9 20h8a3.5 3.5 0 0 0 .5-7 5 5 0 0 0-9.3 1.6A2.8 2.8 0 0 0 9 20z";
const RAIN = "M7 15h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3";
const STORM = "M7 15h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15zM12 15l-2 4h3l-2 4";
const FOG = "M4 10h16M6 14h12M8 18h8M7 6h10";
const SNOW = "M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9";
const DROP = "M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3z";
const UMBRELLA = "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v6.5a2 2 0 0 1-4 0";

function condition(code: number, isDay: boolean): { d: string; label: string } {
  if (code === 0) return isDay ? { d: SUN, label: "בהיר" } : { d: MOON, label: "בהיר" };
  if (code <= 2) return { d: PARTLY, label: "מעונן חלקית" };
  if (code === 3) return { d: CLOUD, label: "מעונן" };
  if (code === 45 || code === 48) return { d: FOG, label: "ערפל" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { d: SNOW, label: "שלג" };
  if (code >= 95) return { d: STORM, label: "סופת רעמים" };
  return { d: RAIN, label: "גשם" };
}

/** קישור לגוגל — מזג אוויר / לחות / סיכוי לגשם ביישוב שנבחר */
const googleWeather = (query: string) => `https://www.google.com/search?hl=he&q=${encodeURIComponent(query)}`;

function Chip({ icon, children, label, href }: { icon: string; children: React.ReactNode; label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="glass press inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[15px] font-semibold text-navy" title={label} aria-label={label}>
      <I d={icon} className="h-4 w-4 text-royal" />
      <span dir="ltr" className="tabular">{children}</span>
    </a>
  );
}

export function WeatherBar({ initial }: { initial: Weather | null }) {
  const [w, setW] = useState<Weather | null>(initial);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const placeRef = useRef<Place | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  async function load(p: Place) {
    try {
      const r = await fetch(`/api/weather?lat=${p.lat}&lon=${p.lon}&name=${encodeURIComponent(p.name)}`);
      if (r.ok) setW(await r.json());
    } catch { /* keep last */ }
  }

  useEffect(() => {
    const saved = readPlace();
    placeRef.current = saved;
    if (saved) load(saved);
    const id = setInterval(() => load(placeRef.current ?? DEFAULT_PLACE), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  async function search(text: string): Promise<Place[]> {
    try {
      const r = await fetch(`/api/places?q=${encodeURIComponent(text)}`);
      return r.ok ? ((await r.json()) as Place[]) : [];
    } catch { return []; }
  }

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    let live = true;
    const t = setTimeout(async () => {
      const list = await search(q.trim());
      if (live) setResults(list);
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  async function choose(p: Place) {
    placeRef.current = p;
    savePlace(p);
    setOpen(false);
    setQ("");
    setResults([]);
    setBusy(true);
    await load(p);
    setBusy(false);
  }

  /** Enter — אישור: בוחר את התוצאה הראשונה (ומחפש מיד אם עוד לא הגיעו תוצאות) */
  async function confirm() {
    const text = q.trim();
    if (text.length < 2) return;
    const list = results.length ? results : await search(text);
    if (list[0]) choose(list[0]);
    else setResults([]);
  }

  // החלונית מוצגת מחוץ לאזור הכחול (portal), כדי שלא תיחתך ותהיה לחיצה
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

  if (!w) return null;
  const c = condition(w.code, w.isDay);

  return (
    <div className="relative">
      <div ref={barRef} className="flex flex-wrap items-center gap-1.5" aria-busy={busy}>
        <Chip icon={c.d} label={`${c.label}, ${w.temp} מעלות — מזג האוויר ב${w.name} בגוגל`} href={googleWeather(`מזג אוויר ${w.name}`)}>{w.temp}°</Chip>
        <Chip icon={DROP} label={`לחות ${w.humidity}% — לחות ב${w.name} בגוגל`} href={googleWeather(`לחות ${w.name}`)}>{w.humidity}%</Chip>
        <Chip icon={UMBRELLA} label={`סיכוי לגשם ${w.rainProb}% — סיכוי לגשם ב${w.name} בגוגל`} href={googleWeather(`סיכוי לגשם ${w.name}`)}>{w.rainProb}%</Chip>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`מיקום: ${w.name}. לחץ לשינוי`}
          className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[15px] font-semibold text-white backdrop-blur"
        >
          <I d={PARTLY} className="h-4 w-4 text-gold" />
          {w.name}
          <I d="m6 9 6 6 6-6" className="h-3 w-3" />
        </button>
      </div>

      {open && pos && createPortal(
        <div
          ref={popRef}
          className="glass-strong fixed z-[70] w-[min(92vw,300px)] !bg-white/95 rounded-2xl p-3 text-ink shadow-xl"
          style={{ top: pos.top, right: pos.right }}
          dir="rtl"
        >
          <label className="mb-2 block text-[12px] font-semibold text-muted" htmlFor="wx-q">בחירת מיקום</label>
          <input
            id="wx-q"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirm(); } }}
            enterKeyHint="search"
            placeholder="למשל: חיפה"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-royal"
          />
          <ul className="mt-2 max-h-56 overflow-auto">
            {results.map((p) => (
              <li key={`${p.lat},${p.lon}`}>
                <button type="button" onClick={() => choose(p)} className="w-full rounded-lg px-2 py-2 text-right text-[14px] hover:bg-royal/[0.06]">
                  <span className="font-semibold">{p.name}</span>
                  {p.country && <span className="text-[12px] text-muted"> · {p.country}</span>}
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
