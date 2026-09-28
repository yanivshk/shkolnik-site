import "server-only";
import { XMLParser } from "fast-xml-parser";
import {
  AI_FEEDS, HIGHLIGHT_KEYWORDS, HIGHLIGHT_TEAMS, INDICES, REVALIDATE,
  SPORTS_LEAGUES, SPORTS_NEWS_FEEDS, STOCKS, TESLA_FEEDS, TESLA_SYMBOL, TZ,
} from "./config";
import type { DailyPhoto, Game, NewsItem, Quote } from "./types";
import * as mock from "./mock";

const UA = "Mozilla/5.0 (compatible; ShkolnikHub/1.0; +https://www.shkolnik.co.il)";
const MOCK = process.env.MOCK_DATA === "1";

async function getJSON<T>(url: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getText(url: string, revalidate: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/* ---------------- Markets (Yahoo Finance chart API, keyless) ---------------- */

type YahooChart = {
  chart: {
    result?: {
      meta: {
        regularMarketPrice: number;
        chartPreviousClose?: number;
        previousClose?: number;
        currency?: string;
        currentTradingPeriod?: { regular?: { start: number; end: number } };
      };
      indicators: { quote: { close: (number | null)[] }[] };
    }[];
  };
};

async function getQuote(symbol: string, name: string): Promise<Quote | null> {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
  const data =
    (await getJSON<YahooChart>(`https://query1.finance.yahoo.com${path}`, REVALIDATE.markets)) ??
    (await getJSON<YahooChart>(`https://query2.finance.yahoo.com${path}`, REVALIDATE.markets));
  const r = data?.chart?.result?.[0];
  if (!r) return null;
  const closes = (r.indicators.quote[0]?.close ?? []).filter((v): v is number => typeof v === "number");
  const price = r.meta.regularMarketPrice;
  const prev = closes.length >= 2 ? closes[closes.length - 2] : r.meta.previousClose ?? r.meta.chartPreviousClose ?? price;
  const now = Date.now() / 1000;
  const p = r.meta.currentTradingPeriod?.regular;
  return {
    symbol,
    name,
    price,
    change: price - prev,
    changePct: prev ? ((price - prev) / prev) * 100 : 0,
    currency: r.meta.currency ?? "",
    series: closes.slice(-22),
    marketState: p && now >= p.start && now <= p.end ? "open" : "closed",
  };
}

export async function getMarkets() {
  if (MOCK) return mock.markets();
  const [indices, stocks] = await Promise.all([
    Promise.all(INDICES.map((s) => getQuote(s.symbol, s.name))),
    Promise.all(STOCKS.map((s) => getQuote(s.symbol, s.name))),
  ]);
  return { indices: indices.filter(Boolean) as Quote[], stocks: stocks.filter(Boolean) as Quote[] };
}

export async function getTeslaQuote() {
  if (MOCK) return mock.tesla();
  return getQuote(TESLA_SYMBOL, "Tesla");
}

/* ---------------- RSS / Atom ---------------- */

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

const txt = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)["#text"]);
  return "";
};

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8217;/g, "’").replace(/&#8216;/g, "‘").replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;/g, "–").replace(/&#8212;/g, "—").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();

function pickImage(it: Record<string, unknown>): string | null {
  const media = (it["media:content"] ?? it["media:thumbnail"]) as Record<string, string> | Record<string, string>[] | undefined;
  const m = Array.isArray(media) ? media[0] : media;
  if (m?.["@_url"]) return m["@_url"];
  const enc = it["enclosure"] as Record<string, string> | undefined;
  if (enc?.["@_url"] && /image/.test(enc["@_type"] ?? "image")) return enc["@_url"];
  const html = txt(it["content:encoded"]) || txt(it["description"]);
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

const safeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : "#");

async function getFeed(feed: { name: string; url: string }, limit = 8): Promise<NewsItem[]> {
  const body = await getText(feed.url, REVALIDATE.news);
  if (!body) return [];
  try {
    const doc = xml.parse(body);
    const rssItems = doc?.rss?.channel?.item;
    const atomItems = doc?.feed?.entry;
    const items: Record<string, unknown>[] = [].concat(rssItems ?? atomItems ?? []);
    return items.slice(0, limit).map((it) => {
      const linkField = it["link"] as unknown;
      let link = txt(linkField);
      if (!link && linkField) {
        const arr = ([] as Record<string, string>[]).concat(linkField as Record<string, string>);
        link = (arr.find((l) => l["@_rel"] === "alternate") ?? arr[0])?.["@_href"] ?? "";
      }
      return {
        title: decode(txt(it["title"])),
        link: safeUrl(link.trim()),
        source: feed.name,
        date: txt(it["pubDate"]) || txt(it["published"]) || txt(it["updated"]) || txt(it["dc:date"]) || null,
        image: pickImage(it),
      };
    }).filter((n) => n.title);
  } catch {
    return [];
  }
}

const byDate = (a: NewsItem, b: NewsItem) => (Date.parse(b.date ?? "") || 0) - (Date.parse(a.date ?? "") || 0);

async function getFeeds(feeds: { name: string; url: string }[], limit: number) {
  const all = (await Promise.all(feeds.map((f) => getFeed(f)))).flat();
  const seen = new Set<string>();
  return all.sort(byDate).filter((n) => (seen.has(n.title) ? false : (seen.add(n.title), true))).slice(0, limit);
}

export async function getTeslaNews() {
  if (MOCK) return mock.teslaNews();
  return getFeeds(TESLA_FEEDS, 8);
}

export async function getAINews() {
  if (MOCK) return mock.aiNews();
  return getFeeds(AI_FEEDS, 12);
}

export async function getSportsNews() {
  if (MOCK) return mock.sportsNews();
  const items = await getFeeds(SPORTS_NEWS_FEEDS, 12);
  return items
    .map((n) => ({ ...n, highlight: HIGHLIGHT_KEYWORDS.some((k) => n.title.includes(k)) }))
    .sort((a, b) => Number(b.highlight) - Number(a.highlight))
    .slice(0, 6);
}

/* ---------------- Sports (ESPN public scoreboard) ---------------- */

type EspnScoreboard = {
  events?: {
    id: string;
    date: string;
    status: { type: { state: "pre" | "in" | "post"; shortDetail: string } };
    competitions: {
      competitors: {
        homeAway: "home" | "away";
        score?: string;
        team: { displayName: string; shortDisplayName: string; abbreviation: string; logo?: string };
      }[];
    }[];
  }[];
};

export async function getGames(): Promise<Game[]> {
  if (MOCK) return mock.games();
  const boards = await Promise.all(
    SPORTS_LEAGUES.map(async (l) => {
      const data = await getJSON<EspnScoreboard>(
        `https://site.api.espn.com/apis/site/v2/sports/${l.sport}/${l.league}/scoreboard`,
        REVALIDATE.sports,
      );
      return (data?.events ?? []).map((e): Game | null => {
        const c = e.competitions?.[0]?.competitors ?? [];
        const h = c.find((x) => x.homeAway === "home");
        const a = c.find((x) => x.homeAway === "away");
        if (!h || !a) return null;
        const names = [h.team.displayName, a.team.displayName];
        return {
          id: `${l.league}-${e.id}`,
          league: l.name,
          date: e.date,
          status: e.status.type.shortDetail,
          state: e.status.type.state,
          home: { name: h.team.displayName, short: h.team.abbreviation, score: h.score ?? "", logo: h.team.logo },
          away: { name: a.team.displayName, short: a.team.abbreviation, score: a.score ?? "", logo: a.team.logo },
          highlight: names.some((n) => HIGHLIGHT_TEAMS.some((t) => n.toLowerCase().includes(t.toLowerCase()))),
        };
      }).filter(Boolean) as Game[];
    }),
  );
  const rank = { in: 0, pre: 1, post: 2 } as const;
  return boards.flat()
    .sort((a, b) => Number(b.highlight) - Number(a.highlight) || rank[a.state] - rank[b.state] || Date.parse(a.date) - Date.parse(b.date))
    .slice(0, 8);
}

/* ---------------- Daily photo (Wikimedia Commons Picture of the Day, keyless) ---------------- */

type WikiFeatured = {
  image?: {
    title: string;
    thumbnail?: { source: string };
    image?: { source: string };
    description?: { text?: string };
    artist?: { text?: string };
    file_page?: string;
  };
};

export async function getDailyPhoto(): Promise<DailyPhoto | null> {
  if (MOCK) return mock.photo();
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date()).split("-");

  // 1) תמונת היום של ויקימדיה — "Featured picture" שנבחרה בהצבעת הקהילה
  const data = await getJSON<WikiFeatured>(
    `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${d[0]}/${d[1]}/${d[2]}`,
    REVALIDATE.photo,
  );
  const img = data?.image;
  if (img?.title) {
    const file = img.title.replace(/^File:/, "");
    return {
      // Special:FilePath מחזיר גרסה מוקטנת תקנית (1920px) — בלי לנחש כתובת thumbnail
      src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1920`,
      title: decode(file.replace(/\.[a-z]+$/i, "")),
      description: decode(img.description?.text ?? ""),
      credit: decode(img.artist?.text ?? "Wikimedia Commons"),
      link: img.file_page ?? "https://commons.wikimedia.org/wiki/Main_Page",
    };
  }

  // 2) גיבוי: NASA Astronomy Picture of the Day
  const apod = await getJSON<{ media_type?: string; url?: string; hdurl?: string; title?: string }>(
    `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY || "DEMO_KEY"}&date=${d.join("-")}`,
    REVALIDATE.photo,
  );
  if (apod?.media_type === "image" && apod.url) {
    return { src: apod.url, title: apod.title ?? "", description: "", credit: "NASA", link: apod.url };
  }
  return null;
}
