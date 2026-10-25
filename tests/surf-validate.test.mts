/**
 * בדיקות לאימות נתוני התחזית בדף הים.
 * הרצה: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanHour, isFresh, validateSurf, validateWeatherHours } from "../lib/surf-validate.ts";

const hour = (i: number, o: Record<string, unknown> = {}) => ({
  time: `2026-10-25T${String(i % 24).padStart(2, "0")}:00`.replace("25T", `${25 + Math.floor(i / 24)}T`),
  wave: 0.6, period: 6, wind: 8, windDir: 270, temp: 25, humidity: 60, rain: 0, ...o,
});
const surf = (n = 30, o: Record<string, unknown> = {}) => ({ spotId: 60, spot: "תל אביב", now: 2, hours: Array.from({ length: n }, (_, i) => hour(i, o)) });

test("ערך מחוץ לטווח נמחק, השעה נשארת", () => {
  const h = cleanHour(hour(0, { temp: 150, humidity: -3, rain: 40 }) as never, true)!;
  assert.equal(h.temp, undefined);
  assert.equal(h.humidity, undefined);
  assert.equal(h.rain, 40);
});

test("בלי גובה גל — השעה לא שמישה בגרף הים", () => {
  assert.equal(cleanHour(hour(0, { wave: null }) as never, true), null);
  assert.equal(cleanHour(hour(0, { wave: 99 }) as never, true), null);
});

test("תחזית תקינה עוברת, מיקום אחר נדחה", () => {
  assert.equal(validateSurf(surf()).ok, true);
  assert.equal(validateSurf(surf(), { name: "תל אביב" }).ok, true);
  assert.equal(validateSurf(surf(), { name: "חיפה" }).ok, false);
});

test("מעט שעות / הרבה שעות שבורות — נדחה", () => {
  assert.equal(validateSurf(surf(10)).ok, false);
  assert.equal(validateSurf(surf(30, { wave: null })).ok, false);
  assert.equal(validateSurf({ hours: "x" }).ok, false);
});

test("רצף שעות שבור — נדחה", () => {
  const s = surf();
  s.hours[10] = { ...s.hours[10], time: "2026-10-27T10:00" };
  assert.equal(validateSurf(s).ok, false);
});

test("נתוני עיר", () => {
  const list = Array.from({ length: 30 }, (_, i) => ({ time: hour(i).time, temp: 22, humidity: 50 }));
  assert.equal(validateWeatherHours(list)?.length, 30);
  assert.equal(validateWeatherHours(list.slice(0, 5)), null);
  assert.equal(validateWeatherHours("bad"), null);
});

test("עדכניות", () => {
  const s = validateSurf(surf()).surf!;
  assert.equal(isFresh(s, "2026-10-25T02"), true);
  assert.equal(isFresh(s, "2026-10-25T09"), false);
});
