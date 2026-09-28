# Shkolnik Hub

לוח אישי מותאם לנייד: שווקים, טסלה, ספורט, AI ותמונת היום.
Next.js 16 · Tailwind 4 · RTL · PWA · ללא מפתחות API.

## עריכת תוכן
כל התוכן נמצא ב-`lib/config.ts`: מניות ומדדים (סימולים של Yahoo), פידים של RSS, ליגות מ-ESPN וקבוצות מודגשות.

## מקורות (ללא מפתח)
| תחום | מקור | רענון |
|---|---|---|
| מדדים/מניות | Yahoo Finance chart API | 5 דק׳ |
| טסלה | TSLA + RSS (Electrek, Teslarati) | 5/15 דק׳ |
| ספורט | ESPN scoreboard + ynet ספורט RSS | 5/15 דק׳ |
| AI | OpenAI, DeepMind, MIT TR, Hugging Face | 15 דק׳ |
| תמונת היום | Wikimedia Commons POTD | שעה |

## פיתוח מקומי
```bash
npm install
npm run mock   # נתוני דמה
npm run dev    # נתונים אמיתיים
```

## משתני סביבה (Vercel)
- `SITE_PUBLIC=true` — רק בהשקה על הדומיין. עד אז האתר מוגדר noindex.

## אבטחה
CSP, HSTS, X-Frame-Options: DENY, Permissions-Policy, והסרת x-powered-by (ב-`next.config.ts`).
כל הקריאות לספקי המידע יוצאות מהשרת, כך שהדפדפן לא פונה לגורמי צד ג' מלבד תמונות.
