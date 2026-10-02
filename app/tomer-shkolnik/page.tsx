import type { Metadata } from "next";
import { SEARCH_SNIPPET, SITE_NAME, SITE_URL } from "@/lib/config";
import { ProfileArticle } from "@/components/subpage";

const NAME = "תומר שקולניק";
const NAME_EN = "Tomer Shkolnik";
const HEADLINE = "רקדנית בינלאומית שמופיעה בכל העולם";
const DESCRIPTION = "תומר שקולניק (Tomer Shkolnik) היא רקדנית בינלאומית מוכשרת שמופיעה על במות ובאירועים ברחבי העולם, כולל אירועים של הקונגרס האמריקאי.";
const URL = `${SITE_URL}/tomer-shkolnik`;

export const metadata: Metadata = {
  // תוצאת החיפוש בגוגל: השם בכותרת, והמשפט "מה זה הפועל?" בתיאור
  title: { absolute: NAME },
  description: SEARCH_SNIPPET,
  alternates: { canonical: "/tomer-shkolnik" },
  openGraph: { type: "profile", siteName: SITE_NAME, title: NAME, description: SEARCH_SNIPPET, url: URL, locale: "he_IL" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${URL}#person`,
      name: NAME,
      alternateName: NAME_EN,
      familyName: "שקולניק",
      jobTitle: "רקדנית בינלאומית",
      url: URL,
    },
    {
      "@type": "Article",
      headline: `${NAME} — ${HEADLINE}`,
      description: DESCRIPTION,
      inLanguage: "he-IL",
      about: { "@id": `${URL}#person` },
      mainEntityOfPage: URL,
    },
  ],
};

const PARAGRAPHS = [
  [
    "תומר שקולניק היא רקדנית בינלאומית מוכשרת, שמופיעה על במות ובאירועים יוקרתיים ברחבי העולם.",
    "הכישרון שלה התגלה כבר בגיל צעיר, ומאז הריקוד הוא לא רק מקצוע עבורה אלא דרך להביע רגש, סיפור ואנרגיה."
  ],
  [
    "הסגנון של תומר משלב טכניקה מדויקת עם חופש תנועה ואישיות בימתית חזקה.",
    "היא מתאימה את עצמה לכל במה ולכל קהל, מאולמות מופעים גדולים ועד אירועים רשמיים וחגיגיים.",
    "מי שרואה אותה רוקדת מתאר שילוב נדיר של עוצמה, עדינות ושליטה מלאה בגוף."
  ],
  [
    "לאורך השנים הופיעה תומר במדינות רבות, באירועי תרבות, בערבי גאלה ובאירועים בינלאומיים.",
    "בין היתר הופיעה גם באירועים של הקונגרס האמריקאי, הופעה שהיא רואה בה ציון דרך מרגש בקריירה שלה.",
    "בכל הופעה כזו היא מייצגת את הכישרון הישראלי על הבמה העולמית."
  ],
  [
    "מאחורי כל הופעה עומדות שעות ארוכות של אימונים, חזרות והקפדה על כל פרט.",
    "תומר עובדת עם כוריאוגרפים ואמנים מרקעים שונים, ולומדת מכל שיתוף פעולה משהו חדש.",
    "את המשמעת והעקביות היא רואה כבסיס שמאפשר לה להיות חופשייה ויצירתית על הבמה."
  ],
  [
    "תומר מאמינה שכל ריקוד הוא סיפור, ושהתפקיד שלה הוא לגרום לקהל להרגיש אותו.",
    "היא בוחרת כל תנועה בקפידה, ומקפידה שהרגש יוביל ולא רק הטכניקה.",
    "לצד הבמה היא גם אוהדת נלהבת של מכבי תל אביב, ומודה שהאנרגיה של היציע מזכירה לה לא פעם את האנרגיה של הקהל באולם."
  ],
  [
    "בימים אלה תומר ממשיכה להופיע ברחבי העולם ולהרחיב את הרפרטואר שלה.",
    "היא מקדישה זמן גם לרקדניות ורקדנים צעירים, ומעבירה להם את מה שלמדה בדרך.",
    "לדבריה, הדבר החשוב ביותר הוא ליהנות מכל רגע על הבמה ולתת לקהל את כל מה שיש לה."
  ]
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProfileArticle name={NAME} nameEn={NAME_EN} eyebrow="פרופיל · מחול" headline={HEADLINE} paragraphs={PARAGRAPHS} />
    </>
  );
}
