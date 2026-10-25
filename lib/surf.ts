import "server-only";
import { REVALIDATE, TZ } from "./config";
import { DEFAULT_SPOT_ID, spotById, type Surf, type SurfHour } from "./surf-spots";
import { validateSurf } from "./surf-validate";

/**
 * גלישה — תחזית ים לשעה-שעה: Open-Meteo Marine (גלים, סוול, מים, גאות) + Open-Meteo Forecast (רוח, טמפרטורה, לחות, גשם). ללא מפתח.
 * הנתונים נשמרים במטמון שעה (REVALIDATE.surf) — מתעדכנים פעם בשעה.
 */

export const SURF_REVALIDATE = REVALIDATE.surf;
const BEFORE = 2;  // שעות לפני עכשיו
/** ימי תחזית: 1 בעמוד הבית, עד 7 בדף "ים, רוח, גלים" */
export const MAX_SURF_DAYS = 7;

type Series = (number | null)[];
type Marine = {
  latitude?: number;
  longitude?: number;
  hourly?: {
    time: string[];
    wave_height: Series; wave_period: Series;
    swell_wave_height?: Series; swell_wave_period?: Series; swell_wave_direction?: Series;
    wind_wave_height?: Series; sea_surface_temperature?: Series; sea_level_height_msl?: Series;
  };
};
type Wind = {
  hourly?: {
    time: string[]; wind_speed_10m: Series; wind_direction_10m: Series; wind_gusts_10m?: Series;
    temperature_2m?: Series; relative_humidity_2m?: Series; precipitation_probability?: Series;
    apparent_temperature?: Series; weather_code?: Series; cloud_cover?: Series; visibility?: Series; uv_index?: Series;
  };
};

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: SURF_REVALIDATE }, signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const num = (v: number | null | undefined) => (typeof v === "number" ? v : undefined);

/** מרחק בק"מ בין שתי נקודות */
function km(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

/** השעה הנוכחית בשעון ישראל (YYYY-MM-DDTHH) */
const hourKey = (d = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .format(d).replace(" ", "T").slice(0, 13);

export async function getSurf(spotId: number = DEFAULT_SPOT_ID, days = 1): Promise<Surf | null> {
  const s = spotById(spotId);
  if (!s) return null;
  return getSurfAt(s, days);
}

/**
 * תחזית ים + מזג אוויר לכל נקודה (חוף מהרשימה או עיר שנבחרה).
 * המקור מחזיר את תא הים הקרוב לעיר חוף; לעיר בלי ים (ירושלים, אילת — אין מודל למפרץ) — null.
 * הנתונים עוברים אימות לפני שהם יוצאים מהשרת (אימות שני — בדפדפן, לפני ההצגה).
 */
export async function getSurfAt(s: { id: number; name: string; lat: number; lon: number }, days = 1): Promise<Surf | null> {
  const out = await fetchSurf(s, days);
  if (!out) return null;
  const v = validateSurf(out, { name: s.name });
  if (!v.ok) console.warn(`[surf] נתונים נדחו (${s.name}): ${v.issues.join("; ")}`);
  return v.surf;
}

async function fetchSurf(s: { id: number; name: string; lat: number; lon: number }, days: number): Promise<Surf | null> {
  const span = BEFORE + Math.max(1, Math.min(MAX_SURF_DAYS, days)) * 24;
  // נתוני דמה: נקודה בלי ים (ירושלים, ים המלח, אילת) — כמו במקור האמיתי
  if (process.env.MOCK_DATA === "1" && (s.lat < 30 || s.lon > 34.7 + (s.lat - 31.6) * 0.27)) return null;
  if (process.env.MOCK_DATA === "1") return mockSurf(s.id, s.name, days > 1 ? span + 23 - Number(hourKey().slice(11, 13)) : span);

  const tz = encodeURIComponent(TZ);
  const [m, w] = await Promise.all([
    get<Marine>(`https://marine-api.open-meteo.com/v1/marine?latitude=${s.lat}&longitude=${s.lon}&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,sea_surface_temperature,sea_level_height_msl&past_days=1&forecast_days=${MAX_SURF_DAYS + 1}&timezone=${tz}`),
    get<Wind>(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m,relative_humidity_2m,precipitation_probability,apparent_temperature,weather_code,cloud_cover,visibility,uv_index&wind_speed_unit=kn&past_days=1&forecast_days=${MAX_SURF_DAYS + 1}&timezone=${tz}`),
  ]);
  if (!m?.hourly) return null;
  // המקור "מצמיד" נקודה לתא הים הקרוב גם כשהיא רחוקה מהחוף (לוד → ים מול יפו). עיר שרחוקה מהים יותר מ-13 ק"מ = בלי ים
  if (s.id < 0 && m.latitude != null && m.longitude != null && km(s.lat, s.lon, m.latitude, m.longitude) > 13) return null;
  const mh = m.hourly;
  const start = mh.time.findIndex((t) => t.startsWith(hourKey())) - BEFORE;
  if (start < 0) return null;
  // בתצוגה השבועית — עד סוף היום האחרון (כדי שיהיו בוקר/צהריים/ערב לכל יום)
  const lastDay = days > 1 ? mh.time[start + BEFORE + (days - 1) * 24]?.slice(0, 10) : undefined;

  const hours: SurfHour[] = [];
  for (let i = start; i < mh.time.length && (lastDay ? mh.time[i].slice(0, 10) <= lastDay : i < start + span); i++) {
    const wave = mh.wave_height[i];
    if (typeof wave !== "number") break;
    const wi = w?.hourly?.time.indexOf(mh.time[i]) ?? -1;
    hours.push({
      time: mh.time[i],
      wave,
      period: mh.wave_period[i] ?? 0,
      swell: num(mh.swell_wave_height?.[i]),
      swellPeriod: num(mh.swell_wave_period?.[i]),
      swellDir: num(mh.swell_wave_direction?.[i]),
      windWave: num(mh.wind_wave_height?.[i]),
      water: num(mh.sea_surface_temperature?.[i]),
      tide: num(mh.sea_level_height_msl?.[i]),
      wind: (wi >= 0 ? num(w!.hourly!.wind_speed_10m[wi]) : undefined) ?? 0,
      windDir: (wi >= 0 ? num(w!.hourly!.wind_direction_10m[wi]) : undefined) ?? 0,
      gust: wi >= 0 ? num(w!.hourly!.wind_gusts_10m?.[wi]) : undefined,
      temp: wi >= 0 ? num(w!.hourly!.temperature_2m?.[wi]) : undefined,
      humidity: wi >= 0 ? num(w!.hourly!.relative_humidity_2m?.[wi]) : undefined,
      rain: wi >= 0 ? num(w!.hourly!.precipitation_probability?.[wi]) : undefined,
      feel: wi >= 0 ? num(w!.hourly!.apparent_temperature?.[wi]) : undefined,
      code: wi >= 0 ? num(w!.hourly!.weather_code?.[wi]) : undefined,
      cloud: wi >= 0 ? num(w!.hourly!.cloud_cover?.[wi]) : undefined,
      vis: wi >= 0 ? num(w!.hourly!.visibility?.[wi]) : undefined,
      uv: wi >= 0 ? num(w!.hourly!.uv_index?.[wi]) : undefined,
    });
  }
  if (hours.length <= BEFORE) return null;
  return { spotId: s.id, spot: s.name, now: BEFORE, hours };
}

/** נתוני דמה ל-MOCK_DATA — גלים שעולים ויורדים לאורך הימים */
function mockSurf(spotId: number, spot: string, span: number): Surf {
  const base = new Date(Date.now() - BEFORE * 3600e3);
  const hours: SurfHour[] = Array.from({ length: span }, (_, i) => {
    const x = (i % 24) / 23;
    const wave = 0.5 + 0.7 * Math.sin(Math.PI * x) ** 2 + 0.08 * Math.sin(i);
    const time = `${hourKey(new Date(base.getTime() + i * 3600e3))}:00`;
    const sun = Math.sin(Math.PI * Math.min(1, Math.max(0, (Number(time.slice(11, 13)) - 6) / 14))); // 0 בלילה, 1 בצהריים
    return {
      time,
      wave, period: 5 + 2.5 * x,
      swell: wave * 0.75, swellPeriod: 5.5 + 2.5 * x, swellDir: 290 + 20 * x, windWave: wave * 0.4,
      wind: 5 + 10 * Math.sin(Math.PI * x), windDir: 300 + 30 * x, gust: 9 + 14 * Math.sin(Math.PI * x),
      water: 27.6 + 0.3 * x, tide: 0.25 * Math.sin((i / 12.4) * 2 * Math.PI),
      temp: 21 + 7 * sun + (i / 24) * 0.4,
      humidity: 74 - 24 * sun,
      feel: 22 + 9 * sun, code: i > 120 ? 61 : sun > 0.6 ? 2 : 1, cloud: i > 120 ? 95 : 30 + 30 * sun, vis: 30000, uv: 7 * sun,
      rain: Math.max(0, Math.round(60 * Math.sin((i / 170) * Math.PI * 3) - 15)),
    };
  });
  return { spotId, spot, now: BEFORE, hours };
}
