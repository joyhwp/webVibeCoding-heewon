"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addProgressItem,
  completeItem,
  getActiveItems,
  getArchivedItems,
  removeProgressItem,
  restoreItem,
  setProgressPercent,
  type ProgressItem,
} from "@/lib/progress";
import type { TaskCategory } from "@/lib/taskCategory";
import { useHasMounted } from "@/hooks/useHasMounted";

/** home 탭 In Progress 위젯 + 아카이브 페이지가 공유하는 훅.
 * useSchedule과 같은 패턴: localStorage가 소스라 hasMounted 이전엔 빈 배열,
 * 쓰기 작업 후 reloadTick을 올려서 강제로 다시 읽는다. */
export function useProgress() {
  const hasMounted = useHasMounted();
  const [reloadTick, setReloadTick] = useState(0);
  const bump = useCallback(() => setReloadTick((v) => v + 1), []);

  const activeItems = useMemo(
    (): ProgressItem[] => (hasMounted ? getActiveItems() : []),
    // reloadTick은 본문에서 쓰이진 않지만, 쓰기 이후 localStorage를 강제로
    // 다시 읽게 하려고 의도적으로 넣은 의존성
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMounted, reloadTick]
  );

  const archivedItems = useMemo(
    (): ProgressItem[] => (hasMounted ? getArchivedItems() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMounted, reloadTick]
  );

  const add = useCallback(
    (title: string, percent: number, category: TaskCategory, bookTitle?: string) => {
      addProgressItem(title, percent, category, bookTitle);
      bump();
    },
    [bump]
  );

  const setPercent = useCallback(
    (id: string, percent: number) => {
      setProgressPercent(id, percent);
      bump();
    },
    [bump]
  );

  const complete = useCallback(
    (id: string) => {
      completeItem(id);
      bump();
    },
    [bump]
  );

  const restore = useCallback(
    (id: string) => {
      restoreItem(id);
      bump();
    },
    [bump]
  );

  const remove = useCallback(
    (id: string) => {
      removeProgressItem(id);
      bump();
    },
    [bump]
  );

  return {
    hasMounted,
    activeItems,
    archivedItems,
    add,
    setPercent,
    complete,
    restore,
    remove,
  };
}
