import { CONTACT_EMAIL, MARKETS_TOP_ORDER, OWNER_FULL_NAME, STOCKS, WORLD_CLOCKS, quoteLink } from "@/lib/config";
import { getAINews, getFx, getIsraelNews, getMarkets, getSportsNews, getTeslaNews, getTeslaQuote } from "@/lib/data";
import { formatPct, hebrewDate } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { AutoRefresh, BottomNav, Clock, WorldClocks } from "@/components/client";
import { SiteMenu } from "@/components/site-menu";
import { WeatherBar } from "@/components/weather";
import { DEFAULT_PLACE, getWeather } from "@/lib/weather";
import { getBroadcasts, israelToday } from "@/lib/broadcasts";
import { getSurf } from "@/lib/surf";
import { SurfBar } from "@/components/surf";
import { BroadcastTable } from "@/components/broadcasts";
import { Empty, NewsCarousel, NewsList, QuoteTile, Section } from "@/components/ui";
import { BallsBackdrop, MaccabiBanner, MaccabiDivider, MaccabiLogo, RakMaccabi, RealBasketball, RealSoccerBall } from "@/components/maccabi";

export const revalidate = 300;

/** שמות מקוצרים לשורת המדדים שמתחת לברכה — כדי ש-4 מדדים ייכנסו בשורה אחת */
const PULSE_SHORT: Record<string, string> = { "TA35.TA": 'ת"א 35', "^GSPC": "S&P", "^IXIC": 'נאסד"ק', TSLA: "טסלה" };

function PulseChip({ q }: { q: Quote }) {
  const up = q.changePct >= 0;
  const href = quoteLink(q.symbol);
  const Tag = href ? "a" : "span";
  return (
    <Tag {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})} className="glass inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-1 py-1.5 text-[12px] tracking-tight text-ink">
      <span className="font-semibold">{PULSE_SHORT[q.symbol] ?? q.name}</span>
      <span dir="ltr" className={`tabular font-bold ${up ? "text-up" : "text-down"}`}>{formatPct(q.changePct)}</span>
    </Tag>
  );
}

/** שער מטבע מול השקל — באותו עיצוב של שבבי המדדים */
function FxChip({ q }: { q: Quote }) {
  const up = q.changePct >= 0;
  return (
    <a href={`https://www.google.com/search?hl=he&q=${encodeURIComponent(`${q.name} ILS`)}`} target="_blank" rel="noopener noreferrer" className="glass inline-flex min-w-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full px-1 py-1.5 text-[11.5px] tracking-tight text-ink" aria-label={`${q.name} ${q.price.toFixed(3)} שקל`}>
      <span className="font-semibold">{q.name}</span>
      <span dir="ltr" className="tabular font-bold text-ink">{q.price.toFixed(3)}</span>
      <span dir="ltr" className={`tabular font-bold ${up ? "text-up" : "text-down"}`}>{formatPct(q.changePct)}</span>
    </a>
  );
}

function PhotoLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="glass press flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[13px] font-semibold text-royal">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 16 5-5 4 4 3-3 6 6" /><circle cx="16" cy="9" r="1.5" /></svg>
      {label}
    </a>
  );
}

export default async function Home() {
  const today = israelToday();
  const [markets, tsla, teslaNews, sportsNews, aiNews, news, weather, broadcasts, fx, surf] = await Promise.all([
    getMarkets(), getTeslaQuote(), getTeslaNews(), getSportsNews(), getAINews(), getIsraelNews(), getWeather(DEFAULT_PLACE.lat, DEFAULT_PLACE.lon, DEFAULT_PLACE.name),
    getBroadcasts(today), getFx(), getSurf(),
  ]);

  const idx = (s: string) => markets.indices.find((q) => q.symbol === s);
  const pulse = [idx("TA35.TA"), idx("^GSPC"), idx("^IXIC"), tsla].filter(Boolean) as Quote[];

  // סדר המניות: DSIT, ת"א-35, ת"א-125, נאסד"ק, S&P 500, ת"א-90 — ואז כל השאר
  const allQuotes = [...markets.indices, ...markets.stocks];
  const topQuotes = MARKETS_TOP_ORDER.map((s) => allQuotes.find((q) => q.symbol === s)).filter(Boolean) as Quote[];
  const restQuotes = allQuotes.filter((q) => !MARKETS_TOP_ORDER.includes(q.symbol));
  const isStock = (s: string) => STOCKS.some((x) => x.symbol === s);

  return (
    <>
      <BallsBackdrop />
      {/* Header — זכוכית צפה */}
      <header className="fixed inset-x-3 top-3 z-50 mx-auto max-w-5xl" style={{ top: "calc(10px + env(safe-area-inset-top, 0px))" }}>
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5">
          <a href="#top" className="flex items-center gap-2.5" aria-label="לראש העמוד">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] border-2 border-gold bg-royal font-latin text-[13px] font-black text-gold">
              YS
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              שקולניק<span className="text-gold-deep">.</span>
            </span>
            <MaccabiLogo className="h-7 w-7" />
            <RakMaccabi variant="blue" className="hidden min-[400px]:inline-flex" />
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-muted sm:inline">{hebrewDate()}</span>
            <span className="h-4 w-px bg-line" />
            <Clock />
            <SiteMenu />
          </div>
        </div>
      </header>

      <main id="top" style={{ paddingBottom: "calc(185px + var(--safe-bottom))" }}>
        {/* Hero — כחול מכבי עם פסים צהובים. התוכן מתחיל מיד מתחת לכותרת, בלי שטח ריק */}
        <section className="relative isolate overflow-hidden rounded-b-[28px] bg-gradient-to-br from-navy via-royal to-royal-2 text-white" aria-label="פתיחה">
          <div className="maccabi-stripes absolute inset-0 -z-10" />
          <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />

          <div className="mx-auto w-full max-w-5xl px-4 pb-4" style={{ paddingTop: "calc(80px + env(safe-area-inset-top, 0px))" }}>
            <p className="mb-2 flex items-center gap-2 text-[12px] font-medium text-white/80">
              <span className="h-0.5 w-8 rounded-full bg-gold" />
              {hebrewDate()}
            </p>
            <WorldClocks clocks={WORLD_CLOCKS} />
            <WeatherBar initial={weather} />
            {/* כותרת ראשית מוסתרת ויזואלית — נשמרת לצורכי SEO ונגישות */}
            <h1 className="sr-only">{OWNER_FULL_NAME}</h1>

            {pulse.length > 0 && (
              <div className="mt-1 grid max-w-md grid-cols-4 gap-1.5">
                {pulse.map((q) => <PulseChip key={q.symbol} q={q} />)}
              </div>
            )}
            {fx.length > 0 && (
              <div className="mt-1.5 grid max-w-md grid-cols-3 gap-1.5">
                {fx.map((q) => <FxChip key={q.symbol} q={q} />)}
              </div>
            )}
            <SurfBar initial={surf} />
          </div>
        </section>

        {/* שווקים */}
        <Section id="markets" eyebrow="Markets" title="מניות ומדדים" tight>
          {topQuotes.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {topQuotes.map((q) => <QuoteTile key={q.symbol} q={q} showCurrency={isStock(q.symbol)} />)}
            </div>
          ) : <Empty />}
          <h3 className="mb-3 mt-7 text-[17px] font-semibold text-muted">במעקב</h3>
          {restQuotes.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {restQuotes.map((q) => <QuoteTile key={q.symbol} q={q} showCurrency={isStock(q.symbol)} />)}
            </div>
          ) : <Empty />}
        </Section>

        <MaccabiDivider />

        {/* ספורט */}
        <Section id="sports" eyebrow="Sports · רק מכבי" title="ספורט" action={<span className="flex items-center gap-2"><RealSoccerBall id="sp-s" className="h-7 w-7" /><MaccabiLogo className="h-8 w-8" /><RealBasketball id="sp-b" className="h-7 w-7" /></span>}>
          <BroadcastTable initial={broadcasts} today={today} />
          <h3 className="mb-3 mt-7 text-[17px] font-semibold text-muted">כותרות</h3>
          <NewsList items={sportsNews} showSource={false} />
        </Section>

        {/* חדשות — הידיעות החמות מאתרי החדשות המובילים בישראל */}
        <Section id="news" eyebrow="News · ישראל" title="חדשות">
          <NewsList items={news} />
        </Section>

        {/* טסלה */}
        <Section id="tesla" eyebrow="Tesla" title="טסלה">
          <div className="grid gap-3 md:grid-cols-[1fr_1.3fr]">
            <div className="grid grid-cols-2">{tsla ? <QuoteTile q={tsla} featured /> : <div className="col-span-2"><Empty /></div>}</div>
            <NewsList items={teslaNews.slice(0, 6)} />
          </div>
        </Section>

        <MaccabiDivider flip />

        {/* AI */}
        <Section id="ai" eyebrow="Artificial Intelligence" title="AI">
          <NewsCarousel items={aiNews.slice(0, 5)} />
          <div className="mt-4"><NewsList items={aiNews.slice(5, 12)} /></div>
        </Section>

        {/* תמונות יומיות — מקום משני בעמוד */}
        <section className="mx-auto w-full max-w-5xl px-4 pt-10" aria-label="תמונות יומיות">
          <div className="grid grid-cols-2 gap-3">
            <PhotoLink href="/photo" label="תמונה יומית" />
            <PhotoLink href="/tesla-photo" label="טסלה" />
          </div>
        </section>

        {/* על יניב שקולניק */}
        <section id="about" className="reveal mx-auto w-full max-w-5xl px-4 pt-12" aria-labelledby="about-title">
          <a href="/yaniv-shkolnik" className="glass neon-edge press flex items-center justify-between gap-4 rounded-[var(--radius-card)] p-5">
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-royal">About</span>
              <h2 id="about-title" className="mt-1 text-[22px] font-extrabold">{OWNER_FULL_NAME}</h2>
              <span className="mt-1 block text-[14px] text-muted">המדען שחוקר את החסה בשטח — לכתבה המלאה</span>
            </span>
            <MaccabiLogo className="h-12 w-12 shrink-0" />
          </a>
        </section>

        <footer className="mx-auto mt-16 max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-l from-royal to-navy px-5 py-6 text-center">
            <div className="maccabi-stripes absolute inset-0" />
            <p className="relative flex items-center justify-center gap-3 text-[26px] font-black text-gold">
              <RealBasketball id="ft-b" className="h-7 w-7" />
              <MaccabiLogo className="h-12 w-12" />
              רק מכבי
              <RealSoccerBall id="ft-s" className="h-7 w-7" />
            </p>
            <p className="relative mt-1 text-[12px] font-semibold text-white/70">צהוב בלב, כחול בדם</p>
          </div>
          <div className="flex items-center justify-between py-6 text-[11px] text-faint">
            <span className="flex items-center gap-2"><MaccabiLogo className="h-5 w-5" />© {new Date().getFullYear()} <a href="/yaniv-shkolnik" className="hover:underline">{OWNER_FULL_NAME}</a></span>
            <RakMaccabi variant="gold" />
            <span dir="ltr" className="font-latin">shkolnik.co.il</span>
          </div>
          {/* שורות סמויות — בצבע הרקע, לא נראות לגולשים */}
          <div className="pb-4 text-center text-[13px] leading-6 text-transparent selection:bg-gold selection:text-navy" aria-hidden>
            <p>ג552266300ג</p>
            <p>ת50844047ת</p>
            <p>נ527771600נ</p>
            <p>ס503647428ס</p>
          </div>
          <div className="flex justify-center pb-6">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="press inline-flex items-center gap-2 rounded-full border border-gold bg-royal px-6 py-3 text-[14px] font-bold text-gold shadow-[0_10px_24px_-12px_rgba(19,48,110,0.6)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              צור קשר
            </a>
          </div>
        </footer>
      </main>

      {/* תחתית קבועה: הבאנר רץ, ומתחתיו כפתורי הניווט */}
      <div className="fixed inset-x-3 z-50 mx-auto flex max-w-md flex-col gap-2" style={{ bottom: "calc(10px + var(--safe-bottom))" }}>
        <MaccabiBanner docked />
        <AutoRefresh />
        <BottomNav />
      </div>
    </>
  );
}
