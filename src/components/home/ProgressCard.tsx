"use client";

import { useEffect, useState } from "react";
import type { ProgressItem } from "@/lib/progress";
import { CATEGORY_ACCENT } from "@/lib/taskCategory";
import { getLastPageForBook } from "@/lib/books";
import { getTotalPages, setTotalPages } from "@/lib/bookMeta";
import CategoryIcon from "@/components/today/CategoryIcon";

type ProgressCardProps = {
  item: ProgressItem;
  isEditing: boolean;
  onToggleEdit: (id: string) => void;
  onSetPercent: (id: string, percent: number) => void;
  onComplete: (id: string) => void;
};

function formatUpdated(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}

/** 슬라이더 "마그네틱 스냅" — 5의 배수 ±2 안쪽으로 들어오면 그 배수로
 * 끌어당기고, 벗어나면 원래 드래그한 값 그대로 둔다. */
function magneticSnap(raw: number): number {
  const nearest5 = Math.min(100, Math.max(5, Math.round(raw / 5) * 5));
  return Math.abs(raw - nearest5) <= 2 ? nearest5 : raw;
}

export default function ProgressCard({
  item,
  isEditing,
  onToggleEdit,
  onSetPercent,
  onComplete,
}: ProgressCardProps) {
  const accent = CATEGORY_ACCENT[item.category];
  // 슬라이더를 끌 때마다 매번 localStorage에 쓰지 않고, 손을 뗄 때만 반영
  const [draftPercent, setDraftPercent] = useState(item.percent);

  // DEAR Time 책과 연결된 카드는 진행률을 직접 못 건드리고, Books 탭 데이터
  // (가장 최근 읽은 페이지 / 전체 쪽수)로 자동 계산한다.
  const isBookItem = Boolean(item.bookTitle);
  const [totalPages, setTotalPagesState] = useState<number | undefined>(() =>
    item.bookTitle ? getTotalPages(item.bookTitle) : undefined
  );
  const latestPage = item.bookTitle
    ? (getLastPageForBook(item.bookTitle) ?? 0)
    : 0;
  const computedPercent =
    isBookItem && totalPages
      ? Math.max(0, Math.min(100, Math.round((latestPage / totalPages) * 100)))
      : undefined;

  // 계산된 진행률이 저장된 값과 달라졌으면 동기화 — 완독(100%) 시 자동
  // 아카이브 처리(lib/progress.ts)도 이 경로로 그대로 발동한다.
  useEffect(() => {
    if (computedPercent != null && computedPercent !== item.percent) {
      onSetPercent(item.id, computedPercent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedPercent]);

  const [draftTotalPages, setDraftTotalPages] = useState("");

  function handleSaveTotalPages() {
    const n = Number(draftTotalPages);
    if (item.bookTitle && n > 0) {
      setTotalPages(item.bookTitle, n);
      setTotalPagesState(n);
    }
  }

  const displayPercent = computedPercent ?? item.percent;

  return (
    <div
      className="hover-lift glass-panel flex w-56 shrink-0 flex-col gap-3 rounded-3xl border p-4 sm:w-60"
      style={{
        background: `color-mix(in srgb, ${accent.solid} 22%, var(--glass-bg))`,
        borderColor: `color-mix(in srgb, ${accent.solid} 40%, var(--glass-border))`,
      }}
    >
      <button
        type="button"
        onClick={() => {
          setDraftPercent(item.percent);
          setDraftTotalPages(totalPages ? String(totalPages) : "");
          onToggleEdit(item.id);
        }}
        className="flex items-start gap-2.5 text-left"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: accent.soft, color: accent.solid }}
        >
          <CategoryIcon kind={item.category} className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight">
            {item.title}
          </span>
          <span className="mt-0.5 block text-[11px] text-foreground/45">
            Updated {formatUpdated(item.updatedAt)}
          </span>
        </span>
      </button>

      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${displayPercent}%`, backgroundColor: accent.solid }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className="font-medium tabular-nums" style={{ color: accent.solid }}>
            {isBookItem && totalPages
              ? `${latestPage} / ${totalPages}쪽 · ${displayPercent}%`
              : `${displayPercent}%`}
          </span>
          {displayPercent < 100 && (
            <button
              type="button"
              onClick={() => onComplete(item.id)}
              className="text-foreground/45 hover:text-foreground/80"
            >
              Mark complete
            </button>
          )}
        </div>
      </div>

      {isEditing && isBookItem && (
        <div className="flex items-center gap-2 border-t border-foreground/10 pt-3">
          <input
            type="number"
            min={1}
            autoFocus
            value={draftTotalPages}
            onChange={(e) => setDraftTotalPages(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTotalPages()}
            placeholder="Total pages"
            className="flex-1 rounded-full border-0 bg-foreground/5 px-3 py-1.5 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            type="button"
            onClick={handleSaveTotalPages}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: accent.soft, color: accent.solid }}
          >
            {totalPages ? "Update" : "Save"}
          </button>
        </div>
      )}

      {isEditing && !isBookItem && (
        <div className="flex items-center gap-2 border-t border-foreground/10 pt-3">
          <input
            type="range"
            min={0}
            max={100}
            value={draftPercent}
            onChange={(e) => setDraftPercent(magneticSnap(Number(e.target.value)))}
            onMouseUp={() => onSetPercent(item.id, draftPercent)}
            onTouchEnd={() => onSetPercent(item.id, draftPercent)}
            className="h-1.5 flex-1 cursor-pointer"
            style={{ accentColor: accent.solid }}
          />
          <input
            type="number"
            min={0}
            max={100}
            value={draftPercent}
            onChange={(e) => {
              const next = Number(e.target.value);
              setDraftPercent(next);
              onSetPercent(item.id, next);
            }}
            className="w-12 rounded-full border-0 bg-foreground/5 px-1.5 py-1 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      )}
    </div>
  );
}
