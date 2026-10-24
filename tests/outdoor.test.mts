/**
 * בדיקות לכללי "איך זה בחוץ" בדף הים.
 * הרצה: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { bestWindow, bike, feel, sky, sup, surf, swim, windWord, type OutHour } from "../lib/outdoor.ts";

const h = (o: Partial<OutHour>): OutHour => ({ feel: 22, windKmh: 10, windDir: 270, rain: 0, code: 1, ...o });

test("שמיים ותחושה", () => {
  assert.equal(sky(0, 5).key, "sun");
  assert.equal(sky(2, 60).text, "מעונן חלקית");
  assert.equal(sky(3, 100).key, "cloud");
  assert.equal(sky(80, 90).key, "rain");
  assert.equal(feel(22).text, "נעים");
  assert.equal(feel(31).text, "חם מאוד");
  assert.equal(windWord(5), "שקט");
  assert.equal(windWord(25), "רוח בינונית");
});

test("אופניים", () => {
  assert.equal(bike(h({})), 2);
  assert.equal(bike(h({ feel: 29 })), 1);
  assert.equal(bike(h({ feel: 33 })), 0);
  assert.equal(bike(h({ windKmh: 32 })), 0);
  assert.equal(bike(h({ code: 61, rain: 70 })), 0);
});

test("גלישת גלים וסאפ", () => {
  assert.equal(surf(h({ wave: 1, period: 7, windKmh: 8 })), 2);
  assert.equal(surf(h({ wave: 1, period: 7, windKmh: 18, windDir: 90 })), 2); // רוח מהיבשה
  assert.equal(surf(h({ wave: 1, period: 7, windKmh: 18, windDir: 270 })), 1);
  assert.equal(surf(h({ wave: 0.2, period: 5 })), 0);
  assert.equal(surf(h({})), null); // לא בחוף
  assert.equal(sup(h({ wave: 0.3, windKmh: 8 })), 2);
  assert.equal(sup(h({ wave: 0.5, windKmh: 15 })), 1);
  assert.equal(sup(h({ wave: 0.8 })), 0);
  assert.equal(swim(h({ wave: 0.4, feel: 27 })), 2);
});

test("החלון הטוב ביותר", () => {
  assert.deepEqual(bestWindow([1, 2, 2, 1, 2]), { level: 2, from: 1, to: 2 });
  assert.deepEqual(bestWindow([0, 0]), { level: 0, from: 0, to: 1 });
  assert.deepEqual(bestWindow([null, null]), { level: null, from: -1, to: -1 });
});
