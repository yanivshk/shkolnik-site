import { OWNER_NAME } from "@/lib/config";
import { getAINews, getGames, getMarkets, getSportsNews, getTeslaNews, getTeslaQuote } from "@/lib/data";
import { formatPct, hebrewDate } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { BottomNav, Clock, Greeting } from "@/components/client";
import { Empty, GameCard, NewsCarousel, NewsList, QuoteTile, Section } from "@/components/ui";

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

export default async function Home() {
  const [markets, tsla, teslaNews, games, sportsNews, aiNews] = await Promise.all([
    getMarkets(), getTeslaQuote(), getTeslaNews(), getGames(), getSportsNews(), getAINews(),
  ]);

  const pulse = [markets.indices[0], markets.indices[2], tsla].filter(Boolean) as Quote[];

  return (
    <>
      {/* Header — זכוכית צפה */}
      <header className="fixed inset-x-3 top-3 z-50 mx-auto max-w-5xl" style={{ top: "calc(10px + env(safe-area-inset-top, 0px))" }}>
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5">
          <a href="#top" className="flex items-center gap-2.5" aria-label="לראש העמוד">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-gold bg-gold/50 font-latin text-[13px] font-black text-navy">
              YS
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              שקולניק<span className="text-royal-2">.</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-muted sm:inline">{hebrewDate()}</span>
            <span className="h-4 w-px bg-line" />
            <Clock />
          </div>
        </div>
      </header>

      <main id="top" className="pb-36">
        {/* Hero — פסטל כחול-צהוב */}
        <section className="relative isolate flex min-h-[70svh] items-end overflow-hidden rounded-b-[32px] bg-gradient-to-br from-royal/70 via-deep to-gold-soft/80" aria-label="פתיחה">
          <div className="absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-gold/45 blur-3xl" />
          <div className="absolute -bottom-28 -right-20 -z-10 h-80 w-80 rounded-full bg-royal-2/40 blur-3xl" />

          <div className="mx-auto w-full max-w-5xl px-5 pb-10 pt-32">
            <p className="mb-3 flex items-center gap-2 text-[12px] font-medium text-navy/80">
              <span className="h-0.5 w-8 rounded-full bg-gold" />
              {hebrewDate()}
            </p>
            <h1 className="max-w-[14ch] text-[44px] font-black leading-[1.05] tracking-tight sm:text-6xl">
              <Greeting name={OWNER_NAME} />
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink/75">
              השווקים, טסלה, הספורט וה-AI שחשובים לך — מתעדכנים לבד, במקום אחד.
            </p>

            {pulse.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {pulse.map((q) => <PulseChip key={q.symbol} q={q} />)}
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#markets"
                className="press inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-5 py-3 text-[14px] font-bold text-navy shadow-[0_10px_24px_-12px_rgba(36,66,124,0.45)]"
              >
                לתמונת המצב
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 5v14M5 12l7 7 7-7" /></svg>
              </a>
              <a
                href="/photo"
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex items-center gap-2 rounded-full border border-royal-2/70 bg-white/70 px-5 py-3 text-[14px] font-bold text-navy backdrop-blur"
              >
                לתמונה היומית
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 16 5-5 4 4 3-3 6 6" /><circle cx="16" cy="9" r="1.5" /></svg>
              </a>
            </div>
          </div>
        </section>

        {/* שווקים */}
        <Section id="markets" eyebrow="Markets" title="שווקים">
          {markets.indices.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

        {/* טסלה */}
        <Section id="tesla" eyebrow="Tesla" title="טסלה">
          <div className="grid gap-3 md:grid-cols-[1fr_1.3fr]">
            <div className="grid grid-cols-2">{tsla ? <QuoteTile q={tsla} featured /> : <div className="col-span-2"><Empty /></div>}</div>
            <NewsList items={teslaNews.slice(0, 6)} />
          </div>
        </Section>

        {/* ספורט */}
        <Section id="sports" eyebrow="Sports" title="ספורט">
          {games.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {games.slice(0, 6).map((g) => <GameCard key={g.id} g={g} />)}
            </div>
          ) : <Empty text="אין משחקים במחזור הקרוב" />}
          <h3 className="mb-3 mt-7 text-[13px] font-semibold text-muted">כותרות</h3>
          <NewsList items={sportsNews} showSource={false} />
        </Section>

        {/* AI */}
        <Section id="ai" eyebrow="Artificial Intelligence" title="AI">
          <NewsCarousel items={aiNews.slice(0, 5)} />
          <div className="mt-4"><NewsList items={aiNews.slice(5, 12)} /></div>
        </Section>

        <footer className="mx-auto mt-16 max-w-5xl px-4">
          <div className="h-px bg-gradient-to-l from-transparent via-gold/30 to-transparent" />
          <div className="flex items-center justify-between py-6 text-[11px] text-faint">
            <span>© {new Date().getFullYear()} יניב שקולניק</span>
            <span dir="ltr" className="font-latin">shkolnik.co.il</span>
          </div>
        </footer>
      </main>

      <BottomNav />
    </>
  );
}
