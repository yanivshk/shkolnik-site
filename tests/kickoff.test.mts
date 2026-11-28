/**
 * בדיקות לאימות שעת המשחק מול לוח 365 (לפני שהשעה מוצגת).
 * הרצה: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fits, israelDateTime, verifyTeamGame, verifyUclGame, type Kick } from "../lib/kickoff.ts";

const g = (id: number, sportId: number, start: string, home: [number, string], away: [number, string], competitionId = 42): Kick =>
  ({ id, sportId, competitionId, start, status: 2, home: { id: home[0], name: home[1] }, away: { id: away[0], name: away[1] } });

const GAMES: Kick[] = [
  g(1, 1, "2026-11-28T19:00:00+02:00", [566, "מכבי תל אביב"], [999, "הפועל פתח תקוה"]),
  g(2, 1, "2026-11-28T15:00:00+02:00", [700, "בני סכנין"], [562, "מכבי חיפה"]),
  g(3, 2, "2026-11-30T19:30:00+02:00", [1728, "ישראל"], [800, "לטביה"], 100),
  g(4, 2, "2026-12-03T22:00:00+02:00", [801, "באסקוניה"], [631, "מכבי תל אביב"], 569),
  g(5, 1, "2026-12-01T20:00:00+02:00", [802, "עירוני קרית שמונה"], [566, "מכבי תל אביב"]),
];

test("שעון ישראל, גם בחורף וגם בקיץ", () => {
  assert.deepEqual(israelDateTime("2026-11-28T19:00:00+02:00"), { date: "2026-11-28", time: "19:00" });
  assert.deepEqual(israelDateTime("2026-07-01T16:00:00Z"), { date: "2026-07-01", time: "19:00" });
  assert.deepEqual(israelDateTime("2026-11-28T22:30:00Z"), { date: "2026-11-29", time: "00:30" });
});

test("חלון ההתאמה בין שעת השידור לפתיחה", () => {
  assert.equal(fits("18:40", "19:00"), true);
  assert.equal(fits("19:00", "18:45"), true);
  assert.equal(fits("19:00", "18:30"), false);
  assert.equal(fits("14:00", "19:00"), false);
});

test("שידור 18:40 → שעת הפתיחה 19:00 (המקרה שדווח)", () => {
  assert.deepEqual(verifyTeamGame({ date: "2026-11-28", time: "18:40", team: 'מכבי ת"א', sport: "soccer" }, GAMES), { time: "19:00", verified: true });
  assert.deepEqual(verifyTeamGame({ date: "2026-11-28", time: "14:40", team: "מכבי חיפה", sport: "soccer" }, GAMES), { time: "15:00", verified: true });
  assert.deepEqual(verifyTeamGame({ date: "2026-12-01", time: "19:40", team: 'מכבי ת"א', sport: "soccer" }, GAMES), { time: "20:00", verified: true });
});

test("שעה שכבר נכונה — נשארת, ומסומנת כמאומתת", () => {
  assert.deepEqual(verifyTeamGame({ date: "2026-12-03", time: "22:00", team: 'מכבי ת"א', sport: "basketball" }, GAMES), { time: "22:00", verified: true });
});

test("ענף לא ידוע — נמצא לפי הקבוצה בכל הענפים", () => {
  assert.deepEqual(verifyTeamGame({ date: "2026-11-30", time: "19:20", team: "נבחרת ישראל", sport: null }, GAMES), { time: "19:30", verified: true });
});

test("ענף אחר באותו יום — לא מתאים (כדורגל ≠ כדורסל)", () => {
  assert.deepEqual(verifyTeamGame({ date: "2026-12-03", time: "21:40", team: 'מכבי ת"א', sport: "soccer" }, GAMES), { time: "21:40", verified: false });
});

test("אין משחק ב-365 / השעה רחוקה מדי / אין נתונים — שעת השידור, לא מאומתת", () => {
  assert.deepEqual(verifyTeamGame({ date: "2026-11-29", time: "18:40", team: 'מכבי ת"א', sport: "soccer" }, GAMES), { time: "18:40", verified: false });
  assert.deepEqual(verifyTeamGame({ date: "2026-11-28", time: "13:00", team: 'מכבי ת"א', sport: "soccer" }, GAMES), { time: "13:00", verified: false });
  assert.deepEqual(verifyTeamGame({ date: "2026-11-28", time: "18:40", team: 'מכבי ת"א', sport: "soccer" }, []), { time: "18:40", verified: false });
});

const UCL: Kick[] = [
  g(10, 1, "2026-12-08T19:45:00+02:00", [1, "ויאריאל"], [2, "סבאח"], 572),
  g(11, 1, "2026-12-08T22:00:00+02:00", [3, "ברצלונה"], [4, "מנצ'סטר סיטי"], 572),
  g(12, 1, "2026-12-08T22:00:00+02:00", [5, "נאפולי"], [6, "קלאב ברוז'"], 572),
];

test("ליגת האלופות: לפי שמות, או כשלכל המשחקים באותו חלון אותה שעה", () => {
  assert.deepEqual(verifyUclGame({ date: "2026-12-08", time: "21:40", home: "ברצלונה", away: "מנצ'סטר סיטי" }, UCL), { time: "22:00", verified: true });
  assert.deepEqual(verifyUclGame({ date: "2026-12-08", time: "19:30", home: "ויאריאל", away: "סבאח" }, UCL), { time: "19:45", verified: true });
  assert.deepEqual(verifyUclGame({ date: "2026-12-08", time: "21:45", home: "נאפולי", away: "ברוז'" }, UCL), { time: "22:00", verified: true });
  assert.deepEqual(verifyUclGame({ date: "2026-12-09", time: "22:00", home: "ברצלונה", away: "מנצ'סטר סיטי" }, UCL), { time: "22:00", verified: false });
});
