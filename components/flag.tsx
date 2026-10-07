/**
 * דגלים מתנופפים — SVG בלבד, בלי JS.
 * הדגל מחולק לרצועות אנכיות שזזות בגל עם הפרש פאזה, ועל כל רצועה צל/אור שמתחלפים
 * באותו קצב — כך נוצרים קפלים במראה תלת־ממדי. עם "הפחתת תנועה" הדגל נשאר סטטי.
 */

const W = 220;
const H = 160;
const SLICES = 22;
const SW = W / SLICES;

/** דגל מתנופף על תורן מוזהב. id ייחודי לכל דגל; delay מזיז את הגל כדי שהדגלים לא יזוזו בדיוק יחד */
function WavingFlag({ id, delay = 0, className = "", children }: { id: string; delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <span dir="ltr" className={`flag-3d inline-flex items-center ${className}`} aria-hidden>
      {/* תורן מוזהב */}
      <svg viewBox="0 0 6 60" className="h-full w-auto shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
        <defs>
          <linearGradient id={`${id}-pole`} x1="0" x2="1">
            <stop offset="0" stopColor="#a87a12" />
            <stop offset="0.45" stopColor="#ffe48a" />
            <stop offset="1" stopColor="#9a6c0c" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="4" width="3" height="56" rx="1.5" fill={`url(#${id}-pole)`} />
        <circle cx="3" cy="3.5" r="3" fill={`url(#${id}-pole)`} />
      </svg>

      <svg viewBox={`0 -12 ${W} ${H + 24}`} className="-ms-px h-[78%] w-auto overflow-visible drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
        <defs>
          <symbol id={`${id}-face`} viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
            {children}
          </symbol>
          {Array.from({ length: SLICES }, (_, i) => (
            <clipPath key={i} id={`${id}-s${i}`}>
              <rect x={i * SW - 0.4} y="-20" width={SW + 0.8} height={H + 40} />
            </clipPath>
          ))}
        </defs>

        {Array.from({ length: SLICES }, (_, i) => {
          const t = i / (SLICES - 1); // 0 ליד התורן → 1 בקצה
          const style = {
            "--d": `${(-i * 0.09 - delay).toFixed(2)}s`,
            "--a": `${(2 + t * 22).toFixed(1)}px`,
          } as React.CSSProperties;
          return (
            <g key={i} className="flag-slice" style={style} clipPath={`url(#${id}-s${i})`}>
              <use href={`#${id}-face`} />
              {/* צל ואור על הקפל */}
              <rect className="flag-shade" x={i * SW - 0.4} y="0" width={SW + 0.8} height={H} style={style} />
            </g>
          );
        })}
      </svg>
    </span>
  );
}

// מגן דוד: שני משולשים במרכז הדגל
const STAR_R = 30;
const tri = (rot: number) =>
  [0, 1, 2]
    .map((k) => {
      const a = ((rot + k * 120) * Math.PI) / 180;
      return `${(W / 2 + STAR_R * Math.sin(a)).toFixed(2)},${(H / 2 - STAR_R * Math.cos(a)).toFixed(2)}`;
    })
    .join(" ");

export function IsraelFlag({ className = "" }: { className?: string }) {
  return (
    <WavingFlag id="il-flag" className={className}>
      <rect width={W} height={H} fill="#fbfdff" />
      <rect y="15" width={W} height="25" fill="#0038b8" />
      <rect y="120" width={W} height="25" fill="#0038b8" />
      <g fill="none" stroke="#0038b8" strokeWidth="5.5" strokeLinejoin="miter">
        <polygon points={tri(0)} />
        <polygon points={tri(180)} />
      </g>
    </WavingFlag>
  );
}

/** דגל מכבי תל אביב — צהוב עם פסים כחולים וסמל המועדון במרכז */
export function MaccabiFlag({ className = "" }: { className?: string }) {
  return (
    <WavingFlag id="mta-flag" delay={0.7} className={className}>
      <rect width={W} height={H} fill="#ffd23f" />
      <rect y="15" width={W} height="25" fill="#1d4aa8" />
      <rect y="120" width={W} height="25" fill="#1d4aa8" />
      <circle cx={W / 2} cy={H / 2} r="45" fill="#1d4aa8" />
      <image href="/maccabi-logo.webp" x={W / 2 - 42} y={H / 2 - 42} width="84" height="84" preserveAspectRatio="xMidYMid meet" />
    </WavingFlag>
  );
}
