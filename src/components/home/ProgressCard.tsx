"use client";

import { useEffect, useState } from "react";
import type { ProgressItem } from "@/lib/progress";
import {
  ACCENT_CHIP_SELECTED,
  CATEGORY_ACCENT,
  CATEGORY_STYLES,
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/taskCategory";
import { getLastPageForBook, recordBookProgress, registerBook } from "@/lib/books";
import { getTotalPages, setTotalPages } from "@/lib/bookMeta";
import CategoryIcon from "@/components/today/CategoryIcon";

type ProgressCardProps = {
  item: ProgressItem;
  isEditing: boolean;
  onToggleEdit: (id: string) => void;
  onSetPercent: (id: string, percent: number) => void;
  onUpdate: (
    id: string,
    updates: { title?: string; category?: TaskCategory; bookTitle?: string }
  ) => void;
  onComplete: (id: string) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 4.5 19.5 9.5 8 21H3v-5L14.5 4.5Z" />
      <path d="M12.5 6.5l5 5" />
    </svg>
  );
}

export default function ProgressCard({
  item,
  isEditing,
  onToggleEdit,
  onSetPercent,
  onUpdate,
  onComplete,
}: ProgressCardProps) {
  const accent = CATEGORY_ACCENT[item.category];
  // 슬라이더를 끌 때마다 매번 localStorage에 쓰지 않고, 손을 뗄 때만 반영
  const [draftPercent, setDraftPercent] = useState(item.percent);
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [draftCategory, setDraftCategory] = useState<TaskCategory>(item.category);
  const [draftTotalPages, setDraftTotalPages] = useState("");
  const [draftCurrentPage, setDraftCurrentPage] = useState("");

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

  // 편집 모드에서 카테고리를 "책"(DEAR Time)으로 바꾸면 자동계산 방식으로,
  // 그 반대로 바꾸면 수동 슬라이더로 전환된다 — 저장 전에도 미리보기로 바뀐다.
  const draftIsBookItem = draftCategory === "dearTime";

  function openEdit() {
    setDraftTitle(item.title);
    setDraftCategory(item.category);
    // 카드에 실제로 보이는 값(book 항목이면 자동계산된 값, 아니면 저장된
    // 값)에서 시작해야, 수동 카테고리로 바꿔 저장할 때 화면에 없던 옛날
    // 수동 값이 뜬금없이 되살아나지 않는다.
    setDraftPercent(displayPercent);
    setDraftTotalPages(totalPages ? String(totalPages) : "");
    // 이미 독서 기록이 있으면 최신 값으로 채워서(덮어쓰기 방지) 이어서
    // 수정할 수 있게 하고, 기록이 없으면 비워둔다(Total pages와 같은 패턴).
    setDraftCurrentPage(
      item.bookTitle
        ? String(getLastPageForBook(item.bookTitle) ?? "")
        : ""
    );
    onToggleEdit(item.id);
  }

  function handleCategoryPick(value: TaskCategory) {
    setDraftCategory(value);
    if (value === "dearTime") {
      const bt = draftTitle.trim() || item.bookTitle || "";
      setDraftTotalPages(bt ? String(getTotalPages(bt) ?? "") : "");
      setDraftCurrentPage(bt ? String(getLastPageForBook(bt) ?? "") : "");
    }
  }

  function handleSaveEdit() {
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle) return;
    const nextBookTitle = draftIsBookItem ? trimmedTitle : undefined;
    onUpdate(item.id, {
      title: trimmedTitle,
      category: draftCategory,
      bookTitle: nextBookTitle,
    });
    if (nextBookTitle) {
      // 독서 기록이 아직 없어도 Books 탭에 바로(빈 카드로) 뜨도록 등록해둔다.
      registerBook(nextBookTitle);
      const n = Number(draftTotalPages);
      if (n > 0) {
        setTotalPages(nextBookTitle, n);
        setTotalPagesState(n);
      }
      // "현재까지 읽은 페이지"를 실제로 바꿨을 때만 오늘 날짜로 독서 기록을
      // 만들거나 갱신한다 — 안 건드리고 그냥 저장만 했는데 매번 새 기록이
      // 쌓이는 걸 막는다.
      const priorPage = getLastPageForBook(nextBookTitle) ?? -1;
      const currentPage = Number(draftCurrentPage);
      if (
        draftCurrentPage.trim() !== "" &&
        Number.isFinite(currentPage) &&
        currentPage !== priorPage
      ) {
        recordBookProgress(nextBookTitle, currentPage);
      }
    } else {
      onSetPercent(item.id, draftPercent);
    }
    onToggleEdit(item.id);
  }

  // book 항목은 Books 탭과 같은 소스(읽은 페이지/전체 쪽수)로 계산된 값만
  // 보여준다 — 전체 쪽수를 아직 안 정했거나 실제 독서 기록이 없으면(=Books
  // 탭에도 안 뜸) 0%로 표시해서, 예전에 수동으로 입력했던 값이 남아 실제
  // 기록과 다른 값을 보여주는 일이 없게 한다.
  const displayPercent = isBookItem ? (computedPercent ?? 0) : item.percent;

  return (
    <div
      className="hover-lift glass-panel group relative flex w-56 shrink-0 flex-col gap-3 rounded-3xl border p-4 sm:w-60"
      style={{
        background: `color-mix(in srgb, ${accent.solid} 22%, var(--glass-bg))`,
        borderColor: `color-mix(in srgb, ${accent.solid} 40%, var(--glass-border))`,
      }}
    >
      <button
        type="button"
        onClick={openEdit}
        aria-label="Edit"
        className="absolute right-3 top-3 rounded-full p-1 text-foreground/40 opacity-0 transition-opacity hover:text-foreground/80 group-hover:opacity-100"
      >
        <EditIcon className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={openEdit}
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

      {isEditing && (
        <div className="flex flex-col gap-3 border-t border-foreground/10 pt-3">
          <input
            type="text"
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
            placeholder="Name"
            className="w-full rounded-full border-0 bg-foreground/5 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          <div className="flex flex-wrap gap-1.5">
            {TASK_CATEGORIES.map(({ value, label }) => {
              const style = CATEGORY_STYLES[value];
              const isSelected = draftCategory === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleCategoryPick(value)}
                  className={cx(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    isSelected
                      ? ACCENT_CHIP_SELECTED
                      : "border-transparent bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                  )}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {label}
                </button>
              );
            })}
          </div>

          {draftIsBookItem ? (
            <div className="flex flex-col gap-2">
              <input
                type="number"
                min={1}
                value={draftTotalPages}
                onChange={(e) => setDraftTotalPages(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                placeholder="Total pages"
                className="w-full rounded-full border-0 bg-foreground/5 px-3 py-1.5 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <input
                type="number"
                min={0}
                value={draftCurrentPage}
                onChange={(e) => setDraftCurrentPage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                placeholder="Current page"
                className="w-full rounded-full border-0 bg-foreground/5 px-3 py-1.5 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                value={draftPercent}
                onChange={(e) => setDraftPercent(magneticSnap(Number(e.target.value)))}
                className="h-1.5 flex-1 cursor-pointer"
                style={{ accentColor: accent.solid }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={draftPercent}
                onChange={(e) => setDraftPercent(Number(e.target.value))}
                className="w-12 rounded-full border-0 bg-foreground/5 px-1.5 py-1 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onToggleEdit(item.id)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-foreground/50 hover:text-foreground/80"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={!draftTitle.trim()}
              className="rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40"
              style={{ backgroundColor: accent.soft, color: accent.solid }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
