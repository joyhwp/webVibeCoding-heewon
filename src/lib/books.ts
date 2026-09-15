// DEAR Time(독서) 기록 집계 레이어.
// schedule.ts에 날짜별로 흩어져 저장된 ScheduleItem 중 category === "dearTime"
// && book이 있는 항목들을 모아서, AddTaskForm의 "시작 페이지 자동완성"과
// study 탭의 Books 서브탭(책별 카드 + 히스토리)에서 쓴다.
// 별도의 저장 공간을 두지 않고 schedule.ts의 날짜별 데이터를 그때그때
// 다시 훑는 방식이라, 늘 최신 상태와 일치한다(동기화 문제 없음).
//
// "책 등록"(registerBook)은 그와 별개의 아주 작은 저장소다 — 아직 읽은
// 페이지를 한 번도 안 기록했어도 Books 탭에 빈 카드로 뜨게 하려는 용도.
// In Progress에서 DEAR Time 카테고리로 새 카드를 만들 때, 그리고 Home 탭
// Add Task로 DEAR Time 기록을 처음 남길 때 둘 다 여기에 등록해서, 두
// 진입점이 항상 같은 책 목록(getBookSummaries)을 공유하게 한다.

import {
  addItem,
  loadDay,
  updateItemBook,
  toDateKey,
  getIndexedDates,
  type BookProgress,
} from "@/lib/schedule";
import { readStore, writeStore } from "@/lib/storage";

export type BookLogEntry = {
  dateKey: string;
  createdAt: number;
  title: string;
  startPage: number;
  endPage?: number;
};

export type BookSummary = {
  title: string;
  /** 지금까지 읽은 총 페이지 — 가장 최근(날짜 기준, 동률이면 등록 순서) 기록의
   * 종료 페이지(없으면 시작 페이지). 독서 기록이 아직 없으면 0. */
  totalPages: number;
  /** 마지막으로 읽은 날짜 — 독서 기록이 하나도 없으면(등록만 된 책) undefined */
  lastReadDateKey?: string;
  /** 책이 등록된 시각 — 독서 기록이 없는 책들끼리의 정렬 기준 */
  registeredAt: number;
  history: BookLogEntry[]; // 최신순
};

export type RegisteredBook = { title: string; createdAt: number };

const REGISTRY_KEY = "registeredBooks:v1";
const REGISTRY_VERSION = 1;
const REGISTRY_MIGRATIONS: Array<(data: unknown) => unknown> = [(data) => data];

function loadRegistry(): RegisteredBook[] {
  return readStore<RegisteredBook[]>(
    REGISTRY_KEY,
    REGISTRY_VERSION,
    REGISTRY_MIGRATIONS,
    () => []
  );
}

function saveRegistry(list: RegisteredBook[]) {
  writeStore(REGISTRY_KEY, REGISTRY_VERSION, list);
}

/** 책을 "등록"한다 — 이미 등록돼 있으면(대소문자/공백 무시) 아무것도 안 한다.
 * 실제 독서 기록이 없어도 이 함수만 호출하면 Books 탭에 빈 카드로 뜬다. */
export function registerBook(title: string): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  const key = trimmed.toLowerCase();
  const registry = loadRegistry();
  if (registry.some((b) => b.title.trim().toLowerCase() === key)) return;
  saveRegistry([...registry, { title: trimmed, createdAt: Date.now() }]);
}

export function getRegisteredBooks(): RegisteredBook[] {
  return loadRegistry();
}

function isBrowser() {
  return typeof window !== "undefined";
}

/** 저장된 모든 날짜를 훑어 DEAR Time 독서 기록을 전부 모은다 (날짜 오름차순,
 * 같은 날이면 createdAt 오름차순은 보장 안 됨 — 정렬은 호출부에서). */
export function getAllBookLogs(): BookLogEntry[] {
  if (!isBrowser()) return [];
  const entries: BookLogEntry[] = [];
  for (const dateKey of getIndexedDates()) {
    for (const item of loadDay(dateKey)) {
      if (item.category !== "dearTime" || !item.book) continue;
      entries.push({
        dateKey,
        createdAt: item.createdAt,
        title: item.book.title,
        startPage: item.book.startPage,
        endPage: item.book.endPage,
      });
    }
  }
  return entries;
}

function compareRecency(a: BookLogEntry, b: BookLogEntry): number {
  // 날짜 내림차순, 같은 날이면 등록 시각 내림차순 (최신이 먼저)
  if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? 1 : -1;
  return b.createdAt - a.createdAt;
}

/** 이전에 한 번이라도 등록했거나 독서 기록을 남긴 책 제목 목록 (최근 읽은
 * 순, 그 다음 최근 등록 순). AddTaskForm/In Progress의 책 제목 자동완성
 * 목록으로 쓴다. */
export function getKnownBookTitles(): string[] {
  const logs = getAllBookLogs().sort(compareRecency);
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const log of logs) {
    const key = log.title.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    titles.push(key);
  }
  const registered = [...getRegisteredBooks()].sort((a, b) => b.createdAt - a.createdAt);
  for (const r of registered) {
    const key = r.title.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    titles.push(key);
  }
  return titles;
}

/** 주어진 책 제목으로 가장 최근에 등록된 기록의 종료 페이지를 반환한다
 * (없으면 시작 페이지, 기록 자체가 없으면 undefined). AddTaskForm이
 * "시작 페이지 = 이전 종료 페이지 + 1" 자동완성에 쓴다. 제목은
 * 대소문자/앞뒤 공백만 무시하고 정확히 일치해야 매칭된다. */
export function getLastPageForBook(title: string): number | undefined {
  const key = title.trim().toLowerCase();
  if (!key) return undefined;
  const matches = getAllBookLogs()
    .filter((log) => log.title.trim().toLowerCase() === key)
    .sort(compareRecency);
  const latest = matches[0];
  if (!latest) return undefined;
  return latest.endPage ?? latest.startPage;
}

function nowTimeLabel(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

/** In Progress 카드 수정 화면의 "현재까지 읽은 페이지"에서 쓴다. 오늘 날짜로
 * 이 책의 독서 기록을 만들거나(오늘치 기록이 아직 없으면 AddTaskForm과 같은
 * 방식으로 새로 생성) 갱신한다(오늘치 기록이 이미 있으면 그 기록의 종료
 * 페이지만 바꿔서 하루에 여러 번 고쳐도 항목이 늘어나지 않게 한다).
 * 시작 페이지는 (오늘 이전의) 가장 최근 기록 종료 페이지 + 1, 그런 기록이
 * 없으면 0 — AddTaskForm의 "이전 종료 페이지 + 1" 자동완성과 같은 규칙.
 * 이렇게 만든/고친 기록은 schedule.ts에 저장되므로 Books 탭도 곧바로
 * 같은 데이터를 보게 된다. */
export function recordBookProgress(title: string, currentPage: number): void {
  const trimmed = title.trim();
  if (!trimmed || !Number.isFinite(currentPage) || currentPage < 0) return;
  registerBook(trimmed);

  const key = trimmed.toLowerCase();
  const todayKey = toDateKey();

  const priorLatest = getAllBookLogs()
    .filter(
      (log) => log.title.trim().toLowerCase() === key && log.dateKey !== todayKey
    )
    .sort(compareRecency)[0];
  const startPage = priorLatest
    ? (priorLatest.endPage ?? priorLatest.startPage) + 1
    : 0;
  const book: BookProgress = {
    title: trimmed,
    startPage,
    endPage: Math.round(currentPage),
  };
  const task = formatBookTask(book);

  const todayItem = loadDay(todayKey).find(
    (item) =>
      item.category === "dearTime" &&
      item.book &&
      item.book.title.trim().toLowerCase() === key
  );

  if (todayItem) {
    updateItemBook(todayKey, todayItem.id, task, book);
  } else {
    addItem(todayKey, nowTimeLabel(), undefined, task, "dearTime", undefined, book);
  }
}

/** 책별로 묶은 요약 — study 탭 Books 서브탭의 카드 목록에 쓴다
 * (독서 기록이 있는 책은 마지막으로 읽은 날짜 최신순, 기록이 아직 없는
 * 등록만 된 책은 그 뒤에 등록 최신순으로 붙는다). */
export function getBookSummaries(): BookSummary[] {
  const logs = getAllBookLogs();
  // 대소문자/앞뒤 공백만 다른 제목은 같은 책으로 합친다 — In Progress에서
  // 등록한 표기와 Home 탭에서 기록할 때 표기가 살짝 달라도(예: 대소문자)
  // Books 탭에 카드가 둘로 갈라지지 않게. 표시용 제목은 실제 독서 기록의
  // 표기를 우선하고, 기록이 없으면 등록할 때 쓴 표기를 그대로 쓴다.
  const byKey = new Map<string, { title: string; logs: BookLogEntry[] }>();
  for (const log of logs) {
    const title = log.title.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    const entry = byKey.get(key) ?? { title, logs: [] };
    entry.logs.push(log);
    byKey.set(key, entry);
  }

  // 등록만 되고 기록이 없는 책도 포함해야 하므로, "책이 존재한다"고 볼 수
  // 있는 제목 전체(로그가 있거나, 등록돼 있거나)를 먼저 모은다.
  const registeredByKey = new Map<string, { title: string; createdAt: number }>();
  for (const r of getRegisteredBooks()) {
    const title = r.title.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (!registeredByKey.has(key)) registeredByKey.set(key, { title, createdAt: r.createdAt });
  }
  const allKeys = new Set<string>([...byKey.keys(), ...registeredByKey.keys()]);

  const summaries: BookSummary[] = [];
  for (const key of allKeys) {
    const logged = byKey.get(key);
    const sorted = logged ? [...logged.logs].sort(compareRecency) : [];
    const latest = sorted[0];
    summaries.push({
      title: logged?.title ?? registeredByKey.get(key)!.title,
      totalPages: latest ? (latest.endPage ?? latest.startPage) : 0,
      lastReadDateKey: latest?.dateKey,
      registeredAt: registeredByKey.get(key)?.createdAt ?? 0,
      history: sorted,
    });
  }

  return summaries.sort((a, b) => {
    if (a.lastReadDateKey && b.lastReadDateKey) {
      if (a.lastReadDateKey !== b.lastReadDateKey) {
        return a.lastReadDateKey < b.lastReadDateKey ? 1 : -1;
      }
    } else if (a.lastReadDateKey || b.lastReadDateKey) {
      // 기록이 있는 책이 없는 책보다 항상 먼저
      return a.lastReadDateKey ? -1 : 1;
    }
    return b.registeredAt - a.registeredAt;
  });
}

/** DEAR Time 항목의 표시용 제목 — "OO책 41~52쪽" (종료 페이지 없으면
 * "OO책 41쪽부터"). AddTaskForm이 저장 시 task 필드를 이 형태로 채운다. */
export function formatBookTask(book: BookProgress): string {
  return book.endPage != null
    ? `${book.title} ${book.startPage}~${book.endPage}쪽`
    : `${book.title} ${book.startPage}쪽부터`;
}
