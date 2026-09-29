import type { Metadata } from "next";
import { SubPage, ToolGroups, type ToolGroup } from "@/components/subpage";

export const metadata: Metadata = {
  title: "כלי תמיכה — השתלטות מרחוק בחינם",
  description: "קישורים לכלים חינמיים להשתלטות מרחוק על מחשבים לצורך תמיכה טכנית.",
  alternates: { canonical: "/support-tools" },
};

const GROUPS: ToolGroup[] = [
  {
    id: "remote",
    icon: "remote",
    title: "השתלטות מרחוק",
    tools: [
      { name: "Quick Assist (Windows)", url: "https://support.microsoft.com/en-us/windows/apps/solve-pc-problems-remotely-using-quick-assist", note: "מובנה ב-Windows 10/11. חיפוש \"Quick Assist\" בתפריט התחל. חינם." },
      { name: "Chrome Remote Desktop", url: "https://remotedesktop.google.com/support", note: "של Google, עובד דרך הדפדפן בכל מערכת הפעלה. חינם." },
      { name: "AnyDesk", url: "https://anydesk.com", note: "קל ומהיר, בלי התקנה. חינם לשימוש אישי." },
      { name: "TeamViewer", url: "https://www.teamviewer.com", note: "הכלי הוותיק והמוכר. חינם לשימוש אישי." },
      { name: "RustDesk", url: "https://rustdesk.com", note: "קוד פתוח, אפשר גם שרת פרטי. חינם." },
      { name: "UltraViewer", url: "https://www.ultraviewer.net", note: "פשוט לשימוש, עם צ'אט מובנה. חינם." },
    ],
  },
];

export default function Page() {
  return (
    <SubPage
      title="כלי תמיכה"
      subtitle="כלים חינמיים להשתלטות מרחוק על מחשבים"
      eyebrow="Remote Support"
      stats={[`${GROUPS[0].tools.length} כלים`, "חינם", "Windows · Mac · נייד"]}
    >
      <div className="mb-6 rounded-[var(--radius-card)] border border-gold bg-gold-soft/60 p-4 text-[14px] leading-6 text-ink">
        <strong>חשוב:</strong> לתת גישה מרחוק רק למי שאתם מכירים וסומכים עליו. אף גוף רשמי (בנק, חברת תקשורת, מיקרוסופט) לא יתקשר ויבקש להתחבר למחשב שלכם.
      </div>
      <ToolGroups groups={GROUPS} />
    </SubPage>
  );
}
