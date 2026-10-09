/**
 * מצב משחק חי למשחקים שבלוח השידורים.
 * מקורות ללא מפתח:
 *   - יורוליג (מכבי ת"א / הפועל ת"א בכדורסל): api-live.euroleague.net
 *   - נבחרת ישראל ומפעלים אירופיים בכדורגל: ESPN
 * לליגת העל בכדורגל אין מקור חי חינמי ואמין — שם מוצג "בשידור עכשיו" עם הערוץ, בלי תוצאה (לא מנחשים).
 */

import type { Broadcast } from "./broadcasts";
import { israelTime } from "./tz";

export type Live = {
  id: string; // מזהה השידור
  state: "live" | "final" | "on-air"; // on-air = המשחק בשידור, אין תוצאה ממקור חי
  us: number | null; // התוצאה של הקבוצה שלנו
  them: number | null;
  clock?: string; // דקה / סטטוס
};

/** חלון "המשחק עכשיו": 10 דקות לפני ועד שעתיים וחצי אחרי שעת השידור */
const BEFORE_MS = 10 * 60_000;
const AFTER_MS = 150 * 60_000;

export function isLiveWindow(b: Broadcast, now = Date.now()): boolean {
  const t = israelTime(b.date, b.time).getTime();
  return now >= t - BEFORE_MS && now <= t + AFTER_MS;
}

const UA = "Mozilla/5.0 (compatible; ShkolnikHub/1.0; +https://www.shkolnik.co.il)";
async function json<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: 30 }, signal: AbortSignal.timeout(6000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/* ---------------- יורוליג ---------------- */

const EL_CODE: Record<string, string> = { 'מכבי ת"א': "TEL", 'הפועל ת"א': "HTA" };

type ElGame = { utcDate: string; played: boolean; local: { club: { code: string }; score: number }; road: { club: { code: string }; score: number } };

function euroleagueSeason(d: Date) {
  return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; // העונה מתחילה ביולי
}

async function euroleague(b: Broadcast): Promise<Live | null> {
  const code = EL_CODE[b.team];
  if (!code || b.sport !== "basketball") return null;
  const start = israelTime(b.date, b.time);
  const data = await json<{ data: ElGame[] }>(`https://api-live.euroleague.net/v2/competitions/E/seasons/E${euroleagueSeason(start)}/games?teamCode=${code}`);
  const g = data?.data?.find((x) => Math.abs(Date.parse(x.utcDate) - start.getTime()) < 3 * 3600_000);
  if (!g) return null;
  const home = g.local.club.code === code;
  const us = home ? g.local.score : g.road.score;
  const them = home ? g.road.score : g.local.score;
  if (g.played) return { id: b.id, state: "final", us, them, clock: "סיום" };
  if (us + them > 0) return { id: b.id, state: "live", us, them };
  return null;
}

/* ---------------- ESPN (כדורגל) ---------------- */

const ESPN_NAME: Record<string, RegExp> = {
  'מכבי ת"א': /Maccabi Tel[- ]Aviv/i,
  'הפועל ת"א': /Hapoel Tel[- ]Aviv/i,
  "מכבי חיפה": /Maccabi Haifa/i,
  'בית"ר ירושלים': /Beitar Jerusalem/i,
  "נבחרת ישראל": /^Israel$/i,
};
const ESPN_LEAGUES = ["uefa.champions", "uefa.europa", "uefa.europa.conf", "uefa.nations", "fifa.worldq.uefa", "uefa.euroq", "fifa.friendly"];

type EspnEvent = {
  status: { displayClock?: string; type: { state: "pre" | "in" | "post"; shortDetail?: string } };
  competitions: { competitors: { score?: string; team: { displayName: string } }[] }[];
};

async function espn(b: Broadcast): Promise<Live | null> {
  const re = ESPN_NAME[b.team];
  if (!re || b.sport !== "soccer") return null;
  const day = b.date.replaceAll("-", "");
  const all = await Promise.all(ESPN_LEAGUES.map((l) => json<{ events?: EspnEvent[] }>(`https://site.api.espn.com/apis/site/v2/sports/soccer/${l}/scoreboard?dates=${day}`)));
  for (const r of all) {
    for (const e of r?.events ?? []) {
      const cs = e.competitions[0]?.competitors ?? [];
      const mine = cs.find((c) => re.test(c.team.displayName));
      const other = cs.find((c) => c !== mine);
      if (!mine || !other) continue;
      const st = e.status.type.state;
      if (st === "pre") return null;
      return { id: b.id, state: st === "post" ? "final" : "live", us: Number(mine.score ?? 0), them: Number(other.score ?? 0), clock: st === "post" ? "סיום" : e.status.displayClock ?? e.status.type.shortDetail };
    }
  }
  return null;
}

/** מצב חי לכל משחק שלנו שנמצא עכשיו בחלון השידור */
export async function getLive(items: Broadcast[], now = Date.now()): Promise<Live[]> {
  const inWindow = items.filter((b) => isLiveWindow(b, now));
  if (process.env.MOCK_DATA === "1") {
    return inWindow.map((b) => ({ id: b.id, state: "live", us: 54, them: 49, clock: "רבע 3" }));
  }
  return Promise.all(
    inWindow.map(async (b) => (await euroleague(b)) ?? (await espn(b)) ?? { id: b.id, state: "on-air", us: null, them: null }),
  );
}
