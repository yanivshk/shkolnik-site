/** לוח שידורי משחקים בטלוויזיה — ערוץ הספורט (Sport5) וספורט 1 (Charlton), ללא מפתח. משותף לדף הבית ול-API. */

import { TZ } from "./config";

export type Sport = "soccer" | "basketball";

export type Broadcast = {
  id: string;
  date: string; // YYYY-MM-DD (שעון ישראל)
  time: string; // HH:MM
  sport: Sport;
  team: string; // הקבוצה שלנו
  opponent: string;
  league: string;
  channels: string[];
};

export type BroadcastDay = { from: string; days: number; items: Broadcast[] };

/** הערוצים מפרסמים לוח כשבוע קדימה */
export const BROADCAST_DAYS = 7;
/** רענון כל חצי שעה */
export const BROADCAST_REVALIDATE = 1800;

/** הקבוצות שמוצגות בטבלה, ובאילו ענפים */
const TEAMS: { name: string; sports: Sport[]; re: RegExp }[] = [
  { name: 'מכבי ת"א', sports: ["soccer", "basketball"], re: /^מכבי (תל[ -]אביב|ת["״׳']א)$/ },
  { name: 'הפועל ת"א', sports: ["soccer", "basketball"], re: /^הפועל (תל[ -]אביב|ת["״׳']א)$/ },
  { name: "מכבי חיפה", sports: ["soccer"], re: /^מכבי חיפה$/ },
  { name: 'בית"ר ירושלים', sports: ["soccer"], re: /^(בית["״׳']?ר|ביתר)( ירושלים)?$/ },
  { name: "נבחרת ישראל", sports: ["soccer", "basketball"], re: /^(נבחרת )?ישראל$/ },
];

const SKIP = /נשים|נוער|נערים|נערות|צעירות|עד גיל|U-?\d\d|כדוריד|כדורעף|פוטסל|חופים|טניס|פאדל|אולפן|תקציר|סיכום|שידור חוזר/;
const BASKETBALL = /כדורסל|יורוליג|יורוקאפ|ווינר|FIBA|יורובאסקט|EuroBasket/i;
const SOCCER = /כדורגל|ליגת העל|ליגה לאומית|ליגת האומות|ליגת האלופות|הליגה האירופית|קונפרנס|גביע המדינה|גביע הטוטו|אלוף האלופות|סופר ?קאפ|מוקדמות|מונדיאל|יורו|ידידות/;

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

/** "בית - חוץ" → משחק של אחת הקבוצות שלנו, או null */
function toBroadcast(r: Raw): Broadcast | null {
  const all = `${r.league} ${r.title}`;
  if (SKIP.test(all)) return null;
  const sport: Sport | null = BASKETBALL.test(all) ? "basketball" : SOCCER.test(all) ? "soccer" : null;
  if (!sport) return null;
  const sides = r.title.split(",")[0].replace(/\s*\([^)]*\)\s*$/, "").split(" - ").map((s) => s.trim());
  if (sides.length !== 2 || !sides[0] || !sides[1]) return null;
  const match = (s: string) => TEAMS.find((t) => t.sports.includes(sport) && t.re.test(s));
  const home = match(sides[0]);
  const away = match(sides[1]);
  const ours = home ?? away;
  if (!ours) return null;
  const opponent = home ? sides[1] : sides[0];
  return {
    id: `${r.date}-${ours.name}-${opponent}`,
    date: r.date,
    time: r.time,
    sport,
    team: ours.name,
    opponent,
    league: r.league.replace(/\s*\d{4}\/\d{2,4}$/, "").trim(),
    channels: [r.channel],
  };
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

/** ספורט 1: JSON שמכיל HTML — בלוק לכל ערוץ, שם המשחק + תיאור הליגה */
async function sport1(date: string): Promise<Raw[]> {
  const body = await getText(`https://sport1.maariv.co.il/wp-json/sport1/v1/broadcast/day/${date}/?live=1`);
  if (!body) return [];
  let html: string;
  try { html = JSON.parse(body); } catch { return []; }
  if (typeof html !== "string") return [];
  const out: Raw[] = [];
  const parts = html.split(/id="channel-\d+-container"/).slice(1);
  for (const part of parts) {
    const n = part.match(/channels-logo\/sport1-(\d+)-channel-logo/)?.[1];
    if (!n) continue;
    const re = /show-starting-time">\s*(\d{1,2}:\d{2})[\s\S]*?show-name">([\s\S]*?)<\/p>\s*<p class="show-description">([\s\S]*?)<\/p>/g;
    for (const m of part.matchAll(re)) {
      out.push({ date, time: m[1].padStart(5, "0"), channel: `ספורט ${n}`, league: clean(m[3]), title: clean(m[2]) });
    }
  }
  return out;
}

/* ---------------- ציבורי ---------------- */

export async function getBroadcasts(from: string, days = BROADCAST_DAYS): Promise<BroadcastDay> {
  if (process.env.MOCK_DATA === "1") return { from, days, items: mockBroadcasts(from) };
  const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
  const raws = (await Promise.all(dates.flatMap((d) => [sport5(d), sport1(d)]))).flat();
  const byId = new Map<string, Broadcast>();
  for (const r of raws) {
    const b = toBroadcast(r);
    if (!b) continue;
    const prev = byId.get(b.id);
    if (!prev) byId.set(b.id, b);
    else if (!prev.channels.includes(b.channels[0])) prev.channels.push(b.channels[0]);
  }
  const items = [...byId.values()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return { from, days, items };
}

function mockBroadcasts(from: string): Broadcast[] {
  const row = (d: number, time: string, sport: Sport, team: string, opponent: string, league: string, channels: string[]): Broadcast =>
    ({ id: `${d}-${team}-${opponent}`, date: addDays(from, d), time, sport, team, opponent, league, channels });
  return [
    row(0, "21:15", "basketball", 'מכבי ת"א', "פנאתינייקוס", "יורוליג", ["ערוץ הספורט"]),
    row(1, "20:40", "basketball", 'הפועל ת"א', "עירוני נס ציונה", "גביע ווינר סל", ["ערוץ הספורט"]),
    row(2, "18:45", "basketball", 'מכבי ת"א', "הפועל ירושלים", "גביע ווינר סל", ["ערוץ הספורט"]),
    row(2, "21:45", "soccer", "נבחרת ישראל", "אירלנד", "ליגת האומות", ["ערוץ הספורט", "ספורט 5+"]),
    row(5, "20:30", "soccer", "מכבי חיפה", 'בית"ר ירושלים', "ליגת העל", ["ספורט 1"]),
  ];
}
