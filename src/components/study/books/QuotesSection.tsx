"use client";

import { useState, type FormEvent } from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import QuoteCard from "@/components/study/books/QuoteCard";
import { useQuotes } from "@/hooks/useQuotes";
import { CATEGORY_ACCENT } from "@/lib/taskCategory";

const accent = CATEGORY_ACCENT.dearTime;

export default function QuotesSection({
  bookTitles,
}: {
  bookTitles: string[];
}) {
  const { quotes, add, remove } = useQuotes();
  const [formOpen, setFormOpen] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [content, setContent] = useState("");
  const [page, setPage] = useState("");
  const [filterTitle, setFilterTitle] = useState<string | null>(null);

  const visibleQuotes = filterTitle
    ? quotes.filter((q) => q.bookTitle === filterTitle)
    : quotes;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = bookTitle.trim();
    const text = content.trim();
    if (!title || !text) return;
    add(title, text, page ? Number(page) : undefined);
    setBookTitle("");
    setContent("");
    setPage("");
    setFormOpen(false);
  }

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Quotes</h2>
          {filterTitle && (
            <button
              type="button"
              onClick={() => setFilterTitle(null)}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: accent.soft, color: accent.solid }}
            >
              {filterTitle} ✕
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {formOpen ? "Cancel" : "+ Add Quote"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-2xl bg-foreground/5 p-4"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What stood out to you?"
            required
            rows={3}
            className="glass-panel resize-none rounded-xl border-0 px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              list="quote-book-titles"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Book title"
              required
              className="glass-panel flex-1 rounded-xl border-0 px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
            />
            <datalist id="quote-book-titles">
              {bookTitles.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <input
              type="number"
              min={1}
              value={page}
              onChange={(e) => setPage(e.target.value)}
              placeholder="Page"
              className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 sm:w-24"
            />
          </div>
          <GlassButton type="submit" className="self-start">
            Save Quote
          </GlassButton>
        </form>
      )}

      {visibleQuotes.length === 0 ? (
        <p className="text-sm text-foreground/50">
          {filterTitle
            ? "No quotes for this book yet."
            : "No quotes saved yet — capture a line worth remembering."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleQuotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onFilterBook={setFilterTitle}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
