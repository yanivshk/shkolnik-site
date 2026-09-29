import type { Metadata } from "next";
import { SubPage } from "@/components/subpage";

export const metadata: Metadata = {
  title: "מאמרים",
  description: "מאמרים מאת משפחת שקולניק.",
  alternates: { canonical: "/articles" },
};

export default function Page() {
  return (
    <SubPage title="מאמרים" eyebrow="Articles">
      <div className="glass rounded-[var(--radius-card)] p-6 text-[16px] leading-8 text-muted">
        המאמרים הראשונים יעלו בקרוב.
      </div>
    </SubPage>
  );
}
