"use client";

import DayCell from "@/components/calendar/DayCell";
import {
  formatMonthLabel,
  getMonthGrid,
  getWeekdayLabels,
} from "@/lib/calendarMonth";

type MonthGridProps = {
  year: number;
  month: number;
  todayKey: string;
  selectedDateKey: string;
  /** 그 날짜에 (직접 저장됐거나 종일 멀티데이로 걸쳐 있는) 할일이 있는 날짜들 */
  eventDates: Set<string>;
  /** 그 날짜에 (휴강 처리되지 않은) 수업이 있는 날짜들 */
  classDates: Set<string>;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

const NAV_BTN =
  "flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground";

export default function MonthGrid({
  year,
  month,
  todayKey,
  selectedDateKey,
  eventDates,
  classDates,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthGridProps) {
  const cells = getMonthGrid(year, month);
  const weekdayLabels = getWeekdayLabels();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">
          {formatMonthLabel(year, month)}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToday}
            className="mr-1 rounded-full px-3 py-1 text-xs font-medium text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="Previous month"
            className={NAV_BTN}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="Next month"
            className={NAV_BTN}
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-foreground/40">
        {weekdayLabels.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => (
          <DayCell
            key={cell.dateKey}
            dateKey={cell.dateKey}
            day={cell.date.getDate()}
            isCurrentMonth={cell.isCurrentMonth}
            isToday={cell.dateKey === todayKey}
            isSelected={cell.dateKey === selectedDateKey}
            hasClass={classDates.has(cell.dateKey)}
            hasEvent={eventDates.has(cell.dateKey)}
            onSelect={onSelectDate}
          />
        ))}
      </div>
    </div>
  );
}
