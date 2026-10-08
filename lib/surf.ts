import "server-only";
import { REVALIDATE, TZ } from "./config";
import { DEFAULT_SPOT_ID, spotById, type Surf, type SurfHour } from "./surf-spots";

/**
 * גלישה — תחזית ים לשעה-שעה: Open-Meteo Marine (גלים, סוול, מים, גאות) + Open-Meteo Forecast (רוח). ללא מפתח.
 * הנתונים נשמרים במטמון שעה (REVALIDATE.surf) — מתעדכנים פעם בשעה.
 */

export const SURF_REVALIDATE = REVALIDATE.surf;
const BEFORE = 2;  // שעות לפני עכשיו
const SPAN = 24;   // שעות בגרף

type Series = (number | null)[];
type Marine = {
  hourly?: {
    time: string[];
    wave_height: Series; wave_period: Series;
    swell_wave_height?: Series; swell_wave_period?: Series; swell_wave_direction?: Series;
    wind_wave_height?: Series; sea_surface_temperature?: Series; sea_level_height_msl?: Series;
  };
};
type Wind = { hourly?: { time: string[]; wind_speed_10m: Series; wind_direction_10m: Series; wind_gusts_10m?: Series } };

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: SURF_REVALIDATE }, signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const num = (v: number | null | undefined) => (typeof v === "number" ? v : undefined);

/** השעה הנוכחית בשעון ישראל (YYYY-MM-DDTHH) */
const hourKey = (d = new Date()) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .format(d).replace(" ", "T").slice(0, 13);

export async function getSurf(spotId: number = DEFAULT_SPOT_ID): Promise<Surf | null> {
  const s = spotById(spotId);
  if (!s) return null;
  if (process.env.MOCK_DATA === "1") return mockSurf(s.id, s.name);

  const tz = encodeURIComponent(TZ);
  const [m, w] = await Promise.all([
    get<Marine>(`https://marine-api.open-meteo.com/v1/marine?latitude=${s.lat}&longitude=${s.lon}&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,sea_surface_temperature,sea_level_height_msl&past_days=1&forecast_days=2&timezone=${tz}`),
    get<Wind>(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&past_days=1&forecast_days=2&timezone=${tz}`),
  ]);
  if (!m?.hourly) return null;
  const mh = m.hourly;
  const start = mh.time.findIndex((t) => t.startsWith(hourKey())) - BEFORE;
  if (start < 0) return null;

  const hours: SurfHour[] = [];
  for (let i = start; i < Math.min(start + SPAN, mh.time.length); i++) {
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
    });
  }
  if (hours.length <= BEFORE) return null;
  return { spotId: s.id, spot: s.name, now: BEFORE, hours };
}

/** נתוני דמה ל-MOCK_DATA — יום עם עלייה בגלים אחר הצהריים */
function mockSurf(spotId: number, spot: string): Surf {
  const base = new Date(Date.now() - BEFORE * 3600e3);
  const hours: SurfHour[] = Array.from({ length: SPAN }, (_, i) => {
    const x = i / (SPAN - 1);
    const wave = 0.5 + 0.7 * Math.sin(Math.PI * x) ** 2 + 0.08 * Math.sin(i);
    return {
      time: `${hourKey(new Date(base.getTime() + i * 3600e3))}:00`,
      wave, period: 5 + 2.5 * x,
      swell: wave * 0.75, swellPeriod: 5.5 + 2.5 * x, swellDir: 290 + 20 * x, windWave: wave * 0.4,
      wind: 5 + 10 * Math.sin(Math.PI * x), windDir: 300 + 30 * x, gust: 9 + 14 * Math.sin(Math.PI * x),
      water: 27.6 + 0.3 * x, tide: 0.25 * Math.sin((i / 12.4) * 2 * Math.PI),
    };
  });
  return { spotId, spot, now: BEFORE, hours };
}
