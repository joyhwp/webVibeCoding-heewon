"use client";

import type { ClassSession } from "@/lib/classSchedule";
import type { TimelineTask } from "@/hooks/useSchedule";
import {
  CATEGORY_STYLES,
  CLASS_BLOCK_STYLE,
  CLASS_DOT_STYLE,
  TASK_CATEGORIES,
} from "@/lib/taskCategory";
import { minutesToLabel, toMinutes } from "@/lib/time";
import TimelineEntry, {
  type TimelineEntryData,
} from "@/components/home/TimelineEntry";
import AllDayRow, { type AllDayEntryData } from "@/components/home/AllDayRow";

type TimelineProps = {
  tasks: TimelineTask[];
  classes: ClassSession[]; // 오늘 요일의 수업만 미리 필터링해서 전달
  now: Date;
  todayKey: string;
  onRemove: (id: string, originDateKey: string) => void;
  onToggleComplete: (id: string, originDateKey: string) => void;
  onPostpone: (
    id: string,
    originDateKey: string,
    toDateKey: string,
    newStartTime: string | undefined,
    newEndTime: string | undefined
  ) => void;
  /** 휴강 표시된 수업을 클릭해 다시 정상 상태로 되돌릴 때 (id = classId) */
  onUncancelClass: (id: string, originDateKey: string) => void;
};

const PX_PER_MIN = 1.2; // 1분당 픽셀 (1시간 = 72px)
const DEFAULT_RANGE_START = 8 * 60; // 08:00
const DEFAULT_RANGE_END = 22 * 60; // 22:00
const MIN_BLOCK_HEIGHT = 56;

function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

export default function Timeline({
  tasks,
  classes,
  now,
  todayKey,
  onRemove,
  onToggleComplete,
  onPostpone,
  onUncancelClass,
}: TimelineProps) {
  const timedTasks = tasks.filter((t) => t.startTime);
  const allDayTasks = tasks.filter((t) => !t.startTime);

  const classEntries: TimelineEntryData[] = classes.map((c) => ({
    id: c.id,
    kind: "class",
    originDateKey: todayKey,
    startMin: toMinutes(c.startTime),
    endMin: toMinutes(c.endTime),
    title: c.subject,
    subtitle: [c.room, c.professor].filter(Boolean).join(" · "),
    dotClass: CLASS_DOT_STYLE,
    blockClass: CLASS_BLOCK_STYLE,
    cancelled: c.cancelled,
  }));

  const taskEntries: TimelineEntryData[] = timedTasks.map((t) => {
    const style = CATEGORY_STYLES[t.category];
    return {
      id: t.id,
      kind: "task",
      originDateKey: t.originDateKey,
      startMin: toMinutes(t.startTime as string),
      endMin: t.endTime ? toMinutes(t.endTime) : null,
      title: t.task,
      dotClass: style.dot,
      blockClass: style.block,
      completed: t.completed,
    };
  });

  const allDayEntries: AllDayEntryData[] = allDayTasks.map((t) => ({
    id: t.id,
    originDateKey: t.originDateKey,
    title: t.task,
    dotClass: CATEGORY_STYLES[t.category].dot,
    completed: t.completed,
    rangeLabel: t.allDayEndDateKey
      ? `${formatShortDate(t.originDateKey)} – ${formatShortDate(t.allDayEndDateKey)}`
      : undefined,
  }));

  const allEntries = [...classEntries, ...taskEntries].sort(
    (a, b) => a.startMin - b.startMin
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold tracking-tight">
          Today&apos;s Timeline
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground/50">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${CLASS_DOT_STYLE}`} />
            Class
          </span>
          {TASK_CATEGORIES.map(({ value, label }) => (
            <span key={value} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[value].dot}`}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      {allDayEntries.length > 0 && (
        <div className="mb-5 flex flex-col gap-1 border-b border-foreground/10 pb-5">
          <p className="mb-1 px-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground/40">
            All Day
          </p>
          {allDayEntries.map((entry) => (
            <AllDayRow
              key={entry.id}
              entry={entry}
              todayKey={todayKey}
              onRemove={onRemove}
              onToggleComplete={onToggleComplete}
              onPostpone={onPostpone}
            />
          ))}
        </div>
      )}

      {allEntries.length === 0 ? (
        allDayEntries.length === 0 ? (
          <p className="text-sm text-foreground/50">No events yet.</p>
        ) : null
      ) : (
        <TimelineGrid
          entries={allEntries}
          now={now}
          todayKey={todayKey}
          onRemove={onRemove}
          onToggleComplete={onToggleComplete}
          onPostpone={onPostpone}
          onUncancelClass={onUncancelClass}
        />
      )}
    </div>
  );
}

function TimelineGrid({
  entries,
  now,
  todayKey,
  onRemove,
  onToggleComplete,
  onPostpone,
  onUncancelClass,
}: {
  entries: TimelineEntryData[];
  now: Date;
  todayKey: string;
  onRemove: (id: string, originDateKey: string) => void;
  onToggleComplete: (id: string, originDateKey: string) => void;
  onPostpone: (
    id: string,
    originDateKey: string,
    toDateKey: string,
    newStartTime: string | undefined,
    newEndTime: string | undefined
  ) => void;
  onUncancelClass: (id: string, originDateKey: string) => void;
}) {
  const allTimes = entries.flatMap((e) =>
    e.endMin != null ? [e.startMin, e.endMin] : [e.startMin]
  );
  const rangeStart =
    Math.floor(Math.min(DEFAULT_RANGE_START, ...allTimes) / 60) * 60;
  const rangeEnd =
    Math.ceil(Math.max(DEFAULT_RANGE_END, ...allTimes) / 60) * 60;
  const totalHeight = (rangeEnd - rangeStart) * PX_PER_MIN;

  const hourMarks: number[] = [];
  for (let m = rangeStart; m <= rangeEnd; m += 60) hourMarks.push(m);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMin >= rangeStart && nowMin <= rangeEnd;

  return (
    <div className="flex" style={{ height: totalHeight }}>
      {/* 시간 눈금 */}
      <div className="relative w-12 shrink-0">
        {hourMarks.map((m) => (
          <span
            key={m}
            className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-foreground/40"
            style={{ top: (m - rangeStart) * PX_PER_MIN }}
          >
            {minutesToLabel(m)}
          </span>
        ))}
      </div>

      {/* 본문: 왼쪽 46% = 수업, 오른쪽 48% = 할일 (같은 시간축 공유) */}
      <div className="relative flex-1 border-l border-foreground/10">
        {hourMarks.map((m) => (
          <div
            key={m}
            className="absolute left-0 w-full border-t border-foreground/[0.06]"
            style={{ top: (m - rangeStart) * PX_PER_MIN }}
          />
        ))}

        {showNowLine && (
          <div
            className="absolute left-0 z-20 flex w-full items-center gap-1.5"
            style={{ top: (nowMin - rangeStart) * PX_PER_MIN }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/70" />
            <span className="h-px flex-1 bg-foreground/40" />
          </div>
        )}

        {entries.map((entry) => {
          const top = (entry.startMin - rangeStart) * PX_PER_MIN;
          const isPast = (entry.endMin ?? entry.startMin) < nowMin;
          const isClass = entry.kind === "class";
          const laneStyle = isClass
            ? { left: "0%", width: "46%" }
            : { left: "52%", width: "48%" };
          const height =
            entry.endMin == null
              ? undefined
              : Math.max(
                  MIN_BLOCK_HEIGHT,
                  (entry.endMin - entry.startMin) * PX_PER_MIN
                );

          return (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              top={top}
              height={height}
              laneStyle={laneStyle}
              isPast={isPast}
              todayKey={todayKey}
              onRemove={onRemove}
              onToggleComplete={onToggleComplete}
              onPostpone={onPostpone}
              onUncancelClass={onUncancelClass}
            />
          );
        })}
      </div>
    </div>
  );
}
