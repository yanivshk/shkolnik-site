/**
 * כל התוכן של האתר מוגדר כאן. לעדכון מניות / פידים / ליגות — עורכים רק את הקובץ הזה.
 * סימולים לפי Yahoo Finance (למשל: TA35.TA, ^GSPC, NVDA, ILS=X).
 */

export const OWNER_NAME = "יניב";

export const INDICES = [
  { symbol: "TA35.TA", name: 'ת"א-35', link: "https://www.google.com/finance/quote/142:TLV" },
  { symbol: "^TA125.TA", name: 'ת"א-125', link: "https://www.google.com/finance/quote/137:TLV" },
  // ת"א-90 לא קיים בגוגל פיננס — קישור לאתר הבורסה בת"א
  { symbol: "TA90.TA", name: 'ת"א-90', link: "https://market.tase.co.il/he/market_data/index/143/major_data" },
  { symbol: "^GSPC", name: "S&P 500", link: "https://www.google.com/finance/quote/.INX:INDEXSP" },
  { symbol: "^IXIC", name: 'נאסד"ק', link: "https://www.google.com/finance/quote/.IXIC:INDEXNASDAQ" },
];

export const STOCKS = [
  { symbol: "NVDA", name: "Nvidia", link: "https://www.google.com/finance/quote/NVDA:NASDAQ" },
  { symbol: "MSFT", name: "Microsoft", link: "https://www.google.com/finance/quote/MSFT:NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet", link: "https://www.google.com/finance/quote/GOOGL:NASDAQ" },
  { symbol: "AMD", name: "AMD", link: "https://www.google.com/finance/quote/AMD:NASDAQ" },
  { symbol: "INTC", name: "Intel", link: "https://www.google.com/finance/quote/INTC:NASDAQ" },
  { symbol: "SMH", name: "SMH · שבבים", link: "https://www.google.com/finance/quote/SMH:NASDAQ" },
  { symbol: "DRAM", name: "DRAM · זיכרון", link: "https://www.google.com/finance/quote/DRAM:BATS" },
  { symbol: "ESLT.TA", name: "אלביט", link: "https://www.google.com/finance/quote/ESLT:TLV" },
  { symbol: "DSIT.TA", name: "DSIT", link: "https://www.google.com/finance/quote/DSIT:TLV" },
  { symbol: "ILS=X", name: "דולר/שקל", link: "https://www.google.com/finance/quote/USD-ILS" },
  { symbol: "BTC-USD", name: "ביטקוין", link: "https://www.google.com/finance/quote/BTC-USD" },
];

/** סדר התצוגה בראש "מניות ומדדים". כל השאר מוצגים אחריהם תחת "במעקב", לפי הסדר שלמעלה. */
export const MARKETS_TOP_ORDER = ["DSIT.TA", "TA35.TA", "^TA125.TA", "^IXIC", "^GSPC", "TA90.TA"];

export const TESLA_SYMBOL = "TSLA";
export const TESLA_LINK = "https://www.google.com/finance/quote/TSLA:NASDAQ";

/** קישור לדף המניה/המדד (גוגל פיננס) לפי הסימול */
export function quoteLink(symbol: string): string | undefined {
  if (symbol === TESLA_SYMBOL) return TESLA_LINK;
  return [...INDICES, ...STOCKS].find((s) => s.symbol === symbol)?.link;
}

export const TESLA_FEEDS = [
  { name: "Electrek", url: "https://electrek.co/guides/tesla/feed/" },
  { name: "Teslarati", url: "https://www.teslarati.com/feed/" },
];

export const AI_FEEDS = [
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/rss.xml" },
  { name: "MIT Tech Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
];

export const SPORTS_NEWS_FEEDS = [
  { name: "ynet ספורט", url: "https://www.ynet.co.il/Integration/StoryRss3.xml" },
];

/**
 * חדשות — אתרי החדשות המובילים בישראל. weight = דירוג האתר (חשיפה), גבוה = חשוב יותר.
 * ידיעה שמופיעה בכמה אתרים במקביל מקבלת ניקוד גבוה יותר ("הכי חמה ברשת").
 */
export const ISRAEL_NEWS_FEEDS = [
  { name: "ynet", url: "https://www.ynet.co.il/Integration/StoryRss2.xml", weight: 6 },
  { name: "N12", url: "https://rcs.mako.co.il/rss/news-military.xml", weight: 5 },
  { name: "וואלה", url: "https://rss.walla.co.il/feed/1?type=main", weight: 4 },
  { name: "ישראל היום", url: "https://www.israelhayom.co.il/rss.xml", weight: 3 },
  { name: "מעריב", url: "https://www.maariv.co.il/Rss/RssChadashot", weight: 2 },
  { name: "הארץ", url: "https://www.haaretz.co.il/srv/htz---all-articles", weight: 2 },
];

/** מספר הידיעות המרבי במדור החדשות */
export const NEWS_LIMIT = 10;

/** ליגות מ-ESPN (ללא מפתח). slug לפי ESPN. */
export const SPORTS_LEAGUES = [
  { sport: "soccer", league: "uefa.europa", name: "ליגה אירופית" },
  { sport: "soccer", league: "uefa.champions", name: "ליגת האלופות" },
  { sport: "basketball", league: "nba", name: "NBA" },
];

/** משחקים של קבוצות אלה מוקפצים לראש הרשימה ומודגשים. */
export const HIGHLIGHT_TEAMS = ["Maccabi Tel-Aviv", "Maccabi Tel Aviv", "Portland Trail Blazers"];

/** מילים שמדגישות כותרות ספורט בעברית. */
export const HIGHLIGHT_KEYWORDS = ["מכבי תל אביב", "מכבי ת\"א", "אבדיה"];

/** זמני רענון (שניות) */
export const REVALIDATE = {
  markets: 300,
  news: 600,
  sports: 300,
  photo: 3600,
  fx: 3600,
  surf: 3600,
};

export const TZ = "Asia/Jerusalem";

/** שעוני עולם (שורה אחת בראש העמוד) — קיצור באנגלית + אזור זמן */
/** שעוני עולם — לחיצה פותחת את עמוד גוגל על המקום (מזג אוויר, שעה ומידע) */
export const WORLD_CLOCKS = [
  { label: "IND", tz: "Asia/Kolkata", place: "דלהי, הודו" },
  { label: "SGP", tz: "Asia/Singapore", place: "סינגפור" },
  { label: "BKK", tz: "Asia/Bangkok", place: "בנגקוק" },
  { label: "LDN", tz: "Europe/London", place: "לונדון" },
  { label: "NYC", tz: "America/New_York", place: "ניו יורק" },
];

/** תמונת טסלה יומית — חיפוש בתמונות "Quality images" של ויקימדיה קומונס */
export const TESLA_PHOTO_SEARCH = "intitle:Tesla incategory:Quality_images";

/** כתובת האתר הקנונית (לצורכי SEO) ופרטי קשר */
export const SITE_URL = process.env.SITE_URL || "https://www.shkolnik.co.il";
export const OWNER_FULL_NAME = "יניב שקולניק";
export const OWNER_FULL_NAME_EN = "Yaniv Shkolnik";
/** שם האתר — מופיע בגוגל מעל הכותרת של כל תוצאה */
export const SITE_NAME = "Shkolnik Family";

/** התיאור שמופיע בגוגל מתחת לשם (עמוד הבית ודפי המשפחה) */
export const SEARCH_SNIPPET = "מה זה הפועל?";
export const CONTACT_EMAIL = "FuckHapoel@shkolnik.co.il";
