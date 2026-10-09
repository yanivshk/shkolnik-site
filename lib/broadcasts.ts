/** לוח שידורי משחקים בטלוויזיה — ערוץ הספורט (Sport5) וספורט 1 (Charlton), ללא מפתח. משותף לדף הבית ול-API. */

import { TZ } from "./config";
import { classifySport, isExcluded, resolveSport, type Sport, type SportEvidence } from "./sport-classify";

export type { Sport };

export type Broadcast = {
  id: string;
  date: string; // YYYY-MM-DD (שעון ישראל)
  time: string; // HH:MM
  sport: Sport | null; // null = לא ניתן לקבוע בוודאות — מוצג בלי אייקון ענף, לא בניחוש
  team: string; // הקבוצה שלנו
  logo?: string; // לוגו הקבוצה שלנו בענף הזה (רק כשהענף ידוע)
  home: boolean; // משחק בית
  opponent: string;
  league: string;
  channels: string[];
};

export type BroadcastDay = { from: string; days: number; items: Broadcast[] };

/** הערוצים מפרסמים לוח כשבוע קדימה */
export const BROADCAST_DAYS = 7;
/** רענון כל חצי שעה */
export const BROADCAST_REVALIDATE = 600;

/** הקבוצות שמוצגות בטבלה, ובאילו ענפים — עם הלוגו לכל ענף (public/teams) */
const TEAMS: { name: string; logos: Partial<Record<Sport, string>>; re: RegExp }[] = [
  { name: 'מכבי ת"א', logos: { soccer: "/teams/maccabi-ta-fc.png", basketball: "/teams/maccabi-ta-bc.png" }, re: /^מכבי (תל[ -]אביב|ת["״׳']א)$/ },
  { name: 'הפועל ת"א', logos: { soccer: "/teams/hapoel-ta-fc.png", basketball: "/teams/hapoel-ta-bc.png" }, re: /^הפועל (תל[ -]אביב|ת["״׳']א)$/ },
  { name: "מכבי חיפה", logos: { soccer: "/teams/maccabi-haifa.png" }, re: /^מכבי חיפה$/ },
  { name: 'בית"ר ירושלים', logos: { soccer: "/teams/beitar.png" }, re: /^(בית["״׳']?ר|ביתר)( ירושלים)?$/ },
  { name: "נבחרת ישראל", logos: { soccer: "/teams/israel-fc.png", basketball: "/teams/israel-bc.png" }, re: /^(נבחרת )?ישראל$/ },
];


/* ---------------- תאריכים ---------------- */

export function israelToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T12:00:00Z`)) && addDays(iso, 0) === iso;
}

/* ---------------- פענוח ---------------- */

const clean = (s: string) =>
  s.replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ").trim();

type Raw = { date: string; time: string; channel: string; league: string; title: string };

/** שורה שזוהתה כמשחק של אחת הקבוצות שלנו — לפני ההחלטה על הענף */
type Candidate = Raw & { team: (typeof TEAMS)[number]; home: boolean; opponent: string; evidence: SportEvidence | null };

/** "בית - חוץ" → משחק של אחת הקבוצות שלנו (בלי לקבוע עדיין ענף), או null */
function toCandidate(r: Raw): Candidate | null {
  if (isExcluded(r.league, r.title)) return null;
  const sides = r.title.split(",")[0].replace(/\s*\([^)]*\)\s*$/, "").split(" - ").map((s) => s.trim());
  if (sides.length !== 2 || !sides[0] || !sides[1]) return null;
  const home = TEAMS.find((t) => t.re.test(sides[0]));
  const away = TEAMS.find((t) => t.re.test(sides[1]));
  const team = home ?? away;
  if (!team) return null;
  return { ...r, team, home: !!home, opponent: home ? sides[1] : sides[0], evidence: classifySport(r.league, r.title) };
}

/** מפתח לאיחוד אותו משחק מכמה ערוצים/מקורות (בלי תלות בכתיב: ת"א/תל אביב, גרשיים) */
const norm = (s: string) => s.replace(/["״׳']/g, "").replace(/תל אביב/g, "תא").replace(/\s+/g, " ").trim();

/** מאחד שורות של אותו משחק, ומחליט על הענף מכל הראיות יחד */
function toBroadcasts(raws: Raw[]): Broadcast[] {
  const groups = new Map<string, Candidate[]>();
  for (const r of raws) {
    const c = toCandidate(r);
    if (!c) continue;
    const key = `${c.date}|${c.team.name}|${norm(c.opponent)}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const out: Broadcast[] = [];
  for (const [key, cs] of groups) {
    const sport = resolveSport(cs.map((c) => c.evidence));
    const team = cs[0].team;
    // ענף לא ידוע: קבוצה שעוקבים אחריה רק בענף אחד (מכבי חיפה, בית"ר) — לא מציגים, אולי זה בכלל הענף השני
    if (!sport && Object.keys(team.logos).length < 2) continue;
    if (sport && !team.logos[sport]) continue; // ענף שלא עוקבים אחריו בקבוצה הזו
    if (!sport) console.warn(`[broadcasts] לא ניתן לקבוע ענף: ${key}`, cs.map((c) => `${c.channel}: ${c.league} | ${c.title}`));
    const best = cs.find((c) => c.evidence?.by === "explicit") ?? cs.find((c) => c.evidence) ?? cs[0];
    out.push({
      id: `${key}|${sport ?? "?"}`,
      date: best.date,
      time: cs.map((c) => c.time).sort()[0],
      sport,
      team: team.name,
      logo: sport ? team.logos[sport] : undefined,
      home: best.home,
      opponent: best.opponent,
      league: best.league.replace(/\s*\d{4}\/\d{2,4}$/, "").trim(),
      channels: [...new Set(cs.map((c) => c.channel))],
    });
  }
  return out;
}

/* ---------------- מקורות ---------------- */

const UA = "Mozilla/5.0 (compatible; ShkolnikHub/1.0; +https://www.shkolnik.co.il)";

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: BROADCAST_REVALIDATE },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** ערוץ הספורט: טבלה לכל ערוץ, שורה = שעה + "ליגה: בית - חוץ, מחזור" */
async function sport5(date: string): Promise<Raw[]> {
  const [y, m, d] = date.split("-").map(Number);
  const html = await getText(`https://m.sport5.co.il/Ajax/GetBroadcastSheetData.aspx?Type=&Date=${y}-${m}-${d}`);
  if (!html) return [];
  const out: Raw[] = [];
  let channel = "";
  const re = /<th[^>]*>[\s\S]*?alt="([^"]*)"[\s\S]*?<\/th>|<td class="date">\s*(\d{1,2}:\d{2})[\s\S]*?<td class="text">([\s\S]*?)<\/td>/g;
  for (const m of html.matchAll(re)) {
    if (m[1] !== undefined) { channel = clean(m[1]); continue; }
    // ספורט מובייל / רדיו / האתר משדרים את אותם משחקים — רק ערוצי טלוויזיה
    if (!channel || /מובייל|רדיו|אתר|^ישיר$/.test(channel)) continue;
    const text = clean(m[3]);
    const i = text.indexOf(":");
    out.push({ date, time: m[2].padStart(5, "0"), channel, league: i > 0 ? text.slice(0, i) : "", title: i > 0 ? text.slice(i + 1).trim() : text });
  }
  return out;
}

/**
 * שמות ערוצי ספורט 1 לפי מזהה הבלוק (channel-N-container) — כפי שהם מופיעים בעמוד לוח השידורים שלהם.
 * חשוב: מספר קובץ הלוגו (sport1-N-channel-logo) לא תואם את מספר הערוץ, ולכן לא משתמשים בו.
 * הגיבוי נבדק מול האתר ב-10.2026.
 */
const SPORT1_CHANNELS_FALLBACK: Record<string, string> = { "1": "ספורט 6", "2": "ספורט 1", "3": "ספורט 2", "4": "ספורט 3", "5": "ספורט 4" };

async function sport1Channels(): Promise<Record<string, string>> {
  try {
    const res = await fetch("https://sport1.maariv.co.il/broadcast-schedule/", {
      headers: { "User-Agent": UA },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return SPORT1_CHANNELS_FALLBACK;
    const html = await res.text();
    const names: Record<string, string> = {};
    for (const m of html.matchAll(/<h2[^>]*data-channel-id="(\d+)"[^>]*>\s*([^<]+?)\s*<\/h2>/g)) names[m[1]] = clean(m[2]);
    return Object.keys(names).length ? names : SPORT1_CHANNELS_FALLBACK;
  } catch {
    return SPORT1_CHANNELS_FALLBACK;
  }
}

/** ספורט 1: JSON שמכיל HTML — בלוק לכל ערוץ, שם המשחק + תיאור הליגה */
async function sport1(date: string, channels: Record<string, string>): Promise<Raw[]> {
  const body = await getText(`https://sport1.maariv.co.il/wp-json/sport1/v1/broadcast/day/${date}/?live=1`);
  if (!body) return [];
  let html: string;
  try { html = JSON.parse(body); } catch { return []; }
  if (typeof html !== "string") return [];
  const out: Raw[] = [];
  const parts = html.split(/(?=id="channel-\d+-container")/).slice(1);
  for (const part of parts) {
    const id = part.match(/^id="channel-(\d+)-container"/)?.[1];
    const channel = id ? channels[id] : undefined;
    if (!channel) { console.warn(`[broadcasts] ערוץ ספורט 1 לא מוכר: ${id}`); continue; }
    const re = /show-starting-time">\s*(\d{1,2}:\d{2})[\s\S]*?show-name">([\s\S]*?)<\/p>\s*<p class="show-description">([\s\S]*?)<\/p>/g;
    for (const m of part.matchAll(re)) {
      out.push({ date, time: m[1].padStart(5, "0"), channel, league: clean(m[3]), title: clean(m[2]) });
    }
  }
  return out;
}

/* ---------------- ציבורי ---------------- */

export async function getBroadcasts(from: string, days = BROADCAST_DAYS): Promise<BroadcastDay> {
  if (process.env.MOCK_DATA === "1") return { from, days, items: mockBroadcasts(from) };
  const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
  const s1Channels = await sport1Channels();
  const raws = (await Promise.all(dates.flatMap((d) => [sport5(d), sport1(d, s1Channels)]))).flat();
  const items = toBroadcasts(raws).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return { from, days, items };
}

function mockBroadcasts(from: string): Broadcast[] {
  const row = (d: number, time: string, sport: Sport, team: string, logo: string, home: boolean, opponent: string, league: string, channels: string[]): Broadcast =>
    ({ id: `${d}-${team}-${opponent}`, date: addDays(from, d), time, sport, team, logo, home, opponent, league, channels });
  return [
    row(0, "21:15", "basketball", 'מכבי ת"א', "/teams/maccabi-ta-bc.png", false, "פנאתינייקוס", "יורוליג", ["ערוץ הספורט"]),
    row(1, "20:40", "basketball", 'הפועל ת"א', "/teams/hapoel-ta-bc.png", true, "עירוני נס ציונה", "גביע ווינר סל", ["ערוץ הספורט"]),
    row(2, "18:45", "basketball", 'מכבי ת"א', "/teams/maccabi-ta-bc.png", true, "הפועל ירושלים", "גביע ווינר סל", ["ערוץ הספורט"]),
    row(2, "21:45", "soccer", "נבחרת ישראל", "/teams/israel-fc.png", false, "אירלנד", "ליגת האומות", ["ערוץ הספורט", "ספורט 5+"]),
    row(5, "20:30", "soccer", "מכבי חיפה", "/teams/maccabi-haifa.png", true, 'בית"ר ירושלים', "ליגת העל", ["ספורט 1"]),
  ];
}
