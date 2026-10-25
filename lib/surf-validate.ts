/**
 * אימות נתוני תחזית — רץ פעמיים: בשרת לפני שליחה, ושוב בדפדפן לפני הצגה (אחרי כל טעינה ורענון).
 * ערך מחוץ לטווח הגיוני נמחק (לא מוצג); אם הנתונים כולם לא תקינים — הם נדחים ולא מוצגים בכלל.
 * בלי תלויות, כדי שאפשר יהיה לבדוק ישירות (tests/surf-validate.test.mts).
 */

import type { Surf, SurfHour } from "./surf-spots";

/** טווחים הגיוניים לכל שדה (ערך מחוץ לטווח = שגיאה במקור) */
const RANGE: Partial<Record<keyof SurfHour, [number, number]>> = {
  wave: [0, 20],
  period: [0, 30],
  swell: [0, 20],
  swellPeriod: [0, 30],
  swellDir: [0, 360],
  windWave: [0, 20],
  wind: [0, 150], // קשר
  windDir: [0, 360],
  gust: [0, 200],
  water: [-2, 40],
  tide: [-5, 5],
  temp: [-40, 60],
  feel: [-50, 70],
  humidity: [0, 100],
  rain: [0, 100],
  code: [0, 99],
  cloud: [0, 100],
  vis: [0, 200_000],
  uv: [0, 20],
};

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export type Check = { ok: boolean; issues: string[] };

/** מנקה שעה אחת: שדות לא תקינים נמחקים. מחזיר null אם השעה עצמה לא שמישה */
export function cleanHour(h: SurfHour, needWave: boolean): SurfHour | null {
  if (!h || typeof h.time !== "string" || !TIME.test(h.time)) return null;
  const out = { ...h } as Record<string, unknown>;
  for (const [k, [lo, hi]] of Object.entries(RANGE) as [keyof SurfHour, [number, number]][]) {
    const v = out[k];
    if (v == null) continue;
    if (!fin(v) || v < lo || v > hi) out[k] = undefined;
  }
  // שדות חובה בגרף הים
  if (needWave && !fin(out.wave)) return null;
  if (!fin(out.wind)) out.wind = 0;
  if (!fin(out.windDir)) out.windDir = 0;
  if (!fin(out.period)) out.period = 0;
  return out as SurfHour;
}

/** השעות עולות ברצף (מותר פער של 0–2 שעות — מעבר לשעון חורף/קיץ) */
function continuous(hours: SurfHour[]): boolean {
  for (let i = 1; i < hours.length; i++) {
    const a = Date.parse(`${hours[i - 1].time}:00Z`);
    const b = Date.parse(`${hours[i].time}:00Z`);
    const d = (b - a) / 3_600_000;
    if (!(d >= 0 && d <= 2)) return false;
  }
  return true;
}

/**
 * בדיקה מלאה של תחזית ים: מבנה, רצף שעות, ערכים בטווח, ומספיק שעות תקינות.
 * מחזיר את התחזית "הנקייה" או null אם אסור להציג אותה.
 */
export function validateSurf(s: unknown, expect?: { name?: string }): { surf: Surf | null } & Check {
  const issues: string[] = [];
  const x = s as Surf;
  if (!x || typeof x !== "object" || !Array.isArray(x.hours) || typeof x.spot !== "string" || !fin(x.now)) {
    return { surf: null, ok: false, issues: ["מבנה לא תקין"] };
  }
  if (expect?.name && x.spot !== expect.name) issues.push(`התקבל מיקום אחר (${x.spot})`);
  const cleaned = x.hours.map((h) => cleanHour(h, true));
  const bad = cleaned.filter((h) => !h).length;
  const hours = cleaned.filter((h): h is SurfHour => !!h);
  if (hours.length < 24) issues.push("מעט מדי שעות תקינות");
  if (bad > x.hours.length * 0.1) issues.push(`${bad} שעות לא תקינות`);
  if (!continuous(hours)) issues.push("רצף השעות שבור");
  if (issues.length) return { surf: null, ok: false, issues };
  const now = Math.min(Math.max(0, x.now - x.hours.slice(0, x.now).filter((_, i) => !cleaned[i]).length), hours.length - 1);
  return { surf: { ...x, hours, now }, ok: true, issues };
}

/** שעות מזג אוויר (עיר) — ערכים לא תקינים נמחקים; פחות מ-24 שעות תקינות = נדחה */
export function validateWeatherHours<T extends { time: string }>(list: unknown): T[] | null {
  if (!Array.isArray(list)) return null;
  const out = (list as T[])
    .map((h) => cleanHour({ wave: 0, period: 0, wind: 0, windDir: 0, ...(h as object) } as unknown as SurfHour, false))
    .filter((h): h is SurfHour => !!h && fin(h.temp))
    .map((h) => {
      const r = { ...h } as Record<string, unknown>;
      delete r.wave; delete r.period;
      if (!(list as Record<string, unknown>[]).find((o) => o.time === h.time && o.wind != null)) { delete r.wind; delete r.windDir; }
      return r as unknown as T;
    });
  return out.length >= 24 && continuous(out as unknown as SurfHour[]) ? out : null;
}

/** התחזית עדכנית? השעה הראשונה לא יותר מ-4 שעות לפני עכשיו ולא אחריו (מגן מנתונים ישנים מהקאש) */
export function isFresh(s: Surf, nowKey: string): boolean {
  const first = Date.parse(`${s.hours[0]?.time}:00Z`);
  const now = Date.parse(`${nowKey}:00:00Z`);
  const d = (now - first) / 3_600_000;
  return d >= -1 && d <= 4;
}
