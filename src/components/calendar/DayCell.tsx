"use client";

import { useState, type MouseEvent } from "react";

type DayCellProps = {
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasClass: boolean;
  hasEvent: boolean;
  onSelect: (dateKey: string) => void;
};

type Ripple = { id: number; x: number; y: number };

let rippleSeq = 0;

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** 달력 날짜 칸 하나. 클릭하면 globals.css의 ripple-expand 애니메이션으로
 * 클릭 지점에서 퍼지는 리플을 잠깐 보여준다. */
export default function DayCell({
  dateKey,
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  hasClass,
  hasEvent,
  onSelect,
}: DayCellProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++rippleSeq;
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 500);
    onSelect(dateKey);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cx(
        "relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl text-sm transition-colors",
        isCurrentMonth ? "text-foreground" : "text-foreground/25",
        isSelected
          ? "bg-blue-600 text-white dark:bg-blue-500"
          : isToday
            ? "bg-blue-500/10 font-semibold text-blue-700 dark:text-blue-300"
            : "hover:bg-foreground/5"
      )}
    >
      <span className="tabular-nums">{day}</span>
      <span className="flex h-1.5 items-center gap-0.5">
        {hasClass && (
          <span
            className={cx(
              "h-1 w-1 rounded-full",
              isSelected ? "bg-white" : "bg-blue-500"
            )}
          />
        )}
        {hasEvent && (
          <span
            className={cx(
              "h-1 w-1 rounded-full",
              isSelected ? "bg-white/70" : "bg-foreground/40"
            )}
          />
        )}
      </span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-expand pointer-events-none absolute h-3 w-3 rounded-full bg-white/60"
          style={{ left: r.x - 6, top: r.y - 6 }}
        />
      ))}
    </button>
  );
}
