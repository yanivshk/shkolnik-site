"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export const MENU = [
  { href: "/sea", label: "ים, רוח, גלים" },
  { href: "/hebrew-calendar", label: "לוח שנה עברי" },
  { href: "/ai-tools", label: "כלי AI" },
  { href: "/support-tools", label: "כלי תמיכה" },
  { href: "/articles", label: "מאמרים" },
  { href: "/yaniv-shkolnik", label: "יניב שקולניק" },
  { href: "/tomer-shkolnik", label: "תומר שקולניק" },
  { href: "/guy-shkolnik", label: "גיא שקולניק" },
  { href: "/noa-shkolnik", label: "נועה שקולניק" },
];

/** כפתור תפריט (☰) שפותח מגירת ניווט */
export function SiteMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="פתיחת תפריט"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white/70 text-royal"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="תפריט">
          <button type="button" aria-label="סגירת תפריט" onClick={() => setOpen(false)} className="absolute inset-0 bg-navy/40 backdrop-blur-sm" />
          <nav
            className="glass-strong absolute inset-y-0 left-0 flex w-[min(80vw,300px)] flex-col gap-1 overflow-y-auto p-4 shadow-2xl"
            style={{ paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[15px] font-extrabold text-royal">תפריט</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="סגירת תפריט" className="grid h-9 w-9 place-items-center rounded-xl text-muted">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            {MENU.map((m) => (
              <a key={m.href} href={m.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-[16px] font-semibold text-ink hover:bg-royal/[0.06] active:bg-gold/40">
                {m.label}
              </a>
            ))}
            <a href="/" onClick={() => setOpen(false)} className="mt-3 border-t border-line px-3 pt-4 text-[14px] font-semibold text-muted hover:text-royal">
              ← לעמוד הבית
            </a>
          </nav>
        </div>,
        document.body,
      )}
    </>
  );
}
