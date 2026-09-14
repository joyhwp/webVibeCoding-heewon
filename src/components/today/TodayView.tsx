"use client";

import { useMemo } from "react";
import GlassCard from "@/components/ui/GlassCard";
import MountFadeIn from "@/components/MountFadeIn";
import AllDayRow, { type AllDayEntryData } from "@/components/home/AllDayRow";
import TodayCard, { type TodayEntryData } from "@/components/today/TodayCard";
import CategoryIcon, {
  type CategoryIconKind,
} from "@/components/today/CategoryIcon";
import { useSchedule } from "@/hooks/useSchedule";
import { useHasMounted } from "@/hooks/useHasMounted";
import { getClassesForDay } from "@/lib/classSchedule";
import {
  CATEGORY_ACCENT,
  CATEGORY_STYLES,
  CLASS_ACCENT,
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/taskCategory";
import { toMinutes } from "@/lib/time";

function formatTodayDate(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);
}

export default function TodayView() {
  const hasMounted = useHasMounted();
  const { dateKey, items, now, toggleComplete, remove, move } = useSchedule();

  const todayClasses = useMemo(() => {
    if (!hasMounted) return [];
    const [y, m, d] = dateKey.split("-").map(Number);
    const dayOfWeek = new Date(y, m - 1, d).getDay();
    return getClassesForDay(dayOfWeek, dateKey);
  }, [hasMounted, dateKey]);

  const timedTasks = items.filter((t) => t.startTime);
  const allDayTasks = items.filter((t) => !t.startTime);

  // 카테고리별 오늘 통계 — DEAR Time만 총 소요 시간(분)을, 나머지는 건수를 센다
  const stats = useMemo(() => {
    const map = new Map<TaskCategory, { count: number; minutes: number }>();
    for (const t of items) {
      const cur = map.get(t.category) ?? { count: 0, minutes: 0 };
      cur.count += 1;
      if (t.category === "dearTime" && t.startTime && t.endTime) {
        cur.minutes += toMinutes(t.endTime) - toMinutes(t.startTime);
      }
      map.set(t.category, cur);
    }
    return TASK_CATEGORIES.filter((c) => map.has(c.value)).map((c) => ({
      ...c,
      ...map.get(c.value)!,
    }));
  }, [items]);

  const classEntries: TodayEntryData[] = todayClasses.map((c) => ({
    id: c.id,
    kind: "class",
    originDateKey: dateKey,
    iconKind: "class",
    accent: CLASS_ACCENT,
    startMin: toMinutes(c.startTime),
    endMin: toMinutes(c.endTime),
    title: c.subject,
    subtitle: [c.room, c.professor].filter(Boolean).join(" · "),
    cancelled: c.cancelled,
  }));

  const taskEntries: TodayEntryData[] = timedTasks.map((t) => ({
    id: t.id,
    kind: "task",
    originDateKey: t.originDateKey,
    iconKind: t.category as CategoryIconKind,
    accent: CATEGORY_ACCENT[t.category],
    startMin: toMinutes(t.startTime as string),
    endMin: t.endTime ? toMinutes(t.endTime) : null,
    title: t.book ? t.book.title : t.task,
    subtitle: t.book
      ? `${t.book.startPage}~${t.book.endPage ?? "…"}쪽`
      : undefined,
    completed: t.completed,
  }));

  const allEntries = [...classEntries, ...taskEntries].sort(
    (a, b) => a.startMin - b.startMin
  );

  const allDayEntries: AllDayEntryData[] = allDayTasks.map((t) => ({
    id: t.id,
    originDateKey: t.originDateKey,
    title: t.book ? `${t.book.title} ${t.book.startPage}~${t.book.endPage ?? "…"}쪽` : t.task,
    dotClass: CATEGORY_STYLES[t.category].dot,
    completed: t.completed,
  }));

  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (!hasMounted) return <div className="pt-4" />;

  return (
    <div className="pt-4">
      <MountFadeIn>
        <div className="mb-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Today
          </h1>
          <p className="mt-1 text-sm text-foreground/50">
            {formatTodayDate(now)}
          </p>
        </div>
      </MountFadeIn>

      <MountFadeIn delay={0.08}>
        <GlassCard className="mt-6 flex flex-wrap items-center gap-2.5">
          {stats.length === 0 ? (
            <p className="text-sm text-foreground/50">
              No categorized items yet today.
            </p>
          ) : (
            stats.map((stat) => (
              <span
                key={stat.value}
                className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: CATEGORY_ACCENT[stat.value].soft,
                  color: CATEGORY_ACCENT[stat.value].solid,
                }}
              >
                <CategoryIcon kind={stat.value} className="h-4 w-4" />
                {stat.label}
                <span className="tabular-nums opacity-80">
                  {stat.value === "dearTime" && stat.minutes > 0
                    ? `${stat.minutes}min`
                    : `× ${stat.count}`}
                </span>
              </span>
            ))
          )}
        </GlassCard>
      </MountFadeIn>

      {allDayEntries.length > 0 && (
        <MountFadeIn delay={0.14}>
          <GlassCard className="mt-6">
            <p className="mb-2 px-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground/40">
              All Day
            </p>
            <div className="flex flex-col gap-1">
              {allDayEntries.map((entry) => (
                <AllDayRow
                  key={entry.id}
                  entry={entry}
                  todayKey={dateKey}
                  onRemove={remove}
                  onToggleComplete={toggleComplete}
                  onPostpone={move}
                />
              ))}
            </div>
          </GlassCard>
        </MountFadeIn>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {allEntries.length === 0 ? (
          <GlassCard>
            <p className="text-sm text-foreground/50">
              Nothing on today&apos;s schedule yet.
            </p>
          </GlassCard>
        ) : (
          allEntries.map((entry, i) => (
            <MountFadeIn key={entry.id} delay={0.18 + i * 0.03}>
              <TodayCard
                entry={entry}
                isPast={(entry.endMin ?? entry.startMin) < nowMin}
                onToggleComplete={toggleComplete}
                onRemove={remove}
              />
            </MountFadeIn>
          ))
        )}
      </div>
    </div>
  );
}
