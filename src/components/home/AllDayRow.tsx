"use client";

import { useState } from "react";
import PostponePopover from "@/components/home/PostponePopover";

export type AllDayEntryData = {
  id: string;
  originDateKey: string;
  title: string;
  dotClass: string;
  completed?: boolean;
  /** 멀티데이 종일 일정일 때만: "Sep 11 – Sep 12" 같은 표시용 라벨 */
  rangeLabel?: string;
};

type AllDayRowProps = {
  entry: AllDayEntryData;
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
};

const CONTROL_BTN =
  "rounded-full px-1 text-[11px] leading-none text-foreground/50 hover:text-foreground/80";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function AllDayRow({
  entry,
  todayKey,
  onRemove,
  onToggleComplete,
  onPostpone,
}: AllDayRowProps) {
  const [postponeOpen, setPostponeOpen] = useState(false);
  const completed = Boolean(entry.completed);

  return (
    <div className="group relative flex items-center gap-2 rounded-lg px-1.5 py-1">
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggleComplete(entry.id, entry.originDateKey)}
        aria-label="Mark complete"
        className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-blue-600 opacity-40 transition-opacity group-hover:opacity-100"
      />
      <span className={`h-2 w-2 shrink-0 rounded-full ${entry.dotClass}`} />
      <span
        className={cx(
          "flex-1 truncate text-sm",
          completed ? "text-foreground/35 line-through" : "text-foreground"
        )}
      >
        {entry.title}
      </span>
      {entry.rangeLabel && (
        <span className="shrink-0 text-[11px] text-foreground/40">
          {entry.rangeLabel}
        </span>
      )}
      <div
        className={cx(
          "relative flex shrink-0 items-center gap-0.5 transition-opacity",
          postponeOpen ? "opacity-100" : "opacity-40 group-hover:opacity-100"
        )}
      >
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
          onClick={() => onRemove(entry.id, entry.originDateKey)}
          aria-label="Delete"
          className={CONTROL_BTN}
        >
          ✕
        </button>
        {postponeOpen && (
          <PostponePopover
            todayKey={todayKey}
            onSubmit={(date) => {
              onPostpone(entry.id, entry.originDateKey, date, undefined, undefined);
              setPostponeOpen(false);
            }}
            onClose={() => setPostponeOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
