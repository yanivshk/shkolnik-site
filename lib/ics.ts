/** בניית קבצי יומן (iCalendar) למשחקים — משותף לאירוע בודד ולמנוי היומן האוטומטי */

import type { Broadcast } from "./broadcasts";
import { israelTime } from "./tz";

export const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/[\r\n]+/g, " ");
export const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.codePointAt(0)!) >>> 0, 7).toString(36);

export type CalEvent = { date: string; time: string; title: string; where: string; league: string; sport: string; key: string };

export function eventFromBroadcast(b: Broadcast): CalEvent {
  const icon = b.sport === "soccer" ? "⚽ " : b.sport === "basketball" ? "🏀 " : "";
  return {
    date: b.date,
    time: b.time,
    title: `${icon}${b.team} – ${b.opponent}${b.home ? " (בית)" : ""}`,
    where: b.channels.join(", "),
    league: b.league,
    sport: b.sport ?? "",
    // מזהה יציב למשחק (בלי השעה) — שינוי שעה או ערוץ מעדכן את האירוע הקיים ביומן במקום לשכפל
    key: `${b.date}-${b.team}-${b.opponent}`,
  };
}

function vevent(e: CalEvent): string[] {
  const start = israelTime(e.date, e.time);
  const end = new Date(start.getTime() + (e.sport === "basketball" ? 135 : 120) * 60_000);
  return [
    "BEGIN:VEVENT",
    `UID:${hash(e.key)}-${e.date.replaceAll("-", "")}@shkolnik.co.il`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    ...(e.where ? [`LOCATION:${esc(e.where)}`] : []),
    `DESCRIPTION:${esc([e.league, e.where && `שידור: ${e.where}`].filter(Boolean).join(" · "))}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)}`,
    "TRIGGER:-PT30M",
    "END:VALARM",
    "END:VEVENT",
  ];
}

/** קובץ יומן מלא. name = שם היומן כשנרשמים אליו כמנוי */
export function calendar(events: CalEvent[], name?: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shkolnik Family//Broadcasts//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(name
      ? [`X-WR-CALNAME:${esc(name)}`, "X-WR-TIMEZONE:Asia/Jerusalem", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"]
      : []),
    ...events.flatMap(vevent),
    "END:VCALENDAR",
  ].join("\r\n");
}
