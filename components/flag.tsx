/**
 * דגל ישראל מתנופף — SVG בלבד, בלי JS.
 * הדגל מחולק לרצועות אנכיות שזזות בגל עם הפרש פאזה, ועל כל רצועה צל/אור שמתחלפים
 * באותו קצב — כך נוצרים קפלים במראה תלת־ממדי. עם "הפחתת תנועה" הדגל נשאר סטטי.
 */

const W = 220;
const H = 160;
const SLICES = 22;
const SW = W / SLICES;

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
    <span dir="ltr" className={`flag-3d inline-flex items-center ${className}`} aria-hidden>
      {/* תורן מוזהב */}
      <svg viewBox="0 0 6 60" className="h-full w-auto shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
        <defs>
          <linearGradient id="flag-pole" x1="0" x2="1">
            <stop offset="0" stopColor="#a87a12" />
            <stop offset="0.45" stopColor="#ffe48a" />
            <stop offset="1" stopColor="#9a6c0c" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="4" width="3" height="56" rx="1.5" fill="url(#flag-pole)" />
        <circle cx="3" cy="3.5" r="3" fill="url(#flag-pole)" />
      </svg>

      <svg viewBox={`0 -12 ${W} ${H + 24}`} className="-ms-px h-[78%] w-auto overflow-visible drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
        <defs>
          <symbol id="il-flag" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
            <rect width={W} height={H} fill="#fbfdff" />
            <rect y="15" width={W} height="25" fill="#0038b8" />
            <rect y="120" width={W} height="25" fill="#0038b8" />
            <g fill="none" stroke="#0038b8" strokeWidth="5.5" strokeLinejoin="miter">
              <polygon points={tri(0)} />
              <polygon points={tri(180)} />
            </g>
          </symbol>
          {Array.from({ length: SLICES }, (_, i) => (
            <clipPath key={i} id={`flag-s${i}`}>
              <rect x={i * SW - 0.4} y="-20" width={SW + 0.8} height={H + 40} />
            </clipPath>
          ))}
        </defs>

        {Array.from({ length: SLICES }, (_, i) => {
          const t = i / (SLICES - 1); // 0 ליד התורן → 1 בקצה
          const style = {
            "--d": `${(-i * 0.09).toFixed(2)}s`,
            "--a": `${(2 + t * 22).toFixed(1)}px`,
          } as React.CSSProperties;
          return (
            <g key={i} className="flag-slice" style={style} clipPath={`url(#flag-s${i})`}>
              <use href="#il-flag" />
              {/* צל ואור על הקפל */}
              <rect className="flag-shade" x={i * SW - 0.4} y="0" width={SW + 0.8} height={H} style={style} />
            </g>
          );
        })}
      </svg>
    </span>
  );
}
