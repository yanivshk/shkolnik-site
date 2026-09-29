import type { Metadata } from "next";
import { SubPage, ToolGroups } from "@/components/subpage";

export const metadata: Metadata = {
  title: "כלי AI חינמיים מומלצים",
  description: "מבחר כלי הבינה המלאכותית החינמיים הטובים ביותר, מחולקים לקטגוריות: מודלי שפה, תמונות וגרפיקה, וידאו וניתוח נתונים.",
  alternates: { canonical: "/ai-tools" },
};

const GROUPS = [
  {
    title: "מודלי שפה וצ'אט",
    tools: [
      { name: "ChatGPT", url: "https://chatgpt.com", note: "העוזר הפופולרי של OpenAI. כתיבה, שאלות, סיכומים וקוד." },
      { name: "Claude", url: "https://claude.ai", note: "העוזר של Anthropic. חזק במיוחד בכתיבה, ניתוח מסמכים ארוכים וקוד." },
      { name: "Gemini", url: "https://gemini.google.com", note: "העוזר של Google, משולב בחיפוש, ב-Gmail וב-Drive." },
      { name: "Microsoft Copilot", url: "https://copilot.microsoft.com", note: "העוזר של מיקרוסופט, עם גישה לחיפוש ברשת." },
      { name: "Perplexity", url: "https://www.perplexity.ai", note: "מנוע חיפוש מבוסס AI עם הפניה למקורות." },
      { name: "DeepSeek", url: "https://chat.deepseek.com", note: "מודל חזק בהסקה ובמתמטיקה." },
      { name: "Le Chat (Mistral)", url: "https://chat.mistral.ai", note: "העוזר של Mistral האירופית. מהיר ופשוט." },
    ],
  },
  {
    title: "תמונות וגרפיקה",
    tools: [
      { name: "Gemini (יצירת תמונות)", url: "https://gemini.google.com", note: "יצירה ועריכה של תמונות מתיאור טקסט." },
      { name: "ChatGPT (יצירת תמונות)", url: "https://chatgpt.com", note: "יצירת תמונות ואיורים בתוך הצ'אט, עם מכסה חינמית." },
      { name: "Microsoft Designer", url: "https://designer.microsoft.com", note: "יצירת תמונות, פוסטים והזמנות." },
      { name: "Canva", url: "https://www.canva.com", note: "עיצוב גרפי עם כלי AI מובנים ליצירת תמונות וטקסט." },
      { name: "Ideogram", url: "https://ideogram.ai", note: "מצטיין בתמונות שמשלבות טקסט, כמו לוגואים ופוסטרים." },
      { name: "Leonardo.ai", url: "https://leonardo.ai", note: "יצירת תמונות באיכות גבוהה עם קרדיטים יומיים." },
      { name: "Adobe Firefly", url: "https://firefly.adobe.com", note: "יצירת תמונות ועריכה של Adobe, עם קרדיטים חינמיים." },
    ],
  },
  {
    title: "וידאו",
    tools: [
      { name: "CapCut", url: "https://www.capcut.com", note: "עריכת וידאו עם כתוביות אוטומטיות ואפקטים מבוססי AI." },
      { name: "Clipchamp", url: "https://clipchamp.com", note: "עורך הווידאו של מיקרוסופט, עם קריינות וכתוביות AI." },
      { name: "Kling AI", url: "https://kling.ai", note: "יצירת סרטונים מטקסט או מתמונה, עם קרדיטים יומיים." },
      { name: "Hailuo AI", url: "https://hailuoai.video", note: "יצירת קליפים קצרים מטקסט ומתמונות." },
      { name: "Luma AI", url: "https://lumalabs.ai", note: "סרטונים קולנועיים מטקסט ומתמונות." },
      { name: "Runway", url: "https://runwayml.com", note: "יצירה ועריכה של וידאו עם קרדיטים חינמיים להתחלה." },
    ],
  },
  {
    title: "ניתוח נתונים ומחקר",
    tools: [
      { name: "NotebookLM", url: "https://notebooklm.google.com", note: "מעלים מסמכים ומקבלים סיכומים, תשובות עם מקורות ופודקאסט." },
      { name: "ChatGPT (ניתוח נתונים)", url: "https://chatgpt.com", note: "העלאת קובצי Excel ו-CSV לניתוח, גרפים וחישובים." },
      { name: "Claude (ניתוח קבצים)", url: "https://claude.ai", note: "ניתוח קבצים, טבלאות ומסמכים ארוכים." },
      { name: "Julius AI", url: "https://julius.ai", note: "ניתוח נתונים וגרפים בשפה טבעית." },
      { name: "Google Colab", url: "https://colab.research.google.com", note: "מחברות Python בענן עם Gemini מובנה לכתיבת קוד וניתוח." },
      { name: "Looker Studio", url: "https://lookerstudio.google.com", note: "בניית דשבורדים ודוחות מנתונים, בחינם." },
    ],
  },
];

export default function Page() {
  return (
    <SubPage title="כלי AI" subtitle="הכלים החינמיים הטובים ביותר, לפי קטגוריות" eyebrow="AI Tools">
      <ToolGroups groups={GROUPS} />
      <p className="mt-8 text-[13px] leading-6 text-faint">
        רוב הכלים מציעים גרסה חינמית עם מגבלות שימוש. הקישורים מובילים לאתרים הרשמיים. מומלץ לא להעלות לכלים ציבוריים מידע רגיש או מסווג.
      </p>
    </SubPage>
  );
}
