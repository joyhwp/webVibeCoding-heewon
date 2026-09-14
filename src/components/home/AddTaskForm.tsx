"use client";

import { useState, type FormEvent } from "react";
import GlassButton from "@/components/ui/GlassButton";
import {
  ACCENT_CHIP_SELECTED,
  CATEGORY_STYLES,
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/taskCategory";
import { toMinutes, minutesToLabel } from "@/lib/time";
import type { BookProgress } from "@/lib/schedule";
import { formatBookTask, getKnownBookTitles, getLastPageForBook } from "@/lib/books";

// 30분 단위 소요 시간 선택지(시간 단위 값)
const DURATION_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8];

function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/** 시작 시간에 소요 시간(시간 단위)을 더해 종료 시간("HH:mm")을 계산한다.
 * 자정을 넘어가면(당일 블록만 지원하므로) 23:59로 clamp한다. */
function addDuration(startTime: string, durationHours: number): string {
  const endMin = Math.round(toMinutes(startTime) + durationHours * 60);
  return minutesToLabel(Math.min(endMin, 23 * 60 + 59));
}

type AddTaskFormProps = {
  /** 오늘 날짜 키("YYYY-MM-DD") — 날짜 입력의 기본값 */
  todayKey: string;
  onAdd: (
    dateKey: string,
    startTime: string,
    endTime: string | undefined,
    task: string,
    category: TaskCategory,
    book?: BookProgress
  ) => void;
};

function defaultTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AddTaskForm({ todayKey, onAdd }: AddTaskFormProps) {
  const [date, setDate] = useState(todayKey);
  const [startTime, setStartTime] = useState(defaultTime);
  const [duration, setDuration] = useState("");
  const [task, setTask] = useState("");
  const [category, setCategory] = useState<TaskCategory>("personal");

  // DEAR Time 전용 필드 — 카테고리가 "dearTime"일 때만 쓰인다
  const [bookTitle, setBookTitle] = useState("");
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const isDearTime = category === "dearTime";
  const knownBookTitles = isDearTime ? getKnownBookTitles() : [];

  // 같은 책 제목이 이전에 등록된 적 있으면 시작 페이지를 "이전 종료 페이지 + 1"로 자동완성.
  // (useEffect가 아니라 입력 시점에 바로 계산 — 파생 상태를 effect로 동기화하지 않는다.)
  function handleBookTitleChange(value: string) {
    setBookTitle(value);
    const lastPage = getLastPageForBook(value);
    if (lastPage != null) setStartPage(String(lastPage + 1));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!startTime || !date) return;
    const endTime = duration
      ? addDuration(startTime, Number(duration))
      : undefined;

    if (isDearTime) {
      const title = bookTitle.trim();
      const start = Number(startPage);
      if (!title || !startPage || Number.isNaN(start)) return;
      const end = endPage ? Number(endPage) : undefined;
      if (endPage && Number.isNaN(end)) return;
      const book = { title, startPage: start, endPage: end };
      onAdd(date, startTime, endTime, formatBookTask(book), category, book);
      setBookTitle("");
      setStartPage("");
      setEndPage("");
    } else {
      const trimmed = task.trim();
      if (!trimmed) return;
      onAdd(date, startTime, endTime, trimmed, category);
      setTask("");
    }
    setDuration("");
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-semibold tracking-tight">
        Add Task
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="task-date"
            className="text-xs font-medium text-foreground/60"
          >
            Date
          </label>
          <input
            id="task-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              htmlFor="task-start"
              className="text-xs font-medium text-foreground/60"
            >
              Start Time
            </label>
            <input
              id="task-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              htmlFor="task-duration"
              className="text-xs font-medium text-foreground/60"
            >
              Duration <span className="text-foreground/35">(optional)</span>
            </label>
            <select
              id="task-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
            >
              <option value="">None</option>
              {DURATION_OPTIONS.map((hours) => (
                <option key={hours} value={hours}>
                  {formatDuration(hours)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground/60">
            Category
          </span>
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
        </div>

        {isDearTime ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="task-book-title"
                className="text-xs font-medium text-foreground/60"
              >
                Book
              </label>
              <input
                id="task-book-title"
                type="text"
                list="known-book-titles"
                value={bookTitle}
                onChange={(e) => handleBookTitleChange(e.target.value)}
                placeholder="Book title"
                required
                className="glass-panel rounded-xl border-0 px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
              />
              <datalist id="known-book-titles">
                {knownBookTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <label
                  htmlFor="task-start-page"
                  className="text-xs font-medium text-foreground/60"
                >
                  Start Page
                </label>
                <input
                  id="task-start-page"
                  type="number"
                  min={1}
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  required
                  className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label
                  htmlFor="task-end-page"
                  className="text-xs font-medium text-foreground/60"
                >
                  End Page{" "}
                  <span className="text-foreground/35">(optional)</span>
                </label>
                <input
                  id="task-end-page"
                  type="number"
                  min={1}
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-text"
              className="text-xs font-medium text-foreground/60"
            >
              Task
            </label>
            <input
              id="task-text"
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What do you need to do?"
              required
              className="glass-panel rounded-xl border-0 px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30"
            />
          </div>
        )}

        <GlassButton type="submit" className="mt-2 self-start">
          Add
        </GlassButton>
      </form>
    </div>
  );
}
