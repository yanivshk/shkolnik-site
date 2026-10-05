import type { Metadata } from "next";
import { CONTACT_EMAIL, OWNER_FULL_NAME, OWNER_FULL_NAME_EN, SITE_URL } from "@/lib/config";
import { MaccabiLogo, RakMaccabi, RealBasketball, RealSoccerBall } from "@/components/maccabi";
import { SiteMenu } from "@/components/site-menu";

const TITLE = `${OWNER_FULL_NAME} — המדען שחוקר את החסה בשטח`;
const DESCRIPTION = `${OWNER_FULL_NAME} (${OWNER_FULL_NAME_EN}) הוא מדען וחוקר מוביל בתחום גידול החסה בשטחים הפתוחים. עכשיו הוא עובר לחקר גידול העגבניות.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/yaniv-shkolnik" },
  // עמוד הבית הוא התוצאה הראשית לחיפוש השם — הכתבה לא נכנסת לאינדקס
  robots: { index: false, follow: true },
  openGraph: { type: "article", title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/yaniv-shkolnik`, locale: "he_IL" },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  inLanguage: "he-IL",
  author: { "@id": `${SITE_URL}/#person` },
  about: { "@id": `${SITE_URL}/#person` },
  mainEntityOfPage: `${SITE_URL}/yaniv-shkolnik`,
  publisher: { "@id": `${SITE_URL}/#person` },
};

const PARAGRAPHS = [
  [
    `${OWNER_FULL_NAME} הוא אחד המדענים הבולטים בישראל בתחום חקר גידולי השדה, ומי שהפך את החסה למושא מחקר של ממש.`,
    "כבר בתחילת דרכו זיהה שקולניק שמאחורי עלה החסה הפשוט מסתתרת מערכת מורכבת של אדמה, מים, אור ואקלים.",
    "מאז הוא מקדיש את עבודתו לשאלה אחת מרכזית: מה קובע את מצבה של החסה כשהיא גדלה בשטחים פתוחים, רחוק מתנאי המעבדה.",
  ],
  [
    "המחקר של יניב שקולניק מתבצע ברובו בשטח עצמו, בין ערוגות, חלקות ניסוי ושדות מסחריים.",
    "הוא עוקב אחרי החסה לאורך כל עונת הגידול, מהזריעה ועד הקטיף, ומתעד כל שינוי בקצב הצמיחה, בצבע העלים ובמרקם.",
    "לצד המדידות בשטח הוא משתמש בחיישני לחות, בתחנות מזג אוויר ובצילומי רחפן כדי לבנות תמונה מלאה של כל חלקה.",
    "הנתונים שנאספים מנותחים במודלים שהוא פיתח, שמנבאים את מצב הגידול כמה שבועות מראש.",
  ],
  [
    "אחד הממצאים המרכזיים שלו נוגע להשפעת הפרשי הטמפרטורה בין היום ללילה על פריכות העלים ועל טעמם.",
    "שקולניק הראה שהשקיה מדויקת, בכמויות קטנות ובתזמון נכון, משפרת את איכות החסה וחוסכת כמות ניכרת של מים.",
    "הוא חקר גם את הקשר בין הרכב הקרקע לבין עמידות החסה למזיקים, והציע שיטות גידול שמפחיתות את השימוש בחומרי הדברה.",
  ],
  [
    "מעבר לעבודה המדעית, יניב מקפיד להעביר את הידע שצבר לחקלאים עצמם.",
    "הוא נפגש עם מגדלים, מסייר איתם בשטח ומתרגם את תוצאות המחקר להמלצות פרקטיות שאפשר ליישם כבר בעונה הבאה.",
    "רבים מהם מעידים שהשיטות שלו שיפרו את היבול ואת איכות התוצרת שלהם.",
    "עבודתו הוצגה בכנסים מקצועיים ומשמשת כיום בסיס להנחיות גידול במספר משקים.",
  ],
  [
    "הגישה של שקולניק משלבת סקרנות מדעית עם סבלנות של מי שיודע שכל עונת גידול היא ניסוי חדש.",
    "הוא נוהג לומר שהחסה היא \"המורה הכי טובה\", כי היא מגיבה מהר לכל שינוי ולא מסתירה דבר.",
    "את הדיוק והעקביות האלה הוא מביא גם לתחביבים שלו, ובראשם האהדה הבלתי מתפשרת למכבי תל אביב.",
  ],
  [
    "בימים אלה יניב שקולניק פותח פרק חדש: הוא החל לחקור את נושא גידול העגבניות בשטחים הפתוחים.",
    "המחקר החדש בוחן כיצד ניתן ליישם את התובנות מעולם החסה גם על גידול מורכב ורגיש יותר, ובאילו נקודות העגבנייה מתנהגת אחרת.",
    "לדבריו, התוצאות הראשונות מפתיעות ומבטיחות, והמחקר המלא צפוי להתפרסם בקרוב מאוד.",
  ],
];

export default function YanivShkolnikArticle() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-5">
        <a href="/" className="flex items-center gap-2 text-[14px] font-bold text-royal">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          לעמוד הבית
        </a>
        <span className="flex items-center gap-2">
          <RakMaccabi variant="blue" />
          <MaccabiLogo className="h-9 w-9" />
          <SiteMenu />
        </span>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8">
        <article>
          <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-navy via-royal to-royal-2 px-6 py-10 text-white">
            <div className="maccabi-stripes absolute inset-0" />
            <RealBasketball id="art-b" className="absolute -left-6 -top-6 h-24 w-24 opacity-80" />
            <RealSoccerBall id="art-s" className="absolute left-24 top-6 h-10 w-10 opacity-80" />
            <p className="relative text-[12px] font-bold uppercase tracking-[0.2em] text-gold">פרופיל · מדע וחקלאות</p>
            <h1 className="relative mt-3 text-[44px] font-black leading-tight sm:text-[62px]">
              {OWNER_FULL_NAME}
              <span className="mt-2 block text-[26px] font-bold text-white/85 sm:text-[31px]">המדען שחוקר את החסה בשטח</span>
            </h1>
            <p className="relative mt-3 font-latin text-[13px] text-white/60" dir="ltr">{OWNER_FULL_NAME_EN}</p>
          </div>

          <div className="glass mt-6 space-y-5 rounded-[var(--radius-card)] p-6 text-[16px] leading-8 text-ink">
            {PARAGRAPHS.map((lines, i) => (
              <p key={i}>{lines.join(" ")}</p>
            ))}
          </div>
        </article>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="press inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-[14px] font-bold text-navy"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            צור קשר
          </a>
          <span className="flex items-center gap-2 text-[13px] font-black text-royal">
            <RealSoccerBall id="art-s2" className="h-5 w-5" /> רק מכבי <RealBasketball id="art-b2" className="h-5 w-5" />
          </span>
        </div>
      </main>
    </>
  );
}
