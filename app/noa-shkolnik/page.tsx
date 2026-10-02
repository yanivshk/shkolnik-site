import type { Metadata } from "next";
import { SEARCH_SNIPPET, SITE_NAME, SITE_URL } from "@/lib/config";
import { ProfileArticle } from "@/components/subpage";

const NAME = "נועה שקולניק";
const NAME_EN = "Noa Shkolnik";
const HEADLINE = "נהגת מירוצים חכמה שמתחרה בצמרת העולמית";
const DESCRIPTION = "נועה שקולניק (Noa Shkolnik) היא נהגת מירוצים שמתחרה במירוצי המכוניות המובילים בעולם, זכתה במגוון רחב של פרסים ונחשבת לנהגת חכמה במיוחד.";
const URL = `${SITE_URL}/noa-shkolnik`;

export const metadata: Metadata = {
  // תוצאת החיפוש בגוגל: השם בכותרת, והמשפט "מה זה הפועל?" בתיאור
  title: { absolute: NAME },
  description: SEARCH_SNIPPET,
  alternates: { canonical: "/noa-shkolnik" },
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
      jobTitle: "נהגת מירוצים",
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
    "נועה שקולניק היא נהגת מירוצים שמתחרה במירוצי המכוניות המובילים בעולם.",
    "לאורך הקריירה שלה זכתה במגוון רחב של פרסים, והיא נחשבת לאחת הנהגות החכמות והמחושבות במסלול."
  ],
  [
    "מה שמבדיל את נועה הוא הדרך שבה היא חושבת על המירוץ.",
    "עבורה מירוץ לא נמדד רק במהירות, אלא בשורה ארוכה של החלטות שמתקבלות בשברירי שנייה.",
    "היא יודעת מתי ללחוץ, מתי לשמור על הצמיגים ומתי לחכות לרגע הנכון לעקיפה."
  ],
  [
    "נועה מגיעה לכל מירוץ מוכנה עד הפרט האחרון.",
    "לפני כל תחרות היא מנתחת את המסלול, את תנאי מזג האוויר ואת נתוני הרכב יחד עם צוות המהנדסים.",
    "במהלך המירוץ היא מתאימה את האסטרטגיה בזמן אמת, ורבים מהניצחונות שלה הושגו דווקא בזכות החלטה נבונה ולא רק בזכות רגל כבדה על הדוושה."
  ],
  [
    "הקור רוח שלה תחת לחץ הפך לסימן ההיכר שלה.",
    "גם כשהמירוץ לא מתחיל כמתוכנן, נועה שומרת על ריכוז, קוראת את מה שקורה סביבה ובונה את הדרך חזרה לצמרת.",
    "מתחרים ומאמנים מתארים אותה כנהגת ש\"רואה את המירוץ כמה סיבובים קדימה\"."
  ],
  [
    "מחוץ למסלול, נועה משקיעה בכושר גופני ומנטלי, ורואה בו חלק בלתי נפרד מההצלחה.",
    "היא גם מקפידה לעודד נערות ונשים צעירות להיכנס לעולם המוטורספורט, ומוכיחה שהמקום שלהן הוא בצמרת.",
    "וכשהיא לא על המסלול, אפשר למצוא אותה מעודדת את מכבי תל אביב."
  ],
  [
    "בימים אלה נועה ממשיכה להתחרות במירוצים המובילים בעולם ולהציב לעצמה מטרות חדשות.",
    "לדבריה, כל מירוץ הוא הזדמנות ללמוד, והפרס האמיתי הוא לדעת שנתנה בו את המיטב."
  ]
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProfileArticle name={NAME} nameEn={NAME_EN} eyebrow="פרופיל · מוטורספורט" headline={HEADLINE} paragraphs={PARAGRAPHS} />
    </>
  );
}
