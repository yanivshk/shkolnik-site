/**
 * בדיקות לזיהוי הענף בלוח השידורים — דוגמאות אמיתיות מערוץ הספורט (S5) ומספורט 1 (S1).
 * הרצה: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifySport, isExcluded, resolveSport } from "../lib/sport-classify.ts";

const sport = (league: string, title: string) => classifySport(league, title)?.sport ?? null;

test("ליגת העל בכדורגל בשם החסות 'ליגת ווינר' — כדורגל (הבאג שתוקן)", () => {
  assert.equal(sport("ליגת ווינר", 'מכבי ת"א - בני סכנין'), "soccer"); // S1
  assert.equal(sport("ליגת העל ווינר בכדורגל", "מכבי תל אביב - בני סכנין, מחזור 6"), "soccer"); // S5
  assert.equal(sport("ליגת ווינר", 'הפועל ת"א - הפועל ק"ש'), "soccer");
});

test("ליגת ווינר סל / גביע ווינר סל — כדורסל", () => {
  assert.equal(sport("ליגת ווינר סל", 'מכבי ת"א - הפועל ירושלים'), "basketball");
  assert.equal(sport("גביע ווינר סל", 'הפועל ת"א - עירוני נס ציונה, חצי גמר'), "basketball");
  assert.equal(sport("ליגת ווינרסל", 'מכבי ת"א - הפועל חולון'), "basketball");
});

test("מילת ענף מפורשת קובעת", () => {
  assert.equal(sport("ליגת העל בכדורסל", "מכבי תל אביב - הפועל גליל עליון, מחזור 1"), "basketball");
  assert.equal(sport("ליגת העל בכדורגל", 'הפועל חיפה - מכבי פ"ת, מחזור 6'), "soccer");
  assert.equal(sport("ליגה צרפתית בכדורסל", "בולאזאק - בורק-אן-ברס"), "basketball");
  assert.equal(sport("ליגה צרפתית בכדורגל", "ליל - לה האבר"), "soccer");
  assert.equal(sport("כדורסל ספרדי", "ריאל מדריד - מנרסה"), "basketball");
  assert.equal(sport("הליגה הטורקית (כדורגל)", "גלאטסראי - קסימפאשה"), "soccer");
  assert.equal(sport("ליגה לאומית בכדורסל", "אליצור שומרון - אליצור נתניה"), "basketball");
  assert.equal(sport("ליגת האלופות בכדורסל", "הפועל ירושלים - טנריפה"), "basketball");
});

test("ליגות אירופה ונבחרות", () => {
  assert.equal(sport("יורוליג", "ברצלונה - מכבי תל אביב, מחזור 5"), "basketball");
  assert.equal(sport("היורוקאפ", 'הפועל ירושלים - רוסטוק'), "basketball");
  assert.equal(sport("ליגת האלופות", "גלאטסראיי - ברצלונה, מחזור 2"), "soccer");
  assert.equal(sport("הליגה האירופית", 'אלקמאר - הפועל ב"ש'), "soccer");
  assert.equal(sport("קונפרנס ליג", "היידוק ספליט - איאקס"), "soccer");
  assert.equal(sport("ליגת האומות", "אירלנד - ישראל, מחזור 4"), "soccer");
  assert.equal(sport("גביע הטוטו - לאומית", 'הפועל עכו - בני יהודה ת"א, גמר'), "soccer");
  assert.equal(sport("פרמייר ליג", "ארסנל - לידס, מחזור 6"), "soccer");
  assert.equal(sport("NBA", "שיקגו - ממפיס"), "basketball");
  assert.equal(sport("ליגת האלופות FIBA", "הפועל חולון - ריגה"), "basketball");
});

test("שם שמתאים לשני הענפים — לא מנחשים", () => {
  assert.equal(sport("ליגת העל", 'מכבי חיפה - בית"ר ירושלים'), null);
  assert.equal(sport("גביע המדינה", 'מכבי ת"א - הפועל ת"א'), null);
  assert.equal(sport("", 'מכבי ת"א - הפועל ת"א'), null);
});

test("החרגות: נשים, נוער, נבחרות צעירות, ענפים אחרים, אולפנים", () => {
  assert.ok(isExcluded("ליגת העל בכדורסל נשים", "אליצור רמלה - מכבי חיפה"));
  assert.ok(isExcluded("מוקדמות יורו 27 לנבחרת עד גיל 21", "ישראל - נורווגיה"));
  assert.ok(isExcluded("ליגת העל לנוער בכדורגל", 'מכבי ת"א - הפועל ת"א'));
  assert.ok(isExcluded("ליגת העל בכדוריד", "הפועל ראשון לציון - מכבי ראשון לציון"));
  assert.ok(isExcluded("ליגת האלופות בכדוריד", "זאגרב - אולבורג"));
  assert.ok(isExcluded("NFL - ליגת הפוטבול האמריקאית", "לוס אנג׳לס ראמס - בופאלו בילס"));
  assert.ok(isExcluded("אולפן יורוליג", "לקראת המשחק"));
  assert.ok(!isExcluded("יורוליג", "ברצלונה - מכבי תל אביב"));
  assert.ok(!isExcluded("ליגת ווינר", 'מכבי ת"א - בני סכנין'));
});

test("הצלבה בין מקורות: מפורש גובר על מילון, סתירה → לא ידוע", () => {
  const ex = (s: "soccer" | "basketball") => ({ sport: s, by: "explicit" as const });
  const lg = (s: "soccer" | "basketball") => ({ sport: s, by: "league" as const });
  assert.equal(resolveSport([lg("soccer"), ex("soccer")]), "soccer");
  assert.equal(resolveSport([null, ex("basketball")]), "basketball");   // "ליגת העל" + "ליגת העל בכדורסל"
  assert.equal(resolveSport([lg("basketball"), ex("soccer")]), "soccer"); // מפורש גובר
  assert.equal(resolveSport([ex("soccer"), ex("basketball")]), null);     // סתירה מפורשת
  assert.equal(resolveSport([lg("soccer"), lg("basketball")]), null);     // סתירה במילון
  assert.equal(resolveSport([null, null]), null);
});
