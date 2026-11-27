/**
 * בדיקות לזיהוי עותק ישן של טבלת 365.
 * הרצה: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { ENDED, isStale, LIVE, NOT_STARTED } from "../lib/standings-fresh.ts";

const NOW = Date.parse("2026-11-28T15:05:00+02:00");
const game = (id: number, statusGroup: number, start: string) => ({
  id, statusGroup, startTime: start,
  homeCompetitor: { id: 1, name: "א" }, awayCompetitor: { id: 2, name: "ב" },
});

test("משחק שהיה צריך להתחיל ועדיין 'טרם החל' — ישן", () => {
  assert.equal(isStale([game(1, NOT_STARTED, "2026-11-28T15:00:00+02:00")], new Set(), NOW), true);
});

test("משחק שמתחיל בעוד שעה / לפני פחות מדקה — לא ישן", () => {
  assert.equal(isStale([game(1, NOT_STARTED, "2026-11-28T16:00:00+02:00")], new Set(), NOW), false);
  assert.equal(isStale([game(1, NOT_STARTED, "2026-11-28T15:04:30+02:00")], new Set(), NOW), false);
});

test("משחק נדחה מלפני יותר מ-3 שעות — לא מבקשים עותק טרי בלי סוף", () => {
  assert.equal(isStale([game(1, NOT_STARTED, "2026-11-28T11:00:00+02:00")], new Set(), NOW), false);
});

test("משחק חי שהטבלה מסמנת — עדכני; שהטבלה לא מסמנת — ישן", () => {
  assert.equal(isStale([game(7, LIVE, "2026-11-28T15:00:00+02:00")], new Set([7]), NOW), false);
  assert.equal(isStale([game(7, LIVE, "2026-11-28T15:00:00+02:00")], new Set(), NOW), true);
});

test("משחק שהסתיים והטבלה עוד מסמנת אותו כחי — ישן", () => {
  assert.equal(isStale([game(9, ENDED, "2026-11-28T13:00:00+02:00")], new Set([9]), NOW), true);
  assert.equal(isStale([game(9, ENDED, "2026-11-28T13:00:00+02:00")], new Set(), NOW), false);
});
