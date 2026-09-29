"use client";

import { useEffect, useRef, useState } from "react";

const TZ = "Asia/Jerusalem";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function Clock() {
  const now = useNow(1000);
  const t = now
    ? new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(now)
    : "--:--";
  return <span className="tabular text-sm text-ink/90" suppressHydrationWarning>{t}</span>;
}

export function Greeting({ name }: { name: string }) {
  const now = useNow(60_000);
  const h = now ? Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(now)) : 12;
  const g = h < 5 ? "לילה טוב" : h < 12 ? "בוקר טוב" : h < 17 ? "צהריים טובים" : h < 21 ? "ערב טוב" : "לילה טוב";
  return (
    <>
      {g}, <span className="text-gold-metal">{name}</span>
    </>
  );
}

/** שעוני עולם — שורה אחת, כל שעון מסומן בקיצור באנגלית */
export function WorldClocks({ clocks }: { clocks: { label: string; tz: string }[] }) {
  const now = useNow(15_000);
  return (
    <div dir="ltr" className="mb-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${clocks.length}, minmax(0, 1fr))` }} aria-label="שעוני עולם">
      {clocks.map((c) => {
        const t = now
          ? new Intl.DateTimeFormat("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now)
          : "--:--";
        return (
          <div key={c.label} className="flex flex-col items-center rounded-xl border border-white/25 bg-white/10 px-1 py-1.5 backdrop-blur">
            <span className="font-latin text-[10px] font-bold tracking-[0.12em] text-gold">{c.label}</span>
            <span className="tabular text-[15px] font-bold leading-tight text-white" suppressHydrationWarning>{t}</span>
          </div>
        );
      })}
    </div>
  );
}

/** מונה מונפש — נעצר מיידית אם המשתמש ביקש להפחית תנועה */
export function CountUp({ value, digits, prefix = "", suffix = "" }: { value: number; digits: number; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now(), from = value * 0.94, dur = 1100;
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 4);
        setV(from + (value - from) * eased);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  const s = new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
  return <span ref={ref} className="tabular" dir="ltr">{prefix}{s}{suffix}</span>;
}

const NAV = [
  { id: "top", label: "בית", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { id: "markets", label: "שווקים", icon: "M3 17l5-5 4 4 8-9M15 7h5v5" },
  { id: "tesla", label: "טסלה", icon: "M13 2 4 14h7l-1 8 9-12h-7z" },
  { id: "sports", label: "ספורט", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3v18M5.6 5.6c2.5 2.5 2.5 10.3 0 12.8M18.4 5.6c-2.5 2.5-2.5 10.3 0 12.8" },
  { id: "ai", label: "AI", icon: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7zM10 10h4v4h-4z" },
];

export function BottomNav() {
  const [active, setActive] = useState("top");
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <nav
      aria-label="ניווט ראשי"
      className="glass-strong isolate mx-auto w-full max-w-md rounded-[26px] px-2 py-1.5 shadow-[0_20px_50px_-20px_rgba(19,48,110,0.4)]"
    >
      <ul className="flex items-stretch justify-between">
        {NAV.map((n) => {
          const on = active === n.id;
          return (
            <li key={n.id} className="flex-1">
              <a
                href={`#${n.id}`}
                aria-current={on ? "true" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] transition-colors ${on ? "font-semibold text-royal" : "text-muted hover:text-ink"}`}
              >
                {on && <span className="absolute inset-0 -z-10 rounded-2xl bg-gold/70 shadow-[inset_0_0_0_1px_rgba(255,210,63,1)]" />}
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={n.icon} />
                </svg>
                {n.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
