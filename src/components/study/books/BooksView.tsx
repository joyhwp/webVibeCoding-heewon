"use client";

// study 탭 > Books 서브탭. home 탭에서 DEAR Time으로 기록한 독서 데이터를
// (lib/books.ts를 통해) 자동으로 모아 대시보드로 보여준다. 책 자체의 저장은
// schedule.ts에서 파생되고, 책의 "전체 페이지 수"(목표)는 lib/bookMeta.ts,
// 메모(Quotes)는 lib/quotes.ts — 셋 다 독립된 localStorage 소스라 항상
// 최신 상태로 다시 계산된다.
//
// 화면은 세 단계: dashboard(기본, 사이드바+통계+Quotes) → list(전체 책 목록,
// "See all books"로 진입) → detail(책 하나의 독서 기록 히스토리).

import { useMemo, useState } from "react";
import { useHasMounted } from "@/hooks/useHasMounted";
import { getAllBookLogs, getBookSummaries, type BookSummary } from "@/lib/books";
import { getTotalPages } from "@/lib/bookMeta";
import CurrentlyReadingCard from "@/components/study/books/CurrentlyReadingCard";
import BookStatsRow from "@/components/study/books/BookStatsRow";
import QuotesSection from "@/components/study/books/QuotesSection";
import BookListGrid from "@/components/study/books/BookListGrid";
import BookDetail from "@/components/study/books/BookDetail";
import GlassCard from "@/components/ui/GlassCard";

type View = "dashboard" | "list" | "detail";

function isComplete(book: BookSummary): boolean {
  const target = getTotalPages(book.title);
  return target != null && book.totalPages >= target;
}

function currentMonthPrefix(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function BooksView() {
  const hasMounted = useHasMounted();
  const [view, setView] = useState<View>("dashboard");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  const summaries = useMemo<BookSummary[]>(
    () => (hasMounted ? getBookSummaries() : []),
    [hasMounted]
  );

  const stats = useMemo(() => {
    if (!hasMounted) return null;
    const pagesRead = summaries.reduce((sum, b) => sum + b.totalPages, 0);
    const completedCount = summaries.filter(isComplete).length;
    const monthPrefix = currentMonthPrefix();
    const pagesThisMonth = getAllBookLogs()
      .filter((log) => log.dateKey.startsWith(monthPrefix))
      .reduce(
        (sum, log) =>
          sum + (log.endPage != null ? log.endPage - log.startPage + 1 : 1),
        0
      );
    return {
      pagesRead,
      registeredCount: summaries.length,
      completedCount,
      pagesThisMonth,
    };
  }, [hasMounted, summaries]);

  const currentlyReading = summaries.find((b) => !isComplete(b)) ?? null;

  if (!hasMounted) return <div />;

  if (view === "detail" && selectedTitle) {
    const selected = summaries.find((b) => b.title === selectedTitle);
    if (selected) {
      return (
        <BookDetail book={selected} onBack={() => setView("list")} />
      );
    }
  }

  if (view === "list") {
    return (
      <BookListGrid
        summaries={summaries}
        onSelect={(title) => {
          setSelectedTitle(title);
          setView("detail");
        }}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (summaries.length === 0) {
    return (
      <GlassCard>
        <p className="text-sm text-foreground/50">
          No DEAR Time reading logged yet — add one from the Home tab with
          category &quot;DEAR Time&quot;.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      <CurrentlyReadingCard
        book={currentlyReading}
        onSeeAll={() => setView("list")}
      />

      <div className="flex flex-col gap-5">
        {stats && (
          <BookStatsRow
            stats={[
              {
                label: "pages read",
                value: String(stats.pagesRead),
                iconKind: "dearTime",
              },
              {
                label: "books registered",
                value: String(stats.registeredCount),
                iconKind: "school",
              },
              {
                label: "books finished",
                value: String(stats.completedCount),
                iconKind: "assignment",
              },
              {
                label: "pages this month",
                value: String(stats.pagesThisMonth),
                iconKind: "study",
              },
            ]}
          />
        )}

        <QuotesSection bookTitles={summaries.map((b) => b.title)} />
      </div>
    </div>
  );
}
