"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addItem,
  getCarryOverAllDayEvents,
  loadDay,
  moveItem,
  toggleComplete as toggleCompleteInStorage,
} from "@/lib/schedule";
import { moveTaskToTrash, restoreFromTrash } from "@/lib/trash";
import { showUndoToast } from "@/lib/toastBus";
import { useHasMounted } from "@/hooks/useHasMounted";
import type { TimelineTask } from "@/hooks/useSchedule";
import type { TaskCategory } from "@/lib/taskCategory";

/**
 * calendar 탭에서, 사용자가 고른 임의의 날짜(dateKey)의 일정을 다루는 훅.
 * home 탭의 useSchedule과 데이터 레이어(schedule.ts/trash.ts)는 그대로 공유하지만,
 * "오늘"이 아니라 선택된 날짜를 대상으로 하고 자정 롤오버를 추적하지 않는다는
 * 점이 달라 별도로 둔다.
 */
export function useCalendarDay(dateKey: string) {
  const hasMounted = useHasMounted();
  const [reloadTick, setReloadTick] = useState(0);
  const bump = useCallback(() => setReloadTick((v) => v + 1), []);

  const items = useMemo(
    (): TimelineTask[] => {
      if (!hasMounted) return [];
      const own = loadDay(dateKey).map((item) => ({
        ...item,
        originDateKey: dateKey,
      }));
      const carryOver = getCarryOverAllDayEvents(dateKey).map(
        ({ item, originDateKey }) => ({ ...item, originDateKey })
      );
      return [...own, ...carryOver];
    },
    // reloadTick은 함수 본문에서 쓰이진 않지만, add/remove/move/toggleComplete
    // 이후 localStorage를 강제로 다시 읽게 하려고 의도적으로 넣은 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMounted, dateKey, reloadTick]
  );

  const add = useCallback(
    (
      entryDateKey: string,
      startTime: string | undefined,
      endTime: string | undefined,
      task: string,
      category: TaskCategory
    ) => {
      addItem(entryDateKey, startTime, endTime, task, category);
      bump();
    },
    [bump]
  );

  const remove = useCallback(
    (id: string, originDateKey: string) => {
      const item = loadDay(originDateKey).find((i) => i.id === id);
      if (!item) return;
      const trashId = moveTaskToTrash(originDateKey, item);
      bump();
      showUndoToast(`"${item.task}" deleted`, () => {
        restoreFromTrash(trashId);
        bump();
      });
    },
    [bump]
  );

  const toggleComplete = useCallback(
    (id: string, originDateKey: string) => {
      toggleCompleteInStorage(originDateKey, id);
      bump();
    },
    [bump]
  );

  const move = useCallback(
    (
      id: string,
      originDateKey: string,
      toDateKey: string,
      newStartTime: string | undefined,
      newEndTime: string | undefined
    ) => {
      moveItem(originDateKey, id, toDateKey, newStartTime, newEndTime);
      bump();
    },
    [bump]
  );

  return { items, add, remove, toggleComplete, move, refresh: bump };
}
