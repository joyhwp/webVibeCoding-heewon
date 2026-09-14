"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addItem,
  getCarryOverAllDayEvents,
  loadDay,
  moveItem,
  toDateKey,
  toggleComplete as toggleCompleteInStorage,
  type BookProgress,
  type ScheduleItem,
} from "@/lib/schedule";
import { moveTaskToTrash, restoreFromTrash } from "@/lib/trash";
import { showUndoToast } from "@/lib/toastBus";
import type { TaskCategory } from "@/lib/taskCategory";
import { useHasMounted } from "@/hooks/useHasMounted";

const TICK_MS = 30_000; // 지난 시각 표시 갱신 + 자정 롤오버 감지 주기

/** Timeline에서 쓰는 항목 — 실제로 어느 날짜 버킷에 저장돼 있는지(originDateKey)를
 * 함께 들고 있어야, 다른 날짜에서 시작해 오늘까지 걸쳐 있는 종일 멀티데이
 * 일정을 완료 체크/삭제/미루기 할 때 올바른 버킷을 건드릴 수 있다. */
export type TimelineTask = ScheduleItem & { originDateKey: string };

/**
 * 오늘 날짜의 일정을 다루는 훅.
 * 자정이 지나면 dateKey가 바뀌면서 자동으로 새 날짜의 (빈) 목록을 로드한다.
 *
 * items는 localStorage에서 파생된 값이라 서버에는 존재하지 않는다.
 * hasMounted로 감싸 서버/최초 하이드레이션 시엔 항상 빈 배열을 반환하고,
 * 마운트된 뒤에만 실제 값을 읽어 hydration mismatch를 피한다.
 */
export function useSchedule() {
  const hasMounted = useHasMounted();
  const [dateKey, setDateKey] = useState(() => toDateKey());
  const [now, setNow] = useState(() => new Date());
  const [reloadTick, setReloadTick] = useState(0);
  const dateKeyRef = useRef(dateKey);

  useEffect(() => {
    dateKeyRef.current = dateKey;
  }, [dateKey]);

  // 주기적으로 실제 날짜/시각을 확인 → 자정이 지나면 dateKey를 갱신
  useEffect(() => {
    const tick = () => {
      const current = new Date();
      setNow(current);
      const currentKey = toDateKey(current);
      if (currentKey !== dateKeyRef.current) {
        dateKeyRef.current = currentKey;
        setDateKey(currentKey);
      }
    };

    const interval = window.setInterval(tick, TICK_MS);
    // 탭이 다시 포커스를 받을 때도 즉시 확인 (자정 무렵 백그라운드에 있던 경우 대비)
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const items = useMemo(
    (): TimelineTask[] => {
      if (!hasMounted) return [];
      const todays = loadDay(dateKey).map((item) => ({
        ...item,
        originDateKey: dateKey,
      }));
      const carryOver = getCarryOverAllDayEvents(dateKey).map(
        ({ item, originDateKey }) => ({ ...item, originDateKey })
      );
      return [...todays, ...carryOver];
    },
    // reloadTick은 함수 본문에서 쓰이진 않지만, add/remove/move/toggleComplete
    // 이후 localStorage를 강제로 다시 읽게 하려고 의도적으로 넣은 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMounted, dateKey, reloadTick]
  );

  const bump = useCallback(() => setReloadTick((v) => v + 1), []);

  // entryDateKey: 폼에서 선택한 날짜 — 오늘이 아닐 수도 있음(예약 입력).
  const add = useCallback(
    (
      entryDateKey: string,
      startTime: string,
      endTime: string | undefined,
      task: string,
      category: TaskCategory,
      book?: BookProgress
    ) => {
      addItem(entryDateKey, startTime, endTime, task, category, undefined, book);
      bump();
    },
    [bump]
  );

  // originDateKey: 항목이 실제로 저장된 날짜 버킷 (오늘 시작한 항목이면 오늘,
  // 다른 날 시작해 오늘까지 걸쳐 있는 종일 일정이면 그 시작일)
  // 완전히 지우는 대신 휴지통으로 옮기고, "되돌리기" 토스트를 띄운다.
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

  // 표시 중인 항목을 다른 날짜/시간으로 미룬다.
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

  // QuickAddBar처럼 schedule.ts를 훅을 거치지 않고 직접 호출하는 곳에서,
  // items를 강제로 다시 읽게 만들 때 사용
  const refresh = bump;

  return { dateKey, items, now, add, remove, toggleComplete, move, refresh };
}
