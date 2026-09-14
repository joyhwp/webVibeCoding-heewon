"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import AddTaskForm from "@/components/home/AddTaskForm";
import DayEventRow, {
  type DayEventRowData,
} from "@/components/calendar/DayEventRow";
import { useCalendarDay } from "@/hooks/useCalendarDay";
import { getClassesForDay } from "@/lib/classSchedule";
import { uncancelClassForDate } from "@/lib/classOverrides";
import {
  findClassCancelTrashId,
  moveClassCancelToTrash,
  restoreFromTrash,
} from "@/lib/trash";
import { showUndoToast } from "@/lib/toastBus";
import { CATEGORY_STYLES, CLASS_DOT_STYLE } from "@/lib/taskCategory";

type DayDetailPanelProps = {
  dateKey: string;
  /** schedule.ts/classOverrides.ts가 바뀐 뒤, 월간 뷰의 점 표시를 다시 계산하게 함 */
  onDataChanged: () => void;
};

function formatFullDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

/** calendar 탭에서 선택된 날짜 하나의 상세 — 그날의 수업/할일 목록 + 추가 폼. */
export default function DayDetailPanel({
  dateKey,
  onDataChanged,
}: DayDetailPanelProps) {
  const { items, add, remove, toggleComplete, move } = useCalendarDay(dateKey);
  const [showAddForm, setShowAddForm] = useState(false);
  // classOverrides는 이 훅 밖(cancelClass)에서 바뀔 수 있어서, classes를 강제로
  // 다시 읽게 하는 별도의 트리거 (home 탭 HomePage의 classVersion과 같은 패턴)
  const [classVersion, setClassVersion] = useState(0);

  const classes = useMemo(() => {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    return getClassesForDay(dayOfWeek, dateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, classVersion]);

  function cancelClass(entry: DayEventRowData) {
    const trashId = moveClassCancelToTrash(
      dateKey,
      entry.id,
      entry.title,
      entry.startTime ?? "",
      entry.endTime ?? ""
    );
    setClassVersion((v) => v + 1);
    onDataChanged();
    showUndoToast(`"${entry.title}" cancelled`, () => {
      restoreFromTrash(trashId);
      setClassVersion((v) => v + 1);
      onDataChanged();
    });
  }

  // 휴강 표시된 수업을 클릭해 다시 정상 상태로 되돌린다. 아직 undo 토스트가
  // 떠 있는 상태라면 그 휴지통 항목을 그대로 복구하고, 아니라면 override만 직접 지운다.
  function restoreClass(entry: DayEventRowData) {
    const trashId = findClassCancelTrashId(dateKey, entry.id);
    if (trashId) {
      restoreFromTrash(trashId);
    } else {
      uncancelClassForDate(dateKey, entry.id);
    }
    setClassVersion((v) => v + 1);
    onDataChanged();
  }

  const classEntries: DayEventRowData[] = classes.map((c) => ({
    id: c.id,
    kind: "class",
    originDateKey: dateKey,
    startTime: c.startTime,
    endTime: c.endTime,
    title: c.subject,
    subtitle: [c.room, c.professor].filter(Boolean).join(" · "),
    dotClass: CLASS_DOT_STYLE,
    cancelled: c.cancelled,
  }));

  const taskEntries: DayEventRowData[] = items.map((t) => ({
    id: t.id,
    kind: "task",
    originDateKey: t.originDateKey,
    startTime: t.startTime,
    endTime: t.endTime,
    title: t.task,
    dotClass: CATEGORY_STYLES[t.category].dot,
    completed: t.completed,
    rangeLabel: t.allDayEndDateKey
      ? `${formatShortDate(t.originDateKey)} – ${formatShortDate(t.allDayEndDateKey)}`
      : undefined,
  }));

  const allEntries = [...classEntries, ...taskEntries].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return -1;
    if (!b.startTime) return 1;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">
          {formatFullDate(dateKey)}
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="shrink-0 rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/10"
        >
          {showAddForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-5 border-b border-foreground/10 pb-5">
          <AddTaskForm
            todayKey={dateKey}
            onAdd={(d, startTime, endTime, task, category) => {
              add(d, startTime, endTime, task, category);
              onDataChanged();
              setShowAddForm(false);
            }}
          />
        </div>
      )}

      {allEntries.length === 0 ? (
        <p className="text-sm text-foreground/50">No events on this day.</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {allEntries.map((entry) => (
            <DayEventRow
              key={`${entry.kind}-${entry.id}`}
              entry={entry}
              dateKey={dateKey}
              onToggleComplete={(id, originDateKey) => {
                toggleComplete(id, originDateKey);
              }}
              onRemoveTask={(id, originDateKey) => {
                remove(id, originDateKey);
                onDataChanged();
              }}
              onCancelClass={cancelClass}
              onRestoreClass={restoreClass}
              onPostpone={(id, originDateKey, toDateKey, newStartTime, newEndTime) => {
                move(id, originDateKey, toDateKey, newStartTime, newEndTime);
                onDataChanged();
              }}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
