/**
 * אימות שעת המשחק מול לוח המשחקים הרשמי של 365Scores, לפני שהשעה מוצגת.
 * לוחות השידורים מפרסמים את תחילת השידור (כולל אולפן פתיחה — למשל 18:40 למשחק של 19:00),
 * ולכן כל שעה עוברת בדיקה כפולה: נמצא אותו משחק ב-365 (אותו תאריך, אותה קבוצה) והשעות מתיישבות → מציגים את שעת הפתיחה.
 * אחרת — מציגים את שעת השידור ומסמנים אותה ככזו, בלי להציג אותה כשעת פתיחה.
 * בלי תלויות — נבדק ב-tests/kickoff.test.mts.
 */

import type { Sport } from "./sport-classify";

export type Kick = {
  id: number;
  sportId: number; // 1 כדורגל · 2 כדורסל
  competitionId: number;
  start: string; // ISO מ-365
  home: { id: number; name: string };
  away: { id: number; name: string };
  status: number; // 2 טרם החל · 3 חי · 4 הסתיים
};

export type Verified = { time: string; verified: boolean };

/** מזהי הקבוצות שלנו ב-365, לפי ענף */
export const TEAM_IDS: Record<string, Partial<Record<Sport, number>>> = {
  'מכבי ת"א': { soccer: 566, basketball: 631 },
  'הפועל ת"א': { soccer: 567, basketball: 654 },
  "מכבי חיפה": { soccer: 562 },
  'בית"ר ירושלים': { soccer: 559 },
  "נבחרת ישראל": { soccer: 5034, basketball: 1728 },
};
export const ALL_TEAM_IDS = [...new Set(Object.values(TEAM_IDS).flatMap((x) => Object.values(x)))] as number[];
/** ליגת האלופות בכדורגל ב-365 */
export const UCL_COMPETITION = 572;

/** תאריך ושעה בשעון ישראל של זמן ISO */
export function israelDateTime(iso: string): { date: string; time: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

const mins = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** פתיחת המשחק מתיישבת עם שעת השידור: עד 20 דקות לפני תחילת השידור ועד שעתיים אחריה */
export function fits(broadcast: string, kickoff: string) {
  const d = mins(kickoff) - mins(broadcast);
  return d >= -20 && d <= 120;
}

/** משחק של קבוצה שלנו: אותו תאריך, אחת הקבוצות שלנו (בענף, אם ידוע), ושעה שמתיישבת */
export function verifyTeamGame(b: { date: string; time: string; team: string; sport: Sport | null }, games: Kick[]): Verified {
  const ids = TEAM_IDS[b.team];
  if (!ids) return { time: b.time, verified: false };
  const wanted = new Set<number>(b.sport ? [ids[b.sport]].filter((x): x is number => !!x) : Object.values(ids));
  const sportId = b.sport === "soccer" ? 1 : b.sport === "basketball" ? 2 : null;
  const cands = games.filter((g) =>
    (wanted.has(g.home.id) || wanted.has(g.away.id)) && (sportId == null || g.sportId === sportId) && israelDateTime(g.start).date === b.date,
  );
  const times = [...new Set(cands.map((g) => israelDateTime(g.start).time).filter((t) => fits(b.time, t)))];
  // בדיוק שעת פתיחה אחת שמתיישבת — זו השעה
  return times.length === 1 ? { time: times[0], verified: true } : { time: b.time, verified: false };
}

/** שם לצורך השוואה: בלי גרשיים, נקודות ורווחים כפולים */
const key = (s: string) => s.replace(/["״׳'.]/g, "").replace(/\s+/g, " ").trim();
/** אותה קבוצה: שם זהה, או שאחד מתחיל בשני ("ברצלונה" / "ברצלונה FC") */
const sameTeam = (a: string, b: string) => {
  const x = key(a), y = key(b);
  return !!x && !!y && (x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `));
};

/** משחק בליגת האלופות: אותו תאריך ושעה שמתיישבת; עדיף לפי שמות הקבוצות, אחרת — אם לכל המועמדים אותה שעה */
export function verifyUclGame(b: { date: string; time: string; home: string; away: string }, games: Kick[]): Verified {
  const cands = games
    .filter((g) => g.competitionId === UCL_COMPETITION)
    .map((g) => ({ g, at: israelDateTime(g.start) }))
    .filter((x) => x.at.date === b.date && fits(b.time, x.at.time));
  const named = cands.filter((x) => sameTeam(x.g.home.name, b.home) || sameTeam(x.g.away.name, b.away));
  const pool = named.length ? named : cands;
  const times = [...new Set(pool.map((x) => x.at.time))];
  return times.length === 1 ? { time: times[0], verified: true } : { time: b.time, verified: false };
}
