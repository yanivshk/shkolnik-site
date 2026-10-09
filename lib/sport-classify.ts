/**
 * זיהוי ענף (כדורגל / כדורסל) מתוך שורת לוח שידורים — בלי ניחושים.
 *
 * סדר ההחלטה:
 *   1. החרגות (נשים, נוער, ענפים אחרים, אולפנים) → לא משחק שלנו.
 *   2. מילת ענף מפורשת ("כדורגל" / "כדורסל") — קובעת תמיד.
 *   3. מילון ליגות מדויק (למשל "ליגת ווינר סל" = כדורסל, "ליגת ווינר" בלי "סל" = כדורגל).
 *   4. שם שמתאים לשני הענפים ("ליגת העל", "גביע המדינה" בלי ציון ענף) → לא ידוע (null),
 *      וההחלטה עוברת להצלבה מול שורה אחרת של אותו משחק (resolveSport).
 *
 * הקובץ בלי תלויות, כדי שאפשר יהיה לבדוק אותו ישירות (tests/sport-classify.test.mts).
 */

export type Sport = "soccer" | "basketball";

/** ראיה: explicit = מילת ענף מפורשת; league = לפי מילון הליגות */
export type SportEvidence = { sport: Sport; by: "explicit" | "league" };

/** לא משחק של הקבוצות הבוגרות שלנו בכדורגל/כדורסל */
const EXCLUDE = new RegExp(
  [
    "נשים", "נוער", "נערים", "נערות", "צעירות", "עד גיל", "U-?\\d\\d",
    "כדוריד", "כדורעף", "פוטסל", "חופים", "טניס", "פאדל", "פוטבול", "הוקי", "בייסבול",
    "\\bNFL\\b", "\\bNHL\\b", "\\bMLB\\b", "\\bWNBA\\b", "מירוץ", "מרוצ", "מוטו",
    "אולפן", "תקציר", "סיכום", "שידור חוזר", "לקראת המשחק",
  ].join("|"),
  "i",
);

/** מילת ענף מפורשת — הראיה החזקה ביותר */
const EXPLICIT_BASKETBALL = /כדורסל/;
const EXPLICIT_SOCCER = /כדורגל/;

/** מילון ליגות — רק שמות חד-משמעיים. הסדר חשוב: הספציפי לפני הכללי. */
const LEAGUES: [RegExp, Sport][] = [
  // כדורסל
  [/ווינר\s*סל/, "basketball"],                 // ליגת ווינר סל, גביע ווינר סל
  [/יורוליג|יורוקאפ|יורובאסקט|EuroBasket|FIBA/i, "basketball"],
  [/\bNBA\b|\bNBL\b|ACB/i, "basketball"],
  // כדורגל
  [/ליגת (העל )?ווינר(?!\s*סל)/, "soccer"],     // שם החסות של ליגת העל בכדורגל
  [/גביע הטוטו/, "soccer"],
  [/ליגת האומות|מונדיאל|מוקדמות יורו|יורו 20\d\d/, "soccer"],
  [/ליגת האלופות|הליגה האירופית|ליגה אירופית|קונפרנס/, "soccer"], // בכדורסל נכתב במפורש "בכדורסל"
  [/פרמייר ליג|צ'מפיונשיפ|בונדסליגה|לה ?ליגה|סרייה A|ליג 1|ליגה (ספרדית|איטלקית|אנגלית|גרמנית|צרפתית|הולנדית|פורטוגלית|אוסטרית|בלגית)/, "soccer"],
  [/הליגה ה(אנגלית|ספרדית|איטלקית|גרמנית|צרפתית|הולנדית|פורטוגלית|ארגנטינאית|טורקית)|הברזילראו|ליברטדורס|סודאמריקנה|\bMLS\b/, "soccer"],
];

/** האם השורה צריכה להיות מוחרגת מהטבלה */
export function isExcluded(league: string, title: string): boolean {
  return EXCLUDE.test(`${league} ${title}`);
}

/** הענף לפי הטקסט של שורה אחת, או null אם אי אפשר לדעת בוודאות */
export function classifySport(league: string, title: string): SportEvidence | null {
  const all = `${league} ${title}`;
  const b = EXPLICIT_BASKETBALL.test(all);
  const s = EXPLICIT_SOCCER.test(all);
  if (b && s) return null; // סתירה בתוך אותה שורה
  if (b) return { sport: "basketball", by: "explicit" };
  if (s) return { sport: "soccer", by: "explicit" };
  for (const [re, sport] of LEAGUES) if (re.test(all)) return { sport, by: "league" };
  return null;
}

/**
 * החלטה סופית לגבי משחק שמופיע בכמה שורות (כמה ערוצים / שני המקורות).
 * ראיה מפורשת גוברת על מילון; סתירה בין ראיות באותה רמה → null (לא מציגים ענף שגוי).
 */
export function resolveSport(evidence: (SportEvidence | null)[]): Sport | null {
  for (const level of ["explicit", "league"] as const) {
    const found = new Set(evidence.filter((e): e is SportEvidence => !!e && e.by === level).map((e) => e.sport));
    if (found.size === 1) return [...found][0];
    if (found.size > 1) return null;
  }
  return null;
}
