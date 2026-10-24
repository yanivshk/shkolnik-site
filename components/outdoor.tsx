"use client";

import { useMemo } from "react";
import type { SurfHour } from "@/lib/surf-spots";
import {
  ACTIVITIES, LEVEL_TEXT, bestWindow, dirWord, feel as feelOf, isRainy, kmh, seaWord, sky as skyOf, uvWord, visWord, windWord,
  type Feel, type Level, type OutHour, type Sky,
} from "@/lib/outdoor";

/**
 * "עכשיו בחוץ" ו"השבוע במבט אחד" — תמונת מצב מהירה של מה שקורה בחוץ, ברחוב ובים.
 * כל הכללים (נעים / חם / מתאים לאופניים וכו') ב-lib/outdoor.ts.
 */

const hh = (t: string) => t.slice(11, 13);
const DAYS = ["יום א׳", "יום ב׳", "יום ג׳", "יום ד׳", "יום ה׳", "יום ו׳", "שבת"];
const dayOf = (t: string) => DAYS[new Date(`${t.slice(0, 10)}T12:00:00Z`).getUTCDay()];

/** שעה בתחזית → יחידות הכללים. בלי נתוני מזג אוויר — null */
function toOut(h: SurfHour, coastal: boolean): OutHour | null {
  if (h.feel == null && h.temp == null) return null;
  return {
    feel: h.feel ?? h.temp!,
    windKmh: kmh(h.wind),
    windDir: h.windDir,
    rain: h.rain ?? 0,
    code: h.code ?? 0,
    wave: coastal ? h.wave : undefined,
    period: coastal ? h.period : undefined,
  };
}

/* ---------------- אייקונים ---------------- */

const SKY_SVG: Record<Sky | "moon", React.ReactNode> = {
  sun: (<><circle cx="12" cy="12" r="4.2" fill="#ffd23f" /><g stroke="#ffd23f" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></g></>),
  partly: (<><circle cx="9" cy="9" r="3.6" fill="#ffd23f" /><g stroke="#ffd23f" strokeWidth="1.6" strokeLinecap="round"><path d="M9 2.6v1.6M2.6 9h1.6M4.4 4.4l1.1 1.1M13.6 4.4l-1.1 1.1" /></g><path d="M8 19.5h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.2A2.9 2.9 0 0 0 8 19.5z" fill="#dbe7ff" stroke="#b9c8e6" strokeWidth=".6" /></>),
  cloud: <path d="M6.5 19h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.4A3.3 3.3 0 0 0 6.5 19z" fill="#b8c6e3" />,
  rain: (<><path d="M6.5 15h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.4A3.3 3.3 0 0 0 6.5 15z" fill="#9fb0d4" /><g stroke="#3b9cff" strokeWidth="1.8" strokeLinecap="round"><path d="M8 17.5l-1 2.5M12 17.5l-1 2.5M16 17.5l-1 2.5" /></g></>),
  fog: <g stroke="#b6c2da" strokeWidth="2" strokeLinecap="round"><path d="M4 9h16M6 13h12M4 17h16" /></g>,
  storm: (<><path d="M6.5 14h11a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8 1.4A3.3 3.3 0 0 0 6.5 14z" fill="#8c9ac0" /><path d="M12 14l-2 4h3l-1.5 4" stroke="#f5b400" strokeWidth="1.8" fill="none" strokeLinejoin="round" /></>),
  moon: <path d="M15.5 3.5a8.5 8.5 0 1 0 5 15 7 7 0 0 1-5-15z" fill="#fde68a" />,
};
function SkyIcon({ k, size = 24 }: { k: Sky | "moon"; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden className="shrink-0">{SKY_SVG[k]}</svg>;
}
function WindArrow({ from, size = 10 }: { from: number; size?: number }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} style={{ transform: `rotate(${from + 180}deg)` }} aria-hidden>
      <path d="M5 .5 8.5 9 5 7 1.5 9z" fill="currentColor" />
    </svg>
  );
}
const night = (t: string) => +hh(t) < 6 || +hh(t) >= 18;

/* ---------------- צבעים ---------------- */

/** רקעי הקוביות: גוונים רכים לפי התחושה בחוץ; גשם גובר */
const TONE: Record<Feel | "rain", { bg: string; ink: string; label: string }> = {
  cold: { bg: "linear-gradient(160deg,#eff6ff,#bfdbfe)", ink: "#1e3a8a", label: "קר" },
  cool: { bg: "linear-gradient(160deg,#f0f9ff,#bae6fd)", ink: "#075985", label: "קריר" },
  pleasant: { bg: "linear-gradient(160deg,#f0fdf4,#bbf7d0)", ink: "#166534", label: "נעים" },
  warm: { bg: "linear-gradient(160deg,#fffbeb,#fde68a)", ink: "#92400e", label: "חם" },
  hot: { bg: "linear-gradient(160deg,#fff7ed,#fdba74)", ink: "#9a3412", label: "חם מאוד" },
  scorching: { bg: "linear-gradient(160deg,#fff1f2,#fda4af)", ink: "#9f1239", label: "לוהט" },
  rain: { bg: "linear-gradient(160deg,#eef2ff,#c7d2fe)", ink: "#3730a3", label: "גשום" },
};
const LEGEND: (Feel | "rain")[] = ["cool", "pleasant", "warm", "hot", "scorching", "rain"];
const toneOf = (o: OutHour) => TONE[isRainy(o) ? "rain" : feelOf(o.feel).key];

const LEVEL_STYLE: Record<Level, { ink: string; bg: string; dot: string }> = {
  2: { ink: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  1: { ink: "#a16207", bg: "#fef3c7", dot: "#f59e0b" },
  0: { ink: "#be123c", bg: "#ffe4e6", dot: "#f43f5e" },
};

/** מקרא הצבעים — מופיע מתחת לכל יום */
function ToneLegend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-semibold text-slate-600" aria-label="מקרא צבעים">
      {LEGEND.map((k) => (
        <span key={k} className="rounded-full px-2 py-px" style={{ background: TONE[k].bg, color: TONE[k].ink }}>{TONE[k].label}</span>
      ))}
      <span className="text-[10.5px] font-medium text-slate-500">· לפי "מרגיש כמו"</span>
    </div>
  );
}

/* ================= עכשיו בחוץ ================= */

const SCENE: Record<Sky | "night", string> = {
  sun: "linear-gradient(155deg,#2f80ed 0%,#56a8f5 55%,#ffd27a 130%)",
  partly: "linear-gradient(155deg,#3b6fd0 0%,#78a7e6 60%,#ffe2a8 135%)",
  cloud: "linear-gradient(155deg,#4a5d86,#8e9dbd)",
  rain: "linear-gradient(155deg,#2e4170,#5d73a3)",
  fog: "linear-gradient(155deg,#66769a,#aeb9cf)",
  storm: "linear-gradient(155deg,#1f2a4a,#4d5d86)",
  night: "linear-gradient(155deg,#0b1636,#24386e)",
};

function Gauge({ label, value, word, pct, color, sub }: { label: string; value: string; word: string; pct: number; color: string; sub?: string }) {
  return (
    <div className="rounded-[14px] bg-white/[0.07] px-2.5 py-2">
      <div className="text-[12px] text-white/60">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <b dir="ltr" className="tabular text-[20px]">{value}</b>
        <span className="text-[13px] font-bold" style={{ color }}>{word}</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-white/[0.12]"><div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, pct))}%`, background: color }} /></div>
      {sub && <div className="mt-1 text-[11.5px] text-white/60">{sub}</div>}
    </div>
  );
}

const FEEL_COLOR: Record<Feel, string> = { cold: "#93c5fd", cool: "#7dd3fc", pleasant: "#4ade80", warm: "#fde047", hot: "#fb923c", scorching: "#f87171" };

export function NowCard({ hours, now, coastal, place }: { hours: SurfHour[]; now: number; coastal: boolean; place: string }) {
  const h = hours[now];
  const o = h ? toOut(h, coastal) : null;

  // השעות הכי טובות היום (מעכשיו ועד 20:00) לכל פעילות
  const plans = useMemo(() => {
    if (!h) return [];
    const today = h.time.slice(0, 10);
    const idx = hours.map((x, i) => i).filter((i) => i >= now && hours[i].time.startsWith(today) && +hh(hours[i].time) >= 6 && +hh(hours[i].time) <= 19);
    return ACTIVITIES.filter((a) => coastal || !a.sea).map((a) => {
      const lv = idx.map((i) => { const x = toOut(hours[i], coastal); return x ? a.fn(x) : null; });
      const w = bestWindow(lv);
      return { ...a, level: w.level, from: w.from >= 0 ? hours[idx[w.from]].time : null, to: w.to >= 0 ? hours[idx[w.to]].time : null };
    });
  }, [hours, now, coastal, h]);

  if (!h || !o) return null;
  const s = skyOf(o.code, h.cloud ?? 0);
  const f = feelOf(o.feel);
  const isNight = night(h.time);
  const icon: Sky | "moon" = isNight && (s.key === "sun" || s.key === "partly") ? "moon" : s.key;
  const sea = coastal && h.wave != null ? `ים ${seaWord(h.wave)}` : "";
  const headline = [`${s.text} ו${f.text}`, `${windWord(o.windKmh)} מ${dirWord(o.windDir)}`, sea].filter(Boolean).join(" · ");

  return (
    <section aria-label="עכשיו בחוץ" className="overflow-hidden rounded-[22px] border border-white/15 bg-[#0d2152] text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]">
      <div className="px-3.5 pb-3.5 pt-3" style={{ background: SCENE[isNight ? "night" : s.key] }}>
        <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-0.5 text-[13px] font-bold">
          {place} · עכשיו <span dir="ltr" className="tabular">{hh(h.time)}:00</span>
        </span>
        <div className="mt-2.5 flex items-center gap-3">
          <SkyIcon k={icon} size={64} />
          <div>
            <div dir="ltr" className="tabular text-[46px] font-black leading-none">{Math.round(h.temp ?? o.feel)}°</div>
            <div className="text-[14px] font-semibold opacity-90">מרגיש כמו <span dir="ltr" className="tabular">{Math.round(o.feel)}°</span></div>
          </div>
        </div>
        <p className="mt-2.5 text-[18px] font-extrabold leading-snug [text-shadow:0_1px_6px_rgba(0,0,0,.25)]">{headline}</p>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <Gauge label="מרגיש כמו" value={`${Math.round(o.feel)}°`} word={f.text} pct={((o.feel - 5) / 35) * 100} color={FEEL_COLOR[f.key]} sub={`במדחום ${Math.round(h.temp ?? o.feel)}°${h.humidity != null ? ` · לחות ${Math.round(h.humidity)}%` : ""}`} />
          <Gauge label="רוח" value={`${Math.round(o.windKmh)} קמ״ש`} word={windWord(o.windKmh)} pct={(o.windKmh / 50) * 100} color="#9ad8f2" sub={`${h.gust != null ? `משבים עד ${Math.round(kmh(h.gust))} · ` : ""}מ${dirWord(o.windDir)}`} />
          <Gauge label="שמיים" value={`${Math.round(h.cloud ?? 0)}%`} word={s.text} pct={h.cloud ?? 0} color="#c9d3e8" sub={`כיסוי עננים${o.rain >= 20 ? ` · גשם ${o.rain}%` : ""}`} />
          {h.vis != null && <Gauge label="ראות" value={`${Math.round(h.vis / 1000)} ק״מ`} word={visWord(h.vis)} pct={h.vis / 400} color="#7dd3fc" sub={h.vis >= 20000 ? "רואים רחוק" : "אובך"} />}
          {h.uv != null && <Gauge label="קרינת UV" value={`${Math.round(h.uv)}`} word={uvWord(h.uv)} pct={(h.uv / 11) * 100} color="#ff9f43" sub={h.uv >= 6 ? "כובע וקרם הגנה" : h.uv >= 3 ? "קרם הגנה" : "אין צורך בהגנה"} />}
          {coastal && h.wave != null ? (
            <Gauge label="ים" value={`${h.wave.toFixed(1)} מ׳`} word={seaWord(h.wave)} pct={(h.wave / 2.5) * 100} color="#38bdf8" sub={`גובה גל · מחזור ${Math.round(h.period)} שנ׳`} />
          ) : h.humidity != null ? (
            <Gauge label="לחות" value={`${Math.round(h.humidity)}%`} word={h.humidity >= 75 ? "לח" : h.humidity <= 35 ? "יבש" : "רגיל"} pct={h.humidity} color="#38bdf8" sub="לחות יחסית באוויר" />
          ) : null}
        </div>

        <h3 className="mt-3 text-[13px] font-bold text-white/65">מה מתאים היום · השעות הכי טובות</h3>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {plans.map((p) => (
            <li key={p.key} className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-2.5 py-2">
              <span className="text-[19px]" aria-hidden>{p.icon}</span>
              <b className="text-[14.5px]">{p.name}</b>
              <span className="ms-auto flex items-center gap-1.5 text-[13.5px]">
                {p.level == null ? (
                  <span className="text-white/60">אין נתונים</span>
                ) : (
                  <>
                    <span className="font-extrabold" style={{ color: LEVEL_STYLE[p.level].dot }}>{LEVEL_TEXT[p.level]}</span>
                    <span className="text-white/40">·</span>
                    {p.level > 0 && p.from && p.to ? (
                      <span dir="ltr" className="tabular font-bold">{hh(p.from)}:00–{String(+hh(p.to) + 1).padStart(2, "0")}:00</span>
                    ) : (
                      <span className="text-white/70">לא היום</span>
                    )}
                  </>
                )}
              </span>
            </li>
          ))}
          {!plans.length && <li className="text-[13px] text-white/60">אין יותר שעות אור היום</li>}
        </ul>

        <h3 className="mt-3 text-[13px] font-bold text-white/65">12 השעות הקרובות · מרגיש כמו (°) ורוח (קמ״ש)</h3>
        <div className="mt-1.5 flex rounded-xl bg-white/[0.05] px-0.5 py-2">
          {hours.slice(now, now + 12).map((x) => {
            const ox = toOut(x, coastal);
            if (!ox) return null;
            const sx = skyOf(ox.code, x.cloud ?? 0).key;
            return (
              <div key={x.time} className="flex-1 text-center">
                <div dir="ltr" className="tabular text-[11px] text-white/60">{hh(x.time)}</div>
                <div className="my-0.5 flex justify-center"><SkyIcon k={night(x.time) && (sx === "sun" || sx === "partly") ? "moon" : sx} size={20} /></div>
                <div dir="ltr" className="tabular text-[13px] font-bold">{Math.round(ox.feel)}°</div>
                <div className="mx-[3px] mt-0.5 h-[3px] rounded-full" style={{ background: FEEL_COLOR[feelOf(ox.feel).key] }} />
                <div dir="ltr" className="tabular mt-0.5 flex items-center justify-center gap-px text-[10.5px] text-white/60"><WindArrow from={ox.windDir} size={8} />{Math.round(ox.windKmh)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ================= השבוע במבט אחד ================= */

const SLOTS = [
  { hh: "07", name: "בוקר" },
  { hh: "12", name: "צהריים" },
  { hh: "17", name: "ערב" },
];

function Cell({ h, i, slot, coastal, isNow, selected, past, onSel }: { h: SurfHour | undefined; i: number; slot: (typeof SLOTS)[number]; coastal: boolean; isNow: boolean; selected: boolean; past: boolean; onSel: (i: number) => void }) {
  const o = h ? toOut(h, coastal) : null;
  if (!h || !o) {
    return (
      <div className="grid min-h-[150px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-2 text-center text-[12px] text-slate-500">
        <div><div className="font-bold text-slate-600">{slot.name}</div>{past ? "עבר" : "אין עדיין תחזית"}</div>
      </div>
    );
  }
  const t = toneOf(o);
  const s = skyOf(o.code, h.cloud ?? 0);
  const icon: Sky | "moon" = night(h.time) && (s.key === "sun" || s.key === "partly") ? "moon" : s.key;
  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-1 leading-[1.6]">
      <span className="text-[12px] text-slate-600 max-[399px]:text-[11px]">{label}</span>
      <b dir="ltr" className="tabular inline-flex items-center gap-0.5 whitespace-nowrap text-[13.5px] text-slate-800 max-[399px]:text-[12px]">{value}</b>
    </div>
  );
  return (
    <button
      type="button"
      onClick={() => onSel(i)}
      aria-pressed={selected}
      aria-label={`${slot.name}: מרגיש כמו ${Math.round(o.feel)} מעלות, ${s.text}, רוח ${Math.round(o.windKmh)} קמ״ש, גשם ${o.rain}%${coastal && h.wave != null ? `, גל ${h.wave.toFixed(1)} מטר` : ""}`}
      className={`press relative w-full rounded-2xl border border-white/80 px-2 pb-1.5 pt-2 text-start transition-transform ${past ? "opacity-55" : ""} ${selected ? "ring-2 ring-navy" : isNow ? "ring-2 ring-emerald-500" : ""} shadow-[0_8px_18px_-12px_rgba(15,23,42,.45)]`}
      style={{ background: t.bg }}
    >
      {/* שעה ביום */}
      <div className="flex items-center justify-between gap-1 whitespace-nowrap text-[12.5px] font-bold text-slate-700">
        <span>{slot.name}</span>
        <span dir="ltr" className="tabular text-[11.5px] text-slate-500">{slot.hh}:00</span>
      </div>
      {/* מרגיש כמו — המספר הגדול, עם המילה שמתארת אותו */}
      <div className="mt-1 flex items-center justify-between gap-1">
        <div>
          <span className="block text-[11px] font-semibold text-slate-600">מרגיש כמו</span>
          <b dir="ltr" className="tabular block text-[27px] leading-none" style={{ color: t.ink }}>{Math.round(o.feel)}°</b>
        </div>
        <SkyIcon k={icon} size={32} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1 text-[12.5px] font-bold leading-tight">
        {/* בגשם — רק סוג הגשם (בלי "גשום · גשם") */}
        {!isRainy(o) && <><span style={{ color: t.ink }}>{t.label}</span><span className="text-slate-400">·</span></>}
        <span style={isRainy(o) ? { color: t.ink } : undefined} className={isRainy(o) ? "" : "text-slate-700"}>{s.text}</span>
      </div>
      {isNow && <span className="absolute -top-2 start-2 rounded-full bg-emerald-500 px-1.5 text-[10.5px] font-extrabold text-white shadow">עכשיו</span>}
      <div className="mt-1" />
      <div className="border-t border-dashed border-slate-500/25 pt-1">
        <Row label="רוח" value={<><WindArrow from={o.windDir} size={9} />{Math.round(o.windKmh)} קמ״ש</>} />
        <Row label="גשם" value={`${o.rain}%`} />
        {coastal && h.wave != null && <Row label="גל" value={`${h.wave.toFixed(1)} מ׳`} />}
      </div>
    </button>
  );
}

export function WeekGrid({ hours, now, sel, coastal, onSel }: { hours: SurfHour[]; now: number; sel: number; coastal: boolean; onSel: (i: number) => void }) {
  const days = useMemo(() => {
    const today = hours[now]?.time.slice(0, 10) ?? "";
    const keys = [...new Set(hours.map((h) => h.time.slice(0, 10)))].filter((d) => d >= today).slice(0, 7);
    const pos = new Map(hours.map((h, i) => [h.time, i]));
    return keys.map((day, n) => {
      const idx = hours.map((_, i) => i).filter((i) => hours[i].time.startsWith(day) && +hh(hours[i].time) >= 6 && +hh(hours[i].time) <= 19);
      const outs = idx.map((i) => toOut(hours[i], coastal)).filter((x): x is OutHour => !!x);
      const feels = outs.map((x) => x.feel);
      const rainy = outs.some((x) => x.code >= 51) || outs.some((x) => x.rain >= 40);
      const noon = hours[pos.get(`${day}T12:00`) ?? idx[Math.floor(idx.length / 2)] ?? 0];
      const no = noon ? toOut(noon, coastal) : null;
      const sk = no ? skyOf(no.code, noon.cloud ?? 0) : null;
      const maxWind = Math.max(0, ...outs.map((x) => x.windKmh));
      const maxFeel = feels.length ? Math.max(...feels) : NaN;
      const character = !outs.length ? "" : (rainy ? `גשום · עד ${Math.round(maxFeel)}°` : `${sk?.text ?? ""} · ${feelOf(maxFeel).text}`) + (maxWind >= 20 ? ` · ${windWord(maxWind)}` : "");
      // המלצות היום — לשעות שעוד לפנינו
      const future = idx.filter((i) => i >= now);
      const acts = ACTIVITIES.filter((a) => a.key !== "walk" && a.key !== "swim" && (coastal || !a.sea)).map((a) => {
        const lv = future.map((i) => { const x = toOut(hours[i], coastal); return x ? a.fn(x) : null; });
        const w = bestWindow(lv);
        const at = w.from >= 0 ? +hh(hours[future[w.from]].time) : -1;
        return { ...a, level: w.level, when: at < 0 ? "" : at < 11 ? "בבוקר" : at < 15 ? "בצהריים" : "אחה״צ" };
      });
      return {
        day, n, sk, character, acts,
        range: feels.length ? [Math.round(Math.min(...feels)), Math.round(maxFeel)] : null,
        slots: SLOTS.map((sl) => ({ sl, i: pos.get(`${day}T${sl.hh}:00`) ?? -1 })),
      };
    });
  }, [hours, now, coastal]);

  const label = (n: number, day: string) => (n === 0 ? "היום" : n === 1 ? "מחר" : dayOf(day));
  const nowHH = +hh(hours[now]?.time ?? "T00");

  return (
    <div className="flex flex-col gap-3">
      {days.map((d) => (
        <article key={d.day} aria-label={label(d.n, d.day)} className="rounded-[22px] border border-slate-200 bg-white/80 px-2 pb-2 pt-2.5 shadow-[0_10px_30px_-18px_rgba(19,48,110,.35)] backdrop-blur">
          <header className="flex items-center gap-2">
            {d.sk && <SkyIcon k={d.sk.key} size={30} />}
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <b className="text-[18px] text-navy">{label(d.n, d.day)}</b>
                <span dir="ltr" className="tabular text-[12.5px] text-slate-400">{d.day.slice(8, 10)}.{d.day.slice(5, 7)}</span>
              </div>
              <div className="text-[13px] font-semibold text-slate-600">{d.character}</div>
            </div>
            {d.range && (
              <div className="ms-auto text-end leading-tight">
                <span className="text-[11px] text-slate-500">מרגיש בין</span>
                <div dir="ltr" className="tabular text-[15px] font-extrabold text-navy">{d.range[0]}°–{d.range[1]}°</div>
              </div>
            )}
          </header>

          <div className="my-2 flex flex-wrap gap-1.5">
            {d.acts.map((a) => (
              <span key={a.key} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-extrabold" style={a.level == null ? { background: "#f1f5f9", color: "#64748b" } : { background: LEVEL_STYLE[a.level].bg, color: LEVEL_STYLE[a.level].ink }}>
                <span aria-hidden>{a.icon}</span>{a.name}
                <span className="opacity-50">·</span>
                {a.level == null ? "עבר" : LEVEL_TEXT[a.level]}
                {a.level ? <span className="font-semibold opacity-80">{a.when}</span> : null}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {d.slots.map(({ sl, i }) => (
              <Cell
                key={sl.hh}
                h={i >= 0 ? hours[i] : undefined}
                i={i}
                slot={sl}
                coastal={coastal}
                isNow={d.n === 0 && i >= 0 && Math.abs(+sl.hh - nowHH) <= 2}
                selected={i === sel && i !== now}
                past={d.n === 0 && +sl.hh < nowHH - 2}
                onSel={onSel}
              />
            ))}
          </div>
          <ToneLegend />
        </article>
      ))}
    </div>
  );
}
