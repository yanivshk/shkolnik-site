import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import type { Broadcast } from "./broadcasts";
import { addDays } from "./broadcasts";
import { TZ } from "./config";
import type { MoverReason } from "./data";
import { formatPct } from "./format";
import type { Surf } from "./surf-spots";
import { dirShort, waveLabel } from "./surf-spots";
import type { Quote } from "./types";
import type { Weather } from "./weather";
import { israelTime } from "./tz";

/**
 * "הבוקר שלך" — תקציר אישי בכמה שורות, מסודר לפי מה שחשוב בשעה הזו.
 * הבסיס הוא כללים קבועים (תמיד עובד, חינם). אם מוגדר ANTHROPIC_API_KEY ב-Vercel,
 * Claude מנסח מעל השורות משפט פתיחה אחד בעברית טבעית (נשמר בקאש לחצי שעה).
 */

export type BriefLine = { key: "sea" | "weather" | "game" | "markets"; icon: string; text: string; href?: string };
export type Brief = { title: string; lines: BriefLine[]; summary: string | null; movers: MoverReason[] };

/** בידוד כיווניות למספרים, אחוזים וטווחי שעות — כדי שלא יתהפכו בתוך משפט בעברית */
const ltr = (t: string) => `\u2066${t}\u2069`;

function israelNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), hm: `${p.hour}:${p.minute}` };
}

/** חלון הגלישה הטוב ביותר מעכשיו ועד 19:00: שעות רצופות עם גל ≥0.6 מ' ורוח ≤12 קשר */
function surfWindow(s: Surf, today: string): { from: string; to: string } | null {
  let best: { a: number; b: number } | null = null;
  let start = -1;
  const ok = (i: number) => {
    const h = s.hours[i];
    const hr = Number(h.time.slice(11, 13));
    return h.time.startsWith(today) && hr >= 6 && hr <= 19 && i >= s.now && h.wave >= 0.6 && h.wind <= 12;
  };
  for (let i = 0; i <= s.hours.length; i++) {
    if (i < s.hours.length && ok(i)) { if (start < 0) start = i; continue; }
    if (start >= 0 && (!best || i - start > best.b - best.a)) best = { a: start, b: i };
    start = -1;
  }
  if (!best || best.b - best.a < 2) return null;
  return { from: s.hours[best.a].time.slice(11, 13), to: s.hours[best.b - 1].time.slice(11, 13) };
}

function seaLine(s: Surf | null, today: string): BriefLine | null {
  const h = s?.hours[s.now];
  if (!s || !h) return null;
  const w = surfWindow(s, today);
  const swell = h.swell != null ? `, סוול ${h.swell.toFixed(1)} מ' ${h.swellDir != null ? dirShort(h.swellDir) : ""}`.trimEnd() : "";
  const verdict = w ? `חלון טוב לגלישה ${ltr(`${w.from}:00–${w.to}:00`)}` : h.wind > 15 ? "רוח חזקה — לא לגלישה" : h.wave < 0.4 ? "ים שטוח" : "בלי חלון גלישה טוב היום";
  return { key: "sea", icon: "🌊", text: `${s.spot}: גלים ${h.wave.toFixed(1)} מ' (${waveLabel(h.wave)})${swell}. ${verdict}.`, href: "/sea" };
}

function weatherLine(w: Weather | null): BriefLine | null {
  if (!w) return null;
  const rain = w.rainProb >= 40 ? ` · ${w.rainProb}% סיכוי לגשם — כדאי מטריה` : "";
  return { key: "weather", icon: "🌤️", text: `${w.name}: ${Math.round(w.temp)}°, לחות ${w.humidity}%${rain}.` };
}

/** המשחק הבא שלנו ב-36 השעות הקרובות */
function gameLine(items: Broadcast[], now: { date: string; hm: string }, skip: Set<string>): BriefLine | null {
  const tomorrow = addDays(now.date, 1);
  // כולל משחק שהתחיל עד שעתיים אחורה (ייתכן שעדיין משוחק)
  const since = Date.now() - 2 * 3600_000;
  const next = items.find((b) => !skip.has(b.id) && (b.date === now.date || b.date === tomorrow) && israelTime(b.date, b.time).getTime() >= since);
  if (!next) return null;
  const when = next.date === now.date ? (next.time >= "17:00" ? "הערב" : "היום") : "מחר";
  const ball = next.sport === "soccer" ? "⚽" : next.sport === "basketball" ? "🏀" : "📺";
  return { key: "game", icon: ball, text: `${when} ${next.time} · ${next.team} נגד ${next.opponent} · ${next.channels[0] ?? ""}`.replace(/ · $/, ""), href: "#sports" };
}

function marketsLine(quotes: Quote[]): BriefLine | null {
  const ta = quotes.find((q) => q.symbol === "TA35.TA");
  const sp = quotes.find((q) => q.symbol === "^GSPC");
  const parts = [ta && `ת"א-35 ${ltr(formatPct(ta.changePct))}`, sp && `S&P ${ltr(formatPct(sp.changePct))}`].filter(Boolean);
  if (!parts.length) return null;
  return { key: "markets", icon: "📈", text: parts.join(" · "), href: "#markets" };
}

/** סדר השורות לפי השעה: בבוקר ים ומזג אוויר, בשעות המסחר שווקים, בערב המשחק */
const ORDER: Record<string, BriefLine["key"][]> = {
  morning: ["sea", "weather", "game", "markets"],
  day: ["markets", "game", "sea", "weather"],
  evening: ["game", "markets", "weather", "sea"],
};

const aiSummary = unstable_cache(
  async (facts: string): Promise<string | null> => {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    try {
      const client = new Anthropic();
      const res = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 400,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system:
          "אתה כותב ליניב שורת פתיחה אחת לדשבורד האישי שלו. כתוב בעברית טבעית וחמה, משפט אחד או שניים, עד 35 מילים. " +
          "השתמש רק בעובדות שבהודעה — אל תמציא נתונים, שעות או תוצאות. בלי ברכות שלום, בלי אימוג'י, בלי מירכאות.",
        messages: [{ role: "user", content: facts }],
      } as Parameters<typeof client.beta.messages.create>[0]);
      if (!("content" in res) || res.stop_reason === "refusal") return null;
      const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
      return text || null;
    } catch {
      return null; // תמיד יש את השורות שמבוססות על כללים
    }
  },
  ["brief-ai-v1"],
  { revalidate: 1800 },
);

export async function buildBrief(input: { weather: Weather | null; surf: Surf | null; broadcasts: Broadcast[]; quotes: Quote[]; movers: MoverReason[]; liveIds?: string[] }): Promise<Brief> {
  const now = israelNow();
  const slot = now.hour >= 5 && now.hour < 11 ? "morning" : now.hour >= 11 && now.hour < 17 ? "day" : "evening";
  const title = slot === "morning" ? "הבוקר שלך" : slot === "day" ? "הצהריים שלך" : now.hour >= 22 || now.hour < 5 ? "הלילה שלך" : "הערב שלך";
  const all = [seaLine(input.surf, now.date), weatherLine(input.weather), gameLine(input.broadcasts, now, new Set(input.liveIds ?? [])), marketsLine(input.quotes)].filter(Boolean) as BriefLine[];
  const lines = ORDER[slot].map((k) => all.find((l) => l.key === k)).filter(Boolean) as BriefLine[];

  // העובדות לניסוח — מעוגלות לשעה, כדי שהקאש לא יתחלף על כל שינוי קטן
  const facts = [`שעה: ${now.hour}:00 (${title})`, ...lines.map((l) => l.text), ...input.movers.map((m) => `${m.name} ${formatPct(m.changePct)}: ${m.title}`)].join("\n");
  const summary = await aiSummary(facts);
  return { title, lines, summary, movers: input.movers };
}
