"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * מכ"ם גשם אינטראקטיבי: מפה כהה של ישראל + שכבת הגשם מ-RainViewer לשעתיים האחרונות (כל 10 דקות).
 * גרירה על פס הזמן / כפתור ניגון מעבירים בין התמונות. כל האריחים עוברים דרך השרת שלנו (/api/radar/tile, /api/basemap).
 */

type Frame = { time: number; path: string; forecast: boolean };

/** מרכז התצוגה ורוחבה, בפיקסלים של זום 7 (כל אריח = 256) */
const Z = 7;
const VIEW_W = 470; // ≈ 5 מעלות אורך — כל ישראל והים שמולה
const ASPECT = 1.2; // גובה = 1.2 × רוחב
const VIEW_H = VIEW_W * ASPECT;
const C_RAIN = ["#7fd3ff", "#2f7cf6", "#1e3cff", "#ffd400", "#ff4d00", "#d0006f"];

const world = (lat: number, lon: number) => {
  const n = 256 * 2 ** Z;
  const x = ((lon + 180) / 360) * n;
  const y = ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
  return { x, y };
};

/** האריחים שנדרשים לתצוגה בזום z, עם מיקום וגודל באחוזים מהמסגרת */
function tiles(left: number, top: number, z: number) {
  const size = 256 * 2 ** (Z - z); // גודל אריח בזום z, בפיקסלים של זום 7
  const out: { x: number; y: number; style: React.CSSProperties }[] = [];
  for (let tx = Math.floor(left / size); tx * size < left + VIEW_W; tx++) {
    for (let ty = Math.floor(top / size); ty * size < top + VIEW_H; ty++) {
      out.push({
        x: tx,
        y: ty,
        style: {
          left: `${((tx * size - left) / VIEW_W) * 100}%`,
          top: `${((ty * size - top) / VIEW_H) * 100}%`,
          width: `${(size / VIEW_W) * 100 + 0.05}%`, // חפיפה זעירה — בלי קווי תפר בין אריחים
          height: `${(size / VIEW_H) * 100 + 0.05}%`,
        },
      });
    }
  }
  return out;
}

const hm = (t: number) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(t * 1000));

export function RainRadar({ marker }: { marker?: { lat: number; lon: number; name: string } }) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(-1);
  const countRef = useRef(0);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  // רשימת התמונות — בטעינה ובכל 5 דקות; ברירת מחדל: התמונה האחרונה (עכשיו)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/radar");
        const d = (await r.json()) as { frames: Frame[] };
        if (!alive) return;
        if (!d.frames?.length) { setFailed(true); return; }
        setFailed(false);
        // מי שעמד על "עכשיו" (או בטעינה הראשונה) — עובר לתמונה החדשה ביותר
        const wasLatest = idxRef.current < 0 || idxRef.current >= countRef.current - 1;
        countRef.current = d.frames.length;
        setFrames(d.frames);
        setIdx((i) => (wasLatest ? d.frames.filter((f) => !f.forecast).length - 1 : Math.min(i, d.frames.length - 1)));
      } catch {
        if (alive) setFailed(true);
      }
    };
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // ניגון: מעבר בין התמונות, ועצירה קצרה על האחרונה
  useEffect(() => {
    if (!playing || !frames.length) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % frames.length), 600);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const { left, top } = useMemo(() => {
    const c = world(31.55, 34.95); // מרכז ישראל, עם הים שמול החוף
    return { left: c.x - VIEW_W / 2, top: c.y - VIEW_H / 2 };
  }, []);
  const baseTiles = useMemo(() => tiles(left, top, 8), [left, top]);
  const rainTiles = useMemo(() => tiles(left, top, 7), [left, top]);
  const pin = marker ? world(marker.lat, marker.lon) : null;

  const pick = (clientX: number) => {
    const r = barRef.current?.getBoundingClientRect();
    if (!r || !frames.length) return;
    // "עכשיו" בצד ימין (כמו בגרפים שמעל), לפני שעתיים בצד שמאל
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    setPlaying(false);
    setIdx(Math.round(f * (frames.length - 1)));
  };

  const cur = frames[idx];
  const last = frames.filter((f) => !f.forecast).length - 1;
  const label = !cur ? "" : idx === last ? `עכשיו · ${hm(cur.time)}` : cur.forecast ? `תחזית · ${hm(cur.time)}` : `לפני ${Math.round((frames[last].time - cur.time) / 60)} דק׳ · ${hm(cur.time)}`;

  return (
    <section aria-label="מכ״ם גשם" className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0d2152] p-3 text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-4">
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-[#2f7cf6] to-transparent" />

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12px] text-white/60">RainViewer · עדכון כל 10 דקות</span>
        <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${idx === last ? "bg-white/10 text-white/85" : "bg-gold text-navy"}`} aria-live="polite">{label}</span>
      </div>

      {/* המפה */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#1b1b1d]" style={{ aspectRatio: `1 / ${ASPECT}` }}>
        {baseTiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`b${t.x}-${t.y}`} src={`/api/basemap?l=base&z=8&x=${t.x}&y=${t.y}`} alt="" className="absolute max-w-none select-none" style={t.style} draggable={false} />
        ))}
        {/* כל התמונות נטענות מראש ומוחלפות בשקיפות — בלי הבהוב בזמן הגרירה */}
        {frames.map((f, i) =>
          Math.abs(i - idx) <= 13 ? (
            <div key={f.path} className="absolute inset-0 transition-opacity duration-150" style={{ opacity: i === idx ? 0.85 : 0 }} aria-hidden>
              {rainTiles.map((t) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`${t.x}-${t.y}`} src={`/api/radar/tile?p=${encodeURIComponent(f.path)}&z=7&x=${t.x}&y=${t.y}`} alt="" className="absolute max-w-none select-none" style={t.style} draggable={false} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
              ))}
            </div>
          ) : null,
        )}
        {baseTiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={`r${t.x}-${t.y}`} src={`/api/basemap?l=ref&z=8&x=${t.x}&y=${t.y}`} alt="" className="pointer-events-none absolute max-w-none select-none" style={t.style} draggable={false} />
        ))}
        {pin && (
          <span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${((pin.x - left) / VIEW_W) * 100}%`, top: `${((pin.y - top) / VIEW_H) * 100}%` }}>
            <span className="block h-3 w-3 rounded-full border-2 border-white bg-gold shadow-[0_0_8px_rgba(0,0,0,0.6)]" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-black/55 px-1 text-[11px] font-semibold">{marker!.name}</span>
          </span>
        )}
        {failed && <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[13px] text-white/75">המכ״ם לא זמין כרגע</p>}
        <span className="absolute bottom-1 left-1.5 text-[9px] text-white/50">© RainViewer · Esri</span>
      </div>

      {/* פס הזמן: גרירה בין התמונות — משמאל (לפני שעתיים) לימין (עכשיו) */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => { if (!playing && idx === frames.length - 1) setIdx(0); setPlaying((p) => !p); }}
          aria-label={playing ? "עצירה" : "ניגון"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M17 5v14L6 12z" /></svg>
          )}
        </button>
        <div
          ref={barRef}
          dir="ltr"
          role="slider"
          tabIndex={0}
          aria-label="שעת תמונת המכ״ם"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, frames.length - 1)}
          aria-valuenow={idx}
          aria-valuetext={label}
          className="relative h-8 flex-1 cursor-ew-resize touch-pan-y outline-none"
          onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); pick(e.clientX); }}
          onPointerMove={(e) => { if (e.buttons) pick(e.clientX); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
            else if (e.key === "ArrowRight") setIdx((i) => Math.min(frames.length - 1, i + 1));
            else return;
            setPlaying(false);
            e.preventDefault();
          }}
        >
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
          {frames.map((f, i) => {
            const x = frames.length > 1 ? (i / (frames.length - 1)) * 100 : 100;
            return (
              <span key={f.path} className={`absolute top-1/2 h-2 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${i <= idx ? "bg-white/70" : "bg-white/25"}`} style={{ left: `${x}%` }} />
            );
          })}
          {cur && (
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0d2152] shadow-[0_0_8px_rgba(255,255,255,0.7)] transition-[left] duration-100"
              style={{ left: `${frames.length > 1 ? (idx / (frames.length - 1)) * 100 : 100}%`, background: idx === last ? "#4ade80" : "#ffffff" }}
            />
          )}
        </div>
      </div>
      <div dir="ltr" className="mt-0.5 flex justify-between pe-10 text-[10px] text-white/50">
        <span className="tabular">{frames[0] ? hm(frames[0].time) : ""}</span>
        <span className="tabular">{frames[last] ? hm(frames[last].time) : ""}</span>
      </div>

      {/* מקרא עוצמת הגשם */}
      <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-[10.5px] text-white/65">
        <span>חלש</span>
        <span className="h-2 flex-1 rounded-full" style={{ background: `linear-gradient(to left, ${C_RAIN.join(",")})` }} />
        <span>חזק</span>
        <span className="ms-2 flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border-2 border-white bg-gold" />{marker?.name ?? "מיקום"}</span>
      </div>
    </section>
  );
}
