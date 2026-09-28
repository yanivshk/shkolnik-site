import { TZ } from "./config";

export function normalizePrice(price: number, currency: string) {
  // מניות ת"א מצוטטות באגורות (ILA)
  return currency === "ILA" ? { value: price / 100, currency: "ILS" } : { value: price, currency };
}

export function priceDigits(value: number) {
  if (value < 10) return 3;
  if (value >= 10000) return 0;
  return 2;
}

export function formatPrice(value: number, digits = priceDigits(value)) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

export const currencySymbol = (c: string) => ({ USD: "$", ILS: "₪", EUR: "€" } as Record<string, string>)[c] ?? "";

export function formatPct(p: number) {
  const s = p > 0 ? "+" : p < 0 ? "−" : "";
  return `${s}${Math.abs(p).toFixed(2)}%`;
}

export function timeAgo(date: string | null) {
  if (!date) return "";
  const t = Date.parse(date);
  if (Number.isNaN(t)) return "";
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return "עכשיו";
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "לפני שעה" : h === 2 ? "לפני שעתיים" : `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return d === 1 ? "אתמול" : d === 2 ? "שלשום" : `לפני ${d} ימים`;
}

export function formatGameTime(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: TZ, weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}

export function hebrewDate(d = new Date()) {
  return new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
}
