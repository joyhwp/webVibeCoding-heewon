"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import ProgressCard from "@/components/home/ProgressCard";
import { useProgress } from "@/hooks/useProgress";
import { getKnownBookTitles, registerBook } from "@/lib/books";
import {
  ACCENT_CHIP_SELECTED,
  CATEGORY_STYLES,
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/taskCategory";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InProgressWidget() {
  const { hasMounted, activeItems, add, setPercent, update, complete } =
    useProgress();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [percent, setInitialPercent] = useState("0");
  const [category, setCategory] = useState<TaskCategory>("project");
  const isDearTime = category === "dearTime";

  if (!hasMounted) return null;

  const knownBookTitles = getKnownBookTitles();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    // DEAR Time 카드는 항상 책 제목으로 링크해서 Books 탭(schedule.ts 기반
    // 독서 기록)과 같은 데이터로 자동계산되게 한다 — 기존에 등록된 책인지
    // 여부와 무관하게 링크해야, 나중에 Add Task로 페이지를 기록했을 때
    // (제목이 똑같으면) 곧바로 연결된다. 수동 퍼센트는 절대 받지 않는다
    // (ProgressCard의 displayPercent도 book 항목은 computedPercent만 씀).
    // 독서 기록이 아직 없어도 Books 탭에 바로(빈 카드로) 뜨도록 등록해둔다.
    const bookTitle = isDearTime ? trimmed : undefined;
    if (bookTitle) registerBook(bookTitle);
    add(trimmed, isDearTime ? 0 : Number(percent) || 0, category, bookTitle);
    setTitle("");
    setInitialPercent("0");
    setCategory("project");
    setFormOpen(false);
  }

  return (
    <div className="relative">
      {/* 배경 곳곳에 스며드는 파스텔 블롭 — 카드 안에만 색이 갇혀 보이지
          않게, 위젯 주변으로 은은하게 번지는 느낌을 준다 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10 overflow-visible"
      >
        <div
          className="float-slow absolute -left-8 top-0 h-52 w-52 rounded-full opacity-40 blur-3xl"
          style={{ backgroundColor: "var(--cat-deartime)" }}
        />
        <div
          className="float-slow absolute right-0 top-6 h-44 w-44 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "var(--cat-school)", animationDelay: "1.3s" }}
        />
        <div
          className="float-slow absolute bottom-0 left-1/3 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "var(--cat-study)", animationDelay: "2.6s" }}
        />
      </div>

      <GlassCard
        className="relative flex flex-col gap-4"
        style={{ background: "color-mix(in srgb, var(--glass-bg) 65%, transparent)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">In Progress</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/archive"
              className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/55 transition-colors hover:bg-foreground/10 hover:text-foreground/80"
            >
              Archive
            </Link>
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="rounded-full bg-blue-600/10 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-600/20 dark:bg-blue-400/15 dark:text-blue-300 dark:hover:bg-blue-400/25"
            >
              {formOpen ? "Cancel" : "+ New"}
            </button>
          </div>
        </div>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 rounded-2xl bg-foreground/5 p-4"
          >
            <div className="flex flex-col gap-1.5 sm:flex-row">
              <input
                type="text"
                list="progress-book-titles"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you working on?"
                required
                className="glass-panel flex-1 rounded-xl border-0 px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
              />
              <datalist id="progress-book-titles">
                {knownBookTitles.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {!isDearTime && (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={percent}
                  onChange={(e) => setInitialPercent(e.target.value)}
                  placeholder="%"
                  className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 sm:w-20"
                />
              )}
            </div>

            {isDearTime && (
              <p className="text-xs text-foreground/45">
                Percent is calculated automatically from your DEAR Time
                reading log (Add Task below) — set total pages on the card
                once you&apos;ve added one.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {TASK_CATEGORIES.map(({ value, label }) => {
                const style = CATEGORY_STYLES[value];
                const isSelected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={cx(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isSelected
                        ? ACCENT_CHIP_SELECTED
                        : "border-transparent bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                    )}
                  >
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    {label}
                  </button>
                );
              })}
            </div>

            <GlassButton type="submit" className="self-start">
              Add
            </GlassButton>
          </form>
        )}

        {activeItems.length === 0 ? (
          <p className="text-sm text-foreground/50">
            Nothing in progress yet — add a project, a course, or a book to
            track.
          </p>
        ) : (
          // overflow-x-auto가 걸린 요소는 CSS 스펙상 overflow-y도 (설정하지
          // 않아도) 자동으로 클리핑된다 — hover 시 커지는 카드 그림자/lift가
          // 위아래로 잘리는 원인. 세로로 여유 패딩을 주고 같은 크기의 음수
          // 마진으로 상쇄해서, 바깥 레이아웃 간격은 그대로 두면서 그림자가
          // 번질 여백만 확보한다.
          <div className="-mx-1 -my-8 flex items-start gap-3 overflow-x-auto px-1 py-8">
            {activeItems.map((item) => (
              <ProgressCard
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                onToggleEdit={(id) =>
                  setEditingId((cur) => (cur === id ? null : id))
                }
                onSetPercent={setPercent}
                onUpdate={update}
                onComplete={complete}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
