"use client";

import { useState } from "react";

type PostponePopoverProps = {
  todayKey: string;
  startTime?: string; // 없으면 종일 일정 — 시간 필드를 숨긴다
  endTime?: string;
  onSubmit: (date: string, start: string | undefined, end: string | undefined) => void;
  onClose: () => void;
};

const fieldClass =
  "rounded-lg border-0 bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30";

export default function PostponePopover({
  todayKey,
  startTime,
  endTime,
  onSubmit,
  onClose,
}: PostponePopoverProps) {
  const isAllDay = startTime == null;
  const [date, setDate] = useState(todayKey);
  const [start, setStart] = useState(startTime ?? "");
  const [end, setEnd] = useState(endTime ?? "");

  return (
    <div className="glass-panel absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl p-3 text-left shadow-lg">
      <p className="mb-2 text-[11px] font-medium text-foreground/60">
        Postpone
      </p>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-foreground/50">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        {!isAllDay && (
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-[11px] text-foreground/50">
              Start
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[11px] text-foreground/50">
              End
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-2.5 py-1 text-[11px] text-foreground/50 hover:text-foreground/80"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSubmit(
              date,
              isAllDay ? undefined : start,
              isAllDay ? undefined : end || undefined
            )
          }
          className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-700"
        >
          Move
        </button>
      </div>
    </div>
  );
}
