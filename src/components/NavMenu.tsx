"use client";

import { useState } from "react";
import Link from "next/link";

export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More menu"
        aria-expanded={open}
        className="glass-panel flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:text-foreground"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <circle cx="4" cy="10" r="1.4" />
          <circle cx="10" cy="10" r="1.4" />
          <circle cx="16" cy="10" r="1.4" />
        </svg>
      </button>

      {open && (
        <>
          {/* 바깥 클릭으로 닫기 */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="glass-panel absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl p-1 shadow-lg">
            <Link
              href="/trash"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
                <path
                  d="M4 6h12M8 6V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6M6 6l.6 9.4a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Trash
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
