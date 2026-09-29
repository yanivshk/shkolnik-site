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
          {i % 2 ? <RealSoccerBall id={`mq-s${i}`} className="h-5 w-5" /> : <RealBasketball id={`mq-b${i}`} className="h-5 w-5" />}
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
      {flip ? <RealSoccerBall id="dv-s1" className="h-5 w-5" /> : <RealBasketball id="dv-b1" className="h-5 w-5" />}
      <MaccabiLogo className="h-6 w-6" />
      <span className={flip ? "text-gold-deep" : "text-royal"}>רק מכבי</span>
      {flip ? <RealBasketball id="dv-b2" className="h-5 w-5" /> : <RealSoccerBall id="dv-s2" className="h-5 w-5" />}
      <span className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-gold to-royal/40" />
    </div>
  );
}

/* ---------- כדורים "אמיתיים" (מוצללים, צבעוניים) ---------- */

/** כדורגל קלאסי שחור-לבן עם הצללה */
export function RealSoccerBall({ className = "h-10 w-10", id = "sb" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-w`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.65" stopColor="#e9edf3" />
          <stop offset="1" stopColor="#9aa3b2" />
        </radialGradient>
        <radialGradient id={`${id}-s`} cx="38%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#0b1530" stopOpacity="0" />
          <stop offset="1" stopColor="#0b1530" stopOpacity="0.35" />
        </radialGradient>
        <clipPath id={`${id}-c`}><circle cx="50" cy="50" r="48" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-w)`} />
      <g clipPath={`url(#${id}-c)`}>
        <g fill="#1b1f2a">
          <polygon points="50.0,37.0 62.4,46.0 57.6,60.5 42.4,60.5 37.6,46.0" />
          <polygon points="64.7,29.8 59.6,14.1 72.9,4.4 86.2,14.1 81.2,29.8" />
          <polygon points="73.8,57.7 87.1,48.1 100.4,57.7 95.3,73.4 78.9,73.4" />
          <polygon points="50.0,75.0 63.3,84.7 58.2,100.3 41.8,100.3 36.7,84.7" />
          <polygon points="26.2,57.7 21.1,73.4 4.7,73.4 -0.4,57.7 12.9,48.1" />
          <polygon points="35.3,29.8 18.8,29.8 13.8,14.1 27.1,4.4 40.4,14.1" />
        </g>
        <path
          d="M50.0 37.0L50.0 24.0M50.0 24.0L40.4 14.1M50.0 24.0L59.6 14.1M62.4 46.0L74.7 42.0M74.7 42.0L81.2 29.8M74.7 42.0L87.1 48.1M57.6 60.5L65.3 71.0M65.3 71.0L78.9 73.4M65.3 71.0L63.3 84.7M42.4 60.5L34.7 71.0M34.7 71.0L36.7 84.7M34.7 71.0L21.1 73.4M37.6 46.0L25.3 42.0M25.3 42.0L12.9 48.1M25.3 42.0L18.8 29.8"
          stroke="#5b6475" strokeWidth="1.2" fill="none"
        />
      </g>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-s)`} />
      <ellipse cx="36" cy="26" rx="13" ry="7" fill="#fff" opacity="0.55" transform="rotate(-30 36 26)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#0b1530" strokeOpacity="0.25" />
    </svg>
  );
}

/** כדורסל כתום עם תפרים והצללה */
export function RealBasketball({ className = "h-10 w-10", id = "bb" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-o`} cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffb266" />
          <stop offset="0.5" stopColor="#f07a1f" />
          <stop offset="1" stopColor="#a8440a" />
        </radialGradient>
        <pattern id={`${id}-p`} width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.5" fill="#7a2f05" opacity="0.35" />
        </pattern>
        <clipPath id={`${id}-c`}><circle cx="50" cy="50" r="48" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-o)`} />
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-p)`} />
      <g clipPath={`url(#${id}-c)`} fill="none" stroke="#2a1406" strokeWidth="2.6" strokeLinecap="round">
        <path d="M2 50 Q50 56 98 50" />
        <path d="M50 2 Q44 50 50 98" />
        <path d="M18 8 Q42 50 18 92" />
        <path d="M82 8 Q58 50 82 92" />
      </g>
      <ellipse cx="34" cy="25" rx="14" ry="7" fill="#fff" opacity="0.28" transform="rotate(-30 34 25)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#5a2204" strokeOpacity="0.5" />
    </svg>
  );
}

/** הלוגו של מכבי ת"א (קובץ שסופק על ידי בעל האתר) */
export function MaccabiLogo({ className = "h-8 w-8" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/maccabi-logo.webp" alt="מכבי תל אביב" width={264} height={264} className={`object-contain ${className}`} loading="lazy" />;
}

/** באנר נע מתקדם "רק מכבי": רקע כחול מונפש, ברק מחליק, שתי שורות בכיוונים מנוגדים */
export function MaccabiBanner() {
  const top = Array.from({ length: 8 });
  const bottom = Array.from({ length: 10 });
  const rowTop = (
    <div className="flex shrink-0 items-center gap-7 pe-7">
      {top.map((_, i) => (
        <span key={i} className="flex items-center gap-7">
          <span className="banner-word text-[26px] font-black leading-none text-gold">רק מכבי</span>
          {i % 2 ? (
            <RealSoccerBall id={`bn-s${i}`} className="spin-slow h-6 w-6" />
          ) : (
            <RealBasketball id={`bn-b${i}`} className="spin-slow h-6 w-6" />
          )}
        </span>
      ))}
    </div>
  );
  const rowBottom = (
    <div className="flex shrink-0 items-center gap-5 pe-5">
      {bottom.map((_, i) => (
        <span key={i} className="flex items-center gap-5 text-[12px] font-extrabold tracking-[0.25em]">
          <span className="text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.75)]">רק מכבי</span>
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <span className="font-latin text-white/70">RAK MACCABI</span>
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="mx-auto max-w-5xl px-3">
      <div
        className="banner-bg relative -mt-6 overflow-hidden rounded-[22px] border border-gold/70 py-3 shadow-[0_18px_40px_-18px_rgba(19,48,110,0.75)]"
        aria-label="רק מכבי"
        role="img"
      >
        <span className="banner-shine pointer-events-none absolute inset-y-0 w-1/3" aria-hidden />
        <div dir="ltr" className="banner-fade">
          <div dir="ltr" className="marquee flex w-max">{rowTop}{rowTop}</div>
          <div dir="ltr" className="marquee-rev mt-2 flex w-max">{rowBottom}{rowBottom}</div>
        </div>
        <span className="absolute inset-y-0 left-0 flex items-center bg-gradient-to-r from-navy via-navy/90 to-transparent pe-6 ps-2.5" aria-hidden>
          <span className="logo-pulse rounded-full">
            <MaccabiLogo className="h-11 w-11" />
          </span>
        </span>
      </div>
    </div>
  );
}

/** פס "רק מכבי" קומפקטי שרץ קבוע בתחתית המסך, מעל כפתורי הניווט */
export function MaccabiTicker() {
  const items = Array.from({ length: 8 });
  const row = (
    <div className="flex shrink-0 items-center gap-5 pe-5">
      {items.map((_, i) => (
        <span key={i} className="flex items-center gap-5">
          <span className={`text-[14px] font-black leading-none ${i % 2 ? "text-white" : "text-gold"}`}>רק מכבי</span>
          {i % 2 ? <RealSoccerBall id={`tk-s${i}`} className="h-4 w-4" /> : <RealBasketball id={`tk-b${i}`} className="h-4 w-4" />}
        </span>
      ))}
    </div>
  );
  return (
    <div className="banner-bg relative mx-auto w-full max-w-md overflow-hidden rounded-full border border-gold/70 py-1.5 shadow-[0_12px_28px_-14px_rgba(19,48,110,0.7)]" role="img" aria-label="רק מכבי">
      <span className="banner-shine pointer-events-none absolute inset-y-0 w-1/3" aria-hidden />
      <div dir="ltr" className="banner-fade ps-9">
        <div dir="ltr" className="marquee flex w-max">{row}{row}</div>
      </div>
      <span className="absolute inset-y-0 left-0 flex items-center ps-1" aria-hidden>
        <MaccabiLogo className="h-7 w-7" />
      </span>
    </div>
  );
}
