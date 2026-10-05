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
