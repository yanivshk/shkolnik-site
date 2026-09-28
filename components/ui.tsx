import type { Game, NewsItem, Quote } from "@/lib/types";
import { currencySymbol, formatGameTime, formatPct, normalizePrice, priceDigits, timeAgo } from "@/lib/format";
import { CountUp } from "./client";

export function Section({ id, eyebrow, title, action, children }: {
  id: string; eyebrow: string; title: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section id={id} className="reveal mx-auto w-full max-w-5xl px-4 pt-12" aria-labelledby={`${id}-title`}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-gold/80">
            <span className="h-px w-6 bg-gradient-to-l from-gold to-transparent" />
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className="text-[28px] font-extrabold leading-none tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ text = "הנתונים לא זמינים כרגע" }: { text?: string }) {
  return <div className="glass rounded-[var(--radius-card)] p-5 text-sm text-muted">{text}</div>;
}

export function Sparkline({ data, up, className = "", id }: { data: number[]; up: boolean; className?: string; id: string }) {
  if (data.length < 2) return null;
  const w = 120, h = 40;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const color = up ? "var(--color-up)" : "var(--color-down)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#g-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />
    </svg>
  );
}

export function ChangePill({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      dir="ltr"
      className={`tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${up ? "bg-up/12 text-up" : "bg-down/12 text-down"}`}
    >
      <svg viewBox="0 0 10 10" className={`h-2 w-2 ${up ? "" : "rotate-180"}`} aria-hidden><path d="M5 1 9 8H1z" fill="currentColor" /></svg>
      {formatPct(pct)}
    </span>
  );
}

export function QuoteTile({ q, featured = false, showCurrency = true }: { q: Quote; featured?: boolean; showCurrency?: boolean }) {
  const { value, currency } = normalizePrice(q.price, q.currency);
  const up = q.changePct >= 0;
  const digits = priceDigits(value);
  return (
    <article
      className={`glass neon-edge press relative overflow-hidden rounded-[var(--radius-card)] p-4 ${featured ? "col-span-2" : ""}`}
      aria-label={`${q.name} ${formatPct(q.changePct)}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`truncate font-bold ${featured ? "text-lg" : "text-[15px]"}`}>{q.name}</h3>
        <span className="tabular shrink-0 text-[10px] text-faint" dir="ltr">{q.symbol}</span>
      </div>
      <p className={`mt-2.5 font-bold leading-none ${featured ? "text-4xl" : "text-[22px]"}`}>
        <CountUp value={value} digits={digits} prefix={showCurrency ? currencySymbol(currency) : ""} />
      </p>
      <div className="mt-2"><ChangePill pct={q.changePct} /></div>
      <Sparkline data={q.series} up={up} id={q.symbol.replace(/[^a-z0-9]/gi, "")} className={`mt-3 w-full ${featured ? "h-24" : "h-10"}`} />
    </article>
  );
}

export function NewsList({ items, showSource = true }: { items: NewsItem[]; showSource?: boolean }) {
  if (!items.length) return <Empty />;
  return (
    <ul className="glass divide-y divide-line overflow-hidden rounded-[var(--radius-card)]">
      {items.map((n, i) => (
        <li key={`${n.link}-${i}`}>
          <a
            href={n.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]"
          >
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${n.highlight ? "bg-gold shadow-[0_0_10px_#ffd200]" : "bg-royal-2/80"}`} />
            <span className="min-w-0 flex-1">
              <span dir="auto" className={`line-clamp-2 block text-[15px] leading-snug ${n.highlight ? "font-bold text-gold-soft" : "font-medium"}`}>
                {n.title}
              </span>
              <span className="mt-1 block text-[11px] text-faint">
                {showSource && <>{n.source} · </>}{timeAgo(n.date)}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** קרוסלה אופקית עם snap — לכתבות מובילות */
export function NewsCarousel({ items }: { items: NewsItem[] }) {
  if (!items.length) return <Empty />;
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {items.map((n, i) => (
        <a
          key={`${n.link}-${i}`}
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          className="glass neon-edge press relative flex w-[78%] max-w-[320px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-5 sm:w-[300px]"
          style={{ minHeight: 170 }}
        >
          <span className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-royal-2/30 blur-2xl" />
          <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
            {n.source}
          </span>
          <span dir="auto" className="relative mt-4 line-clamp-3 text-[17px] font-bold leading-snug">{n.title}</span>
          <span className="relative mt-3 text-[11px] text-faint">{timeAgo(n.date)}</span>
        </a>
      ))}
    </div>
  );
}

function Team({ t, win }: { t: Game["home"]; win: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2">
        {t.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logo} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" loading="lazy" />
        ) : (
          <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-royal/60 text-[9px] font-bold">{t.short.slice(0, 2)}</span>
        )}
        <span dir="ltr" className={`truncate text-[14px] ${win ? "font-bold" : "text-ink/85"}`}>{t.name}</span>
      </span>
      <span className={`tabular text-[16px] ${win ? "font-bold text-ink" : "text-muted"}`}>{t.score}</span>
    </div>
  );
}

export function GameCard({ g }: { g: Game }) {
  const hs = Number(g.home.score), as = Number(g.away.score);
  const done = g.state === "post";
  return (
    <article className={`glass press relative overflow-hidden rounded-[var(--radius-card)] p-4 ${g.highlight ? "neon-edge" : ""}`}>
      <div className="mb-3 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-gold/85">{g.league}</span>
        {g.state === "in" ? (
          <span className="flex items-center gap-1.5 font-semibold text-down"><span className="live-dot h-1.5 w-1.5 rounded-full bg-down" />LIVE · {g.status}</span>
        ) : (
          <span className="text-faint">{done ? "הסתיים" : formatGameTime(g.date)}</span>
        )}
      </div>
      <div className="space-y-2" dir="ltr">
        <Team t={g.away} win={done && as > hs} />
        <Team t={g.home} win={done && hs > as} />
      </div>
    </article>
  );
}
