// calendar 탭 월간 뷰에서 쓰는 순수 날짜 계산 유틸.
// "이 달의 날짜 칸들을 어떻게 채우는가" 같은 계산만 담당하고,
// localStorage 등 실제 일정 데이터는 전혀 건드리지 않는다.

import { toDateKey } from "@/lib/schedule";

export type CalendarDayCell = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getWeekdayLabels(): string[] {
  return WEEKDAY_LABELS;
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month, 1));
}

/**
 * year/month(0-based 월)의 월간 뷰를 6주(42칸) 그리드로 반환한다.
 * 항상 6주로 고정해서 달이 바뀔 때 그리드 높이가 들쭉날쭉하지 않게 한다.
 */
export function getMonthGrid(year: number, month: number): CalendarDayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun ... 6=Sat
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    });
  }
  return cells;
}

/** year/month에서 delta개월만큼 이동한 { year, month }를 계산 (연도 넘어감 처리 포함) */
export function addMonths(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}
