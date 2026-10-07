import "server-only";
import { REVALIDATE, TZ } from "./config";
import { DEFAULT_SPOT_ID, spotById, type Surf } from "./surf-spots";

/**
 * גלישה — מצב הים עכשיו: Open-Meteo Marine (גלים) + Open-Meteo Forecast (רוח). ללא מפתח.
 * הנתונים נשמרים במטמון שעה (REVALIDATE.surf) — מתעדכנים פעם בשעה.
 */

export const SURF_REVALIDATE = REVALIDATE.surf;

type Marine = {
  hourly?: {
    time: string[];
    wave_height: (number | null)[];
    wave_period: (number | null)[];
    swell_wave_height?: (number | null)[];
    swell_wave_period?: (number | null)[];
    swell_wave_direction?: (number | null)[];
  };
};
type Wind = { current?: { wind_speed_10m: number; wind_direction_10m: number; wind_gusts_10m?: number } };

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: SURF_REVALIDATE }, signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getSurf(spotId: number = DEFAULT_SPOT_ID): Promise<Surf | null> {
  const s = spotById(spotId);
  if (!s) return null;
  if (process.env.MOCK_DATA === "1") {
    const k = s.id / 10;
    const wave = 0.3 + k * 0.1, period = 5 + (k % 4), wind = 6 + k;
    return {
      spotId: s.id, spot: s.name, wave, period, wind, windDir: 250 + k * 10,
      gust: wind + 4, swell: wave * 0.8, swellPeriod: 6 + (k % 4) * 0.5, swellDir: 280 + k * 5,
    };
  }
  const tz = encodeURIComponent(TZ);
  const [m, w] = await Promise.all([
    get<Marine>(`https://marine-api.open-meteo.com/v1/marine?latitude=${s.lat}&longitude=${s.lon}&hourly=wave_height,wave_period,swell_wave_height,swell_wave_period,swell_wave_direction&forecast_days=2&timezone=${tz}`),
    get<Wind>(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&timezone=${tz}`),
  ]);
  if (!m?.hourly) return null;

  // השעה הנוכחית בשעון ישראל (YYYY-MM-DDTHH)
  const key = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
    .format(new Date()).replace(" ", "T").slice(0, 13);
  const i = m.hourly.time.findIndex((t) => t.startsWith(key));
  const wave = i >= 0 ? m.hourly.wave_height[i] : null;
  if (typeof wave !== "number") return null;

  const period = m.hourly.wave_period[i] ?? 0;
  const wind = w?.current?.wind_speed_10m ?? 0;
  // סוול ומשבים — רק אם התקבל מספר
  const num = (v: number | null | undefined) => (typeof v === "number" ? v : undefined);
  const swell = num(m.hourly.swell_wave_height?.[i]);
  const swellPeriod = num(m.hourly.swell_wave_period?.[i]);
  const swellDir = num(m.hourly.swell_wave_direction?.[i]);
  const gust = num(w?.current?.wind_gusts_10m);

  return {
    spotId: s.id,
    spot: s.name,
    wave,
    period,
    wind,
    windDir: w?.current?.wind_direction_10m ?? 0,
    gust,
    swell,
    swellPeriod,
    swellDir,
  };
}
