/**
 * האם הטבלה שקיבלנו מ-365 היא עותק ישן? (בלי תלויות — נבדק ב-tests/standings-fresh.test.mts)
 * כשאין משחק חי 365 שומרת תשובות עד 30 דקות; ברגע פתיחה או סיום של משחק העותק השמור כבר לא נכון.
 */

export type Game365 = {
  id: number; statusGroup: number; startTime: string; gameTimeDisplay?: string; statusText?: string; shortStatusText?: string;
  homeCompetitor: { id: number; name: string; score?: number };
  awayCompetitor: { id: number; name: string; score?: number };
};

/** statusGroup של 365: 2 טרם החל · 3 חי · 4 הסתיים */
export const NOT_STARTED = 2, LIVE = 3, ENDED = 4;

/**
 * העותק שקיבלנו ישן? — משחק שהיה צריך כבר להתחיל (עד 3 שעות אחורה) ועדיין "טרם החל",
 * משחק חי שהטבלה עוד לא מסמנת, או שורה בטבלה שעוד מסומנת כחיה על משחק שכבר הסתיים.
 */
export function isStale(games: Game365[], liveIds: Set<number>, now: number) {
  return games.some((g) => {
    const t = Date.parse(g.startTime);
    if (g.statusGroup === NOT_STARTED) return t <= now - 60_000 && t > now - 3 * 3600_000;
    if (g.statusGroup === LIVE) return !liveIds.has(g.id);
    if (g.statusGroup === ENDED) return liveIds.has(g.id);
    return false;
  });
}
