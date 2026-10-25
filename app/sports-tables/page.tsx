import type { Metadata } from "next";
import { SubPage } from "@/components/subpage";
import { StandingsBoard } from "@/components/standings";
import { getStandings } from "@/lib/standings";

export const metadata: Metadata = {
  title: "טבלאות ספורט",
  description: "טבלאות ליגת העל בכדורגל, ליגת ווינר סל, יורוליג, ליגה לאומית וליגת העל לנוער — מתעדכנות חי בזמן משחקים.",
  alternates: { canonical: "/sports-tables" },
};

// בכל כניסה — נתונים עדכניים
export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getStandings();
  return (
    <SubPage title="טבלאות ספורט" subtitle="ליגת העל, ווינר סל, יורוליג, לאומית ונוער — חי בזמן משחקים" compact stickyTitle>
      <StandingsBoard initial={data} />
    </SubPage>
  );
}
