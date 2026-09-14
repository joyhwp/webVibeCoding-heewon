"use client";

import { useState } from "react";
import PostponePopover from "@/components/home/PostponePopover";

export type DayEventRowData = {
  id: string;
  kind: "class" | "task";
  /** task만 의미 있음 — 실제로 저장돼 있는 날짜 버킷 */
  originDateKey: string;
  startTime?: string; // 없으면 종일
  endTime?: string;
  title: string;
  subtitle?: string; // class의 강의실/교수 등
  dotClass: string;
  completed?: boolean; // task만 해당
  /** class만 해당 — 이 날짜에 휴강 처리됐는지 */
  cancelled?: boolean;
  /** 종일 멀티데이 task일 때만: "Sep 11 – Sep 12" 같은 표시용 라벨 */
  rangeLabel?: string;
};

type DayEventRowProps = {
  entry: DayEventRowData;
  dateKey: string;
  onToggleComplete: (id: string, originDateKey: string) => void;
  onRemoveTask: (id: string, originDateKey: string) => void;
  onCancelClass: (entry: DayEventRowData) => void;
  /** 휴강 표시된 수업을 클릭해 다시 정상 상태로 되돌릴 때 */
  onRestoreClass: (entry: DayEventRowData) => void;
  onPostpone: (
    id: string,
    originDateKey: string,
    toDateKey: string,
    newStartTime: string | undefined,
    newEndTime: string | undefined
  ) => void;
};

const CONTROL_BTN =
  "rounded-full px-1 text-[11px] leading-none text-foreground/50 hover:text-foreground/80";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** calendar 탭 선택된 날짜의 일정 한 줄 — home 탭의 TimelineEntry/AllDayRow와
 * 같은 시각 언어를 쓰지만, 절대 위치 그리드가 아니라 평범한 목록 흐름으로 표시한다. */
export default function DayEventRow({
  entry,
  dateKey,
  onToggleComplete,
  onRemoveTask,
  onCancelClass,
  onRestoreClass,
  onPostpone,
}: DayEventRowProps) {
  const [postponeOpen, setPostponeOpen] = useState(false);
  const isTask = entry.kind === "task";
  const isCancelledClass = entry.kind === "class" && Boolean(entry.cancelled);
  const completed = Boolean(entry.completed);

  return (
    <div
      className={cx(
        "group relative flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-foreground/5",
        isCancelledClass && "cursor-pointer opacity-60"
      )}
      role={isCancelledClass ? "button" : undefined}
      tabIndex={isCancelledClass ? 0 : undefined}
      title={isCancelledClass ? "클릭하면 휴강을 취소합니다" : undefined}
      onClick={isCancelledClass ? () => onRestoreClass(entry) : undefined}
      onKeyDown={
        isCancelledClass
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRestoreClass(entry);
              }
            }
          : undefined
      }
    >
      {isTask ? (
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggleComplete(entry.id, entry.originDateKey)}
          aria-label="Mark complete"
          className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer accent-blue-600"
        />
      ) : (
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${entry.dotClass}`}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={cx(
              "truncate text-sm",
              completed || isCancelledClass
                ? "text-foreground/35 line-through"
                : "text-foreground"
            )}
          >
            {entry.title}
          </p>
          {isCancelledClass && (
            <span className="shrink-0 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-foreground/50">
              휴강
            </span>
          )}
        </div>
        {entry.subtitle && (
          <p className="truncate text-xs text-foreground/45">
            {entry.subtitle}
          </p>
        )}
        <p className="text-xs text-foreground/45">
          {entry.rangeLabel
            ? entry.rangeLabel
            : entry.startTime
              ? `${entry.startTime}${entry.endTime ? `–${entry.endTime}` : ""}`
              : "All day"}
        </p>
      </div>
      <div
        className={cx(
          "relative flex shrink-0 items-center gap-0.5 pt-0.5 transition-opacity",
          postponeOpen || isCancelledClass
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        )}
      >
        {isTask && (
          <button
            type="button"
            onClick={() => setPostponeOpen((v) => !v)}
            aria-label="Postpone"
            className={CONTROL_BTN}
          >
            ↷
          </button>
        )}
        {isTask ? (
          <button
            type="button"
            onClick={() => onRemoveTask(entry.id, entry.originDateKey)}
            aria-label="Delete"
            className={CONTROL_BTN}
          >
            ✕
          </button>
        ) : isCancelledClass ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // 부모 row의 클릭(복구)과 중복 실행되지 않게
              onRestoreClass(entry);
            }}
            aria-label="Restore class"
            className={CONTROL_BTN}
          >
            ↺
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCancelClass(entry)}
            aria-label="Cancel class"
            className={CONTROL_BTN}
          >
            ✕
          </button>
        )}
        {postponeOpen && isTask && (
          <PostponePopover
            todayKey={dateKey}
            startTime={entry.startTime}
            endTime={entry.endTime}
            onSubmit={(date, start, end) => {
              onPostpone(entry.id, entry.originDateKey, date, start, end);
              setPostponeOpen(false);
            }}
            onClose={() => setPostponeOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
