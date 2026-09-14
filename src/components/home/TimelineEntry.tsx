"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import PostponePopover from "@/components/home/PostponePopover";
import { minutesToLabel } from "@/lib/time";

export type TimelineEntryData = {
  id: string;
  kind: "class" | "task";
  /** 항목이 실제로 저장돼 있는 날짜 버킷 (완료/삭제/미루기에 사용) */
  originDateKey: string;
  startMin: number;
  endMin: number | null; // null = 종료 시간 없는 point(점) 항목
  title: string;
  subtitle?: string;
  dotClass: string;
  blockClass: string;
  completed?: boolean; // task만 해당
  /** class만 해당 — 오늘 이 수업이 휴강 처리됐는지 (getClassesForDay가 채워줌) */
  cancelled?: boolean;
};

type TimelineEntryProps = {
  entry: TimelineEntryData;
  top: number;
  height?: number;
  laneStyle: { left: string; width: string };
  isPast: boolean;
  todayKey: string;
  onRemove?: (id: string, originDateKey: string) => void;
  onToggleComplete?: (id: string, originDateKey: string) => void;
  onPostpone?: (
    id: string,
    originDateKey: string,
    toDateKey: string,
    newStartTime: string | undefined,
    newEndTime: string | undefined
  ) => void;
  /** 휴강 표시된 수업을 클릭해 다시 정상 상태로 되돌릴 때 (id = classId) */
  onUncancelClass?: (id: string, originDateKey: string) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const CONTROL_BTN =
  "rounded-full px-1 text-[11px] leading-none text-foreground/50 hover:text-foreground/80";

export default function TimelineEntry({
  entry,
  top,
  height,
  laneStyle,
  isPast,
  todayKey,
  onRemove,
  onToggleComplete,
  onPostpone,
  onUncancelClass,
}: TimelineEntryProps) {
  const [postponeOpen, setPostponeOpen] = useState(false);
  const isTask = entry.kind === "task";
  const isCancelledClass = entry.kind === "class" && Boolean(entry.cancelled);
  const completed = Boolean(entry.completed);
  const dimmed = isPast || completed || isCancelledClass;

  const controlsClass = cx(
    "relative flex shrink-0 items-center gap-0.5 transition-opacity",
    postponeOpen ? "opacity-100" : "opacity-40 group-hover:opacity-100"
  );

  function handlePostponeSubmit(
    date: string,
    start: string | undefined,
    end: string | undefined
  ) {
    onPostpone?.(entry.id, entry.originDateKey, date, start, end);
    setPostponeOpen(false);
  }

  // 종료 시간이 없는 point(점) 항목
  if (entry.endMin == null) {
    return (
      <ScrollReveal
        className="group absolute flex items-center gap-2"
        style={{ ...laneStyle, top, zIndex: postponeOpen ? 40 : 10 }}
      >
        {isTask && (
          <input
            type="checkbox"
            checked={completed}
            onChange={() => onToggleComplete?.(entry.id, entry.originDateKey)}
            aria-label="Mark complete"
            className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-blue-600 opacity-40 transition-opacity group-hover:opacity-100"
          />
        )}
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            dimmed ? "bg-foreground/20" : entry.dotClass
          }`}
        />
        <span
          className={`shrink-0 text-[11px] tabular-nums ${
            dimmed ? "text-foreground/30" : "text-foreground/50"
          }`}
        >
          {minutesToLabel(entry.startMin)}
        </span>
        <span
          className={cx(
            "flex-1 truncate text-sm",
            completed
              ? "text-foreground/35 line-through"
              : isPast
                ? "text-foreground/35"
                : "text-foreground"
          )}
        >
          {entry.title}
        </span>
        {isTask && (
          <div className={controlsClass}>
            <button
              type="button"
              onClick={() => setPostponeOpen((v) => !v)}
              aria-label="Postpone"
              className={CONTROL_BTN}
            >
              ↷
            </button>
            <button
              type="button"
              onClick={() => onRemove?.(entry.id, entry.originDateKey)}
              aria-label="Delete"
              className={CONTROL_BTN}
            >
              ✕
            </button>
            {postponeOpen && (
              <PostponePopover
                todayKey={todayKey}
                startTime={minutesToLabel(entry.startMin)}
                endTime=""
                onSubmit={handlePostponeSubmit}
                onClose={() => setPostponeOpen(false)}
              />
            )}
          </div>
        )}
      </ScrollReveal>
    );
  }

  // 종료 시간이 있는 block(기간) 항목
  return (
    <ScrollReveal
      className={cx(
        "group absolute rounded-lg border px-3 py-1.5 text-xs transition-opacity",
        entry.blockClass,
        dimmed && "opacity-40",
        isCancelledClass && "cursor-pointer hover:opacity-60"
      )}
      style={{ ...laneStyle, top, height, zIndex: postponeOpen ? 40 : 10 }}
      role={isCancelledClass ? "button" : undefined}
      tabIndex={isCancelledClass ? 0 : undefined}
      title={isCancelledClass ? "클릭하면 휴강을 취소합니다" : undefined}
      onClick={
        isCancelledClass
          ? () => onUncancelClass?.(entry.id, entry.originDateKey)
          : undefined
      }
      onKeyDown={
        isCancelledClass
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onUncancelClass?.(entry.id, entry.originDateKey);
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 items-start gap-1.5">
          {isTask && (
            <input
              type="checkbox"
              checked={completed}
              onChange={() => onToggleComplete?.(entry.id, entry.originDateKey)}
              aria-label="Mark complete"
              className="mt-0.5 h-3 w-3 shrink-0 cursor-pointer accent-blue-600 opacity-50 transition-opacity group-hover:opacity-100"
            />
          )}
          <p
            className={cx(
              "truncate font-medium leading-tight",
              (completed || isCancelledClass) && "line-through"
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
        {isTask && (
          <div className={controlsClass}>
            <button
              type="button"
              onClick={() => setPostponeOpen((v) => !v)}
              aria-label="Postpone"
              className={CONTROL_BTN}
            >
              ↷
            </button>
            <button
              type="button"
              onClick={() => onRemove?.(entry.id, entry.originDateKey)}
              aria-label="Delete"
              className={CONTROL_BTN}
            >
              ✕
            </button>
            {postponeOpen && (
              <PostponePopover
                todayKey={todayKey}
                startTime={minutesToLabel(entry.startMin)}
                endTime={minutesToLabel(entry.endMin)}
                onSubmit={handlePostponeSubmit}
                onClose={() => setPostponeOpen(false)}
              />
            )}
          </div>
        )}
      </div>
      {entry.subtitle && (
        <p className="truncate text-[11px] opacity-70">{entry.subtitle}</p>
      )}
      <p className="text-[11px] opacity-60">
        {minutesToLabel(entry.startMin)}–{minutesToLabel(entry.endMin)}
      </p>
    </ScrollReveal>
  );
}
