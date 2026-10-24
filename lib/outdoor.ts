/**
 * "איך זה בחוץ" — תרגום של נתוני תחזית למילים ולהמלצות, בכללים קבועים ושקופים.
 * בלי תלויות, כדי שאפשר יהיה לבדוק ישירות (tests/outdoor.test.mts).
 * רוח: הנתונים מגיעים בקשר; הכללים והתצוגה בקמ"ש.
 */

export const KN_TO_KMH = 1.852;
export const kmh = (kn: number) => kn * KN_TO_KMH;

export type Level = 0 | 1 | 2; // 0 לא מומלץ · 1 סביר · 2 מצוין
export const LEVEL_TEXT: Record<Level, string> = { 2: "מצוין", 1: "סביר", 0: "לא מומלץ" };

/** שעה אחת בתחזית, ביחידות של הכללים */
export type OutHour = {
  feel: number;     // מרגיש כמו, °C
  windKmh: number;  // קמ"ש
  windDir: number;  // מעלות — מאיפה הרוח נושבת
  rain: number;     // סיכוי לגשם, %
  code: number;     // קוד מזג אוויר (WMO)
  wave?: number;    // גובה גל, מ' (רק בחוף)
  period?: number;  // מחזור גל, שניות
};

export type Sky = "sun" | "partly" | "cloud" | "fog" | "rain" | "storm";

export function sky(code: number, cloud: number): { key: Sky; text: string } {
  if (code >= 95) return { key: "storm", text: "סופת רעמים" };
  if (code >= 80) return { key: "rain", text: "ממטרים" };
  if (code >= 51) return { key: "rain", text: "גשם" };
  if (code === 45 || code === 48) return { key: "fog", text: "ערפל" };
  if (code === 3 || cloud >= 85) return { key: "cloud", text: "מעונן" };
  if (code === 2 || cloud >= 35) return { key: "partly", text: "מעונן חלקית" };
  return { key: "sun", text: "בהיר" };
}

export const isRainy = (h: Pick<OutHour, "code" | "rain">) => h.code >= 51 || h.rain >= 50;

export function windWord(k: number) {
  if (k < 6) return "שקט";
  if (k < 20) return "רוח קלה";
  if (k < 30) return "רוח בינונית";
  if (k < 40) return "רוח חזקה";
  return "סוער";
}

/** התחושה בחוץ לפי "מרגיש כמו" */
export type Feel = "cool" | "pleasant" | "warm" | "hot" | "scorching" | "cold";
export function feel(t: number): { key: Feel; text: string } {
  if (t < 10) return { key: "cold", text: "קר" };
  if (t < 14) return { key: "cool", text: "קריר" };
  if (t < 25) return { key: "pleasant", text: "נעים" };
  if (t < 30) return { key: "warm", text: "חם" };
  if (t < 34) return { key: "hot", text: "חם מאוד" };
  return { key: "scorching", text: "לוהט" };
}

export function visWord(m: number) {
  const km = m / 1000;
  if (km >= 20) return "צלול";
  if (km >= 10) return "טוב";
  if (km >= 4) return "אובך קל";
  return "אובך כבד";
}

export function uvWord(u: number) {
  if (u < 3) return "נמוך";
  if (u < 6) return "בינוני";
  if (u < 8) return "גבוה";
  return "גבוה מאוד";
}

export function seaWord(w: number) {
  if (w < 0.3) return "שטוח";
  if (w < 0.6) return "רגוע";
  if (w < 1.2) return "גלים בינוניים";
  if (w < 2) return "גלים גבוהים";
  return "סוער";
}

const DIRS = ["צפון", "צפון-מזרח", "מזרח", "דרום-מזרח", "דרום", "דרום-מערב", "מערב", "צפון-מערב"];
export const dirWord = (d: number) => DIRS[Math.round(((d % 360) + 360) % 360 / 45) % 8];

/* ---------------- המלצות ---------------- */

/** אופניים: מצוין במרגיש 14°–27°, רוח עד 20 קמ"ש וגשם עד 20% */
export function bike(h: OutHour): Level {
  if (h.code >= 51 || h.rain >= 40 || h.windKmh >= 30 || h.feel >= 32 || h.feel < 8) return 0;
  if (h.rain >= 20 || h.windKmh >= 20 || h.feel >= 28 || h.feel < 14) return 1;
  return 2;
}

/** הליכה בחוץ: מצוין כשנעים (14°–27°), בלי רוח חזקה וגשם */
export function walk(h: OutHour): Level {
  if (h.code >= 51 || h.rain >= 50 || h.windKmh >= 35 || h.feel >= 33 || h.feel < 6) return 0;
  if (h.rain >= 25 || h.windKmh >= 22 || h.feel >= 28 || h.feel < 14) return 1;
  return 2;
}

/** רוח מזרחית (מהיבשה) מחליקה את הגלים בחוף הישראלי */
export const offshore = (d: number) => d >= 45 && d <= 135;

/** גלישת גלים: מצוין בגל 0.6–2 מ', מחזור 6 שנ' ומעלה, רוח עד 12 קמ"ש (או מזרחית עד 20) */
export function surf(h: OutHour): Level | null {
  if (h.wave == null) return null;
  if (h.code >= 95 || h.wave < 0.4 || h.wave > 2.5 || (h.windKmh > 25 && !offshore(h.windDir))) return 0;
  if (h.wave >= 0.6 && h.wave <= 2 && (h.period ?? 0) >= 6 && (h.windKmh <= 12 || (offshore(h.windDir) && h.windKmh <= 20)) && h.rain < 50) return 2;
  return 1;
}

/** סאפ: מצוין בים כמעט שטוח (עד 0.4 מ') ורוח עד 12 קמ"ש */
export function sup(h: OutHour): Level | null {
  if (h.wave == null) return null;
  if (h.code >= 51 || h.rain >= 40 || h.wave > 0.6 || h.windKmh > 18) return 0;
  if (h.wave <= 0.4 && h.windKmh <= 12) return 2;
  return 1;
}

/** שחייה בים: מצוין בגל עד 0.6 מ' ומרגיש 24° ומעלה */
export function swim(h: OutHour): Level | null {
  if (h.wave == null) return null;
  if (h.code >= 51 || h.rain >= 40 || h.wave >= 1.2 || h.feel < 20) return 0;
  if (h.wave >= 0.6 || h.feel < 24 || h.rain >= 20) return 1;
  return 2;
}

export const ACTIVITIES = [
  { key: "bike", icon: "🚴", name: "אופניים", fn: bike, sea: false },
  { key: "surf", icon: "🏄", name: "גלישת גלים", fn: surf, sea: true },
  { key: "sup", icon: "🛶", name: "סאפ", fn: sup, sea: true },
  { key: "swim", icon: "🏊", name: "שחייה", fn: swim, sea: true },
  { key: "walk", icon: "🚶", name: "הליכה", fn: walk, sea: false },
] as const;

/** החלון הרציף הארוך ביותר עם הרמה הטובה ביותר מתוך רשימת שעות */
export function bestWindow(levels: (Level | null)[]): { level: Level | null; from: number; to: number } {
  const valid = levels.filter((x): x is Level => x != null);
  if (!valid.length) return { level: null, from: -1, to: -1 };
  const best = Math.max(...valid) as Level;
  let win = { from: -1, to: -1 };
  let start = -1;
  for (let i = 0; i <= levels.length; i++) {
    if (i < levels.length && levels[i] === best) { if (start < 0) start = i; continue; }
    if (start >= 0 && (win.from < 0 || i - 1 - start > win.to - win.from)) win = { from: start, to: i - 1 };
    start = -1;
  }
  return { level: best, ...win };
}
