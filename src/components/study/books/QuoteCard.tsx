"use client";

import { CATEGORY_ACCENT } from "@/lib/taskCategory";
import type { BookQuote } from "@/lib/quotes";

const accent = CATEGORY_ACCENT.dearTime;

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}

export default function QuoteCard({
  quote,
  onFilterBook,
  onRemove,
}: {
  quote: BookQuote;
  onFilterBook: (title: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="glass-panel group relative flex flex-col justify-between gap-4 rounded-2xl border p-5"
      style={{
        background: `color-mix(in srgb, ${accent.solid} 14%, var(--glass-bg))`,
        borderColor: `color-mix(in srgb, ${accent.solid} 30%, var(--glass-border))`,
      }}
    >
      <button
        type="button"
        onClick={() => onRemove(quote.id)}
        aria-label="Delete quote"
        className="absolute right-3 top-3 rounded-full px-1 text-xs leading-none text-foreground/30 opacity-0 transition-opacity hover:text-foreground/70 group-hover:opacity-100"
      >
        ✕
      </button>

      <div>
        <span
          className="block text-4xl font-bold leading-none opacity-40"
          style={{ color: accent.solid }}
          aria-hidden="true"
        >
          &ldquo;
        </span>
        <p className="-mt-2 text-sm leading-relaxed text-foreground/85">
          {quote.content}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-foreground/10 pt-3 text-xs">
        <button
          type="button"
          onClick={() => onFilterBook(quote.bookTitle)}
          className="truncate font-medium hover:opacity-80"
          style={{ color: accent.solid }}
        >
          {quote.bookTitle}
          {quote.page != null ? ` · p.${quote.page}` : ""}
        </button>
        <span className="shrink-0 text-foreground/40">
          {formatDate(quote.createdAt)}
        </span>
      </div>
    </div>
  );
}
