// נתוני דמה לפיתוח מקומי בלבד (npm run mock). לא נטען בפרודקשן.
import type { DailyPhoto, Game, NewsItem, Quote } from "./types";

const walk = (start: number, n = 22, vol = 0.012, seed = 1) => {
  let s = seed, v = start;
  return Array.from({ length: n }, () => {
    s = (s * 9301 + 49297) % 233280;
    v *= 1 + (s / 233280 - 0.48) * vol * 2;
    return +v.toFixed(2);
  });
};

const q = (symbol: string, name: string, base: number, seed: number, currency = "USD"): Quote => {
  const series = walk(base, 22, 0.015, seed);
  const price = series[series.length - 1], prev = series[series.length - 2];
  return { symbol, name, price, change: price - prev, changePct: ((price - prev) / prev) * 100, currency, series, marketState: "closed" };
};

export const markets = () => ({
  indices: [q("TA35.TA", 'ת"א-35', 4218, 3, "ILS"), q("^TA125.TA", 'ת"א-125', 4390, 7, "ILS"), q("TA90.TA", 'ת"א-90', 3670, 9, "ILS"), q("^GSPC", "S&P 500", 6890, 11), q("^IXIC", 'נאסד"ק', 23410, 5)],
  stocks: [q("NVDA", "Nvidia", 212, 13), q("MSFT", "Microsoft", 548, 17), q("GOOGL", "Alphabet", 268, 19), q("AMD", "AMD", 607, 41), q("INTC", "Intel", 116, 43), q("SMH", "SMH · שבבים", 600, 47), q("DRAM", "DRAM · זיכרון", 59.7, 53), q("ESLT.TA", "אלביט", 162000, 23, "ILA"), q("DSIT.TA", "DSIT", 1480, 59, "ILA"), q("ILS=X", "דולר/שקל", 3.34, 29, "ILS"), q("BTC-USD", "ביטקוין", 118400, 31)],
});

export const tesla = () => q("TSLA", "Tesla", 448, 37);

const ago = (h: number) => new Date(Date.now() - h * 3600e3).toUTCString();

export const teslaNews = (): NewsItem[] => [
  { title: "Tesla expands Robotaxi service area with new geofence update", link: "#", source: "Electrek", date: ago(1) },
  { title: "Model Y L deliveries begin in new markets as demand ramps", link: "#", source: "Teslarati", date: ago(3) },
  { title: "FSD v14 release notes: smoother lane changes and parking", link: "#", source: "Electrek", date: ago(6) },
  { title: "Megapack factory hits new production milestone", link: "#", source: "Teslarati", date: ago(9) },
  { title: "Optimus team shows latest hand dexterity demo", link: "#", source: "Electrek", date: ago(14) },
];

export const aiNews = (): NewsItem[] => [
  { title: "Introducing a new family of frontier reasoning models", link: "#", source: "OpenAI", date: ago(2) },
  { title: "Gemini Live gets real-time avatar and multilingual voice", link: "#", source: "Google DeepMind", date: ago(4) },
  { title: "Why AI agents still struggle with long-horizon security tasks", link: "#", source: "MIT Tech Review", date: ago(7) },
  { title: "Open-weight models close the gap on coding benchmarks", link: "#", source: "Hugging Face", date: ago(10) },
  { title: "Enterprise AI governance: what regulators expect in 2027", link: "#", source: "MIT Tech Review", date: ago(16) },
  { title: "Scaling test-time compute for scientific discovery", link: "#", source: "Google DeepMind", date: ago(22) },
];

export const sportsNews = (): NewsItem[] => [
  { title: "מכבי תל אביב ניצחה בדרבי וממשיכה בצמרת", link: "#", source: "ynet ספורט", date: ago(1), highlight: true },
  { title: "אבדיה עם 24 נקודות בניצחון של פורטלנד", link: "#", source: "ynet ספורט", date: ago(5), highlight: true },
  { title: "הנבחרת לקראת משחקי המוקדמות: הסגל המלא", link: "#", source: "ynet ספורט", date: ago(8) },
  { title: "יורוליג: סיכום המחזור השני", link: "#", source: "ynet ספורט", date: ago(12) },
];

export const israelNews = (): NewsItem[] => [
  { title: "הקבינט יתכנס הערב לדיון דחוף בעקבות ההתפתחויות בצפון", link: "#", source: "ynet ועוד 4", date: ago(0.5), highlight: true },
  { title: "בנק ישראל הותיר את הריבית ללא שינוי", link: "#", source: "N12 ועוד 3", date: ago(1), highlight: true },
  { title: "סערה ראשונה של העונה: גשם וסכנת שיטפונות בדרום", link: "#", source: "וואלה ועוד 2", date: ago(2) },
  { title: "הכנסת אישרה בקריאה ראשונה את חוק התקציב", link: "#", source: "ישראל היום ועוד 1", date: ago(2.5) },
  { title: "עומסים כבדים בנתב\"ג לקראת סוף החגים", link: "#", source: "ynet", date: ago(3) },
  { title: "מחקר ישראלי: פריצת דרך בזיהוי מוקדם של מחלות לב", link: "#", source: "מעריב", date: ago(4) },
  { title: "משרד התחבורה חושף: הקו הסגול ייפתח בשלבים", link: "#", source: "N12", date: ago(5) },
  { title: "המדד המחירים לצרכן עלה ב־0.3% בחודש האחרון", link: "#", source: "הארץ", date: ago(6) },
  { title: "חברת סייבר ישראלית נרכשה ב־1.2 מיליארד דולר", link: "#", source: "וואלה", date: ago(7) },
  { title: "תחזית: התחממות קלה בסוף השבוע", link: "#", source: "ישראל היום", date: ago(9) },
];

export const games = (): Game[] => [
  { id: "1", league: "ליגה אירופית", date: new Date(Date.now() + 26 * 3600e3).toISOString(), status: "Thu 19:45", state: "pre", highlight: true,
    home: { name: "Maccabi Tel-Aviv", short: "MTA", score: "" }, away: { name: "Lyon", short: "LYO", score: "" } },
  { id: "2", league: "NBA", date: ago(10), status: "Final", state: "post", highlight: true,
    home: { name: "Portland Trail Blazers", short: "POR", score: "118" }, away: { name: "Denver Nuggets", short: "DEN", score: "111" } },
  { id: "3", league: "ליגת האלופות", date: ago(30), status: "FT", state: "post", highlight: false,
    home: { name: "Real Madrid", short: "RMA", score: "2" }, away: { name: "Arsenal", short: "ARS", score: "2" } },
];

export const teslaPhoto = (): DailyPhoto => ({
  src: "/mock-photo.jpg", title: "Tesla Model 3", description: "", credit: "Wikimedia Commons", link: "https://commons.wikimedia.org",
});

export const photo = (): DailyPhoto => ({
  src: "/mock-photo.jpg",
  title: "Basilica Cistern, Istanbul",
  description: "View of the Basilica Cistern, Istanbul, Turkey.",
  credit: "Wikimedia Commons",
  link: "https://commons.wikimedia.org",
});
