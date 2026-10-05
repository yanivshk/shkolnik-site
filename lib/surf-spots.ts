/** אזורי גלישה בישראל — תואמים לאזורי החוף של 4surfers (beachAreaId). משותף לשרת ולדפדפן. */

export type SurfSpot = { id: number; name: string; lat: number; lon: number };

export const SURF_SPOTS: SurfSpot[] = [
  { id: 10, name: "נהריה", lat: 33.01, lon: 35.07 },
  { id: 20, name: "חיפה-מפרץ", lat: 32.84, lon: 35.03 },
  { id: 30, name: "חיפה-מערב", lat: 32.81, lon: 34.95 },
  { id: 40, name: "חוף כרמל", lat: 32.66, lon: 34.92 },
  { id: 50, name: "נתניה", lat: 32.33, lon: 34.83 },
  { id: 60, name: "תל אביב-יפו", lat: 32.09, lon: 34.76 },
  { id: 70, name: "אשדוד", lat: 31.81, lon: 34.62 },
  { id: 80, name: "אשקלון", lat: 31.67, lon: 34.54 },
];

export const DEFAULT_SPOT_ID = 60;
export const spotById = (id: number) => SURF_SPOTS.find((s) => s.id === id);

/** 4surfers — אתר תחזית הגלישה המקצועי בישראל (מצלמות, גלים, רוח, גאות ושפל) — לאזור שנבחר */
export const surfSiteUrl = (id: number) => `https://www.4surfers.co.il/#/beachArea?beachAreaId=${id}`;

export type Surf = {
  spotId: number;
  spot: string;
  wave: number;    // מ׳
  period: number;  // שניות
  wind: number;    // קשר
  windDir: number; // מעלות — מאיפה הרוח נושבת
};
