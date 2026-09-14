"use client";

import GlassCard from "@/components/ui/GlassCard";
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

function pageRangeLabel(startPage: number, endPage?: number): string {
  return endPage != null ? `${startPage}~${endPage}쪽` : `${startPage}쪽부터`;
}

export default function BookDetail({
  book,
  onBack,
}: {
  book: BookSummary;
  onBack: () => void;
}) {
  const target = getTotalPages(book.title);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-foreground/60 hover:text-foreground"
      >
        ← Back to Books
      </button>

      <GlassCard
        style={{
          background: `color-mix(in srgb, ${accent.solid} 14%, var(--glass-bg))`,
        }}
      >
        <div className="mb-5 flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: accent.soft, color: accent.solid }}
          >
            <CategoryIcon kind="dearTime" className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {book.title}
            </h2>
            <p className="text-xs text-foreground/50">
              {target
                ? `${book.totalPages} of ${target} pages`
                : `${book.totalPages}쪽까지 읽음`}{" "}
              · last read {formatDateLabel(book.lastReadDateKey)}
            </p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-foreground/10">
          {book.history.map((entry, i) => (
            <div
              key={`${entry.dateKey}-${entry.createdAt}-${i}`}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="text-sm text-foreground/70">
                {formatDateLabel(entry.dateKey)}
              </span>
              <span
                className="text-sm font-medium tabular-nums"
                style={{ color: accent.solid }}
              >
                {pageRangeLabel(entry.startPage, entry.endPage)}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
