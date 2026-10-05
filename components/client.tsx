"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
export function WorldClocks({ clocks }: { clocks: { label: string; tz: string; place: string }[] }) {
  const now = useNow(15_000);
  return (
    <div dir="ltr" className="mb-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${clocks.length}, minmax(0, 1fr))` }} aria-label="שעוני עולם">
      {clocks.map((c) => {
        const t = now
          ? new Intl.DateTimeFormat("en-GB", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now)
          : "--:--";
        return (
          <a
            key={c.label}
            href={`https://www.google.com/search?hl=he&q=${encodeURIComponent(c.place)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${c.place} — מידע בגוגל`}
            className="flex flex-col items-center rounded-xl border border-white/25 bg-white/10 px-1 py-1.5 backdrop-blur"
          >
            <span className="flex items-center gap-1 font-latin text-[10px] font-bold tracking-[0.12em] text-gold">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              {c.label}
            </span>
            <span className="tabular text-[15px] font-bold leading-tight text-white" suppressHydrationWarning>{t}</span>
          </a>
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
  { id: "markets", label: "בורסה", icon: "M3 17l5-5 4 4 8-9M15 7h5v5" },
  { id: "sports", label: "ספורט", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3v18M5.6 5.6c2.5 2.5 2.5 10.3 0 12.8M18.4 5.6c-2.5 2.5-2.5 10.3 0 12.8" },
  { id: "news", label: "חדשות", icon: "M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2h-1M7 9h7M7 12h7M7 15h4" },
  { id: "tesla", label: "טסלה", icon: "M13 2 4 14h7l-1 8 9-12h-7z" },
  { id: "ai", label: "AI", icon: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7zM10 10h4v4h-4z" },
];

export function BottomNav() {
  const [active, setActive] = useState("top");
  useEffect(() => {
    // "top" is <main> (the whole page), so it never leaves view; pick the last section past mid-screen instead.
    const els = NAV.slice(1).map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let id = "top";
      // On phones the first section starts above mid-screen, so keep "home" until half the hero is scrolled past.
      if (els[0] && window.scrollY >= (els[0].getBoundingClientRect().top + window.scrollY) / 2)
        for (const el of els) if (el.getBoundingClientRect().top <= mid) id = el.id;
      setActive(id);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <nav
      aria-label="ניווט ראשי"
      className="glass-strong isolate mx-auto w-full max-w-md rounded-[26px] px-2 py-1.5 shadow-[0_20px_50px_-20px_rgba(19,48,110,0.4)]"
    >
      <ul className="flex items-stretch justify-between gap-0.5">
        {NAV.map((n) => {
          const on = active === n.id;
          return (
            <li key={n.id} className="flex-1">
              <a
                href={`#${n.id}`}
                aria-current={on ? "true" : undefined}
                className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] transition-colors ${on ? "font-semibold text-royal" : "text-muted hover:text-ink"}`}
              >
                {on && <span className="absolute inset-0 -z-10 rounded-2xl bg-gold/70 shadow-[inset_0_0_0_1px_rgba(255,210,63,1)]" />}
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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

/** רענון אוטומטי של כל תוכני העמוד — כל 10 דקות כשהלשונית גלויה, ומיד בחזרה ללשונית אם עברו 10 דקות. בלי טעינה מחדש של הדף. */
export function AutoRefresh({ intervalMs = 10 * 60 * 1000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      last = Date.now();
      router.refresh();
    };
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last >= intervalMs) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);
  return null;
}
