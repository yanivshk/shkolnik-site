import "server-only";

/**
 * טבלאות ליגה — מקור: 365Scores (ה-API הציבורי של האתר שלהם, ללא מפתח; גם תוצאות ה-LIVE באתר ערוץ הספורט מגיעות משם).
 * הנתונים הוצלבו מול ערוץ הספורט (ליגת העל, לאומית, נוער) ומול ה-API הרשמי של היורוליג.
 * בזמן משחקים הטבלה של 365 היא "טבלה חיה": המשחק שבמהלך כבר נספר לפי התוצאה הנוכחית (liveGameId על השורה).
 *
 * עדכניות: כשיש משחק חי 365 שומרת את התשובה 12 שניות בלבד, אבל כשאין — עד 30 דקות. לכן ברגע שמשחק אמור היה להתחיל
 * (או שהטבלה עוד מסמנת כחי משחק שכבר הסתיים), מבקשים מ-365 עותק טרי ולא את השמור — לכל היותר פעם ב-15 שניות לליגה.
 * התוצאה החיה נלקחת מאותה תשובה של הטבלה, כך שהתוצאה והנקודות תמיד מאותו רגע.
 */

import { ENDED, isStale, LIVE, NOT_STARTED, type Game365 } from "./standings-fresh";

const API = "https://webws.365scores.com/web";
const Q = "appTypeId=5&langId=2&timezoneName=Asia%2FJerusalem&userCountryId=6";
const UA = "Mozilla/5.0 (compatible; ShkolnikHub/1.0; +https://www.shkolnik.co.il)";

export type TableKind = "football" | "winner" | "euroleague";

export const LEAGUES: { key: string; id: number; title: string; sport: "soccer" | "basketball"; kind: TableKind }[] = [
  { key: "ligat-haal", id: 42, title: "ליגת העל", sport: "soccer", kind: "football" },
  { key: "winner", id: 47, title: "ליגת ווינר סל", sport: "basketball", kind: "winner" },
  { key: "euroleague", id: 569, title: "יורוליג", sport: "basketball", kind: "euroleague" },
  { key: "leumit", id: 43, title: "ליגה לאומית", sport: "soccer", kind: "football" },
  { key: "youth", id: 525, title: "ליגת העל לנוער", sport: "soccer", kind: "football" },
];

export type LiveInfo = { opponent: string; my: number; their: number; clock: string; home: boolean };
/** משחק שהסתיים בשעות האחרונות (מוצג "הסתיים" ליד הקבוצה) */
export type FinalInfo = { opponent: string; my: number; their: number };

export type Row = {
  pos: number;
  id: number;
  name: string;
  logo: string; // /api/team-logo?...
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // שערי/נקודות זכות
  ga: number; // שערי/נקודות חובה
  points: number;
  pct: string; // ".857"
  form: number[]; // 1 ניצחון · 2 תיקו · 0 הפסד — האחרון ראשון
  dest?: number;
  live?: LiveInfo;
  final?: FinalInfo;
};

export type Table = {
  key: string;
  title: string;
  sport: "soccer" | "basketball";
  kind: TableKind;
  rows: Row[];
  destinations: { num: number; name: string; color: string }[];
  notes: string[];
  rules?: string;
  live: boolean;
  ok: boolean;
  /** פתיחת המשחק הקרוב בליגה (ISO) — הדף מתרענן בתדירות גבוהה סביב השעה הזו */
  nextKickoff?: string;
  /** האם נדרש עותק טרי מ-365 כדי לקבל את הטבלה (לבדיקה ולהצגה) */
  fresh?: boolean;
};

type Raw365 = {
  standings?: {
    rows: {
      position: number; gamePlayed: number; gamesWon: number; gamesLost: number; gamesEven?: number | null;
      for: number; against: number; points: number; pct?: string; recentForm?: number[]; destinationNum?: number;
      liveGameId?: number;
      competitor: { id: number; name: string; imageVersion?: number };
    }[];
    destinations?: { num: number; name: string; color: string }[];
    pointsDeductions?: { deductionText: string; competitorId: number }[];
    competitionRules?: { title: string; descriptions: string[] };
  }[];
};
type Games365 = { games?: Game365[] };

async function get<T>(path: string, fresh = false): Promise<T | null> {
  try {
    // קאש קצר של 10 שניות אצלנו רק כדי לא להעמיס. עותק טרי: פרמטר שמשתנה כל 15 שניות, כך ש-365 לא מחזירה את העותק השמור
    const bust = fresh ? `&_=${Math.floor(Date.now() / 15_000)}` : "";
    const r = await fetch(`${API}/${path}&${Q}${bust}`, { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: 10 }, signal: AbortSignal.timeout(8000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** שמות אזורי הטבלה שמגיעים באנגלית (יורוליג) */
const DEST_HE: Record<string, string> = { Playoff: "פלייאוף", "Next Round": "פליי-אין", Playoffs: "פלייאוף", "Play-In": "פליי-אין" };

const clean = (s: string) => s.replace(/\s*\(נוער\)\s*$/, "").trim();

async function one(l: (typeof LEAGUES)[number]): Promise<Table> {
  const base: Table = { key: l.key, title: l.title, sport: l.sport, kind: l.kind, rows: [], destinations: [], notes: [], live: false, ok: false };
  const load = (fresh: boolean) =>
    Promise.all([
      get<Raw365 & Games365>(`standings/?competitions=${l.id}&live=true`, fresh),
      get<Games365>(`games/current/?competitions=${l.id}`, fresh),
    ]);
  let [d, cur] = await load(false);
  const now = Date.now();
  const liveSet = (x: typeof d) => new Set((x?.standings?.[0]?.rows ?? []).map((r) => r.liveGameId).filter((v): v is number => !!v));
  let fresh = false;
  if (d?.standings?.[0]?.rows?.length && isStale(cur?.games ?? [], liveSet(d), now)) {
    const [d2, cur2] = await load(true);
    if (d2?.standings?.[0]?.rows?.length) { d = d2; fresh = true; }
    if (cur2?.games) cur = cur2;
  }
  const s = d?.standings?.[0];
  if (!s?.rows?.length) return base;

  // תוצאות חיות — מאותה תשובה של הטבלה (אותו רגע); אם חסר שם — מרשימת המשחקים
  const byId = new Map<number, Game365>();
  for (const g of cur?.games ?? []) byId.set(g.id, g);
  for (const g of d?.games ?? []) byId.set(g.id, g);
  // משחקים שהסתיימו ב-4 השעות האחרונות (לפי שעת הפתיחה)
  const recentEnd = (cur?.games ?? []).filter((g) => g.statusGroup === ENDED && now - Date.parse(g.startTime) < 4 * 3600_000);
  const upcoming = (cur?.games ?? []).filter((g) => g.statusGroup === NOT_STARTED && Date.parse(g.startTime) > now - 3 * 3600_000).map((g) => g.startTime).sort();

  const rows: Row[] = s.rows.map((r) => {
    let live: LiveInfo | undefined;
    const g = r.liveGameId ? byId.get(r.liveGameId) : undefined;
    if (g && g.statusGroup === LIVE) {
      const home = g.homeCompetitor.id === r.competitor.id;
      const me = home ? g.homeCompetitor : g.awayCompetitor;
      const op = home ? g.awayCompetitor : g.homeCompetitor;
      live = { opponent: clean(op.name), my: me.score ?? 0, their: op.score ?? 0, clock: g.gameTimeDisplay || g.shortStatusText || g.statusText || "", home };
    }
    let final: FinalInfo | undefined;
    const e = live ? undefined : recentEnd.find((x) => x.homeCompetitor.id === r.competitor.id || x.awayCompetitor.id === r.competitor.id);
    if (e) {
      const home = e.homeCompetitor.id === r.competitor.id;
      const me = home ? e.homeCompetitor : e.awayCompetitor;
      const op = home ? e.awayCompetitor : e.homeCompetitor;
      final = { opponent: clean(op.name), my: me.score ?? 0, their: op.score ?? 0 };
    }
    return {
      pos: r.position,
      id: r.competitor.id,
      name: clean(r.competitor.name),
      logo: `/api/team-logo?id=${r.competitor.id}&v=${r.competitor.imageVersion ?? 1}`,
      played: r.gamePlayed,
      won: r.gamesWon,
      drawn: r.gamesEven ?? 0,
      lost: r.gamesLost,
      gf: r.for,
      ga: r.against,
      points: r.points,
      pct: r.pct ?? "",
      form: (r.recentForm ?? []).slice(0, 5),
      dest: r.destinationNum || undefined,
      live,
      final,
    };
  });

  return {
    ...base,
    ok: true,
    rows,
    destinations: (s.destinations ?? []).map((x) => ({ ...x, name: DEST_HE[x.name.trim()] ?? x.name.trim() })),
    notes: (s.pointsDeductions ?? []).map((p) => {
      const team = rows.find((r) => r.id === p.competitorId)?.name;
      return team ? `${team}: ${p.deductionText}` : p.deductionText;
    }),
    rules: s.competitionRules ? `${s.competitionRules.title} ${s.competitionRules.descriptions.join(", ")}.` : undefined,
    live: rows.some((r) => r.live),
    nextKickoff: upcoming[0],
    fresh,
  };
}

export async function getStandings(): Promise<{ tables: Table[]; at: string }> {
  const tables = await Promise.all(LEAGUES.map(one));
  return { tables, at: new Date().toISOString() };
}
