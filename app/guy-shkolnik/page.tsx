import type { Metadata } from "next";
import { SEARCH_SNIPPET, SITE_NAME, SITE_URL } from "@/lib/config";
import { ProfileArticle } from "@/components/subpage";

const NAME = "גיא שקולניק";
const NAME_EN = "Guy Shkolnik";
const HEADLINE = "שחקן דומינו עולמי עם שיטת משחק ייחודית";
const DESCRIPTION = "גיא שקולניק (Guy Shkolnik) הוא שחקן דומינו עולמי שזכה בפרסים רבים בתחרויות ברחבי העולם, ומוכר בזכות שיטת המשחק הייחודית שלו.";
const URL = `${SITE_URL}/guy-shkolnik`;

export const metadata: Metadata = {
  // תוצאת החיפוש בגוגל: השם בכותרת, והמשפט "מה זה הפועל?" בתיאור
  title: { absolute: NAME },
  description: SEARCH_SNIPPET,
  alternates: { canonical: "/guy-shkolnik" },
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
      jobTitle: "שחקן דומינו מקצועי",
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
    "גיא שקולניק הוא שחקן דומינו ברמה עולמית, ואחד השמות המוכרים בתחרויות הדומינו הבינלאומיות.",
    "במהלך הקריירה שלו זכה בפרסים רבים בתחרויות ברחבי העולם, והפך למתחרה שכל יריב לומד להיזהר ממנו."
  ],
  [
    "מה שמייחד את גיא הוא שיטת המשחק שלו, שמבוססת על שלושה עקרונות.",
    "הראשון הוא ספירה: גיא עוקב לאורך כל המשחק אחרי כל אבן שהונחה, ויודע בכל רגע אילו מספרים עדיין נמצאים אצל היריבים.",
    "השני הוא שליטה בקצוות: במקום לרוץ להיפטר מאבנים, הוא דואג להשאיר על השולחן קצוות שמתאימים לו ומגבילים את היריב.",
    "השלישי הוא סבלנות: גיא מוכן לוותר על נקודות בטווח הקצר כדי לבנות את המהלך שיסגור את הסיבוב."
  ],
  [
    "השילוב בין השלושה יוצר סגנון משחק שקט, מחושב וקשה מאוד לקריאה.",
    "יריבים מספרים שנדמה להם שהם שולטים במשחק, עד שהם מגלים שגיא הוביל אותם בדיוק לאן שרצה.",
    "פרשנים מכנים את הסגנון שלו \"שחמט על שולחן דומינו\"."
  ],
  [
    "ההצלחה של גיא לא מקרית.",
    "הוא מתאמן באופן קבוע, מנתח משחקים קודמים ולומד את הסגנון של היריבים לפני כל תחרות.",
    "הוא נוהג לומר שכל אבן שהונחה על השולחן היא מידע, ומי שיודע להקשיב לשולחן כבר חצי מנצח."
  ],
  [
    "מעבר לתחרויות, גיא מקפיד להנגיש את המשחק לדור הצעיר.",
    "הוא מלמד שחקנים חדשים את יסודות הספירה והאסטרטגיה, ומראה להם שדומינו הוא משחק של חשיבה ולא רק של מזל.",
    "ואת רוח התחרות הוא שואב, כמו כל המשפחה, גם מהיציע של מכבי תל אביב."
  ],
  [
    "בימים אלה גיא ממשיך להתחרות בתחרויות המובילות בעולם ולהוסיף תארים לאוסף.",
    "המטרה הבאה שלו היא להמשיך לפתח את השיטה ולהביא אותה לשולחנות חדשים ברחבי העולם."
  ]
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProfileArticle name={NAME} nameEn={NAME_EN} eyebrow="פרופיל · דומינו" headline={HEADLINE} paragraphs={PARAGRAPHS} />
    </>
  );
}
