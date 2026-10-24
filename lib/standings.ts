import "server-only";

/**
 * טבלאות ליגה — מקור: 365Scores (ה-API הציבורי של האתר שלהם, ללא מפתח; גם תוצאות ה-LIVE באתר ערוץ הספורט מגיעות משם).
 * הנתונים הוצלבו מול ערוץ הספורט (ליגת העל, לאומית, נוער) ומול ה-API הרשמי של היורוליג.
 * בזמן משחקים הטבלה של 365 היא "טבלה חיה": המשחק שבמהלך כבר נספר לפי התוצאה הנוכחית (liveGameId על השורה).
 */

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
type Games365 = {
  games?: {
    id: number; statusGroup: number; gameTimeDisplay?: string; statusText?: string; shortStatusText?: string;
    homeCompetitor: { id: number; name: string; score?: number };
    awayCompetitor: { id: number; name: string; score?: number };
  }[];
};

async function get<T>(path: string): Promise<T | null> {
  try {
    // כל כניסה לדף מביאה נתונים טריים (קאש קצר של 20 שניות רק כדי לא להעמיס על המקור)
    const r = await fetch(`${API}/${path}&${Q}`, { headers: { "User-Agent": UA, Accept: "application/json" }, next: { revalidate: 20 }, signal: AbortSignal.timeout(8000) });
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
  const d = await get<Raw365>(`standings/?competitions=${l.id}&live=true`);
  const s = d?.standings?.[0];
  if (!s?.rows?.length) return base;

  const liveIds = [...new Set(s.rows.map((r) => r.liveGameId).filter((x): x is number => !!x))];
  const games = liveIds.length ? await get<Games365>(`games/current/?competitions=${l.id}`) : null;
  const byId = new Map((games?.games ?? []).map((g) => [g.id, g]));

  const rows: Row[] = s.rows.map((r) => {
    let live: LiveInfo | undefined;
    const g = r.liveGameId ? byId.get(r.liveGameId) : undefined;
    if (g && g.statusGroup === 3) {
      const home = g.homeCompetitor.id === r.competitor.id;
      const me = home ? g.homeCompetitor : g.awayCompetitor;
      const op = home ? g.awayCompetitor : g.homeCompetitor;
      live = { opponent: clean(op.name), my: me.score ?? 0, their: op.score ?? 0, clock: g.gameTimeDisplay || g.shortStatusText || g.statusText || "", home };
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
  };
}

export async function getStandings(): Promise<{ tables: Table[]; at: string }> {
  const tables = await Promise.all(LEAGUES.map(one));
  return { tables, at: new Date().toISOString() };
}
