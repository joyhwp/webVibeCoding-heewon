"use client";

import { useCallback, useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import MonthGrid from "@/components/calendar/MonthGrid";
import DayDetailPanel from "@/components/calendar/DayDetailPanel";
import { useHasMounted } from "@/hooks/useHasMounted";
import { addMonths, getMonthGrid } from "@/lib/calendarMonth";
import { getDatesWithEvents, toDateKey } from "@/lib/schedule";
import { getClassesForDay } from "@/lib/classSchedule";

export default function CalendarPage() {
  const hasMounted = useHasMounted();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  // schedule.ts/classOverrides.ts가 DayDetailPanel 쪽에서 바뀔 때마다 올려서,
  // 아래 두 useMemo가 월간 뷰의 점 표시를 다시 계산하게 만드는 트리거
  const [dataVersion, setDataVersion] = useState(0);

  const handleDataChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  const cells = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const eventDates = useMemo(() => {
    if (!hasMounted) return new Set<string>();
    const first = cells[0].dateKey;
    const last = cells[cells.length - 1].dateKey;
    return getDatesWithEvents(first, last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted, cells, dataVersion]);

  const classDates = useMemo(() => {
    if (!hasMounted) return new Set<string>();
    const set = new Set<string>();
    for (const cell of cells) {
      if (getClassesForDay(cell.date.getDay(), cell.dateKey).length > 0) {
        set.add(cell.dateKey);
      }
    }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMounted, cells, dataVersion]);

  function goToMonth(delta: number) {
    const next = addMonths(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  }

  // localStorage 기반 콘텐츠는 마운트 전(서버 렌더링 포함)엔 아무것도 그리지 않아
  // 하이드레이션 불일치를 원천적으로 막는다. (home 탭과 같은 패턴)
  if (!hasMounted) {
    return <div className="pt-4" />;
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <GlassCard>
        <MonthGrid
          year={viewYear}
          month={viewMonth}
          todayKey={todayKey}
          selectedDateKey={selectedDateKey}
          eventDates={eventDates}
          classDates={classDates}
          onSelectDate={setSelectedDateKey}
          onPrevMonth={() => goToMonth(-1)}
          onNextMonth={() => goToMonth(1)}
          onToday={goToToday}
        />
      </GlassCard>

      <DayDetailPanel dateKey={selectedDateKey} onDataChanged={handleDataChanged} />
    </div>
  );
}
