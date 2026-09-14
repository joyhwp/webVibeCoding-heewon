"use client";

import { useState, type FormEvent } from "react";
import { parseQuickAddText } from "@/lib/llmTaskParser";
import { getClassesForDay } from "@/lib/classSchedule";
import { cancelClassForDate } from "@/lib/classOverrides";
import { addItem, loadDay, moveItem } from "@/lib/schedule";
import { moveClassCancelToTrash, moveTaskToTrash, restoreFromTrash } from "@/lib/trash";
import { showUndoToast } from "@/lib/toastBus";
import { minutesToLabel, toMinutes } from "@/lib/time";
import {
  ACCENT_CHIP_SELECTED,
  CATEGORY_STYLES,
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/taskCategory";

type QuickAddBarProps = {
  todayKey: string;
  /** schedule.ts를 훅을 거치지 않고 직접 건드린 뒤 오늘의 items를 다시 읽게 함 */
  onScheduleChanged: () => void;
  /** classOverrides를 건드린 뒤 오늘의 수업 목록을 다시 읽게 함 */
  onClassChanged: () => void;
};

type Candidate = {
  kind: "class" | "task";
  id: string;
  dateKey: string;
  title: string;
  startTime?: string; // 없으면 종일
  endTime?: string;
};

type Stage =
  | { type: "idle" }
  | { type: "error"; message: string }
  | {
      type: "disambiguate";
      intent: "cancel" | "modify";
      candidates: Candidate[];
      newDateKey?: string;
      newStartTime?: string;
      category: TaskCategory;
    }
  | {
      type: "confirm-add";
      dateKey: string;
      endDateKey?: string; // 멀티데이 종일 일정일 때만
      startTime?: string; // 없으면 종일
      endTime?: string;
      title: string;
      category: TaskCategory;
    }
  | { type: "confirm-cancel"; candidate: Candidate }
  | {
      type: "confirm-modify";
      candidate: Candidate;
      newDateKey: string;
      newStartTime?: string;
      category: TaskCategory;
    };

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getCandidatesForDate(dateKey: string): Candidate[] {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  const classes: Candidate[] = getClassesForDay(dayOfWeek, dateKey).map(
    (c) => ({
      kind: "class",
      id: c.id,
      dateKey,
      title: c.subject,
      startTime: c.startTime,
      endTime: c.endTime,
    })
  );
  const tasks: Candidate[] = loadDay(dateKey).map((t) => ({
    kind: "task",
    id: t.id,
    dateKey,
    title: t.task,
    startTime: t.startTime,
    endTime: t.endTime,
  }));
  return [...classes, ...tasks].sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? "")
  );
}

/** 시작 시간이 바뀔 때, 원래 있던 기간(duration)을 그대로 유지해서 새 종료 시간을 계산 */
function shiftEndTime(
  originalStart: string | undefined,
  originalEnd: string | undefined,
  newStart: string | undefined
): string | undefined {
  if (!originalStart || !originalEnd || !newStart) return undefined;
  const duration = toMinutes(originalEnd) - toMinutes(originalStart);
  return minutesToLabel(toMinutes(newStart) + Math.max(0, duration));
}

const fieldClass =
  "rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium transition-colors";

export default function QuickAddBar({
  todayKey,
  onScheduleChanged,
  onClassChanged,
}: QuickAddBarProps) {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>({ type: "idle" });
  // /api/parse-task(Claude API) 호출은 규칙 기반 파싱과 달리 즉시 끝나지
  // 않을 수 있어서, 응답을 기다리는 동안 입력창 옆에 로딩 인디케이터를 보여준다.
  const [isLoading, setIsLoading] = useState(false);

  function reset() {
    setText("");
    setStage({ type: "idle" });
  }

  function handleChange(value: string) {
    setText(value);
    if (stage.type !== "idle") setStage({ type: "idle" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const [y, m, d] = todayKey.split("-").map(Number);
    setIsLoading(true);
    let parsed;
    try {
      parsed = await parseQuickAddText(trimmed, new Date(y, m - 1, d));
    } finally {
      setIsLoading(false);
    }

    if (parsed.intent === "unknown") {
      setStage({
        type: "error",
        message:
          "Couldn't quite parse that — try including a name and, if relevant, a date or time.",
      });
      return;
    }

    if (parsed.intent === "add") {
      setStage({
        type: "confirm-add",
        dateKey: parsed.dateKey,
        endDateKey: parsed.endDateKey,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        title: parsed.title,
        category: parsed.category,
      });
      return;
    }

    // cancel / modify: 이름이 매칭되는 항목을 찾는다
    const all = getCandidatesForDate(parsed.dateKey);
    const fragment = parsed.nameFragment.toLowerCase();
    const matches = all.filter((c) =>
      c.title.toLowerCase().includes(fragment)
    );
    const pool = matches.length > 0 ? matches : all;

    if (pool.length === 0) {
      setStage({
        type: "error",
        message: `No events found on ${formatDateLabel(parsed.dateKey)} to match against.`,
      });
      return;
    }

    if (pool.length === 1) {
      resolveTarget(
        pool[0],
        parsed.intent,
        parsed.newDateKey,
        parsed.newStartTime,
        parsed.category
      );
      return;
    }

    setStage({
      type: "disambiguate",
      intent: parsed.intent,
      candidates: pool,
      newDateKey: parsed.newDateKey,
      newStartTime: parsed.newStartTime,
      category: parsed.category,
    });
  }

  function resolveTarget(
    candidate: Candidate,
    intent: "cancel" | "modify",
    newDateKey: string | undefined,
    newStartTime: string | undefined,
    category: TaskCategory
  ) {
    if (intent === "cancel") {
      setStage({ type: "confirm-cancel", candidate });
      return;
    }
    // 수업을 수정하는 경우, 새로 생기는 항목은 일단 "School"로 기본 추정
    // (텍스트에서 더 뚜렷한 카테고리 키워드가 잡히지 않았다면)
    const inferredCategory =
      candidate.kind === "class" && category === "personal"
        ? "school"
        : category;
    setStage({
      type: "confirm-modify",
      candidate,
      newDateKey: newDateKey ?? candidate.dateKey,
      newStartTime: newStartTime ?? candidate.startTime,
      category: inferredCategory,
    });
  }

  function updateCategory(category: TaskCategory) {
    setStage((s) => {
      if (s.type === "confirm-add") return { ...s, category };
      if (s.type === "confirm-modify") return { ...s, category };
      return s;
    });
  }

  function updateTitle(title: string) {
    setStage((s) => (s.type === "confirm-add" ? { ...s, title } : s));
  }

  function commit() {
    if (stage.type === "confirm-add") {
      addItem(
        stage.dateKey,
        stage.startTime,
        stage.endTime,
        stage.title,
        stage.category,
        stage.endDateKey
      );
      onScheduleChanged();
    } else if (stage.type === "confirm-cancel") {
      const { candidate } = stage;
      if (candidate.kind === "class") {
        const trashId = moveClassCancelToTrash(
          candidate.dateKey,
          candidate.id,
          candidate.title,
          candidate.startTime ?? "",
          candidate.endTime ?? ""
        );
        onClassChanged();
        showUndoToast(`"${candidate.title}" cancelled`, () => {
          restoreFromTrash(trashId);
          onClassChanged();
        });
      } else {
        const item = loadDay(candidate.dateKey).find(
          (i) => i.id === candidate.id
        );
        if (item) {
          const trashId = moveTaskToTrash(candidate.dateKey, item);
          onScheduleChanged();
          showUndoToast(`"${candidate.title}" deleted`, () => {
            restoreFromTrash(trashId);
            onScheduleChanged();
          });
        }
      }
    } else if (stage.type === "confirm-modify") {
      const { candidate, newDateKey, newStartTime, category } = stage;
      const newEndTime = shiftEndTime(
        candidate.startTime,
        candidate.endTime,
        newStartTime
      );
      if (candidate.kind === "class") {
        // 반복 수업의 특정 날짜만 제외하고, 새 날짜/시간에 일회성 항목으로 추가
        cancelClassForDate(candidate.dateKey, candidate.id);
        addItem(newDateKey, newStartTime, newEndTime, candidate.title, category);
        onClassChanged();
        onScheduleChanged();
      } else {
        moveItem(
          candidate.dateKey,
          candidate.id,
          newDateKey,
          newStartTime,
          newEndTime
        );
        onScheduleChanged();
      }
    }
    reset();
  }

  const showCategoryPicker =
    stage.type === "confirm-add" || stage.type === "confirm-modify";
  const selectedCategory =
    stage.type === "confirm-add" || stage.type === "confirm-modify"
      ? stage.category
      : null;

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold tracking-tight">Quick Add</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative w-full">
          <input
            type="text"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isLoading}
            placeholder='Try "내일 오후 3시 스터디" or "오늘 운영체제 휴강"'
            className="glass-panel w-full rounded-xl border-0 px-4 py-2.5 pr-9 text-sm outline-none placeholder:text-foreground/35 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-60 dark:focus:ring-blue-400/30"
          />
          {isLoading && (
            <span
              aria-label="Parsing…"
              role="status"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-foreground/20 border-t-blue-500"
            />
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="shrink-0 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Go
        </button>
      </form>

      {stage.type === "error" && (
        <p className="mt-3 text-xs text-rose-500">{stage.message}</p>
      )}

      {stage.type === "disambiguate" && (
        <div className="mt-3 rounded-xl bg-foreground/5 p-3">
          <p className="mb-2 text-xs font-medium text-foreground/60">
            Which one did you mean?
          </p>
          <div className="flex flex-col gap-1.5">
            {stage.candidates.map((c) => (
              <button
                key={`${c.kind}-${c.id}`}
                type="button"
                onClick={() =>
                  resolveTarget(
                    c,
                    stage.intent,
                    stage.newDateKey,
                    stage.newStartTime,
                    stage.category
                  )
                }
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-foreground/5"
              >
                <span className="truncate">{c.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-foreground/45">
                  {c.startTime
                    ? `${c.startTime}${c.endTime ? `–${c.endTime}` : ""}`
                    : "All day"}{" "}
                  · {c.kind === "class" ? "Class" : "Task"}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-xs text-foreground/45 hover:text-foreground/70"
          >
            Cancel
          </button>
        </div>
      )}

      {(stage.type === "confirm-add" ||
        stage.type === "confirm-cancel" ||
        stage.type === "confirm-modify") && (
        <div className="mt-3 rounded-xl bg-blue-500/[0.06] p-3">
          <div className="text-sm text-foreground">
            {stage.type === "confirm-add" && (
              <ConfirmAddSummary
                dateKey={stage.dateKey}
                endDateKey={stage.endDateKey}
                startTime={stage.startTime}
                endTime={stage.endTime}
                title={stage.title}
                onTitleChange={updateTitle}
              />
            )}
            {stage.type === "confirm-cancel" && (
              <p>
                Here&apos;s what I&apos;ll do:{" "}
                <strong className="font-semibold">
                  {stage.candidate.kind === "class" ? "Cancel" : "Delete"}{" "}
                  &ldquo;{stage.candidate.title}&rdquo;
                </strong>{" "}
                on {formatDateLabel(stage.candidate.dateKey)}.
              </p>
            )}
            {stage.type === "confirm-modify" && (
              <p>
                Here&apos;s what I&apos;ll do:{" "}
                <strong className="font-semibold">
                  Move &ldquo;{stage.candidate.title}&rdquo;
                </strong>{" "}
                from {formatDateLabel(stage.candidate.dateKey)}{" "}
                {stage.candidate.startTime ?? "All day"} to{" "}
                {formatDateLabel(stage.newDateKey)}{" "}
                {stage.newStartTime ?? "All day"}.
              </p>
            )}
          </div>

          {showCategoryPicker && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TASK_CATEGORIES.map(({ value, label }) => {
                const style = CATEGORY_STYLES[value];
                const isSelected = selectedCategory === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateCategory(value)}
                    className={cx(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
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
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              className={`${fieldClass} text-foreground/55 hover:text-foreground/80`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commit}
              className="rounded-full bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmAddSummary({
  dateKey,
  endDateKey,
  startTime,
  endTime,
  title,
  onTitleChange,
}: {
  dateKey: string;
  endDateKey?: string;
  startTime?: string;
  endTime?: string;
  title: string;
  onTitleChange: (title: string) => void;
}) {
  const whenLabel = endDateKey
    ? `${formatDateLabel(dateKey)} – ${formatDateLabel(endDateKey)}, All day`
    : startTime
      ? `${formatDateLabel(dateKey)} at ${startTime}${endTime ? `–${endTime}` : ""}`
      : `${formatDateLabel(dateKey)}, All day`;

  return (
    <p>
      Here&apos;s what I&apos;ll do:{" "}
      <span className="inline-flex items-baseline gap-1">
        Add{" "}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Edit title"
          className="min-w-0 rounded-md border-0 border-b border-dashed border-foreground/25 bg-transparent px-0.5 py-0 font-semibold text-foreground outline-none focus:border-blue-500"
          style={{ width: `${Math.max(4, title.length + 1)}ch` }}
        />
      </span>{" "}
      on {whenLabel}.
    </p>
  );
}
