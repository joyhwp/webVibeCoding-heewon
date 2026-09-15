"use client";

import CategoryIcon from "@/components/today/CategoryIcon";
import { CATEGORY_ACCENT } from "@/lib/taskCategory";
import { getTotalPages } from "@/lib/bookMeta";
import type { BookSummary } from "@/lib/books";

const accent = CATEGORY_ACCENT.dearTime;

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function lastReadLabel(book: BookSummary): string {
  return book.lastReadDateKey
    ? `last read ${formatDateLabel(book.lastReadDateKey)}`
    : "not started yet";
}

export default function BookListGrid({
  summaries,
  onSelect,
  onBack,
}: {
  summaries: BookSummary[];
  onSelect: (title: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-foreground/60 hover:text-foreground"
      >
        ← Back to Dashboard
      </button>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((book) => {
          const target = getTotalPages(book.title);
          const complete = target != null && book.totalPages >= target;
          return (
            <button
              key={book.title}
              type="button"
              onClick={() => onSelect(book.title)}
              className="glass-panel flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-transform hover:-translate-y-0.5"
              style={{
                background: `color-mix(in srgb, ${accent.solid} 14%, var(--glass-bg))`,
                borderColor: `color-mix(in srgb, ${accent.solid} 32%, var(--glass-border))`,
              }}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: accent.soft, color: accent.solid }}
                >
                  <CategoryIcon kind="dearTime" className="h-5 w-5" />
                </div>
                {complete && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: accent.soft, color: accent.solid }}
                  >
                    Finished
                  </span>
                )}
              </div>
              <div className="min-w-0 w-full">
                <p className="truncate text-base font-semibold leading-tight">
                  {book.title}
                </p>
                <p className="mt-1 text-sm text-foreground/60">
                  {target
                    ? `${book.totalPages} of ${target} pages`
                    : `${book.totalPages}쪽까지 읽음`}
                </p>
                <p className="mt-0.5 text-xs text-foreground/40">
                  {lastReadLabel(book)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
