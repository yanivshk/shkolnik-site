import type { Metadata } from "next";
import { SubPage } from "@/components/subpage";

export const metadata: Metadata = {
  title: "לוח שנה עברי",
  description: "לוח שנה עברי-לועזי חי ומעודכן: חגים, זמני שבת ופרשת השבוע.",
  alternates: { canonical: "/hebrew-calendar" },
};

const SOURCE = "https://calendar.2net.co.il/";

/**
 * הלוח מוטמע ישירות מהאתר המקורי (iframe), ולכן תמיד מעודכן ואינטראקטיבי:
 * מעבר בין חודשים ושנים, קפיצה בזמן, החלפת עיר וכו' — בדיוק כמו באתר עצמו.
 * מחייב "frame-src https://calendar.2net.co.il" ב-CSP (next.config.ts).
 */
export default function Page() {
  return (
    <SubPage title="לוח שנה עברי" subtitle="לוח עברי-לועזי חי — חגים, זמני שבת ופרשה" eyebrow="Hebrew Calendar">
      <div className="glass overflow-hidden rounded-[var(--radius-card)]">
        <iframe
          src={SOURCE}
          title="לוח שנה עברי — 2net"
          className="block h-[80vh] min-h-[640px] w-full border-0 bg-white"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
      <p className="mt-3 text-[12px] text-muted">
        מקור:{" "}
        <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="font-semibold text-royal hover:underline">calendar.2net.co.il</a>
        {" "}· לפתיחה במסך מלא לחצו על הקישור
      </p>
    </SubPage>
  );
}
