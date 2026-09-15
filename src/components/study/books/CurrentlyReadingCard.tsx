"use client";

import { useState } from "react";
import CategoryIcon from "@/components/today/CategoryIcon";
import { CATEGORY_ACCENT } from "@/lib/taskCategory";
import { getTotalPages, setTotalPages } from "@/lib/bookMeta";
import type { BookSummary } from "@/lib/books";

const accent = CATEGORY_ACCENT.dearTime;

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

function lastReadLabel(book: BookSummary): string {
  return book.lastReadDateKey
    ? `Last read ${formatDateLabel(book.lastReadDateKey)}`
    : "Not started yet";
}

export default function CurrentlyReadingCard({
  book,
  onSeeAll,
}: {
  book: BookSummary | null;
  onSeeAll: () => void;
}) {
  const [target, setTarget] = useState(() =>
    book ? getTotalPages(book.title) : undefined
  );
  const [editingTarget, setEditingTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState("");

  function handleSaveTarget() {
    const n = Number(draftTarget);
    if (book && n > 0) {
      setTotalPages(book.title, n);
      setTarget(n);
    }
    setEditingTarget(false);
  }

  return (
    <div
      className="glass-panel flex flex-col gap-4 rounded-3xl border p-6"
      style={{
        background: `color-mix(in srgb, ${accent.solid} 20%, var(--glass-bg))`,
        borderColor: `color-mix(in srgb, ${accent.solid} 40%, var(--glass-border))`,
      }}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-foreground/45">
        Currently Reading
      </p>

      {!book ? (
        <p className="text-sm text-foreground/50">
          No book in progress — start one from the Home tab with category
          &quot;DEAR Time&quot;.
        </p>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div
              className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg text-2xl"
              style={{ backgroundColor: accent.soft, color: accent.solid }}
            >
              <CategoryIcon kind="dearTime" className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-semibold leading-tight">
                {book.title}
              </h2>
              <p className="mt-1 text-xs text-foreground/50">
                {lastReadLabel(book)}
              </p>
            </div>
          </div>

          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${target ? Math.min(100, (book.totalPages / target) * 100) : 8}%`,
                  backgroundColor: accent.solid,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-medium tabular-nums" style={{ color: accent.solid }}>
                {target
                  ? `${book.totalPages} of ${target} pages`
                  : `${book.totalPages} pages read`}
              </span>
              {editingTarget ? (
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    autoFocus
                    value={draftTarget}
                    onChange={(e) => setDraftTarget(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTarget()}
                    placeholder="total pages"
                    className="w-20 rounded-lg border-0 bg-foreground/5 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTarget}
                    className="font-medium text-foreground/60 hover:text-foreground"
                  >
                    Save
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraftTarget(target ? String(target) : "");
                    setEditingTarget(true);
                  }}
                  className="text-foreground/40 hover:text-foreground/70"
                >
                  {target ? "Edit total" : "Set total pages"}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onSeeAll}
        className="self-start text-sm font-medium hover:opacity-80"
        style={{ color: accent.solid }}
      >
        See all books →
      </button>
    </div>
  );
}
