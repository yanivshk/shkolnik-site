import { CONTACT_EMAIL, OWNER_FULL_NAME, OWNER_NAME, WORLD_CLOCKS } from "@/lib/config";
import { getAINews, getGames, getMarkets, getSportsNews, getTeslaNews, getTeslaQuote } from "@/lib/data";
import { formatPct, hebrewDate } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { BottomNav, Clock, Greeting, WorldClocks } from "@/components/client";
import { WeatherBar } from "@/components/weather";
import { DEFAULT_PLACE, getWeather } from "@/lib/weather";
import { Empty, GameCard, NewsCarousel, NewsList, QuoteTile, Section } from "@/components/ui";
import { MaccabiBanner, MaccabiDivider, MaccabiLogo, RakMaccabi, RealBasketball, RealSoccerBall } from "@/components/maccabi";

export const revalidate = 300;

function PulseChip({ q }: { q: Quote }) {
  const up = q.changePct >= 0;
  return (
    <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px]">
      <span className="font-semibold">{q.name}</span>
      <span dir="ltr" className={`tabular font-bold ${up ? "text-up" : "text-down"}`}>{formatPct(q.changePct)}</span>
    </span>
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
  const [markets, tsla, teslaNews, games, sportsNews, aiNews, weather] = await Promise.all([
    getMarkets(), getTeslaQuote(), getTeslaNews(), getGames(), getSportsNews(), getAINews(), getWeather(DEFAULT_PLACE.lat, DEFAULT_PLACE.lon, DEFAULT_PLACE.name),
  ]);

  const pulse = [markets.indices.find((q) => q.symbol === "TA35.TA"), markets.indices.find((q) => q.symbol === "^GSPC"), tsla].filter(Boolean) as Quote[];

  return (
    <>
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
            <h1 className="text-[32px] font-black leading-[1.05] tracking-tight sm:text-6xl">
              <Greeting name={OWNER_NAME} />
            </h1>

            {pulse.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pulse.map((q) => <PulseChip key={q.symbol} q={q} />)}
              </div>
            )}
          </div>
        </section>

        {/* שווקים */}
        <Section id="markets" eyebrow="Markets" title="שווקים" tight>
          {markets.indices.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {markets.indices.map((q) => <QuoteTile key={q.symbol} q={q} showCurrency={false} />)}
            </div>
          ) : <Empty />}
          <h3 className="mb-3 mt-7 text-[13px] font-semibold text-muted">במעקב</h3>
          {markets.stocks.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {markets.stocks.map((q) => <QuoteTile key={q.symbol} q={q} />)}
            </div>
          ) : <Empty />}
        </Section>

        <MaccabiDivider />

        {/* טסלה */}
        <Section id="tesla" eyebrow="Tesla" title="טסלה">
          <div className="grid gap-3 md:grid-cols-[1fr_1.3fr]">
            <div className="grid grid-cols-2">{tsla ? <QuoteTile q={tsla} featured /> : <div className="col-span-2"><Empty /></div>}</div>
            <NewsList items={teslaNews.slice(0, 6)} />
          </div>
        </Section>

        {/* ספורט */}
        <Section id="sports" eyebrow="Sports · רק מכבי" title="ספורט" action={<span className="flex items-center gap-2"><RealSoccerBall id="sp-s" className="h-7 w-7" /><MaccabiLogo className="h-8 w-8" /><RealBasketball id="sp-b" className="h-7 w-7" /></span>}>
          {games.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {games.slice(0, 6).map((g) => <GameCard key={g.id} g={g} />)}
            </div>
          ) : <Empty text="אין משחקים במחזור הקרוב" />}
          <h3 className="mb-3 mt-7 text-[13px] font-semibold text-muted">כותרות</h3>
          <NewsList items={sportsNews} showSource={false} />
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
        <BottomNav />
      </div>
    </>
  );
}
