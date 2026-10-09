"use client";

import { useEffect, useState } from "react";
import type { Brief } from "@/lib/brief";
import type { Broadcast } from "@/lib/broadcasts";
import { formatPct } from "@/lib/format";
import { isLiveWindow, type Live } from "@/lib/live";

/** רצועת משחק חי: מופיעה רק כשמשחק שלנו בחלון השידור, ומתעדכנת כל דקה */
function LiveStrip({ items, initial }: { items: Broadcast[]; initial: Live[] }) {
  const [live, setLive] = useState(initial);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (!items.some((b) => isLiveWindow(b))) { if (alive) setLive([]); return; }
      try {
        const r = await fetch("/api/live", { cache: "no-store" });
        if (r.ok && alive) setLive((await r.json()).live as Live[]);
      } catch { /* keep last */ }
    };
    const id = setInterval(tick, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [items]);

  const rows = live.map((l) => ({ l, b: items.find((x) => x.id === l.id) })).filter((x): x is { l: Live; b: Broadcast } => !!x.b);
  if (!rows.length) return null;
  return (
    <div className="mb-2 flex flex-col gap-1.5">
      {rows.map(({ l, b }) => (
        <a key={b.id} href="#sports" className="flex items-center gap-2 rounded-xl bg-navy px-3 py-2 text-white" aria-live="polite">
          <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold ${l.state === "final" ? "bg-white/15" : "bg-down"}`}>
            {l.state !== "final" && <span className="live-dot h-1.5 w-1.5 rounded-full bg-white" />}
            {l.state === "final" ? "סיום" : "חי"}
          </span>
          {b.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logo} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
          )}
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
            {b.team} <span className="font-normal text-white/60">נגד</span> {b.opponent}
          </span>
          {l.us != null && l.them != null ? (
            <span dir="ltr" className="tabular text-[17px] font-extrabold text-gold">{l.us}–{l.them}</span>
          ) : (
            <span className="text-[12px] text-white/75">בשידור · {b.channels[0]}</span>
          )}
          {l.clock && l.state === "live" && <span className="text-[11px] text-white/60">{l.clock}</span>}
        </a>
      ))}
    </div>
  );
}

/** "הבוקר שלך" — תקציר אישי מסודר לפי השעה, משחק חי, ו"למה זה זז?" למניות שזזו חזק */
export function BriefCard({ brief, liveItems, live }: { brief: Brief; liveItems: Broadcast[]; live: Live[] }) {
  if (!brief.lines.length && !live.length) return null;
  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-4" aria-labelledby="brief-title">
      <div className="glass neon-edge relative overflow-hidden rounded-[var(--radius-card)] p-4">
        <span className="pointer-events-none absolute inset-x-6 top-0 h-0.5 rounded-full bg-gradient-to-l from-transparent via-gold to-transparent" />
        <h2 id="brief-title" className="mb-2 flex items-center gap-2 text-[17px] font-extrabold text-navy">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-gold" fill="currentColor" aria-hidden><path d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 15.4l-5.6 4.1 2.1-6.7L3 8.8h6.8z" /></svg>
          {brief.title}
        </h2>

        <LiveStrip items={liveItems} initial={live} />

        {brief.summary && <p className="mb-2 text-[15px] font-semibold leading-snug text-navy">{brief.summary}</p>}

        <ul className="flex flex-col gap-1.5">
          {brief.lines.map((l) => {
            const body = (
              <>
                <span className="w-5 shrink-0 text-center text-[15px] leading-6" aria-hidden>{l.icon}</span>
                <span className="min-w-0 flex-1 text-[14.5px] leading-6 text-ink">{l.text}</span>
                {l.href && <span className="shrink-0 text-[15px] leading-6 text-royal/60" aria-hidden>‹</span>}
              </>
            );
            return (
              <li key={l.key}>
                {l.href ? <a href={l.href} className="press flex items-start gap-2 rounded-lg">{body}</a> : <div className="flex items-start gap-2">{body}</div>}
              </li>
            );
          })}
        </ul>

        {brief.movers.length > 0 && (
          <div className="mt-3 border-t border-line/70 pt-2.5">
            <h3 className="mb-1.5 text-[12px] font-bold text-muted">למה זה זז?</h3>
            <ul className="flex flex-col gap-2">
              {brief.movers.map((m) => (
                <li key={m.symbol}>
                  <a href={m.link} target="_blank" rel="noopener noreferrer" className="press flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold ${m.changePct >= 0 ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
                      {m.name} <span dir="ltr" className="tabular">{formatPct(m.changePct)}</span>
                    </span>
                    <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-ink">
                      <span dir="auto" className="line-clamp-2">{m.title}</span>
                      {m.source && <span className="text-[11px] text-muted">{m.source}</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
