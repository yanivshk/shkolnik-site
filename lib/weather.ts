/** מזג אוויר מ-Open-Meteo (ללא מפתח). משותף לדף הבית ול-API. */

export type Weather = {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  humidity: number;
  rainProb: number;
  code: number;
  isDay: boolean;
};

export type Place = { name: string; country: string; lat: number; lon: number };

export const DEFAULT_PLACE: Place = { name: "תל אביב", country: "ישראל", lat: 32.0853, lon: 34.7818 };

/** רענון כל שעה — מתעדכן כמה פעמים ביום */
export const WEATHER_REVALIDATE = 600;

type OpenMeteo = {
  current?: { temperature_2m: number; relative_humidity_2m: number; weather_code: number; is_day: number };
  hourly?: { time: string[]; precipitation_probability: (number | null)[] };
};

export async function getWeather(lat: number, lon: number, name: string): Promise<Weather | null> {
  if (process.env.MOCK_DATA === "1") {
    return { name, lat, lon, temp: 27, humidity: 64, rainProb: 10, code: 2, isDay: true };
  }
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    "&current=temperature_2m,relative_humidity_2m,weather_code,is_day" +
    "&hourly=precipitation_probability&forecast_hours=12&timezone=auto";
  try {
    const res = await fetch(url, { next: { revalidate: WEATHER_REVALIDATE }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const d = (await res.json()) as OpenMeteo;
    if (!d.current) return null;
    const probs = (d.hourly?.precipitation_probability ?? []).filter((v): v is number => typeof v === "number");
    return {
      name,
      lat,
      lon,
      temp: Math.round(d.current.temperature_2m),
      humidity: Math.round(d.current.relative_humidity_2m),
      rainProb: probs.length ? Math.max(...probs) : 0,
      code: d.current.weather_code,
      isDay: d.current.is_day === 1,
    };
  } catch {
    return null;
  }
}

type GeoResult = { results?: { name: string; country?: string; latitude: number; longitude: number; admin1?: string }[] };

export async function searchPlaces(q: string): Promise<Place[]> {
  if (process.env.MOCK_DATA === "1") {
    return [DEFAULT_PLACE, { name: "ירושלים", country: "ישראל", lat: 31.7683, lon: 35.2137 }];
  }
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=he&format=json`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const d = (await res.json()) as GeoResult;
    return (d.results ?? []).map((r) => ({
      name: r.name,
      country: [r.admin1, r.country].filter(Boolean).join(", "),
      lat: r.latitude,
      lon: r.longitude,
    }));
  } catch {
    return [];
  }
}

/* ---------------- תחזית שעתית שבועית (לגרף מזג האוויר בדף הים) ---------------- */

export type HourlyWeather = { time: string; temp?: number; humidity?: number; rain?: number };

/**
 * טמפרטורה, לחות וסיכוי לגשם לשעה-שעה, מאתמול ועד 8 ימים קדימה.
 * הזמנים תמיד בשעון ישראל — כך שהסמן המשותף בדף הים מצביע על אותו רגע גם בעיר בחו"ל.
 */
export async function getHourly(lat: number, lon: number): Promise<HourlyWeather[] | null> {
  if (process.env.MOCK_DATA === "1") {
    const base = Date.now() - 26 * 3600e3;
    return Array.from({ length: 24 * 9 }, (_, i) => {
      const time = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
        .format(new Date(base + i * 3600e3)).replace(" ", "T").slice(0, 13) + ":00";
      const sun = Math.sin(Math.PI * Math.min(1, Math.max(0, (Number(time.slice(11, 13)) - 6) / 14)));
      const cool = (lat - 31.5) * 1.5; // עיר צפונית — קצת יותר קרירה (לנתוני דמה בלבד)
      return { time, temp: 19 - cool + 8 * sun, humidity: 80 - 30 * sun, rain: Math.max(0, Math.round(70 * Math.sin((i / 216) * Math.PI * 4) - 20)) };
    });
  }
  type Hourly = { hourly?: { time: string[]; temperature_2m?: (number | null)[]; relative_humidity_2m?: (number | null)[]; precipitation_probability?: (number | null)[] } };
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
        "&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&past_days=1&forecast_days=8&timezone=Asia%2FJerusalem",
      { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const h = ((await res.json()) as Hourly).hourly;
    if (!h) return null;
    const v = (a: (number | null)[] | undefined, i: number) => (typeof a?.[i] === "number" ? (a[i] as number) : undefined);
    return h.time.map((time, i) => ({ time, temp: v(h.temperature_2m, i), humidity: v(h.relative_humidity_2m, i), rain: v(h.precipitation_probability, i) }));
  } catch {
    return null;
  }
}
