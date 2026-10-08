/** חופי גלישה בישראל. משותף לשרת ולדפדפן. */

/** id — מזהה קבוע (נשמר בדפדפן); area — אזור החוף ב-4surfers (beachAreaId) לקישור */
export type SurfSpot = { id: number; name: string; lat: number; lon: number; area: number };

/** סדר התצוגה: בת ים, תל אביב, אשדוד, אשקלון — ואז שאר החופים מדרום לצפון */
export const SURF_SPOTS: SurfSpot[] = [
  { id: 61, name: "בת ים", lat: 32.02, lon: 34.74, area: 60 },
  { id: 60, name: "תל אביב", lat: 32.09, lon: 34.76, area: 60 },
  { id: 70, name: "אשדוד", lat: 31.81, lon: 34.62, area: 70 },
  { id: 80, name: "אשקלון", lat: 31.67, lon: 34.54, area: 80 },
  { id: 55, name: "הרצליה", lat: 32.17, lon: 34.80, area: 50 },
  { id: 50, name: "נתניה", lat: 32.33, lon: 34.83, area: 50 },
  { id: 40, name: "חוף כרמל", lat: 32.66, lon: 34.92, area: 40 },
  { id: 30, name: "חיפה-מערב", lat: 32.81, lon: 34.95, area: 30 },
  { id: 20, name: "חיפה-מפרץ", lat: 32.84, lon: 35.03, area: 20 },
  { id: 10, name: "נהריה", lat: 33.01, lon: 35.07, area: 10 },
];

export const DEFAULT_SPOT_ID = 60;
export const spotById = (id: number) => SURF_SPOTS.find((s) => s.id === id);

/** 4surfers — אתר תחזית הגלישה המקצועי בישראל (מצלמות, גלים, רוח, גאות ושפל) — לאזור של החוף שנבחר */
export const surfSiteUrl = (id: number) => `https://www.4surfers.co.il/#/beachArea?beachAreaId=${spotById(id)?.area ?? id}`;

/** שעה אחת בתחזית הים */
export type SurfHour = {
  time: string;          // YYYY-MM-DDTHH:00 (שעון ישראל)
  wave: number;          // גובה גל משמעותי, מ׳
  period: number;        // מחזור גל, שניות
  swell?: number;        // גובה סוול, מ׳
  swellPeriod?: number;  // שניות
  swellDir?: number;     // מעלות — מאיפה הסוול מגיע
  windWave?: number;     // גלי רוח, מ׳
  wind: number;          // קשר
  windDir: number;       // מעלות — מאיפה הרוח נושבת
  gust?: number;         // משבים, קשר
  water?: number;        // טמפרטורת מים, °C
  tide?: number;         // גובה פני הים (גאות ושפל), מ׳
};

/** תחזית ים ל-24 שעות (מ-2 שעות לפני עכשיו), לחוף שנבחר */
export type Surf = {
  spotId: number;
  spot: string;
  now: number;           // אינדקס השעה הנוכחית ב-hours
  hours: SurfHour[];
};

/** עוצמת גל (שטף אנרגיה) ב-kW למטר חוף: P ≈ 0.49·H²·T */
export const wavePower = (h: number, t: number) => 0.49 * h * h * t;

/** תיאור גובה הגל ביחס לגוף */
export const waveLabel = (h: number) =>
  h < 0.3 ? "קרסול" : h < 0.6 ? "ברך" : h < 0.9 ? "מותן" : h < 1.2 ? "חזה" : h < 1.5 ? "כתף" : h < 2 ? "ראש" : "מעל הראש";

const DIR_FULL = ["צפוני", "צפון-מזרחי", "מזרחי", "דרום-מזרחי", "דרומי", "דרום-מערבי", "מערבי", "צפון-מערבי"];
const DIR_SHORT = ["צפ׳", "צפ׳-מז׳", "מז׳", "דר׳-מז׳", "דר׳", "דר׳-מע׳", "מע׳", "צפ׳-מע׳"];
const octant = (deg: number) => Math.round((((deg % 360) + 360) % 360) / 45) % 8;
export const dirFull = (deg: number) => DIR_FULL[octant(deg)];   // כיוון סוול
export const dirShort = (deg: number) => DIR_SHORT[octant(deg)]; // כיוון רוח
