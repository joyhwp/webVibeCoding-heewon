// home 탭 일정 데이터 레이어
// localStorage에 날짜별(schedule:YYYY-MM-DD)로 저장하고,
// 어떤 날짜에 데이터가 있는지는 별도 인덱스(schedule:index)로 관리한다.
// (calendar 탭에서 "일정 있는 날짜에 점 표시"할 때 인덱스를 그대로 재사용할 수 있음)

import type { TaskCategory } from "@/lib/taskCategory";

/** DEAR Time(독서) 항목이 들고 다니는 책/페이지 기록. category가
 * "dearTime"인 ScheduleItem에만 붙는다 — books.ts가 이걸 모아 책별 독서
 * 기록(Study > Books)을 만든다. */
export type BookProgress = {
  title: string;
  startPage: number;
  /** 읽는 중이라 아직 안 끝났으면 생략 가능 */
  endPage?: number;
};

export type ScheduleItem = {
  id: string;
  startTime?: string; // "HH:mm" (24h) — 없으면 종일(all-day) 일정
  endTime?: string; // "HH:mm" — startTime과 함께 있으면 그 길이만큼 블록, 없으면 점
  /** 종일 멀티데이 일정의 종료 날짜("YYYY-MM-DD"). 당일뿐이면 생략. startTime이 있을 땐 의미 없음 */
  allDayEndDateKey?: string;
  task: string;
  category: TaskCategory;
  completed: boolean;
  createdAt: number;
  /** category === "dearTime"일 때만 채워지는 책/페이지 기록 */
  book?: BookProgress;
};

const DAY_PREFIX = "schedule:";
const INDEX_KEY = "schedule:index";

/** Date를 로컬 타임존 기준 "YYYY-MM-DD" 키로 변환 */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function readIndex(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(dateKeys: string[]) {
  if (!isBrowser()) return;
  const unique = Array.from(new Set(dateKeys)).sort();
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(unique));
}

function addToIndex(dateKey: string) {
  const index = readIndex();
  if (!index.includes(dateKey)) writeIndex([...index, dateKey]);
}

function removeFromIndex(dateKey: string) {
  const index = readIndex();
  if (index.includes(dateKey)) {
    writeIndex(index.filter((k) => k !== dateKey));
  }
}

/** 전체 인덱스(일정이 하나라도 있는 날짜 목록) 조회 — calendar 탭용 */
export function getIndexedDates(): string[] {
  return readIndex();
}

export function loadDay(dateKey: string): ScheduleItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(DAY_PREFIX + dateKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDay(dateKey: string, items: ScheduleItem[]) {
  if (!isBrowser()) return;
  if (items.length === 0) {
    window.localStorage.removeItem(DAY_PREFIX + dateKey);
    removeFromIndex(dateKey);
    return;
  }
  window.localStorage.setItem(DAY_PREFIX + dateKey, JSON.stringify(items));
  addToIndex(dateKey);
}

function sortByTime(items: ScheduleItem[]): ScheduleItem[] {
  // 종일(startTime 없음) 항목이 먼저 오게 정렬 — 실제 화면 표시는 Timeline이
  // "종일" 섹션과 시간대 그리드로 따로 나눠서 하므로, 여기 정렬은 저장 순서용
  return [...items].sort((a, b) =>
    (a.startTime ?? "").localeCompare(b.startTime ?? "")
  );
}

export function addItem(
  dateKey: string,
  startTime: string | undefined,
  endTime: string | undefined,
  task: string,
  category: TaskCategory,
  allDayEndDateKey?: string,
  book?: BookProgress
): ScheduleItem[] {
  const current = loadDay(dateKey);
  const next = sortByTime([
    ...current,
    {
      id: crypto.randomUUID(),
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      allDayEndDateKey:
        !startTime && allDayEndDateKey && allDayEndDateKey > dateKey
          ? allDayEndDateKey
          : undefined,
      task,
      category,
      completed: false,
      createdAt: Date.now(),
      book,
    },
  ]);
  saveDay(dateKey, next);
  return next;
}

export function removeItem(dateKey: string, id: string): ScheduleItem[] {
  const next = loadDay(dateKey).filter((item) => item.id !== id);
  saveDay(dateKey, next);
  return next;
}

/** 완전한 ScheduleItem을 그대로 되살린다 (휴지통 복구용). 같은 id가 이미
 * 있으면 무시한다. */
export function restoreItem(
  dateKey: string,
  item: ScheduleItem
): ScheduleItem[] {
  const current = loadDay(dateKey);
  if (current.some((i) => i.id === item.id)) return current;
  const next = sortByTime([...current, item]);
  saveDay(dateKey, next);
  return next;
}

export function toggleComplete(dateKey: string, id: string): ScheduleItem[] {
  const next = loadDay(dateKey).map((item) =>
    item.id === id ? { ...item, completed: !item.completed } : item
  );
  saveDay(dateKey, next);
  return next;
}

/**
 * 할일을 다른 날짜 및/또는 다른 시간으로 옮긴다("미루기").
 * fromDateKey와 toDateKey가 같으면 같은 날 안에서 시간만 바뀐다.
 * 멀티데이 종일 일정을 옮기면 단순화를 위해 옮긴 날 하루짜리로 바뀐다.
 * 반환값은 두 날짜(같을 수도 있음) 각각의 갱신된 목록.
 */
export function moveItem(
  fromDateKey: string,
  id: string,
  toDateKey: string,
  newStartTime: string | undefined,
  newEndTime: string | undefined
): { fromItems: ScheduleItem[]; toItems: ScheduleItem[] } {
  const fromList = loadDay(fromDateKey);
  const target = fromList.find((item) => item.id === id);
  if (!target) {
    return { fromItems: fromList, toItems: loadDay(toDateKey) };
  }

  const movedItem: ScheduleItem = {
    ...target,
    startTime: newStartTime || undefined,
    endTime: newEndTime || undefined,
    allDayEndDateKey: newStartTime ? undefined : target.allDayEndDateKey,
  };

  if (fromDateKey === toDateKey) {
    const merged = sortByTime([
      ...fromList.filter((item) => item.id !== id),
      movedItem,
    ]);
    saveDay(fromDateKey, merged);
    return { fromItems: merged, toItems: merged };
  }

  const remainingFrom = fromList.filter((item) => item.id !== id);
  saveDay(fromDateKey, remainingFrom);
  const toItems = sortByTime([...loadDay(toDateKey), movedItem]);
  saveDay(toDateKey, toItems);
  return { fromItems: remainingFrom, toItems };
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDaysToKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/**
 * 주어진 범위(양끝 포함) 안에서, 그 날 화면에 표시될 일정(직접 저장됐거나
 * 종일 멀티데이로 걸쳐 있는 항목)이 있는 날짜의 집합을 계산한다.
 * calendar 탭 월간 뷰에서 "일정 있음" 점 표시에 사용.
 */
export function getDatesWithEvents(
  rangeStartKey: string,
  rangeEndKey: string
): Set<string> {
  const result = new Set<string>();
  for (const indexedDate of readIndex()) {
    const items = loadDay(indexedDate);
    for (const item of items) {
      const spanEnd = item.allDayEndDateKey ?? indexedDate;
      if (spanEnd < rangeStartKey || indexedDate > rangeEndKey) continue;
      const from = indexedDate > rangeStartKey ? indexedDate : rangeStartKey;
      const to = spanEnd < rangeEndKey ? spanEnd : rangeEndKey;
      for (let key = from; key <= to; key = addDaysToKey(key, 1)) {
        result.add(key);
      }
    }
  }
  return result;
}

/**
 * 다른 날짜에서 "시작"했지만 종일 멀티데이 범위가 dateKey까지 걸쳐 있는
 * 항목들을 찾아온다 (dateKey 당일에 시작한 항목은 loadDay(dateKey)가 이미
 * 포함하므로 여기선 제외). 각 항목이 실제로 저장된 날짜(originDateKey)도
 * 함께 반환한다 — 완료 체크/삭제/미루기 등은 그 날짜를 기준으로 해야 한다.
 */
export function getCarryOverAllDayEvents(
  dateKey: string
): { item: ScheduleItem; originDateKey: string }[] {
  const result: { item: ScheduleItem; originDateKey: string }[] = [];
  for (const indexedDate of readIndex()) {
    if (indexedDate >= dateKey) continue; // 오늘 시작 또는 미래 시작은 대상 아님
    const items = loadDay(indexedDate);
    for (const item of items) {
      if (
        item.allDayEndDateKey &&
        item.allDayEndDateKey >= dateKey &&
        indexedDate <= dateKey
      ) {
        result.push({ item, originDateKey: indexedDate });
      }
    }
  }
  return result;
}
