/**
 * כל התוכן של האתר מוגדר כאן. לעדכון מניות / פידים / ליגות — עורכים רק את הקובץ הזה.
 * סימולים לפי Yahoo Finance (למשל: TA35.TA, ^GSPC, NVDA, ILS=X).
 */

export const OWNER_NAME = "יניב";

export const INDICES = [
  { symbol: "TA35.TA", name: 'ת"א-35' },
  { symbol: "^TA125.TA", name: 'ת"א-125' },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: 'נאסד"ק' },
];

export const STOCKS = [
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "ESLT.TA", name: "אלביט" },
  { symbol: "ILS=X", name: "דולר/שקל" },
  { symbol: "BTC-USD", name: "ביטקוין" },
];

export const TESLA_SYMBOL = "TSLA";

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
  news: 900,
  sports: 300,
  photo: 3600,
};

export const TZ = "Asia/Jerusalem";
