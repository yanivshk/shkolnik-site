/** אלמנטים של אווירת מכבי: כדורים, סמל אוהדים מקורי, סלוגן "רק מכבי" */

export function SoccerBall({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <path d="m12 8.2 3.6 2.6-1.4 4.2H9.8l-1.4-4.2z" fill="currentColor" />
      <path d="M12 8.2V2.8M15.6 10.8l5-1.8M14.2 15l3 4.3M9.8 15l-3 4.3M8.4 10.8l-5-1.8" />
    </svg>
  );
}

export function Basketball({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5v19" />
      <path d="M5.3 5.3c2.6 2.6 2.6 10.8 0 13.4M18.7 5.3c-2.6 2.6-2.6 10.8 0 13.4" />
    </svg>
  );
}

/** סמל אוהדים מקורי (לא הלוגו הרשמי): מגן כחול עם שבר צהוב וכדור סל */
export function FanCrest({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 36" className={className} aria-hidden>
      <path d="M16 1.5 29 6v11.5c0 8.2-5.6 14.3-13 17-7.4-2.7-13-8.8-13-17V6z" fill="var(--color-royal)" stroke="var(--color-gold)" strokeWidth="2" />
      <path d="M3.4 14 16 21l12.6-7v4.2L16 25.2 3.4 18.2z" fill="var(--color-gold)" />
      <g fill="none" stroke="var(--color-gold)" strokeWidth="1.3">
        <circle cx="16" cy="10.5" r="4.6" />
        <path d="M11.4 10.5h9.2M16 5.9v9.2" />
      </g>
    </svg>
  );
}

/** תגית קטנה "רק מכבי" */
export function RakMaccabi({ variant = "gold", className = "" }: { variant?: "gold" | "blue" | "outline"; className?: string }) {
  const styles = {
    gold: "bg-gold text-royal",
    blue: "bg-royal text-gold",
    outline: "border border-gold/80 text-gold",
  }[variant];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black tracking-tight ${styles} ${className}`}>
      <Basketball className="h-3 w-3" />
      רק מכבי
    </span>
  );
}

/** פס רץ כחול-צהוב עם "רק מכבי" וכדורים */
export function MaccabiMarquee() {
  const items = Array.from({ length: 10 });
  const row = (
    <div className="flex shrink-0 items-center gap-6 pe-6">
      {items.map((_, i) => (
        <span key={i} className="flex items-center gap-6">
          <span className={`text-[15px] font-black ${i % 2 ? "text-white" : "text-gold"}`}>רק מכבי</span>
          {i % 2 ? <SoccerBall className="h-4 w-4 text-gold" /> : <Basketball className="h-4 w-4 text-white/85" />}
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative -mt-5 mb-2 -rotate-1 overflow-hidden border-y-2 border-gold bg-royal py-2.5 shadow-[0_12px_30px_-14px_rgba(19,52,130,0.6)]" aria-label="רק מכבי">
      <div dir="ltr" className="marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}

/** מפריד קטן בין סקשנים */
export function MaccabiDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className="mx-auto mt-12 flex max-w-5xl items-center gap-3 px-4 text-[12px] font-bold" aria-hidden>
      <span className="h-0.5 flex-1 rounded-full bg-gradient-to-l from-gold to-royal/40" />
      {flip ? <SoccerBall className="h-4 w-4 text-royal" /> : <Basketball className="h-4 w-4 text-gold-deep" />}
      <span className={flip ? "text-gold-deep" : "text-royal"}>רק מכבי</span>
      {flip ? <Basketball className="h-4 w-4 text-gold-deep" /> : <SoccerBall className="h-4 w-4 text-royal" />}
      <span className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-gold to-royal/40" />
    </div>
  );
}
