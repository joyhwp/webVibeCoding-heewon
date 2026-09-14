"use client";

import ScrollReveal from "@/components/ScrollReveal";
import { minutesToLabel } from "@/lib/time";
import type { CategoryAccent } from "@/lib/taskCategory";
import CategoryIcon, { type CategoryIconKind } from "@/components/today/CategoryIcon";

export type TodayEntryData = {
  id: string;
  kind: "class" | "task";
  originDateKey: string;
  iconKind: CategoryIconKind;
  accent: CategoryAccent;
  startMin: number;
  endMin: number | null;
  title: string;
  /** 클래스의 방/교수, 혹은 DEAR Time의 "41~52쪽" 같은 보조 표시 */
  subtitle?: string;
  completed?: boolean;
  cancelled?: boolean;
};

type TodayCardProps = {
  entry: TodayEntryData;
  isPast: boolean;
  onToggleComplete?: (id: string, originDateKey: string) => void;
  onRemove?: (id: string, originDateKey: string) => void;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function TodayCard({
  entry,
  isPast,
  onToggleComplete,
  onRemove,
}: TodayCardProps) {
  const isTask = entry.kind === "task";
  const completed = Boolean(entry.completed);
  const dimmed = isPast || completed || Boolean(entry.cancelled);

  const timeLabel =
    entry.endMin == null
      ? minutesToLabel(entry.startMin)
      : `${minutesToLabel(entry.startMin)} – ${minutesToLabel(entry.endMin)}`;

  return (
    <ScrollReveal
      className={cx(
        "group relative flex items-start gap-4 rounded-2xl border p-5 transition-opacity sm:p-6",
        "glass-panel",
        dimmed && "opacity-55"
      )}
      style={{
        borderColor: entry.accent.solid,
        borderLeftWidth: 5,
        background: `linear-gradient(135deg, ${entry.accent.soft}, transparent 65%)`,
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: entry.accent.soft, color: entry.accent.solid }}
      >
        <CategoryIcon kind={entry.iconKind} className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p
            className={cx(
              "truncate text-base font-semibold leading-tight sm:text-lg",
              completed && "line-through"
            )}
          >
            {entry.title}
          </p>
          <span
            className="shrink-0 text-xs font-medium tabular-nums"
            style={{ color: entry.accent.solid }}
          >
            {timeLabel}
          </span>
        </div>

        {entry.subtitle && (
          <p className="mt-1 truncate text-sm text-foreground/60">
            {entry.subtitle}
          </p>
        )}

        {entry.cancelled && (
          <span className="mt-2 inline-block rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-medium text-foreground/50">
            휴강
          </span>
        )}
      </div>

      {isTask && (
        <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <input
            type="checkbox"
            checked={completed}
            onChange={() => onToggleComplete?.(entry.id, entry.originDateKey)}
            aria-label="Mark complete"
            className="h-4 w-4 cursor-pointer accent-blue-600"
          />
          <button
            type="button"
            onClick={() => onRemove?.(entry.id, entry.originDateKey)}
            aria-label="Delete"
            className="rounded-full px-1 text-xs leading-none text-foreground/50 hover:text-foreground/80"
          >
            ✕
          </button>
        </div>
      )}
    </ScrollReveal>
  );
}
